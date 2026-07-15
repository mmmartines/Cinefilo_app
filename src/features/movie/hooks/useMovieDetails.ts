import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getMovieDetails } from '../../../services/api';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { useAlert } from '../../../contexts/AlertContext';
import { useQuery } from '@tanstack/react-query';
import { calculateBadges } from '../../../utils/badges';

const EMOTIONS = [
  { label: '🤩 Espetacular', type: 'good', color: '#4CAF50' },
  { label: '🤯 Explodiu a cabeça', type: 'good', color: '#9C27B0' },
  { label: '😂 Muito Engraçado', type: 'good', color: '#FFEB3B' },
  { label: '😍 Apaixonante', type: 'good', color: '#E91E63' },
  { label: '😭 Chorei muito', type: 'good', color: '#2196F3' },
  { label: '👏 Brilhante', type: 'good', color: '#00BCD4' },
  { label: '✨ Lindo visual', type: 'good', color: '#009688' },
  { label: '🤔 Inteligente', type: 'good', color: '#5C6BC0' },
  { label: '🥰 Inspirador', type: 'good', color: '#8BC34A' },
  { label: '😌 Relaxante', type: 'good', color: '#8BC34A' },
  { label: '🤷 Confuso', type: 'neutral', color: '#B0BEC5' },
  { label: '😐 Mediano', type: 'neutral', color: '#A1887F' },
  { label: '🥱 Entediante', type: 'neutral', color: '#90A4AE' },
  { label: '😬 Tenso', type: 'bad', color: '#FF9800' },
  { label: '😨 Assustador', type: 'bad', color: '#7E57C2' },
  { label: '😞 Decepcionante', type: 'bad', color: '#EF5350' },
  { label: '😡 Revoltante', type: 'bad', color: '#E53935' },
  { label: '🤦 Previsível', type: 'bad', color: '#A1887F' },
  { label: '🤮 Péssimo', type: 'bad', color: '#E50914' },
];

export function useMovieDetails(movieId: string | undefined) {
  const router = useRouter();
  const { showAlert, showToast } = useAlert();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMovieWatched, setIsMovieWatched] = useState(false);
  const [isMovieInWatchlist, setIsMovieInWatchlist] = useState(false);
  
  // Rating Modal states
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [movieRating, setMovieRating] = useState(0);
  const [movieReview, setMovieReview] = useState('');
  const [hasMovieSpoiler, setHasMovieSpoiler] = useState(false);
  const [selectedMovieEmotions, setSelectedMovieEmotions] = useState<string[]>([]);
  const [userCustomLists, setUserCustomLists] = useState<any[]>([]);
  const [selectedCustomLists, setSelectedCustomLists] = useState<string[]>([]);
  
  // Chat Modal
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [isCreatingChatGroup, setIsCreatingChatGroup] = useState(false);
  
  // Trailer Modal
  const [isTrailerVisible, setIsTrailerVisible] = useState(false);
  const [trailerVideoKey, setTrailerVideoKey] = useState<string | null>(null);

  const { data: movieData, isLoading } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => getMovieDetails(Number(movieId)),
    enabled: !!movieId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  useEffect(() => {
    if (movieData && movieData.videos && movieData.videos.results) {
      const trailer = movieData.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        setTrailerVideoKey(trailer.key);
      }
    }
  }, [movieData]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await database.getCurrentUser();
      setCurrentUser(user);
      
      if (user && movieId) {
        const watchedList = await database.getWatchedMovies(user.id);
        const watched = watchedList.find((w: any) => w.movieId === Number(movieId));
        if (watched) {
          if (watched.status === 'watchlist') {
            setIsMovieInWatchlist(true);
          } else {
            setIsMovieWatched(true);
            setMovieRating(watched.rating);
            setMovieReview(watched.review || '');
            setSelectedMovieEmotions(watched.emotions || []);
          }
        }
        const lists = await database.getCustomLists(user.id);
        setUserCustomLists(lists);
        
        const inLists = lists.filter((l: any) => l.movies?.some((m: any) => m.movieId === Number(movieId))).map((l: any) => l._id || l.id);
        setSelectedCustomLists(inLists);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
          fetch(`${apiUrl}/api/friends`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          .then(r => r.json())
          .then(res => setFriendsList(res.data || []))
          .catch(e => console.log(e));
        }
      }
    };
    fetchUserData();
  }, [movieId]);

  const handleSaveMovieRating = async () => {
    if (movieRating === 0) {
      showAlert('Aviso', 'Por favor, dê uma nota de 1 a 5 estrelas.');
      return;
    }
    
    if (selectedMovieEmotions.length < 3) {
      showAlert('Aviso', 'Por favor, selecione pelo menos 3 emoções que o filme lhe causou.');
      return;
    }
    
    try {
      const watchedBefore = await database.getWatchedMovies(currentUser.id);
      const moviesBefore = watchedBefore.filter((m: any) => m.status === 'watched').length;
      const minsBefore = watchedBefore.filter((m: any) => m.status === 'watched').reduce((acc: number, m: any) => acc + (m.runtime || 0), 0);
      const badgesBefore = calculateBadges(moviesBefore, minsBefore);

      await database.saveWatchedMovie(currentUser.id, movieData, movieRating, movieReview, movieData.runtime, selectedMovieEmotions, 'watched', hasMovieSpoiler);
      
      for (const listId of selectedCustomLists) {
         await database.addMovieToCustomList(currentUser.id, listId, movieData);
      }

      setIsMovieWatched(true);
      setIsMovieInWatchlist(false);
      setIsRatingModalVisible(false);
      showAlert('Sucesso', 'Filme salvo na sua lista!');

      const watchedAfter = await database.getWatchedMovies(currentUser.id);
      const moviesAfter = watchedAfter.filter((m: any) => m.status === 'watched').length;
      const minsAfter = watchedAfter.filter((m: any) => m.status === 'watched').reduce((acc: number, m: any) => acc + (m.runtime || 0), 0);
      const badgesAfter = calculateBadges(moviesAfter, minsAfter);

      const unlockedBadges = badgesAfter.filter(ba => ba.unlocked && !badgesBefore.find(bb => bb.id === ba.id && bb.unlocked));
      
      if (unlockedBadges.length > 0) {
        unlockedBadges.forEach((badge, index) => {
          setTimeout(() => {
            showToast(`Conquista Desbloqueada: ${badge.name}`, badge.icon, badge.color);
            
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) {
                const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
                fetch(`${apiUrl}/api/feed`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                  body: JSON.stringify({ action: 'unlocked_badge', badge })
                }).catch(console.error);
              }
            });
          }, 1000 + (index * 3500));
        });
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível salvar o filme.');
    }
  };

  const handleAddMovieToWatchlist = async () => {
    try {
      await database.saveWatchedMovie(currentUser.id, movieData, 0, '', movieData.runtime, [], 'watchlist');
      setIsMovieInWatchlist(true);
      showAlert('Sucesso', 'Adicionado à sua Watchlist!');
    } catch (error) {
      showAlert('Erro', 'Não foi possível salvar.');
    }
  };

  const handleRemoveMovieData = async () => {
    try {
      await database.removeWatchedMovie(currentUser.id, movieData.id);
      setIsMovieWatched(false);
      setIsMovieInWatchlist(false);
      setMovieRating(0);
      setMovieReview('');
      setHasMovieSpoiler(false);
      setSelectedMovieEmotions([]);
      setIsRatingModalVisible(false);
      showAlert('Sucesso', 'Filme removido da sua lista.');
    } catch (error) {
      showAlert('Erro', 'Não foi possível remover o filme.');
    }
  };

  const handleCreateMovieChatGroup = async () => {
    if (selectedFriends.length === 0) {
      showAlert('Aviso', 'Selecione pelo menos um amigo.');
      return;
    }
    
    setIsCreatingChatGroup(true);
    try {
      const friendsToAdd = selectedFriends.map(f => ({ id: f.id, name: f.name }));
      
      const newChat = await database.createChatGroup(
        movieData.id, 
        movieData.title, 
        movieData.poster_path, 
        friendsToAdd,
        currentUser.name || 'Eu'
      );
      
      setIsChatModalVisible(false);
      setSelectedFriends([]);
      showAlert('Sucesso', 'Clube do Filme criado!');
      router.push(`/chat/${newChat.id}`);
    } catch (e: any) {
      showAlert('Erro', 'Não foi possível criar o chat.');
    } finally {
      setIsCreatingChatGroup(false);
    }
  };

  const getMovieCertification = () => {
    if (!movieData?.release_dates?.results) return 'N/A';
    const brRelease = movieData.release_dates.results.find((r: any) => r.iso_3166_1 === 'BR');
    if (brRelease && brRelease.release_dates.length > 0) {
      const cert = brRelease.release_dates[0].certification;
      return cert || 'L';
    }
    return 'L';
  };

  return {
    movieData,
    isLoading,
    isMovieWatched,
    isMovieInWatchlist,
    isRatingModalVisible,
    setIsRatingModalVisible,
    movieRating,
    setMovieRating,
    movieReview,
    setMovieReview,
    hasMovieSpoiler,
    setHasMovieSpoiler,
    selectedMovieEmotions,
    setSelectedMovieEmotions,
    userCustomLists,
    selectedCustomLists,
    setSelectedCustomLists,
    isChatModalVisible,
    setIsChatModalVisible,
    friendsList,
    selectedFriends,
    setSelectedFriends,
    isCreatingChatGroup,
    isTrailerVisible,
    setIsTrailerVisible,
    trailerVideoKey,
    EMOTIONS,
    handleSaveMovieRating,
    handleAddMovieToWatchlist,
    handleRemoveMovieData,
    handleCreateMovieChatGroup,
    getMovieCertification,
  };
}
