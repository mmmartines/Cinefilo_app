import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { cache } from '../../../services/cache';
import { useAlert } from '../../../contexts/AlertContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useFriends() {
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();
  const [friendTag, setFriendTag] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    database.getCurrentUser().then(user => {
      setCurrentUser(user);
      if (user) {
        // Força sincronização ao entrar no Ranking para atualizar XP/Level
        database.syncStatsToCloud(user.id).catch(console.error);
      }
    });
    NetInfo.fetch().then(state => setIsOffline(!state.isConnected));
  }, []);

  const { data: friendsList = [], isLoading, refetch: fetchFriendsList } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        setIsOffline(true);
        const cached = await cache.get('friends');
        return cached || [];
      }
      setIsOffline(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/friends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      const fetchedFriends = result.data || [];
      cache.set('friends', fetchedFriends);
      return fetchedFriends;
    },
    refetchInterval: 10000, // 10s smart polling
  });

  const handleSendFriendRequest = async () => {
    if (friendTag.trim().length !== 10) {
      showAlert('Ops', 'A Tag deve conter exatamente 10 caracteres.');
      return;
    }

    setIsAddingFriend(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/friend_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tag: friendTag.trim() })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao enviar solicitação');
      }

      showAlert('Sucesso', result.message || `Solicitação enviada com sucesso!`);
      setFriendTag('');
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    } catch (e: any) {
      showAlert('Erro', e.message);
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    showAlert(
      'Remover Amigo',
      `Tem certeza que deseja remover ${friendName} do seu ranking?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;
        
              const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
              const response = await fetch(`${apiUrl}/api/friends`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ friend_id: friendId })
              });
              
              if (!response.ok) throw new Error('Falha ao remover amigo');
              
              queryClient.invalidateQueries({ queryKey: ['friends'] });
            } catch (e: any) {
              showAlert('Erro', e.message);
            }
          }
        }
      ]
    );
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes) return '0h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  return {
    friendTag,
    setFriendTag,
    friendsList,
    isLoading,
    isAddingFriend,
    currentUser,
    isOffline,
    handleSendFriendRequest,
    handleRemoveFriend,
    formatRuntime,
    fetchFriendsList
  };
}
