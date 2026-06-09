import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { categorias } from '../data/categorias';
import { collection, onSnapshot, query, limit, orderBy, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../utils/errorHandler';
import { LoadingSpinner } from './LoadingSpinner';
import {
  registrarVisualizacion,
  crearTicket,
  verificarDisponibilidadTickets,
} from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

// --- COMPONENTE: MODAL DEL TICKET (Sin el botón de perfil) ---
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
      </div>
    </div>
  );
};

// --- COMPONENTE: TARJETA DE LOCAL ---
const LocalCard = ({ local, onTicket }) => {
  const { user, userType, userDetails } = useAuth();
  const fechaExpiracion = local.fechaHoraExpiracion || local.fechaFin;
  const fechaExpiracionStr = formatFechaHora(fechaExpiracion);
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
      logError(err, { accion: 'eliminarPromocion', componente: 'Locales' });
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

        {/* El nombre del negocio ahora también es un link al perfil */}
        <Link to={`/empresa/${local.empresaId}`} style={{ textDecoration: 'none' }}>
            <div className="negocio-nombre">🏢 {local.empresaNombre}</div>
        </Link>

        <p className="promo-descripcion">{local.descripcion}</p>

        <div className="promo-info">
          <div className="categoria">
            {categorias.find(c => c.id === local.categoria)?.label || 'Promoción'}
          </div>
        </div>

        <div className="promo-fechas">Vence: {fechaExpiracionStr}</div>

        <div className="promo-stats">
          <span className="visualizaciones">👁️ {local.visualizaciones || 0}</span>
          <span className="tickets-info">🎟️ {local.ticketsGenerados || 0}{local.ticketsMaximos ? ` / ${local.ticketsMaximos}` : ''}</span>
        </div>

        <div className="promo-actions" style={{ marginTop: '15px' }}>
          {isOwner ? (
            <>
              <button className="btn-edit" onClick={handleEdit}>✏️ Editar</button>
              <button className="btn-delete" onClick={handleDelete}>🗑️ Eliminar</button>
            </>
          ) : (
            <>
              {/* BOTÓN NUEVO: Visible para todos los usuarios antes de sacar ticket */}
              <Link to={`/empresa/${local.empresaId}`} className="btn-edit" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔎 Perfil
              </Link>
              
              <button className="btn-ticket" onClick={() => onTicket(local)}>
                🎫 Ticket
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- FUNCIONES AUXILIARES ---
const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const formatFechaHora = (fecha) => {
  if (!fecha) return '';
  const value = fecha.toDate ? fecha.toDate() : new Date(fecha);
  return value.toLocaleString();
};

// --- COMPONENTE PRINCIPAL: LOCALES ---
const Locales = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [catActiva, setCatActiva] = useState('todos');
  const [ticketLocal, setTicketLocal] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [locales, setLocales] = useState([]);
  const [allLocalesCache, setAllLocalesCache] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, userType, userDetails } = useAuth();

  const handleTicketClick = async (local) => {
    try {
      await registrarVisualizacion(local.id, local.empresaId, user?.uid || null);
    } catch (error) {
      logError(error, { accion: 'registrarVisualizacion', localId: local.id, componente: 'Locales' });
    }

    if (user && userType === 'cliente') {
      try {
        const newTicket = await crearTicket(user.uid, local.id, local.empresaId, local, userDetails);
        setActiveTicket(newTicket);
        setTicketLocal(local);
      } catch (error) {
        alert(error.message || 'Error al generar ticket.');
      }
    } else if (user) {
      alert('Solo los clientes pueden generar tickets.');
    } else {
      alert('Debes iniciar sesión para obtener un ticket.');
    }
  };

  useEffect(() => { 
    // Initial load: Get all promociones (cached in memory for client-side search)
    const cargarPromocionesInicial = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'promociones'), orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllLocalesCache(docs);
        setLocales(docs);
      } catch (error) {
        logError(error, { accion: 'cargarPromocionesInicial', componente: 'Locales' });
      } finally {
        setLoading(false);
      }
    };
    
    cargarPromocionesInicial();
  }, []);

  const localesFiltrados = useMemo(() => {
    const q = search.toLowerCase();
    return locales.filter((l) => {
      const matchSearch = !q || 
        normalizarTexto(l.empresaNombre).includes(q) || 
        normalizarTexto(l.titulo).includes(q);
      const matchCat = catActiva === 'todos' || l.categoria === catActiva;
      return matchSearch && matchCat;
    });
  }, [search, catActiva, locales]); 

  return (
    <div className="locales-page" style={{ padding: '20px' }}>
      <div className="locales-header">
        <h1 className="locales-titulo">Locales y Promociones</h1>
        <div className="search-box">
            <input
            type="text"
            className="search-input"
            placeholder=" Buscar negocios o promociones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="filtros" style={{ marginTop: '15px' }}>
          
           
          {categorias.map((cat) => (
            <button
              key={cat.id}
              className={`filtro-btn ${catActiva === cat.id ? 'active' : ''}`}
              onClick={() => setCatActiva(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Cargando promociones..." />
      ) : localesFiltrados.length === 0 ? (
        <div className="no-results">
          <p>No hay promociones disponibles.</p>
        </div>
      ) : (
        <div className="promociones-grid" style={{ marginTop: '25px' }}>
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