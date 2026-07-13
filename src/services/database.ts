import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const USERS_KEY = '@cinefilo_users';
const CURRENT_USER_KEY = '@cinefilo_current_user';

type AuthListener = (user: any) => void;
const authListeners: AuthListener[] = [];

export const database = {
  subscribeAuth(listener: AuthListener) {
    authListeners.push(listener);
    return () => {
      const index = authListeners.indexOf(listener);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
    };
  },

  notifyAuthListeners(user: any) {
    authListeners.forEach(listener => listener(user));
  },

  // Retorna todos os usuários cadastrados
  async getUsers() {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
      console.error('Erro ao ler usuários', e);
      return [];
    }
  },

  // Cadastra um novo usuário
  async registerUser(userData: any) {
    try {
      const users = await this.getUsers();
      
      // Verifica se já existe email
      if (users.find((u: any) => u.email === userData.email)) {
        throw new Error('E-mail já cadastrado.');
      }

      const newUser = { id: Date.now().toString(), ...userData };
      users.push(newUser);
      
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Já loga o usuário automaticamente ao cadastrar
      await this.setCurrentUser(newUser);
      return newUser;
    } catch (e) {
      console.error('Erro ao cadastrar', e);
      throw e;
    }
  },

  // Realiza Login
  async login(email: string, pass: string) {
    try {
      const users = await this.getUsers();
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        throw new Error('Usuário não encontrado. Por favor, faça seu cadastro.');
      }
      
      if (user.password !== pass) {
        throw new Error('Senha incorreta.');
      }

      await this.setCurrentUser(user);
      return user;
    } catch (e) {
      throw e;
    }
  },

  // Atualiza um usuário existente
  async updateUser(updatedData: any) {
    try {
      const users = await this.getUsers();
      const index = users.findIndex((u: any) => u.email === updatedData.email);
      
      if (index !== -1) {
        // Preserva o email e mescla os novos dados
        users[index] = { ...users[index], ...updatedData };
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      // Sempre atualiza a sessão atual se for o usuário logado
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.email === updatedData.email) {
        const newCurrentUser = { ...currentUser, ...updatedData };
        await this.setCurrentUser(newCurrentUser);
        return newCurrentUser;
      }
      
      if (index !== -1) return users[index];
      return null;
    } catch (e) {
      console.error('Erro ao atualizar usuário', e);
      throw e;
    }
  },

  // Login Social Simulado (Mock)
  async socialLoginMock(provider: string) {
    const mockUser = {
      id: `social_${Date.now()}`,
      name: `Usuário via ${provider}`,
      email: `user@${provider.toLowerCase()}.com`,
      provider
    };
    await this.setCurrentUser(mockUser);
    return mockUser;
  },

  // Salva a sessão atual
  async setCurrentUser(user: any) {
    try {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      this.notifyAuthListeners(user);
    } catch (e) {
      console.error('Erro ao salvar sessão', e);
    }
  },

  // Retorna o usuário logado atualmente (usado para verificar se pula o login)
  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  },

  // Desloga
  async logout() {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      this.notifyAuthListeners(null);
    } catch (e) {
      console.error('Erro ao deslogar', e);
    }
  },

  // --- FILMES ASSISTIDOS ---

  async getWatchedMovies(userId: string) {
    try {
      const watchedJson = await AsyncStorage.getItem(`@cinefilo_watched_${userId}`);
      return watchedJson ? JSON.parse(watchedJson) : [];
    } catch (e) {
      console.error('Erro ao ler filmes assistidos', e);
      return [];
    }
  },

  async syncStatsToCloud(userId: string, retries = 3) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const watched = await this.getWatchedMovies(userId);
      const watchedOnly = watched.filter((m: any) => m.status === 'watched');
      const total_movies = watchedOnly.length;
      
      const currentUser = await this.getCurrentUser();
      const total_minutes = currentUser?.totalWatchedMinutes || 0;

      const custom_lists = await this.getCustomLists(userId);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ total_movies, total_minutes, watched_movies: watched, custom_lists })
      });
      
      if (!response.ok) {
        throw new Error(`Erro API: ${response.status}`);
      }
    } catch (e) {
      console.error(`Erro ao sincronizar stats (Restam ${retries} tentativas):`, e);
      if (retries > 0) {
        setTimeout(() => {
          this.syncStatsToCloud(userId, retries - 1);
        }, 5000); // Retenta em 5 segundos
      }
    }
  },

  async syncCloudToLocal(userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const { data } = await response.json();
        
        // Substitui os dados locais com os dados da nuvem
        if (data.watched_movies) {
          await AsyncStorage.setItem(`@cinefilo_watched_${userId}`, JSON.stringify(data.watched_movies));
        }

        // Atualiza minutos totais
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const cloudMinutes = data.stats?.total_minutes || 0;
          await this.updateUser({ 
            email: currentUser.email, 
            totalWatchedMinutes: cloudMinutes 
          });
        }
      }
    } catch (e) {
      console.error('Erro ao sincronizar nuvem para o local', e);
    }
  },

  async saveWatchedMovie(userId: string, movie: any, rating: number, review: string, runtime: number, emotions: string[] = [], status: 'watched' | 'watchlist' = 'watched') {
    try {
      const watched = await this.getWatchedMovies(userId);
      
      const movieData = {
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        rating,
        review,
        runtime: runtime || 0,
        genres: movie.genres || [],
        emotions,
        status,
        addedAt: new Date().toISOString()
      };

      const existingIndex = watched.findIndex((m: any) => m.movieId === movie.id);
      
      if (existingIndex >= 0) {
        // Atualiza mantendo dados antigos que não vieram
        watched[existingIndex] = { ...watched[existingIndex], ...movieData };
      } else {
        watched.push(movieData);
        
        // Atualiza o total de minutos do usuário (apenas se for novo)
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId && status === 'watched') {
          const currentTotal = currentUser.totalWatchedMinutes || 0;
          await this.updateUser({ 
            email: currentUser.email, 
            totalWatchedMinutes: currentTotal + (runtime || 0) 
          });
        }
      }

      await AsyncStorage.setItem(`@cinefilo_watched_${userId}`, JSON.stringify(watched));
      
      // Sincroniza estatísticas na nuvem em background
      if (status === 'watched') {
        this.syncStatsToCloud(userId);
      }
      
      return movieData;
    } catch (e) {
      console.error('Erro ao salvar filme assistido', e);
      throw e;
    }
  },

  async removeWatchedMovie(userId: string, movieId: number) {
    try {
      const watched = await this.getWatchedMovies(userId);
      const movieToRemove = watched.find((w: any) => w.movieId === movieId);
      
      if (!movieToRemove) return;

      const newWatched = watched.filter((w: any) => w.movieId !== movieId);
      await AsyncStorage.setItem(`@cinefilo_watched_${userId}`, JSON.stringify(newWatched));

      // Subtrai do total de minutos do usuário
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id === userId && movieToRemove.status === 'watched') {
        const currentTotal = currentUser.totalWatchedMinutes || 0;
        const newTotal = Math.max(0, currentTotal - (movieToRemove.runtime || 0));
        await this.updateUser({ 
          email: currentUser.email, 
          totalWatchedMinutes: newTotal 
        });
      }
      
      if (movieToRemove.status === 'watched') {
        this.syncStatsToCloud(userId);
      }
    } catch (e) {
      console.error('Erro ao remover filme assistido', e);
      throw e;
    }
  },

  // -------------------------
  // Custom Lists (Agora Multiplayer e Salvas na Nuvem)
  // -------------------------
  async getCustomLists(userId: string) {
    try {
      // 1. Tenta pegar o cache offline rápido
      const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      let localLists = listsJson ? JSON.parse(listsJson) : [];

      // 2. Tenta pegar a versão atualizada da nuvem
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        const response = await fetch(`${apiUrl}/api/lists`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const result = await response.json();
          localLists = result.data || [];
          // Atualiza o cache
          await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(localLists));
        }
      }
      
      return localLists;
    } catch (e) {
      console.error('Erro ao buscar listas customizadas', e);
      // Fallback para cache se estiver offline
      const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      return listsJson ? JSON.parse(listsJson) : [];
    }
  },

  async createCustomList(userId: string, listName: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/lists`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ name: listName })
      });

      if (!response.ok) throw new Error('Falha ao criar lista na nuvem');
      
      // Força a atualização do cache
      await this.getCustomLists(userId);
      return true;
    } catch (e) {
      console.error('Erro ao criar lista', e);
      throw e;
    }
  },

  async addMovieToCustomList(userId: string, listId: string, movie: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/list_movies`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ 
          list_id: listId, 
          movie: {
             movieId: movie.id,
             title: movie.title,
             poster_path: movie.poster_path,
             backdrop_path: movie.backdrop_path
          } 
        })
      });

      if (!response.ok) throw new Error('Falha ao adicionar filme');
      
      await this.getCustomLists(userId); // refresh cache
      return true;
    } catch (e) {
      console.error('Erro ao adicionar em lista', e);
      throw e;
    }
  },

  async removeMovieFromCustomList(userId: string, listId: string, movieId: number) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/list_movies`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ list_id: listId, movie: { movieId } })
      });

      if (!response.ok) throw new Error('Falha ao remover filme');
      
      await this.getCustomLists(userId); // refresh cache
      return true;
    } catch (e) {
      console.error('Erro ao remover filme da lista', e);
      throw e;
    }
  },
  
  async shareCustomList(userId: string, listId: string, friendTag: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/list_share`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ list_id: listId, friend_tag: friendTag })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao compartilhar lista');
      
      return true;
    } catch (e: any) {
      console.error('Erro ao compartilhar lista', e);
      throw e;
    }
  },
  
  // -------------------------
  // Bate-Papo de Filmes (Realtime Supabase)
  // -------------------------
  async createChatGroup(movieId: number, movieTitle: string, moviePoster: string, friends: {id: string, name: string}[], userName: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');
      const userId = session.user.id;

      // 1. Cria a sala
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert([{ movie_id: movieId, movie_title: movieTitle, movie_poster: moviePoster, created_by: userId }])
        .select()
        .single();
        
      if (chatError) throw chatError;

      // 2. Prepara membros (Criador + Amigos)
      const members = [
        { chat_id: chatData.id, user_id: userId, user_name: userName },
        ...friends.map(f => ({ chat_id: chatData.id, user_id: f.id, user_name: f.name }))
      ];

      const { error: membersError } = await supabase
        .from('chat_members')
        .insert(members);
        
      if (membersError) throw membersError;
      
      return chatData;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  async getChats() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      
      // Pega todos os chats onde o usuário é membro
      const { data, error } = await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chats (
            id,
            movie_id,
            movie_title,
            movie_poster,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('joined_at', { ascending: false });
        
      if (error) throw error;
      
      return data.map(d => d.chats);
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  
  async getMessages(chatId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  
  async sendMessage(chatId: string, content: string, userName: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');
      
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          user_id: session.user.id,
          user_name: userName,
          content: content
        }]);
        
      if (error) throw error;
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  subscribeToMessages(chatId: string, callback: (message: any) => void) {
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => callback(payload.new)
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
