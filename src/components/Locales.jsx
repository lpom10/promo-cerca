import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { categorias } from '../data/categorias';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  registrarVisualizacion,
  crearTicket,
  verificarDisponibilidadTickets,
  obtenerMensajeDisponibilidad,
  calcularTiempoRestante,
  formatearTiempoRestante,
} from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

const TicketModal = ({ ticket, local, onClose }) => {
  const codigo = ticket?.codigo || 'ERROR';
  const catEmoji = categorias.find(c => c.id === local.categoria)?.emoji || '🏷️';
  const fechaExpiracion = local.fechaHoraExpiracion || local.fechaFin;
  const fechaFinStr = fechaExpiracion
    ? (fechaExpiracion.toDate ? new Date(fechaExpiracion.toDate()).toLocaleString() : new Date(fechaExpiracion).toLocaleString())
    : '';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="ticket-header">
          <span className="ticket-emoji">{catEmoji}</span>
          <h2>{local.empresaNombre || 'Negocio'}</h2>
        </div>
        <div className="ticket-promo">{local.titulo}</div>
        <div className="ticket-codigo">
          <span className="ticket-codigo-label">Código de canje</span>
          <span className="ticket-codigo-valor">{codigo}</span>
        </div>
        <p className="ticket-instruccion">
          {ticket 
            ? `Muestra este código en el establecimiento para obtener tu descuento del ${local.descuento}%.`
            : "Hubo un problema al generar tu ticket. Por favor, intenta de nuevo."}
        </p>
        <div className="ticket-meta">
          <span>🗓️ Válido hasta: {fechaFinStr}</span>
        </div>
        {ticket && (
          <button className="ticket-copiar" onClick={() => navigator.clipboard?.writeText(codigo)}>
            📋 Copiar código
          </button>
        )}
        <Link to={`/PerfilEmpresas?id=${local.empresaId}`} className="perfil-empresa-btn">
          Ver perfil de la empresa
        </Link>
      </div>
    </div>
  );
};

const LocalCard = ({ local, onTicket }) => {
  const { user, userType, userDetails } = useAuth();
  const fechaExpiracion = local.fechaHoraExpiracion || local.fechaFin;
  const fechaExpiracionStr = formatFechaHora(fechaExpiracion);
  const disponibilidad = verificarDisponibilidadTickets(local);
  const imagen = local.imagen || local.image || '/placeholder.png';

  const isOwner = userType === 'empresa' && userDetails?.empresaId === local.empresaId;

  const handleEdit = () => {
    window.location.href = `/GestorPromociones?id=${local.id}`;
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar promoción? Esta acción no se puede deshacer.')) return;
    try {
      alert('Eliminar: acción pendiente de implementar.');
    } catch (err) {
      console.error(err);
      alert('Error al eliminar.');
    }
  };

  return (
    <div className="promo-card">
      <div className="promo-imagen">
        <img src={imagen} alt={local.titulo || local.empresaNombre} />
      </div>
      <div className="promo-content">
        <div className="promo-header">
          <h3>{local.titulo || local.empresaNombre}</h3>
          {local.descuento && <div className="descuento-grande">-{local.descuento}%</div>}
        </div>

        <div className="negocio-nombre">{local.empresaNombre}</div>

        <p className="promo-descripcion">{local.descripcion}</p>

        <div className="promo-info">
          <div className="categoria">{categorias.find(c => c.id === local.categoria)?.label || 'Promoción'}</div>
        </div>

        <div className="promo-fechas">{fechaExpiracionStr}</div>

        <div className="promo-stats">
          👁️ {local.visualizaciones || 0} visualizaciones · 🎟️ {local.ticketsGenerados || 0}{local.ticketsMaximos ? ` / ${local.ticketsMaximos}` : ''} tickets
        </div>

        <div style={{ marginTop: 12 }} className="promo-actions">
          {isOwner ? (
            <>
              <button className="btn-edit" onClick={handleEdit}>✏️ Editar</button>
              <button className="btn-delete" onClick={handleDelete}>🗑️ Eliminar</button>
            </>
          ) : (
            <button className="btn-ticket" onClick={() => onTicket(local)}>🎫 Obtener ticket</button>
          )}
        </div>
      </div>
    </div>
  );
};

const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const formatFechaHora = (fecha) => {
  if (!fecha) return '';
  const value = fecha.toDate ? fecha.toDate() : new Date(fecha);
  return value.toLocaleString();
};

const Locales = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [catActiva, setCatActiva] = useState('todos');
  const [ticketLocal, setTicketLocal] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [locales, setLocales] = useState([]); 
  const { user, userType, userDetails } = useAuth();

  const handleTicketClick = async (local) => {
    // 1. Registrar visualización
    try {
      await registrarVisualizacion(local.id, local.empresaId, user?.uid || null);
    } catch (error) {
      console.error('Error al registrar visualización:', error);
    }

    // 2. Generar ticket real si está logueado como cliente
    if (user && userType === 'cliente') {
      try {
        const newTicket = await crearTicket(user.uid, local.id, local.empresaId, local, userDetails);
        setActiveTicket(newTicket);
      } catch (error) {
        console.error('Error al crear ticket:', error);
        alert(error.message || 'No se pudo generar el ticket. Intenta de nuevo.');
        return;
      }
    } else if (user) {
      alert('Solo los clientes pueden generar tickets de descuento.');
      return;
    } else {
      alert('Debes iniciar sesión para obtener un ticket.');
      // Opcional: navigate('/login')
      return;
    }

    setTicketLocal(local);
  };

  useEffect(() => { 
    const unsub = onSnapshot(collection(db, 'promociones'), (snapshot) => {
      setLocales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const localesFiltrados = useMemo(() => {
    const q = search.toLowerCase();
    return locales.filter((l) => {
      const matchSearch =
        !q ||
        normalizarTexto(l.empresaNombre).includes(q) ||
        normalizarTexto(l.descripcion).includes(q) ||
        normalizarTexto(l.titulo).includes(q);
      const matchCat = catActiva === 'todos' || l.categoria === catActiva;
      const disponible = verificarDisponibilidadTickets(l).disponible;
      return matchSearch && matchCat && disponible;
    });
  }, [search, catActiva, locales]); 

  return (
    <div className="locales-page">
      <div className="locales-header">
        <h1 className="locales-titulo">Locales y Promociones</h1>
        <input
          type="text"
          className="locales-search"
          placeholder=" Buscar negocios, categorías o promociones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="categorias-bar">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${catActiva === cat.id ? 'active' : ''}`}
              onClick={() => setCatActiva(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
        <p className="locales-count">
          {localesFiltrados.length === 0
            ? 'Sin resultados'
            : `${localesFiltrados.length} negocio${localesFiltrados.length !== 1 ? 's' : ''} encontrado${localesFiltrados.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {localesFiltrados.length === 0 ? (
        <div className="no-results">
          <p>😕 No encontramos negocios con esos criterios.</p>
          <button
            className="btn-limpiar"
            onClick={() => { setSearch(''); setCatActiva('todos'); }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="locales-grid">
          {localesFiltrados.map((local) => (
            <LocalCard key={local.id} local={local} onTicket={handleTicketClick} />
          ))}
        </div>
      )}

      {ticketLocal && (
        <TicketModal 
          local={ticketLocal} 
          ticket={activeTicket}
          onClose={() => { setTicketLocal(null); setActiveTicket(null); }} 
        />
      )}
    </div>
  );
};

export default Locales;