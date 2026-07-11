import axios from 'axios';

// Chave da API do TMDB
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

export const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'pt-BR',
  }
});

export const getGenres = async () => {
  try {
    const response = await api.get('/genre/movie/list', {
      params: { language: 'pt-BR' }
    });
    return response.data.genres;
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
    return [];
  }
};

export const fetchFilteredMovies = async (page: number = 1, query: string = '', genreId: number | null = null, year: string = '') => {
  try {
    let endpoint = '/movie/popular';
    let params: any = { language: 'pt-BR', page };

    if (query.trim() !== '') {
      // Usar a rota de busca
      endpoint = '/search/movie';
      params.query = query;
      if (year) {
        params.primary_release_year = year;
      }

      const response = await api.get(endpoint, { params });
      let results = response.data.results;

      // Filtro local por gênero, já que a API de search não aceita with_genres
      if (genreId) {
        results = results.filter((movie: any) => movie.genre_ids.includes(genreId));
      }
      return results;

    } else if (genreId || year) {
      // Usar a rota de descoberta
      endpoint = '/discover/movie';
      if (genreId) params.with_genres = genreId;
      if (year) params.primary_release_year = year;

      const response = await api.get(endpoint, { params });
      return response.data.results;

    } else {
      // Nem query, nem genre, nem year: retorna populares
      const response = await api.get(endpoint, { params });
      return response.data.results;
    }
  } catch (error) {
    console.error('Erro ao buscar filmes filtrados:', error);
    return [];
  }
};

export const getMovieDetails = async (movieId: number) => {
  try {
    const response = await api.get(`/movie/${movieId}`, {
      params: {
        language: 'pt-BR',
        append_to_response: 'release_dates,credits,recommendations,videos,watch/providers' // Adicionado videos e providers
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do filme ${movieId}:`, error);
    return null;
  }
};
