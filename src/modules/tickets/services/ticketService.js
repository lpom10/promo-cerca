import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

const canjearTicketCallable = httpsCallable(functions, 'canjearTicketCallable');

export const obtenerTicketsEmpresa = async (empresaId, pageSize = 50, lastDoc = null) => {
  try {
    if (!empresaId || typeof empresaId !== 'string') throw new Error('Empresa ID inválido');

    const constraints = [
      where('empresaId', '==', empresaId),
      orderBy('fechaGeneracion', 'desc'),
    ];

    if (lastDoc) constraints.push(startAfter(lastDoc));
    constraints.push(limit(pageSize));

    const snapshot = await getDocs(query(collection(db, 'tickets'), ...constraints));
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    logError(err, { accion: 'obtenerTicketsEmpresa' });
    throw err;
  }
};

export const canjearTicket = async (ticketId, empresaId) => {
  try {
    if (!ticketId || typeof ticketId !== 'string') throw new Error('Ticket ID inválido');
    if (!empresaId || typeof empresaId !== 'string') throw new Error('Empresa ID inválido');

    const result = await canjearTicketCallable({ ticketId, empresaId });
    return result.data;
  } catch (err) {
    logError(err, { accion: 'canjearTicket' });
    throw err;
  }
};

export const obtenerTicketPorCodigo = async (codigo, empresaId = null) => {
  try {
    if (!codigo || typeof codigo !== 'string') throw new Error('Código de ticket inválido');

    const constraints = [where('codigo', '==', codigo.toUpperCase())];
    if (empresaId) constraints.push(where('empresaId', '==', empresaId));

    const snapshot = await getDocs(query(collection(db, 'tickets'), ...constraints));
    if (snapshot.empty) throw new Error('Código de ticket no válido');

    const ticketSnap = snapshot.docs[0];
    return { id: ticketSnap.id, ...ticketSnap.data() };
  } catch (err) {
    logError(err, { accion: 'obtenerTicketPorCodigo' });
    throw err;
  }
};
