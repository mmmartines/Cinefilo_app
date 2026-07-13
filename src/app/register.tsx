import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { supabase } from '../services/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { FontAwesome5 } from '@expo/vector-icons';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('31/01/1996');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date(1996, 0, 31)); // Janeiro é mês 0 no JS
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      // Format as DD/MM/YYYY
      const formatted = selectedDate.toLocaleDateString('pt-BR');
      setBirthdate(formatted);
    }
  };

  const handleRegister = async () => {
    if (!name || !birthdate || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            birthdate: birthdate,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
         // Sincroniza com o servidor na Vercel para criar o perfil e a tag no Astra DB
         const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
         const response = await fetch(`${apiUrl}/api/users`, {
           method: 'GET',
           headers: {
             'Authorization': `Bearer ${data.session.access_token}`,
           }
         });
         
         if (!response.ok) {
            console.error('Falha ao sincronizar com o backend:', await response.text());
         } else {
            const apiData = await response.json();
            // Salva a sessão localmente para retrocompatibilidade do layout do app
            await database.setCurrentUser({ 
              id: data.user?.id, 
              email, 
              name,
              tag: apiData.data?.tag
            });
         }
         router.replace('/');
      } else {
         Alert.alert('Sucesso', 'Verifique seu e-mail para confirmar a conta!');
         router.replace('/login');
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Erro ao realizar o cadastro.');
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
      Alert.alert('Erro', e.message || 'Falha no login social.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Junte-se ao Cinefilo hoje mesmo</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="person" color="#999" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="calendar" color="#999" size={20} style={styles.icon} />
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'center' }} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: birthdate ? '#fff' : '#666', fontSize: 16 }}>
              {birthdate || "Data de Nascimento"}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

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
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>
            Já tem uma conta? <Text style={styles.backLink}>Faça Login</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>ou cadastre-se com</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('google')}>
          <FontAwesome5 name="google" color="#DB4437" size={20} />
          <Text style={styles.socialButtonText}>Continuar com Google</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
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
  registerButton: {
    backgroundColor: '#E50914',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 15,
  },
  backLink: {
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
  socialButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  socialButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
