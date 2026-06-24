import { useState, useEffect } from 'react';
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
  const { user, userDetails, logout } = useAuth();
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
    verificarNotificacionesExpiracion(user.uid);
    fetchData();
  }, [user]);

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
      window.location.reload();
    } catch {
      alert('Error al guardar los datos.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = tickets.filter(t =>
    ticketFilter === 'todos' || t.estado === ticketFilter
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
