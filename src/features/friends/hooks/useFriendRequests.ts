import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useFriendRequests() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const { data: requestData, isLoading, refetch: fetchFriendRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return { received: [], sent: [] };
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/friend_requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return {
          received: result.data?.received || [],
          sent: result.data?.sent || []
        };
      }
      return { received: [], sent: [] };
    },
    refetchInterval: 10000,
  });

  const receivedRequests = requestData?.received || [];
  const sentRequests = requestData?.sent || [];

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/friend_requests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ request_id: requestId, action })
      });
      
      if (response.ok) {
        // Invalida as queries de requests e friends
        queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
        queryClient.invalidateQueries({ queryKey: ['friends'] });
      } else {
        const res = await response.json();
        Alert.alert('Erro', res.error || 'Falha ao responder solicitao');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro na comunicao com o servidor.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/friend_requests`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ request_id: requestId })
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      } else {
        const res = await response.json();
        Alert.alert('Erro', res.error || 'Falha ao cancelar solicitao');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro na comunicao com o servidor.');
    }
  };

  return {
    isLoading,
    receivedRequests,
    sentRequests,
    activeTab,
    setActiveTab,
    handleRespondRequest,
    handleCancelRequest,
    fetchFriendRequests
  };
}
