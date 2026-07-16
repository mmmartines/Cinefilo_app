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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'me' | 'social'>('social');
  const [page, setPage] = useState(1);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const fetchFeedData = async (reset = false, targetTab = activeTab) => {
    try {
      const state = await NetInfo.fetch();
      
      if (!state.isConnected) {
        setIsOffline(true);
        const cached = await cache.get(`feed_${targetTab}`);
        if (cached && reset) setFeedActivities(cached);
        return;
      }
      
      setIsOffline(false);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const currentPage = reset ? 1 : page;
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/feed?tab=${targetTab}&page=${currentPage}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      if (response.ok) {
        if (reset) {
          setFeedActivities(result.data);
          setPage(2);
          setHasMore(result.data.length === 10);
          cache.set(`feed_${targetTab}`, result.data);
        } else {
          setFeedActivities(prev => [...prev, ...result.data]);
          setPage(prev => prev + 1);
          setHasMore(result.data.length === 10);
        }
      }
    } catch (e) {
      console.error(e);
      setIsOffline(true);
      if (reset) {
         const cached = await cache.get(`feed_${targetTab}`);
         if (cached) setFeedActivities(cached);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      database.getCurrentUser().then(setCurrentUser);
      fetchFeedData(true, activeTab);
    }, [activeTab])
  );

  const changeTab = (tab: 'me' | 'social') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIsLoading(true);
    fetchFeedData(true, tab);
  };

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    fetchFeedData(true, activeTab);
  };

  const loadMore = () => {
    if (isLoadingMore || !hasMore || isOffline) return;
    setIsLoadingMore(true);
    fetchFeedData(false, activeTab);
  };

  const handleReaction = async (activityId: string, reactionType: string) => {
    const previousFeed = [...feedActivities];
    
    // Atualização otimista
    setFeedActivities(prev => prev.map(activity => {
      if (activity._id === activityId) {
        let reactions = [...(activity.reactions || [])];
        const existingIndex = reactions.findIndex((r: any) => r.user_id === currentUser?.id);
        
        if (existingIndex > -1) {
           if (reactions[existingIndex].type === reactionType) {
              reactions.splice(existingIndex, 1);
           } else {
              reactions[existingIndex].type = reactionType;
           }
        } else {
           reactions.push({
             user_id: currentUser?.id,
             type: reactionType,
             user_name: currentUser?.name
           });
        }
        return { ...activity, reactions };
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
        body: JSON.stringify({ activity_id: activityId, reaction_type: reactionType })
      });
    } catch (e) {
      console.error(e);
      setFeedActivities(previousFeed); // Rollback
    }
  };

  const toggleSpoilerVisibility = (activityId: string) => {
    setRevealedSpoilers(prev => [...prev, activityId]);
  };

  return {
    feedActivities,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    activeTab,
    changeTab,
    currentUser,
    revealedSpoilers,
    isOffline,
    handleRefreshFeed,
    loadMore,
    handleReaction,
    toggleSpoilerVisibility,
  };
}
