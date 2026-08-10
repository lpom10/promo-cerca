import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { logError } from '../../../shared/utils/errorHandler';
import {
  obtenerSolicitudesPendientes,
  obtenerEmpresasAprobadas,
  obtenerPromosEnRevision,
  obtenerTodasPromociones,
  obtenerEstadisticasGlobales,
  suscribirseAPagosPendientes,
  suscribirseAEmpresasPendientes,
  aprobarEmpresa,
  rechazarEmpresa,
  eliminarEmpresa,
  gestionarPromocion,
  eliminarPromocion,
  aprobarPago,
  rechazarPago,
} from '../services/adminService';

export const useAdminDashboard = () => {
  const { user, userDetails, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]               = useState('solicitudes');
  const [loading, setLoading]                   = useState(true);
  const [empresasPendientes, setEmpresasPendientes] = useState([]);
  const [empresasAprobadas, setEmpresasAprobadas] = useState([]);
  const [pagosPendientes, setPagosPendientes]   = useState([]);
  const [promosRevision, setPromosRevision]     = useState([]);
  const [todasPromociones, setTodasPromociones] = useState([]);
  const [stats, setStats] = useState({ totalTickets: 0, totalEmpresas: 0, totalPromos: 0 });

  // ── Carga inicial ────────────────────────────────────────
  useEffect(() => {
    let unsubPagos = null;
    let unsubEmpresas = null;
    let isMounted = true;

    const cargarInicial = async () => {
      try {
        const [pendientesIniciales, empresas, promos] = await Promise.all([
          obtenerSolicitudesPendientes(),
          obtenerEmpresasAprobadas(),
          obtenerPromosEnRevision(),
        ]);

        if (!isMounted) return;
        setEmpresasPendientes(pendientesIniciales);
        setEmpresasAprobadas(empresas);
        setPromosRevision(promos);
      } catch (error) {
        logError(error, { accion: 'cargarInicialAdminDashboard' });
        if (!isMounted) return;
        setEmpresasPendientes([]);
        setEmpresasAprobadas([]);
        setPromosRevision([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargarInicial();
    unsubPagos = suscribirseAPagosPendientes(setPagosPendientes);
    unsubEmpresas = suscribirseAEmpresasPendientes((empresas) => {
      if (!isMounted) return;
      setEmpresasPendientes(empresas);
    });

    return () => {
      isMounted = false;
      if (typeof unsubPagos === 'function') unsubPagos();
      if (typeof unsubEmpresas === 'function') unsubEmpresas();
    };
  }, []);

  // ── Carga bajo demanda por tab ───────────────────────────
  useEffect(() => {
    if (activeTab === 'estadisticas') {
      obtenerEstadisticasGlobales().then(setStats).catch(() => {});
    }
    if (activeTab === 'promociones') {
      obtenerTodasPromociones()
        .then((result) => setTodasPromociones(Array.isArray(result?.items) ? result.items : []))
        .catch(() => setTodasPromociones([]));
    }
  }, [activeTab]);

  // ── Handlers ─────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      logError(error, { accion: 'handleLogout' });
    }
  };

  const handleAprobarEmpresa = async (empresaId) => {
    try {
      await aprobarEmpresa(empresaId);
      const aprobada = empresasPendientes.find(s => s.id === empresaId);
      setEmpresasPendientes(prev => prev.filter(s => s.id !== empresaId));
      if (aprobada) setEmpresasAprobadas(prev => [...prev, { ...aprobada, estado: 'aprobado' }]);
      return true;
    } catch (error) {
      logError(error, { accion: 'handleAprobarEmpresa', empresaId });
      return false;
    }
  };

  const handleRechazarEmpresa = async (empresaId, motivo) => {
    try {
      await rechazarEmpresa(empresaId, motivo);
      setEmpresasPendientes(prev => prev.filter(s => s.id !== empresaId));
      return true;
    } catch (error) {
      logError(error, { accion: 'handleRechazarEmpresa', empresaId, motivo });
      return false;
    }
  };

  const handleEliminarEmpresa = async (empresaId) => {
    try {
      await eliminarEmpresa(empresaId);
      setEmpresasAprobadas(prev => prev.filter(e => e.id !== empresaId));
      return true;
    } catch (err) {
      logError(err, { accion: 'eliminarEmpresa', empresaId });
      return false;
    }
  };

  const handleGestionarPromocion = async (promoId, nuevoEstado) => {
    try {
      await gestionarPromocion(promoId, nuevoEstado);
      setPromosRevision(prev => prev.filter(p => p.id !== promoId));
      return true;
    } catch (err) {
      logError(err, { accion: 'handleGestionarPromocion', promoId, nuevoEstado });
      return false;
    }
  };

  const handleEliminarPromocion = async (promoId) => {
    try {
      await eliminarPromocion(promoId);
      setTodasPromociones(prev => prev.filter(p => p.id !== promoId));
      return true;
    } catch (err) {
      logError(err, { accion: 'eliminarPromocion', promoId });
      return false;
    }
  };

  const handleAprobarPago = async (pago) => {
    try {
      await aprobarPago(pago);
      return { ok: true };
    } catch (err) {
      logError(err, { accion: 'aprobarPago', pagoId: pago.id });
      return { ok: false, error: err };
    }
  };

  const handleRechazarPago = async (pagoId, motivo) => {
    if (!motivo) return { ok: false, error: 'sin-motivo' };
    try {
      await rechazarPago(pagoId, motivo);
      return { ok: true };
    } catch (err) {
      logError(err, { accion: 'rechazarPago', pagoId, motivo });
      return { ok: false, error: err };
    }
  };

  return {
    user, userDetails,
    activeTab, setActiveTab,
    loading,
    empresasPendientes, empresasAprobadas, pagosPendientes,
    promosRevision, todasPromociones, stats,
    handleLogout,
    handleAprobarEmpresa, handleRechazarEmpresa, handleEliminarEmpresa,
    handleGestionarPromocion, handleEliminarPromocion,
    handleAprobarPago, handleRechazarPago,
  };
};
