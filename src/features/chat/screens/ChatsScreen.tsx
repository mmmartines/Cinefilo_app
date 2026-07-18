import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChats } from '../hooks/useChats';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { useNotificationBadges } from '../../../contexts/NotificationBadgeContext';

export function ChatsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { chatRooms, isLoading } = useChats();
  const { unreadChatsMap } = useNotificationBadges();

  const renderChatRoom = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.chatCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <Image 
          source={{ uri: `https://image.tmdb.org/t/p/w200${item.movie_poster}` }}
          style={styles.moviePoster}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.chatInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.movieTitle} numberOfLines={1}>{item.movie_title}</Text>
            {unreadChatsMap[item.id] && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.chatSubtitle}>Tocar para abrir o bate-papo</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      

      <FlatList
        initialNumToRender={15}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderChatRoom}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>Você ainda não possui nenhum chat.</Text>
              <Text style={styles.emptySubtext}>Crie um grupo através da tela do Filme!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  listContent: { padding: 16, gap: 16 },
  chatCard: { backgroundColor: colors.backgroundElement, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' },
  moviePoster: { width: 50, height: 75, borderRadius: 8, marginRight: 16 },
  chatInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  movieTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E50914', marginLeft: 8 },
  chatSubtitle: { color: colors.textSecondary, fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 64 },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }
});
