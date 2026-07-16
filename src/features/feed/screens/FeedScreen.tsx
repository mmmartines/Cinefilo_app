import { NotificationBell } from '../../../components/NotificationBell';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton } from '../../../components/Skeleton';
import { useFeed } from '../hooks/useFeed';

export function FeedScreen() {
  const {
    feedActivities,
    isLoading,
    isRefreshing,
    isLoadingMore,
    activeTab,
    changeTab,
    currentUser,
    revealedSpoilers,
    isOffline,
    handleRefreshFeed,
    loadMore,
    handleReaction,
    toggleSpoilerVisibility,
  } = useFeed();

  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [modalReactions, setModalReactions] = useState<any[] | null>(null);

  const getReactionIcon = (type: string) => {
    switch(type) {
      case 'like': return { name: 'thumbs-up', color: '#3b5998' };
      case 'love': return { name: 'heart', color: '#E50914' };
      case 'funny': return { name: 'happy', color: '#F5C518' };
      case 'sad': return { name: 'sad', color: '#3498db' };
      default: return { name: 'thumbs-up-outline', color: '#ccc' };
    }
  };

  const renderActivityItem = ({ item }: { item: any }) => {
    const myReaction = currentUser && item.reactions?.find((r: any) => r.user_id === currentUser.id);
    const reactionProps = myReaction ? getReactionIcon(myReaction.type) : { name: 'thumbs-up-outline', color: '#ccc' };

    let actionText = '';
    if (item.action === 'watched') actionText = 'assistiu ao filme';
    else if (item.action === 'rated') actionText = 'avaliou o filme';
    else if (item.action === 'added_to_list') actionText = 'adicionou a uma lista';
    else if (item.action === 'unlocked_badge') actionText = 'desbloqueou uma conquista!';
    else if (item.action === 'challenge_completed') actionText = 'completou o Desafio Semanal!';

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
              {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {item.action === 'challenge_completed' ? (
            <View style={[styles.movieContent, { alignItems: 'center', borderColor: '#E50914', borderWidth: 1 }]}>
              <View style={[styles.badgeIconContainerFeed, { backgroundColor: '#E5091422' }]}>
                <Ionicons name="trophy" size={32} color="#E50914" />
              </View>
              <View style={styles.movieInfo}>
                <Text style={[styles.movieTitle, { color: '#E50914' }]}>{item.challenge_title || 'Desafio Semanal'}</Text>
                <Text style={styles.reviewText}>+{(item.challenge_xp || 50)} XP conquistados!</Text>
              </View>
            </View>
          ) : item.action === 'unlocked_badge' && item.badge ? (
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
            <View style={styles.reactionWrapper}>
               <TouchableOpacity 
                 style={styles.actionButton} 
                 onLongPress={() => setActiveReactionMenu(item._id)}
                 onPress={() => {
                    if (activeReactionMenu === item._id) setActiveReactionMenu(null);
                    else handleReaction(item._id, myReaction ? myReaction.type : 'like');
                 }}
               >
                 <Ionicons name={reactionProps.name as any} size={24} color={reactionProps.color} />
                 <Text style={[styles.actionCount, myReaction && {color: reactionProps.color}]}>Reagir</Text>
               </TouchableOpacity>

               {activeReactionMenu === item._id && (
                 <View style={styles.reactionMenu}>
                    <TouchableOpacity onPress={() => { handleReaction(item._id, 'like'); setActiveReactionMenu(null); }}><Ionicons name="thumbs-up" size={28} color="#3b5998" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => { handleReaction(item._id, 'love'); setActiveReactionMenu(null); }}><Ionicons name="heart" size={28} color="#E50914" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => { handleReaction(item._id, 'funny'); setActiveReactionMenu(null); }}><Ionicons name="happy" size={28} color="#F5C518" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => { handleReaction(item._id, 'sad'); setActiveReactionMenu(null); }}><Ionicons name="sad" size={28} color="#3498db" /></TouchableOpacity>
                 </View>
               )}
            </View>

            <TouchableOpacity style={styles.reactionCountBadge} onPress={() => setModalReactions(item.reactions || [])}>
               <Text style={styles.reactionCountText}>{(item.reactions || []).length} Reações</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 16}}>
          <Text style={styles.title}>Feed de Atividades</Text>
          <NotificationBell />
        </View>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'social' && styles.activeTab]} 
            onPress={() => changeTab('social')}
          >
            <Text style={[styles.tabText, activeTab === 'social' && styles.activeTabText]}>Social</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'me' && styles.activeTab]} 
            onPress={() => changeTab('me')}
          >
            <Text style={[styles.tabText, activeTab === 'me' && styles.activeTabText]}>Meu Feed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#000" />
          <Text style={styles.offlineText}>Modo Offline</Text>
        </View>
      )}

      {isLoading && !isRefreshing ? (
         <View style={styles.list}>
           <ActivityIndicator size="large" color="#E50914" />
         </View>
      ) : (
        <FlatList
          data={feedActivities}
          keyExtractor={(item) => item._id}
          renderItem={renderActivityItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshFeed} tintColor="#fff" />}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma atividade recente.</Text>}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color="#E50914" style={{marginVertical: 16}} /> : null}
        />
      )}

      <Modal visible={modalReactions !== null} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>Reações</Text>
                 <TouchableOpacity onPress={() => setModalReactions(null)}>
                   <Ionicons name="close" size={24} color="#fff" />
                 </TouchableOpacity>
               </View>
               <ScrollView style={{flex: 1}}>
                  {modalReactions && modalReactions.length === 0 && <Text style={{color: '#999', textAlign: 'center', marginTop: 20}}>Nenhuma reação ainda.</Text>}
                  {modalReactions?.map((r, idx) => (
                    <View key={idx} style={styles.reactionListItem}>
                       <Ionicons name={getReactionIcon(r.type).name as any} size={20} color={getReactionIcon(r.type).color} style={{marginRight: 12}} />
                       <Text style={{color: '#fff', fontSize: 16}}>{r.user_name}</Text>
                    </View>
                  ))}
               </ScrollView>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  headerArea: { paddingTop: 50, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', paddingHorizontal: 16, paddingBottom: 16 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#E50914' },
  tabText: { color: '#888', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
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
  cardFooter: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12, justifyContent: 'space-between', alignItems: 'center' },
  reactionWrapper: { position: 'relative' },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionCount: { color: '#ccc', marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  reactionMenu: { position: 'absolute', bottom: 35, left: 0, backgroundColor: '#222', borderRadius: 20, padding: 8, flexDirection: 'row', gap: 12, elevation: 5, borderWidth: 1, borderColor: '#444' },
  reactionCountBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  reactionCountText: { color: '#fff', fontSize: 12 },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 40, fontSize: 16 },
  spoilerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,20,0.95)', borderRadius: 4, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 4, padding: 8, zIndex: 10 },
  spoilerOverlayText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  offlineBanner: { backgroundColor: '#FFD700', padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  offlineText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  badgeIconContainerFeed: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 300, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 10 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  reactionListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' }
});
