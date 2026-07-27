import { useAppTheme } from '../../../contexts/ThemeContext';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../../services/supabase';
import { useAlert } from '../../../contexts/AlertContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function ClubsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isJoinMode, setIsJoinMode] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  
  const [clubName, setClubName] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  

  const fetchClubs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/social?route=clubs`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      if (result.success) {
        setClubs(result.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchClubs();
    }, [])
  );

  const handleCreateClub = async () => {
    if (!clubName.trim()) {
      showAlert('Aviso', 'O nome do clube é obrigatório');
      return;
    }
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/social?route=clubs`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: clubName, description: clubDesc })
      });
      
      const result = await response.json();
      if (result.success) {
        showAlert('Sucesso', 'Clube criado!');
        setClubName('');
        setClubDesc('');
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
      } else {
        showAlert('Erro', result.error || 'Erro ao criar');
      }
    } catch (e) {
      showAlert('Erro', 'Erro de conexão');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinClub = async () => {
    if (joinCode.length !== 6) {
      showAlert('Aviso', 'O código deve ter 6 caracteres');
      return;
    }
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://cinefilo-server.vercel.app';
      const response = await fetch(`${apiUrl}/api/social?route=clubs&action=join`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ joinCode })
      });
      
      const result = await response.json();
      if (result.success) {
        showAlert('Sucesso', 'Você entrou no clube!');
        setJoinCode('');
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
      } else {
        showAlert('Erro', result.error || 'Erro ao entrar');
      }
    } catch (e) {
      showAlert('Erro', 'Erro de conexão');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clubes de Cinema</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, isJoinMode && styles.activeTab]}
          onPress={() => setIsJoinMode(true)}
        >
          <Text style={[styles.tabText, isJoinMode && styles.activeTabText]}>Entrar em um Clube</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, !isJoinMode && styles.activeTab]}
          onPress={() => setIsJoinMode(false)}
        >
          <Text style={[styles.tabText, !isJoinMode && styles.activeTabText]}>Criar Clube</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionCard}>
        {isJoinMode ? (
          <View>
            <Text style={styles.label}>Código de Convite</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: AB12CD"
              placeholderTextColor="#666"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleJoinClub} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Nome do Clube</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Clube do Terror"
              placeholderTextColor="#666"
              value={clubName}
              onChangeText={setClubName}
            />
            <Text style={styles.label}>Descrição (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Amantes de filmes de terror..."
              placeholderTextColor="#666"
              value={clubDesc}
              onChangeText={setClubDesc}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateClub} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Criar</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Meus Clubes</Text>
      {loading ? (
        <ActivityIndicator color="#E50914" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.clubCard}>
              <View style={styles.clubHeader}>
                <View>
                  <Text style={styles.clubName}>{item.name}</Text>
                  <Text style={styles.clubMembers}>{item.members?.length || 1} membros</Text>
                </View>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{item.joinCode}</Text>
                </View>
              </View>
              {item.description ? <Text style={styles.clubDesc}>{item.description}</Text> : null}
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Você não participa de nenhum clube ainda.</Text>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.border },
  activeTab: { borderBottomColor: '#E50914' },
  tabText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  actionCard: { backgroundColor: colors.backgroundElement, marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textSecondary, fontSize: 14, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: colors.backgroundElement, borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, marginBottom: 16 },
  primaryButton: { backgroundColor: '#E50914', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 16, marginBottom: 12 },
  clubCard: { backgroundColor: colors.backgroundElement, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  clubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clubName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clubMembers: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  codeBadge: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  codeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  clubDesc: { color: colors.text, fontSize: 14, marginTop: 12 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 32, fontSize: 16 }
});
