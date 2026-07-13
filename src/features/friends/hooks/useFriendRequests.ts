import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function useFriendRequests() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const fetchFriendRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/friend_requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setReceivedRequests(result.data?.received || []);
        setSentRequests(result.data?.sent || []);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline' | 'cancel') => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      
      const method = action === 'accept' ? 'PUT' : 'DELETE';
      
      const response = await fetch(`${apiUrl}/api/friend_requests`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ request_id: requestId })
      });
      
      const result = await response.json();
      if (response.ok) {
        await fetchFriendRequests();
        Alert.alert("Sucesso", result.message);
      } else {
        Alert.alert("Erro", result.error || 'Ocorreu um erro.');
        setIsLoading(false);
      }
    } catch (e) {
      Alert.alert("Erro", "Falha de conexão.");
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    receivedRequests,
    sentRequests,
    activeTab,
    setActiveTab,
    handleRequestAction,
  };
}
