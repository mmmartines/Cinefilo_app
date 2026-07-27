import { NotificationBell } from '../../../components/NotificationBell';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalHeader } from '../../../components/GlobalHeader';
import { MovieCard } from '../../../components/MovieCard';
import { Loading } from '../../../components/Loading';
import { Skeleton } from '../../../components/Skeleton';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { UpcomingTab } from './UpcomingTab';
import { CinemasTab } from './CinemasTab';
import { Image } from 'expo-image';
import { useCatalog } from '../hooks/useCatalog';
import { useAppTheme } from '../../../contexts/ThemeContext';

export function CatalogScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'catalog' | 'upcoming' | 'cinemas'>('catalog');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const toggleGenre = (id: number) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter(g => g !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  const toggleProvider = (id: number) => {
    if (selectedProviders.includes(id)) {
      setSelectedProviders(selectedProviders.filter(p => p !== id));
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };
  
  const {
    moviesList,
    isLoading,
    isLoadingMore,
    watchedStatus,
    genresList,
    providersList,
    userAvatarUrl,
    searchQuery,
    setSearchQuery,
    searchYear,
    setSearchYear,
    selectedGenres,
    setSelectedGenres,
    selectedProviders,
    setSelectedProviders,
    isAiModalVisible,
    setIsAiModalVisible,
    isAiLoading,
    aiRecommendationText,
        handleManualSearch,
    handleLoadMoreMovies,
    fetchAiRecommendation,
    formatMoviesGrid,
  } = useCatalog();



  return (
    <View style={styles.container}>
      <GlobalHeader title="Cinelândia 🍿" />

      
      {/* Top Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'catalog' && styles.tabBtnActive]} onPress={() => setActiveTab('catalog')}>
          <Text style={[styles.tabBtnText, activeTab === 'catalog' && styles.tabBtnTextActive]}>Catálogo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]} onPress={() => setActiveTab('upcoming')}>
          <Text style={[styles.tabBtnText, activeTab === 'upcoming' && styles.tabBtnTextActive]}>Em Breve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'cinemas' && styles.tabBtnActive]} onPress={() => setActiveTab('cinemas')}>
          <Text style={[styles.tabBtnText, activeTab === 'cinemas' && styles.tabBtnTextActive]}>Cinemas</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'catalog' ? (
        <>
          <View style={styles.filterContainer}>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Nome do filme..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleManualSearch}
              />
              <TouchableOpacity style={styles.filterIconBtn} onPress={() => setIsFilterModalVisible(true)}>
                <Ionicons name="options" size={24} color={colors.text} />
                {(selectedGenres.length > 0 || selectedProviders.length > 0) && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{selectedGenres.length + selectedProviders.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
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
      </>
      ) : activeTab === 'upcoming' ? (
        <UpcomingTab />
      ) : (
        <CinemasTab />
      )}

      
      {/* Modal de Filtro (Gêneros) */}
      <Modal visible={isFilterModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar Categorias</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
               <Text style={{color: colors.textSecondary, marginBottom: 16}}>Gêneros (Busca "OU"):</Text>
               <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24}}>
                 {genresList.map((g) => {
                   const isSelected = selectedGenres.includes(g.id);
                   return (
                     <TouchableOpacity 
                       key={g.id} 
                       style={[styles.genreGridPill, isSelected && {backgroundColor: '#E50914', borderColor: '#E50914'}]}
                       onPress={() => toggleGenre(g.id)}
                     >
                       <Text style={[styles.genreGridText, isSelected && {color: '#fff', fontWeight: 'bold'}]}>{g.name}</Text>
                     </TouchableOpacity>
                   );
                 })}
               </View>

               <Text style={{color: colors.textSecondary, marginBottom: 16}}>Onde Assistir (Busca "OU"):</Text>
               <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                 {providersList?.slice(0, 30).map((p: any) => {
                   const isSelected = selectedProviders.includes(p.provider_id);
                   return (
                     <TouchableOpacity 
                       key={p.provider_id} 
                       style={[styles.genreGridPill, isSelected && {backgroundColor: '#E50914', borderColor: '#E50914'}]}
                       onPress={() => toggleProvider(p.provider_id)}
                     >
                       <Text style={[styles.genreGridText, isSelected && {color: '#fff', fontWeight: 'bold'}]}>{p.provider_name}</Text>
                     </TouchableOpacity>
                   );
                 })}
               </View>
            </ScrollView>
            <View style={{padding: 16, borderTopWidth: 1, borderTopColor: colors.border}}>
               <TouchableOpacity 
                  style={{backgroundColor: '#E50914', padding: 16, borderRadius: 8, alignItems: 'center'}}
                  onPress={() => setIsFilterModalVisible(false)}
               >
                 <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>Aplicar Filtros</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          <MaterialCommunityIcons name="robot-outline" size={28} color="#fff" />
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#E50914',
  },
  tabBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: colors.text,
  },
  filterIconBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E50914',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  genreGridPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreGridText: {
    color: colors.text,
    fontSize: 14,
  },
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: colors.backgroundElement,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.border,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
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
    color: '#fff',
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
    backgroundColor: '#00BFA5', // Teal para a IA
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
  }
});
