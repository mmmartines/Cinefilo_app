import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { database } from '../services/database';
import { NetworkAlert } from '../components/NetworkAlert';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

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

    const checkUser = async () => {
      const user = await database.getCurrentUser();
      setIsAuthenticated(!!user);
      SplashScreen.hideAsync(); // Hide splash after checking auth
    };
    checkUser();

    const unsubscribe = database.subscribeAuth((user: any) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth screens
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from login if authenticated
      router.replace('/');
    }
  }, [isAuthenticated, segments]);

  if (isAuthenticated === null) {
    return null; // or a loading spinner
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      <NetworkAlert />
    </ThemeProvider>
  );
}
