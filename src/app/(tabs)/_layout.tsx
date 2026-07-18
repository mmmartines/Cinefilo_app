import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useNotificationBadges } from '../../contexts/NotificationBadgeContext';

export default function TabLayout() {
  const { isDark, colors } = useAppTheme();
  const { unreadFeedCount, unreadChatsCount, pendingFriendRequestsCount } = useNotificationBadges();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)'),
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
        },
        tabBarBackground: () => (
          <BlurView tint={isDark ? "dark" : "light"} intensity={80} style={StyleSheet.absoluteFill} />
        ),
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#E50914',
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="film" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Coleção',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Comunidade',
          tabBarIcon: ({ color, size }) => {
            const hasNotifications = unreadFeedCount + unreadChatsCount + pendingFriendRequestsCount > 0;
            return (
              <View>
                <Ionicons name="people" size={28} color={color} />
                {hasNotifications && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#E50914',
                    borderWidth: 2,
                    borderColor: isDark ? '#1e1e1e' : '#fff'
                  }} />
                )}
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Jornada do Herói',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E50914',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E50914',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
