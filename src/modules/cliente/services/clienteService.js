import {
  collection, query, where, getDocs, doc, updateDoc, getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { updateProfile } from 'firebase/auth';
import { logError } from '../../../shared/utils/errorHandler';

const toDate = (ts) => {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

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
    const [ticketSnap, favSnap] = await Promise.all([
      getDocs(query(collection(db, 'tickets'), where('usuarioId', '==', userId))),
      getDocs(query(collection(db, 'favoritos'), where('usuarioId', '==', userId))),
    ]);

    const myTickets   = ticketSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const myFavoritos = favSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. IDs únicos a enriquecer
    // Aprovechamos campos desnormalizados (promocionTitulo, empresaNombre, etc.)
    // para evitar lecturas adicionales. Solo haremos lecturas si faltan datos.
    const promoMap = {};
    const empMap = {};

    myTickets.forEach(t => {
      if (t.promocionId && !promoMap[t.promocionId]) {
        promoMap[t.promocionId] = {
          id: t.promocionId,
          titulo: t.promocionTitulo || null,
          descuento: t.descuento ?? null,
          precioOriginal: t.precioOriginal ?? null,
          precioDescuento: t.precioDescuento ?? null,
          empresaId: t.empresaId || null,
          empresaNombre: t.empresaNombre || null,
        };
      }
    });

    myFavoritos.forEach(f => {
      if (f.tipo === 'promocion' && f.promocionId && !promoMap[f.promocionId]) {
        promoMap[f.promocionId] = {
          id: f.promocionId,
          titulo: f.titulo || null,
          descuento: f.descuento ?? null,
          empresaId: f.empresaId || null,
          empresaNombre: f.empresaNombre || null,
        };
      }
      if (f.tipo === 'empresa' && f.empresaId && !empMap[f.empresaId]) {
        empMap[f.empresaId] = { id: f.empresaId, nombre: f.nombre || f.empresaNombre || null };
      }
    });

    // Si aún faltan datos críticos (ej: empresaNombre o titulo), podemos evitar
    // múltiples lecturas agrupando solo los IDs faltantes. Este paso mantiene
    // compatibilidad con DB antiguas pero minimiza lecturas.
    const missingPromoIds = Object.values(promoMap).filter(p => !p.titulo && p.id).map(p => p.id);
    const missingEmpresaIds = Object.values(empMap).filter(e => !e.nombre && e.id).map(e => e.id);

    if (missingPromoIds.length || missingEmpresaIds.length) {
      // Hacemos lecturas agrupadas por chunk para rellenar solo lo necesario
      const fillMap = await fetchByIds('promociones', missingPromoIds);
      Object.keys(fillMap).forEach(k => { promoMap[k] = { id: k, ...fillMap[k] }; });

      const fillEmp = await fetchByIds('empresa', missingEmpresaIds);
      Object.keys(fillEmp).forEach(k => { empMap[k] = { id: k, ...fillEmp[k] }; });
    }

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

export const obtenerPerfilCliente = async (userId) => {
  try {
    const perfilSnap = await getDoc(doc(db, 'usuarios', userId));
    return perfilSnap.exists() ? { id: perfilSnap.id, ...perfilSnap.data() } : null;
  } catch (error) {
    logError(error, { accion: 'obtenerPerfilCliente', userId });
    throw error;
  }
};

export const actualizarPerfilClienteAuth = async (perfil) => {
  try {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Usuario no autenticado');
    await updateProfile(usuario, perfil);
    return { exito: true };
  } catch (error) {
    logError(error, { accion: 'actualizarPerfilClienteAuth' });
    throw error;
  }
};
