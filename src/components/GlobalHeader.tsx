import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAppTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './NotificationBell';
import { database } from '../services/database';

interface GlobalHeaderProps {
  title: string;
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
}

export function GlobalHeader({ title, rightComponent, showBackButton }: GlobalHeaderProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load avatar on mount
    database.getCurrentUser().then(user => {
      if (user?.avatar_url) setUserAvatarUrl(user.avatar_url);
    });
    
    // Subscribe to auth changes to update avatar if changed
    const unsubscribe = database.subscribeAuth((user: any) => {
      if (user?.avatar_url) setUserAvatarUrl(user.avatar_url);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 16 }]}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      <View style={styles.rightContainer}>
        {rightComponent}
        <NotificationBell />
        <TouchableOpacity 
          style={styles.profileIcon} 
          onPress={() => router.push('/profile')}
        >
          {userAvatarUrl ? (
            <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start'
  },
  headerTitle: {
    flex: 2,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center'
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16
  }
});
