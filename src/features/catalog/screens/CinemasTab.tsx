import { useAppTheme } from '../../../contexts/ThemeContext';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../../contexts/AlertContext';

export function CinemasTab() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [mapUnavailable, setMapUnavailable] = useState(false);

  useEffect(() => {
    handleUseGPS();
  }, []);

  const [mapRegion, setMapRegion] = useState({
    latitude: -14.235,
    longitude: -51.925,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Trata o retorno do Google Places e verifica cotas
  const handleGooglePlacesResponse = async (response: Response) => {
    const data = await response.json();
    if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED') {
      setMapUnavailable(true);
      throw new Error('QUOTA_EXCEEDED');
    }
    setMapUnavailable(false);
    return data.results || [];
  };

  const fetchCinemasByLocation = async (lat: number, lon: number, cityConstraint?: string) => {
    if (!GOOGLE_API_KEY) {
      setMapUnavailable(true);
      setLoading(false);
      setLocationStatus('');
      return;
    }
    setLoading(true);
    setLocationStatus(cityConstraint ? `Filtrando cinemas em ${cityConstraint}...` : 'Buscando cinemas num raio de 15km...');
    setMapRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=15000&type=movie_theater&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      let results = await handleGooglePlacesResponse(response);
      
      if (cityConstraint) {
        const lowerCity = cityConstraint.toLowerCase();
        results = results.filter((p: any) => 
          p.vicinity?.toLowerCase().includes(lowerCity) || 
          p.plus_code?.compound_code?.toLowerCase().includes(lowerCity)
        );
      }
      
      const mappedCinemas = results.map((place: any) => ({
        id: place.place_id,
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
        tags: {
          name: place.name,
          'addr:street': place.vicinity
        }
      }));
      setCinemas(mappedCinemas);
      if (mappedCinemas.length === 0 && cityConstraint) {
        showAlert('Aviso', `Nenhum cinema encontrado restrito à cidade de ${cityConstraint}.`);
      }
    } catch (e: any) {
      console.warn('Erro GPS Busca:', e);
      if (e.message !== 'QUOTA_EXCEEDED') {
        showAlert('Erro', 'Não foi possível buscar os cinemas na sua região.');
      }
    } finally {
      setLoading(false);
      setLocationStatus('');
    }
  };

  const fetchCinemasByCity = async (city: string) => {
    if (!city.trim()) return;
    if (!GOOGLE_API_KEY) {
      setMapUnavailable(true);
      return;
    }
    setLoading(true);
    setLocationStatus(`Buscando cinemas em ${city}...`);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=cinemas+in+${encodeURIComponent(city)}&type=movie_theater&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      let results = await handleGooglePlacesResponse(response);
      
      const lowerCity = city.toLowerCase();
      results = results.filter((p: any) => p.formatted_address?.toLowerCase().includes(lowerCity));
      
      const mappedCinemas = results.map((place: any) => ({
        id: place.place_id,
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
        tags: {
          name: place.name,
          'addr:street': place.formatted_address
        }
      }));
      setCinemas(mappedCinemas);
      
      if (mappedCinemas.length > 0) {
        setMapRegion({
          latitude: mappedCinemas[0].lat,
          longitude: mappedCinemas[0].lon,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      } else {
        showAlert('Aviso', `Nenhum cinema encontrado em ${city}.`);
      }
    } catch (e: any) {
      console.warn('Erro Busca Cidade', e);
      if (e.message !== 'QUOTA_EXCEEDED') {
        showAlert('Erro', 'Não foi possível buscar cinemas nessa cidade.');
      }
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

      let location = await Location.getLastKnownPositionAsync({});
      if (!location) {
        location = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Low 
        });
      }
      
      if (!location) throw new Error('Localização vazia');
      
      let userCity = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        if (geocode && geocode.length > 0) {
          userCity = geocode[0].city || geocode[0].subregion || '';
        }
      } catch (err) {
        console.warn('Erro no reverse geocode', err);
      }

      await fetchCinemasByLocation(location.coords.latitude, location.coords.longitude, userCity);
    } catch (e: any) {
      console.warn('Erro GPS', e);
      showAlert('Erro', 'Não foi possível obter a sua localização. Verifique se o GPS do celular está ligado.');
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

  const renderCinema = ({ item }: { item: any }) => (
    <View style={styles.cinemaCard}>
      <View style={styles.cinemaInfo}>
        <Text style={styles.cinemaName}>{item.tags?.name || 'Cinema Desconhecido'}</Text>
        {item.tags?.['addr:street'] && (
          <Text style={styles.cinemaAddress}>{item.tags['addr:street']}</Text>
        )}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => openMaps(item.lat, item.lon, item.tags?.name)}
        >
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.actionText}>Como Chegar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      

      <View style={styles.searchSection}>
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
            <Ionicons name="search" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.gpsBtnSquare} onPress={handleUseGPS} disabled={loading}>
              <Ionicons name="location" size={20} color="#fff" />
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
          <>
            <View style={styles.viewToggleRow}>
                <TouchableOpacity onPress={() => setViewMode('map')} style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}>
                  <Ionicons name="map" size={16} color={viewMode === 'map' ? '#fff' : "#999"} style={{marginRight: 6}} />
                  <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Mapa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}>
                  <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : "#999"} style={{marginRight: 6}} />
                  <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>Lista</Text>
                </TouchableOpacity>
              </View>

            {viewMode === 'map' ? (
              <View style={{ flex: 1, marginTop: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.backgroundElement }}>
                {mapUnavailable ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.backgroundElement }}>
                    <Ionicons name="map-outline" size={48} color="#E50914" style={{ marginBottom: 16 }} />
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>Mapa Indisponível no Momento</Text>
                    <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>A cota de uso foi atingida ou não está configurada corretamente.</Text>
                  </View>
                ) : (
                  <WebView
                    style={{ flex: 1, backgroundColor: colors.backgroundElement }}
                    originWhitelist={['*']}
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                          <style>
                            body { padding: 0; margin: 0; }
                            html, body, #map { height: 100%; width: 100%; background: #ffffff; }
                            .leaflet-container { background: #ffffff; }
                          </style>
                        </head>
                        <body>
                          <div id="map"></div>
                          <script>
                            var map = L.map('map', { zoomControl: false }).setView([${mapRegion.latitude}, ${mapRegion.longitude}], 13);
                            
                            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                              maxZoom: 19,
                              attribution: '&copy; OpenStreetMap contributors'
                            }).addTo(map);

                            var cinemas = ${JSON.stringify(cinemas)};
                            
                            cinemas.forEach(function(c) {
                              if (c.lat && c.lon) {
                                var marker = L.marker([c.lat, c.lon]).addTo(map);
                                marker.bindPopup("<b>" + (c.tags?.name || "Cinema") + "</b><br>" + (c.tags?.['addr:street'] || "Ver Lista"));
                              }
                            });
                          </script>
                        </body>
                        </html>
                      `
                    }}
                  />
                )}
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
                      : 'Nenhum cinema encontrado.'}
                  </Text>
                }
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  
  
  searchSection: {
      padding: 16,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gpsBtnSquare: {
      backgroundColor: '#E50914',
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
  
  
  
  
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: colors.text, fontSize: 16, borderWidth: 1,
    borderColor: colors.border,
  },
  searchBtn: {
    backgroundColor: colors.border,
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  viewToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: colors.backgroundElement,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  toggleBtnActive: {
      backgroundColor: '#E50914',
      borderColor: '#E50914',
    },
  toggleText: {
    color: colors.textSecondary,
    fontWeight: 'bold'
  },
  toggleTextActive: { color: '#fff' },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  cinemaCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E50914',
  },
  cinemaInfo: {
    marginBottom: 16,
  },
  cinemaName: { color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cinemaAddress: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
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
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 14,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
