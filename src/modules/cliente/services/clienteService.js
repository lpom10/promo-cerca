import {
  collection, query, where, getDocs, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const toDate = (ts) => {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

/** Carga en lotes de 30 (límite Firestore 'in') */
const fetchByIds = async (coleccion, ids) => {
  const map = {};
  if (!ids.length) return map;
  for (let i = 0; i < ids.length; i += 30) {
    const chunk = ids.slice(i, i + 30);
    const snap = await getDocs(
      query(collection(db, coleccion), where('__name__', 'in', chunk))
    );
    snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
  }
  return map;
};

// ─────────────────────────────────────────────
// CARGA DE DATOS
// ─────────────────────────────────────────────

/**
 * Carga todos los datos del dashboard cliente en un solo disparo.
 * @param {string} userId
 * @returns {{ tickets, favoritos, empresasData, promosData, stats, topEmpresa }}
 */
export const cargarDatosCliente = async (userId) => {
  try {
    // 1. Tickets y favoritos en paralelo
    const [ticketSnap, favSnap] = await Promise.all([
      getDocs(query(collection(db, 'tickets'), where('usuarioId', '==', userId))),
      getDocs(query(collection(db, 'favoritos'), where('usuarioId', '==', userId))),
    ]);

    const myTickets   = ticketSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const myFavoritos = favSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. IDs únicos a enriquecer
    const promoIds = [...new Set(myTickets.map(t => t.promocionId).filter(Boolean))];
    const favPromoIds = [...new Set(
      myFavoritos.filter(f => f.tipo === 'promocion' && f.promocionId).map(f => f.promocionId)
    )];
    const allPromoIds = [...new Set([...promoIds, ...favPromoIds])];

    const promoMap = await fetchByIds('promociones', allPromoIds);

    const empresaIds = [...new Set([
      ...Object.values(promoMap).map(p => p.empresaId).filter(Boolean),
      ...myFavoritos.filter(f => f.tipo === 'empresa' && f.empresaId).map(f => f.empresaId),
    ])];

    const empMap = await fetchByIds('empresa', empresaIds);

    // 3. Stats
    const activos      = myTickets.filter(t => t.estado === 'generado').length;
    const canjeados    = myTickets.filter(t => t.estado === 'canjeado').length;
    const empresasUnicas = new Set(
      myTickets.map(t => promoMap[t.promocionId]?.empresaId).filter(Boolean)
    ).size;
    const ahorroEstimado = myTickets
      .filter(t => t.estado === 'canjeado')
      .reduce((sum, t) => sum + (Number(promoMap[t.promocionId]?.descuento) || 0) / 100 * 25, 0);

    // 4. Top empresa (más canjeados)
    const empCount = {};
    myTickets.filter(t => t.estado === 'canjeado').forEach(t => {
      const eId = promoMap[t.promocionId]?.empresaId;
      if (eId) empCount[eId] = (empCount[eId] || 0) + 1;
    });
    const topEmpId = Object.entries(empCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topEmpresa = topEmpId ? { ...empMap[topEmpId], _count: empCount[topEmpId] } : null;

    // 5. Enriquecer tickets y favoritos
    const enrichedTickets = myTickets
      .sort((a, b) => (toDate(b.fechaGeneracion)?.getTime() || 0) - (toDate(a.fechaGeneracion)?.getTime() || 0))
      .map(t => ({
        ...t,
        _promo:   promoMap[t.promocionId],
        _empresa: empMap[promoMap[t.promocionId]?.empresaId],
      }));

    const enrichedFavs = myFavoritos.map(f => ({
      ...f,
      _promo:   f.tipo === 'promocion' ? promoMap[f.promocionId] : null,
      _empresa: f.tipo === 'empresa'
        ? empMap[f.empresaId]
        : empMap[promoMap[f.promocionId]?.empresaId] ?? null,
    }));

    return {
      tickets:      enrichedTickets,
      favoritos:    enrichedFavs,
      empresasData: empMap,
      promosData:   promoMap,
      topEmpresa,
      stats: {
        ticketsActivos:   activos,
        ticketsCanjeados: canjeados,
        ahorroEstimado,
        empresasUnicas,
        favoritosCount:   myFavoritos.length,
      },
    };
  } catch (error) {
    logError(error, { accion: 'cargarDatosCliente', userId });
    throw error;
  }
};

// ─────────────────────────────────────────────
// PERFIL
// ─────────────────────────────────────────────

/**
 * Actualiza nombre y teléfono del cliente en Firestore.
 * @param {string} userId
 * @param {{ nombre: string, telefono: string }} datos
 */
export const actualizarPerfilCliente = async (userId, { nombre, telefono }) => {
  try {
    await updateDoc(doc(db, 'usuarios', userId), { nombre, telefono });
  } catch (error) {
    logError(error, { accion: 'actualizarPerfilCliente', userId });
    throw error;
  }
};
