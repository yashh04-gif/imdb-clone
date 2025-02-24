const API_KEY = '797e81f83e84e0fe85ca2a8bff917f51';
const BASE_URL = 'https://api.themoviedb.org/3';

// Error types
export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR'
};

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.message.includes('429')) {
    return {
      error: ErrorType.RATE_LIMIT,
      message: 'API rate limit exceeded. Please try again later.'
    };
  }
  if (error.message.includes('401')) {
    return {
      error: ErrorType.AUTH,
      message: 'Authentication failed. Please check your API key.'
    };
  }
  if (error.message.includes('404')) {
    return {
      error: ErrorType.NOT_FOUND,
      message: 'Resource not found.'
    };
  }
  if (!navigator.onLine) {
    return {
      error: ErrorType.NETWORK,
      message: 'Network connection lost. Please check your internet connection.'
    };
  }
  return { error: ErrorType.API, message: 'An API error occurred. Please try again.' };
};

export const fetchTrendingMovies = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      rating: movie.vote_average,
      image: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 'Unknown',
      genre_ids: movie.genre_ids,
      overview: movie.overview,
    }));
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return [];
  }
};

export const fetchTopRatedMovies = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      rating: movie.vote_average,
      image: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 'Unknown',
      genre_ids: movie.genre_ids,
      overview: movie.overview,
    }));
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    return [];
  }
};

export const fetchMovieDetails = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos`
    );
    const data = await response.json();
    return {
      id: data.id,
      title: data.title,
      rating: data.vote_average,
      image: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      backdrop: data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : null,
      year: data.release_date
        ? new Date(data.release_date).getFullYear()
        : 'Unknown',
      genres: data.genres,
      overview: data.overview,
      runtime: data.runtime,
      cast: data.credits.cast,
      videos: data.videos.results,
    };
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
};

export const fetchActorDetails = async (actorId) => {
  try {
    const [personResponse, creditsResponse] = await Promise.all([
      fetch(`${BASE_URL}/person/${actorId}?api_key=${API_KEY}`),
      fetch(`${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`)
    ]);
    
    const personData = await personResponse.json();
    const creditsData = await creditsResponse.json();
    
    return {
      id: personData.id,
      name: personData.name,
      biography: personData.biography,
      birthday: personData.birthday,
      place_of_birth: personData.place_of_birth,
      profile_path: personData.profile_path
        ? `https://image.tmdb.org/t/p/w500${personData.profile_path}`
        : null,
      known_for: creditsData.cast
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10)
    };
  } catch (error) {
    console.error('Error fetching actor details:', error);
    return null;
  }
};

export const fetchPopularActors = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/person/popular?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return {
      actors: data.results.map((actor) => ({
        id: actor.id,
        name: actor.name,
        profile_path: actor.profile_path
          ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
          : null,
        known_for_department: actor.known_for_department,
        popularity: actor.popularity,
        known_for: actor.known_for
      })),
      totalPages: data.total_pages,
      currentPage: data.page
    };
  } catch (error) {
    console.error('Error fetching popular actors:', error);
    return { actors: [], totalPages: 0, currentPage: 1 };
  }
};

export const fetchMovies = async (query, page = 1, retries = 3) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&page=${page}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return {
        results: [],
        error: ErrorType.NOT_FOUND,
        message: 'No movies found for your search.'
      };
    }

    return {
      results: data.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        overview: movie.overview
      })),
      total_pages: data.total_pages,
      total_results: data.total_results
    };
  } catch (error) {
    console.error('Error searching movies:', error);
    
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchMovies(query, page, retries - 1);
    }

    return { results: [], ...handleApiError(error) };
  }
};

export const fetchTVShows = async (query, page = 1, retries = 3) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&page=${page}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return {
        results: [],
        error: ErrorType.NOT_FOUND,
        message: 'No TV shows found for your search.'
      };
    }

    return {
      results: data.results.map((show) => ({
        id: show.id,
        name: show.name,
        poster_path: show.poster_path,
        first_air_date: show.first_air_date,
        vote_average: show.vote_average,
        overview: show.overview
      })),
      total_pages: data.total_pages,
      total_results: data.total_results
    };
  } catch (error) {
    console.error('Error searching TV shows:', error);
    
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchTVShows(query, page, retries - 1);
    }

    return { results: [], ...handleApiError(error) };
  }
};

export const fetchActors = async (query, page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&page=${page}`
    );
    const data = await response.json();
    return {
      actors: data.results.map((actor) => ({
        id: actor.id,
        name: actor.name,
        profile_path: actor.profile_path
          ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
          : null,
        known_for_department: actor.known_for_department,
        popularity: actor.popularity,
        known_for: actor.known_for
      })),
      totalPages: data.total_pages,
      currentPage: data.page
    };
  } catch (error) {
    console.error('Error searching actors:', error);
    return { actors: [], totalPages: 0, currentPage: 1 };
  }
};

/**
 * Fetch movies based on various filters using the discover endpoint.
 *
 * Expected filters object structure:
 * {
 *   genre: '28',   // TMDb genre id as a string (optional)
 *   year: '2022',  // Release year as a string (optional)
 *   rating: '7',   // Minimum vote average as a string or number (optional)
 * }
 */
export const fetchMoviesByFilters = async (
  filters,
  page = 1
) => {
  try {
    const url = new URL(`${BASE_URL}/discover/movie`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('page', page.toString());

    if (filters.genre) {
      url.searchParams.append('with_genres', filters.genre);
    }
    if (filters.year) {
      url.searchParams.append('primary_release_year', filters.year);
    }
    if (filters.rating) {
      // Use the rating as the minimum vote average.
      url.searchParams.append('vote_average.gte', filters.rating.toString());
    }
    // Add additional filter parameters here if needed

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      results: data.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        rating: movie.vote_average,
        image: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : 'Unknown',
        genre_ids: movie.genre_ids,
        overview: movie.overview,
      })),
      total_pages: data.total_pages,
      total_results: data.total_results
    };
  } catch (error) {
    console.error('Error fetching movies by filters:', error);
    return { results: [], ...handleApiError(error) };
  }
};
