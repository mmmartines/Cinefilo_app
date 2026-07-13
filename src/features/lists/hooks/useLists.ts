import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { database } from '../../../services/database';
import { useAlert } from '../../../contexts/AlertContext';

export function useLists() {
  const { showAlert } = useAlert();
  const [customLists, setCustomLists] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  const fetchListsData = async () => {
    const user = await database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const userLists = await database.getCustomLists(user.id);
      setCustomLists(userLists);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchListsData();
    }, [])
  );

  const handleCreateNewList = async () => {
    if (!newListName.trim()) return;
    try {
      await database.createCustomList(currentUser.id, newListName.trim());
      setNewListName('');
      setIsCreatingList(false);
      fetchListsData();
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
  };
}
