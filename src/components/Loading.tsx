import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export function Loading() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Text style={styles.popcorn}>🍿</Text>
      </Animated.View>
      <Text style={styles.text}>Preparando a sessão...</Text>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    minHeight: 150,
  },
  popcorn: {
    fontSize: 48,
    marginBottom: 16,
  },
  text: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
