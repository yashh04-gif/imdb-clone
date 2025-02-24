import React, { useEffect, useState } from 'react';
import { useWatchlist } from "../context/WatchlistContext.tsx";
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

const Watchlist = () => {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const { isDarkMode } = useTheme();
  
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Check Firebase authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        // Redirect to login page if not authenticated
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (user === null) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        <div className="container mx-auto px-4 py-8">
          <h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Please Sign In
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            You must be signed in to view your watchlist.
          </p>
        </div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
        <div className="container mx-auto px-4 py-8">
          <h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} >
            Your Watchlist
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your watchlist is empty. Start adding movies you want to watch!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Your Watchlist
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {watchlist.map((movie) => (
            <div
              key={movie.id}
              className={`relative group rounded-lg overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <Link to={`/movie/${movie.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
              <button
                onClick={() => removeFromWatchlist(movie.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                title="Remove from watchlist"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="p-4">
                <Link to={`/movie/${movie.id}`}>
                  <h2
                    className={`text-lg font-semibold mb-2 hover:text-yellow-500 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                  >
                    {movie.title}
                  </h2>
                </Link>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {(movie.vote_average ?? 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
