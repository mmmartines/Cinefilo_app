import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { useAlert } from '../../../contexts/AlertContext';
import * as ImagePicker from 'expo-image-picker';
import { calculateBadges, Badge } from '../../../utils/badges';

export function useProfile() {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userBirthdate, setUserBirthdate] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [birthdateDate, setBirthdateDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = await database.getCurrentUser();
      if (currentUser) {
        setUserProfile(currentUser);
        setUserName(currentUser.name || '');
        setUserBirthdate(currentUser.birthdate || '');
        setUserPassword(currentUser.password || '');
        setUserAvatarUrl(currentUser.avatar_url || null);
        setIsNotificationsEnabled(currentUser.notifications_enabled ?? true);
        
        const totalMovies = currentUser.stats?.total_movies || 0;
        const totalMinutes = currentUser.stats?.total_minutes || 0;
        setUserBadges(calculateBadges(totalMovies, totalMinutes));
      }
    };
    fetchUserProfile();
  }, []);

  const handleChangeDate = (event: any, selectedDate?: Date) => {
    setIsDatePickerVisible(false);
    if (selectedDate) {
      setBirthdateDate(selectedDate);
      const formatted = selectedDate.toLocaleDateString('pt-BR');
      setUserBirthdate(formatted);
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleUploadAvatar(result.assets[0].uri);
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    setIsProfileLoading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${userProfile.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      setUserAvatarUrl(publicUrlData.publicUrl);
      await database.updateAvatar(publicUrlData.publicUrl);
      showAlert('Sucesso', 'Foto atualizada!');
    } catch (e: any) {
      console.error(e);
      showAlert('Erro', 'Não foi possível fazer upload da foto. Verifique se o bucket "avatars" foi criado e está público.');
    } finally {
      setIsProfileLoading(false);
    }
  };
  
  const handleToggleNotifications = async (value: boolean) => {
    setIsNotificationsEnabled(value);
    await database.updateNotificationPreferences(value);
  };

  const handleSaveProfile = async () => {
    setIsProfileLoading(true);
    try {
      await database.updateUser({
        email: userProfile.email,
        name: userName,
        birthdate: userBirthdate,
        password: userPassword
      });
      showAlert('Sucesso', 'Perfil atualizado!');
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro ao atualizar.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleDeleteUserAccount = async () => {
    if (deleteConfirmationText !== 'DELETAR') {
      showAlert('Erro', 'Você precisa digitar DELETAR exatamente como solicitado.');
      return;
    }

    setIsProfileLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        await fetch(`${apiUrl}/api/users`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      }
      await database.logout();
      setIsDeleteModalVisible(false);
      router.replace('/login');
    } catch (e: any) {
      showAlert('Erro', 'Não foi possível deletar a conta no momento.');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUserLogout = async () => {
    await database.logout();
  };

  return {
    userProfile,
    userName,
    setUserName,
    userBirthdate,
    userPassword,
    setUserPassword,
    isProfileLoading,
    isDeleteModalVisible,
    setIsDeleteModalVisible,
    deleteConfirmationText,
    setDeleteConfirmationText,
    userAvatarUrl,
    isNotificationsEnabled,
    birthdateDate,
    isDatePickerVisible,
    setIsDatePickerVisible,
    userBadges,
    handleChangeDate,
    handlePickImage,
    handleToggleNotifications,
    handleSaveProfile,
    handleDeleteUserAccount,
    handleUserLogout,
  };
}
