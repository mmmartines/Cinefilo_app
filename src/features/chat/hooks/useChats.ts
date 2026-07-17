import { useState } from 'react';
import { database } from '../../../services/database';
import { useQuery } from '@tanstack/react-query';

export function useChats() {
  const { data: chatRooms = [], isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const userChats = await database.getChats();
      return userChats || [];
    },
    refetchInterval: 10000,
  });

  return {
    chatRooms,
    isLoading,
  };
}
