import React, { useState, useEffect } from 'react';
import { useWatchlist } from '../context/WatchlistContext.tsx';
import { Star } from 'lucide-react';
import { auth, db } from '../firebase'; // Firebase config
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext'; // Theme Context
import { useRating } from '../context/RatingContext';

interface ReviewFormProps {
  movieId: number;
  onReviewAdded?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ movieId, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const { getUserReviewForMovie } = useWatchlist();
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { addRating } = useRating();

  useEffect(() => {
    // Listen for auth state changes and, if logged in, prefill the form if an existing review is found.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const existingReview = getUserReviewForMovie(movieId);
        if (existingReview) {
          setRating(existingReview.rating);
          setReviewText(existingReview.reviewText);
        }
      }
    });

    return () => unsubscribe();
  }, [movieId, getUserReviewForMovie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0 && reviewText.trim()) {
      if (!user) {
        // Redirect to login if not signed in.
        navigate('/login');
        return;
      }

      try {
        const review = {
          movieId,
          rating,
          reviewText,
          userId: user.uid,
          userEmail: user.email,
          timestamp: Date.now(),
        };

        // Save or update the review in Firestore under the composite key "movieId_userId"
        await setDoc(doc(db, 'reviews', `${movieId}_${user.uid}`), review);

        // Update the RatingContext so that the MovieCard reflects the new rating.
        await addRating(movieId, rating);

        // Notify parent component to refresh reviews.
        onReviewAdded?.();

        // Optionally, clear the review text (rating is preserved so the star display remains updated)
        setReviewText('');
      } catch (error) {
        console.error("Error saving review: ", error);
      }
    }
  };

  return (
    <div className={`${theme.cardBg} bg-opacity-90 p-6 rounded-xl mt-6 ${theme.border} border shadow-lg`}>
      <h3 className={`text-xl font-bold mb-4 ${theme.text}`}>Write a Review</h3>
      <form onSubmit={handleSubmit}>
        {/* Rating Stars Section */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className={`${
                star <= rating ? 'text-yellow-400' : `${theme.text} opacity-50`
              } hover:text-yellow-400 transition-colors disabled:opacity-30`}
              disabled={!user}
            >
              <Star className="w-6 h-6" />
            </button>
          ))}
        </div>
        
        {/* Message prompting user to log in */}
        {!user && (
          <div className={`text-sm ${theme.text} font-medium mb-4`}>
            Please log in to rate this movie.
          </div>
        )}

        {/* Review Textarea */}
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Write your review..."
          className={`w-full ${theme.input} rounded p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 ${theme.border} border shadow-inner`}
          rows={4}
          disabled={!user}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!user}
          className={`${theme.primary} ${theme.buttonText} px-4 py-2 rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
        >
          Submit Review
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
