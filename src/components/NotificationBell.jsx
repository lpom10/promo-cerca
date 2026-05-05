import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  suscribirseNotificaciones,
  marcarComoLeida,
  marcarTodoComoLeido,
  eliminarNotificacion,
  obtenerMensajePorTipo,
} from '../services/notificationService';
import '../styles/notifications.css';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    setCargando(true);
    const unsubscribe = suscribirseNotificaciones(user.uid, (notificaciones) => {
      setNotificaciones(notificaciones);
      setCargando(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (
        bellRef.current &&
        panelRef.current &&
        !bellRef.current.contains(e.target) &&
        !panelRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    };

    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      return () => document.removeEventListener('mousedown', handleClickAfuera);
    }
  }, [abierto]);

  const handleClickNotificacion = async (notificacion) => {
    if (!notificacion.leida) {
      await marcarComoLeida(notificacion.id);
    }
  };

  const handleEliminar = async (id, e) => {
    e.stopPropagation();
    try {
      await eliminarNotificacion(id);
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const handleMarcarTodoComoLeido = async () => {
    try {
      await marcarTodoComoLeido(user.uid);
    } catch (error) {
      console.error('Error marcando como leído:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container" ref={bellRef}>
      {/* Botón campana */}
      <button
        className="bell-btn"
        onClick={() => setAbierto(!abierto)}
        title="Notificaciones"
      >
        🔔
        {noLeidas > 0 && (
          <span className="badge">{noLeidas > 9 ? '9+' : noLeidas}</span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {abierto && (
        <div className="notification-panel" ref={panelRef}>
          <div className="panel-header">
            <h3>Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                className="btn-marcar-leido"
                onClick={handleMarcarTodoComoLeido}
                title="Marcar todas como leídas"
              >
                ✓ Marcar todo
              </button>
            )}
          </div>

          {cargando ? (
            <div className="panel-loading">⏳ Cargando...</div>
          ) : notificaciones.length === 0 ? (
            <div className="panel-empty">
              <p>📭 No hay notificaciones</p>
            </div>
          ) : (
            <div className="notificaciones-list">
              {notificaciones.map(notif => {
                const { icon, color } = obtenerMensajePorTipo(notif.tipo);
                return (
                  <div
                    key={notif.id}
                    className={`notif-item ${notif.leida ? 'leida' : 'no-leida'}`}
                    onClick={() => handleClickNotificacion(notif)}
                  >
                    <div className="notif-indicator" style={{ background: color }} />
                    <div className="notif-content">
                      <div className="notif-titulo">
                        {icon} {notif.titulo}
                      </div>
                      <div className="notif-mensaje">{notif.mensaje}</div>
                      <div className="notif-fecha">
                        {formatearFecha(notif.createdAt)}
                      </div>
                    </div>
                    <button
                      className="btn-eliminar-notif"
                      onClick={(e) => handleEliminar(notif.id, e)}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Formatear fecha de notificación
const formatearFecha = (timestamp) => {
  const fecha = timestamp.toDate?.() || new Date(timestamp);
  const ahora = new Date();
  const diff = ahora - fecha;
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return 'justo ahora';
  if (minutos < 60) return `hace ${minutos}m`;
  if (horas < 24) return `hace ${horas}h`;
  if (dias < 7) return `hace ${dias}d`;

  return fecha.toLocaleDateString('es-EC', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default NotificationBell;
