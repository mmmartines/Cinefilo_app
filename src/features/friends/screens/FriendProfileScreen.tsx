import { useAppTheme } from '../../../contexts/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MovieCard } from '../../../components/MovieCard';
import { Loading } from '../../../components/Loading';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { useFriendProfile } from '../hooks/useFriendProfile';

type TabType = 'resumo' | 'filmes';

interface FriendProfileScreenProps {
  id: string | string[] | undefined;
}

export function FriendProfileScreen({ id }: FriendProfileScreenProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('resumo');

  const { friend, isLoading, affinity, formatRuntime, formatMoviesGrid } = useFriendProfile(id);

  if (isLoading) return <Loading />;

  if (!friend) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Perfil não encontrado ou acesso negado.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friend.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resumo' && styles.activeTab]}
          onPress={() => setActiveTab('resumo')}
        >
          <Text style={[styles.tabText, activeTab === 'resumo' && styles.activeTabText]}>Resumo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'filmes' && styles.activeTab]}
          onPress={() => setActiveTab('filmes')}
        >
          <Text style={[styles.tabText, activeTab === 'filmes' && styles.activeTabText]}>Filmes Assistidos</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'resumo' ? (
        <View style={styles.resumoContainer}>
          <View style={styles.avatarSection}>
            {friend.avatar_url ? (
              <Image source={{ uri: friend.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#666" />
              </View>
            )}
          </View>

          <View style={styles.affinityCard}>
            <View style={styles.affinityHeader}>
              <Ionicons name="flame" size={24} color={affinity > 50 ? "#FF5722" : "#666"} />
              <Text style={styles.affinityTitle}>Afinidade Cinematográfica</Text>
            </View>
            <View style={styles.affinityBarContainer}>
              <View style={[styles.affinityBarFill, { width: `${affinity}%`, backgroundColor: affinity > 50 ? '#FF5722' : colors.textSecondary }]} />
            </View>
            <Text style={styles.affinityValue}>{affinity}% de compatibilidade</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="film-outline" size={40} color="#E50914" />
            <Text style={styles.statValue}>{friend.stats?.total_movies || 0}</Text>
            <Text style={styles.statLabel}>Filmes Assistidos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={40} color="#E50914" />
            <Text style={styles.statValue}>{formatRuntime(friend.stats?.total_minutes || 0)}</Text>
            <Text style={styles.statLabel}>Tempo de Tela</Text>
          </View>
          <View style={styles.tagCard}>
            <Text style={styles.statLabel}>@apelido:</Text>
            <Text style={styles.tagText}>@{friend.nickname || friend.tag}</Text>
          </View>

          <AnimatedButton
            style={styles.matchButton}
            onPress={() => router.push({ pathname: '/match/[friendId]', params: { friendId: friend.id, friendName: friend.name } })}
          >
            <Ionicons name="flame" size={24} color="#fff" />
            <Text style={styles.matchButtonText}>Match de Filmes</Text>
          </AnimatedButton>
        </View>
      ) : (
        <FlatList
          data={formatMoviesGrid(friend.watched_movies || [], 4)}
          keyExtractor={(item, index) => item.empty ? `empty-${index}` : `${item.movieId}-${index}`}
          numColumns={4}
          renderItem={({ item }) => {
            if (item.empty) {
              return <View style={{ flex: 1, margin: 4, backgroundColor: 'transparent' }} />;
            }
            const movieFormatted = {
              id: item.movieId,
              title: item.title,
              poster_path: item.poster_path,
              backdrop_path: item.backdrop_path,
            };
            return (
              <View style={styles.movieWrapper} pointerEvents="none">
                <MovieCard movie={movieFormatted} status="watched" />
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Este amigo ainda não avaliou nenhum filme.</Text>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { color: colors.text, fontSize: 16, marginBottom: 16 },
  backButton: { backgroundColor: '#E50914', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.backgroundElement },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  backIcon: { padding: 8, width: 40, alignItems: 'flex-start' },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.backgroundElement, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#E50914' },
  tabText: { color: colors.textSecondary, fontSize: 16, fontWeight: 'bold' },
  activeTabText: { color: colors.text },
  resumoContainer: { flex: 1, padding: 24, gap: 16 },
  affinityCard: { backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 8 },
  affinityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  affinityTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  affinityBarContainer: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  affinityBarFill: { height: '100%', borderRadius: 4 },
  affinityValue: { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  statCard: { backgroundColor: colors.backgroundElement, padding: 24, borderRadius: 16, alignItems: 'center' },
  tagCard: { backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  statValue: { color: colors.text, fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  tagText: { color: '#E50914', fontSize: 18, fontWeight: 'bold' },
  listContent: { paddingVertical: 8, paddingHorizontal: 12 },
  columnWrapper: { justifyContent: 'flex-start' },
  movieWrapper: { flex: 1, opacity: 0.9 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  matchButton: { backgroundColor: '#E50914', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8, marginTop: 8 },
  matchButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
