import { useAppTheme } from '../contexts/ThemeContext';
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchFilteredMovies } from '../services/api';
import { AnimatedButton } from '../components/AnimatedButton';

export default function RouletteScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [movie, setMovie] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const spinRoulette = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setMovie(null);
    fadeAnim.setValue(0);
    
    // Animação de rotação contínua (ou agitação do dado)
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    try {
      // Pega uma página aleatória dos populares (ex: 1 a 20)
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const results = await fetchFilteredMovies(randomPage, '', null, '');
      
      if (results && results.length > 0) {
        // Pega um filme aleatório da página
        const randomMovieIndex = Math.floor(Math.random() * results.length);
        const selectedMovie = results[randomMovieIndex];
        
        // Simula um tempo de sorteio de 2 segundos
        setTimeout(() => {
          spinAnim.stopAnimation();
          spinAnim.setValue(0); // reseta
          setMovie(selectedMovie);
          
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
          
          setIsSpinning(false);
        }, 2000);
      }
    } catch (e) {
      console.error(e);
      spinAnim.stopAnimation();
      setIsSpinning(false);
    }
  };

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>O que assistir hoje?</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {!movie ? (
          <View style={styles.emptyState}>
            <Animated.View style={{ transform: [{ rotate: isSpinning ? spinInterpolation : '0deg' }] }}>
              <Ionicons name="dice" size={120} color={isSpinning ? "#E50914" : "#666"} />
            </Animated.View>
            <Text style={styles.emptyText}>
              {isSpinning ? "Sorteando um filme..." : "Deixe o acaso escolher seu próximo filme!"}
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.movieContainer, { opacity: fadeAnim }]}>
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }} 
              style={styles.poster} 
              contentFit="cover"
            />
            <Text style={styles.movieTitle}>{movie.title}</Text>
            <Text style={styles.movieOverview} numberOfLines={4}>{movie.overview}</Text>
            
            <AnimatedButton 
              style={styles.viewButton} 
              onPress={() => router.push(`/movie/${movie.id}`)}
            >
              <Text style={styles.viewButtonText}>Ver Detalhes</Text>
            </AnimatedButton>
          </Animated.View>
        )}
      </View>

      <View style={styles.footer}>
        <AnimatedButton 
          style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]} 
          onPress={spinRoulette}
          disabled={isSpinning}
        >
          <Ionicons name="shuffle" size={24} color="#fff" />
          <Text style={styles.spinButtonText}>
            {movie ? "Sortear Novamente" : "Girar Roleta"}
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyState: { alignItems: 'center', gap: 24 },
  emptyText: { color: colors.textSecondary, fontSize: 18, textAlign: 'center' },
  movieContainer: { width: '100%', alignItems: 'center', backgroundColor: colors.backgroundElement, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  poster: { width: 200, height: 300, borderRadius: 16, marginBottom: 24 },
  movieTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  movieOverview: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  viewButton: { backgroundColor: colors.border, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  viewButtonText: { color: '#fff', fontWeight: 'bold' },
  footer: { padding: 24, paddingBottom: 40 },
  spinButton: { backgroundColor: '#E50914', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 12 },
  spinButtonDisabled: { opacity: 0.7 },
  spinButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' }
});
