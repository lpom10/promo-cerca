import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../utils/errorHandler';

/**
 * Obtiene todos los favoritos de un usuario
 */
export const obtenerFavoritos = async (usuarioId) => {
  try {
    if (!usuarioId) return [];
    const q = query(collection(db, 'favoritos'), where('usuarioId', '==', usuarioId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logError(error, { accion: 'obtenerFavoritos', usuarioId });
    return [];
  }
};

/**
 * Verifica si una promoción es favorita
 */
export const esPromocionFavorita = async (usuarioId, promocionId) => {
  try {
    if (!usuarioId || !promocionId) return false;
    const q = query(
      collection(db, 'favoritos'),
      where('usuarioId', '==', usuarioId),
      where('tipo', '==', 'promocion'),
      where('promocionId', '==', promocionId)
    );
    const snap = await getDocs(q);
    return snap.docs.length > 0;
  } catch (error) {
    logError(error, { accion: 'esPromocionFavorita', usuarioId, promocionId });
    return false;
  }
};

/**
 * Verifica si una empresa es favorita
 */
export const esEmpresaFavorita = async (usuarioId, empresaId) => {
  try {
    if (!usuarioId || !empresaId) return false;
    const q = query(
      collection(db, 'favoritos'),
      where('usuarioId', '==', usuarioId),
      where('tipo', '==', 'empresa'),
      where('empresaId', '==', empresaId)
    );
    const snap = await getDocs(q);
    return snap.docs.length > 0;
  } catch (error) {
    logError(error, { accion: 'esEmpresaFavorita', usuarioId, empresaId });
    return false;
  }
};

/**
 * Agrega una promoción a favoritos
 */
export const agregarPromocionFavorita = async (usuarioId, promocionId, promocionData = {}) => {
  try {
    if (!usuarioId || !promocionId) throw new Error('usuarioId y promocionId son requeridos');
    
    const favorito = {
      usuarioId,
      tipo: 'promocion',
      promocionId,
      titulo: promocionData.titulo || '',
      empresaNombre: promocionData.empresaNombre || '',
      empresaId: promocionData.empresaId || '',
      descuento: promocionData.descuento || 0,
      imagen: promocionData.imagen || '',
      fechaAgregado: new Date(),
      fechaFin: promocionData.fechaFin || null,
    };

    const docRef = await addDoc(collection(db, 'favoritos'), favorito);
    return { id: docRef.id, ...favorito };
  } catch (error) {
    logError(error, { accion: 'agregarPromocionFavorita', usuarioId, promocionId });
    throw error;
  }
};

/**
 * Agrega una empresa a favoritos
 */
export const agregarEmpresaFavorita = async (usuarioId, empresaId, empresaData = {}) => {
  try {
    if (!usuarioId || !empresaId) throw new Error('usuarioId y empresaId son requeridos');
    
    const favorito = {
      usuarioId,
      tipo: 'empresa',
      empresaId,
      nombre: empresaData.nombre || empresaData.empresaNombre || '',
      descripcion: empresaData.descripcion || '',
      categoria: empresaData.categoria || '',
      imagen: empresaData.imagen || '',
      fechaAgregado: new Date(),
    };

    const docRef = await addDoc(collection(db, 'favoritos'), favorito);
    return { id: docRef.id, ...favorito };
  } catch (error) {
    logError(error, { accion: 'agregarEmpresaFavorita', usuarioId, empresaId });
    throw error;
  }
};

/**
 * Elimina una promoción de favoritos
 */
export const eliminarPromocionFavorita = async (usuarioId, promocionId) => {
  try {
    if (!usuarioId || !promocionId) throw new Error('usuarioId y promocionId son requeridos');
    
    const q = query(
      collection(db, 'favoritos'),
      where('usuarioId', '==', usuarioId),
      where('tipo', '==', 'promocion'),
      where('promocionId', '==', promocionId)
    );
    const snap = await getDocs(q);
    
    for (const docSnap of snap.docs) {
      await deleteDoc(doc(db, 'favoritos', docSnap.id));
    }
  } catch (error) {
    logError(error, { accion: 'eliminarPromocionFavorita', usuarioId, promocionId });
    throw error;
  }
};

/**
 * Elimina una empresa de favoritos
 */
export const eliminarEmpresaFavorita = async (usuarioId, empresaId) => {
  try {
    if (!usuarioId || !empresaId) throw new Error('usuarioId y empresaId son requeridos');
    
    const q = query(
      collection(db, 'favoritos'),
      where('usuarioId', '==', usuarioId),
      where('tipo', '==', 'empresa'),
      where('empresaId', '==', empresaId)
    );
    const snap = await getDocs(q);
    
    for (const docSnap of snap.docs) {
      await deleteDoc(doc(db, 'favoritos', docSnap.id));
    }
  } catch (error) {
    logError(error, { accion: 'eliminarEmpresaFavorita', usuarioId, empresaId });
    throw error;
  }
};

/**
 * Toggle favorito (agrega o elimina)
 */
export const togglePromocionFavorita = async (usuarioId, promocionId, promocionData = {}) => {
  try {
    const esFavorita = await esPromocionFavorita(usuarioId, promocionId);
    
    if (esFavorita) {
      await eliminarPromocionFavorita(usuarioId, promocionId);
      return { esFavorita: false, mensaje: 'Eliminado de favoritos' };
    } else {
      await agregarPromocionFavorita(usuarioId, promocionId, promocionData);
      return { esFavorita: true, mensaje: 'Agregado a favoritos' };
    }
  } catch (error) {
    logError(error, { accion: 'togglePromocionFavorita', usuarioId, promocionId });
    throw error;
  }
};

/**
 * Toggle empresa favorita
 */
export const toggleEmpresaFavorita = async (usuarioId, empresaId, empresaData = {}) => {
  try {
    const esFavorita = await esEmpresaFavorita(usuarioId, empresaId);
    
    if (esFavorita) {
      await eliminarEmpresaFavorita(usuarioId, empresaId);
      return { esFavorita: false, mensaje: 'Eliminado de favoritos' };
    } else {
      await agregarEmpresaFavorita(usuarioId, empresaId, empresaData);
      return { esFavorita: true, mensaje: 'Agregado a favoritos' };
    }
  } catch (error) {
    logError(error, { accion: 'toggleEmpresaFavorita', usuarioId, empresaId });
    throw error;
  }
};
