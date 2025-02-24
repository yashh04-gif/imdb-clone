import React, { useState, useEffect } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import { useTheme } from '../context/ThemeContext';
import { User, Settings, Star, Bookmark, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase'; // Import Firestore
import { signInWithPopup, onAuthStateChanged, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Firestore functions
import { useRating } from '../context/RatingContext';

const TMDB_API_KEY = "797e81f83e84e0fe85ca2a8bff917f51"; 

type Genre = {
  id: number;
  name: string;
};

const Profile = () => {
  const { watchlist, userProfile, updateProfile, reviews } = useWatchlist();
  const { isDarkMode, toggleTheme } = useTheme();
  const { ratings } = useRating();
  const [activeTab, setActiveTab] = useState('watchlist');
  const [userRatedMovies, setUserRatedMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultProfile = {
    username: '',
    profilePic: '',
    preferences: {
      theme: 'light' as 'light' | 'dark',
      notifications: true,
      favoriteGenre: '',
    },
    email: '',
  };

  const initialProfile = userProfile
    ? {
        ...userProfile,
        preferences: {
          ...defaultProfile.preferences,
          ...userProfile.preferences,
        },
      }
    : defaultProfile;

  const [tempProfile, setTempProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const data = await res.json();
        if (data.genres) {
          setGenres(data.genres);
        }
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchRecommendedMovies = async () => {
      if (!tempProfile.preferences.favoriteGenre) {
        setRecommendedMovies([]);
        return;
      }
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${tempProfile.preferences.favoriteGenre}&language=en-US&sort_by=popularity.desc`
        );
        const data = await res.json();
        if (data.results) {
          setRecommendedMovies(data.results);
        }
      } catch (error) {
        console.error('Failed to fetch recommended movies:', error);
      }
    };
    fetchRecommendedMovies();
  }, [tempProfile.preferences.favoriteGenre]);

  useEffect(() => {
    const fetchRatedMovies = async () => {
      if (Object.keys(ratings).length > 0) {
        setLoading(true);
        try {
          const moviePromises = Object.values(ratings).map(async (rating) => {
            const response = await fetch(
              `https://api.themoviedb.org/3/movie/${rating.movieId}?api_key=${TMDB_API_KEY}`
            );
            const movieData = await response.json();
            return {
              ...movieData,
              userRating: rating.rating,
            };
          });

          const movies = await Promise.all(moviePromises);
          setUserRatedMovies(movies);
        } catch (error) {
          console.error('Error fetching rated movies:', error);
        }
        setLoading(false);
      }
    };

    fetchRatedMovies();
  }, [ratings]);

  useEffect(() => {
    // Monitor Firebase authentication state changes
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const { displayName, email, photoURL } = currentUser;
        setUser({
          username: displayName || '',
          email: email || '',
          profilePic: photoURL || '',
        });

        // Fetch user data from Firestore
        if (email) {
          const userDocRef = doc(db, 'users', email); // Use email as the unique user identifier
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setTempProfile({
              username: userDoc.data().username || '',
              profilePic: userDoc.data().profilePic || '',
              preferences: userDoc.data().preferences || defaultProfile.preferences,
              email: email || '',
            });
          }
        }
      } else {
        setUser(null);
        setTempProfile(defaultProfile); 
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    try {
      if (user) {
        const userDocRef = doc(db, 'users', user.email);
        await setDoc(
          userDocRef,
          {
            username: tempProfile.username,
            profilePic: tempProfile.profilePic,
            preferences: tempProfile.preferences,
          },
          { merge: true }
        );

        // Update the profile context with the new data
        updateProfile(tempProfile);

        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile to Firestore:', error);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setTempProfile({
        ...tempProfile,
        profilePic: imageUrl,
      });
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempProfile({
      ...tempProfile,
      username: e.target.value,
    });
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { displayName, email, photoURL } = result.user;
      setTempProfile({
        ...tempProfile,
        username: displayName || '',
        email: email || '',
        profilePic: photoURL || '',
      });
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setTempProfile(defaultProfile);
      })
      .catch((error) => {
        console.error('Error during sign out:', error);
      });
  };

  return (
    <div
      className={`container mx-auto px-4 py-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center mb-4 overflow-hidden">
            {tempProfile.profilePic ? (
              <img
                src={tempProfile.profilePic}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-20 h-20 text-zinc-400" />
            )}
          </div>
          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="mb-4"
            />
          )}
          {user ? (
            <>
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.username}
                  onChange={handleUsernameChange}
                  className="text-2xl font-bold text-center mb-2 border-b-2 border-gray-300 focus:outline-none text-black"
                />
              ) : (
                <h1 className="text-2xl font-bold">{tempProfile.username || 'Your Name'}</h1>
              )}
              <div className="flex gap-2 items-center">
                {isEditing ? (
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="mt-2 text-sm text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              Sign in with Google
            </button>
          )}
        </div>

        {/* Watchlist Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Watchlist</h2>
            </div>
            <div className="space-y-2">
              {watchlist.length > 0 ? (
                watchlist.map((movie) => (
                  <div key={movie.id} className="flex items-center gap-3">
                    <Link to={`/movie/${movie.id}`} className="flex items-center gap-3">
                      <img
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        className="w-12 h-18 rounded"
                      />
                      <div>
                        <p className="font-medium">{movie.title}</p>
                        <p className="text-sm text-zinc-400">
                          Rating: {movie.vote_average}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-zinc-400">No movies in watchlist</p>
              )}
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-zinc-900/50 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Preferences</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Favorite Genre
                </label>
                <select
                  value={tempProfile.preferences.favoriteGenre}
                  onChange={(e) =>
                    setTempProfile({
                      ...tempProfile,
                      preferences: {
                        ...tempProfile.preferences,
                        favoriteGenre: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                >
                  <option value="">Select Genre</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={tempProfile.preferences.theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as 'light' | 'dark';
                    setTempProfile({
                      ...tempProfile,
                      preferences: {
                        ...tempProfile.preferences,
                        theme: newTheme,
                      },
                    });
                    toggleTheme();
                  }}
                  className="w-full bg-zinc-800 rounded px-3 py-2"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-zinc-900/50 p-6 rounded-xl mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Your Reviews</h2>
          </div>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating ? 'text-yellow-500' : 'text-zinc-400'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-zinc-300 mb-1">{review.reviewText}</p>
                <Link
                  to={`/movie/${review.movieId}`}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  View Movie →
                </Link>
              </div>
            ))
          ) : (
            <p className="text-zinc-400">You haven't reviewed any movies yet.</p>
          )}
        </div>

        {/* Ratings Section */}
        <div className="bg-zinc-900/50 p-6 rounded-xl mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Your Ratings</h2>
          </div>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
          ) : userRatedMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {userRatedMovies.map((movie) => (
                <Link to={`/movie/${movie.id}`} key={movie.id} className="block">
                  <div className="rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{movie.title}</h3>
                      <div className="flex items-center justify-between">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < movie.userRating ? 'text-yellow-500' : 'text-zinc-400'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-zinc-400">
                          {new Date(movie.release_date).getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">You haven't rated any movies yet.</p>
          )}
        </div>

        {/* Recommended Movies Section */}
        <div className="bg-zinc-900/50 p-6 rounded-xl mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">
              {tempProfile.preferences.favoriteGenre
                ? 'Recommended Movies'
                : 'Select a Favorite Genre for Recommendations'}
            </h2>
          </div>
          {tempProfile.preferences.favoriteGenre ? (
            recommendedMovies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recommendedMovies.map((movie) => (
                  <Link to={`/movie/${movie.id}`} key={movie.id} className="block">
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-64 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{movie.title}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">No recommended movies available.</p>
            )
          ) : (
            <p className="text-zinc-400">Please select a favorite genre to see recommendations.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
