import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { database } from '../../../services/database';

export function useChats() {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChatsList = async () => {
    setIsLoading(true);
    const userChats = await database.getChats();
    setChatRooms(userChats);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchChatsList();
    }, [])
  );

  return {
    chatRooms,
    isLoading,
  };
}
