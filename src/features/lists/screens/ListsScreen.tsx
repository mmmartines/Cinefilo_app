import { NotificationBell } from '../../../components/NotificationBell';
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton } from '../../../components/AnimatedButton';
import { useLists } from '../hooks/useLists';
import { useAppTheme } from '../../../contexts/ThemeContext';

export function ListsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const {
    customLists,
    currentUser,
    newListName,
    setNewListName,
    isCreatingList,
    setIsCreatingList,
    handleCreateNewList,
  } = useLists();

  const renderListCard = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.listCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/list/${item._id || item.id}`)}
      >
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>{item.name}</Text>
            {item.owner_name && <Text style={styles.listOwner}>de {item.owner_name}</Text>}
          </View>
          <Text style={styles.listCount}>{item.movies.length} filmes</Text>
        </View>
        
        {item.movies.length > 0 ? (
          <FlatList
            data={item.movies.slice(0, 5)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(m) => m.movieId.toString()}
            renderItem={({ item: movie }) => (
              <TouchableOpacity onPress={() => router.push(`/movie/${movie.movieId}`)}>
                <Image 
                  source={{ uri: `https://image.tmdb.org/t/p/w185${movie.poster_path}` }} 
                  style={styles.movieThumb}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.emptyListText}>Lista vazia. Adicione filmes!</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
  
        <View style={styles.createSection}>
        {isCreatingList ? (
          <View style={styles.createForm}>
            <TextInput
              style={styles.input}
              placeholder="Nome da lista..."
              placeholderTextColor="#666"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.createActions}>
              <TouchableOpacity onPress={() => setIsCreatingList(false)} style={styles.btnCancel}>
                <Ionicons name="close" size={24} color="#E50914" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateNewList} style={styles.btnSave}>
                <Ionicons name="checkmark" size={24} color="#00A859" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <AnimatedButton style={styles.btnCreate} onPress={() => setIsCreatingList(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.btnCreateText}>Criar Nova Lista</Text>
          </AnimatedButton>
        )}
      </View>

      <FlatList
        data={customLists.filter(l => !l.owner_id || l.owner_id === currentUser?.id)}
        keyExtractor={(item) => (item._id || item.id || Math.random().toString()).toString()}
        renderItem={renderListCard}
        contentContainerStyle={styles.listsContainer}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Minhas Listas</Text>}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Você ainda não possui listas.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Compartilhadas Comigo</Text>
            {customLists.filter(l => l.owner_id && l.owner_id !== currentUser?.id).length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>Nenhuma lista compartilhada com você.</Text>
              </View>
            ) : (
              customLists.filter(l => l.owner_id && l.owner_id !== currentUser?.id).map((item) => (
                <View key={item._id || item.id} style={{ marginHorizontal: 16, marginBottom: 16 }}>
                  {renderListCard({ item })}
                </View>
              ))
            )}
          </View>
        }
      />
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E50914',
    textAlign: 'center',
  },
  createSection: {
    padding: 16,
  },
  btnCreate: {
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  btnCreateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createForm: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  createActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnCancel: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundElement,
    borderRadius: 8,
  },
  btnSave: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundElement,
    borderRadius: 8,
  },
  listsContainer: {
    padding: 16,
    paddingBottom: 100, // Evita corte pelo tab bar
    gap: 16,
  },
  listCard: {
    backgroundColor: colors.backgroundElement,
    padding: 16,
    borderRadius: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  listOwner: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  listCount: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    color: '#E50914',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  movieThumb: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: 8,
  },
  emptyListText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  center: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 16,
  }
});
