import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  createUserWithEmailAndPassword,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../firebase';
import { logError, handleError } from '../../../shared/utils/errorHandler';

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

/**
 * Login con email y contraseña.
 * @returns {{ user: FirebaseUser }} credencial de Firebase
 * @throws error con mensaje legible via handleError
 */
export const loginConEmail = async (email, password) => {
  try {
    const credencial = await signInWithEmailAndPassword(auth, email, password);
    return credencial.user;
  } catch (error) {
    throw handleError(error, { accion: 'login_email' });
  }
};

/**
 * Inicia login con Google via redirect.
 * No retorna nada — la página recarga y se resuelve en manejarRedirectGoogle().
 */
export const loginConGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    throw handleError(error, { accion: 'login_google_redirect' });
  }
};

export const loginConGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const userDocRef = doc(db, 'usuarios', fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        nombre: fbUser.displayName || 'Usuario Google',
        email: fbUser.email,
        tipo: 'cliente',
        telefono: '',
        estado: 'aprobado',
        foto: fbUser.photoURL || null,
        createdAt: new Date(),
      });
      return { fbUser, esNuevo: true };
    }

    return { fbUser, esNuevo: false };
  } catch (error) {
    logError(error, { accion: 'login_google_popup' });
    throw handleError(error, { accion: 'login_google_popup' });
  }
};

/**
 * Maneja el resultado del redirect de Google al volver a la app.
 * Crea el documento en Firestore si es la primera vez.
 * @returns {{ fbUser, esNuevo: boolean } | null}
 */
export const manejarRedirectGoogle = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const fbUser = result.user;
    const userDocRef = doc(db, 'usuarios', fbUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        nombre: fbUser.displayName || 'Usuario Google',
        email: fbUser.email,
        tipo: 'cliente',
        telefono: '',
        estado: 'aprobado',
        foto: fbUser.photoURL || null,
        createdAt: new Date(),
      });
      return { fbUser, esNuevo: true };
    }

    return { fbUser, esNuevo: false };
  } catch (error) {
    logError(error, { accion: 'manejarRedirectGoogle' });
    throw handleError(error, { accion: 'manejarRedirectGoogle' });
  }
};

// ─────────────────────────────────────────────
// DETECCIÓN DE ROL
// ─────────────────────────────────────────────

/**
 * Detecta el tipo de usuario consultando Firestore (usuarios → empresa → admin).
 * @param {FirebaseUser} firebaseUser
 * @returns {{ type: 'cliente'|'empresa'|'admin', data: Object } | null}
 *          null si el usuario no existe o está bloqueado — en ese caso
 *          el campo `error` contiene el mensaje a mostrar.
 */
export const detectarTipoUsuario = async (firebaseUser) => {
  try {
    // 1. Buscar en colección usuarios (clientes)
    let snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.tipo !== 'cliente') {
        return { error: 'Datos inconsistentes en la base de datos' };
      }
      return { type: 'cliente', data };
    }

    // 2. Buscar en colección empresa
    snap = await getDoc(doc(db, 'empresa', firebaseUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.estado === 'pendiente') {
        return { error: 'Tu solicitud aún está pendiente de aprobación' };
      }
      if (data.estado === 'rechazado') {
        return { error: 'Tu solicitud de empresa fue rechazada. Contacta con soporte.' };
      }
      return { type: 'empresa', data };
    }

    // 3. Buscar en colección admin
    snap = await getDoc(doc(db, 'admin', firebaseUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (!data.puedeAprobar) {
        return { error: 'No tienes permisos de administrador' };
      }
      return { type: 'admin', data };
    }

    return { error: 'Usuario no encontrado en el sistema' };
  } catch (error) {
    logError(error, { accion: 'detectarTipoUsuario' });
    return { error: 'Error al verificar usuario. Intenta de nuevo.' };
  }
};

// ─────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────

/**
 * Verifica si ya existe un documento con cédula o RUC duplicado.
 * @returns {string|null} mensaje de error, o null si no hay duplicado
 */
const verificarDuplicados = async (tipo, form) => {
  if (tipo === 'cliente') {
    const q = query(collection(db, 'usuarios'), where('cedula', '==', form.cedula));
    const snap = await getDocs(q);
    if (!snap.empty) return 'Esta cédula ya está registrada';
  } else if (tipo === 'empresa') {
    const q = query(collection(db, 'empresa'), where('ruc', '==', form.ruc));
    const snap = await getDocs(q);
    if (!snap.empty) return 'Este RUC ya está registrado';
  }
  return null;
};

/**
 * Construye el objeto de datos a guardar en Firestore según el tipo de usuario.
 */
const construirDatosUsuario = (tipo, form) => {
  const base = {
    nombre: form.nombre,
    email: form.email,
    telefono: form.telefono || '',
    estado: tipo === 'empresa' ? 'pendiente' : 'aprobado',
    createdAt: new Date(),
  };

  if (tipo === 'empresa') {
    return {
      ...base,
      negocio: form.negocio,
      categoria: form.categoria,
      direccion: form.direccion,
      ruc: form.ruc,
      lat: form.lat,
      lng: form.lng,
    };
  }

  return { ...base, cedula: form.cedula };
};

/**
 * Registra un usuario nuevo con email y contraseña.
 * Crea el documento en Firestore. Si falla, elimina el auth user para no dejar huérfanos.
 * @returns {FirebaseUser} usuario creado
 * @throws {{ campo: string, mensaje: string }} error con campo afectado
 */
export const registrarConEmail = async (tipo, form) => {
  let firebaseUser = null;

  try {
    const credencial = await createUserWithEmailAndPassword(auth, form.email, form.password);
    firebaseUser = credencial.user;

    const errorDuplicado = await verificarDuplicados(tipo, form);
    if (errorDuplicado) {
      await firebaseUser.delete();
      const campo = tipo === 'cliente' ? 'cedula' : 'ruc';
      throw { campo, mensaje: errorDuplicado };
    }

    const coleccion = tipo === 'empresa' ? 'empresa' : 'usuarios';
    const datos = construirDatosUsuario(tipo, form);
    await setDoc(doc(db, coleccion, firebaseUser.uid), datos);

    return firebaseUser;
  } catch (error) {
    // Si ya tiene campo asignado, es nuestro error de duplicado — re-lanzar tal cual
    if (error.campo) throw error;

    // Si Firebase Auth ya creó el user antes de fallar, limpiarlo
    if (firebaseUser) {
      try { await firebaseUser.delete(); } catch (e) {
        logError(e, { accion: 'cleanup_user_delete', email: form.email });
      }
    }

    throw handleError(error, { accion: 'registro', tipo });
  }
};

/**
 * Registra o autentica un cliente con Google.
 * Solo disponible para tipo 'cliente'.
 * @returns {{ fbUser, esNuevo: boolean }}
 * @throws error con mensaje legible
 */
export const registrarConGoogle = async (tipo, form) => {
  if (tipo !== 'cliente') {
    throw { mensaje: 'El registro con Google solo está disponible para clientes' };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const userDoc = await getDoc(doc(db, 'usuarios', fbUser.uid));
    if (userDoc.exists()) {
      throw { mensaje: 'Esta cuenta ya está registrada. Por favor inicia sesión.' };
    }

    await setDoc(doc(db, 'usuarios', fbUser.uid), {
      nombre: fbUser.displayName || 'Usuario Google',
      email: fbUser.email,
      tipo: 'cliente',
      telefono: form.telefono || '',
      cedula: form.cedula || '',
      estado: 'aprobado',
      createdAt: new Date(),
    });

    return { fbUser, esNuevo: true };
  } catch (error) {
    if (error.mensaje) throw error;
    throw handleError(error, { accion: 'registro_google' });
  }
};

export const actualizarPerfilAuth = async (perfil) => {
  try {
    const usuario = auth.currentUser;
    if (!usuario) throw new Error('Usuario no autenticado');
    await updateProfile(usuario, perfil);
    return { exito: true };
  } catch (error) {
    logError(error, { accion: 'actualizarPerfilAuth' });
    throw handleError(error, { accion: 'actualizar_perfil_auth' });
  }
};
