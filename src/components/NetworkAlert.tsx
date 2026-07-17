import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useAppTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export function NetworkAlert() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // NetInfo state.isConnected might be null on initial check, we consider false if strictly false
      if (state.isConnected === false) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  if (isConnected) {
    return null; // Return nothing if connected
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(300)}
      style={styles.overlay}
    >
      <Animated.View 
        entering={SlideInUp.duration(400).springify()} 
        exiting={SlideOutUp.duration(300)}
        style={styles.alertBox}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline-outline" size={60} color="#E50914" />
        </View>
        <Text style={styles.title}>Sem Conexão</Text>
        <Text style={styles.message}>
          Parece que você está sem internet (Wi-Fi ou dados móveis). Verifique sua conexão para continuar usando o aplicativo.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it sits on top of everything
    padding: 24,
  },
  alertBox: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});
