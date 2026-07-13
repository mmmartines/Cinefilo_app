import AsyncStorage from '@react-native-async-storage/async-storage';

export const cache = {
  async set(key: string, value: any) {
    try {
      await AsyncStorage.setItem(`@cinefilo_cache_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Erro ao salvar cache [${key}]`, e);
    }
  },

  async get(key: string) {
    try {
      const value = await AsyncStorage.getItem(`@cinefilo_cache_${key}`);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error(`Erro ao ler cache [${key}]`, e);
      return null;
    }
  }
};
