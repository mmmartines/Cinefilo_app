import { useState, useEffect } from 'react';
import { database } from '../../../services/database';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useChatRoom(chatId: string) {
  const queryClient = useQueryClient();
  const [messageInputText, setMessageInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    database.getCurrentUser().then(setCurrentUser);
  }, []);

  const { data: chatMessages = [], isLoading } = useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const messages = await database.getMessages(chatId);
      return messages || [];
    },
    enabled: !!chatId,
    refetchInterval: 3000, // 3s polling for chat
  });

  const handleSendMessage = async () => {
    if (!messageInputText.trim() || !currentUser || !chatId) return;
    
    const textToSend = messageInputText.trim();
    setMessageInputText('');
    
    try {
      // Optimistic Update
      const optimisticMessage = {
        _id: 'temp_' + Date.now(),
        text: textToSend,
        sender_name: currentUser.name || 'Usuário',
        sender_avatar: currentUser.avatar_url,
        created_at: new Date().toISOString()
      };
      
      queryClient.setQueryData(['chatMessages', chatId], (old: any) => {
        if (!old) return [optimisticMessage];
        return [...old, optimisticMessage];
      });

      await database.sendMessage(chatId, textToSend, currentUser.name || 'Usuário', currentUser.avatar_url);
      queryClient.invalidateQueries({ queryKey: ['chatMessages', chatId] });
    } catch (e) {
      console.error(e);
    }
  };

  return {
    chatMessages,
    messageInputText,
    setMessageInputText,
    isLoading,
    currentUser,
    handleSendMessage,
  };
}
