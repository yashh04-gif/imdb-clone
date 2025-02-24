import React, { useEffect, useState } from "react";
import { Play, Star, Calendar, X } from "lucide-react";  // Import cancel icon
import { Link } from "react-router-dom";
import axios from "axios";

const TMDB_API_KEY = "797e81f83e84e0fe85ca2a8bff917f51";
const TMDB_API_URL = "https://api.themoviedb.org/3";

const Hero = () => {
  const [featuredMovies, setFeaturedMovies] = useState<
    {
      id: number;
      backdrop_path: string;
      vote_average: number;
      release_date: string;
      title: string;
      overview: string;
    }[]
  >([]);
  const [currentMovie, setCurrentMovie] = useState(0);
  const [movieTrailer, setMovieTrailer] = useState("");
  const [isTrailerVisible, setIsTrailerVisible] = useState(false); // New state to toggle trailer visibility
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null); // Store the interval ID for the automatic movie switcher

  // Fetching popular movies from TMDB
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(
          `${TMDB_API_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        setFeaturedMovies(response.data.results);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    };

    fetchMovies();
  }, []);

  // Fetching trailer for a specific movie
  useEffect(() => {
    if (featuredMovies.length > 0) {
      const fetchTrailer = async (movieId: number) => {
        try {
          const response = await axios.get(
            `${TMDB_API_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
          );
          const trailer = response.data.results.find(
            (video: { type: string; key: string }) => video.type === "Trailer"
          );
          setMovieTrailer(trailer ? trailer.key : "");
        } catch (error) {
          console.error("Error fetching trailer:", error);
        }
      };

      fetchTrailer(featuredMovies[currentMovie].id);
    }
  }, [currentMovie, featuredMovies]);

  // Auto movie switcher interval
  useEffect(() => {
    if (!isTrailerVisible) {
      const timer = setInterval(() => {
        setCurrentMovie((prev) => (prev + 1) % featuredMovies.length);
      }, 8000);

      setIntervalId(timer); // Store the interval ID

      return () => clearInterval(timer); // Cleanup on unmount or when trailer is visible
    }

    return () => clearInterval(intervalId!); // Cleanup the interval when trailer is visible
  }, [featuredMovies, isTrailerVisible]);

  const movie = featuredMovies[currentMovie];

  if (!movie) {
    return null; // Loading state, or could be a loader
  }

  const handleTrailerToggle = () => {
    setIsTrailerVisible((prev) => !prev); // Toggle trailer visibility
  };

  const handleCloseTrailer = () => {
    setIsTrailerVisible(false); // Close trailer
  };

  return (
    <div className="relative h-[90vh] bg-gradient-to-b from-transparent to-black">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 gradient-mask"
        style={{
          backgroundImage: `url('https://image.tmdb.org/t/p/original${movie.backdrop_path}')`,
        }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      </div>

      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-yellow-500 font-semibold">
                {movie.vote_average} Rating
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Calendar className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-300">
                {new Date(movie.release_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-glow">
            {movie.title}
          </h1>
          <p className="text-zinc-300 text-lg mb-8 line-clamp-3 max-w-xl">
            {movie.overview}
          </p>
          <div className="flex items-center gap-4">
            {movieTrailer && (
              <button
                onClick={handleTrailerToggle} // Toggle trailer visibility
                className="bg-yellow-500 text-black px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-yellow-400 transition-all hover:scale-105 duration-300"
              >
                <Play className="w-5 h-5" />
                Watch Trailer
              </button>
            )}
            <Link
              to={`/movie/${movie.id}`}
              className="bg-zinc-900/80 backdrop-blur-md text-white px-8 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-all hover:scale-105 duration-300"
            >
              More Info
            </Link>
          </div>
        </div>

        {/* Trailer window, centered */}
        {isTrailerVisible && movieTrailer && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-lg z-10">
            <div className="relative w-full max-w-4xl p-4">
              <button
                onClick={handleCloseTrailer} // Close trailer
                className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/60"
              >
                <X className="w-6 h-6" />
              </button>
              <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${movieTrailer}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        <div className="absolute bottom-8 right-4 flex gap-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMovie(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentMovie === index
                  ? "bg-yellow-500 w-8"
                  : "bg-zinc-600 w-4 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
