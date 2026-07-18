import { db } from '../../../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { logError } from '../../../shared/utils/errorHandler';
import { crearNotificacion, NOTIFICATION_TYPES } from '../../../shared/services/notificationService';
import { normalizarCodigoReferido } from '../../../shared/utils/referrals';

const COLECCION_REFERIDOS = 'referidos';
const REWARD_TICKET_BONUS = 1;

export const obtenerCodigoReferido = async (usuarioId) => {
  try {
    if (!usuarioId) throw new Error('Usuario ID requerido');
    const refDoc = await getDoc(doc(db, COLECCION_REFERIDOS, usuarioId));
    if (refDoc.exists()) return refDoc.data();
    return null;
  } catch (error) {
    logError(error, { accion: 'obtenerCodigoReferido', usuarioId });
    throw error;
  }
};

export const crearCodigoReferido = async (usuarioId, codigoBase = '') => {
  try {
    if (!usuarioId) throw new Error('Usuario ID requerido');

    const refDocRef = doc(db, COLECCION_REFERIDOS, usuarioId);
    const existing = await getDoc(refDocRef);
    if (existing.exists()) return existing.data();

    const codigo = normalizarCodigoReferido(codigoBase || usuarioId.slice(0, 6));
    const payload = {
      usuarioId,
      codigo,
      creadoEn: new Date(),
      publico: true,
      totalReferidos: 0,
      totalBonosEntregados: 0,
    };

    await setDoc(refDocRef, payload);
    return payload;
  } catch (error) {
    logError(error, { accion: 'crearCodigoReferido', usuarioId });
    throw error;
  }
};

export const aplicarCodigoReferido = async (usuarioId, codigoReferido) => {
  try {
    if (!usuarioId) throw new Error('Usuario ID requerido');
    const codigo = normalizarCodigoReferido(codigoReferido);
    if (!codigo) return null;

    const q = query(collection(db, COLECCION_REFERIDOS), where('codigo', '==', codigo));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const referrerDoc = snap.docs[0];
    const referrerId = referrerDoc.data()?.usuarioId;
    if (!referrerId || referrerId === usuarioId) return null;

    const referralDocRef = doc(db, COLECCION_REFERIDOS, usuarioId);
    const existingReferral = await getDoc(referralDocRef);
    if (
      existingReferral.exists()
      && existingReferral.data()?.referidoPor
      && existingReferral.data()?.contadorReferidosAplicado === true
    ) {
      return null;
    }

    await setDoc(referralDocRef, {
      ...(existingReferral.exists() ? existingReferral.data() : {}),
      usuarioId,
      publico: false,
      referidoPor: referrerId,
      codigoUsado: codigo,
      contadorReferidosAplicado: false,
      registradoEn: new Date(),
    }, { merge: true });

    try {
      await updateDoc(doc(db, COLECCION_REFERIDOS, referrerId), {
        totalReferidos: (referrerDoc.data()?.totalReferidos || 0) + 1,
      });
      await updateDoc(referralDocRef, {
        contadorReferidosAplicado: true,
      });
      return { referrerId, codigo };
    } catch (error) {
      await updateDoc(referralDocRef, {
        contadorReferidosAplicado: false,
      });
      throw error;
    }
  } catch (error) {
    logError(error, { accion: 'aplicarCodigoReferido', usuarioId, codigoReferido });
    throw error;
  }
};

export const procesarBonusPorPrimerTicket = async (usuarioId, ticketData = {}) => {
  try {
    const referralDoc = await getDoc(doc(db, COLECCION_REFERIDOS, usuarioId));
    if (!referralDoc.exists()) return null;

    const data = referralDoc.data();
    if (!data?.referidoPor || data?.bonusEntregado) return null;

    const batch = writeBatch(db);
    const referrerRef = doc(db, COLECCION_REFERIDOS, data.referidoPor);
    const referrerSnap = await getDoc(referrerRef);
    if (!referrerSnap.exists()) return null;

    const referrerData = referrerSnap.data() || {};
    batch.update(referralDoc.ref, {
      bonusEntregado: true,
      bonusEntregadoEn: new Date(),
      bonusTipo: 'ticket_extra',
      bonusDetalle: `+${REWARD_TICKET_BONUS} ticket extra`,
    });
    batch.update(referrerRef, {
      totalBonosEntregados: (referrerData.totalBonosEntregados || 0) + 1,
    });
    await batch.commit();

    await crearNotificacion(
      data.referidoPor,
      NOTIFICATION_TYPES.REFERRAL_BONUS,
      '¡Tu referido ya generó su primer ticket!',
      `Has recibido un bono por recomendar a ${ticketData?.usuarioNombre || 'un nuevo usuario'}.`,
      { usuarioId, ticketId: ticketData?.id || null }
    );

    return { referrerId: data.referidoPor, bonus: REWARD_TICKET_BONUS };
  } catch (error) {
    logError(error, { accion: 'procesarBonusPorPrimerTicket', usuarioId });
    throw error;
  }
};
