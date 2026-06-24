// src/modules/empresa/services/ticketService.js
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  runTransaction,
  increment,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

// ── GET: Obtener todos los tickets de una empresa ──
export const obtenerTicketsEmpresa = async (empresaId) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    const q = query(
      collection(db, 'tickets'),
      where('empresaId', '==', empresaId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    logError('obtenerTicketsEmpresa', err);
    throw err;
  }
};

// ── TRANSACTION: Canjear un ticket ──
export const canjearTicket = async (ticketId, empresaId) => {
  try {
    if (!ticketId || !empresaId) {
      throw new Error('Ticket ID y Empresa ID son requeridos');
    }

    const resultado = await runTransaction(db, async (transaction) => {
      // 1. Obtener ticket
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketSnap = await transaction.get(ticketRef);
      
      if (!ticketSnap.exists()) {
        throw new Error('Ticket no existe');
      }

      const ticket = ticketSnap.data();
      
      if (ticket.empresaId !== empresaId) {
        throw new Error('Ticket no pertenece a esta empresa');
      }

      if (ticket.estado === 'canjeado') {
        throw new Error('Ticket ya fue canjeado');
      }

      if (ticket.estado === 'expirado') {
        throw new Error('Ticket expirado');
      }

      // 2. Actualizar ticket
      transaction.update(ticketRef, {
        estado: 'canjeado',
        fechaCanjeado: new Date(),
      });

      // 3. Actualizar contador en promoción
      const promoRef = doc(db, 'promociones', ticket.promocionId);
      transaction.update(promoRef, {
        ticketsCanjeados: increment(1),
      });

      return { exito: true, ticket: { id: ticketId, ...ticket } };
    });

    return resultado;
  } catch (err) {
    logError('canjearTicket', err);
    throw err;
  }
};

// ── GET: Obtener estadísticas de tickets por promoción ──
export const obtenerEstadisticasTicketsPromocion = async (promocionId) => {
  try {
    if (!promocionId) throw new Error('Promoción ID es requerido');
    
    const q = query(
      collection(db, 'tickets'),
      where('promocionId', '==', promocionId)
    );
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(d => d.data());

    const totalTickets = tickets.length;
    const ticketsCanjeados = tickets.filter(t => t.estado === 'canjeado').length;
    const ticketsPendientes = tickets.filter(t => t.estado === 'pendiente').length;
    const ticketsExpirados = tickets.filter(t => t.estado === 'expirado').length;

    return {
      totalTickets,
      ticketsCanjeados,
      ticketsPendientes,
      ticketsExpirados,
      tasaCanjeamiento: totalTickets > 0 ? (ticketsCanjeados / totalTickets * 100).toFixed(2) : 0,
    };
  } catch (err) {
    logError('obtenerEstadisticasTicketsPromocion', err);
    throw err;
  }
};


// ── Obtener ticket por código (para escanear en caja) ────────────────────────

export const obtenerTicketPorCodigo = async (codigo, empresaId = null) => {
  try {
    if (!codigo || typeof codigo !== 'string') throw new Error('Código de ticket inválido');

    const constraints = [where('codigo', '==', codigo)];
    if (empresaId) constraints.push(where('empresaId', '==', empresaId));

    const snap = await getDocs(query(collection(db, 'tickets'), ...constraints));
    if (snap.empty) throw new Error('Código de ticket no válido');

    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (error) {
    logError(error, { accion: 'obtenerTicketPorCodigo' });
    throw error;
  }
};

// ── Obtener estadísticas de vistas por periodo ───────────────────────────────

export const obtenerEstadisticasVistas = async (promocionId, dias = 7) => {
  try {
    if (!promocionId || typeof promocionId !== 'string') throw new Error('Promoción ID inválido');
    if (typeof dias !== 'number' || dias < 1 || dias > 365) dias = 7;

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const snap = await getDocs(query(
      collection(db, 'vistas'),
      where('promocionId', '==', promocionId),
      where('timestamp', '>=', Timestamp.fromDate(fechaInicio))
    ));
    return snap.docs.map(d => d.data());
  } catch (error) {
    logError(error, { accion: 'obtenerEstadisticasVistas' });
    throw error;
  }
};

// ── Validar reasignación de límites al editar promoción ──────────────────────

export const validarReasignacionLimites = async (promocionId, nuevoMax, actualMax) => {
  try {
    const promoSnap = await getDoc(doc(db, 'promociones', promocionId));
    const generados = promoSnap.data()?.ticketsGenerados || 0;

    const resultado = { valido: true, advertencias: [], errores: [] };

    if (nuevoMax < generados) {
      resultado.errores.push(
        `No se puede reducir el límite a ${nuevoMax}. Ya se generaron ${generados} tickets.`
      );
      resultado.valido = false;
    } else if (nuevoMax > actualMax) {
      resultado.advertencias.push(
        `Se aumentará el límite de ${actualMax} a ${nuevoMax} tickets.`
      );
    } else if (nuevoMax < actualMax) {
      resultado.advertencias.push(
        `Se reducirá el límite de ${actualMax} a ${nuevoMax} tickets. Ya se generaron ${generados}.`
      );
    }

    return resultado;
  } catch (error) {
    logError(error, { accion: 'validarReasignacionLimites' });
    throw error;
  }
};