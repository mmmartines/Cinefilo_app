import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], refetch: fetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/notifications`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      const result = await response.json();
      if (response.ok) {
        return result.data || [];
      }
      return [];
    },
    refetchInterval: 10000, // 10 seconds smart polling
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAsRead = async (notificationId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Otimista
      queryClient.setQueryData(['notifications'], (oldData: any[]) => {
        if (!oldData) return [];
        if (notificationId) {
           return oldData.map(n => n._id === notificationId ? { ...n, read: true } : n);
        } else {
           return oldData.map(n => ({ ...n, read: true }));
        }
      });

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      await fetch(`${apiUrl}/api/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(notificationId ? { notification_id: notificationId } : {})
      });
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e) {
      console.error(e);
    }
  };

  return { notifications, unreadCount, fetchNotifications, markAsRead };
}
