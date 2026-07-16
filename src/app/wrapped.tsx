import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../services/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

let ViewShot: any = View;
let captureRef: any = null;
if (Platform.OS !== 'web') {
  const RNV = require('react-native-view-shot');
  ViewShot = RNV.default;
  captureRef = RNV.captureRef;
}

const { width } = Dimensions.get('window');
const SLIDES_COUNT = 3;

export default function WrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!loading && stats) {
      startStoryAnimation();
    }
  }, [currentSlide, loading, stats]);

  const startStoryAnimation = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        if (currentSlide < SLIDES_COUNT - 1) {
          setCurrentSlide(prev => prev + 1);
        }
      }
    });
  };

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

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < width / 2) {
      // Prev
      if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
      else {
        progressAnim.setValue(0);
        startStoryAnimation();
      }
    } else {
      // Next
      if (currentSlide < SLIDES_COUNT - 1) setCurrentSlide(prev => prev + 1);
      else {
        // End of stories
        progressAnim.setValue(1);
      }
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web' || !captureRef) {
        alert("O compartilhamento de imagem não é suportado na versão Web.");
        return;
      }
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Cinelândia Wrapped' });
      }
    } catch (err) {
      console.error('Erro ao compartilhar', err);
    }
  };

  if (loading) {
    return <View style={styles.container} />;
  }

  const renderSlideContent = () => {
    switch(currentSlide) {
      case 0:
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideTitle}>Você viveu histórias intensas esse ano.</Text>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.hours}h</Text>
              <Text style={styles.statLabel}>Tempo de Tela</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalMovies}</Text>
              <Text style={styles.statLabel}>Filmes Assistidos</Text>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideTitle}>Seu humor foi definido por:</Text>
            <View style={styles.statBoxAlt}>
              <Text style={styles.statLabelAlt}>Seu Gênero Favorito</Text>
              <Text style={styles.statValueAlt}>{stats.topGenre}</Text>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.slideContent}>
            <Text style={styles.slideTitle}>Mas um filme roubou seu coração.</Text>
            {stats.bestMovie ? (
              <View style={styles.movieBox}>
                <Text style={styles.movieLabel}>A Estrela do Ano</Text>
                <Text style={styles.movieTitle}>{stats.bestMovie.title}</Text>
              </View>
            ) : (
              <Text style={styles.slideTitle}>Você não avaliou muitos filmes ainda!</Text>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressContainer, { top: Math.max(insets.top, 16) }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.progressBarBg}>
            <Animated.View style={[
              styles.progressBarFg,
              { width: currentSlide === i ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : (currentSlide > i ? '100%' : '0%') }
            ]} />
          </View>
        ))}
      </View>

      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={StyleSheet.absoluteFill}>
          <ViewShot ref={viewRef} options={{ format: "png", quality: 1 }} style={styles.shotContainer}>
            <View style={[styles.header, { marginTop: 40 }]}>
              <Text style={styles.title}>Cinelândia Wrapped</Text>
              <Text style={styles.year}>2026</Text>
            </View>

            <View style={styles.content}>
              {renderSlideContent()}
            </View>

            <Text style={styles.footerText}>@cinelandiaapp</Text>
          </ViewShot>
        </View>
      </TouchableWithoutFeedback>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {currentSlide === 2 && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={24} color="#fff" />
            <Text style={styles.shareText}>Compartilhar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progressContainer: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', gap: 4, zIndex: 10 },
  progressBarBg: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressBarFg: { height: '100%', backgroundColor: '#fff' },
  shotContainer: { flex: 1, backgroundColor: '#6200EE', justifyContent: 'space-between', padding: 32 },
  header: { alignItems: 'center' },
  title: { color: '#FFD700', fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
  year: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  content: { flex: 1, justifyContent: 'center' },
  slideContent: { alignItems: 'center', gap: 24 },
  slideTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  statBox: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 56, fontWeight: '900' },
  statLabel: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
  statBoxAlt: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 24, borderRadius: 16, alignItems: 'center' },
  statValueAlt: { color: '#FFD700', fontSize: 32, fontWeight: '900', marginTop: 8 },
  statLabelAlt: { color: '#fff', fontSize: 16 },
  movieBox: { alignItems: 'center' },
  movieLabel: { color: '#ccc', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  movieTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  footerText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: 'bold' },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, zIndex: 10 },
  closeBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1DB954', paddingHorizontal: 24, height: 56, borderRadius: 28 },
  shareText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
