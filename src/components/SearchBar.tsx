import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const API_KEY = "797e81f83e84e0fe85ca2a8bff917f51";

const ErrorType = {
  API: "API",
};

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  profile_path?: string;
  release_date?: string;
  known_for_department?: string;
  type: "movie" | "actor";
}

interface Filters {
  genre: string;
  year: string;
}

const fetchMovies = async (query: string, genre: string, year: string) => {
  let url;
  const params = new URLSearchParams({ api_key: API_KEY });

  if (query) {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
    if (year) url += `&primary_release_year=${year}`;
  } else {
    url = `https://api.themoviedb.org/3/discover/movie?`;
    if (genre) params.append("with_genres", genre);
    if (year) params.append("primary_release_year", year);
    url += params.toString();
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error("Error fetching movies");
  return await response.json();
};

const fetchActors = async (query: string) => {
  const url = `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error fetching actors");
  return await response.json();
};

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    genre: "",
    year: "",
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [lastParams, setLastParams] = useState({ query: "", ...filters });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State to control filter visibility
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`
        );
        const data = await response.json();
        setGenres(data.genres);
      } catch (err) {
        console.error("Error fetching genres:", err);
      }
    };
    fetchGenres();
  }, []);

  // Click outside handler to hide filters
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const hasQuery = query.trim().length >= 3;
    const hasFilters = filters.genre || filters.year;

    if (!hasQuery && !hasFilters) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        // If a genre and/or year filter is applied, assume the query is an actor name
        // and fetch movies for that actor
        if (hasFilters) {
          // Search for the actor
          const actorResponse = await fetch(
            `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
          );
          if (!actorResponse.ok) throw new Error("Error fetching actor");
          const actorData = await actorResponse.json();

          if (actorData.results && actorData.results.length > 0) {
            const actorId = actorData.results[0].id;
            // Fetch movies for the actor using the discover endpoint
            let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`;
            const params = new URLSearchParams();
            params.append("with_cast", actorId);
            if (filters.genre) {
              params.append("with_genres", filters.genre);
            }
            if (filters.year) {
              params.append("primary_release_year", filters.year);
            }
            url += "&" + params.toString();
            const moviesResponse = await fetch(url);
            if (!moviesResponse.ok) throw new Error("Error fetching movies for actor");
            const moviesData = await moviesResponse.json();
            const movieResults = moviesData.results?.map((m: any) => ({
              ...m,
              type: "movie",
            })) || [];
            setResults(movieResults);
          } else {
            // Fallback: if no actor is found, perform a standard movie search
            const moviesData = await fetchMovies(query, filters.genre, filters.year);
            const movieResults = moviesData.results?.map((m: any) => ({
              ...m,
              type: "movie",
            })) || [];
            setResults(movieResults);
          }
        } else {
          // If no filters are applied, fetch both movies and actors
          const [moviesData, actorData] = await Promise.all([
            fetchMovies(query, filters.genre, filters.year),
            fetchActors(query),
          ]);
          const movieResults = moviesData.results?.map((m: any) => ({
            ...m,
            type: "movie",
          })) || [];
          const actorResults = actorData.results?.map((a: any) => ({
            ...a,
            type: "actor",
          })) || [];
          setResults([...movieResults, ...actorResults]);
        }
      } catch (err) {
        console.error("Search Error:", err);
        setError({
          type: ErrorType.API,
          message: err instanceof Error ? err.message : "An unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (
        query !== lastParams.query ||
        filters.genre !== lastParams.genre ||
        filters.year !== lastParams.year
      ) {
        setLastParams({ query, ...filters });
        fetchResults();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, filters, lastParams]);

  const handleClear = () => {
    setQuery("");
    setFilters({ genre: "", year: "" });
    setResults([]);
    setError(null);
    setShowFilters(false);
  };

  const handleResultClick = (item: SearchResult) => {
    setShowFilters(false);
    navigate(`/${item.type}/${item.id}`);
  };

  // Determine the top offset for results, error, and loading containers
  // If filters are visible, offset them further down.
  const resultsTopStyle = showFilters ? { top: "calc(100% + 3rem)" } : {};

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowFilters(true)}
          placeholder="Search movies & actors..."
          className={`w-full py-2 pl-4 pr-10 rounded-lg ${theme.input} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${theme.border} border shadow-inner`}
        />
        {query && (
          <button
            onClick={handleClear}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${theme.text} hover:text-yellow-400 transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Render filter options in an absolutely positioned container */}
        {showFilters && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg p-2 shadow-lg border z-50">
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.genre}
                onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                className={`py-1 px-2 rounded-lg ${theme.input} focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${theme.border} border`}
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className={`py-1 px-2 rounded-lg ${theme.input} focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${theme.border} border`}
              >
                <option value="">All Years</option>
                {Array.from({ length: 30 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div
          style={resultsTopStyle}
          className={`absolute left-0 right-0 ${!showFilters ? "top-full mt-2" : ""} w-full ${theme.cardBg} rounded-lg p-4 shadow-lg ${theme.border} border z-50`}
        >
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={resultsTopStyle}
          className={`absolute left-0 right-0 ${!showFilters ? "top-full mt-2" : ""} w-full ${theme.cardBg} rounded-lg p-4 shadow-lg ${theme.border} border z-50`}
        >
          <p className="text-red-500">{error.message}</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div
          style={resultsTopStyle}
          className={`absolute left-0 right-0 ${!showFilters ? "top-full mt-2" : ""} w-full ${theme.cardBg} rounded-lg shadow-lg ${theme.border} border overflow-hidden z-50`}
        >
          <div className="max-h-96 overflow-y-auto">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleResultClick(item)}
                className={`w-full p-3 flex items-center gap-3 ${theme.text} hover:bg-gray-700/50 transition-colors border-b ${theme.border} last:border-b-0`}
              >
                <img
                  src={
                    item.type === "movie"
                      ? item.poster_path
                        ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                        : "/no-poster.png"
                      : item.profile_path
                      ? `https://image.tmdb.org/t/p/w92${item.profile_path}`
                      : "/no-profile.png"
                  }
                  alt={item.title || item.name || ""}
                  className="w-12 h-16 object-cover rounded"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.title || item.name}</p>
                  <p className={`text-sm ${theme.secondary}`}>
                    {item.type === "movie"
                      ? item.release_date?.split("-")[0] || "Year unknown"
                      : item.known_for_department || "Actor"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
