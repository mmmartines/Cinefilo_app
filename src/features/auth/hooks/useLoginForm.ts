import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useAlert } from '../../../contexts/AlertContext';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export function useLoginForm() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Erro', 'Preencha todos os campos.');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        try {
          const response = await fetch(`${apiUrl}/api/users`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
            }
          });

          let tag = '';
          if (!response.ok) {
            console.error('Falha ao sincronizar com o backend:', await response.text());
          } else {
            const apiData = await response.json();
            tag = apiData.data?.tag || '';
          }

          await database.setCurrentUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || '',
            tag: tag
          });

          await database.syncCloudToLocal(data.user.id);

        } catch (err) {
          console.error('Erro de rede ao sincronizar:', err);
          await database.setCurrentUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || '',
            tag: ''
          });
        }
      }

      router.replace('/');
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro ao logar.');
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
          },
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (res.type === 'success') {
          const { url } = res;
          const hashMatch = url.match(/#access_token=([^&]+).*&refresh_token=([^&]+)/);

          if (hashMatch) {
            const access_token = hashMatch[1];
            const refresh_token = hashMatch[2];
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) throw sessionError;

            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
            try {
              const response = await fetch(`${apiUrl}/api/users`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${sessionData.session?.access_token}`,
                }
              });

              let tag = '';
              if (response.ok) {
                const apiData = await response.json();
                tag = apiData.data?.tag || '';
              }

              await database.setCurrentUser({
                id: sessionData.user?.id,
                email: sessionData.user?.email,
                name: sessionData.user?.user_metadata?.name || sessionData.user?.user_metadata?.full_name || '',
                tag: tag
              });

              await database.syncCloudToLocal(sessionData.user?.id || '');

            } catch (err) {
              await database.setCurrentUser({
                id: sessionData.user?.id,
                email: sessionData.user?.email,
                name: sessionData.user?.user_metadata?.name || sessionData.user?.user_metadata?.full_name || '',
                tag: ''
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
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLogin,
    handleSocialLogin,
  };
}
