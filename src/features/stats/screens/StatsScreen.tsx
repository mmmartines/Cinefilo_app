import { NotificationBell } from '../../../components/NotificationBell';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Text as SvgText, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { useStats } from '../hooks/useStats';
import { useAlert } from '../../../contexts/AlertContext';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { GlobalHeader } from '../../../components/GlobalHeader';

export function StatsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  
  const [selectedBadge, setSelectedBadge] = React.useState<any>(null);

  const getRankGradient = (level: number) => {
    if (level >= 20) return ['#4a00e0', '#8e2de2'];
    if (level >= 10) return ['#f12711', '#f5af19'];
    if (level >= 5) return ['#141E30', '#243B55'];
    return ['#29323c', '#485563'];
  };
  
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
    currentChallenge,
    isChallengeCompleted,
  } = useStats();

  const isRankLight = currentLevel >= 10 && currentLevel < 20;
  const cardTextColor = isRankLight ? '#333' : '#fff';
  const cardTextSecondary = isRankLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
  const highlightColor = isRankLight ? '#990000' : '#FFD700';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <GlobalHeader 
          title="Jornada do Herói" 
          rightComponent={
            <TouchableOpacity style={styles.shareButton} onPress={handleShareStats}>
              <Ionicons name="share-social" size={20} color={colors.text} />
            </TouchableOpacity>
          }        />
  
      
            <TouchableOpacity onPress={() => router.push('/wrapped')}>
        <LinearGradient colors={['#FF416C', '#FF4B2B']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.wrappedBanner}>
        <View style={styles.wrappedBannerContent}>
          <Ionicons name="sparkles" size={24} color="#FFD700" />
          <View>
            <Text style={styles.wrappedBannerTitle}>Sua Retrospectiva Anual</Text>
            <Text style={styles.wrappedBannerSubtitle}>Toque para ver seus destaques!</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }} style={{ backgroundColor: colors.border }}>
        <LinearGradient colors={getRankGradient(currentLevel)} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.gamificationCard}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Nível {currentLevel}</Text>
          </View>
          <MotiView
            from={{ translateY: -5 }}
            animate={{ translateY: 5 }}
            transition={{ type: 'timing', duration: 1500, loop: true }}
          >
            <Ionicons name="trophy" size={56} color="#FFD700" />
          </MotiView>
          <Text style={[styles.rankLabel, { color: 'rgba(255,255,255,0.7)' }]}>Sua Patente</Text>
          <Text style={[styles.rankTitle, { color: '#fff' }]}>{gamificationTitle}</Text>
          
          <View style={styles.xpContainer}>
            <View style={styles.xpBarBackground}>
              <MotiView 
                style={styles.xpBarFill} 
                from={{ width: '0%' }} 
                animate={{ width: `${(currentXp % 100)}%` }} 
                transition={{ type: 'spring', damping: 15 }} 
              />
            </View>
            <Text style={[styles.xpText, { color: cardTextColor }]}>{currentXp} / {nextLevelXp} XP</Text>
          </View>
          
          <View style={{ width: '100%', marginTop: 16 }}>
            {currentChallenge && (
              <View style={[styles.challengeBanner, isChallengeCompleted && { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <View style={styles.challengeHeader}>
                  <Ionicons name={isChallengeCompleted ? "checkmark-circle" : "star"} size={16} color={isChallengeCompleted ? "#4CAF50" : "#FFD700"} />
                  <Text style={[styles.challengeTitle, isChallengeCompleted && { color: '#4CAF50' }]}>
                    {isChallengeCompleted ? "Desafio Concluído!" : "Desafio da Semana"}
                  </Text>
                </View>
                <Text style={[styles.challengeText, { color: cardTextColor }]}>
                  {isChallengeCompleted ? "Você garantiu seu XP bônus!" : currentChallenge.desc}
                </Text>
                {!isChallengeCompleted && (
                  <Text style={{ color: highlightColor, fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
                    Recompensa: +{currentChallenge.xp} XP
                  </Text>
                )}
              </View>
            )}
          </View>
        </LinearGradient>

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
              <Defs>
                <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#E50914" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#E50914" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="100" cy="100" r="90" fill="url(#glow)" />
              <Circle cx="100" cy="100" r="80" stroke={colors.border} strokeWidth="1" fill="none" />
              <Circle cx="100" cy="100" r="53" stroke={colors.border} strokeWidth="1" fill="none" />
              <Circle cx="100" cy="100" r="26" stroke={colors.border} strokeWidth="1" fill="none" />
              
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const x2 = 100 + 80 * Math.cos(angle);
                const y2 = 100 + 80 * Math.sin(angle);
                return <Line key={`axis-${i}`} x1="100" y1="100" x2={x2} y2={y2} stroke={colors.border} strokeWidth="1" />;
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
                    fill={colors.text}
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
            <TouchableOpacity onPress={() => setSelectedBadge(b)} key={b.id} style={[styles.badgeItem, !b.unlocked && styles.badgeItemInactive]}>
              <View style={[styles.badgeIconContainer, !b.unlocked ? styles.badgeIconInactive : { borderColor: b.color, backgroundColor: `${b.color}22` }]}>
                <Ionicons name={b.icon as any} size={32} color={b.unlocked ? b.color : "#666"} />
              </View>
              <Text style={[styles.badgeName, !b.unlocked && {color: colors.textSecondary}]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </ViewShot>
    </ScrollView>
  );
}


const getStyles = (colors: any) => StyleSheet.create({
  challengeBanner: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: '#E50914',
    borderRadius: 12,
    padding: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  challengeTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  challengeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: { flex: 1, backgroundColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.backgroundElement },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#E50914', textAlign: 'center' },
  shareButton: { padding: 8, backgroundColor: colors.border, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileIcon: { padding: 8, backgroundColor: colors.border, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: 40, height: 40 },
  gamificationCard: { alignItems: 'center', margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  rankLabel: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textTransform: 'uppercase', letterSpacing: 2 },
  rankTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  levelBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#E50914', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  levelBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  xpContainer: { width: '100%', marginTop: 16, alignItems: 'center' },
  xpBarBackground: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  xpBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 4 },
  xpText: { color: colors.text, fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16 },
  statBox: { flex: 1, backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  podiumSection: { marginHorizontal: 16, marginTop: 16, padding: 16, backgroundColor: colors.backgroundElement, borderRadius: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', minHeight: 200, gap: 12 },
  podiumItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  podiumBar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'center', alignItems: 'center' },
  podiumPosition: { color: '#000', fontWeight: 'bold', fontSize: 20 },
  podiumCount: { color: colors.text, fontWeight: 'bold', marginBottom: 8, fontSize: 16 },
  podiumName: { color: colors.text, fontSize: 11, marginTop: 8, textAlign: 'center', minHeight: 32 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  radarContainer: { alignItems: 'center', justifyContent: 'center' },
  topEmotionsContainer: { marginTop: 24, alignItems: 'center', width: '100%' },
  topEmotionsTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  topEmotionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
  topEmotionBadge: { backgroundColor: colors.border, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  topEmotionBadgeText: { color: colors.text, fontSize: 12, fontWeight: 'bold' },
  emotionPhrase: { color: '#E50914', fontSize: 16, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 16 },
  wrappedBanner: { margin: 16, marginBottom: 0, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 5 },
  wrappedBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrappedBannerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  wrappedBannerSubtitle: { color: '#fff', fontSize: 12 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  badgeItem: { alignItems: 'center', width: 100 },
  badgeItemInactive: { opacity: 0.5 },
  badgeIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 215, 0, 0.2)', borderWidth: 2, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  badgeIconInactive: { backgroundColor: colors.border, borderColor: colors.border },
  badgeName: { color: colors.text, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  badgeModalContent: { backgroundColor: 'rgba(30,30,30,0.9)', padding: 32, borderRadius: 24, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#444' },
  badgeModalTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  badgeModalDesc: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  closeModalBtn: { backgroundColor: '#E50914', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  closeModalText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
