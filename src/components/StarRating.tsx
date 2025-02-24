import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useRating } from '../context/RatingContext';
import { useTheme } from '../context/ThemeContext';

interface StarRatingProps {
  movieId: number;
  initialRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  movieId,
  initialRating = 0,
  size = 'md',
  readonly = false,
  onRatingChange,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { addRating, getRating } = useRating();
  const { theme } = useTheme();
  
  const userRating = getRating(movieId)?.rating || initialRating;
  const displayRating = hoveredRating || userRating;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = async (rating: number) => {
    if (readonly) return;
    try {
      await addRating(movieId, rating);
      if (onRatingChange) {
        onRatingChange(rating);
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onClick={() => handleClick(rating)}
          onMouseEnter={() => !readonly && setHoveredRating(rating)}
          onMouseLeave={() => !readonly && setHoveredRating(0)}
          disabled={readonly}
          className={`${!readonly && 'hover:scale-110 transition-transform'}`}
        >
          <Star
            className={`
              ${sizeClasses[size]}
              ${rating <= displayRating ? 'text-yellow-400 fill-yellow-400' : `${theme.text} opacity-50`}
              transition-colors
            `}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
