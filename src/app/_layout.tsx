import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { database } from '../services/database';
import { supabase } from '../services/supabase';
import { NetworkAlert } from '../components/NetworkAlert';
import { NetworkEnforcer } from '../components/NetworkEnforcer';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { AlertProvider } from '../contexts/AlertContext';
import { SyncProvider, useSync } from '../contexts/SyncContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Text, TextInput } from 'react-native';

// @ts-ignore
if (Text.defaultProps == null) Text.defaultProps = {};
// @ts-ignore
Text.defaultProps.style = { fontFamily: 'Inter_400Regular' };
// @ts-ignore
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
// @ts-ignore
TextInput.defaultProps.style = { fontFamily: 'Inter_400Regular' };

function AppContent({ isAuthenticated, fontsLoaded, segments }: { isAuthenticated: boolean | null, fontsLoaded: boolean, segments: string[] }) {
  const router = useRouter();
  const { forceSync } = useSync();
  const navigationState = useRootNavigationState();

  const hasSynced = useRef(false);

  useEffect(() => {
    if (isAuthenticated === null) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
      hasSynced.current = false;
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    } else if (isAuthenticated && !inAuthGroup) {
      // Assim que autentica e não está nas telas de login, força o sync APENAS 1 VEZ
      if (!hasSynced.current) {
        hasSynced.current = true;
        forceSync();
      }
    }
  }, [isAuthenticated, segments, navigationState?.key]);

  if (isAuthenticated === null || !fontsLoaded) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <NetworkAlert />
      <NetworkEnforcer />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        if (NavigationBar && NavigationBar.setVisibilityAsync) {
          NavigationBar.setVisibilityAsync("hidden").catch(() => {});
        }
        if (NavigationBar && NavigationBar.setBehaviorAsync) {
          NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => {});
        }
      } catch (e) {
        console.warn(e);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        database.getCurrentUser().then(user => {
           if (user) {
             registerForPushNotificationsAsync().then(token => {
               if (token) database.savePushToken(token);
             });
           }
        });
      } else {
        AsyncStorage.removeItem('@cinefilo_current_user');
      }
      SplashScreen.hideAsync();
    });

    const unsubscribe = database.subscribeAuth((user: any) => {
      setIsAuthenticated(!!user);
      if (user) {
        registerForPushNotificationsAsync().then(token => {
          if (token) database.savePushToken(token);
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const localUser = await database.getCurrentUser();
        if (!localUser || localUser.id !== session.user.id) {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
          try {
            const response = await fetch(`${apiUrl}/api/users`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              }
            });
            let tag = '';
            if (response.ok) {
              const apiData = await response.json();
              tag = apiData.data?.tag || '';
            }
            await database.setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
              tag: tag
            });
          } catch (err) {
            await database.setCurrentUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
              tag: ''
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        await database.logout();
      }
    });

    return () => {
      unsubscribe();
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AlertProvider>
          <SyncProvider>
            <AppContent isAuthenticated={isAuthenticated} fontsLoaded={fontsLoaded} segments={segments} />
          </SyncProvider>
        </AlertProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
