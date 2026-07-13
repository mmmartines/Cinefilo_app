import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Friends() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tag, setTag] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchFriends = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/friends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Falha ao buscar ranking');
      
      const result = await response.json();
      setFriends(result.data || []);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [])
  );

  const handleAddFriend = async () => {
    if (tag.trim().length !== 10) {
      Alert.alert('Ops', 'A Tag deve conter exatamente 10 caracteres.');
      return;
    }

    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tag: tag.trim() })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao adicionar amigo');
      }

      Alert.alert('Sucesso', 'Amigo adicionado! Eles agora estão no seu ranking.');
      setTag('');
      fetchFriends(); // Atualiza a lista
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remover Amigo',
      `Tem certeza que deseja remover ${friendName} do seu ranking?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;
        
              const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
              const response = await fetch(`${apiUrl}/api/friends`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ friend_id: friendId })
              });
              
              if (!response.ok) throw new Error('Falha ao remover amigo');
              
              fetchFriends();
            } catch (e: any) {
              Alert.alert('Erro', e.message);
            }
          }
        }
      ]
    );
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes) return '0h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const renderFriend = ({ item }: { item: any }) => {
    const isTop3 = item.rank <= 3;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const rankColor = isTop3 ? rankColors[item.rank - 1] : '#666';

    return (
      <View style={[styles.friendCard, item.isMe && styles.myCard]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: rankColor }]}>#{item.rank}</Text>
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.name} {item.isMe && <Text style={styles.youBadge}>(Você)</Text>}
          </Text>
          <Text style={styles.statsText}>
            🎬 {item.total_movies} filmes • ⏱️ {formatRuntime(item.total_minutes)}
          </Text>
        </View>

        {!item.isMe && (
          <TouchableOpacity onPress={() => handleRemoveFriend(item.id, item.name)} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={20} color="#E50914" />
          </TouchableOpacity>
        )}
      </View>
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
        <TouchableOpacity 
          style={styles.profileIcon} 
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.addSection}>
        <Text style={styles.label}>Adicionar Amigo por #Tag</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: X7K9LM2Q1P"
            placeholderTextColor="#666"
            value={tag}
            onChangeText={(t) => setTag(t.toUpperCase())}
            maxLength={10}
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddFriend}
            disabled={adding || tag.length === 0}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Top Cinéfilos</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriend}
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  profileIcon: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center',
  },
  addSection: {
    padding: 24,
    paddingBottom: 16,
  },
  label: {
    color: '#999',
    marginBottom: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  addButton: {
    backgroundColor: '#E50914',
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  friendCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  myCard: {
    borderColor: '#E50914',
    borderWidth: 1,
    backgroundColor: '#2A1112', // slight red tint
  },
  rankContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    marginLeft: 12,
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  youBadge: {
    fontSize: 12,
    color: '#E50914',
    fontWeight: 'normal',
  },
  statsText: {
    color: '#999',
    fontSize: 14,
  },
  removeBtn: {
    padding: 8,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
