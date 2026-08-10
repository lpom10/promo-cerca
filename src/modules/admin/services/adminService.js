import {
  collection, query, where, orderBy,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  limit, startAfter, getCountFromServer,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';
import { crearCachePorClaveConcurrent } from '../../../shared/utils/concurrentCache';

// ─────────────────────────────────────────────
// CONSULTAS
// ─────────────────────────────────────────────

const PAGE_SIZE = 20;

const construirQueryPaginada = (coleccion, restricciones = [], pageSize = PAGE_SIZE, lastDoc = null) => {
  const constraints = [...restricciones];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));
  return query(collection(db, coleccion), ...constraints);
};

const ordenarPorFechaDesc = (items) => {
  const obtenerValor = (value) => value?.toMillis?.() ?? value?.seconds ?? 0;
  return items.slice().sort((a, b) => obtenerValor(b.createdAt) - obtenerValor(a.createdAt));
};

export const obtenerSolicitudesPendientes = async (pageSize = PAGE_SIZE, lastDoc = null) => {
  const snap = await getDocs(query(collection(db, 'empresa'), where('estado', '==', 'pendiente'), limit(pageSize)));
  return ordenarPorFechaDesc(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};

export const obtenerEmpresasAprobadas = async (pageSize = PAGE_SIZE, lastDoc = null) => {
  const snap = await getDocs(query(collection(db, 'empresa'), where('estado', '==', 'aprobado'), limit(pageSize)));
  return ordenarPorFechaDesc(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};

export const obtenerPromosEnRevision = async (pageSize = PAGE_SIZE, lastDoc = null) => {
  const snap = await getDocs(construirQueryPaginada('promociones', [where('estado', '==', 'pendiente'), orderBy('createdAt', 'desc')], pageSize, lastDoc));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerTodasPromociones = async (pageSize = PAGE_SIZE, lastDoc = null) => {
  const snap = await getDocs(construirQueryPaginada('promociones', [orderBy('createdAt', 'desc')], pageSize, lastDoc));
  return {
    items: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize,
  };
};

export const obtenerEstadisticasGlobales = async () => {
  try {
    const [ticketsCount, empresasCount, promosCount] = await Promise.all([
      getCountFromServer(query(collection(db, 'tickets'))),
      getCountFromServer(query(collection(db, 'empresa'))),
      getCountFromServer(query(collection(db, 'promociones'))),
    ]);
    return {
      totalTickets: ticketsCount.data().count,
      totalEmpresas: empresasCount.data().count,
      totalPromos: promosCount.data().count,
    };
  } catch (error) {
    logError(error, { accion: 'obtenerEstadisticasGlobales' });
    return {
      totalTickets: 0,
      totalEmpresas: 0,
      totalPromos: 0,
    };
  }
};

/** Enriquece una lista de pagos con el nombre de la empresa correspondiente */
export const enriquecerPagosConNombre = async (pagosData) => {
  const obtenerNombreEmpresa = crearCachePorClaveConcurrent(async (empresaId) => {
    if (!empresaId) {
      return 'Empresa desconocida';
    }

    const empresaDoc = await getDoc(doc(db, 'empresa', empresaId));
    return empresaDoc.exists() ? empresaDoc.data().negocio : 'Empresa desconocida';
  });

  return Promise.all(pagosData.map(async (pago) => {
    try {
      const empresaId = pago?.empresaId;
      if (!empresaId) {
        return { ...pago, empresaNombre: 'Empresa desconocida' };
      }

      const empresaNombre = await obtenerNombreEmpresa(empresaId);
      return { ...pago, empresaNombre };
    } catch {
      return { ...pago, empresaNombre: 'Error al cargar nombre' };
    }
  }));
};

export const suscribirseAPagosPendientes = (onCambio) => {
  const pagosQuery = query(collection(db, 'pagos'), where('status', '==', 'espera'), orderBy('createdAt', 'desc'), limit(50));
  let unsubscribeFallback = null;
  const unsubscribe = onSnapshot(pagosQuery, async (snap) => {
    const pagos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const enriquecidos = await enriquecerPagosConNombre(pagos);
    onCambio(enriquecidos);
  }, (error) => {
    if (import.meta.env.DEV && error?.code === 'failed-precondition' && !unsubscribeFallback) {
      const fallbackQuery = query(collection(db, 'pagos'), where('status', '==', 'espera'), limit(50));
      unsubscribeFallback = onSnapshot(fallbackQuery, async (snap) => {
        const pagos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const enriquecidos = await enriquecerPagosConNombre(pagos);
        onCambio(enriquecidos);
      }, (fallbackError) => {
        logError(fallbackError, { accion: 'suscribirseAPagosPendientes_fallback' });
      });
      return;
    }
    logError(error, { accion: 'suscribirseAPagosPendientes' });
  });

  return () => {
    unsubscribe();
    if (unsubscribeFallback) unsubscribeFallback();
  };
};

export const suscribirseAEmpresasPendientes = (onCambio) => {
  const pendientesQuery = query(collection(db, 'empresa'), where('estado', '==', 'pendiente'), orderBy('createdAt', 'desc'), limit(50));
  let unsubscribeFallback = null;
  const unsubscribe = onSnapshot(pendientesQuery, (snap) => {
    const empresas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onCambio(empresas);
  }, (error) => {
    if (import.meta.env.DEV && error?.code === 'failed-precondition' && !unsubscribeFallback) {
      const fallbackQuery = query(collection(db, 'empresa'), where('estado', '==', 'pendiente'), limit(50));
      unsubscribeFallback = onSnapshot(fallbackQuery, (fallbackSnap) => {
        const empresas = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        onCambio(empresas);
      }, (fallbackError) => {
        logError(fallbackError, { accion: 'suscribirseAEmpresasPendientes_fallback' });
      });
      return;
    }
    logError(error, { accion: 'suscribirseAEmpresasPendientes' });
  });

  return () => {
    unsubscribe();
    if (unsubscribeFallback) unsubscribeFallback();
  };
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

const aprobarPagoCallable = httpsCallable(functions, 'aprobarPagoCallable');
const rechazarPagoCallable = httpsCallable(functions, 'rechazarPagoCallable');

export const aprobarPago = async (pago) => {
  try {
    const result = await aprobarPagoCallable({ pago });
    return result.data;
  } catch (error) {
    logError(error, { accion: 'aprobarPago', pagoId: pago?.id });
    throw error;
  }
};

export const rechazarPago = async (pagoId, motivo) => {
  try {
    const result = await rechazarPagoCallable({ pagoId, motivo });
    return result.data;
  } catch (error) {
    logError(error, { accion: 'rechazarPago', pagoId });
    throw error;
  }
};
