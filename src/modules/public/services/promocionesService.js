import { collection, getDocs, query, where, limit, orderBy, addDoc, increment, Timestamp, doc, updateDoc, deleteDoc, startAfter, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

const ESTADOS_PROMOCIONES_PUBLICAS = ['aprobada', 'aprobado', 'activa', 'publicada'];
const ESTADOS_EMPRESAS_PUBLICAS = ['aprobado', 'activa', 'publicada'];

const mergeEmpresas = (snapshots) => {
  const empresasMap = {};
  snapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      empresasMap[doc.id] = { id: doc.id, ...doc.data() };
    });
  });
  return Object.values(empresasMap)
    .sort((a, b) => (b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime()) - (a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime()))
    .slice(0, 100)
    .reduce((acc, empresa) => {
      acc[empresa.id] = empresa;
      return acc;
    }, {});
};

/**
 * Cargar todas las empresas públicas o activas
 * @returns {Promise<Object>} Mapa de empresas { empresaId: empresaData }
 */
export const cargarEmpresasAprobadas = async () => {
  try {
    const [activasSnap, publicasSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'empresa'),
        where('estado', 'in', ESTADOS_EMPRESAS_PUBLICAS),
        orderBy('createdAt', 'desc'),
        limit(100)
      )),
      getDocs(query(
        collection(db, 'empresa'),
        where('publico', '==', true),
        orderBy('createdAt', 'desc'),
        limit(100)
      )),
    ]);

    return mergeEmpresas([activasSnap, publicasSnap]);
  } catch (err) {
    logError(err, { accion: 'cargarEmpresasAprobadas', servicio: 'promocionesService' });
    return {};
  }
};

/**
 * Cargar promociones activas
 * @param {number} limitePromos - Máximo número de promociones
 * @returns {Promise<Array>} Array de promociones raw de Firestore
 */
export const cargarPromocionesActivas = async (limitePromos = 30) => {
  try {
    const q = query(
      collection(db, 'promociones'),
      where('activa', '==', true),
      where('estado', 'in', ESTADOS_PROMOCIONES_PUBLICAS),
      orderBy('createdAt', 'desc'),
      limit(limitePromos)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    logError(err, { accion: 'cargarPromocionesActivas', servicio: 'promocionesService' });
    return [];
  }
};

/**
 * Cargar los datos del home page (empresas aprobadas + promociones activas)
 * con el mismo enriquecimiento que hacía el componente HomePage.
 */
export const obtenerDatosHomePage = async () => {
  try {
    const [empresasSnapshot, promocionesSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, 'empresa'),
        where('estado', 'in', ESTADOS_EMPRESAS_PUBLICAS),
        orderBy('createdAt', 'desc'),
        limit(100)
      )),
      getDocs(query(
        collection(db, 'promociones'),
        where('estado', 'in', ESTADOS_PROMOCIONES_PUBLICAS),
        where('activa', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      )),
    ]);

    const empresasMap = {};
    empresasSnapshot.forEach((doc) => {
      empresasMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    const promociones = promocionesSnapshot.docs.map((doc) => {
      const data = { id: doc.id, ...doc.data() };
      const empresa = data.empresaId ? empresasMap[data.empresaId] : null;

      let rawLat = data.lat ?? empresa?.lat;
      let rawLng = data.lng ?? empresa?.lng;

      if (typeof rawLat === 'string') rawLat = parseFloat(rawLat.replace(',', '.'));
      if (typeof rawLng === 'string') rawLng = parseFloat(rawLng.replace(',', '.'));

      return {
        ...data,
        empresaNombre: data.empresaNombre || empresa?.nombre || empresa?.empresaNombre || 'Negocio',
        lat: isNaN(rawLat) ? undefined : rawLat,
        lng: isNaN(rawLng) ? undefined : rawLng,
        categoria: data.categoria || empresa?.categoria,
      };
    });

    return { empresasMap, promociones };
  } catch (err) {
    logError(err, { accion: 'obtenerDatosHomePage', servicio: 'promocionesService' });
    return { empresasMap: {}, promociones: [] };
  }
};

/**
 * Limpiar y validar coordenadas
 * @param {string|number} valor - Coordenada (puede ser string con coma decimal)
 * @returns {number|undefined} Coordenada validada o undefined
 */
const limpiarCoordenada = (valor) => {
  if (!valor) return undefined;
  
  let numero = typeof valor === 'string' 
    ? parseFloat(valor.replace(',', '.'))
    : valor;
  
  return isNaN(numero) ? undefined : numero;
};

/**
 * Enriquecer datos de una promoción con info de empresa
 * @param {Object} promo - Promoción raw de Firestore
 * @param {Object} empresasMap - Mapa de empresas { id: empresaData }
 * @returns {Object|null} Promoción enriquecida o null si no es válida
 */
export const enriquecerPromocion = (promo, empresasMap) => {
  const empresa = promo.empresaId ? empresasMap[promo.empresaId] : null;

  // Limpiar coordenadas
  let lat = promo.lat ?? empresa?.lat;
  let lng = promo.lng ?? empresa?.lng;
  
  lat = limpiarCoordenada(lat);
  lng = limpiarCoordenada(lng);

  const promoEnriquecida = {
    ...promo,
    empresaNombre: promo.empresaNombre || empresa?.nombre || empresa?.negocio || 'Negocio',
    lat,
    lng,
    categoria: promo.categoria || empresa?.categoria
  };

  // Validar disponibilidad
  const disponibilidad = verificarDisponibilidadTickets(promoEnriquecida);
  
  // Retornar null si no es disponible o no tiene coordenadas válidas
  if (!disponibilidad.disponible || lat === undefined || lng === undefined) {
    return null;
  }

  return promoEnriquecida;
};

/**
 * Cargar y enriquecer promociones disponibles
 * @param {number} limitePromos - Máximo número de promociones
 * @returns {Promise<Array>} Array de promociones enriquecidas y validadas
 */
export const cargarPromocionesDisponibles = async (limitePromos = 30) => {
  try {
    const empresasMap = await cargarEmpresasAprobadas();

    const promocionesRaw = await cargarPromocionesActivas(limitePromos);

    const promocionesEnriquecidas = promocionesRaw
      .map(promo => enriquecerPromocion(promo, empresasMap))
      .filter(promo => promo !== null);

    return promocionesEnriquecidas;
  } catch (err) {
    logError(err, { accion: 'cargarPromocionesDisponibles', servicio: 'promocionesService' });
    return [];
  }
};

export const obtenerPromocionesPublicas = async (pageSize = 12) => {
  try {
    const q = query(
      collection(db, 'promociones'),
      where('activa', '==', true),
      where('estado', 'in', ESTADOS_PROMOCIONES_PUBLICAS),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    const snapshot = await getDocs(q);
    return {
      promociones: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize,
    };
  } catch (err) {
    logError(err, { accion: 'obtenerPromocionesPublicas', servicio: 'promocionesService' });
    return { promociones: [], lastDoc: null, hasMore: false };
  }
};

export const obtenerPromocionesPublicasSiguientePagina = async (lastDoc, pageSize = 12) => {
  try {
    if (!lastDoc) return { promociones: [], lastDoc: null, hasMore: false };
    const q = query(
      collection(db, 'promociones'),
      where('activa', '==', true),
      where('estado', 'in', ESTADOS_PROMOCIONES_PUBLICAS),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
    const snapshot = await getDocs(q);
    return {
      promociones: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize,
    };
  } catch (err) {
    logError(err, { accion: 'obtenerPromocionesPublicasSiguientePagina', servicio: 'promocionesService' });
    return { promociones: [], lastDoc: null, hasMore: false };
  }
};

export const eliminarPromocionPublica = async (promocionId) => {
  try {
    await deleteDoc(doc(db, 'promociones', promocionId));
  } catch (err) {
    logError(err, { accion: 'eliminarPromocionPublica', promocionId, servicio: 'promocionesService' });
    throw err;
  }
};

export const obtenerEmpresasLimitadas = async (limitSize = 30) => {
  try {
    const [activasSnap, publicasSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'empresa'),
        where('estado', 'in', ESTADOS_EMPRESAS_PUBLICAS),
        orderBy('createdAt', 'desc'),
        limit(limitSize)
      )),
      getDocs(query(
        collection(db, 'empresa'),
        where('publico', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitSize)
      )),
    ]);

    const empresasMap = {};
    activasSnap.forEach((doc) => { empresasMap[doc.id] = { id: doc.id, ...doc.data() }; });
    publicasSnap.forEach((doc) => { empresasMap[doc.id] = { id: doc.id, ...doc.data() }; });

    return Object.values(empresasMap)
      .sort((a, b) => (b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime()) - (a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime()))
      .slice(0, limitSize);
  } catch (err) {
    logError(err, { accion: 'obtenerEmpresasLimitadas', servicio: 'promocionesService' });
    return [];
  }
};

export const obtenerPromocionesActivasLimitadas = async (limitSize = 30) => {
  try {
    const q = query(
      collection(db, 'promociones'),
      where('activa', '==', true),
      where('estado', 'in', ESTADOS_PROMOCIONES_PUBLICAS),
      orderBy('createdAt', 'desc'),
      limit(limitSize)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    logError(err, { accion: 'obtenerPromocionesActivasLimitadas', servicio: 'promocionesService' });
    return [];
  }
};

export const obtenerEmpresaPorId = async (empresaId) => {
  try {
    if (!empresaId) return null;
    const snap = await getDoc(doc(db, 'empresa', empresaId));
    const empresaData = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    if (empresaData && !empresaData.publico && !ESTADOS_EMPRESAS_PUBLICAS.includes(empresaData.estado)) {
      return null;
    }
    return empresaData;
  } catch (err) {
    logError(err, { accion: 'obtenerEmpresaPorId', empresaId, servicio: 'promocionesService' });
    throw err;
  }
};

export const obtenerPromocionesPorEmpresa = async (empresaId) => {
  try {
    if (!empresaId) return [];
    const q = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId),
      where('activa', '==', true),
      where('estado', 'in', ESTADOS_PROMOCIONES_PUBLICAS)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    logError(err, { accion: 'obtenerPromocionesPorEmpresa', empresaId, servicio: 'promocionesService' });
    return [];
  }
};

// ── Verificar disponibilidad de tickets (usada en PromoCard) ─────────────────

export const verificarDisponibilidadTickets = (promocion) => {
  const ahora = new Date();
  const campo = promocion.fechaHoraExpiracion || promocion.fechaFin;

  if (campo) {
    const exp = campo.toDate?.() || new Date(campo);
    if (ahora > exp) return { disponible: false, razon: 'Generación de tickets expirada', ticketsRestantes: null };
  }

  if (promocion.ticketsMaximos) {
    const restantes = Math.max(0, promocion.ticketsMaximos - (promocion.ticketsGenerados || 0));
    if (restantes === 0) return { disponible: false, razon: `Límite de ${promocion.ticketsMaximos} tickets alcanzado`, ticketsRestantes: 0 };
    return { disponible: true, razon: '', ticketsRestantes: restantes };
  }

  return { disponible: true, razon: '', ticketsRestantes: null };
};

export const obtenerMensajeDisponibilidad = (disponibilidad) =>
  disponibilidad.disponible
    ? disponibilidad.ticketsRestantes !== null
      ? `${disponibilidad.ticketsRestantes} tickets disponibles`
      : 'Tickets disponibles'
    : disponibilidad.razon;

// ── Calcular y formatear tiempo restante (temporizadores en UI) ───────────────

export const calcularTiempoRestante = (fechaHoraExpiracion) => {
  if (!fechaHoraExpiracion) return null;
  const ahora      = new Date();
  const expiracion = fechaHoraExpiracion.toDate?.() || new Date(fechaHoraExpiracion);
  const diff       = expiracion - ahora;

  if (diff <= 0) return { expirado: true, dias: 0, horas: 0, minutos: 0, segundos: 0 };

  return {
    expirado:          false,
    dias:              Math.floor(diff / 86400000),
    horas:             Math.floor((diff % 86400000) / 3600000),
    minutos:           Math.floor((diff % 3600000) / 60000),
    segundos:          Math.floor((diff % 60000) / 1000),
    tiempoTotal:       diff,
    porcentajeRestante: Math.max(0, Math.min(100, (diff / (7 * 86400000)) * 100)),
  };
};

export const formatearTiempoRestante = (t) => {
  if (!t || t.expirado)  return 'Expirado';
  if (t.dias > 0)        return `${t.dias}d ${t.horas}h`;
  if (t.horas > 0)       return `${t.horas}h ${t.minutos}m`;
  if (t.minutos > 0)     return `${t.minutos}m ${t.segundos}s`;
  return `${t.segundos}s`;
};

const registrarVisualizacionCallable = httpsCallable(functions, 'registrarVisualizacionCallable');

// ── Registrar visualización de una promoción ──────────────────────────────────
export const registrarVisualizacion = async (promocionId, empresaId, usuarioId = null) => {
  try {
    if (!promocionId || typeof promocionId !== 'string') throw new Error('Promoción ID inválido');
    if (!empresaId   || typeof empresaId   !== 'string') throw new Error('Empresa ID inválido');

    await registrarVisualizacionCallable({ promocionId, empresaId, usuarioId });
  } catch (error) {
    logError(error, { accion: 'registrarVisualizacion' });
    // no relanzar — es acción secundaria
  }
};

// ── Obtener promociones trending ──────────────────────────────────────────────

export const obtenerPromocionesTrending = async (limite = 5) => {
  try {
    if (typeof limite !== 'number' || limite < 1 || limite > 100) limite = 5;

    const snap = await getDocs(query(
      collection(db, 'promociones'),
      where('activa', '==', true),
      where('estado', 'in', ESTADOS_PROMOCIONES_PUBLICAS)
    ));

    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => verificarDisponibilidadTickets(p).disponible)
      .sort((a, b) => (b.visualizaciones || 0) - (a.visualizaciones || 0))
      .slice(0, limite);
  } catch (error) {
    logError(error, { accion: 'obtenerPromocionesTrending' });
    throw error;
  }
};