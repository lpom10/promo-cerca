// src/modules/empresa/services/empresaService.js
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy, Timestamp, limit, startAfter, getCountFromServer } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, functions } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

// ── GET: Obtener perfil de empresa ──
export const obtenerPerfilEmpresa = async (empresaId) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    const docSnap = await getDoc(doc(db, 'empresa', empresaId));
    if (!docSnap.exists()) throw new Error('Empresa no encontrada');
    return { id: docSnap.id, ...docSnap.data() };
  } catch (err) {
    logError(err, { accion: 'obtenerPerfilEmpresa' });
    throw err;
  }
};

// ── UPDATE: Actualizar perfil de empresa ──
export const actualizarPerfilEmpresa = async (empresaId, datos) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    if (!datos || typeof datos !== 'object') throw new Error('Datos inválidos');
    
    await updateDoc(doc(db, 'empresa', empresaId), {
      ...datos,
      actualizadoEn: Timestamp.now(),
    });
    return { exito: true };
  } catch (err) {
    logError(err, { accion: 'actualizarPerfilEmpresa' });
    throw err;
  }
};

// ── GET: Obtener suscripción ──
export const obtenerSuscripcionEmpresa = async (empresaId) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    const q = query(
      collection(db, 'suscripciones'),
      where('empresaId', '==', empresaId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (err) {
    logError(err, { accion: 'obtenerSuscripcionEmpresa' });
    throw err;
  }
};

export const obtenerHistorialSuscripcionesEmpresa = async (empresaId, pageSize = 20, lastDoc = null) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    const constraints = [
      where('empresaId', '==', empresaId),
      orderBy('createdAt', 'desc'),
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    constraints.push(limit(pageSize));
    const q = query(collection(db, 'suscripciones'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    logError(err, { accion: 'obtenerHistorialSuscripcionesEmpresa' });
    throw err;
  }
};

export const suscribirseSuscripcionesEmpresa = (empresaId, callback) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    if (typeof callback !== 'function') throw new Error('Callback inválido');

    const q = query(
      collection(db, 'suscripciones'),
      where('empresaId', '==', empresaId),
      orderBy('createdAt', 'desc')
    );

    return import('firebase/firestore').then(({ onSnapshot }) => onSnapshot(q, (snapshot) => {
      const suscripciones = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      callback(suscripciones);
    }, (error) => {
      logError(error, { accion: 'suscribirseSuscripcionesEmpresa' });
      callback([]);
    }));
  } catch (err) {
    logError(err, { accion: 'suscribirseSuscripcionesEmpresa' });
    throw err;
  }
};

const sanitizarNombreArchivo = (nombre) => nombre.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);

const subirArchivoAStorage = async (file, destino) => {
  if (!file) throw new Error('Archivo inválido');
  const storageRef = ref(storage, destino);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const subirImagenPromocion = async (file, empresaId) => {
  if (!file) return '';
  if (!empresaId) throw new Error('Empresa ID es requerido');
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen');
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const nombreArchivo = `promociones/${empresaId}/${Date.now()}_${sanitizarNombreArchivo(file.name)}.${extension}`;
  return subirArchivoAStorage(file, nombreArchivo);
};

export const subirComprobantePago = async (file, empresaId) => {
  if (!file) return '';
  if (!empresaId) throw new Error('Empresa ID es requerido');
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen');
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const nombreArchivo = `comprobantes/${empresaId}/${Date.now()}_${sanitizarNombreArchivo(file.name)}.${extension}`;
  return subirArchivoAStorage(file, nombreArchivo);
};

export const obtenerInfoAdminPago = async () => {
  try {
    const infoDoc = await getDoc(doc(db, 'admin', 'info'));
    return infoDoc.exists() ? { id: infoDoc.id, ...infoDoc.data() } : null;
  } catch (err) {
    logError(err, { accion: 'obtenerInfoAdminPago' });
    throw err;
  }
};

const crearSuscripcionPendienteCallable = httpsCallable(functions, 'crearSuscripcionPendienteCallable');

export const crearSuscripcionPendiente = async (empresaId, plan, paymentId = null, receiptUrl = null) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    if (!plan || !plan.id) throw new Error('Plan inválido');

    const response = await crearSuscripcionPendienteCallable({
      empresaId,
      planId: plan.id,
      paymentId,
      receiptUrl,
    });

    return response.data;
  } catch (err) {
    logError(err, { accion: 'crearSuscripcionPendiente' });
    throw err;
  }
};

// ── GET: Obtener métricas financieras reales ──
export const obtenerFinanzasEmpresa = async (empresaId) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');

    const promosQuery = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId)
    );
    const promosSnap = await getDocs(promosQuery);
    const promociones = promosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const totalPromociones = promociones.length;

    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('empresaId', '==', empresaId),
      orderBy('fechaGeneracion', 'desc')
    );
    const ticketsSnap = await getDocs(ticketsQuery);
    const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const ticketsCountSnap = await getCountFromServer(query(
      collection(db, 'tickets'),
      where('empresaId', '==', empresaId)
    ));
    const ticketsGeneradosTotales = ticketsCountSnap.data().count;

    const ticketsPorPromocion = tickets.reduce((acc, ticket) => {
      const key = ticket.promocionId || 'sin-promocion';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    let valorOriginalEstimado = 0;
    let valorPromocionalEstimado = 0;
    let promocionesActivas = 0;
    let promedioDescuento = 0;

    promociones.forEach((promo) => {
      const fin = promo.fechaFin?.toDate?.() || new Date(promo.fechaFin);
      if (fin >= new Date()) promocionesActivas += 1;

      const descuento = Number(promo.descuento || 0);
      const precioOriginal = Number(promo.precioOriginal || 0);
      const cantidadTickets = ticketsPorPromocion[promo.id] || promo.ticketsGenerados || 0;
      const precioFinal = Number(
        promo.precioDescuento ?? (precioOriginal * (1 - descuento / 100))
      );

      valorOriginalEstimado += precioOriginal * cantidadTickets;
      valorPromocionalEstimado += precioFinal * cantidadTickets;
      promedioDescuento += descuento;
    });

    const ticketsCanjeados = tickets.filter(t => t.estado === 'canjeado').length;
    const ticketsPendientes = tickets.filter(t => t.estado === 'generado').length;

    return {
      promocionesActivas,
      promocionesTotales: totalPromociones,
      ticketsGenerados: ticketsGeneradosTotales,
      ticketsCanjeados,
      ticketsPendientes,
      valorOriginalEstimado: Number(valorOriginalEstimado.toFixed(2)),
      valorPromocionalEstimado: Number(valorPromocionalEstimado.toFixed(2)),
      ahorroEstimado: Number((valorOriginalEstimado - valorPromocionalEstimado).toFixed(2)),
      tasaCanjeamiento: ticketsGeneradosTotales ? Number(((ticketsCanjeados / ticketsGeneradosTotales) * 100).toFixed(1)) : 0,
      promedioDescuento: totalPromociones ? Number((promedioDescuento / totalPromociones).toFixed(1)) : 0,
    };
  } catch (err) {
    logError(err, { accion: 'obtenerFinanzasEmpresa' });
    throw err;
  }
};

// ── GET: Obtener estadísticas generales ──
export const obtenerEstadisticasEmpresa = async (empresaId) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    
    // 1. Obtener promociones activas
    const promosQuery = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId)
    );
    const promosSnap = await getDocs(promosQuery);
    const promociones = promosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // 2. Contar promociones activas
    const promosActivas = promociones.filter(p => {
      const fin = p.fechaFin?.toDate?.() || new Date(p.fechaFin);
      return fin >= new Date();
    }).length;

    // 3. Contar vistas totales sin truncar el resultado
    const vistasCountSnap = await getCountFromServer(query(
      collection(db, 'vistas'),
      where('empresaId', '==', empresaId)
    ));
    const vistasTotal = vistasCountSnap.data().count;

    return {
      promosTotal: promociones.length,
      promosActivas,
      vistasTotal,
      ultimaActualizacion: new Date().toISOString(),
    };
  } catch (err) {
    logError(err, { accion: 'obtenerEstadisticasEmpresa' });
    throw err;
  }
};