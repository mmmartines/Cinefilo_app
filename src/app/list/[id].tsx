import { useAppTheme } from '../../contexts/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../services/database';
import { Loading } from '../../components/Loading';
import { useAlert } from '../../contexts/AlertContext';

export default function ListDetails() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [friendTag, setFriendTag] = useState('');
  const [newListName, setNewListName] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      const found = userLists.find((l: any) => String(l._id) === String(id));
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
    showAlert('Excluir Lista', `Tem certeza que deseja excluir a lista "${list?.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          if (user) {
            try {
              await database.removeCustomList(user.id, String(id));
              router.back();
            } catch (e: any) {
              showAlert('Erro', 'Não foi possível excluir a lista.');
            }
          }
      }}
    ]);
  };

  const handleRenameList = async () => {
    if (!newListName.trim()) {
      showAlert('Atenção', 'O nome da lista não pode ficar vazio.');
      return;
    }
    setIsEditing(true);
    try {
      await database.renameCustomList(user.id, String(id), newListName.trim());
      setEditModalVisible(false);
      loadList();
    } catch (e: any) {
      showAlert('Erro', 'Não foi possível renomear a lista.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleRemoveMovie = (movieId: number, movieTitle: string) => {
    showAlert('Remover Filme', `Remover "${movieTitle}" desta lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
          if (user) {
            await database.removeMovieFromCustomList(user.id, String(id), movieId);
            loadList();
          }
      }}
    ]);
  };

  const handleShareList = async () => {
    if (friendTag.trim().length !== 10) {
      showAlert('Erro', 'A Tag deve ter 10 caracteres.');
      return;
    }
    
    setIsSharing(true);
    try {
      await database.shareCustomList(user.id, String(id), friendTag.trim());
      showAlert('Sucesso!', 'Lista compartilhada com sucesso.');
      setShareModalVisible(false);
      setFriendTag('');
      loadList();
    } catch (e: any) {
      showAlert('Erro', e.message);
    } finally {
      setIsSharing(false);
    }
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
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{list.name}</Text>
        <View style={styles.headerActions}>
          {list.owner_id === user?.id && (
            <TouchableOpacity style={styles.shareBtn} onPress={() => {
              setNewListName(list.name);
              setEditModalVisible(true);
            }}>
              <Ionicons name="pencil" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          {list.owner_id === user?.id && (
            <TouchableOpacity style={styles.shareBtn} onPress={() => setShareModalVisible(true)}>
              <Ionicons name="share-social-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          {list.owner_id === user?.id && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteList}>
              <Ionicons name="trash-outline" size={24} color="#E50914" />
            </TouchableOpacity>
          )}
        </View>
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
      
      {/* Modal de Compartilhamento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Compartilhar Lista</Text>
            <Text style={styles.modalSubtitle}>Digite a Tag do seu amigo para dar acesso a esta lista.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Tag do amigo (ex: X7K9LM2Q1P)"
              placeholderTextColor="#666"
              value={friendTag}
              onChangeText={(t) => setFriendTag(t.toUpperCase())}
              maxLength={10}
              autoCapitalize="characters"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShareModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleShareList} disabled={isSharing}>
                {isSharing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Compartilhar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renomear Lista</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Novo nome da lista"
              placeholderTextColor="#666"
              value={newListName}
              onChangeText={setNewListName}
              maxLength={40}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleRenameList} disabled={isEditing}>
                {isEditing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: colors.backgroundElement,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 8,
  },
  shareBtn: {
    padding: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.backgroundElement,
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
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.backgroundElement,
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  modalBtnCancel: {
    padding: 12,
  },
  modalBtnSave: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
