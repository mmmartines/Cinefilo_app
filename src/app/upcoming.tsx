import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { getUpcomingMovies } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar o comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function UpcomingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    fetchMovies();
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem('@cinefilo_reminders');
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMovies = async () => {
    try {
      const data = await getUpcomingMovies(1);
      
      // Filtrar apenas filmes com datas futuras
      const today = new Date().toISOString().split('T')[0];
      const future = data.filter((m: any) => m.release_date && m.release_date >= today);
      
      // Ordenar por data
      future.sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
      
      setMovies(future);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scheduleReminder = async (movie: any) => {
    const isRemembered = reminders.includes(movie.id.toString());
    
    if (isRemembered) {
      Alert.alert("Já Agendado", "Você já programou um lembrete para este filme.");
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert("Erro", "Notificações não são suportadas na web.");
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permissão negada', 'Habilite as notificações nas configurações para receber lembretes.');
        return;
      }

      // O filme lança no dia X. Agendar para as 10:00 AM do dia de lançamento.
      const releaseDate = new Date(movie.release_date);
      // Se a data do lançamento já passou ou é hoje (fallback de segurança)
      const now = new Date();
      if (releaseDate.getTime() < now.getTime()) {
        Alert.alert("Erro", "A data de lançamento já passou.");
        return;
      }

      releaseDate.setHours(10, 0, 0, 0);

      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        year: releaseDate.getFullYear(),
        month: releaseDate.getMonth() + 1,
        day: releaseDate.getDate(),
        hour: 10,
        minute: 0,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎬 É hoje!",
          body: `O filme "${movie.title}" estreia hoje nos cinemas!`,
          data: { movieId: movie.id },
        },
        // @ts-ignore
        trigger,
      });

      const newReminders = [...reminders, movie.id.toString()];
      setReminders(newReminders);
      await AsyncStorage.setItem('@cinefilo_reminders', JSON.stringify(newReminders));
      
      Alert.alert('Pronto!', `Um lembrete foi agendado para a manhã do dia ${releaseDate.toLocaleDateString('pt-BR')}.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível agendar o lembrete.');
    }
  };

  const renderMovie = ({ item }: { item: any }) => {
    const isRemembered = reminders.includes(item.id.toString());
    
    // Formatar data: YYYY-MM-DD -> DD/MM/YYYY
    const dateParts = item.release_date.split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : item.release_date;

    return (
      <View style={styles.movieCard}>
        <TouchableOpacity onPress={() => router.push(`/movie/${item.id}`)}>
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w342${item.poster_path}` }} 
            style={styles.poster} 
            contentFit="cover"
          />
        </TouchableOpacity>
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.dateText}>📅 Estreia: {formattedDate}</Text>
          <Text style={styles.overview} numberOfLines={3}>{item.overview || 'Sinopse não disponível.'}</Text>
          
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity 
              style={[styles.remindButton, isRemembered && styles.remindButtonActive]}
              onPress={() => scheduleReminder(item)}
            >
              <Ionicons name={isRemembered ? "notifications" : "notifications-outline"} size={18} color="#fff" />
              <Text style={styles.remindButtonText}>
                {isRemembered ? 'Lembrete Ativo' : 'Me Lembrar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Em Breve</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovie}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 16 },
  movieCard: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, borderColor: '#333' },
  poster: { width: 90, height: 135, borderRadius: 8, backgroundColor: '#333' },
  movieInfo: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  dateText: { color: '#E50914', fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  overview: { color: '#aaa', fontSize: 12, lineHeight: 18, marginBottom: 8 },
  remindButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#333', paddingVertical: 8, borderRadius: 8 },
  remindButtonActive: { backgroundColor: '#00A859' },
  remindButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
