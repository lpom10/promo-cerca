import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  obtenerSolicitudesPendientes,
  obtenerEmpresasAprobadas,
  obtenerPromosEnRevision,
  obtenerTodasPromociones,
  obtenerEstadisticasGlobales,
  enriquecerPagosConNombre,
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
    const unsubPagos = onSnapshot(
      query(collection(db, 'pagos'), where('status', '==', 'espera')),
      async (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const enriquecidos = await enriquecerPagosConNombre(data);
        setPagosPendientes(enriquecidos);
      }
    );
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
    if (!window.confirm('¿Eliminar esta empresa permanentemente?')) return;
    try {
      await eliminarEmpresa(empresaId);
      setEmpresasAprobadas(prev => prev.filter(e => e.id !== empresaId));
    } catch {
      alert('Error al eliminar la empresa');
    }
  };

  const handleGestionarPromocion = async (promoId, nuevoEstado) => {
    await gestionarPromocion(promoId, nuevoEstado);
    setPromosRevision(prev => prev.filter(p => p.id !== promoId));
  };

  const handleEliminarPromocion = async (promoId) => {
    if (!window.confirm('¿Eliminar esta promoción permanentemente?')) return;
    try {
      await eliminarPromocion(promoId);
      setTodasPromociones(prev => prev.filter(p => p.id !== promoId));
    } catch {
      alert('Error al eliminar la promoción');
    }
  };

  const handleAprobarPago = async (pago) => {
    try {
      await aprobarPago(pago);
      alert('Pago aprobado y suscripción activada');
    } catch {
      alert('Error al aprobar el pago');
    }
  };

  const handleRechazarPago = async (pagoId) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;
    try {
      await rechazarPago(pagoId, motivo);
    } catch {
      alert('Error al rechazar el pago');
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
