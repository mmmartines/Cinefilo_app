import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GlobalHeader } from '../../components/GlobalHeader';
import { FeedScreen } from '../../features/feed/screens/FeedScreen';
import { ChatsScreen } from '../../features/chat/screens/ChatsScreen';
import { FriendsScreen } from '../../features/friends/screens/FriendsScreen';
import { useNotificationBadges } from '../../contexts/NotificationBadgeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SocialTab() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'chats' | 'friends'>('feed');
  const { unreadFeedCount, unreadChatsCount, pendingFriendRequestsCount } = useNotificationBadges();

  return (
    <View style={styles.container}>
      <GlobalHeader 
        title={activeTab === 'feed' ? 'Feed de Atividades' : activeTab === 'chats' ? 'Bate-papos' : 'Ranking'} 
        rightComponent={
          activeTab === 'friends' ? (
            <TouchableOpacity style={styles.mailButton} onPress={() => router.push('/friend_requests')}>
              <Ionicons name="mail" size={20} color={colors.text} />
              {pendingFriendRequestsCount > 0 && (
                <View style={styles.mailBadge} />
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'feed' && styles.activeTab]} 
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Feed</Text>
          {unreadFeedCount > 0 && <View style={styles.badge} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'chats' && styles.activeTab]} 
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>Chats</Text>
          {unreadChatsCount > 0 && <View style={styles.badge} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'friends' && styles.activeTab]} 
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Ranking</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'feed' && <FeedScreen />}
        {activeTab === 'chats' && <ChatsScreen />}
        {activeTab === 'friends' && <FriendsScreen />}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.border },
  tabsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    backgroundColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tabButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderBottomWidth: 2, 
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  activeTab: { borderBottomColor: '#E50914' },
  tabText: { color: colors.textSecondary, fontWeight: 'bold' },
  activeTabText: { color: colors.text },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E50914',
  },
  content: {
    flex: 1,
  },
  mailButton: { 
    padding: 8, 
    backgroundColor: colors.border, 
    borderRadius: 20, 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  mailBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E50914'
  }
});
