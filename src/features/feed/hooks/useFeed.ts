import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { cache } from '../../../services/cache';

export function useFeed() {
  const [feedActivities, setFeedActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const fetchFeedData = async () => {
    try {
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        setIsOffline(true);
        const cached = await cache.get('feed');
        if (cached) setFeedActivities(cached);
        return;
      }
      
      setIsOffline(false);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/feed`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      if (response.ok) {
        setFeedActivities(result.data);
        cache.set('feed', result.data);
      }
    } catch (e) {
      console.error(e);
      setIsOffline(true);
      const cached = await cache.get('feed');
      if (cached) setFeedActivities(cached);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      database.getCurrentUser().then(setCurrentUser);
      fetchFeedData();
    }, [])
  );

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    fetchFeedData();
  };

  const toggleLikeActivity = async (activityId: string) => {
    const previousFeed = [...feedActivities];
    setFeedActivities(prev => prev.map(activity => {
      if (activity._id === activityId) {
        const hasLiked = currentUser && activity.likes?.includes(currentUser.id);
        const newLikes = hasLiked
          ? activity.likes.filter((id: string) => id !== currentUser.id)
          : [...(activity.likes || []), currentUser.id];
        return { ...activity, likes: newLikes };
      }
      return activity;
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      await fetch(`${apiUrl}/api/feed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ activity_id: activityId })
      });
    } catch (e) {
      console.error(e);
      setFeedActivities(previousFeed);
    }
  };

  const toggleSpoilerVisibility = (activityId: string) => {
    setRevealedSpoilers(prev => [...prev, activityId]);
  };

  return {
    feedActivities,
    isLoading,
    isRefreshing,
    currentUser,
    revealedSpoilers,
    isOffline,
    handleRefreshFeed,
    toggleLikeActivity,
    toggleSpoilerVisibility,
  };
}
