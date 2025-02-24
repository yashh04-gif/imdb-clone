import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db } from '../firebase'; // Ensure your Firestore is initialized
import { collection, getDocs, setDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

interface Review {
  movieId: number;
  rating: number;
  reviewText: string;
  timestamp: number;
  userId: string;
  userEmail: string;
}

interface UserProfile {
  username: string;
  profilePic: string;
  preferences: {
    theme: 'dark' | 'light';
    notifications: boolean;
  };
}

interface WatchlistContextType {
  watchlist: Movie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  userProfile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  reviews: Review[];
  addReview: (review: Review) => void;
  getMovieReviews: (movieId: number) => Promise<Review[]>;
  getUserReviewForMovie: (movieId: number) => Review | undefined;
  user: User | null; // Firebase user state
  isAuthenticated: boolean; // Authentication check
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<Movie[]>([]); // Firestore data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: 'User123',
    profilePic: '',
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  });
  const [reviews, setReviews] = useState<Review[]>([]); // Firestore data
  const [user, setUser] = useState<User | null>(null); // Firebase user state
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication check

  const auth = getAuth();

  // Track user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        fetchUserProfile(currentUser.uid); // Fetch user profile from Firestore
        fetchWatchlist(currentUser.uid); // Fetch watchlist from Firestore
        fetchReviews(currentUser.uid); // Fetch reviews from Firestore
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return unsubscribe; // Clean up listener on unmount
  }, []);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId: string) => {
    const userProfileRef = doc(db, "userProfiles", userId);
    const docSnap = await getDoc(userProfileRef);

    if (docSnap.exists()) {
      setUserProfile(docSnap.data() as UserProfile);
    }
  };

  // Fetch watchlist from Firestore
  const fetchWatchlist = async (userId: string) => {
    const watchlistRef = collection(db, "watchlists", userId, "movies");
    const querySnapshot = await getDocs(watchlistRef);
    const movies: Movie[] = querySnapshot.docs.map((doc) => doc.data() as Movie);
    setWatchlist(movies);
  };

  // Fetch reviews from Firestore
  const fetchReviews = async (userId: string) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const movieReviews: Review[] = querySnapshot.docs.map((doc) => doc.data() as Review);
    setReviews(movieReviews);
  };

  // Update profile
  const updateProfile = async (profile: Partial<UserProfile>) => {
    const userId = user?.uid;
    if (!userId) return;

    const userProfileRef = doc(db, "userProfiles", userId);
    await setDoc(userProfileRef, profile, { merge: true });
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  // Add movie to watchlist
  const addToWatchlist = async (movie: Movie) => {
    if (!isAuthenticated) {
      alert('You must be signed in to add movies to your watchlist.');
      return;
    }

    const userId = user?.uid;
    if (userId) {
      const movieRef = doc(db, "watchlists", userId, "movies", movie.id.toString());
      await setDoc(movieRef, movie);
      setWatchlist(prev => [...prev, movie]);
    }
  };

  // Remove movie from watchlist
  const removeFromWatchlist = async (movieId: number) => {
    const userId = user?.uid;
    if (userId) {
      const movieRef = doc(db, "watchlists", userId, "movies", movieId.toString());
      await deleteDoc(movieRef);
      setWatchlist(prev => prev.filter(movie => movie.id !== movieId));
    }
  };

  // Check if movie is in watchlist
  const isInWatchlist = (movieId: number) => {
    return watchlist.some((movie) => movie.id === movieId);
  };

  // Add review
  const addReview = async (review: Review) => {
    if (!isAuthenticated) {
      alert('You must be signed in to add reviews.');
      return;
    }

    const userId = user?.uid;
    if (userId) {
      const reviewRef = doc(db, "reviews", `${userId}_${review.movieId}`);
      await setDoc(reviewRef, { ...review, userId });
      setReviews(prev => [...prev, review]);
    }
  };

  // Get movie reviews
  const getMovieReviews = async (movieId: number) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("movieId", "==", movieId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Review);
  };

  // Get user's review for a specific movie
  const getUserReviewForMovie = (movieId: number) => {
    return reviews.find(review => review.movieId === movieId && review.userId === user?.uid);
  };

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      userProfile,
      updateProfile,
      reviews,
      addReview,
      getMovieReviews,
      getUserReviewForMovie,
      user,
      isAuthenticated,
    }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
