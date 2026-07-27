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

export const getWatchProviders = async () => {
  try {
    const response = await api.get('/watch/providers/movie', {
      params: { language: 'pt-BR', watch_region: 'BR' }
    });
    return response.data.results;
  } catch (error) {
    console.error('Erro ao buscar provedores de streaming:', error);
    return [];
  }
};


export const fetchFilteredMovies = async (page: number = 1, query: string = '', genreIds: number[] = [], year: string = '', watchProvidersIds: number[] = []) => {
  try {
    let endpoint = '/movie/popular';
    let params: any = { language: 'pt-BR', page };

    if (query.trim() !== '') {
      // Busca por nome
      endpoint = '/search/movie';
      params.query = query;
      if (year) params.primary_release_year = year;

      const response = await api.get(endpoint, { params });
      let results = response.data.results;

      if (genreIds.length > 0) {
        // Filtragem local se tiver busca + generos (agora com lógica OU)
        results = results.filter((movie: any) => movie.genre_ids.some((id: number) => genreIds.includes(id)));
      }
      return results;

    } else if (genreIds.length > 0 || year || watchProvidersIds.length > 0) {
      // Rota de descoberta
      endpoint = '/discover/movie';
      if (genreIds.length > 0) params.with_genres = genreIds.join('|'); // Lógica OU
      if (year) params.primary_release_year = year;
      if (watchProvidersIds.length > 0) {
        params.with_watch_providers = watchProvidersIds.join('|');
        params.watch_region = 'BR';
      }

      const response = await api.get(endpoint, { params });
      return response.data.results;
    } else {
      // Populares
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

export const getUpcomingMovies = async (page: number = 1) => {
  try {
    const response = await api.get('/movie/upcoming', {
      params: { language: 'pt-BR', page, region: 'BR' }
    });
    return response.data.results;
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return [];
  }
};

