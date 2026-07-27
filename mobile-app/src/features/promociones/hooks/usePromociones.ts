import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { useLocation } from '@/features/mapa/hooks/useLocation';
import { calculateDistance, formatDistance } from '@/shared/utils/location';

export interface Promocion {
  id: string;
  store: string;
  title: string;
  discount: string;
  distance: string;
  expiry: string;
  image: string;
  categoria?: string;
  distanciaRealKm?: number; // Para ordenar internamente
  latitude?: number;
  longitude?: number;
}

export const usePromociones = () => {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { location, isLoading: isLocationLoading, errorMsg: locationError } = useLocation();

  useEffect(() => {
    // Si la ubicación todavía está cargando, esperamos antes de obtener promos
    // o podríamos obtenerlas y luego ordenarlas cuando llegue la ubicación.
    // Para simplificar, obtenemos promos y calculamos cuando cambien.
    
    const fetchPromociones = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Obtener empresas aprobadas
        const qEmpresas = query(collection(db, 'empresa'), where('estado', '==', 'aprobado'), limit(100));
        const empresasSnap = await getDocs(qEmpresas);
        const empresasMap: Record<string, any> = {};
        empresasSnap.forEach(doc => {
          empresasMap[doc.id] = { id: doc.id, ...doc.data() };
        });

        // 2. Obtener promociones activas
        const qPromos = query(
          collection(db, 'promociones'),
          where('activa', '==', true),
          limit(30)
        );
        const promosSnap = await getDocs(qPromos);
        
        let promosData: Promocion[] = [];
        
        promosSnap.forEach(docSnap => {
          const data = docSnap.data();
          const empresa = data.empresaId ? empresasMap[data.empresaId] : null;
          
          // Formatear datos para la UI
          const storeName = data.empresaNombre || empresa?.nombre || empresa?.negocio || 'Negocio Desconocido';
          
          // Calcular expiración simple
          let expiryText = 'Sin fecha';
          if (data.fechaFin || data.fechaHoraExpiracion) {
            const dateStr = data.fechaFin || data.fechaHoraExpiracion;
            let dateObj;
            if (dateStr?.toDate) {
              dateObj = dateStr.toDate();
            } else {
              dateObj = new Date(dateStr);
            }
            if (dateObj && !isNaN(dateObj.getTime())) {
              expiryText = `Válido hasta ${dateObj.toLocaleDateString()}`;
            }
          }

          // Descuento
          let discountBadge = 'Promo';
          if (data.tipoDescuento === 'porcentaje' && data.valorDescuento) {
            discountBadge = `${data.valorDescuento}% OFF`;
          } else if (data.tipoDescuento === '2x1' || data.tipoDescuento === '3x2') {
            discountBadge = data.tipoDescuento;
          } else if (data.valorDescuento) {
             discountBadge = `${data.valorDescuento}`;
          }

          // Calcular distancia si tenemos ubicación y la empresa tiene coordenadas
          let distanceStr = 'Ubicación desconocida';
          let distanciaReal = Infinity;
          
          // Intentar obtener coordenadas de la empresa. Firebase a veces usa GeoPoint o { latitud, longitud }
          const lat = empresa?.latitud || empresa?.coordenadas?.latitude;
          const lon = empresa?.longitud || empresa?.coordenadas?.longitude;
          
          if (location && lat !== undefined && lon !== undefined) {
            distanciaReal = calculateDistance(
              { latitude: location.latitude, longitude: location.longitude },
              { latitude: lat, longitude: lon }
            );
            distanceStr = formatDistance(distanciaReal);
          }

          promosData.push({
            id: docSnap.id,
            store: storeName,
            title: data.titulo || 'Promoción',
            discount: discountBadge,
            distance: distanceStr,
            expiry: expiryText,
            image: data.imagenUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600&h=400',
            categoria: data.categoria || empresa?.categoria,
            distanciaRealKm: distanciaReal,
            latitude: lat,
            longitude: lon,
          });
        });

        // Ordenar por distancia (los que tienen Infinity irán al final)
        promosData.sort((a, b) => (a.distanciaRealKm || Infinity) - (b.distanciaRealKm || Infinity));

        setPromociones(promosData);
      } catch (err: any) {
        console.error("Error fetching promociones:", err);
        setError(err.message || 'Error al cargar promociones');
      } finally {
        setIsLoading(false);
      }
    };

    // Solo hacemos el fetch si ya cargó la ubicación o si hubo un error al obtenerla
    if (!isLocationLoading) {
      fetchPromociones();
    }
  }, [location, isLocationLoading]); // Se recarga cuando la ubicación cambia

  return { promociones, isLoading: isLoading || isLocationLoading, error: error || locationError };
};
