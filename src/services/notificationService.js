import { db } from '../firebase';
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
};

// Crear notificación
export const crearNotificacion = async (usuarioId, tipo, titulo, mensaje, datos = {}) => {
  try {
    const notificacion = {
      usuarioId,
      tipo,
      titulo,
      mensaje,
      datos,
      leida: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'notificaciones'), notificacion);
    return { id: docRef.id, ...notificacion };
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
};

// Obtener notificaciones de usuario
export const obtenerNotificaciones = async (usuarioId, limite = 20) => {
  try {
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limite).map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    throw error;
  }
};

// Suscribirse a cambios de notificaciones (real-time)
export const suscribirseNotificaciones = (usuarioId, callback) => {
  try {
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, snapshot => {
      const notificaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(notificaciones);
    });
  } catch (error) {
    console.error('Error suscribiendo a notificaciones:', error);
    throw error;
  }
};

// Marcar como leída
export const marcarComoLeida = async (notificacionId) => {
  try {
    const notifRef = doc(db, 'notificaciones', notificacionId);
    await updateDoc(notifRef, { leida: true });
  } catch (error) {
    console.error('Error marcando como leída:', error);
    throw error;
  }
};

// Marcar todas como leídas
export const marcarTodoComoLeido = async (usuarioId) => {
  try {
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
    console.error('Error marcando todo como leído:', error);
    throw error;
  }
};

// Eliminar notificación
export const eliminarNotificacion = async (notificacionId) => {
  try {
    await deleteDoc(doc(db, 'notificaciones', notificacionId));
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    throw error;
  }
};

// Obtener conteo de no leídas
export const obtenerConteoNoLeidas = async (usuarioId) => {
  try {
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error obteniendo conteo:', error);
    return 0;
  }
};

// Crear notificación de promoción vencimiento
export const crearNotificacionVencimiento = async (usuarioId, promocion) => {
  const diasFaltantes = Math.ceil(
    (new Date(promocion.fechaFin.toDate?.() || promocion.fechaFin) - new Date()) / (1000 * 60 * 60 * 24)
  );

  let tipo, titulo, mensaje;

  if (diasFaltantes === 0) {
    tipo = NOTIFICATION_TYPES.PROMO_EXPIRED;
    titulo = '📢 Promoción Vencida';
    mensaje = `"${promocion.titulo}" ya no está disponible`;
  } else if (diasFaltantes === 1) {
    tipo = NOTIFICATION_TYPES.PROMO_EXPIRING;
    titulo = '⏰ Promoción por vencer';
    mensaje = `"${promocion.titulo}" vence mañana`;
  } else if (diasFaltantes <= 3) {
    tipo = NOTIFICATION_TYPES.PROMO_EXPIRING;
    titulo = '⏰ Promoción por vencer';
    mensaje = `"${promocion.titulo}" vence en ${diasFaltantes} días`;
  }

  if (tipo) {
    return crearNotificacion(usuarioId, tipo, titulo, mensaje, { promocionId: promocion.id });
  }
};

// Crear notificación de empresa aprobada
export const crearNotificacionAprobacion = async (empresaId, aprobada = true) => {
  const tipo = aprobada ? NOTIFICATION_TYPES.EMPRESA_APPROVED : NOTIFICATION_TYPES.EMPRESA_REJECTED;
  const titulo = aprobada ? '✅ Empresa Aprobada' : '❌ Empresa Rechazada';
  const mensaje = aprobada
    ? 'Tu empresa ha sido aprobada. ¡Ya puedes crear promociones!'
    : 'Tu solicitud de empresa fue rechazada. Contacta soporte para más información.';

  return crearNotificacion(empresaId, tipo, titulo, mensaje);
};

// Crear notificación de ticket canjeado
export const crearNotificacionTicketCanjeado = async (empresaId, clienteNombre, promocion) => {
  const titulo = '🎉 Ticket Canjeado';
  const mensaje = `${clienteNombre} canjeó "${promocion.titulo}"`;

  return crearNotificacion(
    empresaId,
    NOTIFICATION_TYPES.TICKET_CANJEAD,
    titulo,
    mensaje,
    { promocionId: promocion.id, clienteNombre }
  );
};

// Obtener mensajes por tipo
export const obtenerMensajePorTipo = (tipo) => {
  const mensajes = {
    [NOTIFICATION_TYPES.NEW_PROMO]: { icon: '📢', color: '#06b6d4' },
    [NOTIFICATION_TYPES.PROMO_EXPIRING]: { icon: '⏰', color: '#ffc107' },
    [NOTIFICATION_TYPES.PROMO_EXPIRED]: { icon: '🔴', color: '#dc3545' },
    [NOTIFICATION_TYPES.TICKET_CANJEAD]: { icon: '🎉', color: '#28a745' },
    [NOTIFICATION_TYPES.EMPRESA_APPROVED]: { icon: '✅', color: '#28a745' },
    [NOTIFICATION_TYPES.EMPRESA_REJECTED]: { icon: '❌', color: '#dc3545' },
    [NOTIFICATION_TYPES.NEW_REVIEW]: { icon: '⭐', color: '#ffc107' },
    [NOTIFICATION_TYPES.REFERRAL_BONUS]: { icon: '💰', color: '#ffc107' },
  };

  return mensajes[tipo] || { icon: '📢', color: '#06b6d4' };
};
