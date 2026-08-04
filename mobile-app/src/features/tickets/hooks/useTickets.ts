import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
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

import * as Notifications from 'expo-notifications';

export const useTickets = () => {
  const { user, isAuth } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let unsubscribe = false;

    const fetchTickets = async () => {
      if (!isAuth || !user) {
        setTickets([]);
        setIsLoading(false);
        return;
      }

      try {
        const ticketsRef = collection(db, 'redemptions');
        const q = query(ticketsRef, where('userId', '==', user.uid), orderBy('generatedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const fetchedTickets: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTickets.push({
            id: doc.id,
            store: data.companyName || 'Local Comercial',
            title: data.promotionTitle || 'Promoción',
            discount: data.discount || 'Descuento',
            status: data.status === 'PENDING' ? 'Activo' : (data.status === 'REDEEMED' ? 'Usado' : 'Expirado'),
            expiry: data.validUntil ? new Date(data.validUntil).toLocaleDateString() : 'Sin expiración',
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

  const generateTicket = async (promo: any): Promise<string> => {
    if (!user) throw new Error("No autenticado");
    setIsGenerating(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 3); // Valid for 3 days for mockup

      const redemptionData = {
        userId: user.uid,
        promotionId: promo.id,
        companyId: promo.empresaId || '',
        companyName: promo.store,
        promotionTitle: promo.title,
        discount: promo.discount,
        latitude: promo.latitude || null,
        longitude: promo.longitude || null,
        generatedAt: serverTimestamp(),
        validUntil: validUntil.getTime(),
        status: 'PENDING',
      };

      const docRef = await addDoc(collection(db, 'redemptions'), redemptionData);
      
      // Schedule local push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "¡Tu cupón está por expirar! ⏰",
          body: `No olvides usar tu cupón de ${promo.discount} en ${promo.store}.`,
        },
        trigger: {
          seconds: 24 * 60 * 60, // 1 day
        },
      });

      return docRef.id;
    } catch (error) {
      console.error("Error generating ticket:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { tickets, isLoading, generateTicket, isGenerating };
};
