import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../services/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

export default function WrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const currentUser = await database.getCurrentUser();
      if (!currentUser) return router.replace('/login');

      const fullList = await database.getWatchedMovies(currentUser.id);
      const watched = fullList.filter((m: any) => m.status === 'watched' || !m.status);

      const totalMovies = watched.length;
      const totalMinutes = watched.reduce((acc: number, m: any) => acc + (m.runtime || 0), 0);
      const hours = Math.floor(totalMinutes / 60);

      let bestMovie = watched.length > 0 ? watched.reduce((prev: any, current: any) => (prev.rating > current.rating) ? prev : current) : null;

      const genreCounts: Record<string, number> = {};
      watched.forEach((movie: any) => {
        if (movie.genres && Array.isArray(movie.genres)) {
          movie.genres.forEach((g: any) => {
            genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
          });
        }
      });
      const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
      const topGenre = sortedGenres.length > 0 ? sortedGenres[0] : 'Nenhum';

      setStats({
        totalMovies,
        hours,
        bestMovie,
        topGenre
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Cinéfilo Wrapped' });
      }
    } catch (err) {
      console.error('Erro ao compartilhar', err);
    }
  };

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ViewShot ref={viewRef} options={{ format: "png", quality: 1 }} style={styles.shotContainer}>

        <View style={styles.header}>
          <Text style={styles.title}>Cinéfilo Wrapped</Text>
          <Text style={styles.year}>2026</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.hours}h</Text>
            <Text style={styles.statLabel}>Tempo de Tela</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalMovies}</Text>
            <Text style={styles.statLabel}>Filmes Assistidos</Text>
          </View>

          <View style={styles.statBoxAlt}>
            <Text style={styles.statLabelAlt}>Seu Gênero Favorito</Text>
            <Text style={styles.statValueAlt}>{stats.topGenre}</Text>
          </View>

          {stats.bestMovie && (
            <View style={styles.movieBox}>
              <Text style={styles.movieLabel}>A Estrela do Ano</Text>
              <Text style={styles.movieTitle}>{stats.bestMovie.title}</Text>
            </View>
          )}
        </View>

        <Text style={styles.footerText}>@cinefiloapp</Text>
      </ViewShot>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={24} color="#fff" />
          <Text style={styles.shareText}>Compartilhar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  shotContainer: {
    flex: 1,
    backgroundColor: '#6200EE', // Roxo vibrante
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  year: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
  },
  statLabel: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statBoxAlt: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  statValueAlt: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  statLabelAlt: {
    color: '#fff',
    fontSize: 16,
  },
  movieBox: {
    alignItems: 'center',
    marginTop: 24,
  },
  movieLabel: {
    color: '#ccc',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#E50914',
    borderRadius: 28,
    marginLeft: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
