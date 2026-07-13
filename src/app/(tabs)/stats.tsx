import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Loading } from '../../components/Loading';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../services/database';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const GENRE_ADJECTIVES: Record<string, string> = {
  'Ação': 'Explosivo',
  'Comédia': 'Engraçado',
  'Terror': 'Destemido',
  'Ficção científica': 'Intergalático',
  'Romance': 'Apaixonado',
  'Animação': 'Divertido',
  'Drama': 'Dramático',
  'Thriller': 'Tenso',
  'Aventura': 'Aventureiro',
  'Fantasia': 'Místico',
  'Mistério': 'Detetive',
};

const EMOTION_PHRASES: Record<string, string> = {
  'Feliz': 'Você tem um espírito leve e busca a felicidade nas telonas!',
  'Empolgado': 'Adrenalina e empolgação movem o seu coração de cinéfilo!',
  'Inspirado': 'Você absorve o melhor das histórias para a sua própria vida.',
  'Nostálgico': 'Um clássico apaixonado pelos bons tempos do cinema.',
  'Apaixonado': 'O romance e as grandes paixões dominam suas sessões.',
  'Reflexivo': 'Você gosta de filmes que alugam um triplex na sua mente.',
  'Confuso': 'Suas escolhas são complexas e cheias de mistérios sem fim.',
  'Entediado': 'Talvez seja a hora de buscar novos gêneros para se animar!',
  'Cansado': 'O cinema é seu refúgio para relaxar e fugir da rotina.',
  'Relaxado': 'Você domina a arte de usar os filmes como pura terapia.',
  'Triste': 'Você não tem medo de derramar lágrimas por uma boa história.',
  'Assustado': 'Sua coragem é testada frequentemente pelos seus filmes!',
  'Tenso': 'Suspense e tensão são os combustíveis do seu entretenimento.',
  'Revoltado': 'Você se envolve de corpo e alma com as tramas.',
  'Decepção': 'Você tem um senso crítico extremamente aguçado.'
};

export default function Stats() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [totalMovies, setTotalMovies] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [avgRating, setAvgRating] = useState('0.0');
  const [topGenres, setTopGenres] = useState<{name: string, count: number}[]>([]);
  const [topEmotions, setTopEmotions] = useState<{name: string, count: number, maxValue: number}[]>([]);
  const [realTopEmotions, setRealTopEmotions] = useState<{name: string, count: number}[]>([]);
  const [emotionPhrase, setEmotionPhrase] = useState('');
  const [gamificationTitle, setGamificationTitle] = useState('Analisando...');
  
  const viewRef = useRef<any>();

  const calculateStats = async () => {
    const currentUser = await database.getCurrentUser();
    if (!currentUser) return;

    const fullList = await database.getWatchedMovies(currentUser.id);
    const list = fullList.filter((m: any) => m.status === 'watched' || !m.status);
    
    setTotalMovies(list.length);
    
    // Total Runtime
    const minutes = list.reduce((acc: number, movie: any) => acc + (movie.runtime || 0), 0);
    setTotalMinutes(minutes);

    // Genre & Emotion Frequency & Average Rating
    const genreCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    let sumRating = 0;
    let countRating = 0;
    
    list.forEach((movie: any) => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach((g: any) => {
          genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
        });
      }
      
      if (movie.emotions && Array.isArray(movie.emotions)) {
        movie.emotions.forEach((em: string) => {
          emotionCounts[em] = (emotionCounts[em] || 0) + 1;
        });
      }

      if (movie.rating) {
        sumRating += movie.rating;
        countRating++;
      }
    });
    
    if (countRating > 0) {
      setAvgRating((sumRating / countRating).toFixed(1));
    }

    // Top Emotions for Radar Chart (Top 6)
    const sortedEmotions = Object.keys(emotionCounts)
      .map(name => ({ name, count: emotionCounts[name] }))
      .sort((a, b) => b.count - a.count);
      
    setRealTopEmotions(sortedEmotions.slice(0, 3));
    if (sortedEmotions.length > 0) {
      setEmotionPhrase(EMOTION_PHRASES[sortedEmotions[0].name] || 'Sua paleta de emoções é bem eclética!');
    } else {
      setEmotionPhrase('');
    }
      
    // Pegamos as 6 top ou preenchemos com dummy se não tiver
    let radarEmotions = sortedEmotions.slice(0, 6);
    const maxEmotionValue = Math.max(...radarEmotions.map(e => e.count), 1);
    
    while(radarEmotions.length > 0 && radarEmotions.length < 6) {
      radarEmotions.push({ name: '', count: 0 }); // preenche o resto do hexagono
    }
    
    setTopEmotions(radarEmotions.map(e => ({...e, maxValue: maxEmotionValue})));

    const sortedGenres = Object.keys(genreCounts)
      .map(name => ({ name, count: genreCounts[name] }))
      .sort((a, b) => b.count - a.count);

    setTopGenres(sortedGenres.slice(0, 3));

    // Gamification Logic
    const hours = minutes / 60;
    let timeTitle = 'Espectador';
    if (hours > 10) timeTitle = 'Cinéfilo Casual';
    if (hours > 50) timeTitle = 'Cinéfilo Dedicado';
    if (hours > 100) timeTitle = 'Viciado em Filmes';
    if (hours > 200) timeTitle = 'Diretor Honorário';

    let genreAdjective = 'Eclético';
    if (sortedGenres.length > 0) {
      const topGenreName = sortedGenres[0].name;
      genreAdjective = GENRE_ADJECTIVES[topGenreName] || 'Eclético';
    }

    setGamificationTitle(`${timeTitle} ${genreAdjective}`);

    setLoading(false);
  };
  
  const handleShare = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });
      
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = 'meu_perfil_cinefilo.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
             dialogTitle: 'Meu Perfil Cinéfilo',
          });
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      calculateStats();
    }, [])
  );

  const formatTime = (totalMinutes: number) => {
    if (totalMinutes === 0) return '0 min';

    const years = Math.floor(totalMinutes / (60 * 24 * 365));
    let remainder = totalMinutes % (60 * 24 * 365);
    
    const months = Math.floor(remainder / (60 * 24 * 30));
    remainder = remainder % (60 * 24 * 30);
    
    const weeks = Math.floor(remainder / (60 * 24 * 7));
    remainder = remainder % (60 * 24 * 7);
    
    const days = Math.floor(remainder / (60 * 24));
    remainder = remainder % (60 * 24);
    
    const hours = Math.floor(remainder / 60);
    const mins = remainder % 60;
    
    const parts = [];
    if (years > 0) parts.push(`${years}a`);
    if (months > 0) parts.push(`${months}mês`);
    if (weeks > 0) parts.push(`${weeks}sem`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}min`);
    
    return parts.join(' ');
  };

  const formattedTime = formatTime(totalMinutes);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estatísticas</Text>
        <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ViewShot ref={viewRef} options={{ format: "png", quality: 1 }} style={{ backgroundColor: '#121212' }}>
        {/* Gamification Card */}
        <View style={styles.gamificationCard}>
          <Ionicons name="trophy" size={48} color="#FFD700" />
          <Text style={styles.rankLabel}>Sua Patente</Text>
          <Text style={styles.rankTitle}>{gamificationTitle}</Text>
        </View>

      {/* Time Row (Full Width) */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={28} color="#E50914" />
          <Text style={styles.statValue}>{formattedTime}</Text>
          <Text style={styles.statLabel}>Tempo de Vida Assistido</Text>
        </View>
      </View>

      {/* Stats Row (Filmes & Média) */}
      <View style={[styles.statsRow, { marginTop: 16 }]}>
        <View style={styles.statBox}>
          <Ionicons name="film-outline" size={28} color="#E50914" />
          <Text style={styles.statValue}>{totalMovies}</Text>
          <Text style={styles.statLabel}>Filmes</Text>
        </View>
        
        <View style={styles.statBox}>
          <Ionicons name="star-outline" size={28} color="#FFD700" />
          <Text style={styles.statValue}>{avgRating}</Text>
          <Text style={styles.statLabel}>Média</Text>
        </View>
      </View>

      {/* Podium */}
      <View style={styles.podiumSection}>
        <Text style={styles.sectionTitle}>Gêneros Favoritos</Text>
        {topGenres.length > 0 ? (
          <View style={styles.podiumContainer}>
            {/* 2nd Place */}
            {topGenres[1] ? (
              <View style={styles.podiumItem}>
                <Text style={styles.podiumCount}>{topGenres[1].count}</Text>
                <View style={[styles.podiumBar, { height: 80, backgroundColor: '#C0C0C0' }]}>
                  <Text style={styles.podiumPosition}>2º</Text>
                </View>
                <Text style={styles.podiumName}>{topGenres[1].name}</Text>
              </View>
            ) : <View style={styles.podiumItem} />}

            {/* 1st Place */}
            {topGenres[0] ? (
              <View style={styles.podiumItem}>
                <Ionicons name="star" size={24} color="#FFD700" style={{marginBottom: 4}}/>
                <Text style={styles.podiumCount}>{topGenres[0].count}</Text>
                <View style={[styles.podiumBar, { height: 120, backgroundColor: '#FFD700' }]}>
                  <Text style={styles.podiumPosition}>1º</Text>
                </View>
                <Text style={styles.podiumName}>{topGenres[0].name}</Text>
              </View>
            ) : <View style={styles.podiumItem} />}

            {/* 3rd Place */}
            {topGenres[2] ? (
              <View style={styles.podiumItem}>
                <Text style={styles.podiumCount}>{topGenres[2].count}</Text>
                <View style={[styles.podiumBar, { height: 60, backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.podiumPosition}>3º</Text>
                </View>
                <Text style={styles.podiumName}>{topGenres[2].name}</Text>
              </View>
            ) : <View style={styles.podiumItem} />}
          </View>
        ) : (
          <Text style={styles.emptyText}>Avalie filmes para gerar seu pódio!</Text>
        )}
      </View>

      {/* Radar de Emoções */}
      <View style={[styles.podiumSection, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>Radar de Emoções</Text>
        
        {topEmotions.length === 6 && topEmotions[0].name !== '' ? (
          <View style={styles.radarContainer}>
            <Svg height="250" width="100%" viewBox="-40 -20 280 240">
              {/* Círculos de Fundo */}
              <Circle cx="100" cy="100" r="80" stroke="#333" strokeWidth="1" fill="none" />
              <Circle cx="100" cy="100" r="53" stroke="#333" strokeWidth="1" fill="none" />
              <Circle cx="100" cy="100" r="26" stroke="#333" strokeWidth="1" fill="none" />
              
              {/* Eixos */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const x2 = 100 + 80 * Math.cos(angle);
                const y2 = 100 + 80 * Math.sin(angle);
                return <Line key={`axis-${i}`} x1="100" y1="100" x2={x2} y2={y2} stroke="#333" strokeWidth="1" />;
              })}

              {/* Área do Radar */}
              <Polygon
                points={topEmotions.map((em, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const max = em.maxValue;
                  const ratio = max > 0 ? (em.count / max) : 0;
                  const radius = ratio * 80;
                  return `${100 + radius * Math.cos(angle)},${100 + radius * Math.sin(angle)}`;
                }).join(' ')}
                fill="rgba(229, 9, 20, 0.4)"
                stroke="#E50914"
                strokeWidth="2"
              />

              {/* Labels (fora do radar) */}
              {topEmotions.map((em, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                // Posicionar label um pouco além do raio máximo
                const labelRadius = 95;
                const lx = 100 + labelRadius * Math.cos(angle);
                const ly = 100 + labelRadius * Math.sin(angle);
                return (
                  <SvgText
                    key={`label-${i}`}
                    x={lx}
                    y={ly + 4} // ajuste visual de altura da fonte
                    fill="#fff"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {em.name}
                  </SvgText>
                );
              })}
            </Svg>

            {realTopEmotions.length > 0 && (
              <View style={styles.topEmotionsContainer}>
                <Text style={styles.topEmotionsTitle}>Suas Principais Emoções</Text>
                <View style={styles.topEmotionsRow}>
                  {realTopEmotions.map((em, index) => (
                    <View key={index} style={styles.topEmotionBadge}>
                      <Text style={styles.topEmotionBadgeText}>
                        {index + 1}º {em.name}
                      </Text>
                    </View>
                  ))}
                </View>
                {emotionPhrase ? (
                  <Text style={styles.emotionPhrase}>"{emotionPhrase}"</Text>
                ) : null}
              </View>
            )}
          </View>
        ) : (
           <Text style={styles.emptyText}>Avalie mais filmes escolhendo suas emoções para gerar o radar.</Text>
        )}
      </View>
      </ViewShot>
    </ScrollView>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center',
  },
  shareButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  gamificationCard: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  rankLabel: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  rankTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  podiumSection: {
    margin: 16,
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    minHeight: 200,
    gap: 12,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumPosition: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },
  podiumCount: {
    color: '#ccc',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  podiumName: {
    color: '#fff',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    minHeight: 32,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topEmotionsContainer: {
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
  },
  topEmotionsTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  topEmotionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  topEmotionBadge: {
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  topEmotionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emotionPhrase: {
    color: '#E50914',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  }
});
