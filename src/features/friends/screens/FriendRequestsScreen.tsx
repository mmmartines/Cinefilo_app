import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriendRequests } from '../hooks/useFriendRequests';
import { useAppTheme } from '../../../contexts/ThemeContext';

export function FriendRequestsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    isLoading,
    receivedRequests,
    sentRequests,
    activeTab,
    setActiveTab,
    handleRespondRequest,
  } = useFriendRequests();

  const renderRequestItem = ({ item }: { item: any }) => {
    const isReceived = activeTab === 'received';
    const name = isReceived ? item.sender_name : item.receiver_name;
    const tag = isReceived ? (item.sender_nickname || item.sender_tag) : (item.receiver_nickname || item.receiver_tag);
    const avatar = isReceived ? item.sender_avatar : item.receiver_avatar;

    return (
      <View style={styles.requestCard}>
        <View style={styles.userInfo}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userTag}>@{tag}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {isReceived ? (
            <>
              <TouchableOpacity 
                style={styles.declineBtn} 
                onPress={() => handleRespondRequest(item._id, 'reject')}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.acceptBtn} 
                onPress={() => handleRespondRequest(item._id, 'accept')}
              >
                <Ionicons name="checkmark" size={20} color={colors.text} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => handleCancelRequest(item._id)}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitações</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Recebidas ({receivedRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Enviadas ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'received' ? receivedRequests : sentRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>Nenhuma solicitação.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#E50914' },
  tabText: { color: colors.textSecondary, fontWeight: 'bold' },
  activeTabText: { color: '#E50914' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 64, gap: 16 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  requestCard: { backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  nameContainer: { flex: 1 },
  userName: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  userTag: { color: colors.textSecondary, fontSize: 12 },
  actionsContainer: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#4CAF50', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  declineBtn: { backgroundColor: colors.border, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cancelBtnText: { color: colors.text, fontWeight: 'bold' }
});
