import { useState } from 'react';
import { supabase } from '../../../../src/services/supabase';
import { database } from '../../../../src/services/database';
import { useAlert } from '../../../../src/contexts/AlertContext';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export function useRegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleRegister = async () => {
    if (!email || !password || !name) {
      showAlert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      if (data?.session?.user) {
        let tag = '';
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        try {
          const response = await fetch(`${apiUrl}/api/users`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
            }
          });
          if (response.ok) {
            const apiData = await response.json();
            tag = apiData.data?.tag || '';
          }
        } catch(e) {}

        await database.setCurrentUser({
          id: data.session.user.id,
          email: data.session.user.email,
          name: name,
          tag: tag,
          provider: 'email'
        });
      } else {
        showAlert('Sucesso', 'Conta criada! Confirme seu email antes de fazer login.');
      }
    } catch (e: any) {
      if (e.message?.includes('already registered') || e.status === 422 || e.message?.toLowerCase().includes('already exists')) {
        showAlert('Atenção', 'Este email já está em uso.');
      } else {
        showAlert('Erro', e.message || 'Falha ao criar conta.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      const redirectTo = Linking.createURL('/');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          scopes: 'profile email',
          queryParams: { prompt: 'consent', access_type: 'offline' },
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (res.type === 'success') {
          const { url } = res;
          const hashMatch = url.match(/#access_token=([^&]+)/);
          const refreshMatch = url.match(/&refresh_token=([^&]+)/);

          if (hashMatch) {
            const access_token = hashMatch[1];
            const refresh_token = refreshMatch ? refreshMatch[1] : '';
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
              let dbAvatar = '';
              if (response.ok) {
                const apiData = await response.json();
                tag = apiData.data?.tag || '';
                dbAvatar = apiData.data?.avatar_url || '';
              }
              
              const googleAvatar = sessionData.user?.user_metadata?.avatar_url || sessionData.user?.user_metadata?.picture || '';
              
              if (googleAvatar && !dbAvatar) {
                try {
                  await fetch(`${apiUrl}/api/users`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${sessionData.session?.access_token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ avatar_url: googleAvatar })
                  });
                } catch(e) {}
              }

              await database.setCurrentUser({
                id: sessionData.user?.id,
                email: sessionData.user?.email,
                name: sessionData.user?.user_metadata?.name || sessionData.user?.user_metadata?.full_name || '',
                tag: tag,
                avatar_url: googleAvatar || dbAvatar || '',
                provider: 'google'
              });
              
              if (googleAvatar || dbAvatar) {
                await database.updateAvatar(googleAvatar || dbAvatar);
              }
              
              await database.syncCloudToLocal(sessionData.user?.id || '');

            } catch (err) {
              await database.setCurrentUser({
                id: sessionData.user?.id,
                email: sessionData.user?.email,
                name: sessionData.user?.user_metadata?.name || sessionData.user?.user_metadata?.full_name || '',
                tag: '',
                provider: 'google'
              });
            }
          } else {
             showAlert('Aviso', 'Tokens não encontrados. URL: ' + url);
          }
        } else {
          if (res.type !== 'cancel' && res.type !== 'dismiss') {
            showAlert('Aviso', 'O login retornou status: ' + res.type);
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
    name,
    setName,
    isLoading,
    handleRegister,
    handleSocialLogin,
  };
}
