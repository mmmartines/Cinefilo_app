import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../contexts/AlertContext';

export default function CinemasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Busca cinemas usando Overpass API
  const fetchCinemasByLocation = async (lat: number, lon: number) => {
    setLoading(true);
    setLocationStatus('Buscando cinemas num raio de 15km...');
    try {
      const query = `
        [out:json];
        node
          ["amenity"="cinema"]
          (around:15000,${lat},${lon});
        out;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      const data = await response.json();
      setCinemas(data.elements || []);
    } catch (e) {
      showAlert('Erro', 'Não foi possível buscar os cinemas.');
    } finally {
      setLoading(false);
      setLocationStatus('');
    }
  };

  const fetchCinemasByCity = async (city: string) => {
    if (!city.trim()) return;
    setLoading(true);
    setLocationStatus(`Buscando cinemas em ${city}...`);
    try {
      const query = `
        [out:json];
        area[name="${city}"]->.searchArea;
        node["amenity"="cinema"](area.searchArea);
        out;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      const data = await response.json();
      setCinemas(data.elements || []);
    } catch (e) {
      showAlert('Erro', 'Não foi possível buscar os cinemas.');
    } finally {
      setLoading(false);
      setLocationStatus('');
    }
  };

  const handleUseGPS = async () => {
    setLoading(true);
    setLocationStatus('Obtendo localização...');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permissão negada', 'Permita o acesso à localização para usar essa função.');
        setLoading(false);
        setLocationStatus('');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      await fetchCinemasByLocation(location.coords.latitude, location.coords.longitude);
    } catch (e) {
      showAlert('Erro', 'Erro ao obter GPS.');
      setLoading(false);
      setLocationStatus('');
    }
  };

  const openMaps = (lat: number, lon: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url).catch(() => {
      showAlert('Erro', 'Não foi possível abrir o mapa.');
    });
  };

  const openWebsite = (website: string) => {
    Linking.openURL(website).catch(() => {
      showAlert('Erro', 'Não foi possível abrir o site.');
    });
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      showAlert('Erro', 'Não foi possível abrir o discador.');
    });
  };

  const renderCinema = ({ item }: { item: any }) => {
    const tags = item.tags || {};
    const name = tags.name || 'Cinema (Sem nome)';
    const address = tags['addr:street'] 
      ? `${tags['addr:street']}, ${tags['addr:housenumber'] || ''}`
      : 'Endereço não cadastrado';

    return (
      <View style={styles.cinemaCard}>
        <View style={styles.cinemaInfo}>
          <Text style={styles.cinemaName}>{name}</Text>
          <Text style={styles.cinemaAddress}>{address}</Text>
          
          {tags.opening_hours && (
            <Text style={styles.cinemaHours}>⏱️ {tags.opening_hours}</Text>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => openMaps(item.lat, item.lon, name)}
          >
            <Ionicons name="map-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Mapa</Text>
          </TouchableOpacity>
          
          {tags.website && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#333' }]} 
              onPress={() => openWebsite(tags.website)}
            >
              <Ionicons name="globe-outline" size={20} color="#fff" />
              <Text style={styles.actionText}>Site</Text>
            </TouchableOpacity>
          )}

          {tags.phone && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#333' }]} 
              onPress={() => callPhone(tags.phone)}
            >
              <Ionicons name="call-outline" size={20} color="#fff" />
              <Text style={styles.actionText}>Ligar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cinemas Próximos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchSection}>
        <TouchableOpacity style={styles.gpsBtn} onPress={handleUseGPS} disabled={loading}>
          <Ionicons name="location-outline" size={20} color="#fff" />
          <Text style={styles.gpsBtnText}>Usar meu GPS</Text>
        </TouchableOpacity>

        <View style={styles.orDivider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OU</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Buscar por nome da Cidade..."
            placeholderTextColor="#666"
            value={searchCity}
            onChangeText={setSearchCity}
            onSubmitEditing={() => fetchCinemasByCity(searchCity)}
          />
          <TouchableOpacity 
            style={styles.searchBtn}
            onPress={() => fetchCinemasByCity(searchCity)}
            disabled={loading}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E50914" />
            {locationStatus ? <Text style={styles.statusText}>{locationStatus}</Text> : null}
          </View>
        ) : (
          <FlatList
            data={cinemas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCinema}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {cinemas.length === 0 && !loading && locationStatus === '' 
                  ? 'Busque por GPS ou digite uma cidade.' 
                  : 'Nenhum cinema encontrado na base de dados.'}
              </Text>
            }
          />
        )}
      </View>
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
    paddingBottom: 16,
    backgroundColor: '#1E1E1E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  backIcon: {
    padding: 8,
    width: 40,
    alignItems: 'flex-start',
  },
  searchSection: {
    padding: 24,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  gpsBtn: {
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  gpsBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  orText: {
    color: '#666',
    marginHorizontal: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#121212',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchBtn: {
    backgroundColor: '#333',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  cinemaCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E50914',
  },
  cinemaInfo: {
    marginBottom: 16,
  },
  cinemaName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cinemaAddress: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  cinemaHours: {
    color: '#ccc',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#999',
    marginTop: 16,
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
