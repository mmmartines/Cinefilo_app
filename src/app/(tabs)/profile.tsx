import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../services/database';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Edit states
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState(true);
  
  const [loading, setLoading] = useState(false);

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
        setNotifications(currentUser.notifications ?? true);
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
        password,
        notifications
      });
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Erro ao atualizar.');
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" color="#fff" size={24} />
        </TouchableOpacity>
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

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Receber notificações</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: '#E50914' }}
            thumbColor={notifications ? '#fff' : '#f4f3f4'}
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
      </View>
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
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E50914',
  },
  logoutButton: {
    padding: 8,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  switchLabel: {
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
});
