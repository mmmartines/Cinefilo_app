import { useState, useEffect } from 'react';
import { database } from '../../../services/database';
import { useAlert } from '../../../contexts/AlertContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useLists() {
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    database.getCurrentUser().then(setCurrentUser);
  }, []);

  const { data: customLists = [], refetch: fetchListsData } = useQuery({
    queryKey: ['lists', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const userLists = await database.getCustomLists(currentUser.id);
      return userLists || [];
    },
    enabled: !!currentUser,
    refetchInterval: 10000,
  });

  const handleCreateNewList = async () => {
    if (!newListName.trim() || !currentUser) return;
    try {
      await database.createCustomList(currentUser.id, newListName.trim());
      setNewListName('');
      setIsCreatingList(false);
      queryClient.invalidateQueries({ queryKey: ['lists', currentUser.id] });
    } catch (e) {
      showAlert('Erro', 'Não foi possível criar a lista');
    }
  };

  return {
    customLists,
    currentUser,
    newListName,
    setNewListName,
    isCreatingList,
    setIsCreatingList,
    handleCreateNewList,
    fetchListsData
  };
}
