import { db } from '../../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { logError } from '../utils/errorHandler';

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  NEW_PROMO: 'nueva_promocion',
  PROMO_EXPIRING: 'promocion_vencimiento',
  PROMO_EXPIRED: 'promocion_vencida',
  TICKET_CANJEAD: 'ticket_canjeado',
  EMPRESA_APPROVED: 'empresa_aprobada',
  EMPRESA_REJECTED: 'empresa_rechazada',
  NEW_REVIEW: 'nueva_resena',
  REFERRAL_BONUS: 'bonus_referido',
  TICKETS_EXHAUSTED: 'tickets_agotados',
};

// Crear notificación
export const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, datos = {}) => {
  try {
    if (!usuarioId || typeof usuarioId !== 'string') {
      throw new Error('Usuario ID inválido');
    }
    if (!tipo || typeof tipo !== 'string') {
      throw new Error('Tipo de notificación inválido');
    }
    if (!titulo || typeof titulo !== 'string' || titulo.length > 200) {
      throw new Error('Título inválido');
    }
    if (!mensaje || typeof mensaje !== 'string' || mensaje.length > 1000) {
      throw new Error('Mensaje inválido');
    }

    const notificacion = {
      usuarioId,
      tipo,
      titulo,
      mensaje,
      datos: datos || {},
      leida: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'notificaciones'), notificacion);
    return { id: docRef.id, ...notificacion };
  } catch (error) {
    logError(error, { accion: 'crearNotificacion', usuarioId });
    throw error;
  }
};

// Obtener notificaciones de usuario
export const obtenerNotificaciones = async (usuarioId, limite = 20) => {
  try {
    if (!usuarioId) throw new Error('Usuario ID requerido');
    if (limite < 1 || limite > 100) limite = 20;

    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limite).map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logError(error, { accion: 'obtenerNotificaciones', usuarioId });
    throw error;
  }
};

// Suscribirse a cambios de notificaciones (real-time)
export const suscribirseNotificaciones = (usuarioId, callback) => {
  try {
    if (!usuarioId) throw new Error('Usuario ID requerido');
    if (typeof callback !== 'function') throw new Error('Callback debe ser una función');

    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const notificaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(notificaciones);
      },
      (error) => {
        logError(error, { accion: 'suscribirseNotificaciones', usuarioId });
        callback([]);
      }
    );
  } catch (error) {
    logError(error, { accion: 'suscribirseNotificaciones', usuarioId });
    throw error;
  }
};

// Marcar como leída
export const marcarComoLeida = async (notificacionId) => {
  try {
    if (!notificacionId) throw new Error('Notificación ID requerida');
    const notifRef = doc(db, 'notificaciones', notificacionId);
    await updateDoc(notifRef, { leida: true });
  } catch (error) {
    logError(error, { accion: 'marcarComoLeida', notificacionId });
    throw error;
  }
};

// Marcar todas como leídas
export const marcarTodoComoLeido = async (usuarioId) => {
  try {
    if (!usuarioId) throw new Error('Usuario ID requerido');
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = snapshot.docs.map(doc =>
      updateDoc(doc.ref, { leida: true })
    );

    await Promise.all(batch);
  } catch (error) {
    logError(error, { accion: 'marcarTodoComoLeido', usuarioId });
    throw error;
  }
};

// Eliminar notificación
export const eliminarNotificacion = async (notificacionId) => {
  try {
    if (!notificacionId) throw new Error('Notificación ID requerida');
    await deleteDoc(doc(db, 'notificaciones', notificacionId));
  } catch (error) {
    logError(error, { accion: 'eliminarNotificacion', notificacionId });
    throw error;
  }
};

// Obtener conteo de no leídas
export const obtenerConteoNoLeidas = async (usuarioId) => {
  try {
    if (!usuarioId) throw new Error('Usuario ID requerido');
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  } catch (error) {
    logError(error, { accion: 'obtenerConteoNoLeidas', usuarioId });
    return 0;
  }
};

// Crear notificación de promoción vencimiento
export const crearNotificacionVencimiento = async (usuarioId, promocion) => {
  const diasFaltantes = Math.ceil(
    (new Date(promocion.fechaFin?.toDate?.() || promocion.fechaFin) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return crearNotificacion(
    usuarioId,
    NOTIFICATION_TYPES.PROMO_EXPIRING,
    'Promoción próxima a vencer',
    `La promoción "${promocion.titulo}" vence en ${diasFaltantes} días`,
    { promocionId: promocion.id }
  );
};

// Crear notificación de tickets agotados
export const crearNotificacionTicketsAgotados = async (empresaId, promocion) => {
  return crearNotificacion(
    empresaId,
    NOTIFICATION_TYPES.TICKETS_EXHAUSTED,
    'Tickets agotados',
    `Los tickets de la promoción "${promocion.titulo}" se han agotado`,
    { promocionId: promocion.id }
  );
};

// Obtener icono y color según tipo de notificación
export const obtenerMensajePorTipo = (tipo) => {
  const mapa = {
    [NOTIFICATION_TYPES.NEW_PROMO]: { icon: '🎉', color: '#4CAF50' },
    [NOTIFICATION_TYPES.PROMO_EXPIRING]: { icon: '⏰', color: '#FF9800' },
    [NOTIFICATION_TYPES.PROMO_EXPIRED]: { icon: '❌', color: '#F44336' },
    [NOTIFICATION_TYPES.TICKET_CANJEAD]: { icon: '🎟️', color: '#2196F3' },
    [NOTIFICATION_TYPES.EMPRESA_APPROVED]: { icon: '✅', color: '#4CAF50' },
    [NOTIFICATION_TYPES.EMPRESA_REJECTED]: { icon: '🚫', color: '#F44336' },
    [NOTIFICATION_TYPES.NEW_REVIEW]: { icon: '⭐', color: '#9C27B0' },
    [NOTIFICATION_TYPES.REFERRAL_BONUS]: { icon: '🎁', color: '#00BCD4' },
    [NOTIFICATION_TYPES.TICKETS_EXHAUSTED]: { icon: '🔴', color: '#FF5722' },
  };

  return mapa[tipo] ?? { icon: '🔔', color: '#607D8B' };
};