import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';

interface Rating {
  movieId: number;
  rating: number;
  timestamp: number;
}

interface RatingContextType {
  ratings: { [movieId: string]: Rating };
  addRating: (movieId: number, rating: number) => Promise<void>;
  getRating: (movieId: number) => Rating | undefined;
}

const RatingContext = createContext<RatingContextType>({
  ratings: {},
  addRating: async () => {},
  getRating: () => undefined,
});

export const useRating = () => useContext(RatingContext);

export const RatingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ratings, setRatings] = useState<{ [movieId: string]: Rating }>({});

  useEffect(() => {
    const loadUserRatings = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRatingsRef = doc(collection(db, 'userRatings'), user.uid);
        const userRatingsDoc = await getDoc(userRatingsRef);
        if (userRatingsDoc.exists()) {
          setRatings(userRatingsDoc.data() as { [movieId: string]: Rating });
        }
      }
    };

    loadUserRatings();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserRatings();
      } else {
        setRatings({});
      }
    });

    return () => unsubscribe();
  }, []);

  const addRating = async (movieId: number, rating: number) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please sign in');
      return;
    }

    const newRating: Rating = {
      movieId,
      rating,
      timestamp: Date.now(),
    };

    // Update local state
    setRatings((prev) => ({
      ...prev,
      [movieId]: newRating,
    }));

    // Update Firestore
    const userRatingsRef = doc(collection(db, 'userRatings'), user.uid);
    await setDoc(userRatingsRef, {
      ...ratings,
      [movieId]: newRating,
    }, { merge: true });
  };

  const getRating = (movieId: number) => {
    return ratings[movieId];
  };

  return (
    <RatingContext.Provider value={{ ratings, addRating, getRating }}>
      {children}
    </RatingContext.Provider>
  );
};
