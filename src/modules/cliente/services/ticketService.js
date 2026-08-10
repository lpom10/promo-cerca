// src/modules/cliente/services/ticketService.js
// Dominio: acciones que ejecuta el CLIENTE sobre sus tickets.

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  Timestamp,
  updateDoc,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';
import { crearNotificacion } from '../../../shared/services/notificationService';
import { procesarBonusPorPrimerTicket } from './referidosService';
import { subscribeToCollection } from '../../../core/firebase/firestoreUtils';

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

export const generarCodigoTicket = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

export const crearTicket = async (usuarioId, promocionId, empresaId, promocionData, usuarioData) => {
  try {
    if (!usuarioId || typeof usuarioId !== 'string') throw new Error('Usuario ID inválido');
    if (!promocionId || typeof promocionId !== 'string') throw new Error('Promoción ID inválido');
    if (!empresaId || typeof empresaId !== 'string') throw new Error('Empresa ID inválido');
    if (!promocionData || typeof promocionData !== 'object') throw new Error('Datos de promoción inválidos');

    const resultado = await crearTicketCallable({
      usuarioId,
      promocionId,
      empresaId,
      promocionData,
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

export const obtenerTicketsUsuario = async (usuarioId) => {
  try {
    if (!usuarioId || typeof usuarioId !== 'string') throw new Error('Usuario ID inválido');
    const snap = await getDocs(query(collection(db, 'tickets'), where('usuarioId', '==', usuarioId)));
    return snap.docs.map(parseTicket);
  } catch (error) {
    logError(error, { accion: 'obtenerTicketsUsuario' });
    throw error;
  }
};

export const obtenerTicketsEmpresa = async (empresaId) => {
  try {
    if (!empresaId || typeof empresaId !== 'string') throw new Error('Empresa ID inválido');
    const snap = await getDocs(query(collection(db, 'tickets'), where('empresaId', '==', empresaId)));
    return snap.docs.map(parseTicket);
  } catch (error) {
    logError(error, { accion: 'obtenerTicketsEmpresa' });
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

export const canjearTicket = async (ticketId, empresaId) => {
  try {
    if (!ticketId || typeof ticketId !== 'string') throw new Error('Ticket ID inválido');
    if (!empresaId || typeof empresaId !== 'string') throw new Error('Empresa ID inválido');

    const ticketRef = doc(db, 'tickets', ticketId);
    const result = await runTransaction(db, async (transaction) => {
      const ticketSnap = await transaction.get(ticketRef);
      if (!ticketSnap.exists()) {
        throw new Error('El ticket no existe');
      }

      const ticket = ticketSnap.data();
      const estadoActual = normalizeTicketState(ticket);
      const expiracion = getExpiryDate(ticket);
      const ahora = new Date();

      if (ticket.empresaId !== empresaId) {
        throw new Error('Este ticket no pertenece a tu empresa');
      }

      if (estadoActual === 'canjeado') {
        throw new Error('Este ticket ya fue canjeado');
      }

      if (expiracion && expiracion <= ahora) {
        transaction.update(ticketRef, {
          estado: 'expirado',
          expiredAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        throw new Error('Este ticket ya expiró y no puede canjearse');
      }

      transaction.update(ticketRef, {
        estado: 'canjeado',
        redeemedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      if (ticket.promocionId) {
        const promocionRef = doc(db, 'promociones', ticket.promocionId);
        transaction.update(promocionRef, {
          ticketsCanjeados: increment(1),
          updatedAt: Timestamp.now(),
        });
      }

      return {
        success: true,
        ticketId,
        redeemedAt: new Date().toISOString(),
      };
    });

    return result;
  } catch (error) {
    logError(error, { accion: 'canjearTicket', ticketId, empresaId });
    throw error;
  }
};

export const obtenerTicketPorCodigo = async (codigo, empresaId = null) => {
  try {
    if (!codigo || typeof codigo !== 'string') throw new Error('Código de ticket inválido');

    const constraints = [where('codigo', '==', codigo.toUpperCase())];
    if (empresaId) constraints.push(where('empresaId', '==', empresaId));

    const snap = await getDocs(query(collection(db, 'tickets'), ...constraints));
    if (snap.empty) throw new Error('Código de ticket no válido');

    const ticketDoc = snap.docs[0];
    const ticket = { id: ticketDoc.id, ...ticketDoc.data() };
    const expiracion = getExpiryDate(ticket);
    const ahora = new Date();

    if (ticket.estado === 'canjeado') {
      throw new Error('Este ticket ya fue canjeado');
    }

    if (expiracion && expiracion <= ahora && ticket.estado !== 'expirado') {
      await updateDoc(ticketDoc.ref, {
        estado: 'expirado',
        expiredAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      throw new Error('Este ticket ya expiró y no puede canjearse');
    }

    return ticket;
  } catch (error) {
    logError(error, { accion: 'obtenerTicketPorCodigo' });
    throw error;
  }
};

export const verificarNotificacionesExpiracion = async (usuarioId) => {
  try {
    const ahora = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

    const snap = await getDocs(query(collection(db, 'tickets'), where('usuarioId', '==', usuarioId), where('estado', '==', 'activo')));

    for (const docSnap of snap.docs) {
      const ticket = docSnap.data();
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

        await updateDoc(doc(db, 'tickets', docSnap.id), {
          recordatorioExpiracionEnviado: true,
          recordatorioExpiracionEnviadoAt: Timestamp.now(),
        });
      }
    }
  } catch (error) {
    logError(error, { accion: 'verificarNotificacionesExpiracion', usuarioId });
  }
};

export const obtenerEstadisticasTicketsPromocion = async (promocionId) => {
  try {
    if (!promocionId) throw new Error('Promoción ID es requerido');

    const snap = await getDocs(query(collection(db, 'tickets'), where('promocionId', '==', promocionId)));
    const tickets = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    const totalTickets = tickets.length;
    const ticketsCanjeados = tickets.filter((ticket) => normalizeTicketState(ticket) === 'canjeado').length;
    const ticketsPendientes = tickets.filter((ticket) => normalizeTicketState(ticket) === 'activo').length;
    const ticketsExpirados = tickets.filter((ticket) => normalizeTicketState(ticket) === 'expirado').length;

    return {
      totalTickets,
      ticketsCanjeados,
      ticketsPendientes,
      ticketsExpirados,
      tasaCanjeamiento: totalTickets > 0 ? (ticketsCanjeados / totalTickets * 100).toFixed(2) : 0,
    };
  } catch (err) {
    logError(err, { accion: 'obtenerEstadisticasTicketsPromocion' });
    throw err;
  }
};

export const obtenerEstadisticasVistas = async (promocionId, dias = 7) => {
  try {
    if (!promocionId || typeof promocionId !== 'string') throw new Error('Promoción ID inválido');
    if (typeof dias !== 'number' || dias < 1 || dias > 365) dias = 7;

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const snap = await getDocs(query(collection(db, 'vistas'), where('promocionId', '==', promocionId), where('timestamp', '>=', Timestamp.fromDate(fechaInicio))));
    return snap.docs.map((docSnap) => docSnap.data());
  } catch (error) {
    logError(error, { accion: 'obtenerEstadisticasVistas' });
    throw error;
  }
};

export const validarReasignacionLimites = async (promocionId, nuevoMax, actualMax) => {
  try {
    const promoSnap = await getDoc(doc(db, 'promociones', promocionId));
    const generados = promoSnap.data()?.ticketsGenerados || 0;

    const resultado = { valido: true, advertencias: [], errores: [] };

    if (nuevoMax < generados) {
      resultado.errores.push(`No se puede reducir el límite a ${nuevoMax}. Ya se generaron ${generados} tickets.`);
      resultado.valido = false;
    } else if (nuevoMax > actualMax) {
      resultado.advertencias.push(`Se aumentará el límite de ${actualMax} a ${nuevoMax} tickets.`);
    } else if (nuevoMax < actualMax) {
      resultado.advertencias.push(`Se reducirá el límite de ${actualMax} a ${nuevoMax} tickets. Ya se generaron ${generados}.`);
    }

    return resultado;
  } catch (error) {
    logError(error, { accion: 'validarReasignacionLimites' });
    throw error;
  }
};