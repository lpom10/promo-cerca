import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cargarDatosCliente, actualizarPerfilCliente } from '../services/clienteService';
import { verificarNotificacionesExpiracion } from '../services/ticketService';

const STATS_INICIAL = {
  ticketsActivos: 0,
  ticketsCanjeados: 0,
  ahorroEstimado: 0,
  empresasUnicas: 0,
  favoritosCount: 0,
};

export const useClienteDashboard = () => {
  const { user, userDetails, logout, refreshUserDetails } = useAuth();
  const navigate = useNavigate();

  // UI
  const [activeTab, setActiveTab]   = useState('inicio');
  const [ticketFilter, setTicketFilter] = useState('todos');
  const [selectedTicketToView, setSelectedTicketToView] = useState(null);

  // Data
  const [loading, setLoading]       = useState(true);
  const [tickets, setTickets]       = useState([]);
  const [favoritos, setFavoritos]   = useState([]);
  const [empresasData, setEmpresasData] = useState({});
  const [promosData, setPromosData] = useState({});
  const [stats, setStats]           = useState(STATS_INICIAL);
  const [topEmpresa, setTopEmpresa] = useState(null);

  // Perfil
  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [formData, setFormData]     = useState({ nombre: '', telefono: '' });

  // Sync perfil con userDetails
  useEffect(() => {
    if (userDetails) {
      setFormData({
        nombre:   userDetails.nombre   || '',
        telefono: userDetails.telefono || '',
      });
    }
  }, [userDetails]);

  // Carga inicial
  useEffect(() => {
    if (!user) return;
    let activo = true;
    verificarNotificacionesExpiracion(user.uid);

    const cargar = async () => {
      setLoading(true);
      try {
        const data = await cargarDatosCliente(user.uid);
        if (!activo) return;
        setTickets(data.tickets);
        setFavoritos(data.favoritos);
        setEmpresasData(data.empresasData);
        setPromosData(data.promosData);
        setTopEmpresa(data.topEmpresa);
        setStats(data.stats);
      } finally {
        if (activo) setLoading(false);
      }
    };

    cargar();
    return () => { activo = false; };
  }, [user]);

  // Nota: fetchData queda disponible para reusar si es necesario,
  // pero las actualizaciones de estado son seguras gracias al flag en el useEffect.
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await cargarDatosCliente(user.uid);
      setTickets(data.tickets);
      setFavoritos(data.favoritos);
      setEmpresasData(data.empresasData);
      setPromosData(data.promosData);
      setTopEmpresa(data.topEmpresa);
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await actualizarPerfilCliente(user.uid, formData);
      setEditMode(false);
      // Refrescar datos del contexto sin recargar la página
      try { await refreshUserDetails(); } catch (e) { /* no bloquear si falla */ }
    } catch (err) {
      toast.error(err?.message || 'Error al guardar los datos.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = useMemo(
    () => tickets.filter(t => ticketFilter === 'todos' || t.estado === ticketFilter),
    [tickets, ticketFilter]
  );

  return {
    // Auth
    user, userDetails,
    // UI
    activeTab, setActiveTab,
    ticketFilter, setTicketFilter,
    selectedTicketToView, setSelectedTicketToView,
    // Data
    loading, tickets, favoritos, empresasData, promosData, stats, topEmpresa,
    filteredTickets,
    // Perfil
    editMode, setEditMode,
    saving, formData, setFormData,
    // Handlers
    handleLogout, handleSaveProfile,
  };
};
