import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, Star, Calendar } from "lucide-react";
import { fetchMovieDetails } from "../services/tmdbApi";
import ReviewForm from "../components/ReviewForm";
import { useWatchlist } from "../context/WatchlistContext";
import { useTheme } from "../context/ThemeContext";

interface Genre {
  id: number;
  name: string;
}

interface Video {
  key: string;
}

interface CastMember {
  id: number;
  profile_path: string | null;
  name: string;
  character: string;
}

interface MovieDetailsData {
  id: number;
  title: string;
  backdrop: string | null;
  image: string | null;
  rating: number;
  runtime: number;
  year: number | string;
  genres: Genre[];
  overview: string;
  videos: Video[];
  cast: CastMember[];
}

export interface Review {
  movieId: number;
  rating: number;
  reviewText: string;
  timestamp: number;
  userId: string;
  userEmail: string;
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const [movie, setMovie] = useState<MovieDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [movieReviews, setMovieReviews] = useState<Review[]>([]);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, getMovieReviews } = useWatchlist();

  // Determine if the movie is in the watchlist
  const isMovieInWatchlist = movie ? isInWatchlist(movie.id) : false;

  // Scroll to top when mounting
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch movie details from TMDB
  useEffect(() => {
    const getMovieDetails = async () => {
      setLoading(true);
      const data = await fetchMovieDetails(id);
      setMovie(data);
      setLoading(false);
    };
    getMovieDetails();
  }, [id]);

  // Fetch reviews (from your reviews storage via the watchlist context)
  useEffect(() => {
    const fetchReviews = async () => {
      if (id) {
        const reviews = await getMovieReviews(parseInt(id));
        setMovieReviews(reviews);
      }
    };
    fetchReviews();
  }, [id, getMovieReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-dark-background bg-light-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 dark:border-dark-text border-light-text"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-dark-background bg-light-background">
        <h1 className="text-2xl font-bold dark:text-dark-text text-light-text">Movie not found</h1>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text}`}>
      <div
        className="h-[60vh] bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${movie.backdrop})`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-32 relative z-10">
          {/* Left Column: Poster and basic info */}
          <div className="md:col-span-1">
            <img
              src={movie.image ?? 'https://via.placeholder.com/500x750?text=No+Image'}
              alt={movie.title}
              className="w-full rounded-xl shadow-2xl aspect-[2/3] object-cover border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750?text=No+Image';
              }}
            />
            <div className={`mt-6 ${theme.cardBg} rounded-xl p-6 ${theme.border} border shadow-lg`}>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-lg">{movie.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${theme.text}`} />
                  <span className={`${theme.text} font-medium`}>{movie.runtime} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-5 h-5 ${theme.text}`} />
                  <span className={`${theme.text} font-medium`}>{movie.year}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className={`px-3 py-1 bg-gray-700 rounded-full text-sm ${theme.text} font-medium`}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
              <button
                onClick={() =>
                  isMovieInWatchlist
                    ? removeFromWatchlist(movie.id)
                    : addToWatchlist({
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.image ?? 'https://via.placeholder.com/500x750?text=No+Image',
                        vote_average: movie.rating,
                      })
                }
                className={`mt-4 w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                  isMovieInWatchlist
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : `${theme.primary} hover:bg-yellow-600 ${theme.buttonText}`
                }`}
              >
                {isMovieInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>

          {/* Right Column: Movie details, trailer, cast, and reviews */}
          <div className="md:col-span-2">
            <h1 className={`text-4xl font-bold mb-6 ${theme.text}`}>{movie.title}</h1>
            
            <div className={`${theme.cardBg} rounded-xl p-6 mb-8 ${theme.border} border shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Overview</h2>
              <p className={`${theme.text} text-lg leading-relaxed`}>{movie.overview}</p>
            </div>

            {movie.videos && movie.videos.length > 0 && (
              <div className={`${theme.cardBg} rounded-xl p-6 mb-8 ${theme.border} border shadow-lg`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Trailer</h2>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.videos[0].key}`}
                    title="Movie Trailer"
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    allowFullScreen
                    frameBorder="0"
                  ></iframe>
                </div>
              </div>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <div className={`${theme.cardBg} rounded-xl p-6 mb-8 ${theme.border} border shadow-lg`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {movie.cast.slice(0, 8).map((actor) => (
                    <Link
                      to={`/actor/${actor.id}`}
                      key={actor.id}
                      className="group transition-transform transform hover:scale-105"
                    >
                      <div className={`${theme.cardBg} rounded-lg overflow-hidden ${theme.border} border shadow-md`}>
                        <img
                          src={
                            actor.profile_path 
                              ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                              : 'https://via.placeholder.com/300x450?text=No+Image'
                          }
                          alt={actor.name}
                          className="w-full aspect-[2/3] object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Image';
                          }}
                        />
                        <div className="p-3">
                          <h3 className={`font-semibold ${theme.text} group-hover:text-yellow-400 transition-colors`}>
                            {actor.name}
                          </h3>
                          <p className={`${theme.text} text-sm opacity-90`}>{actor.character}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className={`${theme.cardBg} rounded-xl p-6 mb-8 ${theme.border} border shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Reviews</h2>
              
              {/* Review Form – note the onReviewAdded callback refreshes the list */}
              <ReviewForm 
                movieId={parseInt(id!)} 
                onReviewAdded={() => {
                  getMovieReviews(parseInt(id!)).then(reviews => setMovieReviews(reviews));
                }} 
              />

              {/* Display reviews */}
              <div className="mt-8 space-y-6">
                {movieReviews.map((review, index) => (
                  <div key={index} className={`${theme.cardBg} bg-opacity-90 p-4 rounded-lg ${theme.border} border shadow-md`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`${theme.text} font-medium`}>{review.userEmail}</span>
                        <div className="flex items-center text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="ml-1 font-medium">{review.rating}</span>
                        </div>
                      </div>
                      <span className={`text-sm ${theme.text} opacity-90`}>
                        {new Date(review.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`${theme.text} mt-2`}>{review.reviewText}</p>
                  </div>
                ))}
                
                {movieReviews.length === 0 && (
                  <p className={`text-center ${theme.text} opacity-90`}>No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
