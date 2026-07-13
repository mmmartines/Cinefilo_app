import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { database } from '../../../services/database';

export function useMyMovies() {
  const [userMoviesList, setUserMoviesList] = useState<any[]>([]);
  const [currentFilter, setCurrentFilter] = useState<'watched' | 'watchlist'>('watched');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchUserMoviesData = async () => {
    const user = await database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const list = await database.getWatchedMovies(user.id);
      list.sort((a: any, b: any) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      setUserMoviesList(list);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserMoviesData();
    }, [])
  );

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

  const displayedMoviesList = userMoviesList.filter(movie => 
    currentFilter === 'watched' 
      ? (movie.status === 'watched' || !movie.status) 
      : movie.status === 'watchlist'
  );

  return {
    displayedMoviesList,
    currentFilter,
    setCurrentFilter,
    currentUser,
    formatMoviesGrid,
  };
}
