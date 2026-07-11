import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../services/database';
import { Loading } from '../../components/Loading';

export default function ListDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const formatData = (dataList: any[], numColumns: number) => {
    const numberOfFullRows = Math.floor(dataList.length / numColumns);
    let numberOfElementsLastRow = dataList.length - (numberOfFullRows * numColumns);
    
    const padded = [...dataList];
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
      padded.push({ id: `blank-${numberOfElementsLastRow}`, empty: true });
      numberOfElementsLastRow++;
    }
    return padded;
  };

  const loadList = async () => {
    const currentUser = await database.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const userLists = await database.getCustomLists(currentUser.id);
      const found = userLists.find((l: any) => l.id === id);
      if (found) {
        setList(found);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadList();
  }, [id]);

  const handleDeleteList = () => {
    Alert.alert('Excluir Lista', `Tem certeza que deseja excluir a lista "${list?.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          if (user) {
            await database.removeCustomList(user.id, String(id));
            router.back();
          }
      }}
    ]);
  };

  const handleRemoveMovie = (movieId: number, movieTitle: string) => {
    Alert.alert('Remover Filme', `Remover "${movieTitle}" desta lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
          if (user) {
            await database.removeMovieFromCustomList(user.id, String(id), movieId);
            loadList();
          }
      }}
    ]);
  };

  if (loading) {
    return <Loading />;
  }

  if (!list) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>Lista não encontrada.</Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: '#E50914' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{list.name}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteList}>
          <Ionicons name="trash-outline" size={24} color="#E50914" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={formatData(list.movies, 4)}
        keyExtractor={(item, index) => item.empty ? `empty-${index}` : item.movieId.toString()}
        numColumns={4}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>Nenhum filme nesta lista.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.empty) {
            return <View style={{ flex: 1, margin: 4, backgroundColor: 'transparent' }} />;
          }
          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/movie/${item.movieId}`)}
              >
                <View style={styles.posterContainer}>
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w200${item.poster_path}` }}
                    style={styles.poster}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeMovieBtn} onPress={() => handleRemoveMovie(item.movieId, item.title)}>
                <Ionicons name="close-circle" size={24} color="#E50914" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  backBtn: {
    padding: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  cardWrapper: {
    flex: 1,
    margin: 4,
    aspectRatio: 2/3,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  posterContainer: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  removeMovieBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: '#666',
    marginTop: 16,
  }
});
