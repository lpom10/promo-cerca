import {
  collection, query, where, orderBy,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

// ─────────────────────────────────────────────
// CONSULTAS
// ─────────────────────────────────────────────

export const obtenerSolicitudesPendientes = async () => {
  const snap = await getDocs(query(collection(db, 'empresa'), where('estado', '==', 'pendiente')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerEmpresasAprobadas = async () => {
  const snap = await getDocs(query(collection(db, 'empresa'), where('estado', '==', 'aprobado')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerPromosEnRevision = async () => {
  const snap = await getDocs(query(collection(db, 'promociones'), where('estado', '==', 'pendiente')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerTodasPromociones = async () => {
  const snap = await getDocs(query(collection(db, 'promociones'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerEstadisticasGlobales = async () => {
  const [ticketsSnap, empresasSnap, promosSnap] = await Promise.all([
    getDocs(collection(db, 'tickets')),
    getDocs(collection(db, 'empresa')),
    getDocs(collection(db, 'promociones')),
  ]);
  return {
    totalTickets:  ticketsSnap.size,
    totalEmpresas: empresasSnap.size,
    totalPromos:   promosSnap.size,
  };
};

/** Enriquece una lista de pagos con el nombre de la empresa correspondiente */
export const enriquecerPagosConNombre = async (pagosData) => {
  return Promise.all(pagosData.map(async (pago) => {
    try {
      const empresaDoc = await getDoc(doc(db, 'empresa', pago.empresaId));
      return { ...pago, empresaNombre: empresaDoc.exists() ? empresaDoc.data().negocio : 'Empresa desconocida' };
    } catch {
      return { ...pago, empresaNombre: 'Error al cargar nombre' };
    }
  }));
};

// ─────────────────────────────────────────────
// EMPRESAS
// ─────────────────────────────────────────────

export const aprobarEmpresa = async (empresaId) => {
  try {
    await updateDoc(doc(db, 'empresa', empresaId), { estado: 'aprobado' });
  } catch (error) {
    logError(error, { accion: 'aprobarEmpresa', empresaId });
    throw error;
  }
};

export const rechazarEmpresa = async (empresaId, motivo) => {
  try {
    await updateDoc(doc(db, 'empresa', empresaId), { estado: 'rechazado', motivoRechazo: motivo });
  } catch (error) {
    logError(error, { accion: 'rechazarEmpresa', empresaId });
    throw error;
  }
};

export const eliminarEmpresa = async (empresaId) => {
  try {
    await deleteDoc(doc(db, 'empresa', empresaId));
  } catch (error) {
    logError(error, { accion: 'eliminarEmpresa', empresaId });
    throw error;
  }
};

// ─────────────────────────────────────────────
// PROMOCIONES
// ─────────────────────────────────────────────

export const gestionarPromocion = async (promoId, nuevoEstado) => {
  try {
    await updateDoc(doc(db, 'promociones', promoId), { estado: nuevoEstado });
  } catch (error) {
    logError(error, { accion: 'gestionarPromocion', promoId });
    throw error;
  }
};

export const eliminarPromocion = async (promoId) => {
  try {
    await deleteDoc(doc(db, 'promociones', promoId));
  } catch (error) {
    logError(error, { accion: 'eliminarPromocion', promoId });
    throw error;
  }
};

// ─────────────────────────────────────────────
// PAGOS Y SUSCRIPCIONES
// ─────────────────────────────────────────────

export const aprobarPago = async (pago) => {
  try {
    await updateDoc(doc(db, 'pagos', pago.id), { status: 'aprobado' });
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    await addDoc(collection(db, 'suscripciones'), {
      empresaId:             pago.empresaId,
      plan:                  pago.planId,
      estado:                'activa',
      precio:                pago.monto,
      duracion:              30,
      fechaInicio:           new Date(),
      fechaVencimiento,
      metodoPago:            'transferencia',
      renovacionAutomatica:  true,
      createdAt:             new Date(),
    });
  } catch (error) {
    logError(error, { accion: 'aprobarPago', pagoId: pago.id });
    throw error;
  }
};

export const rechazarPago = async (pagoId, motivo) => {
  try {
    await updateDoc(doc(db, 'pagos', pagoId), { status: 'rechazado', motivo });
  } catch (error) {
    logError(error, { accion: 'rechazarPago', pagoId });
    throw error;
  }
};
