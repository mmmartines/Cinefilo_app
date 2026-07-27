import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import database from '../../../services/database';

const darkTheme = {
  background: '#09090b',
  card: 'rgba(24, 24, 27, 0.7)',
  border: 'rgba(255,255,255,0.1)',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  primary: '#E50914',
  success: '#10B981',
  inputBackground: 'rgba(255,255,255,0.05)',
};

export function SetupNicknameScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [nickname, setNickname] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Busca sugestões ao iniciar
  useEffect(() => {
    if (user?.name) {
      fetchSuggestions(user.name);
    }
  }, [user]);

  const fetchSuggestions = async (name: string) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const res = await fetch(`${apiUrl}/api/users/suggest-nickname?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSuggestions(json.suggestions);
        }
      }
    } catch (e) {
      console.log('Error fetching suggestions', e);
    }
  };

  // Validar username (debounce simplificado)
  useEffect(() => {
    const cleanNick = nickname.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    
    if (cleanNick !== nickname) {
      setNickname(cleanNick); // força formato correto
      return;
    }

    if (!cleanNick) {
      setIsAvailable(null);
      setErrorMsg('');
      return;
    }

    if (cleanNick.length < 3) {
      setIsAvailable(false);
      setErrorMsg('Mínimo 3 caracteres.');
      return;
    }

    const validate = setTimeout(async () => {
      setIsValidating(true);
      setErrorMsg('');
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        const res = await fetch(`${apiUrl}/api/users/check-nickname?nickname=${encodeURIComponent(cleanNick)}`);
        if (res.ok) {
          const json = await res.json();
          setIsAvailable(json.available);
          if (!json.available) {
            setErrorMsg('Apelido já está em uso.');
          }
        }
      } catch (e) {
        setIsAvailable(null);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(validate);
  }, [nickname]);

  const handleSubmit = async () => {
    if (!nickname || !isAvailable || isValidating || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Atualiza banco via db local (que também faz PUT no /api/users e atualiza o estado local)
      await database.updateUser({ email: user?.email, nickname });
      
      router.replace('/'); // Vai para a tela inicial
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao salvar apelido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.mainContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#09090b', '#180000', '#2b0000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Crie seu @apelido</Text>
          <Text style={styles.subtitle}>Ele será usado para que seus amigos possam te adicionar.</Text>
        </View>

        <BlurView intensity={30} tint="dark" style={styles.glassCard}>
          <View style={[styles.inputContainer, isAvailable === false && styles.inputError, isAvailable === true && styles.inputSuccess]}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="seu_apelido"
              placeholderTextColor={darkTheme.textSecondary}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {isValidating && <ActivityIndicator color={darkTheme.textSecondary} size="small" style={styles.statusIcon} />}
            {!isValidating && isAvailable === true && <Ionicons name="checkmark-circle" color={darkTheme.success} size={24} style={styles.statusIcon} />}
            {!isValidating && isAvailable === false && <Ionicons name="close-circle" color={darkTheme.primary} size={24} style={styles.statusIcon} />}
          </View>

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : null}

          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Sugestões para você:</Text>
              <View style={styles.chipsContainer}>
                {suggestions.map((sug) => (
                  <TouchableOpacity key={sug} style={styles.chip} onPress={() => setNickname(sug)}>
                    <Text style={styles.chipText}>@{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <AnimatedButton 
            style={[styles.submitButton, (!isAvailable || isValidating || isSubmitting) && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={!isAvailable || isValidating || isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Salvando...' : 'Confirmar e Entrar'}
            </Text>
          </AnimatedButton>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: darkTheme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: darkTheme.card,
    borderColor: darkTheme.border,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.inputBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: darkTheme.border,
    marginBottom: 8,
  },
  inputError: {
    borderColor: darkTheme.primary,
  },
  inputSuccess: {
    borderColor: darkTheme.success,
  },
  atSymbol: {
    fontSize: 18,
    color: darkTheme.textSecondary,
    fontWeight: 'bold',
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 8,
  },
  errorText: {
    color: darkTheme.primary,
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  suggestionsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  suggestionsLabel: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipText: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: darkTheme.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
