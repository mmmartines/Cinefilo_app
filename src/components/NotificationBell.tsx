import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../hooks/useNotifications';
import { Image } from 'expo-image';
import { useAppTheme } from '../contexts/ThemeContext';

export function NotificationBell() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
    markAsRead(); // Marca todas como lidas ao abrir a central
  };

  const getReactionIcon = (type: string) => {
    switch(type) {
      case 'like': return { name: 'thumbs-up', color: '#3b5998' };
      case 'love': return { name: 'heart', color: '#E50914' };
      case 'funny': return { name: 'happy', color: '#F5C518' };
      case 'sad': return { name: 'sad', color: '#3498db' };
      default: return { name: 'notifications', color: '#E50914' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = item.type === 'reaction' ? getReactionIcon(item.reaction_type) : { name: 'notifications', color: '#E50914' };
    
    let message = '';
    if (item.type === 'reaction') {
      const actionText = item.activity_action === 'watched' ? 'no filme que você assistiu' : 
                         item.activity_action === 'added_to_list' ? 'na sua lista' :
                         item.activity_action === 'rated' ? 'na sua avaliação' : 'na sua conquista';
      
      const reactionWord = item.reaction_type === 'like' ? 'curtiu' :
                           item.reaction_type === 'love' ? 'amou' :
                           item.reaction_type === 'funny' ? 'achou divertido' : 'ficou triste com';

      message = `${item.actor_name} ${reactionWord} a sua atividade ${actionText} (${item.movie_title || ''})`;
    }

    return (
      <View style={[styles.notificationItem, !item.read && styles.unreadItem]}>
         {item.actor_avatar ? (
            <Image source={{ uri: item.actor_avatar }} style={styles.avatar} />
         ) : (
            <View style={styles.avatarPlaceholder}>
               <Ionicons name="person" size={24} color={colors.textSecondary} />
            </View>
         )}
         <View style={styles.content}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
              <Ionicons name={icon.name as any} size={16} color={icon.color} style={{marginRight: 6}} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
         </View>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity onPress={openModal} style={styles.bellContainer}>
        <Ionicons name="notifications-outline" size={28} color={colors.text} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={styles.modalContainer}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Notificações</Text>
               <TouchableOpacity onPress={() => setModalVisible(false)}>
                 <Ionicons name="close" size={28} color={colors.text} />
               </TouchableOpacity>
             </View>
             
             <FlatList
               data={notifications}
               keyExtractor={item => item._id}
               renderItem={renderItem}
               ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma notificação por aqui.</Text>}
               contentContainerStyle={{ padding: 16 }}
             />
           </View>
        </View>
      </Modal>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  bellContainer: { position: 'relative', padding: 4, marginRight: 8 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#E50914', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.backgroundElement, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  notificationItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.backgroundElement },
  unreadItem: { backgroundColor: colors.backgroundElement },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1, justifyContent: 'center' },
  messageText: { color: colors.text, fontSize: 14, flexShrink: 1 },
  timeText: { color: colors.textSecondary, fontSize: 12 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 }
});
