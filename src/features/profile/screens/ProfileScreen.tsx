import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useProfile } from '../hooks/useProfile';
import { useStats } from '../../stats/hooks/useStats';
import { useAppTheme } from '../../../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { useAlert } from '../../../contexts/AlertContext';
import { FeedScreen } from '../../feed/screens/FeedScreen';

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const [activeTab, setActiveTab] = useState<'resumo' | 'atividades'>('resumo');

  const {
    userProfile,
    userAvatarUrl,
    userName,
  } = useProfile();

  const {
    totalMoviesWatched,
    formattedWatchTime,
    currentXp,
    currentLevel,
  } = useStats();

  if (!userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Carregando perfil...</Text>
      </View>
    );
  }

  const estimatedXp = currentXp;
  const estimatedLevel = currentLevel;
  const totalMovies = totalMoviesWatched;
  const totalMinutes = formattedWatchTime;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Ionicons name="settings-outline" color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resumo' && styles.activeTab]}
          onPress={() => setActiveTab('resumo')}
        >
          <Text style={[styles.tabText, activeTab === 'resumo' && styles.activeTabText]}>Resumo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'atividades' && styles.activeTab]}
          onPress={() => setActiveTab('atividades')}
        >
          <Text style={[styles.tabText, activeTab === 'atividades' && styles.activeTabText]}>Minhas Atividades</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'resumo' ? (
        <View style={styles.resumoContainer}>
          <View style={styles.avatarSection}>
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#666" />
              </View>
            )}
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Nível {estimatedLevel}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="film-outline" size={32} color="#E50914" />
              <Text style={styles.statValue}>{totalMovies}</Text>
              <Text style={styles.statLabel}>Filmes Assistidos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={32} color="#E50914" />
              <Text style={styles.statValue}>{estimatedXp}</Text>
              <Text style={styles.statLabel}>XP Total (Nível {estimatedLevel})</Text>
            </View>
          </View>

          <View style={styles.watchTimeCard}>
            <View style={styles.watchTimeIconContainer}>
              <Ionicons name="time" size={36} color="#E50914" />
            </View>
            <View style={styles.watchTimeInfo}>
              <Text style={styles.statLabel}>Tempo Total de Tela</Text>
              <Text style={styles.watchTimeValue}>{totalMinutes}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.tagCard}
            onPress={async () => {
              if (userProfile?.nickname || userProfile?.tag) {
                await Clipboard.setStringAsync(`@${userProfile.nickname || userProfile.tag}`);
                showAlert('Copiado!', 'Apelido copiado para a área de transferência.');
              }
            }}
          >
            <Text style={styles.statLabel}>Seu @apelido:</Text>
            <View style={styles.tagRow}>
              <Text style={styles.tagText}>@{userProfile?.nickname || userProfile?.tag || '...'}</Text>
              <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FeedScreen tab="me" />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.backgroundElement, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  backButton: { width: 40 },
  settingsButton: { padding: 8, width: 40, alignItems: 'flex-end' },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.backgroundElement, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#E50914' },
  tabText: { color: colors.textSecondary, fontSize: 16, fontWeight: 'bold' },
  activeTabText: { color: colors.text },
  resumoContainer: { flex: 1, padding: 24, gap: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  userName: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  levelBadge: { backgroundColor: '#E50914', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  levelText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' },
  watchTimeCard: { flexDirection: 'row', backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  watchTimeIconContainer: { backgroundColor: 'rgba(229, 9, 20, 0.1)', padding: 12, borderRadius: 12, marginRight: 16 },
  watchTimeInfo: { flex: 1 },
  watchTimeValue: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  tagCard: { backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  tagText: { color: '#E50914', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
});
