// src/modules/empresa/hooks/useEmpresaDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { obtenerPerfilEmpresa, obtenerSuscripcionEmpresa, obtenerEstadisticasEmpresa, obtenerFinanzasEmpresa } from '../services/empresaService';
import { obtenerPromocionesPorEmpresa } from '../services/promocionesServices';
import { useAuth } from '../../../shared/hooks/useAuth';
import { logError } from '../../../shared/utils/errorHandler';

export const useEmpresaDashboard = () => {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [suscripcion, setSuscripcion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [finanzas, setFinanzas] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async (uid) => {
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [perfilData, suscripcionData, estadisticasData, promocionesData, finanzasData] = 
        await Promise.all([
          obtenerPerfilEmpresa(uid),
          obtenerSuscripcionEmpresa(uid),
          obtenerEstadisticasEmpresa(uid),
          obtenerPromocionesPorEmpresa(uid),
          obtenerFinanzasEmpresa(uid),
        ]);

      setPerfil(perfilData);
      setSuscripcion(suscripcionData);
      setEstadisticas(estadisticasData);
      setFinanzas(finanzasData);
      setPromociones(promocionesData);
    } catch (err) {
      logError('useEmpresaDashboard', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    cargarDatos(user.uid);
  }, [user?.uid, cargarDatos]);

  return {
    perfil,
    suscripcion,
    estadisticas,
    finanzas,
    promociones,
    loading,
    error,
    refetch: () => {
      if (!user?.uid) return;
      cargarDatos(user.uid);
    },
  };
};