import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { useAlert } from '../../../contexts/AlertContext';
import * as ImagePicker from 'expo-image-picker';

export function useProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userProvider, setUserProvider] = useState<string>('email');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = await database.getCurrentUser();
      if (currentUser) {
        setUserProfile(currentUser);
        setUserName(currentUser.name || '');
        setUserAvatarUrl(currentUser.avatar_url || null);
        setUserProvider(currentUser.provider || 'email');
        setIsNotificationsEnabled(currentUser.notifications_enabled ?? true);
      }
    };
    fetchUserProfile();
  }, []);



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
    let finalUrl = uri; // Default to local URI as fallback
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userProfile?.id || 'local'}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob);

      if (!error) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        finalUrl = publicUrlData.publicUrl;
      } else {
        console.warn('Supabase upload failed, using local URI:', error);
      }
    } catch (e: any) {
      console.warn('Fallback to local URI due to error:', e);
    } finally {
      setUserAvatarUrl(finalUrl);
      await database.updateAvatar(finalUrl);
      showAlert('Sucesso', 'Foto atualizada!');
      setIsProfileLoading(false);
    }
  };
  
  const handleToggleNotifications = async (value: boolean) => {
    setIsNotificationsEnabled(value);
    await database.updateNotificationPreferences(value);
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    setIsProfileLoading(true);

    try {
      // Se tiver nova senha, precisamos validar tudo
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          showAlert('Atenção', 'A nova senha e a confirmação não coincidem.');
          setIsProfileLoading(false);
          return;
        }
        if (!userPassword) {
          showAlert('Atenção', 'Digite sua senha atual para definir uma nova.');
          setIsProfileLoading(false);
          return;
        }

        // Tentar reautenticar para validar a senha atual (forma de validação no Supabase sem admin)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userProfile.email,
          password: userPassword
        });

        if (signInError) {
          showAlert('Erro', 'A senha atual está incorreta.');
          setIsProfileLoading(false);
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) throw updateError;
        
        setUserPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      await database.setCurrentUser({
        id: userProfile.id,
        email: userProfile.email,
        name: userName,
        tag: userProfile.tag,
        avatar_url: userAvatarUrl || '',
        provider: userProvider
      });

      showAlert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (e: any) {
      showAlert('Erro', e.message || 'Falha ao salvar perfil.');
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
    queryClient.clear();
    router.replace('/login');
  };

  return {
    userProfile,
    userName,
    setUserName,
    userPassword,
    setUserPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isProfileLoading,
    isDeleteModalVisible,
    setIsDeleteModalVisible,
    deleteConfirmationText,
    setDeleteConfirmationText,
    userAvatarUrl,
    isNotificationsEnabled,
    handlePickImage,
    handleToggleNotifications,
    handleSaveProfile,
    handleDeleteUserAccount,
    handleUserLogout,
    userProvider,
  };
}
