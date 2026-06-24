// src/modules/cliente/services/ticketService.js
// Dominio: acciones que ejecuta el CLIENTE sobre sus tickets.

import {
  collection, addDoc, getDocs, doc,
  query, where, Timestamp, increment, runTransaction,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';
import { crearNotificacion, crearNotificacionTicketsAgotados } from '../../../shared/services/notificationService';

// ── Helpers ───────────────────────────────────────────────────────────────────

export const generarCodigoTicket = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

// ── Crear ticket (cliente genera un ticket de una promoción) ──────────────────

export const crearTicket = async (usuarioId, promocionId, empresaId, promocionData, usuarioData) => {
  try {
    if (!usuarioId || typeof usuarioId !== 'string') throw new Error('Usuario ID inválido');
    if (!promocionId || typeof promocionId !== 'string') throw new Error('Promoción ID inválido');
    if (!empresaId || typeof empresaId !== 'string') throw new Error('Empresa ID inválido');
    if (!promocionData || typeof promocionData !== 'object') throw new Error('Datos de promoción inválidos');

    // Verificar ticket duplicado
    const snap = await getDocs(query(
      collection(db, 'tickets'),
      where('usuarioId', '==', usuarioId),
      where('promocionId', '==', promocionId)
    ));
    if (!snap.empty) throw new Error('Ya has obtenido un ticket para esta promoción');

    // Validar expiración
    const ahora = new Date();
    if (promocionData.fechaHoraExpiracion) {
      const exp = promocionData.fechaHoraExpiracion.toDate?.() || new Date(promocionData.fechaHoraExpiracion);
      if (ahora > exp) throw new Error('La promoción ha expirado y no se pueden generar más tickets');
    }

    // Validar límite de tickets
    if (promocionData.ticketsMaximos) {
      if ((promocionData.ticketsGenerados || 0) >= promocionData.ticketsMaximos) {
        throw new Error(`Se ha alcanzado el límite de ${promocionData.ticketsMaximos} tickets`);
      }
    }

    const ticket = {
      usuarioId,
      usuarioNombre:   usuarioData?.nombre   || 'Cliente',
      usuarioTelefono: usuarioData?.telefono || 'N/A',
      promocionId,
      empresaId,
      codigo:          generarCodigoTicket(),
      estado:          'generado',
      fechaGeneracion: Timestamp.now(),
      fechaCanjeado:   null,
      promocionTitulo: promocionData?.titulo || 'Promoción',
      empresaNombre:   promocionData?.empresaNombre || promocionData?.empresa?.nombre || 'Empresa',
      descuento:       promocionData?.descuento ?? null,
      precioOriginal:  promocionData?.precioOriginal ?? null,
      precioDescuento: promocionData?.precioDescuento ?? null,
    };

    const ticketSeguro = Object.fromEntries(
      Object.entries(ticket).map(([key, value]) => [key, value === undefined ? null : value])
    );

    const docRef  = await addDoc(collection(db, 'tickets'), ticketSeguro);
    const promoRef = doc(db, 'promociones', promocionId);

    // Transacción para evitar sobreventa
    const nuevoConteo = await runTransaction(db, async (tx) => {
      const promoSnap = await tx.get(promoRef);
      if (!promoSnap.exists()) throw new Error('La promoción ya no existe');

      const data        = promoSnap.data();
      const conteo      = data.ticketsGenerados || 0;
      if (data.ticketsMaximos && conteo >= data.ticketsMaximos) {
        throw new Error('Lo sentimos, se acaban de agotar los tickets');
      }

      const siguiente = conteo + 1;
      tx.update(promoRef, {
        ticketsGenerados: increment(1),
        estadisticas: {
          ticketsGenerados:       siguiente,
          porcentajeUso:          data.ticketsMaximos
            ? Math.round((siguiente / data.ticketsMaximos) * 100)
            : 0,
          ultimoTicketGenerado:   Timestamp.now(),
        },
      });
      return siguiente;
    });

    // Notificar a la empresa si se agotaron tickets
    if (promocionData.ticketsMaximos && nuevoConteo >= promocionData.ticketsMaximos) {
      await crearNotificacionTicketsAgotados(empresaId, {
        ...promocionData,
        id: promocionId,
        ticketsGenerados: nuevoConteo,
      });
    }

    return { id: docRef.id, ...ticket };
  } catch (error) {
    logError(error, { accion: 'crearTicket' });
    throw error;
  }
};

// ── Obtener tickets del usuario autenticado ───────────────────────────────────

export const obtenerTicketsUsuario = async (usuarioId) => {
  try {
    if (!usuarioId || typeof usuarioId !== 'string') throw new Error('Usuario ID inválido');
    const snap = await getDocs(query(
      collection(db, 'tickets'),
      where('usuarioId', '==', usuarioId)
    ));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logError(error, { accion: 'obtenerTicketsUsuario' });
    throw error;
  }
};

// ── Verificar tickets próximos a expirar y notificar ─────────────────────────

export const verificarNotificacionesExpiracion = async (usuarioId) => {
  try {
    const ahora          = new Date();
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);

    const snap = await getDocs(query(
      collection(db, 'tickets'),
      where('usuarioId', '==', usuarioId),
      where('estado', '==', 'generado')
    ));

    for (const docSnap of snap.docs) {
      const ticket = docSnap.data();
      let fechaExp;

      if (ticket.fechaHoraExpiracion?.toDate) {
        fechaExp = ticket.fechaHoraExpiracion.toDate();
      } else if (ticket.fechaHoraExpiracion) {
        fechaExp = new Date(ticket.fechaHoraExpiracion);
      }

      if (fechaExp && !isNaN(fechaExp) && fechaExp > ahora && fechaExp <= unaHoraDespues) {
        await crearNotificacion(usuarioId, 'recordatorio_expiracion',
          '¡Tu ticket está por expirar!',
          `Tu ticket para "${ticket.promocionTitulo}" vence en menos de una hora. ¡Canjéalo pronto!`,
          { promocionId: ticket.promocionId }
        );
      }
    }
  } catch (error) {
    logError(error, { accion: 'verificarNotificacionesExpiracion', usuarioId });
  }
};