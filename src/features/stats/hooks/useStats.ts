import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { database } from '../../../services/database';
import { calculateBadges, Badge } from '../../../utils/badges';

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

export function useStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalMoviesWatched, setTotalMoviesWatched] = useState(0);
  const [totalMinutesWatched, setTotalMinutesWatched] = useState(0);
  const [averageRating, setAverageRating] = useState('0.0');
  const [topGenres, setTopGenres] = useState<{name: string, count: number}[]>([]);
  const [radarEmotions, setRadarEmotions] = useState<{name: string, count: number, maxValue: number}[]>([]);
  const [realTopEmotions, setRealTopEmotions] = useState<{name: string, count: number}[]>([]);
  const [emotionPhrase, setEmotionPhrase] = useState('');
  const [gamificationTitle, setGamificationTitle] = useState('Analisando...');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  const [currentXp, setCurrentXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [nextLevelXp, setNextLevelXp] = useState(100);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  
  const viewShotRef = useRef<any>();

  const calculateUserStats = async () => {
    const currentUser = await database.getCurrentUser();
    if (!currentUser) return;
    setUserAvatarUrl(currentUser.avatar_url || null);

    const fullList = await database.getWatchedMovies(currentUser.id);
    const watchedList = fullList.filter((m: any) => m.status === 'watched' || !m.status);
    
    setTotalMoviesWatched(watchedList.length);
    
    const minutes = watchedList.reduce((acc: number, movie: any) => acc + (movie.runtime || 0), 0);
    setTotalMinutesWatched(minutes);

    const genreCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    let sumRating = 0;
    let countRating = 0;
    
    watchedList.forEach((movie: any) => {
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
      setAverageRating((sumRating / countRating).toFixed(1));
    }

    const sortedEmotions = Object.keys(emotionCounts)
      .map(name => ({ name, count: emotionCounts[name] }))
      .sort((a, b) => b.count - a.count);
      
    setRealTopEmotions(sortedEmotions.slice(0, 3));
    if (sortedEmotions.length > 0) {
      setEmotionPhrase(EMOTION_PHRASES[sortedEmotions[0].name] || 'Sua paleta de emoções é bem eclética!');
    } else {
      setEmotionPhrase('');
    }
      
    let radarData = sortedEmotions.slice(0, 6);
    const maxEmotionValue = Math.max(...radarData.map(e => e.count), 1);
    
    while(radarData.length > 0 && radarData.length < 6) {
      radarData.push({ name: '', count: 0 }); 
    }
    
    setRadarEmotions(radarData.map(e => ({...e, maxValue: maxEmotionValue})));

    const sortedGenres = Object.keys(genreCounts)
      .map(name => ({ name, count: genreCounts[name] }))
      .sort((a, b) => b.count - a.count);

    setTopGenres(sortedGenres.slice(0, 3));

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

    const userLists = await database.getCustomLists(currentUser.id);
    let friendsCount = 0;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        const response = await fetch(`${apiUrl}/api/friends`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const result = await response.json();
          friendsCount = (result.data || []).length;
        }
      }
    } catch (e) {
    }

    const bonusXp = await database.getBonusXp(currentUser.id);
    const calculatedXp = (watchedList.length * 10) + (userLists.length * 50) + (friendsCount * 20) + bonusXp;
    const calculatedLevel = Math.floor(calculatedXp / 100) + 1;
    const nextXp = calculatedLevel * 100;
    
    setCurrentXp(calculatedXp);
    setCurrentLevel(calculatedLevel);
    setNextLevelXp(nextXp);

    const newBadges = calculateBadges(watchedList.length, minutes);
    setUserBadges(newBadges);

    setIsLoading(false);
  };
  
  const handleShareStats = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });
      
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = 'meu_perfil_cinelandia.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
             dialogTitle: 'Meu Perfil Cinelândia',
          });
        }
      }
    } catch (err) {
      console.error('Erro ao compartilhar', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      calculateUserStats();
    }, [])
  );

  const formatWatchTime = (totalMinutes: number) => {
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

  const formattedWatchTime = formatWatchTime(totalMinutesWatched);

  return {
    isLoading,
    totalMoviesWatched,
    averageRating,
    topGenres,
    radarEmotions,
    realTopEmotions,
    emotionPhrase,
    gamificationTitle,
    userAvatarUrl,
    currentXp,
    currentLevel,
    nextLevelXp,
    userBadges,
    viewShotRef,
    handleShareStats,
    formattedWatchTime,
  };
}
