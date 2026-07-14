import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { Image } from 'expo-image';
import { useFriends } from '../hooks/useFriends';

export function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    friendTag,
    setFriendTag,
    friendsList,
    isLoading,
    isAddingFriend,
    currentUser,
    isOffline,
    handleSendFriendRequest,
    handleRemoveFriend,
    formatRuntime,
  } = useFriends();

  const renderFriendItem = ({ item }: { item: any }) => {
    const isTop3 = item.rank <= 3;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const rankColor = isTop3 ? rankColors[item.rank - 1] : '#666';

    const estimatedXp = (item.total_movies || 0) * 10;
    const estimatedLevel = Math.floor(estimatedXp / 100) + 1;

    return (
      <TouchableOpacity 
        style={[styles.friendCard, item.isMe && styles.myCard]}
        disabled={item.isMe}
        onPress={() => router.push(`/friend/${item.id}`)}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: rankColor }]}>#{item.rank}</Text>
        </View>

        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.friendAvatar} />
        ) : (
          <View style={styles.friendAvatarPlaceholder}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        
        <View style={styles.friendInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={styles.friendName}>
              {item.name} {item.isMe && <Text style={styles.youBadge}>(Você)</Text>}
            </Text>
            <View style={{ backgroundColor: '#E50914', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Nv {estimatedLevel}</Text>
            </View>
          </View>
          <Text style={styles.statsText}>
            🎬 {item.total_movies} filmes • ⏱️ {formatRuntime(item.total_minutes)}
          </Text>
        </View>

        {!item.isMe && (
          <TouchableOpacity onPress={() => handleRemoveFriend(item.id, item.name)} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={20} color="#E50914" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>Ranking</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Link href="/friend_requests" asChild>
            <TouchableOpacity style={styles.profileIcon}>
              <Ionicons name="mail" size={20} color="#fff" />
            </TouchableOpacity>
          </Link>
          <Link href="/profile" asChild>
            <TouchableOpacity style={[styles.profileIcon, currentUser?.avatar_url && { backgroundColor: 'transparent', padding: 0 }]}>
              {currentUser?.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.headerAvatar} />
              ) : (
                <Ionicons name="person" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#000" />
          <Text style={styles.offlineText}>Modo Offline</Text>
        </View>
      )}

      <View style={styles.addSection}>
        <Text style={styles.label}>Adicionar Amigo por #Tag</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: X7K9LM2Q1P"
            placeholderTextColor="#666"
            value={friendTag}
            onChangeText={(t) => setFriendTag(t.toUpperCase())}
            maxLength={10}
            autoCapitalize="characters"
          />
          <AnimatedButton 
            style={styles.addButton} 
            onPress={handleSendFriendRequest}
            disabled={isAddingFriend || friendTag.length === 0}
          >
            {isAddingFriend ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add" size={24} color="#fff" />
            )}
          </AnimatedButton>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Top Cinéfilos</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={friendsList}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Adicione amigos para começar a competir!</Text>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#1E1E1E' },
  profileIcon: { padding: 8, backgroundColor: '#333', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#E50914', textAlign: 'center' },
  addSection: { padding: 24, paddingBottom: 16 },
  label: { color: '#999', marginBottom: 8, fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, backgroundColor: '#1E1E1E', height: 56, borderRadius: 12, paddingHorizontal: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333' },
  addButton: { backgroundColor: '#E50914', width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listContainer: { flex: 1, paddingHorizontal: 24 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  listContent: { paddingBottom: 100, gap: 12 },
  friendCard: { flexDirection: 'row', backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, alignItems: 'center' },
  myCard: { borderColor: '#E50914', borderWidth: 1, backgroundColor: '#2A1112' },
  rankContainer: { width: 32, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  rankText: { fontSize: 20, fontWeight: 'bold' },
  friendAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  friendAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  youBadge: { fontSize: 12, color: '#E50914', fontWeight: 'normal' },
  statsText: { color: '#999', fontSize: 14 },
  removeBtn: { padding: 8 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
  offlineBanner: { backgroundColor: '#FFD700', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  offlineText: { color: '#000', fontWeight: 'bold', fontSize: 12 }
});
