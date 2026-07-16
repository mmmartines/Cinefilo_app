import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useFeed() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'me' | 'social'>('social');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Focus effect to update offline state and current user
  useFocusEffect(
    useCallback(() => {
      database.getCurrentUser().then(setCurrentUser);
      NetInfo.fetch().then(state => setIsOffline(!state.isConnected));
    }, [])
  );

  const fetchFeedPage = async ({ pageParam = 1, queryKey }: any) => {
    const [, tab] = queryKey;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
    const response = await fetch(`${apiUrl}/api/feed?tab=${tab}&page=${pageParam}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch feed');
    const result = await response.json();
    return {
      data: result.data,
      nextPage: result.data.length === 10 ? pageParam + 1 : undefined
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['feed', activeTab],
    queryFn: fetchFeedPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Flatten infinite query pages into a single array
  const feedActivities = data ? data.pages.flatMap(page => page.data) : [];

  const changeTab = (tab: 'me' | 'social') => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  const handleRefreshFeed = () => {
    refetch();
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage && !isOffline) {
      fetchNextPage();
    }
  };

  const reactionMutation = useMutation({
    mutationFn: async ({ activityId, reactionType }: { activityId: string, reactionType: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/feed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ activity_id: activityId, reaction_type: reactionType })
      });
      if (!response.ok) throw new Error('Failed to react');
    },
    onMutate: async ({ activityId, reactionType }) => {
      await queryClient.cancelQueries({ queryKey: ['feed', activeTab] });
      const previousData = queryClient.getQueryData(['feed', activeTab]);

      queryClient.setQueryData(['feed', activeTab], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((activity: any) => {
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
            })
          }))
        };
      });

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['feed', activeTab], context?.previousData);
    },
    onSettled: () => {
      // Opt: queryClient.invalidateQueries({ queryKey: ['feed', activeTab] });
    }
  });

  const handleReaction = (activityId: string, reactionType: string) => {
    reactionMutation.mutate({ activityId, reactionType });
  };

  const toggleSpoilerVisibility = (activityId: string) => {
    setRevealedSpoilers(prev => [...prev, activityId]);
  };

  return {
    feedActivities,
    isLoading: isLoading && isFetching && !isFetchingNextPage, // Initial loading state
    isRefreshing: isFetching && !isFetchingNextPage && !isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
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
