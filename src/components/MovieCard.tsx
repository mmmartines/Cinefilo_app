import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

interface Props {
  movie: Movie;
  status?: 'watched' | 'watchlist';
}

export function MovieCard({ movie, status }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => router.push(`/movie/${movie.id}`)}
    >
      <View style={styles.posterContainer}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w200${movie.poster_path}` }}
          style={styles.poster}
        />
        {status && <View style={styles.overlay} />}
      </View>
      
      {status === 'watched' && (
        <View style={styles.watchedTag}>
          <Ionicons name="checkmark-circle" size={10} color="#fff" />
          <Text style={styles.watchedText}>Assistido</Text>
        </View>
      )}

      {status === 'watchlist' && (
        <View style={[styles.watchedTag, { backgroundColor: 'rgba(229, 9, 20, 0.95)' }]}>
          <Ionicons name="bookmark" size={10} color="#fff" />
          <Text style={styles.watchedText}>Quero Ver</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    aspectRatio: 2/3,
  },
  posterContainer: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // "um pouco mais escuro"
  },
  watchedTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 168, 89, 0.95)',
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  watchedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
