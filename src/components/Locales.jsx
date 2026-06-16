import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { categorias } from '../data/categorias';
import { collection, query, where, limit, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../utils/errorHandler';
import { LoadingSpinner } from './LoadingSpinner';
import { togglePromocionFavorita, obtenerFavoritos } from '../services/favoritosService';
import { registrarVisualizacion, crearTicket } from '../services/ticketService';
import { useAuth } from '../context/AuthContext';

// --- COMPONENTE: MODAL DEL TICKET ---
const TicketModal = ({ ticket, local, onClose }) => {
  const codigo = ticket?.codigo || 'ERROR';
  const fechaExpiracion = local.fechaHoraExpiracion || local.fechaFin;
  const fechaFinStr = fechaExpiracion
    ? (fechaExpiracion.toDate ? new Date(fechaExpiracion.toDate()).toLocaleString() : new Date(fechaExpiracion).toLocaleString())
    : '';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="ticket-header">
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
            : 'Hubo un problema al generar tu ticket. Por favor, intenta de nuevo.'}
        </p>
        <div className="ticket-meta">
          <span>Válido hasta: {fechaFinStr}</span>
        </div>
        {ticket && (
          <button className="ticket-copiar" onClick={() => navigator.clipboard?.writeText(codigo)}>
            Copiar código
          </button>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE: TARJETA DE LOCAL ---
const LocalCard = ({ local, onTicket, onDelete }) => {
  const { user, userType } = useAuth();
  const navigate = useNavigate();

  const fechaExpiracion    = local.fechaHoraExpiracion || local.fechaFin;
  const fechaExpiracionStr = formatFechaHora(fechaExpiracion);
  const imagen             = local.imagen || local.image || '/placeholder.png';

  const [isFavorite,   setIsFavorite]   = useState(false);
  const [loadingFav,   setLoadingFav]   = useState(false);
  // FIX: reemplaza window.confirm — estado inline de confirmación de borrado
  const [showConfirm,  setShowConfirm]  = useState(false);
  // FIX: reemplaza alert() — mensaje de error inline
  const [errorMsg,     setErrorMsg]     = useState('');

  const isOwner = userType === 'empresa' && user?.uid === local.empresaId;
  const isAdmin = userType === 'admin';

  useEffect(() => {
    const cargarFavorito = async () => {
      if (!user) return;
      try {
        const favs = await obtenerFavoritos(user.uid);
        setIsFavorite(favs.some(f => f.tipo === 'promocion' && f.promocionId === local.id));
      } catch (err) {
        logError(err, { accion: 'cargarFavorito', componente: 'LocalCard' });
      }
    };
    cargarFavorito();
  }, [user, local.id]);

  const handleToggleFavorite = async () => {
    // FIX: reemplaza alert('Debes iniciar sesión...') con navigate
    if (!user) {
      navigate('/login');
      return;
    }
    setLoadingFav(true);
    setErrorMsg('');
    try {
      await togglePromocionFavorita(user.uid, local.id, {
        titulo:        local.titulo,
        empresaNombre: local.empresaNombre,
        empresaId:     local.empresaId,
        descuento:     local.descuento,
        imagen:        local.imagen,
        fechaFin:      local.fechaFin,
      });
      setIsFavorite(!isFavorite);
    } catch (err) {
      logError(err, { accion: 'toggleFavorito', componente: 'LocalCard', promocionId: local.id });
      // FIX: reemplaza alert() con mensaje inline
      setErrorMsg('Error al guardar favorito. Intenta de nuevo.');
    } finally {
      setLoadingFav(false);
    }
  };

  // FIX: reemplaza window.location.href = '/GestorPromociones?id=...' (ruta inexistente)
  // Ahora usa navigate() de React Router hacia la ruta correcta, pasando el id en location.state
  // GestorPromociones lee location.state?.editId en un useEffect para pre-cargar el formulario
  const handleEdit = () => {
    navigate('/empresa/gestionar-promociones', { state: { editId: local.id } });
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteDoc(doc(db, 'promociones', local.id));
      // FIX: reemplaza window.location.reload() — notifica al padre para actualizar el estado React
      onDelete(local.id);
    } catch (err) {
      logError(err, { accion: 'eliminarPromocion', componente: 'Locales' });
      setErrorMsg('Error al eliminar la promoción.');
      setShowConfirm(false);
    }
  };

  return (
    <div className="promo-card">
      <div className="promo-imagen" style={{ position: 'relative' }}>
        <img src={imagen} alt={local.titulo || local.empresaNombre} />

        {!isOwner && user && userType === 'cliente' && (
          <button
            onClick={handleToggleFavorite}
            disabled={loadingFav}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', cursor: loadingFav ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            title={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
      </div>

      <div className="promo-content">
        <div className="promo-header">
          <h3>{local.titulo || local.empresaNombre}</h3>
          <div style={{ textAlign: 'right' }}>
            {local.descuento && <div className="descuento-grande" style={{ marginBottom: '2px' }}>-{local.descuento}%</div>}
            {local.precioOriginal && (
              <div style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through' }}>${local.precioOriginal}</div>
            )}
            {local.precioDescuento && (
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2e7d32' }}>${local.precioDescuento}</div>
            )}
          </div>
        </div>

        <Link to={`/empresa/${local.empresaId}`} style={{ textDecoration: 'none' }}>
          <div className="negocio-nombre">{local.empresaNombre}</div>
        </Link>

        <p className="promo-descripcion">{local.descripcion}</p>

        <div className="promo-info">
          <div className="categoria">
            {categorias.find(c => c.id === local.categoria)?.label || 'Promoción'}
          </div>
        </div>

        <div className="promo-fechas">Vence: {fechaExpiracionStr}</div>

        <div className="promo-stats">
          <span className="visualizaciones">Vistas: {local.visualizaciones || 0}</span>
          <span className="tickets-info">
            Tickets: {local.ticketsGenerados || 0}{local.ticketsMaximos ? ` / ${local.ticketsMaximos}` : ''}
          </span>
        </div>

        {/* Mensaje de error inline (reemplaza alert) */}
        {errorMsg && (
          <p style={{ color: '#c0392b', fontSize: '12px', margin: '6px 0 0' }}>{errorMsg}</p>
        )}

        <div className="promo-actions" style={{ marginTop: '15px' }}>
          {local.lat && local.lng && (
            <button
              className="btn-mapa"
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${local.lat},${local.lng}`, '_blank')}
              style={{ marginBottom: '8px', width: '100%', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            >
              📍 Cómo llegar
            </button>
          )}

          {(isOwner || isAdmin) ? (
            <>
              <Link to={`/empresa/${local.empresaId}`} className="btn-edit"
                style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2196F3' }}>
                Perfil
              </Link>
              {isOwner && (
                <button className="btn-edit" onClick={handleEdit}>Editar</button>
              )}

              {/* FIX: Confirmación inline reemplaza window.confirm */}
              {showConfirm ? (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button className="btn-delete" onClick={handleDeleteConfirmed} style={{ fontSize: '12px' }}>
                    ¿Confirmar?
                  </button>
                  <button className="btn-cancelar" onClick={() => setShowConfirm(false)} style={{ fontSize: '12px' }}>
                    No
                  </button>
                </div>
              ) : (
                <button className="btn-delete" onClick={() => setShowConfirm(true)}>
                  Eliminar
                </button>
              )}
            </>
          ) : (
            <>
              <Link to={`/empresa/${local.empresaId}`} className="btn-edit"
                style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Perfil
              </Link>
              <button className="btn-ticket" onClick={() => onTicket(local)}>
                Ticket
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
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const formatFechaHora = (fecha) => {
  if (!fecha) return '';
  const value = fecha.toDate ? fecha.toDate() : new Date(fecha);
  return value.toLocaleString();
};

// --- COMPONENTE PRINCIPAL: LOCALES ---
const Locales = () => {
  const [searchParams]          = useSearchParams();
  const [search,    setSearch]  = useState(searchParams.get('search') || '');
  const [catActiva, setCatActiva] = useState('todos');
  const [ticketLocal,  setTicketLocal]  = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [locales,   setLocales] = useState([]);
  const [loading,   setLoading] = useState(true);
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
        // Usa mensaje inline en vez de alert — por ahora conservamos alert solo aquí
        // ya que requeriría un estado de toast global. TODO: migrar a sistema de notificaciones.
        alert(error.message || 'Error al generar ticket.');
      }
    } else if (user) {
      alert('Solo los clientes pueden generar tickets.');
    } else {
      alert('Debes iniciar sesión para obtener un ticket.');
    }
  };

  // FIX: Se elimina el estado `allLocalesCache` (se definía y llenaba pero nunca se leía)
  // FIX: Se elimina el estado `loadingMore` (se definía pero no había botón "Cargar más")
  useEffect(() => {
    const cargarPromocionesInicial = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'promociones'),
          where('activa', '==', true)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          console.warn("⚠️ La consulta no devolvió ninguna promoción. Revisa que tus documentos tengan 'estado: aprobado' y 'activa: true' en Firestore.");
        }

        const data = snapshot.docs.map(d => {
          const docData = d.data();
          return { id: d.id, ...docData };
        });

        console.log("Promociones cargadas:", data.length);
        
        // Ordenar en memoria en lugar de en la consulta para evitar errores de índice faltante
        data.sort((a, b) => {
          // Robustez: Maneja Timestamps de Firebase, Objetos Date o valores nulos
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
          return dateB - dateA;
        });

        setLocales(data);
      } catch (error) {
        console.error("Error detallado al cargar promociones:", error);
        logError(error, { accion: 'cargarPromocionesInicial', componente: 'Locales' });
      } finally {
        setLoading(false);
      }
    };
    cargarPromocionesInicial();
  }, []);

  // FIX: Callback que reciben las tarjetas para eliminar del estado sin recargar la página.
  // Antes se usaba window.location.reload() en LocalCard.handleDelete.
  const handleDeleteLocal = (id) => {
    setLocales(prev => prev.filter(l => l.id !== id));
  };

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
            placeholder="Buscar negocios o promociones..."
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
            <LocalCard
              key={local.id}
              local={local}
              onTicket={handleTicketClick}
              onDelete={handleDeleteLocal}
            />
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