import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { database } from '../services/database';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationBadgeContextData {
  unreadFeedCount: number;
  unreadChatsCount: number;
  unreadChatsMap: Record<string, boolean>;
  pendingFriendRequestsCount: number;
  chatReads: Record<string, string>; // chat_id -> last_read_at ISO string
  refetchBadges: () => Promise<void>;
  markChatAsRead: (chatId: string, readTime: string) => Promise<void>;
}

const NotificationBadgeContext = createContext<NotificationBadgeContextData>({} as NotificationBadgeContextData);

export function NotificationBadgeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    database.getCurrentUser().then(setCurrentUser);
  }, []);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';

  // 1. Feed Notifications
  const { data: feedData, refetch: refetchFeed } = useQuery({
    queryKey: ['badge_feed', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return 0;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 0;

      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) return 0;
      const json = await res.json();
      return (json.data || []).filter((n: any) => !n.read).length;
    },
    refetchInterval: 15000,
    enabled: !!currentUser
  });

  // 2. Friend Requests
  const { data: friendReqData, refetch: refetchFriends } = useQuery({
    queryKey: ['badge_friends', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return 0;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 0;

      const res = await fetch(`${API_URL}/api/friend_requests`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) return 0;
      const json = await res.json();
      return (json.data?.received || []).length;
    },
    refetchInterval: 15000,
    enabled: !!currentUser
  });

  // 3. Chat Reads & Messages
  // First, get the chat reads from API
  const { data: chatReadsData, refetch: refetchChatReads } = useQuery({
    queryKey: ['badge_chat_reads', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return {};
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return {};

      let localMap: Record<string, string> = {};
      try {
        const local = await AsyncStorage.getItem('@cinefilo_chat_reads');
        if (local) localMap = JSON.parse(local);
      } catch (e) {}

      let apiMap: Record<string, string> = {};
      try {
        const res = await fetch(`${API_URL}/api/notifications?type=chat_reads`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const json = await res.json();
          (json.data || []).forEach((item: any) => {
            apiMap[item.chat_id] = item.last_read_at;
          });
        }
      } catch(e) {}
      
      return { ...apiMap, ...localMap };
    },
    refetchInterval: 15000,
    enabled: !!currentUser
  });

  // Second, we need to know the latest message timestamp for each chat to compare.
  // We can fetch chat rooms and check their latest message locally or from supabase.
  const { data: chatsData = { count: 0, map: {} }, refetch: refetchChats } = useQuery({
    queryKey: ['badge_chats', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return { count: 0, map: {} };
      
      // Sempre pegar a versão mais recente do cache
      const currentChatReadsData = queryClient.getQueryData<Record<string, string>>(['badge_chat_reads', currentUser.id]) || {};

      const chats = await database.getChats();
      let totalUnreadChats = 0;
      const unreadMap: Record<string, boolean> = {};

      for (const chat of chats) {
        // Obter mensagens desse chat
        const messages = await database.getMessages(chat.id);
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const lastMessageTime = new Date(lastMessage.created_at).getTime();
          const lastReadTime = currentChatReadsData[chat.id] ? new Date(currentChatReadsData[chat.id]).getTime() : 0;
          
          if (lastMessageTime > lastReadTime && lastMessage.user_id !== currentUser.id) {
            totalUnreadChats += 1;
            unreadMap[chat.id] = true;
          }
        }
      }
      return { count: totalUnreadChats, map: unreadMap };
    },
    refetchInterval: 15000,
    enabled: !!currentUser
  });

  const markChatAsRead = async (chatId: string, readTime: string) => {
    try {
      const local = await AsyncStorage.getItem('@cinefilo_chat_reads');
      let map = local ? JSON.parse(local) : {};
      map[chatId] = readTime;
      await AsyncStorage.setItem('@cinefilo_chat_reads', JSON.stringify(map));
      
      queryClient.setQueryData(['badge_chat_reads', currentUser?.id], (old: any) => {
        return { ...(old || {}), [chatId]: readTime };
      });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(`${API_URL}/api/notifications?type=chat_reads`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ chat_id: chatId, last_read_at: readTime })
        });
      }
      await refetchBadges();
    } catch (e) {
      console.error(e);
    }
  };

  const refetchBadges = async () => {
    await Promise.all([
      refetchFeed(),
      refetchFriends(),
      refetchChatReads()
    ]);
    await refetchChats(); // Executa DEPOIS que chatReads já foi atualizado
  };

  return (
    <NotificationBadgeContext.Provider value={{
      unreadFeedCount: feedData || 0,
      unreadChatsCount: chatsData.count,
      unreadChatsMap: chatsData.map,
      pendingFriendRequestsCount: friendReqData || 0,
      chatReads: chatReadsData || {},
      refetchBadges,
      markChatAsRead
    }}>
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export const useNotificationBadges = () => useContext(NotificationBadgeContext);
