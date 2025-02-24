import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "./MovieCard.tsx";

interface MovieImage {
  file_path: string;
  width: number;
}

interface Movie {
  id: number;
  title: string;
  vote_average: number;
  poster_path: string;
  release_date: string;
  images?: MovieImage[];
}

const MovieCarousel = ({ movies }: { movies: Movie[] }) => {
  const [startIndex, setStartIndex] = useState(0);
  const visibleMovies = 4;

  const nextSlide = () => {
    setStartIndex((prev) =>
      prev + visibleMovies >= movies.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setStartIndex((prev) =>
      prev === 0 ? Math.max(0, movies.length - visibleMovies) : prev - 1
    );
  };

  return (
    <div className="relative group">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${startIndex * (100 / visibleMovies)}%)`,
          }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 p-2"
            >
              <Link to={`/movie/${movie.id}`}>
                <MovieCard
                  id={movie.id}
                  title={movie.title}
                  rating={movie.vote_average}
                  image={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  year={new Date(movie.release_date).getFullYear()}
                  genre={[]} // TMDB API doesn't provide genres in the basic movie list
                  images={movie.images}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {movies.length > visibleMovies && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};

export default MovieCarousel;
