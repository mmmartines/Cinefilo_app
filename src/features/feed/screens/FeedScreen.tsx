import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton } from '../../../components/Skeleton';
import { useFeed } from '../hooks/useFeed';

export function FeedScreen() {
  const {
    feedActivities,
    isLoading,
    isRefreshing,
    currentUser,
    revealedSpoilers,
    isOffline,
    handleRefreshFeed,
    toggleLikeActivity,
    toggleSpoilerVisibility,
  } = useFeed();

  const renderActivityItem = ({ item }: { item: any }) => {
    const hasLiked = currentUser && item.likes?.includes(currentUser.id);
    let actionText = '';
    if (item.action === 'watched') actionText = 'assistiu ao filme';
    else if (item.action === 'rated') actionText = 'avaliou o filme';
    else if (item.action === 'added_to_list') actionText = 'adicionou a uma lista';
    else if (item.action === 'unlocked_badge') actionText = 'desbloqueou uma conquista!';

    const isSpoilerHidden = item.has_spoiler && !revealedSpoilers.includes(item._id);

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLine} />
        <View style={styles.timelineDot} />
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            {item.user_avatar ? (
              <Image source={{ uri: item.user_avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.userName}>
                {item.user_name}
                {currentUser && (currentUser.id === item.user_id || currentUser.name === item.user_name) && (
                  <Text style={styles.youBadge}> (Você)</Text>
                )}
              </Text>
              <Text style={styles.actionText}>{actionText}</Text>
            </View>
            <Text style={styles.timeAgo}>
              {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {item.action === 'unlocked_badge' && item.badge ? (
            <View style={[styles.movieContent, { alignItems: 'center', borderColor: item.badge.color || '#333', borderWidth: 1 }]}>
              <View style={[styles.badgeIconContainerFeed, { backgroundColor: item.badge.color ? `${item.badge.color}22` : '#333' }]}>
                <Ionicons name={item.badge.icon as any} size={32} color={item.badge.color || '#fff'} />
              </View>
              <View style={styles.movieInfo}>
                <Text style={[styles.movieTitle, { color: item.badge.color || '#fff' }]}>{item.badge.name}</Text>
                <Text style={styles.reviewText}>{item.badge.description}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.movieContent}>
              {item.movie_poster && (
                <Image 
                  source={{ uri: `https://image.tmdb.org/t/p/w200${item.movie_poster}` }} 
                  style={styles.moviePoster} 
                />
              )}
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{item.movie_title}</Text>
                {item.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}/5</Text>
                  </View>
                )}
                {item.review ? (
                  <View style={{ position: 'relative' }}>
                    <Text style={styles.reviewText}>"{item.review}"</Text>
                    
                    {isSpoilerHidden && (
                      <TouchableOpacity 
                        style={styles.spoilerOverlay} 
                        onPress={() => toggleSpoilerVisibility(item._id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="eye-off" size={24} color="#fff" />
                        <Text style={styles.spoilerOverlayText}>Contém Spoiler. Toque para ver.</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </View>
            </View>
          )}

          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.actionButton} onPress={() => toggleLikeActivity(item._id)}>
              <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={24} color={hasLiked ? "#E50914" : "#ccc"} />
              <Text style={[styles.actionCount, hasLiked && {color: '#E50914'}]}>{item.likes?.length || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Feed de Atividades</Text>
        <View style={styles.list}>
          {[1,2,3].map(i => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLine} />
              <View style={styles.timelineDot} />
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Skeleton width={40} height={40} borderRadius={20} />
                  <View style={styles.headerText}>
                    <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
                    <Skeleton width={80} height={14} borderRadius={4} />
                  </View>
                </View>
                <View style={styles.movieContent}>
                  <Skeleton width={60} height={90} borderRadius={4} />
                  <View style={styles.movieInfo}>
                    <Skeleton width={140} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                    <Skeleton width="80%" height={14} borderRadius={4} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed de Atividades</Text>
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#000" />
          <Text style={styles.offlineText}>Modo Offline: Mostrando dados salvos</Text>
        </View>
      )}

      <FlatList
        data={feedActivities}
        keyExtractor={(item) => item._id}
        renderItem={renderActivityItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshFeed} tintColor="#fff" />}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma atividade recente.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 60, paddingBottom: 8 },
  list: { padding: 16, paddingBottom: 100 },
  timelineItem: { position: 'relative', paddingLeft: 24, marginBottom: 16 },
  timelineLine: { position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, backgroundColor: '#333' },
  timelineDot: { position: 'absolute', left: 4, top: 24, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E50914', borderWidth: 2, borderColor: '#121212' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1, marginLeft: 12 },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  youBadge: { color: '#E50914', fontSize: 12, fontWeight: 'normal' },
  actionText: { color: '#aaa', fontSize: 14 },
  timeAgo: { color: '#666', fontSize: 12 },
  movieContent: { flexDirection: 'row', backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12 },
  moviePoster: { width: 60, height: 90, borderRadius: 4, backgroundColor: '#444' },
  movieInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { color: '#FFD700', marginLeft: 4, fontWeight: 'bold' },
  reviewText: { color: '#ccc', fontStyle: 'italic', fontSize: 14 },
  cardFooter: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionCount: { color: '#ccc', marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 16 },
  spoilerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 4, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 4, padding: 8, zIndex: 10 },
  spoilerOverlayText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  offlineBanner: { backgroundColor: '#FFD700', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  offlineText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  badgeIconContainerFeed: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' }
});
