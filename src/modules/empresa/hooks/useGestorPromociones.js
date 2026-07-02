// src/modules/empresa/hooks/useGestorPromociones.js
import { useState, useEffect } from 'react';
import { 
  obtenerPromocionesPorEmpresa, 
  crearPromocion, 
  actualizarPromocion, 
  eliminarPromocion 
} from '../services/promocionesServices';
import { useAuth } from '../../../shared/hooks/useAuth';
import { logError } from '../../../shared/utils/errorHandler';

export const useGestorPromociones = () => {
  const { user } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarPromociones = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const datos = await obtenerPromocionesPorEmpresa(user.uid);
      setPromociones(datos);
      setError(null);
    } catch (err) {
      logError('cargarPromociones', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPromociones();
  }, [user?.uid]);

  const crear = async (datosPromocion) => {
    try {
      await crearPromocion(user.uid, datosPromocion);
      await cargarPromociones();
      return { exito: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const actualizar = async (promocionId, datos) => {
    try {
      await actualizarPromocion(promocionId, datos);
      await cargarPromociones();
      return { exito: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const eliminar = async (promocionId) => {
    try {
      await eliminarPromocion(promocionId);
      await cargarPromociones();
      return { exito: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    promociones,
    loading,
    error,
    crear,
    actualizar,
    eliminar,
    refetch: cargarPromociones,
  };
};