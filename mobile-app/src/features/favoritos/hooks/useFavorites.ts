import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useAuthStore } from '@/app/store/useAuthStore';

export const useFavorites = () => {
  const { user, isAuth } = useAuthStore();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = false;

    const fetchFavorites = async () => {
      if (!isAuth || !user) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setFavorites(data.favoritos || []);
        } else {
          setFavorites([]);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        if (!unsubscribe) {
          setIsLoading(false);
        }
      }
    };

    fetchFavorites();

    return () => {
      unsubscribe = true;
    };
  }, [user, isAuth]);

  const toggleFavorite = async (promoId: string) => {
    if (!isAuth || !user) return false;

    const isFavorite = favorites.includes(promoId);
    const userRef = doc(db, 'usuarios', user.uid);

    try {
      // Optimistic update
      if (isFavorite) {
        setFavorites((prev) => prev.filter((id) => id !== promoId));
        await updateDoc(userRef, {
          favoritos: arrayRemove(promoId),
        });
      } else {
        setFavorites((prev) => [...prev, promoId]);
        await updateDoc(userRef, {
          favoritos: arrayUnion(promoId),
        });
      }
      return true;
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert optimistic update on failure
      if (isFavorite) {
        setFavorites((prev) => [...prev, promoId]);
      } else {
        setFavorites((prev) => prev.filter((id) => id !== promoId));
      }
      return false;
    }
  };

  const isFavorite = (promoId: string) => favorites.includes(promoId);

  return { favorites, isLoading, toggleFavorite, isFavorite };
};
