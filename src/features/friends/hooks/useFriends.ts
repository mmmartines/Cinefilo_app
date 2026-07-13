import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { cache } from '../../../services/cache';
import { useAlert } from '../../../contexts/AlertContext';

export function useFriends() {
  const { showAlert } = useAlert();
  const [friendTag, setFriendTag] = useState('');
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchFriendsList = async () => {
    try {
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        setIsOffline(true);
        const cached = await cache.get('friends');
        if (cached) setFriendsList(cached);
        return;
      }

      setIsOffline(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/friends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Falha ao buscar ranking');
      
      const result = await response.json();
      const fetchedFriends = result.data || [];
      setFriendsList(fetchedFriends);
      cache.set('friends', fetchedFriends);
    } catch (e: any) {
      console.error(e);
      setIsOffline(true);
      const cached = await cache.get('friends');
      if (cached) setFriendsList(cached);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriendsList();
      database.getCurrentUser().then(setCurrentUser);
    }, [])
  );

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
              
              fetchFriendsList();
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
  };
}
