import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useAuthStore } from '@/app/store/useAuthStore';
import { Promocion } from '@/features/promociones/types/promocion';

export const useEmpresaPromociones = () => {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setPromociones([]);
      setIsLoading(false);
      return;
    }

    // Aquí asumimos que la colección 'promociones' tiene un campo 'id_empresa'
    const q = query(
      collection(db, 'promociones'),
      where('id_empresa', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPromos: Promocion[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.titulo || 'Sin Título',
          store: data.negocio || 'Tu Negocio',
          discount: data.descuento || 'N/A',
          expiry: data.fecha_fin ? `Válido hasta ${data.fecha_fin}` : 'Válido hoy',
          distance: '0 km', // Oculto o irrelevante para el dashboard propio
          image: data.imagen || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=60',
          categoria: data.categoria || 'Otros',
          estado: data.estado || 'activa',
          ...data
        } as Promocion;
      });
      
      setPromociones(fetchedPromos);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching empresa promos:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { promociones, isLoading };
};
