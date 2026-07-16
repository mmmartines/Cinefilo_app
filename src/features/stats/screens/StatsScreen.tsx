import { NotificationBell } from '../../../components/NotificationBell';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { useStats } from '../hooks/useStats';
import { useAlert } from '../../../contexts/AlertContext';

export function StatsScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  
  const {
    isLoading,
    totalMoviesWatched,
    averageRating,
    topGenres,
    radarEmotions,
    realTopEmotions,
    emotionPhrase,
    gamificationTitle,
    userAvatarUrl,
    currentXp,
    currentLevel,
    nextLevelXp,
    userBadges,
    viewShotRef,
    handleShareStats,
    formattedWatchTime,
  } = useStats();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareStats}>
          <Ionicons name="share-social" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estatísticas</Text>
        <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/profile')}>
          {userAvatarUrl ? (
            <Image source={{ uri: userAvatarUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.wrappedBanner} onPress={() => router.push('/wrapped')}>
        <View style={styles.wrappedBannerContent}>
          <Ionicons name="sparkles" size={24} color="#FFD700" />
          <View>
            <Text style={styles.wrappedBannerTitle}>Sua Retrospectiva Anual</Text>
            <Text style={styles.wrappedBannerSubtitle}>Toque para ver seus destaques!</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }} style={{ backgroundColor: '#121212' }}>
        <View style={styles.gamificationCard}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Nível {currentLevel}</Text>
          </View>
          <Ionicons name="trophy" size={48} color="#FFD700" />
          <Text style={styles.rankLabel}>Sua Patente</Text>
          <Text style={styles.rankTitle}>{gamificationTitle}</Text>
          
          <View style={styles.xpContainer}>
            <View style={styles.xpBarBackground}>
              <View style={[styles.xpBarFill, { width: `${(currentXp % 100)}%` }]} />
            </View>
            <Text style={styles.xpText}>{currentXp} / {nextLevelXp} XP</Text>
          </View>
        </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={28} color="#E50914" />
          <Text style={styles.statValue}>{formattedWatchTime}</Text>
          <Text style={styles.statLabel}>Tempo de Vida Assistido</Text>
        </View>
      </View>

      <View style={[styles.statsRow, { marginTop: 16 }]}>
        <View style={styles.statBox}>
          <Ionicons name="film-outline" size={28} color="#E50914" />
          <Text style={styles.statValue}>{totalMoviesWatched}</Text>
          <Text style={styles.statLabel}>Filmes</Text>
        </View>
        
        <View style={styles.statBox}>
          <Ionicons name="star-outline" size={28} color="#FFD700" />
          <Text style={styles.statValue}>{averageRating}</Text>
          <Text style={styles.statLabel}>Média</Text>
        </View>
      </View>

      <View style={styles.podiumSection}>
        <Text style={styles.sectionTitle}>Gêneros Favoritos</Text>
        {topGenres.length > 0 ? (
          <View style={styles.podiumContainer}>
            {topGenres[1] ? (
              <View style={styles.podiumItem}>
                <Text style={styles.podiumCount}>{topGenres[1].count}</Text>
                <MotiView 
                  style={[styles.podiumBar, { backgroundColor: '#C0C0C0' }]}
                  from={{ height: 0 }}
                  animate={{ height: 80 }}
                  transition={{ type: 'spring', delay: 200 }}
                >
                  <Text style={styles.podiumPosition}>2º</Text>
                </MotiView>
                <Text style={styles.podiumName}>{topGenres[1].name}</Text>
              </View>
            ) : <View style={styles.podiumItem} />}

            {topGenres[0] ? (
              <View style={styles.podiumItem}>
                <Ionicons name="star" size={24} color="#FFD700" style={{marginBottom: 4}}/>
                <Text style={styles.podiumCount}>{topGenres[0].count}</Text>
                <MotiView 
                  style={[styles.podiumBar, { backgroundColor: '#FFD700' }]}
                  from={{ height: 0 }}
                  animate={{ height: 120 }}
                  transition={{ type: 'spring', delay: 400 }}
                >
                  <Text style={styles.podiumPosition}>1º</Text>
                </MotiView>
                <Text style={styles.podiumName}>{topGenres[0].name}</Text>
              </View>
            ) : <View style={styles.podiumItem} />}

            {topGenres[2] ? (
              <View style={styles.podiumItem}>
                <Text style={styles.podiumCount}>{topGenres[2].count}</Text>
                <MotiView 
                  style={[styles.podiumBar, { backgroundColor: '#CD7F32' }]}
                  from={{ height: 0 }}
                  animate={{ height: 60 }}
                  transition={{ type: 'spring', delay: 600 }}
                >
                  <Text style={styles.podiumPosition}>3º</Text>
                </MotiView>
                <Text style={styles.podiumName}>{topGenres[2].name}</Text>
              </View>
            ) : <View style={styles.podiumItem} />}
          </View>
        ) : (
          <Text style={styles.emptyText}>Avalie filmes para gerar seu pódio!</Text>
        )}
      </View>

      <View style={styles.podiumSection}>
        <Text style={styles.sectionTitle}>Radar de Emoções</Text>
        
        {radarEmotions.length === 6 && radarEmotions[0].name !== '' ? (
          <MotiView 
            style={styles.radarContainer}
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 1000, delay: 500 }}
          >
            <Svg height="250" width="100%" viewBox="-40 -20 280 240">
              <Circle cx="100" cy="100" r="80" stroke="#333" strokeWidth="1" fill="none" />
              <Circle cx="100" cy="100" r="53" stroke="#333" strokeWidth="1" fill="none" />
              <Circle cx="100" cy="100" r="26" stroke="#333" strokeWidth="1" fill="none" />
              
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const x2 = 100 + 80 * Math.cos(angle);
                const y2 = 100 + 80 * Math.sin(angle);
                return <Line key={`axis-${i}`} x1="100" y1="100" x2={x2} y2={y2} stroke="#333" strokeWidth="1" />;
              })}

              <Polygon
                points={radarEmotions.map((em, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const max = em.maxValue;
                  const ratio = max > 0 ? (em.count / max) : 0;
                  const radius = ratio * 80;
                  return `${100 + radius * Math.cos(angle)},${100 + radius * Math.sin(angle)}`;
                }).join(' ')}
                fill="rgba(229, 9, 20, 0.4)"
                stroke="#E50914"
                strokeWidth="2"
              />

              {radarEmotions.map((em, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const labelRadius = 95;
                const lx = 100 + labelRadius * Math.cos(angle);
                const ly = 100 + labelRadius * Math.sin(angle);
                return (
                  <SvgText
                    key={`label-${i}`}
                    x={lx}
                    y={ly + 4}
                    fill="#fff"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {em.name}
                  </SvgText>
                );
              })}
            </Svg>

            {realTopEmotions.length > 0 && (
              <View style={styles.topEmotionsContainer}>
                <Text style={styles.topEmotionsTitle}>Suas Principais Emoções</Text>
                <View style={styles.topEmotionsRow}>
                  {realTopEmotions.map((em, index) => (
                    <View key={index} style={styles.topEmotionBadge}>
                      <Text style={styles.topEmotionBadgeText}>
                        {index + 1}º {em.name}
                      </Text>
                    </View>
                  ))}
                </View>
                {emotionPhrase ? (
                  <Text style={styles.emotionPhrase}>"{emotionPhrase}"</Text>
                ) : null}
              </View>
            )}
          </MotiView>
        ) : (
           <Text style={styles.emptyText}>Avalie mais filmes escolhendo suas emoções para gerar o radar.</Text>
        )}
      </View>

      <View style={styles.podiumSection}>
        <Text style={styles.sectionTitle}>Minhas Conquistas</Text>
        <View style={styles.badgesGrid}>
          {userBadges.map(b => (
            <TouchableOpacity onPress={() => showAlert(b.name, b.unlocked ? b.description : 'Continue assistindo para desbloquear esta conquista!')} key={b.id} style={[styles.badgeItem, !b.unlocked && styles.badgeItemInactive]}>
              <View style={[styles.badgeIconContainer, !b.unlocked ? styles.badgeIconInactive : { borderColor: b.color, backgroundColor: `${b.color}22` }]}>
                <Ionicons name={b.icon as any} size={32} color={b.unlocked ? b.color : "#666"} />
              </View>
              <Text style={[styles.badgeName, !b.unlocked && {color: '#666'}]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </ViewShot>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#1E1E1E' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#E50914', textAlign: 'center' },
  shareButton: { padding: 8, backgroundColor: '#333', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileIcon: { padding: 8, backgroundColor: '#333', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 40, height: 40 },
  gamificationCard: { alignItems: 'center', backgroundColor: '#1E1E1E', margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
  rankLabel: { color: '#999', fontSize: 14, marginTop: 8, textTransform: 'uppercase', letterSpacing: 2 },
  rankTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  levelBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#E50914', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  levelBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  xpContainer: { width: '100%', marginTop: 16, alignItems: 'center' },
  xpBarBackground: { width: '100%', height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  xpBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  xpText: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16 },
  statBox: { flex: 1, backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: '#999', fontSize: 12, marginTop: 4 },
  podiumSection: { marginHorizontal: 16, marginTop: 16, padding: 16, backgroundColor: '#1E1E1E', borderRadius: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', minHeight: 200, gap: 12 },
  podiumItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  podiumBar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'center', alignItems: 'center' },
  podiumPosition: { color: '#000', fontWeight: 'bold', fontSize: 20 },
  podiumCount: { color: '#ccc', fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  podiumName: { color: '#fff', fontSize: 11, marginTop: 8, textAlign: 'center', minHeight: 32 },
  emptyText: { color: '#666', textAlign: 'center', fontStyle: 'italic' },
  radarContainer: { alignItems: 'center', justifyContent: 'center' },
  topEmotionsContainer: { marginTop: 24, alignItems: 'center', width: '100%' },
  topEmotionsTitle: { color: '#999', fontSize: 14, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  topEmotionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
  topEmotionBadge: { backgroundColor: '#333', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#444' },
  topEmotionBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emotionPhrase: { color: '#E50914', fontSize: 16, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 16 },
  wrappedBanner: { backgroundColor: '#6200EE', margin: 16, marginBottom: 0, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 5 },
  wrappedBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrappedBannerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  wrappedBannerSubtitle: { color: '#ccc', fontSize: 12 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  badgeItem: { alignItems: 'center', width: 100 },
  badgeItemInactive: { opacity: 0.5 },
  badgeIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 215, 0, 0.2)', borderWidth: 2, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  badgeIconInactive: { backgroundColor: '#222', borderColor: '#444' },
  badgeName: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }
});
