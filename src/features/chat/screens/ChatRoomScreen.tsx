import React, { useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useChatRoom } from '../hooks/useChatRoom';
import { useAppTheme } from '../../../contexts/ThemeContext';

interface ChatRoomScreenProps {
  chatId: string;
}

export function ChatRoomScreen({ chatId }: ChatRoomScreenProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  
  const {
    chatMessages,
    messageInputText,
    setMessageInputText,
    isLoading,
    currentUser,
    handleSendMessage,
  } = useChatRoom(chatId);
  
  const messagesListRef = useRef<FlatList>(null);

  const renderChatMessage = ({ item }: { item: any }) => {
    const isMyMessage = currentUser && item.user_id === currentUser.id;
    
    return (
      <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMyMessage && (
          <View style={styles.messageAvatarContainer}>
            {item.user_avatar ? (
              <Image source={{ uri: item.user_avatar }} style={styles.messageAvatar} />
            ) : (
              <View style={styles.messageAvatarPlaceholder}>
                <Ionicons name="person" size={16} color={colors.textSecondary} />
              </View>
            )}
          </View>
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
          {!isMyMessage && <Text style={styles.senderName}>{item.user_name}</Text>}
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sala de Discussão</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <FlatList
          ref={messagesListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderChatMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => messagesListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => messagesListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Seja o primeiro a mandar uma mensagem!</Text>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#666"
          value={messageInputText}
          onChangeText={setMessageInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !messageInputText.trim() && { opacity: 0.5 }]} 
          onPress={handleSendMessage}
          disabled={!messageInputText.trim()}
        >
          <Ionicons name="send" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, backgroundColor: colors.backgroundElement, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  myMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageAvatarContainer: { marginRight: 8 },
  messageAvatar: { width: 32, height: 32, borderRadius: 16 },
  messageAvatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: '#E50914', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: colors.border, borderBottomLeftRadius: 4 },
  senderName: { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  messageText: { color: colors.text, fontSize: 16 },
  timestamp: { color: 'rgba(255,255,255,0.5)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: colors.backgroundElement, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end', gap: 12 },
  input: { flex: 1, backgroundColor: colors.border, color: colors.text, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendBtn: { backgroundColor: '#E50914', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40 }
});
