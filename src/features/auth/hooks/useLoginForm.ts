import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../../../src/services/supabase';
import { database } from '../../../../src/services/database';
import { useAlert } from '../../../../src/contexts/AlertContext';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { showAlert } = useAlert();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Atenção', 'Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
          name: data.session.user.user_metadata?.name || data.session.user.user_metadata?.full_name || '',
          tag: tag,
          provider: 'email'
        });
        // setTimeout(() => router.replace('/'), 100); // Removido para evitar conflito com o AppContent de _layout.tsx
      }

    } catch (e: any) {
      if (e.message === 'Invalid login credentials') {
        // Verificar se esse email existe na collection users e se o provedor é google
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
          const res = await fetch(`${apiUrl}/api/users/check-provider?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.provider === 'google') {
              showAlert('Atenção', 'Este e-mail está vinculado ao Google. Faça login pelo botão "Continuar com Google".');
              return;
            }
          }
        } catch(err) {}
        showAlert('Erro', 'Email ou senha inválidos.');
      } else {
        showAlert('Erro', e.message || 'Falha ao fazer login.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleSocialLogin = async (provider: 'google') => {
    setIsLoading(true);
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
        // setTimeout(() => router.replace('/'), 100); // Removido para evitar conflito com o AppContent de _layout.tsx
      }
    } catch (e: any) {
      showAlert('Erro', e.message || 'Falha no login social.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRecoveryCode = async () => {
    if (!email) {
      showAlert('Atenção', 'Preencha seu e-mail para recuperar a senha.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      setIsRecoveryMode(true);
      showAlert('Sucesso', 'Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos.');
    } catch (e: any) {
      showAlert('Erro', e.message || 'Falha ao enviar o código de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async () => {
    if (!recoveryCode || !newPassword) {
      showAlert('Atenção', 'Preencha o código recebido e a nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Atenção', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: recoveryCode,
        type: 'recovery'
      });
      if (error) throw error;
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;
      
      showAlert('Sucesso', 'Senha redefinida com sucesso! Redirecionando...');
    } catch (e: any) {
      showAlert('Erro', 'Código inválido ou expirado. Verifique novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    isRecoveryMode,
    setIsRecoveryMode,
    recoveryCode,
    setRecoveryCode,
    newPassword,
    setNewPassword,
    handleLogin,
    handleSocialLogin,
    handleSendRecoveryCode,
    handleVerifyAndResetPassword,
  };
}
