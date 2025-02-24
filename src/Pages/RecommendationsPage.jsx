import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useWatchlist } from "../context/WatchlistContext";

const TMDB_API_KEY = "797e81f83e84e0fe85ca2a8bff917f51";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const RecommendationsPage = () => {
  const { isDarkMode, theme } = useTheme();
  const { user, isAuthenticated, watchlist } = useWatchlist();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Debugging logs
  console.log("Watchlist IDs:", watchlist.map(m => m.id));
  console.log("Current movies:", movies);
  console.log("Error state:", error);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRecommendations = async () => {
      try {
        setError(null);
        setLoading(true);
        setMovies([]);

        if (!isAuthenticated || !user) {
          throw new Error("Authentication required");
        }

        if (watchlist.length === 0) {
          setError("Add movies to your watchlist to get recommendations");
          return;
        }

        console.log("Starting recommendations fetch...");
        
        const requests = watchlist.map(movie => {
          console.log(`Fetching recommendations for movie ${movie.id}`);
          return axios.get(`${TMDB_BASE_URL}/movie/${movie.id}/recommendations`, {
            params: { api_key: TMDB_API_KEY, language: "en-US", page: 1 },
            signal: controller.signal,
            timeout: 10000
          }).catch(error => {
            console.warn(`Recommendations for ${movie.id} failed:`, error.message);
            return { data: { results: [] } };
          });
        });

        const responses = await Promise.all(requests);
        console.log("Raw API responses:", responses);

        const validMovies = responses
          .filter(response => {
            const isValid = response?.status === 200;
            if (!isValid) console.log("Invalid response:", response);
            return isValid;
          })
          .flatMap(response => {
            console.log("Results for response:", response.data.results);
            return response.data.results;
          })
          .filter(movie => {
            const isValid = movie?.id && movie.title && typeof movie.vote_average === 'number';
            if (!isValid) console.log("Invalid movie:", movie);
            return isValid;
          });

        console.log("Valid movies after filtering:", validMovies);

        const uniqueMovies = Array.from(
          new Map(validMovies.map(movie => [movie.id, movie])).values()
        ).sort((a, b) => b.vote_average - a.vote_average);

        console.log("Deduplicated movies:", uniqueMovies);

        setMovies(uniqueMovies);
        
        if (uniqueMovies.length === 0) {
          setError("No recommendations found for movies in your watchlist");
        } else {
          setError(null); // Clear error if movies are found
        }

      } catch (error) {
        console.error("Main error:", error);
        if (!axios.isCancel(error)) {
          setError(error.message || "Failed to load recommendations");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (watchlist.length > 0) fetchRecommendations();
    else setLoading(false);

    return () => controller.abort();
  }, [isAuthenticated, user, watchlist]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.background} ${theme.text}`}>
        <div className="text-xl animate-pulse">Loading recommendations...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme.background} ${theme.text}`}>
        <h1 className="text-3xl font-bold mb-4">Movie Recommendations</h1>
        <p className="text-lg text-gray-500">
          Please sign in to view personalized recommendations
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${theme.background} ${theme.text}`}>
      <div className={`container mx-auto ${isMobile ? "px-2" : "px-4"}`}>
        <h1 className="text-3xl font-bold mb-8">Recommended Movies</h1>

        {error && (
          <div className={`mb-8 p-4 rounded-lg ${
            isDarkMode ? "bg-red-900/50 text-red-100" : "bg-red-100 text-red-800"
          }`}>
            {error} {watchlist.length === 0 && "- Add movies to your watchlist first"}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className={`rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
                theme.cardBg
              } ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
            >
              <Link 
                to={`/movie/${movie.id}`} 
                className="block h-full"
                aria-label={`View details for ${movie.title}`}
              >
                <div className="relative aspect-[2/3]">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target;
                        target.src = '/placeholder-movie.png';
                        target.classList.add(
                          theme.cardBg.replace('bg-', 'bg-'),
                          'object-contain'
                        );
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${theme.cardBg} ${theme.secondary}`}>
                      <span>Poster Not Available</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/80 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1 text-white">
                      {movie.vote_average?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{movie.title}</h3>
                  {movie.release_date && (
                    <p className={`text-sm mt-1 ${theme.secondary}`}>
                      {new Date(movie.release_date).getFullYear() || 'Year unknown'}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>

        {!loading && movies.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            No recommendations available. Try adding different movies to your watchlist.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;