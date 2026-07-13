import { useState, useEffect } from 'react';
import { database } from '../../../services/database';

export function useChatRoom(chatId: string) {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInputText, setMessageInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let unsubscribe: () => void;
    
    const loadChatData = async () => {
      const user = await database.getCurrentUser();
      setCurrentUser(user);
      
      const initialMessages = await database.getMessages(chatId);
      setChatMessages(initialMessages);
      setIsLoading(false);
      
      unsubscribe = database.subscribeToMessages(chatId, (newMessage) => {
        setChatMessages(prev => [...prev, newMessage]);
      });
    };
    
    if (chatId) {
      loadChatData();
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!messageInputText.trim() || !currentUser || !chatId) return;
    
    const textToSend = messageInputText.trim();
    setMessageInputText('');
    
    try {
      await database.sendMessage(chatId, textToSend, currentUser.name || 'Usuário', currentUser.avatar_url);
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
