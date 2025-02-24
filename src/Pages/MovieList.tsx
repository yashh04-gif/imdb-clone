import { SlidersHorizontal, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import MovieCard from "../components/MovieCard";

const API_KEY = "797e81f83e84e0fe85ca2a8bff917f51";
const BASE_URL = "https://api.themoviedb.org/3";

const genres = [
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "18", name: "Drama" },
  { id: "10751", name: "Family" },
  { id: "14", name: "Fantasy" },
  { id: "36", name: "History" },
  { id: "27", name: "Horror" },
  { id: "10402", name: "Music" },
  { id: "9648", name: "Mystery" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Sci-Fi" },
  { id: "53", name: "Thriller" },
];

const generateYearRanges = () => {
  const currentYear = new Date().getFullYear();
  const ranges = [];
  
  for (let start = 2005; start <= 2014; start += 3) {
    ranges.push(`${start}-${start + 2}`);
  }

  for (let year = 2017; year <= currentYear; year++) {
    ranges.push(`${year}`);
  }

  return ranges;
};

const ratings = Array.from({ length: 8 }, (_, i) => i + 3);

const mapMovieData = (movie: any) => ({
  id: movie.id,
  image: movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image",
  title: movie.title,
  rating: movie.vote_average,
  year: new Date(movie.release_date).getFullYear(),
  genre: movie.genre_ids
    .map((id: string) => {
      const genre = genres.find(g => g.id === id);
      return genre ? genre.name : "";
    })
    .filter(Boolean),
});

const interleaveArrays = (arrays: any[][]) => {
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  const result = [];
  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      if (i < arr.length) result.push(arr[i]);
    }
  }
  return result;
};

const fetchMovies = async (
  searchQuery: string | null,
  selectedGenres: string[],
  selectedYears: string[],
  selectedRatings: number[]
) => {
  try {
    if (searchQuery) {
      const res = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      return data.results.map(mapMovieData);
    }

    if (selectedYears.length > 0) {
      const requests = selectedYears.map(async (yearRange) => {
        let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc`;
        
        if (selectedGenres.length > 0) {
          url += `&with_genres=${selectedGenres.join(",")}`;
        }

        if (yearRange.includes("-")) {
          const [start, end] = yearRange.split("-");
          url += `&primary_release_date.gte=${start}-01-01&primary_release_date.lte=${end}-12-31`;
        } else {
          url += `&primary_release_year=${yearRange}`;
        }

        if (selectedRatings.length > 0) {
          const minRating = Math.min(...selectedRatings);
          url += `&vote_average.gte=${minRating}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        return data.results.map(mapMovieData);
      });

      const yearResults = await Promise.all(requests);
      return interleaveArrays(yearResults);
    }

    let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc`;
    if (selectedGenres.length > 0) {
      url += `&with_genres=${selectedGenres.join(",")}`;
    }
    if (selectedRatings.length > 0) {
      const minRating = Math.min(...selectedRatings);
      url += `&vote_average.gte=${minRating}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    return data.results.map(mapMovieData);
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
};

const MovieList = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      const data = await fetchMovies(search, selectedGenres, selectedYears, selectedRatings);
      setMovies(data);
      setLoading(false);
    };
    loadMovies();
  }, [search, selectedGenres, selectedYears, selectedRatings]);

  const toggleFilter = (
    value: string | number,
    state: any[],
    setState: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    setState(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedYears([]);
    setSelectedRatings([]);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {search ? `Search Results for "${search}"` : "Popular Movies"}
          </h1>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </div>
        </div>

        {/* Filter Sections */}
        <div className="space-y-4 mb-8">
          {/* Genres Section */}
          <div className={`pb-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => toggleFilter(genre.id, selectedGenres, setSelectedGenres)}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm ${
                    selectedGenres.includes(genre.id)
                      ? "bg-blue-500 text-white"
                      : isDarkMode 
                        ? "bg-gray-800 text-gray-300" 
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {genre.name}
                  {selectedGenres.includes(genre.id) && <X className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Years Section */}
          <div className={`pb-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Release Years
            </h3>
            <div className="flex flex-wrap gap-2">
              {generateYearRanges().map(range => (
                <button
                  key={range}
                  onClick={() => toggleFilter(range, selectedYears, setSelectedYears)}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm ${
                    selectedYears.includes(range)
                      ? "bg-blue-500 text-white"
                      : isDarkMode 
                        ? "bg-gray-800 text-gray-300" 
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {range}
                  {selectedYears.includes(range) && <X className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ratings Section */}
          <div className="pb-4">
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Minimum Rating
            </h3>
            <div className="flex flex-wrap gap-2">
              {ratings.map(rating => (
                <button
                  key={rating}
                  onClick={() => toggleFilter(rating, selectedRatings, setSelectedRatings)}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm ${
                    selectedRatings.includes(rating)
                      ? "bg-blue-500 text-white"
                      : isDarkMode 
                        ? "bg-gray-800 text-gray-300" 
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {rating}+
                  {selectedRatings.includes(rating) && <X className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {(selectedGenres.length > 0 || selectedYears.length > 0 || selectedRatings.length > 0) && (
            <div className="pt-4">
              <button
                onClick={clearFilters}
                className={`px-4 py-2 rounded-full text-sm ${
                  isDarkMode 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Movie Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {movies.map((movie) => (
            <div key={movie.id}>
              <MovieCard
                id={movie.id}
                title={movie.title}
                rating={movie.rating}
                image={movie.image}
                year={movie.year}
                genre={movie.genre}
              />
            </div>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        )}

        {/* No Results Message */}
        {!loading && movies.length === 0 && (
          <div className="text-center mt-8">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              No movies found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieList;
