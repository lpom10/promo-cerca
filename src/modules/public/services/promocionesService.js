import { collection, getDocs, query, where, limit, orderBy, addDoc, increment, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

/**
 * Cargar todas las empresas aprobadas
 * @returns {Promise<Object>} Mapa de empresas { empresaId: empresaData }
 */
export const cargarEmpresasAprobadas = async () => {
  try {
    const q = query(
      collection(db, 'empresa'),
      where('estado', '==', 'aprobado'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    
    const empresasMap = {};
    snapshot.forEach(doc => {
      empresasMap[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    return empresasMap;
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

// ── Registrar visualización de una promoción ──────────────────────────────────

export const registrarVisualizacion = async (promocionId, empresaId, usuarioId = null) => {
  try {
    if (!promocionId || typeof promocionId !== 'string') throw new Error('Promoción ID inválido');
    if (!empresaId   || typeof empresaId   !== 'string') throw new Error('Empresa ID inválido');

    await addDoc(collection(db, 'vistas'), {
      promocionId, empresaId, usuarioId,
      timestamp: Timestamp.now(),
    });
    await updateDoc(doc(db, 'promociones', promocionId), { visualizaciones: increment(1) });
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
      where('activa', '==', true)
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