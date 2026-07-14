import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchFilteredMovies, getGenres } from '../../../services/api';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

export function useCatalog() {
  const [watchedStatus, setWatchedStatus] = useState<Record<number, 'watched' | 'watchlist'>>({});
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendationText, setAiRecommendationText] = useState('');

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
    queryKey: ['movies', searchQuery, selectedGenreId, searchYear],
    queryFn: ({ pageParam = 1 }) => fetchFilteredMovies(pageParam, searchQuery, selectedGenreId, searchYear),
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
          
          const challenge = database.getWeeklyChallenge();
          setCurrentChallenge(challenge);
          const completed = await database.isWeeklyChallengeCompleted(user.id, challenge.weekId);
          setIsChallengeCompleted(completed);
          
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
      if (!session) throw new Error('Not authenticated');

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
        setAiRecommendationText('Could not get recommendations at this time.');
      }
    } catch (error) {
      setAiRecommendationText('Error connecting to the Artificial Intelligence service.');
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
    currentChallenge,
    isChallengeCompleted,
    searchQuery,
    setSearchQuery,
    searchYear,
    setSearchYear,
    selectedGenreId,
    setSelectedGenreId,
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
