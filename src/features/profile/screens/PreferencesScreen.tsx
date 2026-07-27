import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { database } from '../../../services/database';
import { getGenres, getWatchProviders } from '../../../services/api';
import { supabase } from '../../../services/supabase';

export function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [genres, setGenres] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const [fetchedGenres, fetchedProviders, userPrefs] = await Promise.all([
        getGenres(),
        getWatchProviders(),
        database.getPreferences(session.user.id)
      ]);
      
      setGenres(fetchedGenres || []);
      // Filtrar apenas provedores mais relevantes (os 20 primeiros ou algo assim, para não poluir)
      setProviders((fetchedProviders || []).slice(0, 30));
      
      setSelectedGenres(userPrefs.genres || []);
      setSelectedProviders(userPrefs.providers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleProvider = (id: number) => {
    setSelectedProviders(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      await database.updatePreferences(selectedGenres, selectedProviders);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferências</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Gêneros Favoritos</Text>
        <Text style={styles.sectionDesc}>Isso nos ajuda a personalizar seus desafios semanais e a recomendar filmes que você realmente vai gostar.</Text>
        
        <View style={styles.chipContainer}>
          {genres.map(g => {
            const isSelected = selectedGenres.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleGenre(g.id)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{g.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Onde Assistir (Streaming)</Text>
        <Text style={styles.sectionDesc}>Quais serviços você assina? Vamos priorizar filmes disponíveis neles.</Text>
        
        <View style={styles.chipContainer}>
          {providers.map(p => {
            const isSelected = selectedProviders.includes(p.provider_id);
            return (
              <TouchableOpacity
                key={p.provider_id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleProvider(p.provider_id)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{p.provider_name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.saveButton} onPress={savePreferences} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Salvar Preferências'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.backgroundElement, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  backButton: { padding: 8 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  sectionDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: 'rgba(229, 9, 20, 0.1)', borderColor: '#E50914' },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: '#E50914', fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundElement, borderTopWidth: 1, borderTopColor: colors.border, padding: 16 },
  saveButton: { backgroundColor: '#E50914', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
