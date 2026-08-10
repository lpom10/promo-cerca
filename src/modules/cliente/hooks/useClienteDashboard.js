import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cargarDatosCliente, actualizarPerfilCliente } from '../services/clienteService';
import { obtenerTicketsUsuario, verificarNotificacionesExpiracion } from '../services/ticketService';

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
  const [error, setError]           = useState(null);

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
      setError(null);
      try {
        const [data, ticketsData] = await Promise.all([
          cargarDatosCliente(user.uid),
          obtenerTicketsUsuario(user.uid),
        ]);
        if (!activo) return;
        const enrichedTickets = ticketsData.map((ticket) => ({
          ...ticket,
          _promo: data.promosData?.[ticket.promocionId] || null,
          _empresa: data.empresasData?.[ticket.empresaId] || null,
        }));
        const ahorro = enrichedTickets
          .filter((ticket) => ticket.estado === 'canjeado')
          .reduce((sum, ticket) => sum + Number(ticket.precioDescuento || ticket.precioOriginal || 0), 0);
        const nextStats = {
          ticketsActivos: enrichedTickets.filter((ticket) => ticket.estado === 'generado').length,
          ticketsCanjeados: enrichedTickets.filter((ticket) => ticket.estado === 'canjeado').length,
          ahorroEstimado: ahorro,
          empresasUnicas: new Set(enrichedTickets.map((ticket) => ticket.empresaId).filter(Boolean)).size,
          favoritosCount: data.favoritos?.length || 0,
        };
        setTickets(enrichedTickets);
        setFavoritos(data.favoritos || []);
        setEmpresasData(data.empresasData || {});
        setPromosData(data.promosData || {});
        setTopEmpresa(data.topEmpresa);
        setStats(nextStats);
      } catch (err) {
        if (!activo) return;
        setError(err.message || 'No se pudieron cargar los tickets del cliente');
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
      const ticketsData = await obtenerTicketsUsuario(user.uid);
      const enrichedTickets = ticketsData.map((ticket) => ({
        ...ticket,
        _promo: data.promosData?.[ticket.promocionId] || null,
        _empresa: data.empresasData?.[ticket.empresaId] || null,
      }));
      setTickets(enrichedTickets);
      setFavoritos(data.favoritos || []);
      setEmpresasData(data.empresasData || {});
      setPromosData(data.promosData || {});
      setTopEmpresa(data.topEmpresa);
      setStats({
        ticketsActivos: enrichedTickets.filter((ticket) => ticket.estado === 'generado').length,
        ticketsCanjeados: enrichedTickets.filter((ticket) => ticket.estado === 'canjeado').length,
        ahorroEstimado: enrichedTickets.filter((ticket) => ticket.estado === 'canjeado').reduce((sum, ticket) => sum + Number(ticket.precioDescuento || ticket.precioOriginal || 0), 0),
        empresasUnicas: new Set(enrichedTickets.map((ticket) => ticket.empresaId).filter(Boolean)).size,
        favoritosCount: data.favoritos?.length || 0,
      });
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los tickets del cliente');
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
    loading, tickets, favoritos, empresasData, promosData, stats, topEmpresa, error,
    filteredTickets,
    // Perfil
    editMode, setEditMode,
    saving, formData, setFormData,
    // Handlers
    handleLogout, handleSaveProfile,
  };
};
