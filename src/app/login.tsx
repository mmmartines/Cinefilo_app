import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../services/database';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      // Sincroniza com o servidor na Vercel para criar o perfil e a tag no Astra DB
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
          
          // Salva os dados localmente para compatibilidade do App (Sempre salva, mesmo se a API falhar)
          await database.setCurrentUser({
             id: data.user.id,
             email: data.user.email,
             name: data.user.user_metadata?.name || '',
             tag: tag
          });
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
      Alert.alert('Erro', e.message || 'Erro ao logar.');
    } finally {
      setLoading(false);
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
          // Supabase envia os tokens na URL (hash fragment)
          const hashMatch = url.match(/#access_token=([^&]+).*&refresh_token=([^&]+)/);
          
          if (hashMatch) {
             const access_token = hashMatch[1];
             const refresh_token = hashMatch[2];
             const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
             });
             
             if (sessionError) throw sessionError;
             
             // Sincroniza com a API da Vercel para garantir que a Tag foi criada
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
      Alert.alert('Erro', e.message || 'Falha no login social.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Cinefilo 🍿</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail" color="#999" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" color="#999" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.registerText}>
            Não tem uma conta? <Text style={styles.registerLink}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>ou entre com</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#fff' }]} onPress={() => handleSocialLogin('google')}>
          <FontAwesome5 name="google" color="#DB4437" size={20} />
          <Text style={[styles.socialButtonText, { color: '#000' }]}>Continuar com Google</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#E50914', // Vermelho cinemático
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#E50914',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 15,
  },
  registerLink: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
