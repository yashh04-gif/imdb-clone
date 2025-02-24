import { Star } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useRating } from "../context/RatingContext";
import { Link } from "react-router-dom";

interface MovieImage {
  file_path: string;
  width: number;
}

interface MovieCardProps {
  id: number;
  title: string;
  rating: number;
  image: string;
  year: number;
  genre: string[];
  images?: MovieImage[];
}

const MovieCard: React.FC<MovieCardProps> = ({ id, title, rating, image, year, genre, images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const animationInterval = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  const formattedRating = rating.toFixed(1);

  // Preload additional images when component mounts
  useEffect(() => {
    if (images && images.length > 0) {
      images.forEach((img) => {
        const imageObj = new Image();
        imageObj.src = `https://image.tmdb.org/t/p/w500${img.file_path}`;
      });
    }
  }, [images]);

  useEffect(() => {
    if (isHovered && images && images.length > 0) {
      animationInterval.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % (images.length + 1));
      }, 600);
    } else {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        setCurrentImageIndex(0);
      }
    }

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, [isHovered, images]);

  const getCurrentImage = () => {
    if (!isHovered || currentImageIndex === 0 || !images || images.length === 0) {
      return image;
    }
    return `https://image.tmdb.org/t/p/w500${images[currentImageIndex - 1].file_path}`;
  };

  // Rating context integration
  const { addRating, getRating } = useRating();
  const userRating = getRating(id)?.rating || 0;

  const handleRating = async (newRating: number) => {
    try {
      await addRating(id, newRating);
    } catch (error) {
      console.error("Error rating movie:", error);
    }
  };

  return (
    <Link to={`/movie/${id}`} className="block">
      <div 
        className={`${theme.cardBg} rounded-xl overflow-hidden shadow-lg backdrop-blur-sm border ${theme.border}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImageIndex(0);
        }}
      >
        <div className="relative aspect-[2/3]">
          <img
            src={getCurrentImage()}
            alt={title}
            className="w-full h-full object-cover transition-all duration-300"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity">
            <div className="absolute bottom-0 p-4 w-full">
              <button className="w-full bg-yellow-500 text-black py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
                View Details
              </button>
            </div>
          </div>
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-yellow-500 font-medium">{formattedRating}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold text-lg truncate ${theme.text}`}>{title}</h3>
            <span className={`${theme.secondary} text-sm`}>{year}</span>
          </div>
          {genre && genre.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {genre.slice(0, 2).map((g) => (
                <span key={g} className={`text-xs px-2 py-1 ${theme.cardBg} rounded-full ${theme.text}`}>
                  {g}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2">
            <p className="text-sm font-semibold mb-1">Your Rating:</p>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRating(star);
                  }}
                  className="focus:outline-none"
                >
                  <Star className={`w-6 h-6 ${star <= userRating ? "text-yellow-500" : "text-gray-400"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
