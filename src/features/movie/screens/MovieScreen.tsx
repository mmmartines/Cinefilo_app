import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Loading } from '../../../components/Loading';
import YoutubeIframe from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { useAppTheme } from '../../../contexts/ThemeContext';

interface MovieScreenProps {
  movieId: string;
}

export function MovieScreen({ movieId }: MovieScreenProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  
  const {
    movieData,
    isLoading,
    isMovieWatched,
    isMovieInWatchlist,
    isRatingModalVisible,
    setIsRatingModalVisible,
    movieRating,
    setMovieRating,
    movieReview,
    setMovieReview,
    hasMovieSpoiler,
    setHasMovieSpoiler,
    selectedMovieEmotions,
    setSelectedMovieEmotions,
    userCustomLists,
    selectedCustomLists,
    setSelectedCustomLists,
    isChatModalVisible,
    setIsChatModalVisible,
    friendsList,
    selectedFriends,
    setSelectedFriends,
    isCreatingChatGroup,
    isTrailerVisible,
    setIsTrailerVisible,
    trailerVideoKey,
    EMOTIONS,
    handleSaveMovieRating,
    handleAddMovieToWatchlist,
    handleRemoveMovieData,
    handleCreateMovieChatGroup,
    getMovieCertification,
  } = useMovieDetails(movieId);

  if (isLoading || !movieData) {
    return <Loading />;
  }

  const cert = getMovieCertification();
  let certColor = '#00A859';
  if (cert === '10') certColor = '#00A1E0';
  if (cert === '12') certColor = '#FFCC00';
  if (cert === '14') certColor = '#FF6600';
  if (cert === '16') certColor = '#FF0000';
  if (cert === '18') certColor = '#000000';

  const renderRatingStars = (ratingValue: number) => {
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
        <Ionicons name="arrow-back" size={28} color={colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
        >
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w500${movieData.backdrop_path || movieData.poster_path}` }}
              style={styles.backdrop}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(18,18,18,0.8)', colors.border]}
              style={styles.gradientOverlay}
            />
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{movieData.title}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.year}>{movieData.release_date?.substring(0, 4)}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.runtime}>{movieData.runtime} min</Text>
              <Text style={styles.separator}>•</Text>
              <View style={[styles.certBadge, { backgroundColor: certColor }]}>
                <Text style={styles.certText}>{cert}</Text>
              </View>
            </View>
          </View>
        </MotiView>

        <MotiView 
          style={styles.content}
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 200 }}
        >
          {trailerVideoKey && (
            <TouchableOpacity style={styles.trailerButton} onPress={() => setIsTrailerVisible(true)}>
              <Ionicons name="play-circle" size={24} color={colors.text} />
              <Text style={styles.trailerButtonText}>Assistir Trailer</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Sinopse</Text>
          <Text style={styles.overview}>{movieData.overview || 'Sinopse não disponível.'}</Text>
          
          {isMovieWatched && (
            <View style={styles.userReviewCard}>
              <Text style={styles.userReviewTitle}>Sua Avaliação</Text>
              {renderRatingStars(movieRating)}
              {selectedMovieEmotions.length > 0 && (
                <View style={styles.tagsContainerReview}>
                  {selectedMovieEmotions.map((emotionLabel, index) => {
                    const em = EMOTIONS.find(e => e.label === emotionLabel);
                    return (
                      <View key={index} style={[styles.tagBadge, { backgroundColor: em ? `${em.color}22` : '#333', borderColor: em?.color || '#666', borderWidth: 1 }]}>
                        <Text style={[styles.tagTextBadge, { color: em?.color || colors.text }]}>{emotionLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
              {movieReview ? <Text style={styles.userReviewText}>"{movieReview}"</Text> : null}
            </View>
          )}

          {(() => {
            const brProviders = movieData['watch/providers']?.results?.BR;
            if (!brProviders) return null;
            const allProviders = [
              ...(brProviders.flatrate || []),
              ...(brProviders.rent || []),
              ...(brProviders.buy || [])
            ];
            const uniqueProviders = Array.from(new Map(allProviders.map(item => [item.provider_id, item])).values());
            
            if (uniqueProviders.length === 0) return null;

            return (
              <View style={styles.providersSection}>
                <Text style={styles.sectionTitle}>Onde Assistir</Text>
                <View style={styles.providersRow}>
                  {uniqueProviders.map((provider: any) => (
                    <View key={provider.provider_id} style={{ alignItems: 'center', gap: 4 }}>
                      <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                        style={styles.providerLogo}
                        contentFit="cover"
                        transition={200}
                      />
                      <Text style={{ color: '#aaa', fontSize: 10, maxWidth: 60, textAlign: 'center' }} numberOfLines={1}>
                        {provider.provider_name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          <View style={styles.buttonsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.flex1, isMovieWatched && styles.actionButtonWatched]}
              onPress={() => setIsRatingModalVisible(true)}
            >
              <Ionicons name={isMovieWatched ? "checkmark-circle" : "add-circle-outline"} size={20} color={colors.text} />
              <Text style={styles.actionButtonText}>
                {isMovieWatched ? 'Já Assisti' : 'Já Assisti'}
              </Text>
            </TouchableOpacity>

            {!isMovieWatched && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.flex1, isMovieInWatchlist ? styles.actionButtonWatchlistActive : styles.actionButtonWatchlist]}
                onPress={isMovieInWatchlist ? handleRemoveMovieData : handleAddMovieToWatchlist}
              >
                <Ionicons name={isMovieInWatchlist ? "bookmark" : "bookmark-outline"} size={20} color={isMovieInWatchlist ? "#fff" : "#E50914"} />
                <Text style={[styles.actionButtonText, isMovieInWatchlist ? {color: colors.text} : {color: '#E50914'}]}>
                  {isMovieInWatchlist ? 'Salvo' : 'Quero Ver'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => setIsChatModalVisible(true)}
          >
            <Ionicons name="chatbubbles" size={24} color={colors.text} />
            <Text style={styles.chatButtonText}>Discutir com Amigos</Text>
          </TouchableOpacity>

          {movieData.credits?.cast && movieData.credits.cast.length > 0 && (
            <View style={styles.carouselSection}>
              <Text style={styles.sectionTitle}>Elenco Principal</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                {movieData.credits.cast.slice(0, 10).map((actor: any) => (
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

          {movieData.recommendations?.results && movieData.recommendations.results.length > 0 && (
            <View style={styles.carouselSection}>
              <Text style={styles.sectionTitle}>Filmes Semelhantes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
                {movieData.recommendations.results.slice(0, 10).map((rec: any) => (
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
        </MotiView>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isRatingModalVisible}
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avalie o Filme</Text>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setMovieRating(star)}>
                  <Ionicons 
                    name={star <= movieRating ? "star" : "star-outline"} 
                    size={40} 
                    color={star <= movieRating ? "#FFD700" : "#666"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSubtitle}>O que sentiu? (Mínimo 3)</Text>
            <View style={styles.emotionsContainer}>
              {EMOTIONS.map((emotion, index) => {
                const isSelected = selectedMovieEmotions.includes(emotion.label);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.emotionChip,
                      isSelected ? { backgroundColor: `${emotion.color}22`, borderColor: emotion.color } : { borderColor: '#555' }
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedMovieEmotions(prev => prev.filter(e => e !== emotion.label));
                      } else {
                        setSelectedMovieEmotions(prev => [...prev, emotion.label]);
                      }
                    }}
                  >
                    <Text style={[styles.emotionChipText, isSelected ? { color: emotion.color } : { color: '#bbb' }]}>
                      {emotion.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {userCustomLists.length > 0 && (
              <>
                <Text style={styles.modalSubtitle}>Adicionar às Listas</Text>
                <View style={styles.emotionsContainer}>
                  {userCustomLists.map((list) => {
                    const listIdentifier = list._id || list.id;
                    const isSelected = selectedCustomLists.includes(listIdentifier);
                    return (
                      <TouchableOpacity
                        key={listIdentifier}
                        style={[
                          styles.emotionChip,
                          isSelected ? { backgroundColor: 'rgba(229, 9, 20, 0.15)', borderColor: '#E50914' } : { borderColor: '#555' }
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedCustomLists(prev => prev.filter(id => id !== listIdentifier));
                          } else {
                            setSelectedCustomLists(prev => [...prev, listIdentifier]);
                          }
                        }}
                      >
                        <Text style={[styles.emotionChipText, isSelected ? { color: '#E50914' } : { color: '#bbb' }]}>
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
              value={movieReview}
              onChangeText={setMovieReview}
            />

            <View style={styles.spoilerContainer}>
              <Text style={styles.spoilerLabel}>Contém Spoiler?</Text>
              <TouchableOpacity
                style={[styles.spoilerCheckbox, hasMovieSpoiler && styles.spoilerCheckboxActive]}
                onPress={() => setHasMovieSpoiler(!hasMovieSpoiler)}
              >
                {hasMovieSpoiler && <Ionicons name="checkmark" size={16} color={colors.text} />}
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              {isMovieWatched ? (
                <TouchableOpacity style={styles.modalRemove} onPress={handleRemoveMovieData}>
                  <Text style={styles.modalRemoveText}>Remover da Lista</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.modalCancel} onPress={() => setIsRatingModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveMovieRating}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isChatModalVisible}
        onRequestClose={() => setIsChatModalVisible(false)}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Clube do Filme</Text>
            <Text style={styles.modalSubtitle}>Selecione os amigos para o clube:</Text>
            
            <ScrollView style={{ width: '100%', maxHeight: 200, marginBottom: 24 }}>
              {friendsList.length === 0 ? (
                <Text style={{ color: '#999', textAlign: 'center', marginTop: 16 }}>Nenhum amigo encontrado.</Text>
              ) : (
                friendsList.map(friend => {
                  const isSelected = selectedFriends.some(f => f.id === friend.id);
                  return (
                    <TouchableOpacity 
                      key={friend.id} 
                      style={[styles.friendSelectRow, isSelected && styles.friendSelectRowActive]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedFriends(prev => prev.filter(f => f.id !== friend.id));
                        } else {
                          setSelectedFriends(prev => [...prev, friend]);
                        }
                      }}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={colors.text} />}
                      </View>
                      <Text style={[styles.friendSelectName, isSelected && { color: '#E50914' }]}>{friend.name}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsChatModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleCreateMovieChatGroup} disabled={isCreatingChatGroup}>
                {isCreatingChatGroup ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.modalBtnText}>Criar Chat</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal visible={isTrailerVisible} transparent animationType="slide">
        <View style={styles.trailerModalOverlay}>
          <View style={styles.trailerModalContent}>
            <TouchableOpacity style={styles.closeTrailerButton} onPress={() => setIsTrailerVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            {Platform.OS === 'web' ? (
               <iframe 
                 width="100%" 
                 height="250" 
                 src={`https://www.youtube.com/embed/${trailerVideoKey}?autoplay=1`} 
                 frameBorder="0" 
                 allow="autoplay; encrypted-media" 
                 allowFullScreen 
               />
            ) : (
               <YoutubeIframe
                 height={250}
                 play={true}
                 videoId={trailerVideoKey || ''}
               />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.border },
  headerInfo: { padding: 24 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  year: { color: '#ccc' },
  separator: { color: '#ccc' },
  runtime: { color: '#ccc' },
  backButton: { position: 'absolute', top: 48, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  backdrop: { width: '100%', height: 350 },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  certBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  certText: { color: colors.text, fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  overview: { color: '#ccc', fontSize: 16, lineHeight: 24 },
  trailerButton: { backgroundColor: '#333', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 8, marginBottom: 24 },
  trailerButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 16 },
  providersSection: { marginBottom: 24 },
  providersRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  providerLogo: { width: 48, height: 48, borderRadius: 8 },
  userReviewCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#E50914' },
  userReviewTitle: { color: colors.text, fontWeight: 'bold', marginBottom: 8 },
  starsRowReview: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  userReviewText: { color: '#ccc', fontStyle: 'italic' },
  buttonsRow: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  actionButton: { backgroundColor: '#E50914', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  actionButtonWatched: { backgroundColor: '#00A859' },
  actionButtonWatchlist: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E50914' },
  actionButtonWatchlistActive: { backgroundColor: '#333', borderWidth: 1, borderColor: '#333' },
  actionButtonText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  chatButton: { backgroundColor: '#333', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, borderRadius: 12, marginTop: 16 },
  chatButtonText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  carouselSection: { marginTop: 32 },
  carouselContainer: { gap: 16, paddingRight: 24 },
  actorCard: { width: 100 },
  actorImage: { width: 100, height: 150, borderRadius: 8, marginBottom: 8 },
  actorName: { color: colors.text, fontWeight: 'bold', fontSize: 12 },
  actorRole: { color: '#999', fontSize: 10 },
  recCard: { width: 120 },
  recImage: { width: 120, height: 180, borderRadius: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1E1E1E', width: '90%', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  reviewInput: { backgroundColor: colors.border, width: '100%', color: colors.text, borderRadius: 8, padding: 16, height: 100, textAlignVertical: 'top', marginBottom: 16 },
  spoilerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: '#2A2A2A', padding: 12, borderRadius: 8, marginBottom: 24 },
  spoilerLabel: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  spoilerCheckbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#666', alignItems: 'center', justifyContent: 'center' },
  spoilerCheckboxActive: { backgroundColor: '#E50914', borderColor: '#E50914' },
  modalButtons: { flexDirection: 'row', gap: 16, width: '100%' },
  modalCancel: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#333', alignItems: 'center' },
  modalCancelText: { color: colors.text, fontWeight: 'bold' },
  modalRemove: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#222', alignItems: 'center', borderWidth: 1, borderColor: '#E50914' },
  modalRemoveText: { color: '#E50914', fontWeight: 'bold' },
  modalSave: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#E50914', alignItems: 'center' },
  modalSaveText: { color: colors.text, fontWeight: 'bold' },
  modalSubtitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12, alignSelf: 'flex-start' },
  emotionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  emotionChip: { borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  emotionChipText: { fontSize: 12, fontWeight: 'bold' },
  tagsContainerReview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tagBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  tagTextBadge: { color: colors.text, fontSize: 10, fontWeight: 'bold' },
  modalInput: { backgroundColor: colors.border, color: colors.text, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#333', marginBottom: 24, width: '100%' },
  friendSelectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  friendSelectRowActive: { backgroundColor: 'rgba(229, 9, 20, 0.05)' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#666', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#E50914', borderColor: '#E50914' },
  friendSelectName: { color: colors.text, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, width: '100%' },
  modalBtnCancel: { padding: 12 },
  modalBtnSave: { backgroundColor: '#E50914', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: colors.text, fontWeight: 'bold' },
  trailerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', paddingTop: Platform.OS === 'android' ? 60 : 40 },
  trailerModalContent: { width: '100%', alignItems: 'center' },
  closeTrailerButton: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 16, padding: 8 }
});
