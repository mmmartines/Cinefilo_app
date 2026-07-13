import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../services/database';
import { useFocusEffect, useRouter } from 'expo-router';

export default function Lists() {
  const router = useRouter();
  const [lists, setLists] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    const currentUser = await database.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const userLists = await database.getCustomLists(currentUser.id);
      setLists(userLists);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await database.createCustomList(user.id, newListName.trim());
      setNewListName('');
      setIsCreating(false);
      loadData();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar a lista');
    }
  };

  const renderList = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.listCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/list/${item._id}`)}
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
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Minhas Listas</Text>
        <TouchableOpacity 
          style={styles.profileIcon} 
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.createSection}>
        {isCreating ? (
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
              <TouchableOpacity onPress={() => setIsCreating(false)} style={styles.btnCancel}>
                <Ionicons name="close" size={24} color="#E50914" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateList} style={styles.btnSave}>
                <Ionicons name="checkmark" size={24} color="#00A859" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.btnCreate} onPress={() => setIsCreating(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.btnCreateText}>Criar Nova Lista</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={lists.filter(l => l.owner_id === user?.id)}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderList}
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
            {lists.filter(l => l.owner_id !== user?.id).length === 0 ? (
              <Text style={[styles.emptyText, { marginLeft: 16 }]}>Nenhuma lista compartilhada com você.</Text>
            ) : (
              lists.filter(l => l.owner_id !== user?.id).map((item) => (
                <View key={item._id} style={{ marginHorizontal: 16, marginBottom: 16 }}>
                  {renderList({ item })}
                </View>
              ))
            )}
          </View>
        }
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
  profileIcon: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#1E1E1E',
    color: '#fff',
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
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  btnSave: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  listsContainer: {
    padding: 16,
    gap: 16,
  },
  listCard: {
    backgroundColor: '#1E1E1E',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listOwner: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  listCount: {
    color: '#999',
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
    color: '#666',
    fontStyle: 'italic',
  },
  center: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    color: '#666',
    marginTop: 16,
  }
});
