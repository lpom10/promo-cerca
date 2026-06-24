// src/modules/empresa/hooks/useEmpresaDashboard.js
import { useState, useEffect } from 'react';
import { obtenerPerfilEmpresa, obtenerSuscripcionEmpresa, obtenerEstadisticasEmpresa, obtenerFinanzasEmpresa } from '../services/empresaService';
import { obtenerPromocionesPorEmpresa } from '../services/promocionesServices';
import { useAuth } from '../../../shared/context/AuthContext';
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

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        const [perfilData, suscripcionData, estadisticasData, promocionesData, finanzasData] = 
          await Promise.all([
            obtenerPerfilEmpresa(user.uid),
            obtenerSuscripcionEmpresa(user.uid),
            obtenerEstadisticasEmpresa(user.uid),
            obtenerPromocionesPorEmpresa(user.uid),
            obtenerFinanzasEmpresa(user.uid),
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
    };

    cargarDatos();
  }, [user?.uid]);

  return {
    perfil,
    suscripcion,
    estadisticas,
    finanzas,
    promociones,
    loading,
    error,
    refetch: () => {
      // Función para recargar manualmente
      setLoading(true);
    },
  };
};