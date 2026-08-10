const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

const db = admin.firestore();

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

  const pago = data?.pago ?? data;
  if (!pago?.id) {
    throw new HttpsError('invalid-argument', 'Falta el identificador del pago.');
  }

  const pagoRef = db.collection('pagos').doc(pago.id);
  const pagoSnap = await pagoRef.get();
  if (!pagoSnap.exists) {
    throw new HttpsError('not-found', 'El pago no existe.');
  }

  const pagoData = pagoSnap.data();
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
    planId: pago.planId ?? pagoData.planId,
    planNombre: pago.planNombre || pago.plan?.nombre || 'Plan',
    estado: 'activa',
    precio: pago.monto || pago.precio || pagoData.monto || pagoData.precio,
    duracion: 30,
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
    datos: { pagoId: pago.id, planId: pago.planId ?? pagoData.planId },
    leida: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, pagoId: pago.id };
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
  const promocionData = data?.promocionData || {};
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
    const fechaExp = promocionData.fechaHoraExpiracion?.toDate?.()
      || promocionData.fechaHoraExpiracion
      || promo.fechaHoraExpiracion?.toDate?.()
      || promo.fechaHoraExpiracion;

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
      usuarioNombre: usuarioData?.nombre || 'Cliente',
      usuarioTelefono: usuarioData?.telefono || 'N/A',
      promocionId,
      empresaId,
      codigo: Math.random().toString(36).slice(2, 10).toUpperCase(),
      estado: 'generado',
      fechaGeneracion: admin.firestore.FieldValue.serverTimestamp(),
      fechaCanjeado: null,
      promocionTitulo: promocionData?.titulo || promo.titulo || 'Promoción',
      empresaNombre: promocionData?.empresaNombre || promocionData?.empresa?.nombre || promo.empresaNombre || 'Empresa',
      descuento: promocionData?.descuento ?? promo.descuento ?? null,
      precioOriginal: promocionData?.precioOriginal ?? promo.precioOriginal ?? null,
      precioDescuento: promocionData?.precioDescuento ?? promo.precioDescuento ?? null,
      fechaHoraExpiracion: promocionData?.fechaHoraExpiracion || promo.fechaHoraExpiracion || promo.fechaFin || null,
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
      mensaje: `La promoción "${promocionData?.titulo || 'esta promoción'}" ya no tiene tickets disponibles.`,
      datos: { promocionId, empresaId },
      leida: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { ok: true, ticket: { id: ticketId, ...resultado.ticket } };
});

exports.crearNotificacionSegura = onCall(async (request) => {
  const { data, auth } = request;
  ensureAuthenticated(request);

  const payload = data || {};
  const usuarioId = payload.usuarioId;
  const tipo = payload.tipo;
  const titulo = payload.titulo;
  const mensaje = payload.mensaje;

  if (!usuarioId || !tipo || !titulo || !mensaje) {
    throw new HttpsError('invalid-argument', 'Faltan datos para crear la notificación.');
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
