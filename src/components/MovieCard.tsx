import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
}

interface Props {
  movie: Movie;
  status?: 'watched' | 'watchlist';
}

export function MovieCard({ movie, status }: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const scale = useSharedValue(1);

  let isNowPlaying = false;
  if (movie.release_date) {
    const release = new Date(movie.release_date);
    const now = new Date();
    const diffTime = now.getTime() - release.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays >= 0 && diffDays <= 45) {
      isNowPlaying = true;
    }
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Pressable
      style={{ flex: 1 }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => router.push(`/movie/${movie.id}`)}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.posterContainer}>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w200${movie.poster_path}` }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
          {status && <View style={styles.overlay} />}
        </View>
        
        {isNowPlaying && !status && (
          <View style={styles.nowPlayingTag}>
            <Ionicons name="film" size={10} color="#fff" />
            <Text style={styles.nowPlayingText}>Em Cartaz</Text>
          </View>
        )}
        
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
      </Animated.View>
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: colors.backgroundElement,
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
    ...StyleSheet.absoluteFill,
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
  nowPlayingTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(229, 9, 20, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nowPlayingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
