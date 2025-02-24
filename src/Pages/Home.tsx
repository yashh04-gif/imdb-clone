import React, { useEffect, useState } from "react";
import Hero from "../components/Hero.tsx";
import { Award, Clock, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCarousel from "../components/MovieCarousel.tsx";
import { useTheme } from "../context/ThemeContext.tsx";

const TMDB_API_KEY = "797e81f83e84e0fe85ca2a8bff917f51";
const BASE_URL = "https://api.themoviedb.org/3";

interface MovieImage {
  file_path: string;
  width: number;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  images?: MovieImage[];
}

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const { isDarkMode } = useTheme();

  const fetchMovieImages = async (movieId: number) => {
    try {
      const [backdropsResponse, postersResponse] = await Promise.all([
        fetch(`${BASE_URL}/movie/${movieId}/images?api_key=${TMDB_API_KEY}`),
        fetch(`${BASE_URL}/movie/${movieId}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`)
      ]);

      const [backdropsData, postersData] = await Promise.all([
        backdropsResponse.json(),
        postersResponse.json()
      ]);

      // Combine backdrops and posters, and filter out null paths
      const allImages = [
        ...(backdropsData.backdrops || []),
        ...(postersData.posters || [])
      ]
      .filter((img: any) => img.file_path)
      .map((img: any) => ({
        file_path: img.file_path,
        width: img.width
      }));

      // Shuffle the array to get a random mix of backdrops and posters
      const shuffledImages = allImages
        .sort(() => Math.random() - 0.5)
        .slice(0, 15); // Get 15 random images

      return shuffledImages;
    } catch (error) {
      console.error(`Error fetching images for movie ${movieId}:`, error);
      return [];
    }
  };

  const enrichMoviesWithImages = async (movies: Movie[]) => {
    const enrichedMovies = await Promise.all(
      movies.map(async (movie) => {
        const images = await fetchMovieImages(movie.id);
        return { ...movie, images };
      })
    );
    return enrichedMovies;
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Fetch trending movies
        const trendingResponse = await fetch(
          `${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`
        );
        const trendingData = await trendingResponse.json();
        const enrichedTrending = await enrichMoviesWithImages(trendingData.results);
        setTrendingMovies(enrichedTrending);

        // Fetch top rated movies
        const topRatedResponse = await fetch(
          `${BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        const topRatedData = await topRatedResponse.json();
        const enrichedTopRated = await enrichMoviesWithImages(topRatedData.results);
        setTopRatedMovies(enrichedTopRated);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <Hero />
      <main className={`container mx-auto px-4 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            {
              icon: TrendingUp,
              label: "Trending",
              path: "/movies?sort=trending",
              color: "bg-yellow-500",
            },
            {
              icon: Star,
              label: "Top Rated",
              path: "/top-rated",
              color: "bg-purple-500",
            },
            {
              icon: Clock,
              label: "Coming Soon",
              path: "/coming-soon",
              color: "bg-blue-500",
            },
            {
              icon: Award,
              label: "Awards",
              path: "/awards",
              color: "bg-red-500",
            },
          ].map((category, index) => (
            <Link
              key={index}
              to={category.path}
              className={`${category.color} p-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-70 transition-opacity`}
            >
              <category.icon className="w-5 h-5" />
              <span className="font-medium">{category.label}</span>
            </Link>
          ))}
        </div>
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-yellow-500" />
              Trending Now
            </h2>
            <Link to="/movies?sort=trending" className="text-yellow-500 hover:text-yellow-400">
              View All
            </Link>
          </div>
          <MovieCarousel movies={trendingMovies}/>
        </section>
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-500" />
              Coming Soon
            </h2>
            <Link to="/coming-soon" className="text-yellow-500 hover:text-yellow-400">
              View All
            </Link>
          </div>
          <MovieCarousel movies={topRatedMovies}/>
        </section>
      </main>
    </div>
  );
};

export default Home;
