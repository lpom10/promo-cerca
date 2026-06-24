// src/shared/hooks/useNotifications.js
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  suscribirseNotificaciones,
  marcarComoLeida,
  marcarTodoComoLeido,
  eliminarNotificacion,
} from '../services/notificationService';
import { logError } from '../utils/errorHandler';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  useEffect(() => {
    if (!user) return;
    setCargando(true);
    const unsubscribe = suscribirseNotificaciones(user.uid, (data) => {
      setNotificaciones(data);
      setCargando(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (
        bellRef.current && panelRef.current &&
        !bellRef.current.contains(e.target) &&
        !panelRef.current.contains(e.target)
      ) setAbierto(false);
    };
    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      return () => document.removeEventListener('mousedown', handleClickAfuera);
    }
  }, [abierto]);

  const handleClickNotificacion = async (notif) => {
    if (!notif.leida) await marcarComoLeida(notif.id);
  };

  const handleEliminar = async (id, e) => {
    e.stopPropagation();
    try { await eliminarNotificacion(id); }
    catch (error) { logError(error, { accion: 'eliminarNotificacion', notificacionId: id }); }
  };

  const handleMarcarTodoLeido = async () => {
    try { await marcarTodoComoLeido(user.uid); }
    catch (error) { logError(error, { accion: 'marcarTodoComoLeido' }); }
  };

  return {
    notificaciones, noLeidas, abierto, cargando,
    bellRef, panelRef,
    setAbierto,
    handleClickNotificacion,
    handleEliminar,
    handleMarcarTodoLeido,
  };
};