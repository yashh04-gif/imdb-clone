import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchActorDetails } from "../services/tmdbApi";
import { useTheme } from "../context/ThemeContext.tsx";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
}

interface Actor {
  id: any;
  name: any;
  birthday: any;
  place_of_birth: any;
  profile_path: string | null;
  known_for: Movie[];
  biography: string | null;
  known_for_department: string | null;
  popularity: number | null;
}

const ActorDetails = () => {
  const { id } = useParams();
  const [actor, setActor] = useState<Actor | null>(null);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getActorDetails = async () => {
      setLoading(true);
      const data = await fetchActorDetails(id) as Actor;
      setActor(data);
      setLoading(false);
    };
    getActorDetails();
  }, [id]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <h1 className={`text-2xl font-bold ${theme.text}`}>Actor not found</h1>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Actor Image */}
          <div className="md:col-span-1">
            <img
              src={actor.profile_path 
                ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                : 'https://via.placeholder.com/500x750?text=No+Image'
              }
              alt={actor.name}
              className="w-full rounded-lg shadow-xl"
            />
          </div>

          {/* Actor Details */}
          <div className="md:col-span-2">
            <h1 className={`text-4xl font-bold mb-4 ${theme.text}`}>
              {actor.name}
            </h1>

            <div className="space-y-6">
              {actor.biography && (
                <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg ${theme.border} border`}>
                  <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Biography</h2>
                  <p className={`text-lg ${theme.text}`}>{actor.biography}</p>
                </div>
              )}

              {/* Personal Info */}
              <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg ${theme.border} border`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Personal Info</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className={`font-semibold ${theme.secondary}`}>Known For</h3>
                    <p className={theme.text}>{actor.known_for_department}</p>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.secondary}`}>Birthday</h3>
                    <p className={theme.text}>{actor.birthday || 'Not available'}</p>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.secondary}`}>Place of Birth</h3>
                    <p className={theme.text}>{actor.place_of_birth || 'Not available'}</p>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.secondary}`}>Popularity</h3>
                    <p className={theme.text}>{actor.popularity?.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {actor.known_for && actor.known_for.length > 0 && (
                <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg ${theme.border} border`}>
                  <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Known For</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {actor.known_for.map((movie) => (
                      <Link
                        to={`/movie/${movie.id}`}
                        key={movie.id}
                        className="group transition-transform transform hover:scale-105"
                      >
                        <div className={`${theme.cardBg} rounded-lg overflow-hidden shadow-md ${theme.border} border`}>
                          <img
                            src={movie.poster_path 
                              ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                              : 'https://via.placeholder.com/300x450?text=No+Image'
                            }
                            alt={movie.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-3">
                            <h3 className={`font-semibold ${theme.text} group-hover:text-yellow-400 transition-colors`}>
                              {movie.title}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorDetails;
