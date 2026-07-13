import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyMovies } from '../hooks/useMyMovies';

export function MyMoviesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    displayedMoviesList,
    currentFilter,
    setCurrentFilter,
    formatMoviesGrid,
  } = useMyMovies();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Meus Filmes</Text>
        <TouchableOpacity 
          style={styles.profileIcon} 
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterButton, currentFilter === 'watched' && styles.filterButtonActive]}
          onPress={() => setCurrentFilter('watched')}
        >
          <Text style={[styles.filterButtonText, currentFilter === 'watched' && styles.filterButtonTextActive]}>Já Assisti</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, currentFilter === 'watchlist' && styles.filterButtonActive]}
          onPress={() => setCurrentFilter('watchlist')}
        >
          <Text style={[styles.filterButtonText, currentFilter === 'watchlist' && styles.filterButtonTextActive]}>Quero Ver</Text>
        </TouchableOpacity>
      </View>

      {displayedMoviesList.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="film-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>
            {currentFilter === 'watched' ? 'Você ainda não avaliou nenhum filme.' : 'Sua lista de Quero Ver está vazia.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={formatMoviesGrid(displayedMoviesList, 4)}
          keyExtractor={(item, index) => item.empty ? `empty-${index}` : item.movieId.toString()}
          numColumns={4}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => {
            if (item.empty) {
              return <View style={{ flex: 1, margin: 4, backgroundColor: 'transparent' }} />;
            }
            return (
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/movie/${item.movieId}`)}
              >
                <View style={styles.posterContainer}>
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w200${item.poster_path}` }}
                    style={styles.poster}
                  />
                </View>
                
                {currentFilter === 'watched' && (
                  <View style={styles.reviewBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.reviewScore}>{item.rating}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#E50914',
  },
  filterButtonText: {
    color: '#999',
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3,
  },
  reviewBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  reviewScore: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
