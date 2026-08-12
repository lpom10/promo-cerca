const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

const db = admin.firestore();

// Whitelist de planes usada por Cloud Functions y referenciada en src/data/planes.js.
// Mantener sincronizado con el frontend para evitar diferencias entre creación de pagos y precios.
const PLANES_PERMITIDOS = {
  basico: { nombre: 'Plan Básico', precio: 9.99, duracion: 30 },
  profesional: { nombre: 'Plan Profesional', precio: 24.99, duracion: 30 },
  empresarial: { nombre: 'Plan Empresarial', precio: 99.99, duracion: 30 },
};

const getPlanInfo = (planId) => PLANES_PERMITIDOS[planId] || null;

const sanitizeUserString = (value, fallback = '', maxLength = 100) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : fallback;
};

const ensureAuthenticated = (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debe iniciar sesión para realizar esta acción.');
  }
};

const isAdmin = async (uid) => {
  const snap = await db.collection('admin').doc(uid).get();
  return snap.exists;
};

const isCompanyOwner = async (uid) => {
  const snap = await db.collection('empresa').doc(uid).get();
  return snap.exists;
};

const canSendNotification = async (senderUid, payload) => {
  if (senderUid === payload.usuarioId) return true;
  if (payload.empresaId && senderUid === payload.empresaId) return true;
  if (await isAdmin(senderUid)) return true;
  if (payload.ticketId) {
    const ticketSnap = await db.collection('tickets').doc(payload.ticketId).get();
    return ticketSnap.exists && ticketSnap.data()?.empresaId === senderUid;
  }
  return false;
};

exports.aprobarPagoCallable = onCall(async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);
  if (!(await isAdmin(auth.uid))) {
    throw new HttpsError('permission-denied', 'Solo un administrador puede aprobar pagos.');
  }

  const pagoId = data?.pago?.id ?? data?.id;
  if (!pagoId) {
    throw new HttpsError('invalid-argument', 'Falta el identificador del pago.');
  }

  const pagoRef = db.collection('pagos').doc(pagoId);
  const pagoSnap = await pagoRef.get();
  if (!pagoSnap.exists) {
    throw new HttpsError('not-found', 'El pago no existe.');
  }

  const pagoData = pagoSnap.data();
  const plan = getPlanInfo(pagoData.planId);
  if (!plan) {
    throw new HttpsError('failed-precondition', 'El pago tiene un plan inválido.');
  }

  const fechaInicio = new Date();
  const fechaVencimiento = new Date(fechaInicio);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

  await pagoRef.update({
    status: 'aprobado',
    procesadoPor: auth.uid,
    procesadoEn: admin.firestore.FieldValue.serverTimestamp(),
  });

  const pendientesSnap = await db.collection('suscripciones')
    .where('empresaId', '==', pagoData.empresaId)
    .where('estado', '==', 'espera')
    .limit(1)
    .get();

  const suscripcionPayload = {
    empresaId: pagoData.empresaId,
    planId: pagoData.planId,
    planNombre: plan.nombre,
    estado: 'activa',
    precio: plan.precio,
    duracion: plan.duracion,
    fechaInicio,
    fechaVencimiento,
    proximoRenovacion: fechaVencimiento,
    metodoPago: 'transferencia',
    renovacionAutomatica: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!pendientesSnap.empty) {
    await pendientesSnap.docs[0].ref.update(suscripcionPayload);
  } else {
    await db.collection('suscripciones').add({
      ...suscripcionPayload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await db.collection('notificaciones').add({
    usuarioId: pagoData.empresaId,
    tipo: 'empresa_aprobada',
    titulo: 'Suscripción activada',
    mensaje: 'Tu comprobante fue aprobado y tu suscripción ya está activa.',
    datos: { pagoId, planId: pagoData.planId },
    leida: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, pagoId };
});

exports.rechazarPagoCallable = onCall(async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);
  if (!(await isAdmin(auth.uid))) {
    throw new HttpsError('permission-denied', 'Solo un administrador puede rechazar pagos.');
  }

  const pagoId = data?.pagoId ?? data?.id;
  if (!pagoId) {
    throw new HttpsError('invalid-argument', 'Falta el identificador del pago.');
  }

  const pagoRef = db.collection('pagos').doc(pagoId);
  const pagoSnap = await pagoRef.get();
  const pagoData = pagoSnap.exists ? pagoSnap.data() : null;

  await pagoRef.update({
    status: 'rechazado',
    motivo: data?.motivo || 'Rechazado por revisión administrativa',
    procesadoPor: auth.uid,
    procesadoEn: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (pagoData?.empresaId) {
    await db.collection('notificaciones').add({
      usuarioId: pagoData.empresaId,
      tipo: 'empresa_rechazada',
      titulo: 'Suscripción rechazada',
      mensaje: data?.motivo || 'Tu comprobante fue revisado y no pudo ser aprobado.',
      datos: { pagoId },
      leida: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { ok: true, pagoId };
});

exports.crearSuscripcionPendienteCallable = onCall(async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);

  const empresaId = data?.empresaId;
  const planId = data?.planId;
  const receiptUrl = data?.receiptUrl || '';
  const paymentId = data?.paymentId || null;

  if (!empresaId || typeof empresaId !== 'string') {
    throw new HttpsError('invalid-argument', 'Empresa ID inválido.');
  }
  if (!planId || typeof planId !== 'string') {
    throw new HttpsError('invalid-argument', 'Plan ID inválido.');
  }
  if (auth.uid !== empresaId && !(await isAdmin(auth.uid))) {
    throw new HttpsError('permission-denied', 'No puedes crear un pago para otra empresa.');
  }

  const plan = getPlanInfo(planId);
  if (!plan) {
    throw new HttpsError('invalid-argument', 'Plan no válido.');
  }

  const pendingPaymentSnap = await db.collection('pagos')
    .where('empresaId', '==', empresaId)
    .where('status', '==', 'espera')
    .limit(1)
    .get();

  if (!pendingPaymentSnap.empty) {
    throw new HttpsError('already-exists', 'Ya existe una solicitud de pago pendiente para esta empresa.');
  }

  const pago = {
    empresaId,
    planId,
    planNombre: plan.nombre,
    precio: plan.precio,
    monto: plan.precio,
    status: 'espera',
    paymentId,
    receiptUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    proximoRenovacion: null,
  };

  const pagoRef = await db.collection('pagos').add(pago);
  return { id: pagoRef.id, ...pago };
});

exports.canjearTicketCallable = onCall(async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);
  const { ticketId, empresaId } = data || {};

  if (!ticketId || !empresaId) {
    throw new HttpsError('invalid-argument', 'Ticket ID y Empresa ID son requeridos.');
  }

  const ticketRef = db.collection('tickets').doc(ticketId);

  await db.runTransaction(async (transaction) => {
    const ticketSnap = await transaction.get(ticketRef);
    if (!ticketSnap.exists) {
      throw new HttpsError('not-found', 'El ticket no existe.');
    }

    const ticket = ticketSnap.data();
    if (ticket.empresaId !== empresaId) {
      throw new HttpsError('permission-denied', 'El ticket no pertenece a esta empresa.');
    }
    if (['canjeado', 'expirado'].includes(ticket.estado)) {
      throw new HttpsError('failed-precondition', 'El ticket ya no puede canjearse.');
    }

    transaction.update(ticketRef, {
      estado: 'canjeado',
      fechaCanjeado: admin.firestore.FieldValue.serverTimestamp(),
      canjeadoPor: auth.uid,
    });

    const promoDoc = await transaction.get(db.collection('promociones').doc(ticket.promocionId));
    if (promoDoc.exists) {
      transaction.update(db.collection('promociones').doc(ticket.promocionId), {
        ticketsCanjeados: admin.firestore.FieldValue.increment(1),
      });
    }

    const notificacionPayload = {
      usuarioId: ticket.usuarioId,
      tipo: 'ticket_canjeado',
      titulo: 'Ticket canjeado',
      mensaje: `Tu ticket para "${ticket.promocionTitulo || 'esta promoción'}" fue canjeado correctamente.`,
      datos: { ticketId, promocionId: ticket.promocionId, empresaId },
      leida: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (await isCompanyOwner(auth.uid) || await isAdmin(auth.uid)) {
      transaction.set(db.collection('notificaciones').doc(), notificacionPayload);
    }
  });

  return { ok: true, ticketId };
});

exports.crearTicketCallable = onCall(async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);

  const usuarioId = data?.usuarioId || auth.uid;
  const promocionId = data?.promocionId;
  const empresaId = data?.empresaId;
  const usuarioData = data?.usuarioData || {};

  if (!usuarioId || typeof usuarioId !== 'string') {
    throw new HttpsError('invalid-argument', 'Usuario ID inválido.');
  }
  if (!promocionId || typeof promocionId !== 'string') {
    throw new HttpsError('invalid-argument', 'Promoción ID inválido.');
  }
  if (!empresaId || typeof empresaId !== 'string') {
    throw new HttpsError('invalid-argument', 'Empresa ID inválido.');
  }
  if (data?.usuarioId && data.usuarioId !== auth.uid) {
    throw new HttpsError('permission-denied', 'No puedes crear un ticket para otro usuario.');
  }

  const usuarioNombre = sanitizeUserString(usuarioData?.nombre, 'Cliente');
  const usuarioTelefono = sanitizeUserString(usuarioData?.telefono, 'N/A');

  const ticketId = `${usuarioId}_${promocionId}`;
  const ticketRef = db.collection('tickets').doc(ticketId);
  const promoRef = db.collection('promociones').doc(promocionId);

  const resultado = await db.runTransaction(async (transaction) => {
    const ticketSnap = await transaction.get(ticketRef);
    if (ticketSnap.exists) {
      throw new HttpsError('already-exists', 'Ya has obtenido un ticket para esta promoción.');
    }

    const promoSnap = await transaction.get(promoRef);
    if (!promoSnap.exists) {
      throw new HttpsError('not-found', 'La promoción ya no existe.');
    }

    const promo = promoSnap.data() || {};
    if (promo.empresaId !== empresaId) {
      throw new HttpsError('permission-denied', 'La promoción no pertenece a la empresa indicada.');
    }
    if (promo.estado !== 'aprobado' || promo.activa !== true) {
      throw new HttpsError('failed-precondition', 'La promoción no está disponible para generar tickets.');
    }

    const ahora = new Date();
    const fechaExp = promo.fechaHoraExpiracion?.toDate?.() || promo.fechaHoraExpiracion || promo.fechaFin;
    if (fechaExp) {
      const fechaExpiracion = fechaExp instanceof Date ? fechaExp : new Date(fechaExp);
      if (ahora > fechaExpiracion) {
        throw new HttpsError('failed-precondition', 'La promoción ha expirado y no se pueden generar más tickets.');
      }
    }

    const conteo = promo.ticketsGenerados || 0;
    const siguiente = conteo + 1;
    const limiteAlcanzado = Boolean(promo.ticketsMaximos && siguiente > promo.ticketsMaximos);

    if (limiteAlcanzado) {
      throw new HttpsError('failed-precondition', 'Lo sentimos, se acaban de agotar los tickets.');
    }

    const ticket = {
      usuarioId,
      usuarioNombre,
      usuarioTelefono,
      promocionId,
      empresaId,
      codigo: Math.random().toString(36).slice(2, 10).toUpperCase(),
      estado: 'generado',
      fechaGeneracion: admin.firestore.FieldValue.serverTimestamp(),
      fechaCanjeado: null,
      promocionTitulo: promo.titulo || 'Promoción',
      empresaNombre: promo.empresaNombre || promo.empresa?.nombre || 'Empresa',
      descuento: promo.descuento ?? null,
      precioOriginal: promo.precioOriginal ?? null,
      precioDescuento: promo.precioDescuento ?? null,
      fechaHoraExpiracion: promo.fechaHoraExpiracion || promo.fechaFin || null,
      recordatorioExpiracionEnviado: false,
    };

    transaction.set(ticketRef, ticket);
    transaction.update(promoRef, {
      ticketsGenerados: admin.firestore.FieldValue.increment(1),
      estadisticas: {
        ticketsGenerados: siguiente,
        porcentajeUso: promo.ticketsMaximos
          ? Math.round((siguiente / promo.ticketsMaximos) * 100)
          : 0,
        ultimoTicketGenerado: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    const agotado = Boolean(promo.ticketsMaximos && siguiente === promo.ticketsMaximos);
    return { ticket, siguiente, agotado };
  });

  if (resultado.agotado) {
    await db.collection('notificaciones').add({
      usuarioId: empresaId,
      tipo: 'tickets_agotados',
      titulo: 'Tickets agotados',
      mensaje: `La promoción "${resultado.ticket.promocionTitulo}" ya no tiene tickets disponibles.`,
      datos: { promocionId, empresaId },
      leida: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { ok: true, ticket: { id: ticketId, ...resultado.ticket } };
});

exports.registrarVisualizacionCallable = onCall({ enforceAppCheck: true }, async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);

  const promocionId = data?.promocionId;
  const empresaId = data?.empresaId;
  const usuarioId = auth.uid;

  if (!promocionId || typeof promocionId !== 'string') {
    throw new HttpsError('invalid-argument', 'Promoción ID inválido.');
  }
  if (!empresaId || typeof empresaId !== 'string') {
    throw new HttpsError('invalid-argument', 'Empresa ID inválido.');
  }

  const vistaRef = db.collection('vistas').doc();
  const promocionRef = db.collection('promociones').doc(promocionId);

  await db.runTransaction(async (transaction) => {
    transaction.set(vistaRef, {
      promocionId,
      empresaId,
      usuarioId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.update(promocionRef, {
      visualizaciones: admin.firestore.FieldValue.increment(1),
    });
  });

  return { ok: true };
});

exports.crearNotificacionSegura = onCall(async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);

  const payload = data || {};
  const usuarioId = payload.usuarioId;
  const tipo = payload.tipo;
  const titulo = sanitizeUserString(payload.titulo, '');
  const mensaje = sanitizeUserString(payload.mensaje, '');

  if (!usuarioId || !tipo || !titulo || !mensaje) {
    throw new HttpsError('invalid-argument', 'Faltan datos válidos para crear la notificación.');
  }

  if (!(await canSendNotification(auth.uid, payload))) {
    throw new HttpsError('permission-denied', 'No tienes permisos para crear esta notificación.');
  }

  const docRef = await db.collection('notificaciones').add({
    usuarioId,
    tipo,
    titulo,
    mensaje,
    datos: payload.datos || {},
    leida: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, id: docRef.id };
});

exports.enviarRecordatoriosExpiracionTickets = functions.pubsub
  .schedule('every 30 minutes')
  .timeZone('America/Guayaquil')
  .onRun(async () => {
    const ahora = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

    const snapshot = await db
      .collection('tickets')
      .where('estado', '==', 'generado')
      .where('recordatorioExpiracionEnviado', '==', false)
      .get();

    const batch = db.batch();
    let count = 0;

    for (const docSnap of snapshot.docs) {
      const ticket = docSnap.data();
      const fechaExp = ticket.fechaHoraExpiracion?.toDate?.() || new Date(ticket.fechaHoraExpiracion || 0);

      if (!fechaExp || Number.isNaN(fechaExp.getTime())) continue;
      if (fechaExp <= ahora || fechaExp > unaHoraDespues) continue;

      const mensaje = `Tu ticket para "${ticket.promocionTitulo || 'esta promoción'}" vence en menos de una hora. ¡Canjéalo pronto!`;

      batch.set(db.collection('notificaciones').doc(), {
        usuarioId: ticket.usuarioId,
        tipo: 'recordatorio_expiracion',
        titulo: '¡Tu ticket está por expirar!',
        mensaje,
        datos: { promocionId: ticket.promocionId },
        leida: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      batch.update(docSnap.ref, {
        recordatorioExpiracionEnviado: true,
        recordatorioExpiracionEnviadoAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      count += 1;
    }

    if (count > 0) {
      await batch.commit();
    }

    return null;
  });
