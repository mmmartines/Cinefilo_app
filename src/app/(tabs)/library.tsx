import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GlobalHeader } from '../../components/GlobalHeader';
import { MyMoviesScreen } from '../../features/myMovies/screens/MyMoviesScreen';
import { ListsScreen } from '../../features/lists/screens/ListsScreen';

export default function LibraryTab() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  
  const [activeTab, setActiveTab] = useState<'my-movies' | 'lists'>('my-movies');

  return (
    <View style={styles.container}>
      <GlobalHeader title={activeTab === 'my-movies' ? 'Meus Filmes' : 'Minhas Listas'} />

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'my-movies' && styles.activeTab]} 
          onPress={() => setActiveTab('my-movies')}
        >
          <Text style={[styles.tabText, activeTab === 'my-movies' && styles.activeTabText]}>Meus Filmes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'lists' && styles.activeTab]} 
          onPress={() => setActiveTab('lists')}
        >
          <Text style={[styles.tabText, activeTab === 'lists' && styles.activeTabText]}>Listas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'my-movies' && <MyMoviesScreen />}
        {activeTab === 'lists' && <ListsScreen />}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.border },
  tabsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    backgroundColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tabButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderBottomWidth: 2, 
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  activeTab: { borderBottomColor: '#E50914' },
  tabText: { color: colors.textSecondary, fontWeight: 'bold' },
  activeTabText: { color: colors.text },
  content: {
    flex: 1,
  }
});
