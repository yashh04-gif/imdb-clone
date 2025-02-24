import { Star, Trophy } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fetchTopRatedMovies } from "../services/tmdbApi";

const Toprated = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      const data = await fetchTopRatedMovies();
      setMovies(data);
      setLoading(false);
    };
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-8"
      >
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Top Rated Movies</h1>
      </motion.div>

      <div className="space-y-6">
        {movies.map((movie, index) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link to={`/movie/${movie.id}`}>
              <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-6 p-4">
                  <div className="flex-shrink-0 w-24 relative">
                    <span className="absolute -left-3 -top-3 bg-yellow-500 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl font-semibold mb-2">{movie.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{movie.year}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-yellow-500 font-semibold">
                          {movie.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Toprated;
