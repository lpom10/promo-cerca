import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { categorias } from '../../../data/categorias';
import { logError } from '../../../shared/utils/errorHandler';
import { LoadingSpinner } from '../../../shared/ui/Spinner/LoadingSpinner';
import { togglePromocionFavorita, obtenerFavoritos } from "../../cliente/services/favoritosService";
import { registrarVisualizacion, obtenerPromocionesPublicas, obtenerPromocionesPublicasSiguientePagina, eliminarPromocionPublica } from "../services/promocionesService";
import { crearTicket } from "../../cliente/services/ticketService";


import { useAuth } from '../../../shared/hooks/useAuth';

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
      await eliminarPromocionPublica(local.id);
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
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
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
              <span aria-hidden>{isFavorite ? '❤️' : '🤍'}</span>
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
              <Link to={`/empresa/${local.empresaId}`} className="btn-edit">
                Perfil
              </Link>
              {isOwner && (
                <button className="btn-edit" onClick={handleEdit}>Editar</button>
              )}

              {/* FIX: Confirmación inline reemplaza window.confirm */}
              {showConfirm ? (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button className="btn-delete" onClick={handleDeleteConfirmed}>
                    ¿Confirmar?
                  </button>
                  <button className="btn-cancelar" onClick={() => setShowConfirm(false)}>
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
              <Link to={`/empresa/${local.empresaId}`} className="btn-edit">
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
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 12;
  const [loadingMore, setLoadingMore] = useState(false);
  const { user, userType, userDetails } = useAuth();

  const handleTicketClick = async (local) => {
    try {
      await registrarVisualizacion(local.id, local.empresaId, user?.uid || null);
    } catch (error) {
      logError(error, { accion: 'registrarVisualizacion', localId: local.id, componente: 'Locales' });
    }

    if (user && userType === 'cliente') {
      try {
        const newTicket = await crearTicket(user.uid, local.id, local.empresaId, undefined, userDetails);
        setActiveTicket(newTicket);
        setTicketLocal(local);
      } catch (error) {
        toast.error(error.message || 'Error al generar ticket.');
      }
    } else if (user) {
      toast.error('Solo los clientes pueden generar tickets.');
    } else {
      toast.error('Debes iniciar sesión para obtener un ticket.');
    }
  };

  // FIX: Se elimina el estado `allLocalesCache` (se definía y llenaba pero nunca se leía)
  // FIX: Se elimina el estado `loadingMore` (se definía pero no había botón "Cargar más")
  useEffect(() => {
    const cargarPromocionesInicial = async () => {
      try {
        setLoading(true);
        const response = await obtenerPromocionesPublicas(pageSize);


        const ahora = new Date();
        const dataActivas = response.promociones.filter((promo) => {
          if (promo.activa === false) return false;
          if (['inactiva', 'cancelada', 'pendiente'].includes(promo.estado)) return false;

          const fechaFin = promo.fechaFin?.toDate?.()
            ? promo.fechaFin.toDate()
            : (promo.fechaFin ? new Date(promo.fechaFin) : null);

          return !fechaFin || fechaFin >= ahora;
        });

        setLocales(dataActivas);
        setLastDoc(response.lastDoc);
        setHasMore(response.hasMore);
      } catch (error) {
        logError(error, { accion: 'cargarPromocionesInicial', componente: 'Locales' });
      } finally {
        setLoading(false);
      }
    };
    // reset state when filters change
    setLocales([]);
    setLastDoc(null);
    setHasMore(false);
    cargarPromocionesInicial();
  }, [catActiva, search]);

  // FIX: Callback que reciben las tarjetas para eliminar del estado sin recargar la página.
  // Antes se usaba window.location.reload() en LocalCard.handleDelete.
  const handleDeleteLocal = (id) => {
    setLocales(prev => prev.filter(l => l.id !== id));
  };

  // Pagination: cargar más promociones
  const loadMore = async () => {
    if (!hasMore) return;
    setLoadingMore(true);
    try {
      const response = await obtenerPromocionesPublicasSiguientePagina(lastDoc, pageSize);
      const ahora = new Date();
      const dataActivas = response.promociones.filter((promo) => {
        if (promo.activa === false) return false;
        if (['inactiva', 'cancelada', 'pendiente'].includes(promo.estado)) return false;
        const fechaFin = promo.fechaFin?.toDate?.() ? promo.fechaFin.toDate() : (promo.fechaFin ? new Date(promo.fechaFin) : null);
        return !fechaFin || fechaFin >= ahora;
      });

      setLocales(prev => [...prev, ...dataActivas]);
      setLastDoc(response.lastDoc || lastDoc);
      setHasMore(response.hasMore);
    } catch (error) {
      logError(error, { accion: 'loadMorePromotions', componente: 'Locales' });
    } finally {
      setLoadingMore(false);
    }
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
            <MemoLocalCard
              key={local.id}
              local={local}
              onTicket={handleTicketClick}
              onDelete={handleDeleteLocal}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={loadMore} disabled={loadingMore} className="btn-loadmore">
            {loadingMore ? 'Cargando...' : 'Cargar más'}
          </button>
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


// Memoizar tarjeta para evitar re-renders innecesarios
const MemoLocalCard = React.memo(LocalCard, (prev, next) => {
  // Comparar por id y referencias de callbacks
  return prev.local.id === next.local.id && prev.onTicket === next.onTicket && prev.onDelete === next.onDelete;
});

export default Locales;
