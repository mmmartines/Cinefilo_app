import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMovieDetails } from '../../services/api';
import { database } from '../../services/database';
import { Loading } from '../../components/Loading';
import YoutubeIframe from 'react-native-youtube-iframe';

export default function MovieDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [customLists, setCustomLists] = useState<any[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  
  // Trailer Modal
  const [trailerVisible, setTrailerVisible] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  
  const EMOTIONS = [
    { label: 'Feliz', type: 'good', color: '#4CAF50' },
    { label: 'Empolgado', type: 'good', color: '#4CAF50' },
    { label: 'Inspirado', type: 'good', color: '#4CAF50' },
    { label: 'Nostálgico', type: 'good', color: '#4CAF50' },
    { label: 'Apaixonado', type: 'good', color: '#4CAF50' },

    { label: 'Reflexivo', type: 'neutral', color: '#9E9E9E' },
    { label: 'Confuso', type: 'neutral', color: '#9E9E9E' },
    { label: 'Entediado', type: 'neutral', color: '#9E9E9E' },
    { label: 'Cansado', type: 'neutral', color: '#9E9E9E' },
    { label: 'Relaxado', type: 'neutral', color: '#9E9E9E' },

    { label: 'Triste', type: 'bad', color: '#2196F3' },
    { label: 'Assustado', type: 'bad', color: '#9C27B0' },
    { label: 'Tenso', type: 'bad', color: '#FF9800' },
    { label: 'Revoltado', type: 'bad', color: '#F44336' },
    { label: 'Decepção', type: 'bad', color: '#F44336' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const data = await getMovieDetails(Number(id));
      setMovie(data);
      
      const currentUser = await database.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const watchedList = await database.getWatchedMovies(currentUser.id);
        const watched = watchedList.find((w: any) => w.movieId === Number(id));
        if (watched) {
          if (watched.status === 'watchlist') {
            setInWatchlist(true);
          } else {
            setIsWatched(true);
            setRating(watched.rating);
            setReview(watched.review || '');
            setSelectedEmotions(watched.emotions || []);
          }
        }
        const userLists = await database.getCustomLists(currentUser.id);
        setCustomLists(userLists);
        
        // Verificar em quais listas já está
        const inLists = userLists.filter((l: any) => l.movies.some((m: any) => m.movieId === Number(id))).map((l: any) => l._id);
        setSelectedLists(inLists);
      }
      
      // Procura trailer
      if (data.videos && data.videos.results) {
        const trailer = data.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      }
      
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (rating === 0) {
      Alert.alert('Aviso', 'Por favor, dê uma nota de 1 a 5 estrelas.');
      return;
    }
    
    if (selectedEmotions.length < 3) {
      Alert.alert('Aviso', 'Por favor, selecione pelo menos 3 emoções que o filme lhe causou.');
      return;
    }
    
    try {
      await database.saveWatchedMovie(user.id, movie, rating, review, movie.runtime, selectedEmotions);
      
      // Salvar nas listas customizadas
      for (const listId of selectedLists) {
         await database.addMovieToCustomList(user.id, listId, movie);
      }

      setIsWatched(true);
      setInWatchlist(false);
      setModalVisible(false);
      Alert.alert('Sucesso', 'Filme salvo na sua lista!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o filme.');
    }
  };

  const handleWatchlist = async () => {
    try {
      await database.saveWatchedMovie(user.id, movie, 0, '', movie.runtime, [], 'watchlist');
      setInWatchlist(true);
      Alert.alert('Sucesso', 'Adicionado à sua Watchlist!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    }
  };

  const handleRemove = async () => {
    try {
      await database.removeWatchedMovie(user.id, movie.id);
      setIsWatched(false);
      setInWatchlist(false);
      setRating(0);
      setReview('');
      setSelectedEmotions([]);
      setModalVisible(false);
      Alert.alert('Sucesso', 'Filme removido da sua lista.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o filme.');
    }
  };

  const getCertification = () => {
    if (!movie?.release_dates?.results) return 'N/A';
    const brRelease = movie.release_dates.results.find((r: any) => r.iso_3166_1 === 'BR');
    if (brRelease && brRelease.release_dates.length > 0) {
      const cert = brRelease.release_dates[0].certification;
      return cert || 'L';
    }
    return 'L';
  };

  const cert = getCertification();
  let certColor = '#00A859';
  if (cert === '10') certColor = '#00A1E0';
  if (cert === '12') certColor = '#FFCC00';
  if (cert === '14') certColor = '#FF6600';
  if (cert === '16') certColor = '#FF0000';
  if (cert === '18') certColor = '#000000';
  if (loading || !movie) {
    return <Loading />;
  }
  const renderStars = (ratingValue: number) => {
    const stars = [];
    for(let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons 
          key={i} 
          name={i <= ratingValue ? "star" : "star-outline"} 
          size={16} 
          color="#FFD700" 
        />
      );
    }
    return <View style={styles.starsRowReview}>{stars}</View>;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}` }}
          style={styles.backdrop}
          contentFit="cover"
          transition={300}
        />
        
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{movie.title}</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.year}>{movie.release_date?.substring(0, 4)}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.runtime}>{movie.runtime} min</Text>
            <Text style={styles.separator}>•</Text>
            <View style={[styles.certBadge, { backgroundColor: certColor }]}>
              <Text style={styles.certText}>{cert}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {trailerKey && (
            <TouchableOpacity style={styles.trailerButton} onPress={() => setTrailerVisible(true)}>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.trailerButtonText}>Assistir Trailer</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Sinopse</Text>
          <Text style={styles.overview}>{movie.overview || 'Sinopse não disponível.'}</Text>
          
          {isWatched && (
            <View style={styles.userReviewCard}>
              <Text style={styles.userReviewTitle}>Sua Avaliação</Text>
              {renderStars(rating)}
              {selectedEmotions.length > 0 && (
                <View style={styles.tagsContainerReview}>
                  {selectedEmotions.map((emotionLabel, index) => {
                    const em = EMOTIONS.find(e => e.label === emotionLabel);
                    return (
                      <View key={index} style={[styles.tagBadge, { backgroundColor: em?.color || '#666' }]}>
                        <Text style={styles.tagTextBadge}>{emotionLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
              {review ? <Text style={styles.userReviewText}>"{review}"</Text> : null}
            </View>
          )}

          {/* Onde Assistir (Providers) */}
          {movie['watch/providers']?.results?.BR?.flatrate && (
            <View style={styles.providersSection}>
              <Text style={styles.sectionTitle}>Onde Assistir</Text>
              <View style={styles.providersRow}>
                {movie['watch/providers'].results.BR.flatrate.map((provider: any) => (
                  <Image
                    key={provider.provider_id}
                    source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                    style={styles.providerLogo}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.flex1, isWatched && styles.actionButtonWatched]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name={isWatched ? "checkmark-circle" : "add-circle-outline"} size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {isWatched ? 'Já Assisti' : 'Já Assisti'}
              </Text>
            </TouchableOpacity>

            {!isWatched && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.flex1, inWatchlist ? styles.actionButtonWatchlistActive : styles.actionButtonWatchlist]}
                onPress={inWatchlist ? handleRemove : handleWatchlist}
              >
                <Ionicons name={inWatchlist ? "bookmark" : "bookmark-outline"} size={20} color={inWatchlist ? "#fff" : "#E50914"} />
                <Text style={[styles.actionButtonText, inWatchlist ? {color: '#fff'} : {color: '#E50914'}]}>
                  {inWatchlist ? 'Salvo' : 'Quero Ver'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Elenco */}
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <View style={styles.carouselSection}>
              <Text style={styles.sectionTitle}>Elenco Principal</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                {movie.credits.cast.slice(0, 10).map((actor: any) => (
                  <View key={actor.id} style={actor.profile_path ? styles.actorCard : [styles.actorCard, {display: 'none'}]}>
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w185${actor.profile_path}` }}
                      style={styles.actorImage}
                      contentFit="cover"
                      transition={200}
                    />
                    <Text style={styles.actorName} numberOfLines={1}>{actor.name}</Text>
                    <Text style={styles.actorRole} numberOfLines={1}>{actor.character}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Filmes Semelhantes */}
          {movie.recommendations?.results && movie.recommendations.results.length > 0 && (
            <View style={styles.carouselSection}>
              <Text style={styles.sectionTitle}>Filmes Semelhantes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                {movie.recommendations.results.slice(0, 10).map((rec: any) => (
                  <TouchableOpacity 
                    key={rec.id} 
                    style={styles.recCard}
                    onPress={() => router.push(`/movie/${rec.id}`)}
                  >
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w342${rec.poster_path}` }}
                      style={styles.recImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Avaliação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avalie o Filme</Text>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color={star <= rating ? "#FFD700" : "#666"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSubtitle}>O que sentiu? (Mínimo 3)</Text>
            <View style={styles.emotionsContainer}>
              {EMOTIONS.map((emotion, index) => {
                const isSelected = selectedEmotions.includes(emotion.label);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.emotionChip,
                      isSelected ? { backgroundColor: emotion.color, borderColor: emotion.color } : { borderColor: '#555' }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedEmotions(prev => prev.filter(e => e !== emotion.label));
                      } else {
                        setSelectedEmotions(prev => [...prev, emotion.label]);
                      }
                    }}
                  >
                    <Text style={[styles.emotionChipText, isSelected ? { color: '#fff' } : { color: '#bbb' }]}>
                      {emotion.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {customLists.length > 0 && (
              <>
                <Text style={styles.modalSubtitle}>Adicionar às Listas</Text>
                <View style={styles.emotionsContainer}>
                  {customLists.map((list) => {
                    const isSelected = selectedLists.includes(list._id);
                    return (
                      <TouchableOpacity
                        key={list._id}
                        style={[
                          styles.emotionChip,
                          isSelected ? { backgroundColor: '#E50914', borderColor: '#E50914' } : { borderColor: '#555' }
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedLists(prev => prev.filter(id => id !== list._id));
                          } else {
                            setSelectedLists(prev => [...prev, list._id]);
                          }
                        }}
                      >
                        <Text style={[styles.emotionChipText, isSelected ? { color: '#fff' } : { color: '#bbb' }]}>
                          {list.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <TextInput
              style={styles.reviewInput}
              placeholder="O que achou do filme? (Opcional)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              value={review}
              onChangeText={setReview}
            />

            <View style={styles.modalButtons}>
              {isWatched ? (
                <TouchableOpacity style={styles.modalRemove} onPress={handleRemove}>
                  <Text style={styles.modalRemoveText}>Remover da Lista</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Trailer Modal */}
      <Modal visible={trailerVisible} transparent animationType="slide">
        <View style={styles.trailerModalOverlay}>
          <View style={styles.trailerModalContent}>
            <TouchableOpacity style={styles.closeTrailerButton} onPress={() => setTrailerVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {Platform.OS === 'web' ? (
               <iframe 
                 width="100%" 
                 height="250" 
                 src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} 
                 frameBorder="0" 
                 allow="autoplay; encrypted-media" 
                 allowFullScreen 
               />
            ) : (
               <YoutubeIframe
                 height={250}
                 play={true}
                 videoId={trailerKey || ''}
               />
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerInfo: {
    padding: 24,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  year: {
    color: '#ccc',
  },
  separator: {
    color: '#ccc',
  },
  runtime: {
    color: '#ccc',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  backdrop: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  certBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  certText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  overview: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  trailerButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  trailerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  providersSection: {
    marginBottom: 24,
  },
  providersRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  userReviewCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#E50914',
  },
  userReviewTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  starsRowReview: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  userReviewText: {
    color: '#ccc',
    fontStyle: 'italic',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  actionButtonWatched: {
    backgroundColor: '#00A859',
  },
  actionButtonWatchlist: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E50914',
  },
  actionButtonWatchlistActive: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselSection: {
    marginTop: 32,
  },
  carouselContainer: {
    gap: 16,
    paddingRight: 24,
  },
  actorCard: {
    width: 100,
  },
  actorImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  actorName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actorRole: {
    color: '#999',
    fontSize: 10,
  },
  recCard: {
    width: 120,
  },
  recImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    width: '90%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  reviewInput: {
    backgroundColor: '#121212',
    width: '100%',
    color: '#fff',
    borderRadius: 8,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalRemove: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E50914',
  },
  modalRemoveText: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  modalSave: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#E50914',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  emotionChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  emotionChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagsContainerReview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tagTextBadge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  trailerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 60 : 40,
  },
  trailerModalContent: {
    width: '100%',
    alignItems: 'center',
  },
  closeTrailerButton: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 16,
    padding: 8,
  }
});
