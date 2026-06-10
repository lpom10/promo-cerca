import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase'; // Asegúrate de que 'db' está correctamente inicializado
import { collection, getDocs, query, where, limit, orderBy, startAfter, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logError } from '../utils/errorHandler';
import { categorias } from '../data/categorias';
import { LoadingSpinner } from './LoadingSpinner';
import { crearTicket, registrarVisualizacion, obtenerPromocionesTrending, verificarDisponibilidadTickets, obtenerMensajeDisponibilidad, calcularTiempoRestante, formatearTiempoRestante } from '../services/ticketService';
import VisualizarTicket from './VisualizarTicket';
import '../styles/promociones.css';

const ListarPromociones = () => {
  const { user, userType, userDetails } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true); // Nuevo estado para trending
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('vencimiento'); // vencimiento | trending | descuento
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [promocionActual, setPromocionActual] = useState(null);
  const [mostrarTrending, setMostrarTrending] = useState(false);
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('');

  // Estados para paginación
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Separamos Trending: Solo carga al montar el componente
  useEffect(() => {
    cargarTrending();
  }, []);

  // Carga de promociones principales
  useEffect(() => {
    setLastVisible(null);
    setHasMore(true);
    cargarPromociones(true);
  }, [filtroCategoria, ordenamiento, debouncedBusqueda]);

  // Debounce para la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 400); 
    return () => clearTimeout(handler);
  }, [busqueda]);

  const cargarPromociones = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError('');
      
      const pageSize = 12;
      const constraints = [
        where('activa', '==', true),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      ];

      if (filtroCategoria) {
        constraints.unshift(where('categoria', '==', filtroCategoria));
      }

      if (!reset && lastVisible) {
        constraints.push(startAfter(lastVisible));
      }

      const q = query(collection(db, 'promociones'), ...constraints);
      const snapshot = await getDocs(q);

      const nuevosDatos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);

      let dataFull = reset ? nuevosDatos : [...promociones, ...nuevosDatos];

      // Filtrado por disponibilidad
      let data = dataFull.filter(promo => {
          const disponibilidad = verificarDisponibilidadTickets(promo);
          return disponibilidad.disponible;
        });

      // Aplicar búsqueda (ahora con el valor debounced)
      if (debouncedBusqueda.trim()) {
        const searchLower = debouncedBusqueda.toLowerCase();
        data = data.filter(promo =>
          promo.titulo?.toLowerCase().includes(searchLower) ||
          promo.descripcion?.toLowerCase().includes(searchLower) ||
          promo.empresaNombre?.toLowerCase().includes(searchLower)
        );
      }

      // Ordenamiento
      if (ordenamiento === 'vencimiento') {
        data.sort((a, b) => {
          const fechaA = a.fechaFin.toDate?.() || new Date(a.fechaFin);
          const fechaB = b.fechaFin.toDate?.() || new Date(b.fechaFin);
          return fechaA.getTime() - fechaB.getTime();
        });
      } else if (ordenamiento === 'trending') {
        data.sort((a, b) => (b.visualizaciones || 0) - (a.visualizaciones || 0));
      } else if (ordenamiento === 'descuento') {
        data.sort((a, b) => b.descuento - a.descuento);
      }

      setPromociones(data);
    } catch (error) {
      logError(error, { accion: 'cargarPromociones', componente: 'ListarPromociones' });
      setError('Error al cargar promociones');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };  
  const cargarTrending = async () => {
    try {
      setLoadingTrending(true);
      const trending = await obtenerPromocionesTrending(5);
      setTrending(trending);
    } catch (error) {
      logError(error, { accion: 'cargarTrending', componente: 'ListarPromociones' });
    }
  };
  
  const handleClickTicket = async (promo) => {
    // 1. Verificar si el usuario está logueado y es cliente
    if (!user) {
      setError('Debes iniciar sesión para generar tickets.');
      return;
    }
    if (userType !== 'cliente') {
      setError('Solo los clientes pueden generar tickets.');
      return;
    }

    // 2. Registrar visualización (puede ser asíncrono y no bloquear la UI)
    try {
      await registrarVisualizacion(promo.id, promo.empresaId, user?.uid || null);
    } catch (error) {
      logError(error, { accion: 'registrarVisualizacion', promocionId: promo.id, componente: 'ListarPromociones' });
      // No se detiene el flujo principal por un error de visualización
    }

    // 3. Generar ticket
    try {
      setError('');
      // Se asume que crearTicket ya maneja la lógica de disponibilidad
      // y lanzará un error si no hay tickets o la promo está vencida.
      // Si no, se debería verificar aquí antes de llamar a crearTicket.
      // const disponibilidad = verificarDisponibilidadTickets(promo);
      // if (!disponibilidad.disponible) { throw new Error(disponibilidad.razon); }
      const ticket = await crearTicket(user.uid, promo.id, promo.empresaId, promo, userDetails);
      setTicketSeleccionado(ticket);
      setPromocionActual(promo);
    } catch (error) {
      setError(error.message);
    }
  };

  const categoriasFormato = useMemo(() => [
    { valor: '', etiqueta: '🗂️ Todas' },
    ...categorias.slice(1).map(cat => ({
      valor: cat.id,
      etiqueta: `${cat.emoji} ${cat.label}`
    }))
  ], []);

  return (
    <div className="listar-promociones">
      {/* Ticket Modal */}
      {ticketSeleccionado && (
        <VisualizarTicket
          ticket={ticketSeleccionado}
          promocion={promocionActual}
          onClose={() => {
            setTicketSeleccionado(null);
            setPromocionActual(null);
          }}
        />
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-alert">✕</button>
        </div>
      )}
    
      {/* Panel de Control */}
      <div className="filtro-container">
        <h2>🎯 Promociones Disponibles</h2>

        {/* Búsqueda y Filtros */}
        <div className="controles">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, descripción o empresa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              // onKeyUp ya no es necesario aquí, el debounce lo maneja
              className="search-input"
            />
          </div>

          {/* Ordenamiento */}
          <div className="sort-box">
            <label>Ordenar por:</label>
            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
              className="sort-select"
            >
              <option value="vencimiento">📅 Próximo a vencer</option>
              <option value="trending">🔥 Más popular</option>
              <option value="descuento">💰 Mayor descuento</option>
            </select>
          </div>

          {/* Botón de Trending */}
          <button
            className={`btn-trending ${mostrarTrending ? 'active' : ''}`}
            onClick={() => setMostrarTrending(!mostrarTrending)}
          >
            🔥 Trending
          </button>
        </div>

        {/* Categorías */}
        <div className="filtros">
          {categoriasFormato.map(cat => (
            <button
              key={cat.valor}
              onClick={() => setFiltroCategoria(cat.valor)}
              className={`filtro-btn ${filtroCategoria === cat.valor ? 'active' : ''}`}
            >
              {cat.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* Panel de Trending */}
      {mostrarTrending && trending.length > 0 && (
        <div className="trending-panel">
          <h3>🔥 Top 5 Más Visto</h3> {/* Se añade un estado de carga para trending */}
          <div className="trending-grid">
            {trending.map((promo, idx) => (
              <div key={promo.id} className="trending-card">
                <div className="ranking">#{idx + 1}</div>
                <h4>{promo.titulo}</h4>
                <p className="empresa-small">{promo.empresaNombre}</p>
                <div className="stats">
                  <span className="views">👁️ {promo.visualizaciones || 0} vistas</span>
                  <span className="descuento-small">-{promo.descuento}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Promociones */}
      {loading ? (
        <LoadingSpinner message="Cargando promociones..." /> // Se añade un estado de carga para trending
      ) : promociones.length === 0 ? (
        <div className="sin-promociones">
          <p>📭 No hay promociones disponibles en esta categoría</p>
        </div>
      ) : (
        <div className="promociones-grid">
          {promociones.map(promo => {
            const dias = calcularTiempoRestante(promo.fechaFin)?.dias || 0; // Usar calcularTiempoRestante
            const vencida = dias < 0;
            const disponibilidad = verificarDisponibilidadTickets(promo);
            const mensajeDisponibilidad = obtenerMensajeDisponibilidad(disponibilidad);
            const fechaExpCampo = promo.fechaHoraExpiracion || promo.fechaFin;
            const tiempoRestante = calcularTiempoRestante(fechaExpCampo);
            const textoTiempoRestante = tiempoRestante ? formatearTiempoRestante(tiempoRestante) : null;
            const puedeGenerarTicket = !vencida && disponibilidad.disponible;

            return (
              <div
                key={promo.id}
                className={`promo-card-cliente ${vencida ? 'vencida' : ''} ${!disponibilidad.disponible ? 'sin-tickets' : ''}`}
              >
                {promo.imagen && (
                  <div className="promo-imagen">
                    <img src={promo.imagen} alt={promo.titulo} />
                  </div>
                )}

                <div className="promo-body">
                  <div className="promo-header">
                    <h3>{promo.titulo}</h3>
                    <span className="descuento-grande">-{promo.descuento}%</span>
                  </div>

                  <p className="negocio-nombre">
                    <strong>{promo.empresaNombre}</strong>
                  </p>

                  <p className="promo-descripcion">{promo.descripcion}</p>

                  {/* Estadísticas */}
                  <div className="promo-stats">
                    <span className="visualizaciones">👁️ {promo.visualizaciones || 0}</span>
                    {promo.ticketsMaximos && (
                      <span className="tickets-info">🎟️ {promo.ticketsGenerados || 0}/{promo.ticketsMaximos}</span>
                    )}
                  </div>

                  {/* Información de disponibilidad de tickets */}
                  <div className="disponibilidad-tickets">
                    <p className={`mensaje-disponibilidad ${disponibilidad.disponible ? 'disponible' : 'no-disponible'}`}>
                      {disponibilidad.disponible ? '✅' : '⛔'} {mensajeDisponibilidad}
                    </p>

                    {promo.ticketsMaximos && disponibilidad.ticketsRestantes !== null && (
                      <p className="tickets-restantes">
                        🎟️ Quedan: <strong>{disponibilidad.ticketsRestantes}</strong> de {promo.ticketsMaximos}
                      </p>
                    )}

                    {fechaExpCampo && (
                      <p className="fecha-expiracion">
                        ⏰ Vence: {textoTiempoRestante ? `${textoTiempoRestante} (${new Date(fechaExpCampo.toDate?.() || fechaExpCampo).toLocaleString()})` : new Date(fechaExpCampo.toDate?.() || fechaExpCampo).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="promo-footer">
                    <div className="tiempo-restante">
                      {vencida ? (
                        <span className="vencida-text">⏰ Vencida</span>
                      ) : dias === 0 ? (
                        <span className="vence-hoy">🔴 Vence hoy</span>
                      ) : dias === 1 ? (
                        <span className="vence-pronto">🟡 Vence mañana</span>
                      ) : (
                        <span className="tiempo-normal">📅 Vence en {dias} días</span>
                      )}
                    </div>
                    <button
                      className="btn-ticket"
                      onClick={() => handleClickTicket(promo)}
                      disabled={!puedeGenerarTicket}
                      title={
                        userType !== 'cliente' 
                          ? 'Solo clientes pueden generar tickets' 
                          : !disponibilidad.disponible // Se añade un estado de carga para trending
                          ? disponibilidad.razon
                          : vencida 
                          ? 'Promoción vencida' 
                          : 'Generar ticket'
                      }
                    >
                      🎟️ Ticket
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón Cargar Más */}
      {!loading && hasMore && promociones.length > 0 && (
        <div className="pagination-container" style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button 
            onClick={() => cargarPromociones(false)} 
            className="btn-cargar-mas"
            disabled={loadingMore}
          >
            {loadingMore ? 'Cargando...' : 'Ver más promociones'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ListarPromociones;
