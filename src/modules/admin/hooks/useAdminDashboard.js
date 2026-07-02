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
  const [solicitudes, setSolicitudes]           = useState([]);
  const [empresasAprobadas, setEmpresasAprobadas] = useState([]);
  const [pagosPendientes, setPagosPendientes]   = useState([]);
  const [promosRevision, setPromosRevision]     = useState([]);
  const [todasPromociones, setTodasPromociones] = useState([]);
  const [stats, setStats] = useState({ totalTickets: 0, totalEmpresas: 0, totalPromos: 0 });

  // ── Carga inicial ────────────────────────────────────────
  useEffect(() => {
    const cargarInicial = async () => {
      try {
        const [sols, empresas, promos] = await Promise.all([
          obtenerSolicitudesPendientes(),
          obtenerEmpresasAprobadas(),
          obtenerPromosEnRevision(),
        ]);
        setSolicitudes(sols);
        setEmpresasAprobadas(empresas);
        setPromosRevision(promos);
      } finally {
        setLoading(false);
      }
    };
    cargarInicial();

    // Listener en tiempo real para pagos pendientes
    const unsubPagos = suscribirseAPagosPendientes(setPagosPendientes);
    return () => unsubPagos();
  }, []);

  // ── Carga bajo demanda por tab ───────────────────────────
  useEffect(() => {
    if (activeTab === 'estadisticas') {
      obtenerEstadisticasGlobales().then(setStats).catch(() => {});
    }
    if (activeTab === 'promociones') {
      obtenerTodasPromociones().then(setTodasPromociones).catch(() => {});
    }
  }, [activeTab]);

  // ── Handlers ─────────────────────────────────────────────
  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleAprobarEmpresa = async (empresaId) => {
    await aprobarEmpresa(empresaId);
    const aprobada = solicitudes.find(s => s.id === empresaId);
    setSolicitudes(prev => prev.filter(s => s.id !== empresaId));
    if (aprobada) setEmpresasAprobadas(prev => [...prev, { ...aprobada, estado: 'aprobado' }]);
  };

  const handleRechazarEmpresa = async (empresaId, motivo) => {
    await rechazarEmpresa(empresaId, motivo);
    setSolicitudes(prev => prev.filter(s => s.id !== empresaId));
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
    await gestionarPromocion(promoId, nuevoEstado);
    setPromosRevision(prev => prev.filter(p => p.id !== promoId));
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
    solicitudes, empresasAprobadas, pagosPendientes,
    promosRevision, todasPromociones, stats,
    handleLogout,
    handleAprobarEmpresa, handleRechazarEmpresa, handleEliminarEmpresa,
    handleGestionarPromocion, handleEliminarPromocion,
    handleAprobarPago, handleRechazarPago,
  };
};
