import { useAppTheme } from '../../../contexts/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUpcomingMovies } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../contexts/AlertContext';
import * as ImagePicker from 'expo-image-picker';

let Notifications: any = null;
let isNotificationsAvailable = false;
try {
  Notifications = require('expo-notifications');
  isNotificationsAvailable = true;
  
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  // Ignora se estiver no Expo Go
}

export default function UpcomingScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<string[]>([]);
  const [tickets, setTickets] = useState<Record<string, { uri: string, releaseDate: string }>>({});

  useEffect(() => {
    fetchMovies();
    loadReminders();
    loadTickets();
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

  const loadTickets = async () => {
    try {
      const stored = await AsyncStorage.getItem('@cinefilo_tickets');
      if (stored) {
        let parsed = JSON.parse(stored);
        let changed = false;
        const now = new Date();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        Object.keys(parsed).forEach(key => {
          if (parsed[key].releaseDate) {
            const release = new Date(parsed[key].releaseDate);
            if (now.getTime() - release.getTime() > thirtyDaysInMs) {
              delete parsed[key];
              changed = true;
            }
          }
        });

        setTickets(parsed);
        if (changed) {
          await AsyncStorage.setItem('@cinefilo_tickets', JSON.stringify(parsed));
          console.log('🧹 Ingressos com mais de 30 dias foram apagados!');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMovies = async () => {
    try {
      const data = await getUpcomingMovies(1);
      const today = new Date().toISOString().split('T')[0];
      const future = data.filter((m: any) => m.release_date && m.release_date >= today);
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
      showAlert("Já Agendado", "Você já programou um lembrete para este filme.");
      return;
    }
    try {
      let releaseDate = new Date(movie.release_date);
      let now = new Date();

      if (Platform.OS !== 'web' && isNotificationsAvailable) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          showAlert('Permissão negada', 'Habilite as notificações nas configurações para receber lembretes.');
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
            title: "Estreia hoje!",
            body: `O filme "${movie.title}" estreia hoje nos cinemas!`,
            data: { movieId: movie.id },
          },
          // @ts-ignore
          trigger,
        });
      }

      const newReminders = [...reminders, movie.id.toString()];
      setReminders(newReminders);
      await AsyncStorage.setItem('@cinefilo_reminders', JSON.stringify(newReminders));
      showAlert('Pronto!', `Um lembrete foi salvo para o dia ${releaseDate.toLocaleDateString('pt-BR')}.`);
    } catch (e) {
      console.error(e);
      showAlert('Erro', 'Não foi possível agendar o lembrete.');
    }
  };

  const handlePickTicket = async (movieId: number, releaseDate: string) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showAlert('Erro', 'Permissão negada para acessar a galeria.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const newTickets = { ...tickets, [movieId.toString()]: { uri: imageUri, releaseDate } };
        setTickets(newTickets);
        await AsyncStorage.setItem('@cinefilo_tickets', JSON.stringify(newTickets));
        showAlert('Sucesso', 'Ingresso anexado com sucesso!');
      }
    } catch (e) {
      showAlert('Erro', 'Ocorreu um erro ao anexar a imagem do ingresso.');
    }
  };

  const removeTicket = async (movieId: number) => {
    const newTickets = { ...tickets };
    delete newTickets[movieId.toString()];
    setTickets(newTickets);
    await AsyncStorage.setItem('@cinefilo_tickets', JSON.stringify(newTickets));
  };

  const renderMovie = ({ item }: { item: any }) => {
    const isRemembered = reminders.includes(item.id.toString());
    const ticketObj = tickets[item.id.toString()];
    const ticketUri = ticketObj ? ticketObj.uri : null;

    const dateParts = item.release_date.split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : item.release_date;

    return (
      <View style={styles.movieCard}>
        <View style={styles.movieContentRow}>
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
          </View>
        </View>

        {ticketUri && (
          <View style={styles.ticketContainer}>
            <Text style={styles.ticketLabel}>Seu Ingresso:</Text>
            <View style={styles.ticketWrapper}>
              <Image source={{ uri: ticketUri }} style={styles.ticketImage} contentFit="cover" />
              <TouchableOpacity style={styles.removeTicketBtn} onPress={() => removeTicket(item.id)}>
                <Ionicons name="close-circle" size={24} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, isRemembered && styles.remindButtonActive]}
            onPress={() => scheduleReminder(item)}
          >
            <Ionicons name={isRemembered ? "notifications" : "notifications-outline"} size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {isRemembered ? 'Lembrete Ativo' : 'Me Lembrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ticketButton} onPress={() => handlePickTicket(item.id, item.release_date)}>
            <Ionicons name={ticketUri ? "refresh" : "ticket-outline"} size={18} color="#fff" />
            <Text style={styles.actionButtonText}>
              {ticketUri ? 'Trocar Ingresso' : 'Anexar Ingresso'}
            </Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Lançamentos & Ingressos</Text>
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

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 16 },
  movieCard: { backgroundColor: colors.backgroundElement, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  movieContentRow: { flexDirection: 'row', gap: 12 },
  poster: { width: 90, height: 135, borderRadius: 8, backgroundColor: colors.border },
  movieInfo: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  dateText: { color: '#E50914', fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  overview: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  ticketContainer: { marginTop: 12, padding: 8, backgroundColor: colors.border, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  ticketLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 8, fontWeight: 'bold' },
  ticketWrapper: { position: 'relative', width: '100%', height: 100, borderRadius: 8, overflow: 'hidden' },
  ticketImage: { width: '100%', height: '100%' },
  removeTicketBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  buttonsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.border, paddingVertical: 10, borderRadius: 8 },
  remindButtonActive: { backgroundColor: '#00A859' },
  ticketButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E50914', paddingVertical: 10, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});
