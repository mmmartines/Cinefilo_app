import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../services/supabase';
import { useAlert } from '../../../contexts/AlertContext';
import { useAppTheme } from '../../../contexts/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AiChatScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Eu sou a Cinemateca 🎬\nEstou aqui para falar sobre filmes, diretores, atores e te dar recomendações. O que você quer assistir hoje?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      
      // Construir payload no formato que o Groq espera
      const messagesPayload = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: userMessage.content });

      const response = await fetch(`${apiUrl}/api/ai?action=chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages: messagesPayload })
      });

      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: result.message }]);
      } else {
        showAlert('Erro', result.error || 'Falha ao responder');
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro', 'Não foi possível se conectar com a Cinemateca.');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
        {!isUser && (
          <View style={styles.botIcon}>
            <Ionicons name="film-outline" size={16} color={colors.text} />
          </View>
        )}
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cinemateca IA</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#E50914" />
            <Text style={styles.loadingText}>Digitando...</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            style={styles.input}
            placeholder="Peça uma recomendação..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  backButton: { padding: 8 },
  headerTitle: { color: '#E50914', fontSize: 18, fontWeight: 'bold' },
  chatContainer: { flex: 1 },
  listContent: { padding: 16, gap: 16 },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: '#E50914', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#2A2A2A', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#333', flexDirection: 'row', gap: 8 },
  botIcon: { backgroundColor: '#1E1E1E', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  messageText: { color: colors.text, fontSize: 15, lineHeight: 22, flexShrink: 1 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
  loadingText: { color: '#999', fontSize: 13, fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#1E1E1E', borderTopWidth: 1, borderTopColor: '#333', gap: 12 },
  input: { flex: 1, minHeight: 48, maxHeight: 100, backgroundColor: colors.border, borderRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: '#333' },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E50914', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#333' }
});
