import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';
import { crearNotificacion } from '../../../shared/services/notificationService';
import { procesarBonusPorPrimerTicket } from './referidosService';
import { subscribeToCollection } from '../../../shared/services/firestoreUtils';

const crearTicketCallable = httpsCallable(functions, 'crearTicketCallable');

const normalizeTicketState = (ticket) => {
  const estado = ticket?.estado;
  if (estado === 'canjeado') return 'canjeado';
  if (estado === 'expirado') return 'expirado';
  if (estado === 'cancelado') return 'cancelado';
  return 'activo';
};

const getExpiryDate = (ticket) => {
  const candidates = [ticket?.expiresAt, ticket?.fechaHoraExpiracion, ticket?.fechaExpiracion];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate?.toDate === 'function') return candidate.toDate();
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
};

const parseTicket = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    estado: normalizeTicketState(data),
  };
};

export const crearTicket = async (usuarioId, promocionId, empresaId, promocionData = {}, usuarioData = {}) => {
  try {
    if (!usuarioId || typeof usuarioId !== 'string') throw new Error('Usuario ID inválido');
    if (!promocionId || typeof promocionId !== 'string') throw new Error('Promoción ID inválido');
    if (!empresaId || typeof empresaId !== 'string') throw new Error('Empresa ID inválido');
    if (promocionData != null && typeof promocionData !== 'object') throw new Error('Datos de promoción inválidos');

    const resultado = await crearTicketCallable({
      usuarioId,
      promocionId,
      empresaId,
      usuarioData,
    });

    await procesarBonusPorPrimerTicket(usuarioId, { id: `${usuarioId}_${promocionId}`, usuarioNombre: usuarioData?.nombre || 'Cliente' });

    return {
      id: `${usuarioId}_${promocionId}`,
      ...resultado.data?.ticket,
    };
  } catch (error) {
    logError(error, { accion: 'crearTicket' });
    throw error;
  }
};

const buildTicketsQuery = ({ field, value, pageSize = 50, lastDoc = null }) => {
  const constraints = [
    where(field, '==', value),
    orderBy('fechaGeneracion', 'desc'),
  ];

  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));

  return query(collection(db, 'tickets'), ...constraints);
};

export const obtenerTicketsUsuario = async (usuarioId, pageSize = 50, lastDoc = null) => {
  try {
    if (!usuarioId || typeof usuarioId !== 'string') throw new Error('Usuario ID inválido');
    const snapshot = await getDocs(buildTicketsQuery({ field: 'usuarioId', value: usuarioId, pageSize, lastDoc }));
    return snapshot.docs.map(parseTicket);
  } catch (error) {
    logError(error, { accion: 'obtenerTicketsUsuario' });
    throw error;
  }
};

export const suscribirseATicketsEmpresa = (empresaId, onCambio) => {
  return subscribeToCollection({
    collectionName: 'tickets',
    constraints: [where('empresaId', '==', empresaId)],
    onChange: (tickets) => onCambio?.(tickets),
    onError: (error) => logError(error, { accion: 'suscribirseATicketsEmpresa', empresaId }),
  });
};

export const verificarNotificacionesExpiracion = async (usuarioId) => {
  try {
    const ahora = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

    const snapshot = await getDocs(query(collection(db, 'tickets'), where('usuarioId', '==', usuarioId), where('estado', '==', 'activo')));

    for (const ticketSnap of snapshot.docs) {
      const ticket = ticketSnap.data();
      const fechaExp = getExpiryDate(ticket);

      if (ticket.recordatorioExpiracionEnviado) continue;

      if (fechaExp && !Number.isNaN(fechaExp.getTime()) && fechaExp > ahora && fechaExp <= unaHoraDespues) {
        await crearNotificacion(
          usuarioId,
          'recordatorio_expiracion',
          '¡Tu ticket está por expirar!',
          `Tu ticket para "${ticket.promocionTitulo}" vence en menos de una hora. ¡Canjéalo pronto!`,
          { promocionId: ticket.promocionId }
        );

        await updateDoc(doc(db, 'tickets', ticketSnap.id), {
          recordatorioExpiracionEnviado: true,
          recordatorioExpiracionEnviadoAt: Timestamp.now(),
        });
      }
    }
  } catch (error) {
    logError(error, { accion: 'verificarNotificacionesExpiracion', usuarioId });
  }
};
