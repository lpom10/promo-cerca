import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { categorias } from '../data/categorias';
import { crearTicket, registrarVisualizacion, obtenerPromocionesTrending, verificarDisponibilidadTickets, obtenerMensajeDisponibilidad, calcularTiempoRestante, formatearTiempoRestante } from '../services/ticketService';
import VisualizarTicket from './VisualizarTicket';
import '../styles/promociones.css';

const ListarPromociones = () => {
  const { user, userType, userDetails } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('vencimiento'); // vencimiento | trending | descuento
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [promocionActual, setPromocionActual] = useState(null);
  const [mostrarTrending, setMostrarTrending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPromociones();
    cargarTrending();
  }, [filtroCategoria, ordenamiento]);

  const cargarPromociones = async () => {
    try {
      setLoading(true);
      setError('');
      let q;

      if (filtroCategoria) {
        q = query(
          collection(db, 'promociones'),
          where('categoria', '==', filtroCategoria),
          where('activa', '==', true)
        );
      } else {
        q = query(
          collection(db, 'promociones'),
          where('activa', '==', true)
        );
      }

      const snapshot = await getDocs(q);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      let data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(promo => {
          const fechaFin = promo.fechaFin.toDate?.() || new Date(promo.fechaFin);
          return fechaFin >= hoy;
        });

      // Aplicar búsqueda
      if (busqueda.trim()) {
        const searchLower = busqueda.toLowerCase();
        data = data.filter(promo =>
          promo.titulo.toLowerCase().includes(searchLower) ||
          promo.descripcion.toLowerCase().includes(searchLower) ||
          promo.empresaNombre.toLowerCase().includes(searchLower)
        );
      }

      // Ordenamiento
      if (ordenamiento === 'vencimiento') {
        data.sort((a, b) => {
          const fechaA = a.fechaFin.toDate?.() || new Date(a.fechaFin);
          const fechaB = b.fechaFin.toDate?.() || new Date(b.fechaFin);
          return fechaA - fechaB;
        });
      } else if (ordenamiento === 'trending') {
        data.sort((a, b) => (b.visualizaciones || 0) - (a.visualizaciones || 0));
      } else if (ordenamiento === 'descuento') {
        data.sort((a, b) => b.descuento - a.descuento);
      }

      setPromociones(data);
    } catch (error) {
      console.error('Error cargando promociones:', error);
      setError('Error al cargar promociones');
    }
    setLoading(false);
  };

  const cargarTrending = async () => {
    try {
      const trending = await obtenerPromocionesTrending(5);
      setTrending(trending);
    } catch (error) {
      console.error('Error cargando trending:', error);
    }
  };

  const handleClickTicket = async (promo) => {
    // Registrar visualización
    try {
      await registrarVisualizacion(promo.id, promo.empresaId, user?.uid || null);
    } catch (error) {
      console.error('Error registrando visualización:', error);
    }

    // Si no es cliente, no puede generar ticket
    if (userType !== 'cliente') {
      setError('Solo los clientes pueden generar tickets');
      return;
    }

    // Generar ticket
    try {
      setError('');
      const ticket = await crearTicket(user.uid, promo.id, promo.empresaId, promo, userDetails);
      setTicketSeleccionado(ticket);
      setPromocionActual(promo);
    } catch (error) {
      setError(error.message);
    }
  };

  const categoriasFormato = [
    { valor: '', etiqueta: '🗂️ Todas' },
    ...categorias.slice(1).map(cat => ({
      valor: cat.id,
      etiqueta: `${cat.emoji} ${cat.label}`
    }))
  ];

  const isPromoVencida = (fechaFin) => {
    const fecha = fechaFin.toDate?.() || new Date(fechaFin);
    return fecha < new Date();
  };

  const diasFaltantes = (fechaFin) => {
    const fecha = fechaFin.toDate?.() || new Date(fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diferencia = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

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
              onKeyUp={cargarPromociones}
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
          <h3>🔥 Top 5 Más Visto</h3>
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
        <div className="loading">⏳ Cargando promociones...</div>
      ) : promociones.length === 0 ? (
        <div className="sin-promociones">
          <p>📭 No hay promociones disponibles en esta categoría</p>
        </div>
      ) : (
        <div className="promociones-grid">
          {promociones.map(promo => {
            const dias = diasFaltantes(promo.fechaFin);
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
                          : !disponibilidad.disponible
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
    </div>
  );
};

export default ListarPromociones;
