import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export function NetworkEnforcer() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected && state.isConnected !== null);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Modal visible={isOffline} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <Ionicons name="cloud-offline" size={80} color="#E50914" />
        <Text style={styles.title}>Você está Offline</Text>
        <Text style={styles.subtitle}>
          A Cinelândia requer uma conexão ativa com a internet para sincronizar seus dados em tempo real.
        </Text>
        <Text style={styles.instruction}>
          Conecte-se ao Wi-Fi ou Rede Celular para continuar.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  subtitle: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  instruction: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
