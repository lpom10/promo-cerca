// src/modules/empresa/services/promocionesService.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';

const sanitizarNombreArchivo = (nombre) => nombre.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);

const removeUndefinedValues = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));

const buildPromocionPayload = (data = {}) => removeUndefinedValues({
  titulo: data.titulo,
  descripcion: data.descripcion,
  descuento: typeof data.descuento === 'number' ? data.descuento : data.descuento ? Number(data.descuento) : null,
  precioOriginal: typeof data.precioOriginal === 'number' ? data.precioOriginal : data.precioOriginal ? Number(data.precioOriginal) : null,
  precioDescuento: typeof data.precioDescuento === 'number' ? data.precioDescuento : data.precioDescuento ? Number(data.precioDescuento) : null,
  fechaInicio: data.fechaInicio || null,
  fechaFin: data.fechaFin || null,
  categoria: data.categoria || '',
  imagen: data.imagen || data.imagenUrl || '',
  imagenUrl: data.imagen || data.imagenUrl || '',
  ticketsMaximos: data.ticketsMaximos != null ? Number(data.ticketsMaximos) : null,
  fechaHoraExpiracion: data.fechaHoraExpiracion || null,
});

export const subirImagenPromocion = async (file, empresaId) => {
  try {
    if (!file) return '';
    if (!empresaId) throw new Error('Empresa ID es requerido');
    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen');
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const nombreArchivo = `promociones/${empresaId}/${Date.now()}_${sanitizarNombreArchivo(file.name)}.${extension}`;
    const storageRef = ref(storage, nombreArchivo);

    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (err) {
    logError(err, { accion: 'subirImagenPromocion', empresaId });
    throw err;
  }
};

// ── GET: Listar promociones de una empresa ──
export const obtenerPromocionesPorEmpresa = async (empresaId) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    const q = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    logError(err, { accion: 'obtenerPromocionesPorEmpresa' });
    throw err;
  }
};

// ── CREATE: Crear nueva promoción ──
export const crearPromocion = async (empresaId, datosPromocion) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');
    if (!datosPromocion?.titulo) throw new Error('Título de promoción es requerido');

    const datosSeguros = buildPromocionPayload(datosPromocion);
    const estadoInicial = 'pendiente';
    const docRef = await addDoc(collection(db, 'promociones'), {
      ...datosSeguros,
      empresaId,
      activa: false,
      estado: estadoInicial,
      creadoEn: Timestamp.now(),
      createdAt: Timestamp.now(),
      actualizadoEn: Timestamp.now(),
      vistas: 0,
      ticketsGenerados: 0,
      ticketsCanjeados: 0,
    });

    return { id: docRef.id, empresaId, estado: estadoInicial, activa: false, ...datosSeguros };
  } catch (err) {
    logError(err, { accion: 'crearPromocion' });
    throw err;
  }
};

// ── UPDATE: Actualizar promoción ──
export const actualizarPromocion = async (promocionId, datosActualizacion) => {
  try {
    if (!promocionId) throw new Error('Promoción ID es requerido');
    const datosSeguros = buildPromocionPayload(datosActualizacion);
    await updateDoc(doc(db, 'promociones', promocionId), {
      ...datosSeguros,
      actualizadoEn: Timestamp.now(),
    });
    return { exito: true };
  } catch (err) {
    logError(err, { accion: 'actualizarPromocion' });
    throw err;
  }
};

// ── DELETE: Eliminar promoción ──
export const eliminarPromocion = async (promocionId) => {
  try {
    if (!promocionId) throw new Error('Promoción ID es requerido');
    await deleteDoc(doc(db, 'promociones', promocionId));
    return { exito: true };
  } catch (err) {
    logError(err, { accion: 'eliminarPromocion' });
    throw err;
  }
};