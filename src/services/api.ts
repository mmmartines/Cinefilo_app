import axios from 'axios';

// Chave da API do TMDB (Substitua pela sua chave em um ambiente real ou via .env)
const API_KEY = 'SUA_CHAVE_AQUI'; 
const BASE_URL = 'https://api.themoviedb.org/3';

export const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'pt-BR',
  }
});

export const getPopularMovies = async () => {
  try {
    const response = await api.get('/movie/popular');
    return response.data.results;
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    return [];
  }
};
