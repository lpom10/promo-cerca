import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../utils/errorHandler';
import { verificarDisponibilidadTickets } from '../services/ticketService';

export const usePromociones = (limitePromos = 30) => {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // 1. Cargar empresas aprobadas
        const qe = query(collection(db, 'empresa'), where('estado', '==', 'aprobado'), limit(100));
        const empSnap = await getDocs(qe);
        const empresasMap = {};
        empSnap.forEach(d => { empresasMap[d.id] = { id: d.id, ...d.data() }; });

        // 2. Cargar promociones activas
        const qp = query(
          collection(db, 'promociones'), 
          where('activa', '==', true), 
          orderBy('createdAt', 'desc'),
          limit(limitePromos)
        );
        const promoSnap = await getDocs(qp);
        
        const enriquecidas = promoSnap.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          const e = data.empresaId ? empresasMap[data.empresaId] : null;

          // Limpieza de coordenadas
          let lat = data.lat ?? e?.lat;
          let lng = data.lng ?? e?.lng;
          if (typeof lat === 'string') lat = parseFloat(lat.replace(',', '.'));
          if (typeof lng === 'string') lng = parseFloat(lng.replace(',', '.'));

          const promoEnriquecida = {
            ...data,
            empresaNombre: data.empresaNombre || e?.nombre || e?.negocio || 'Negocio',
            lat: isNaN(lat) ? undefined : lat,
            lng: isNaN(lng) ? undefined : lng,
            categoria: data.categoria || e?.categoria
          };

          // Filtrar por disponibilidad real
          const disp = verificarDisponibilidadTickets(promoEnriquecida);
          return disp.disponible ? promoEnriquecida : null;
        }).filter(p => p !== null && p.lat !== undefined);

        setPromociones(enriquecidas);
      } catch (err) {
        logError(err, { accion: 'usePromociones_fetch', componente: 'Hook' });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [limitePromos]);

  return { promociones, loading };
};