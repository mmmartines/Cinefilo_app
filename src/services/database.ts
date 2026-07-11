import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      if (index === -1) {
        throw new Error('Usuário não encontrado.');
      }

      // Preserva o email e mescla os novos dados
      users[index] = { ...users[index], ...updatedData };
      
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      await this.setCurrentUser(users[index]); // Atualiza a sessão
      return users[index];
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
      if (currentUser && currentUser.id === userId) {
        const currentTotal = currentUser.totalWatchedMinutes || 0;
        const newTotal = Math.max(0, currentTotal - (movieToRemove.runtime || 0));
        await this.updateUser({ 
          email: currentUser.email, 
          totalWatchedMinutes: newTotal 
        });
      }
    } catch (e) {
      console.error('Erro ao remover filme assistido', e);
      throw e;
    }
  },

  // -------------------------
  // Custom Lists
  // -------------------------
  async getCustomLists(userId: string) {
    try {
      const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      return listsJson ? JSON.parse(listsJson) : [];
    } catch (e) {
      console.error('Erro ao buscar listas customizadas', e);
      return [];
    }
  },

  async createCustomList(userId: string, listName: string) {
    try {
      const lists = await this.getCustomLists(userId);
      const newList = {
        id: new Date().getTime().toString(),
        name: listName,
        movies: []
      };
      lists.push(newList);
      await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(lists));
      return newList;
    } catch (e) {
      console.error('Erro ao criar lista', e);
      throw e;
    }
  },

  async addMovieToCustomList(userId: string, listId: string, movie: any) {
    try {
      const lists = await this.getCustomLists(userId);
      const listIndex = lists.findIndex((l: any) => l.id === listId);
      
      if (listIndex >= 0) {
        const list = lists[listIndex];
        // Evita duplicados
        if (!list.movies.some((m: any) => m.movieId === movie.id)) {
          list.movies.push({
            movieId: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            addedAt: new Date().toISOString()
          });
          await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(lists));
        }
      }
      return true;
    } catch (e) {
      console.error('Erro ao adicionar em lista', e);
      throw e;
    }
  },

  async removeCustomList(userId: string, listId: string) {
    try {
      const lists = await this.getCustomLists(userId);
      const newLists = lists.filter((l: any) => l.id !== listId);
      await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(newLists));
    } catch (e) {
      console.error('Erro ao remover lista', e);
      throw e;
    }
  },

  async removeMovieFromCustomList(userId: string, listId: string, movieId: number) {
    try {
      const lists = await this.getCustomLists(userId);
      const listIndex = lists.findIndex((l: any) => l.id === listId);
      if (listIndex >= 0) {
        lists[listIndex].movies = lists[listIndex].movies.filter((m: any) => m.movieId !== movieId);
        await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(lists));
      }
    } catch (e) {
      console.error('Erro ao remover filme da lista', e);
      throw e;
    }
  }
};
