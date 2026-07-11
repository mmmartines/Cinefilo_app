import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchFilteredMovies, getGenres } from '../../services/api';
import { database } from '../../services/database';
import { MovieCard } from '../../components/MovieCard';
import { Loading } from '../../components/Loading';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();

  // Função para preencher a última linha com itens vazios (simulando 4 colunas)
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
  
  // Paginação
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [watchedStatus, setWatchedStatus] = useState<Record<number, 'watched' | 'watchlist'>>({});
  const [genres, setGenres] = useState<any[]>([]);

  // Filtros
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [genreId, setGenreId] = useState<number | null>(null);

  // Carrega os gêneros uma única vez
  useEffect(() => {
    const fetchGenresData = async () => {
      const genresData = await getGenres();
      setGenres(genresData);
    };
    fetchGenresData();
  }, []);

  // Busca de dados com filtros
  const loadData = async (resetPage = false) => {
    if (resetPage) {
      setLoading(true);
      setPage(1);
    }
    
    const targetPage = resetPage ? 1 : page;
    const data = await fetchFilteredMovies(targetPage, query, genreId, year);
    
    if (resetPage) {
      setMovies(data);
    } else if (data.length > 0) {
      setMovies(prevMovies => [...prevMovies, ...data]);
    }
    
    const currentUser = await database.getCurrentUser();
    if (currentUser) {
      const watchedList = await database.getWatchedMovies(currentUser.id);
      const statuses: Record<number, 'watched' | 'watchlist'> = {};
      watchedList.forEach((w: any) => {
        statuses[w.movieId] = w.status || 'watched'; // Fallback para watched antigo
      });
      setWatchedStatus(statuses);
    }
    
    setLoading(false);
  };

  // Toda vez que os filtros mudarem, reinicia a lista
  useEffect(() => {
    loadData(true);
  }, [genreId, year]); // 'query' será disparada num botão ou onSubmitEditing para não flodar a API

  const handleSearch = () => {
    loadData(true);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    
    const nextPage = page + 1;
    const newData = await fetchFilteredMovies(nextPage, query, genreId, year);
    
    if (newData.length > 0) {
      setMovies(prevMovies => [...prevMovies, ...newData]);
      setPage(nextPage);
    }
    
    setLoadingMore(false);
  };

  if (loading) {
    return <Loading />;
  }

  if (movies.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{color: 'white'}}>Nenhum filme encontrado. Verifique sua chave da API do TMDB.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.headerTitle}>Cinéfilo 🍿</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {/* Busca por Nome e Ano */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Nome do filme..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
          />
          <TextInput
            style={styles.yearInput}
            placeholder="Ano"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={4}
            value={year}
            onChangeText={setYear}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Categorias (Gêneros) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
          <TouchableOpacity 
            style={[styles.genrePill, genreId === null && styles.genrePillActive]}
            onPress={() => setGenreId(null)}
          >
            <Text style={[styles.genreText, genreId === null && styles.genreTextActive]}>Todos</Text>
          </TouchableOpacity>
          {genres.map((g) => (
            <TouchableOpacity 
              key={g.id}
              style={[styles.genrePill, genreId === g.id && styles.genrePillActive]}
              onPress={() => setGenreId(g.id)}
            >
              <Text style={[styles.genreText, genreId === g.id && styles.genreTextActive]}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={formatData(movies, 4)}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <Loading /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E50914',
  },
  logoutButton: {
    padding: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#1E1E1E',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#121212',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  yearInput: {
    width: 60,
    backgroundColor: '#121212',
    color: '#fff',
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
    backgroundColor: '#333',
    marginRight: 8,
  },
  genrePillActive: {
    backgroundColor: '#E50914',
  },
  genreText: {
    color: '#ccc',
    fontSize: 12,
  },
  genreTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
