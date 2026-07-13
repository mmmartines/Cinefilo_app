import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase';
import { MovieCard } from '../../../components/MovieCard';
import { Loading } from '../../../components/Loading';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'resumo' | 'filmes';

export default function FriendProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [friend, setFriend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('resumo');

  useEffect(() => {
    const fetchFriendDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        const response = await fetch(`${apiUrl}/api/friend?id=${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setFriend(result.data);
        }
      } catch (e) {
        console.error('Erro ao buscar amigo', e);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchFriendDetails();
    }
  }, [id]);

  const formatRuntime = (minutes: number) => {
    if (!minutes) return '0h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const formatData = (dataList: any[], numColumns: number) => {
    const numberOfFullRows = Math.floor(dataList.length / numColumns);
    let numberOfElementsLastRow = dataList.length - (numberOfFullRows * numColumns);
    
    const padded = [...dataList];
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
      padded.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
      numberOfElementsLastRow++;
    }
    return padded;
  };

  if (loading) {
    return <Loading />;
  }

  if (!friend) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Perfil não encontrado ou acesso negado.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friend.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'resumo' && styles.activeTab]} 
          onPress={() => setActiveTab('resumo')}
        >
          <Text style={[styles.tabText, activeTab === 'resumo' && styles.activeTabText]}>Resumo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'filmes' && styles.activeTab]} 
          onPress={() => setActiveTab('filmes')}
        >
          <Text style={[styles.tabText, activeTab === 'filmes' && styles.activeTabText]}>Filmes Assistidos</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'resumo' ? (
        <View style={styles.resumoContainer}>
          <View style={styles.statCard}>
            <Ionicons name="film-outline" size={40} color="#E50914" />
            <Text style={styles.statValue}>{friend.stats?.total_movies || 0}</Text>
            <Text style={styles.statLabel}>Filmes Assistidos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={40} color="#E50914" />
            <Text style={styles.statValue}>{formatRuntime(friend.stats?.total_minutes || 0)}</Text>
            <Text style={styles.statLabel}>Tempo de Tela</Text>
          </View>
          <View style={styles.tagCard}>
            <Text style={styles.statLabel}>Tag do Amigo:</Text>
            <Text style={styles.tagText}>{friend.tag}</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={formatData(friend.watched_movies || [], 4)}
          keyExtractor={(item, index) => item.empty ? `empty-${index}` : `${item.movieId}-${index}`}
          numColumns={4}
          renderItem={({ item }) => {
            if (item.empty) {
              return <View style={{ flex: 1, margin: 4, backgroundColor: 'transparent' }} />;
            }
            const movieFormatted = {
              id: item.movieId,
              title: item.title,
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
            };
            return (
              <View style={styles.movieWrapper} pointerEvents="none">
                <MovieCard movie={movieFormatted} status="watched" />
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Este amigo ainda não avaliou nenhum filme.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  backIcon: {
    padding: 8,
    width: 40,
    alignItems: 'flex-start',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#E50914',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  resumoContainer: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  tagCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  tagText: {
    color: '#E50914',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  movieWrapper: {
    flex: 1,
    opacity: 0.9,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
