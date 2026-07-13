import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';

export function useFriendProfile(id: string | string[] | undefined) {
  const router = useRouter();
  const [friend, setFriend] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [affinity, setAffinity] = useState<number>(0);

  useEffect(() => {
    const fetchFriendDetails = async () => {
      if (!id) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
        const response = await fetch(`${apiUrl}/api/friends?id=${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const friendData = result.data;
          setFriend(friendData);

          // Calculate affinity based on common watched movies
          try {
            const myWatched = await database.getWatchedMovies(session.user.id);
            const myWatchedIds = new Set(myWatched.map((m: any) => m.movieId));
            const friendWatched = friendData.watched_movies || [];

            if (myWatchedIds.size > 0 && friendWatched.length > 0) {
              const commonCount = friendWatched.filter((m: any) => myWatchedIds.has(m.movieId)).length;
              const minSize = Math.min(myWatchedIds.size, friendWatched.length);
              const baseAffinity = Math.round((commonCount / minSize) * 100);
              const volumeBoost = Math.min(15, commonCount);
              setAffinity(Math.min(100, baseAffinity + volumeBoost));
            } else {
              setAffinity(0);
            }
          } catch (e) {
            console.error('Error calculating affinity', e);
          }
        }
      } catch (e) {
        console.error('Error fetching friend profile', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendDetails();
  }, [id]);

  const formatRuntime = (minutes: number) => {
    if (!minutes) return '0h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
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
    friend,
    isLoading,
    affinity,
    formatRuntime,
    formatMoviesGrid,
  };
}
