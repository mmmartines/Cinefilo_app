import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useAlert } from '../../../contexts/AlertContext';
import { supabase } from '../../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../services/database';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export function useRegisterForm() {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('31/01/1996');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [date, setDate] = useState(new Date(1996, 0, 31));
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setIsDatePickerVisible(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formatted = selectedDate.toLocaleDateString('pt-BR');
      setBirthdate(formatted);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      showAlert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      showAlert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await database.register(email, password, name, birthdate);
      if (error) {
         showAlert('Erro', error.message || 'Erro ao realizar o cadastro.');
      } else {
         showAlert('Sucesso', 'Verifique seu e-mail para confirmar a conta!');
         router.push('/login');
      }
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro ao realizar o cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      const redirectTo = Linking.createURL('/');
      
      if (Platform.OS === 'web') {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            scopes: 'profile email https://www.googleapis.com/auth/user.birthday.read',
          },
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          scopes: 'profile email https://www.googleapis.com/auth/user.birthday.read',
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (res.type === 'success') {
          const { url } = res;
          const hashMatch = url.match(/#access_token=([^&]+)/);
          const refreshMatch = url.match(/&refresh_token=([^&]+)/);
          const pTokenMatch = url.match(/&provider_token=([^&]+)/);
          
          if (hashMatch) {
             const access_token = hashMatch[1];
             const refresh_token = refreshMatch ? refreshMatch[1] : '';
             const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
             });
             
             if (sessionError) throw sessionError;
             
             const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
             const response = await fetch(`${apiUrl}/api/users`, {
               method: 'GET',
               headers: {
                 'Authorization': `Bearer ${sessionData.session?.access_token}`,
               }
             });
             
             if (response.ok) {
               const apiData = await response.json();
               await database.setCurrentUser({
                 id: sessionData.user?.id,
                 email: sessionData.user?.email,
                 name: sessionData.user?.user_metadata?.name || sessionData.user?.user_metadata?.full_name || '',
                 tag: apiData.data?.tag
               });
             }
             
             router.replace('/');
          }
        }
      }
    } catch (e: any) {
      showAlert('Erro', e.message || 'Falha no login social.');
    }
  };

  return {
    name,
    setName,
    birthdate,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    date,
    isDatePickerVisible,
    setIsDatePickerVisible,
    onChangeDate,
    handleRegister,
    handleSocialLogin,
  };
}
