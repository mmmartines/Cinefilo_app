import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChats } from '../hooks/useChats';

export function ChatsScreen() {
  const router = useRouter();
  const { chatRooms, isLoading } = useChats();

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
          <Text style={styles.movieTitle} numberOfLines={1}>{item.movie_title}</Text>
          <Text style={styles.chatSubtitle}>Tocar para abrir o bate-papo</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bate-papo de Filmes</Text>
      </View>

      <FlatList
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, backgroundColor: '#1E1E1E', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#E50914' },
  listContent: { padding: 16, gap: 16 },
  chatCard: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' },
  moviePoster: { width: 50, height: 75, borderRadius: 8, marginRight: 16 },
  chatInfo: { flex: 1 },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  chatSubtitle: { color: '#999', fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 64 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { color: '#999', marginTop: 8, textAlign: 'center' }
});
