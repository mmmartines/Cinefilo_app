import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../services/database';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  
  // Edit states
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formatted = selectedDate.toLocaleDateString('pt-BR');
      setBirthdate(formatted);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await database.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || '');
        setBirthdate(currentUser.birthdate || '');
        setPassword(currentUser.password || '');
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await database.updateUser({
        email: user.email, // Email fixo
        name,
        birthdate,
        password
      });
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Erro ao atualizar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETAR') {
      Alert.alert('Erro', 'Você precisa digitar DELETAR exatamente como solicitado.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/api/users`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      }
      // Limpa os dados locais e desloga
      await database.logout();
      setDeleteModalVisible(false);
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível deletar a conta no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await database.logout();
  };

  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.tagSection}>
        <View style={styles.tagBox}>
          <Text style={styles.tagLabel}>Sua #Tag de Amizade</Text>
          <Text style={styles.tagText} selectable={true}>{user.tag || 'GERANDO...'}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>E-mail (Não pode ser alterado)</Text>
        <View style={[styles.inputContainer, styles.disabledInput]}>
          <Ionicons name="mail" color="#666" size={20} style={styles.icon} />
          <TextInput
            style={[styles.input, { color: '#666' }]}
            value={user.email}
            editable={false}
          />
        </View>

        <Text style={styles.label}>Nome Completo</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person" color="#999" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.label}>Data de Nascimento</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="calendar" color="#999" size={20} style={styles.icon} />
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'center' }} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: birthdate ? '#fff' : '#666', fontSize: 16 }}>
              {birthdate || "Data de Nascimento"}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

        <Text style={styles.label}>Senha</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" color="#999" size={20} style={styles.icon} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zona de Perigo</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => setDeleteModalVisible(true)}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Deletar Minha Conta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Confirmação de Deleção */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#E50914" />
            <Text style={styles.modalTitle}>Deletar Conta</Text>
            <Text style={styles.modalText}>
              Tem certeza absoluta? Esta ação não pode ser desfeita e todo o seu histórico será perdido.
            </Text>
            
            <Text style={styles.modalLabel}>Digite DELETAR para confirmar:</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteConfirmationText('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalDeleteBtn, deleteConfirmationText !== 'DELETAR' && styles.modalDeleteBtnDisabled]} 
                onPress={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETAR' || loading}
              >
                <Text style={styles.modalDeleteText}>
                  {loading ? 'Deletando...' : 'Sim, Deletar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E50914',
  },
  backButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  tagSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tagBox: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tagLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  tagText: {
    color: '#E50914',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  form: {
    paddingHorizontal: 24,
  },
  label: {
    color: '#999',
    marginBottom: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 56,
  },
  disabledInput: {
    backgroundColor: '#111',
    borderColor: '#333',
    borderWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#E50914',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dangerZone: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginBottom: 40,
  },
  dangerTitle: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(229, 9, 20, 0.2)', // Vermelho translúcido
    borderWidth: 1,
    borderColor: '#E50914',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  deleteButtonText: {
    color: '#E50914',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#E50914',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalLabel: {
    color: '#fff',
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    width: '100%',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteBtnDisabled: {
    backgroundColor: '#555',
  },
  modalDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
