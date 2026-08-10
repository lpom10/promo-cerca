import { useState, useEffect, useCallback } from 'react';
import { obtenerPerfilEmpresa, obtenerSuscripcionEmpresa } from '../services/empresaService';
import { obtenerPromocionesPorEmpresa } from '../services/promocionesServices';
import { obtenerAnalyticsEmpresa } from '../services/empresaAnalyticsService';
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

      const [perfilData, suscripcionData, analyticsData, promocionesData] = await Promise.all([
        obtenerPerfilEmpresa(uid),
        obtenerSuscripcionEmpresa(uid),
        obtenerAnalyticsEmpresa(uid),
        obtenerPromocionesPorEmpresa(uid),
      ]);

      setPerfil(perfilData);
      setSuscripcion(suscripcionData);
      setEstadisticas({
        promosActivas: analyticsData.promocionesActivas,
        promosTotal: analyticsData.promociones?.length || 0,
        vistasTotal: 0,
      });
      setFinanzas(analyticsData);
      setPromociones(promocionesData.map((promo) => ({
        ...promo,
        ...(analyticsData.promociones?.find((item) => item.id === promo.id) || {}),
      })));
    } catch (err) {
      logError(err, { accion: 'useEmpresaDashboard' });
      setError(err.message || 'No se pudieron cargar los datos del dashboard');
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