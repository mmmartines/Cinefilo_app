import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/notifications`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      const result = await response.json();
      if (response.ok) {
        setNotifications(result.data || []);
        setUnreadCount((result.data || []).filter((n: any) => !n.read).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const markAsRead = async (notificationId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Otimista
      if (notificationId) {
         setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
         setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
         setNotifications(prev => prev.map(n => ({ ...n, read: true })));
         setUnreadCount(0);
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      await fetch(`${apiUrl}/api/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(notificationId ? { notification_id: notificationId } : {})
      });
    } catch (e) {
      console.error(e);
    }
  };

  return { notifications, unreadCount, fetchNotifications, markAsRead };
}
