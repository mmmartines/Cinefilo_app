import { useAppTheme } from '../../contexts/ThemeContext';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchFilteredMovies } from '../../services/api';
import { database } from '../../services/database';
import { useAlert } from '../../contexts/AlertContext';

export default function MatchScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { friendId, friendName } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [movies, setMovies] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Animação do card
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      // Busca filmes populares
      const results = await fetchFilteredMovies(1, '', null, '');
      setMovies(results.slice(0, 20)); // Pega os primeiros 20
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'liked' | 'passed') => {
    if (currentIndex >= movies.length) return;
    
    const currentMovie = movies[currentIndex];
    
    // Animação de saída
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: action === 'liked' ? 1.1 : 0.9,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      // Quando animação terminar:
      setCurrentIndex(prev => prev + 1);
      
      // Reseta animação para o próximo card
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      
      // Salva no banco
      const result = await database.saveMovieMatch(String(friendId), currentMovie.id, action);
      
      if (result.isMatch) {
        showAlert(
          '🔥 Deu Match! 🔥',
          `Você e ${friendName || 'seu amigo'} querem assistir "${currentMovie.title}"! Que tal marcar a sessão?`,
          [
            { text: 'Depois' },
            { 
              text: 'Ver Filme', 
              onPress: () => router.push(`/movie/${currentMovie.id}`) 
            }
          ]
        );
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 100 }} />
      </View>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match com {friendName || 'Amigo'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {currentIndex < movies.length && currentMovie ? (
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.card, 
              { 
                opacity: fadeAnim, 
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}` }}
              style={styles.poster}
              contentFit="cover"
            />
            <View style={styles.info}>
              <Text style={styles.title}>{currentMovie.title}</Text>
              <Text style={styles.overview} numberOfLines={3}>{currentMovie.overview}</Text>
            </View>
          </Animated.View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.passButton]} 
              onPress={() => handleAction('passed')}
            >
              <Ionicons name="close" size={40} color="#F44336" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.likeButton]} 
              onPress={() => handleAction('liked')}
            >
              <Ionicons name="heart" size={40} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>Sem mais filmes no momento!</Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={loadMovies}>
             <Text style={styles.reloadBtnText}>Buscar Mais</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
  },
  card: {
    width: '85%',
    height: '65%',
    backgroundColor: colors.backgroundElement,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  poster: {
    width: '100%',
    height: '75%',
  },
  info: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overview: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 32,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderWidth: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  passButton: {
    borderColor: '#F44336',
  },
  likeButton: {
    borderColor: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  reloadBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
