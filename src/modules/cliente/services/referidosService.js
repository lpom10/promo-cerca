import { db } from '../../../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
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
    const referrerDocRef = doc(db, COLECCION_REFERIDOS, referrerId);

    try {
      await runTransaction(db, async (tx) => {
        const existingReferralSnap = await tx.get(referralDocRef);
        const existingReferral = existingReferralSnap.exists() ? existingReferralSnap.data() : {};

        if (
          existingReferral?.referidoPor
          && existingReferral?.contadorReferidosAplicado === true
        ) {
          return;
        }

        tx.set(referralDocRef, {
          ...existingReferral,
          usuarioId,
          publico: false,
          referidoPor: referrerId,
          codigoUsado: codigo,
          contadorReferidosAplicado: false,
          registradoEn: new Date(),
        }, { merge: true });

        tx.update(referrerDocRef, {
          totalReferidos: increment(1),
        });

        tx.update(referralDocRef, {
          contadorReferidosAplicado: true,
        });
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

    const referrerRef = doc(db, COLECCION_REFERIDOS, data.referidoPor);
    const referralRef = referralDoc.ref;

    await runTransaction(db, async (tx) => {
      const referrerSnap = await tx.get(referrerRef);
      const referralSnap = await tx.get(referralRef);
      if (!referrerSnap.exists() || !referralSnap.exists()) return;

      tx.update(referralRef, {
        bonusEntregado: true,
        bonusEntregadoEn: new Date(),
        bonusTipo: 'ticket_extra',
        bonusDetalle: `+${REWARD_TICKET_BONUS} ticket extra`,
      });
      tx.update(referrerRef, {
        totalBonosEntregados: increment(1),
      });
    });

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
