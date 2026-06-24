import { useState, useEffect } from 'react';
import { cargarPromocionesDisponibles } from '../services/promocionesService';

export const usePromociones = (limitePromos = 30) => {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const promos = await cargarPromocionesDisponibles(limitePromos);
        setPromociones(promos);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [limitePromos]);

  return { promociones, loading };
};