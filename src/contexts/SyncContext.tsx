import { useAppTheme } from './ThemeContext';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { database } from '../services/database';

interface SyncContextData {
  isSyncing: boolean;
  forceSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextData>({} as SyncContextData);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [isSyncing, setIsSyncing] = useState(false);

  const forceSync = async () => {
    try {
      setIsSyncing(true);
      const user = await database.getCurrentUser();
      if (!user) return;
      
      // Sincroniza da nuvem pro local fazendo merge bidirecional
      await database.syncCloudToLocal(user.id);
      
      // Envia os dados atuais do local de volta pra nuvem
      await database.syncStatsToCloud(user.id);
      
    } catch (error) {
      console.error('Erro na sincronização global:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider value={{ isSyncing, forceSync }}>
      {children}
      
      {/* Overlay global de sincronização */}
      <Modal transparent visible={isSyncing} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.box}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.text}>Carregando seus dados...</Text>
            <Text style={styles.subtext}>Por favor aguarde</Text>
          </View>
        </View>
      </Modal>
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync deve ser usado dentro de um SyncProvider');
  }
  return context;
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  box: {
    backgroundColor: colors.backgroundElement,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: '80%',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  }
});
