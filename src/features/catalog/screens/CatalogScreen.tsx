import { NotificationBell } from '../../../components/NotificationBell';
import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MovieCard } from '../../../components/MovieCard';
import { Loading } from '../../../components/Loading';
import { Skeleton } from '../../../components/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCatalog } from '../hooks/useCatalog';
import { useAppTheme } from '../../../contexts/ThemeContext';

export function CatalogScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    moviesList,
    isLoading,
    isLoadingMore,
    watchedStatus,
    genresList,
    userAvatarUrl,
    searchQuery,
    setSearchQuery,
    searchYear,
    setSearchYear,
    selectedGenreId,
    setSelectedGenreId,
    isAiModalVisible,
    setIsAiModalVisible,
    isAiLoading,
    aiRecommendationText,
    currentChallenge,
    isChallengeCompleted,
    handleManualSearch,
    handleLoadMoreMovies,
    fetchAiRecommendation,
    formatMoviesGrid,
  } = useCatalog();



  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Cinelândia 🍿</Text>
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

      <View style={styles.filterContainer}>
        {/* Desafio Semanal */}
        {currentChallenge && (
          <View style={[styles.challengeBanner, isChallengeCompleted && { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
            <View style={styles.challengeHeader}>
              <Ionicons name={isChallengeCompleted ? "checkmark-circle" : "star"} size={16} color={isChallengeCompleted ? "#4CAF50" : "#FFD700"} />
              <Text style={[styles.challengeTitle, isChallengeCompleted && { color: '#4CAF50' }]}>
                {isChallengeCompleted ? "Desafio Concluído!" : "Desafio da Semana"}
              </Text>
            </View>
            <Text style={styles.challengeText}>
              {isChallengeCompleted ? "Você garantiu seu XP bônus!" : currentChallenge.desc}
            </Text>
            {!isChallengeCompleted && (
              <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
                Recompensa: +{currentChallenge.xp} XP
              </Text>
            )}
          </View>
        )}

        {/* Busca por Nome e Ano */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nome do filme..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleManualSearch}
          />
          <TextInput
            style={styles.yearInput}
            placeholder="Ano"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={4}
            value={searchYear}
            onChangeText={setSearchYear}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Categorias (Gêneros) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
          <TouchableOpacity 
            style={[styles.genrePill, selectedGenreId === null && styles.genrePillActive]}
            onPress={() => setSelectedGenreId(null)}
          >
            <Text style={[styles.genreText, selectedGenreId === null && styles.genreTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genrePill, selectedGenreId === -1 && styles.genrePillActive]}
            onPress={() => setSelectedGenreId(-1)}
          >
            <Text style={[styles.genreText, selectedGenreId === -1 && styles.genreTextActive]}>🔥 Em Cartaz</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genrePill, { backgroundColor: '#FF6600' }]}
            onPress={() => router.push('/upcoming')}
          >
            <Text style={[styles.genreText, { color: colors.text, fontWeight: 'bold' }]}>📅 Em Breve</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.genrePill}
            onPress={() => router.push('/cinemas')}
          >
            <Text style={styles.genreText}>📍 Cinemas Próximos</Text>
          </TouchableOpacity>

          {genresList.map((g) => (
            <TouchableOpacity 
              key={g.id}
              style={[styles.genrePill, selectedGenreId === g.id && styles.genrePillActive]}
              onPress={() => setSelectedGenreId(g.id)}
            >
              <Text style={[styles.genreText, selectedGenreId === g.id && styles.genreTextActive]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {isLoading ? (
        <View style={styles.listContent}>
           <View style={styles.searchRow}>
              {[1,2,3,4].map(i => <Skeleton key={i} width="22%" height={150} borderRadius={8} />)}
           </View>
           <View style={styles.searchRow}>
              {[5,6,7,8].map(i => <Skeleton key={i} width="22%" height={150} borderRadius={8} />)}
           </View>
        </View>
      ) : moviesList.length === 0 ? (
        <View style={[styles.center, {flex: 1, paddingBottom: 100}]}>
          <Text style={{color: colors.text}}>Nenhum filme encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={formatMoviesGrid(moviesList, 4)}
          keyExtractor={(item, index) => item.empty ? `empty-${index}` : `${item.id}-${index}`}
          numColumns={4}
          renderItem={({ item }) => {
            if (item.empty) {
              return <View style={{ flex: 1, margin: 4, backgroundColor: 'transparent' }} />;
            }
            return <MovieCard movie={item} status={watchedStatus[item.id]} />;
          }}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={handleLoadMoreMovies}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore ? <Loading /> : null}
        />
      )}

      {/* Modal de IA */}
      <Modal visible={isAiModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Recomendação IA</Text>
              <TouchableOpacity onPress={() => setIsAiModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {isAiLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#6200EE" />
                  <Text style={{ color: colors.text, marginTop: 16 }}>Analisando seu gosto cinematográfico...</Text>
                </View>
              ) : (
                <Text style={styles.aiText}>{aiRecommendationText}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FABs (Roleta e Chat) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.chatFab}
          onPress={() => router.push('/ai-chat')}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/roulette')}
        >
          <Ionicons name="dice" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.backgroundElement,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center',
  },
  profileIcon: {
    padding: 8,
    backgroundColor: colors.border,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100, // Evita corte pelo tab bar
    paddingHorizontal: 12,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.backgroundElement,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.border,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  yearInput: {
    width: 60,
    backgroundColor: colors.border,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#E50914',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreScroll: {
    flexDirection: 'row',
  },
  genrePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.border,
    marginRight: 8,
  },
  genrePillActive: {
    backgroundColor: '#E50914',
  },
  genreText: {
    color: colors.text,
    fontSize: 12,
  },
  genreTextActive: {
    color: colors.text,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  aiText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    gap: 16,
    alignItems: 'center',
  },
  chatFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  challengeBanner: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: '#E50914',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  challengeTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  challengeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  }
});
