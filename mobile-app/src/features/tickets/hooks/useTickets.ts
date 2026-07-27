import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useAuthStore } from '@/app/store/useAuthStore';

export interface Ticket {
  id: string;
  store: string;
  title: string;
  discount: string;
  status: 'Activo' | 'Usado' | 'Expirado';
  expiry: string;
}

export const useTickets = () => {
  const { user, isAuth } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = false;

    const fetchTickets = async () => {
      if (!isAuth || !user) {
        setTickets([]);
        setIsLoading(false);
        return;
      }

      try {
        const ticketsRef = collection(db, 'usuarios', user.uid, 'tickets');
        const q = query(ticketsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedTickets: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTickets.push({
            id: doc.id,
            store: data.store || 'Local Comercial',
            title: data.title || 'Promoción',
            discount: data.discount || 'Descuento',
            status: data.status || 'Activo',
            expiry: data.expiry || 'Sin expiración',
          });
        });

        if (!unsubscribe) {
          setTickets(fetchedTickets);
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        if (!unsubscribe) {
          setIsLoading(false);
        }
      }
    };

    fetchTickets();

    return () => {
      unsubscribe = true;
    };
  }, [user, isAuth]);

  return { tickets, isLoading };
};
