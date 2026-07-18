import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchFilteredMovies, getGenres } from '../../../services/api';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

export function useCatalog() {
  const [watchedStatus, setWatchedStatus] = useState<Record<number, 'watched' | 'watchlist'>>({});
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendationText, setAiRecommendationText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Genres with React Query
  const { data: genresList = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Fetch Movies with Infinite Query
  const {
    data: moviesData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['movies', debouncedSearchQuery, selectedGenres, searchYear],
    queryFn: ({ pageParam = 1 }) => fetchFilteredMovies(pageParam, debouncedSearchQuery, selectedGenres, searchYear),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // TMDB returns empty array if no more pages or if > 500
      if (lastPage.length === 0) return undefined;
      return allPages.length + 1;
    },
  });

  const moviesList = moviesData?.pages.flat() || [];

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const user = await database.getCurrentUser();
        if (user) {
          if (user.avatar_url) setUserAvatarUrl(user.avatar_url);
          
                    const watchedList = await database.getWatchedMovies(user.id);
          const statuses: Record<number, 'watched' | 'watchlist'> = {};
          watchedList.forEach((w: any) => {
            statuses[w.movieId] = w.status || 'watched';
          });
          setWatchedStatus(statuses);
        }
      };
      fetchUserData();
    }, [])
  );

  const handleManualSearch = () => {
    refetch();
  };

  const handleLoadMoreMovies = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const fetchAiRecommendation = async () => {
    setIsAiModalVisible(true);
    setIsAiLoading(true);
    setAiRecommendationText('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Fallback para usuários offline ou com login local mockado
        await new Promise(r => setTimeout(r, 1500));
        setAiRecommendationText('Como você está usando o app localmente, aqui vai uma recomendação padrão:\n\n🍿 "Tudo em Todo o Lugar ao Mesmo Tempo"\n\nUma aventura insana e premiada pelo multiverso. Ação, drama e comédia perfeitamente equilibrados!\n\n(Dica: No ambiente de produção com nuvem conectada, a IA analisará seu histórico para sugerir filmes!)');
        return;
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/ai/recommend`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      if (response.ok) {
        setAiRecommendationText(result.recommendation);
      } else {
        setAiRecommendationText(`Erro do servidor: ${result.error || 'Indisponível'}`);
      }
    } catch (error) {
      setAiRecommendationText('Ops! A IA está descansando. Erro ao conectar ao serviço de recomendação.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const formatMoviesGrid = (dataList: any[], numColumns: number) => {
    const numberOfFullRows = Math.floor(dataList.length / numColumns);
    let numberOfElementsLastRow = dataList.length - (numberOfFullRows * numColumns);
    
    const padded = [...dataList];
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
      padded.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
      numberOfElementsLastRow++;
    }
    return padded;
  };

  return {
    moviesList,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    watchedStatus,
    genresList,
    userAvatarUrl,
        searchQuery,
    setSearchQuery,
    searchYear,
    setSearchYear,
    selectedGenres,
    setSelectedGenres,
    isAiModalVisible,
    setIsAiModalVisible,
    isAiLoading,
    aiRecommendationText,
    handleManualSearch,
    handleLoadMoreMovies,
    fetchAiRecommendation,
    formatMoviesGrid,
  };
}
