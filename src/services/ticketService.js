import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { logError } from '../utils/errorHandler';
import { crearNotificacion, crearNotificacionTicketsAgotados } from './notificationService';

// Generar código único para ticket
export const generarCodigoTicket = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

// Crear ticket para cliente
export const crearTicket = async (usuarioId, promocionId, empresaId, promocionData, usuarioData) => {
  try {
    // 🔐 VALIDACIÓN DE ENTRADA
    if (!usuarioId || typeof usuarioId !== 'string') {
      throw new Error('Usuario ID inválido');
    }
    if (!promocionId || typeof promocionId !== 'string') {
      throw new Error('Promoción ID inválido');
    }
    if (!empresaId || typeof empresaId !== 'string') {
      throw new Error('Empresa ID inválido');
    }
    if (!promocionData || typeof promocionData !== 'object') {
      throw new Error('Datos de promoción inválidos');
    }
    if (usuarioData && typeof usuarioData !== 'object') {
      throw new Error('Datos de usuario inválidos');
    }
    
    // Verificar que no exista ya un ticket para esta promoción
    const q = query(
      collection(db, 'tickets'),
      where('usuarioId', '==', usuarioId),
      where('promocionId', '==', promocionId)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error('Ya has obtenido un ticket para esta promoción');
    }

    // Verificar límites de tickets
    const ahora = new Date();

    // Validar fecha/hora de expiración
    if (promocionData.fechaHoraExpiracion) {
      const fechaExpiracion = promocionData.fechaHoraExpiracion.toDate?.() || new Date(promocionData.fechaHoraExpiracion);
      if (ahora > fechaExpiracion) {
        throw new Error('La promoción ha expirado y no se pueden generar más tickets');
      }
    }

    // Validar límite de cantidad de tickets
    if (promocionData.ticketsMaximos) {
      if ((promocionData.ticketsGenerados || 0) >= promocionData.ticketsMaximos) {
        throw new Error(`Se ha alcanzado el límite de ${promocionData.ticketsMaximos} tickets para esta promoción`);
      }
    }

    const codigo = generarCodigoTicket();
    
    const ticket = {
      usuarioId,
      usuarioNombre: usuarioData?.nombre || 'Cliente',
      usuarioTelefono: usuarioData?.telefono || 'N/A',
      promocionId,
      empresaId,
      codigo,
      estado: 'generado', // generado | canjeado
      fechaGeneracion: Timestamp.now(),
      fechaCanjeado: null,
      promocionTitulo: promocionData.titulo,
      empresaNombre: promocionData.empresaNombre,
      descuento: promocionData.descuento,
    };

    const docRef = await addDoc(collection(db, 'tickets'), ticket);
    
    // Incrementar contador de tickets generados en la promoción
    const promoRef = doc(db, 'promociones', promocionId);
    
    // Obtener datos actuales de la promoción
    const promoSnap = await getDoc(promoRef);
    const promoActual = promoSnap.data();
    const nuevoConteo = (promoActual.ticketsGenerados || 0) + 1;
    
    // Actualizar estadísticas y contador
    await updateDoc(promoRef, {
      ticketsGenerados: increment(1),
      estadisticas: {
        ticketsGenerados: nuevoConteo,
        porcentajeUso: promoActual.ticketsMaximos ? Math.round((nuevoConteo / promoActual.ticketsMaximos) * 100) : 0,
        ultimoTicketGenerado: Timestamp.now(),
      }
    });
    
    // Notificar si se alcanzó el límite de tickets
    if (promoActual.ticketsMaximos && nuevoConteo >= promoActual.ticketsMaximos) {
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

// Obtener ticket por código (para validar en local)
export const obtenerTicketPorCodigo = async (codigo) => {
  try {
    // 🔐 VALIDACIÓN
    if (!codigo || typeof codigo !== 'string' || codigo.length === 0) {
      throw new Error('Código de ticket inválido');
    }
    
    const q = query(
      collection(db, 'tickets'),
      where('codigo', '==', codigo)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Código de ticket no válido');
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logError(error, { accion: 'obtenerTicketPorCodigo' });
    throw error;
  }
};

// Canjear ticket
export const canjearTicket = async (ticketId, empresaId) => {
  try {
    // 🔐 VALIDACIÓN
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error('Ticket ID inválido');
    }
    if (!empresaId || typeof empresaId !== 'string') {
      throw new Error('Empresa ID inválido');
    }
    
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      throw new Error('Ticket no encontrado');
    }

    const ticket = ticketSnap.data();

    // Verificar que sea empresa correcta
    if (ticket.empresaId !== empresaId) {
      throw new Error('Este ticket no corresponde a tu empresa');
    }

    // Verificar que no esté ya canjeado
    if (ticket.estado === 'canjeado') {
      throw new Error('Este ticket ya fue canjeado');
    }

    // Actualizar ticket
    await updateDoc(ticketRef, {
      estado: 'canjeado',
      fechaCanjeado: Timestamp.now(),
    });

    return { id: ticketId, ...ticket, estado: 'canjeado', fechaCanjeado: new Date() };
  } catch (error) {
    logError(error, { accion: 'canjearTicket', ticketId });
    throw error;
  }
};

// Obtener tickets de usuario
export const obtenerTicketsUsuario = async (usuarioId) => {
  try {
    // 🔐 VALIDACIÓN
    if (!usuarioId || typeof usuarioId !== 'string') {
      throw new Error('Usuario ID inválido');
    }
    
    const q = query(
      collection(db, 'tickets'),
      where('usuarioId', '==', usuarioId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logError(error, { accion: 'obtenerTicketsUsuario' });
    throw error;
  }
};

// Obtener tickets de empresa (para validar en local)
export const obtenerTicketsEmpresa = async (empresaId) => {
  try {
    // 🔐 VALIDACIÓN
    if (!empresaId || typeof empresaId !== 'string') {
      throw new Error('Empresa ID inválido');
    }
    
    const q = query(
      collection(db, 'tickets'),
      where('empresaId', '==', empresaId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logError(error, { accion: 'obtenerTicketsEmpresa' });
    throw error;
  }
};

// Registrar visualización de promoción
export const registrarVisualizacion = async (promocionId, empresaId, usuarioId = null) => {
  try {
    // 🔐 VALIDACIÓN
    if (!promocionId || typeof promocionId !== 'string') {
      throw new Error('Promoción ID inválido');
    }
    if (!empresaId || typeof empresaId !== 'string') {
      throw new Error('Empresa ID inválido');
    }
    if (usuarioId && typeof usuarioId !== 'string') {
      throw new Error('Usuario ID inválido');
    }
    
    await addDoc(collection(db, 'vistas'), {
      promocionId,
      empresaId,
      usuarioId,
      timestamp: Timestamp.now(),
    });

    // Incrementar contador en promoción de forma atómica
    const promoRef = doc(db, 'promociones', promocionId);
    await updateDoc(promoRef, {
      visualizaciones: increment(1)
    });

  } catch (error) {
    logError(error, { accion: 'registrarVisualizacion' });
    // No lanzar error, es secundario
  }
};

// Verificar disponibilidad de tickets para una promoción
export const verificarDisponibilidadTickets = (promocion) => {
  const ahora = new Date();
  const resultado = {
    disponible: true,
    razon: '',
    ticketsRestantes: null,
    fechaExpiracion: null,
  };

  // Verificar fecha/hora de expiración
  const fechaCampo = promocion.fechaHoraExpiracion || promocion.fechaFin;
  if (fechaCampo) {
    const fechaExpiracion = fechaCampo.toDate?.() || new Date(fechaCampo);
    resultado.fechaExpiracion = fechaExpiracion;

    if (ahora > fechaExpiracion) {
      resultado.disponible = false;
      resultado.razon = 'Generación de tickets expirada';
      return resultado;
    }
  }

  // Verificar límite de cantidad de tickets
  if (promocion.ticketsMaximos) {
    const generados = promocion.ticketsGenerados || 0;
    resultado.ticketsRestantes = Math.max(0, promocion.ticketsMaximos - generados);
    
    if (generados >= promocion.ticketsMaximos) {
      resultado.disponible = false;
      resultado.razon = `Se ha alcanzado el límite de ${promocion.ticketsMaximos} tickets`;
      return resultado;
    }
  }

  return resultado;
};

// Obtener mensaje amigable sobre disponibilidad de tickets
export const obtenerMensajeDisponibilidad = (disponibilidad) => {
  if (disponibilidad.disponible) {
    if (disponibilidad.ticketsRestantes !== null) {
      return `${disponibilidad.ticketsRestantes} tickets disponibles`;
    }
    return 'Tickets disponibles';
  }
  return disponibilidad.razon;
}

// Obtener promociones trending
export const obtenerPromocionesTrending = async (limite = 5) => {
  try {    // 🔐 VALIDACIÓN
    if (typeof limite !== 'number' || limite < 1 || limite > 100) {
      limite = 5;
    }
        const q = query(
      collection(db, 'promociones'),
      where('activa', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Ordenar por visualizaciones y filtrar solo disponibles
    return promos
      .filter(p => verificarDisponibilidadTickets(p).disponible)
      .sort((a, b) => (b.visualizaciones || 0) - (a.visualizaciones || 0))
      .slice(0, limite);
  } catch (error) {
    logError(error, { accion: 'obtenerPromocionesTrending' });
    throw error;
  }
};


// Obtener estadísticas de vistas por periodo
export const obtenerEstadisticasVistas = async (promocionId, dias = 7) => {
  try {
    // 🔐 VALIDACIÓN
    if (!promocionId || typeof promocionId !== 'string') {
      throw new Error('Promoción ID inválido');
    }
    if (typeof dias !== 'number' || dias < 1 || dias > 365) {
      dias = 7;
    }
    
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const q = query(
      collection(db, 'vistas'),
      where('promocionId', '==', promocionId),
      where('timestamp', '>=', Timestamp.fromDate(fechaInicio))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    logError(error, { accion: 'obtenerEstadisticasVistas' });
    throw error;
  }
};

// Obtener estadísticas completas de tickets para una promoción
export const obtenerEstadisticasTickets = async (promocionId) => {
  try {
    // 🔐 VALIDACIÓN
    if (!promocionId || typeof promocionId !== 'string') {
      throw new Error('Promoción ID inválido');
    }
    
    // Obtener todos los tickets de la promoción
    const q = query(
      collection(db, 'tickets'),
      where('promocionId', '==', promocionId)
    );
    
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(doc => doc.data());
    
    const generados = tickets.filter(t => t.estado === 'generado').length;
    const canjeados = tickets.filter(t => t.estado === 'canjeado').length;
    const tasaCanjeTotal = tickets.length > 0 ? Math.round((canjeados / tickets.length) * 100) : 0;
    
    return {
      totalTickets: tickets.length,
      ticketsGenerados: generados,
      ticketsCanjeados: canjeados,
      tasaCanje: tasaCanjeTotal,
      tickets: tickets,
    };
  } catch (error) {
    logError(error, { accion: 'obtenerEstadisticasTickets' });
    throw error;
  }
};

// Validar y reasignar límites cuando se edita una promoción
export const validarReasignacionLimites = async (promocionId, nuevoTicketsMaximos, ticketsActualesMaximos) => {
  try {
    // Obtener promoción actual
    const promoRef = doc(db, 'promociones', promocionId);
    const promoSnap = await getDoc(promoRef);
    const promo = promoSnap.data();
    
    const ticketsGenerados = promo.ticketsGenerados || 0;
    
    // Validaciones
    const validacion = {
      valido: true,
      advertencias: [],
      errores: [],
    };
    
    // Si se reduce el límite por debajo de lo generado
    if (nuevoTicketsMaximos < ticketsGenerados) {
      validacion.errores.push(
        `No se puede reducir el límite a ${nuevoTicketsMaximos}. Ya se han generado ${ticketsGenerados} tickets.`
      );
      validacion.valido = false;
    }
    
    // Si se aumenta el límite
    if (nuevoTicketsMaximos > ticketsActualesMaximos) {
      validacion.advertencias.push(
        `Se aumentará el límite de ${ticketsActualesMaximos} a ${nuevoTicketsMaximos} tickets.`
      );
    }
    
    // Si se disminuye pero es válido
    if (nuevoTicketsMaximos < ticketsActualesMaximos && nuevoTicketsMaximos >= ticketsGenerados) {
      validacion.advertencias.push(
        `Se reducirá el límite de ${ticketsActualesMaximos} a ${nuevoTicketsMaximos} tickets. Ya se han generado ${ticketsGenerados}.`
      );
    }
    
    return validacion;
  } catch (error) {
    logError(error, { accion: 'validarReasignacionLimites' });
    throw error;
  }
};

// Calcular tiempo restante hasta expiración (para temporizadores)
export const calcularTiempoRestante = (fechaHoraExpiracion) => {
  if (!fechaHoraExpiracion) return null;
  
  const ahora = new Date();
  const expiracion = fechaHoraExpiracion.toDate?.() || new Date(fechaHoraExpiracion);
  const diferencia = expiracion - ahora;
  
  if (diferencia <= 0) {
    return { expirado: true, dias: 0, horas: 0, minutos: 0, segundos: 0 };
  }
  
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
  
  return {
    expirado: false,
    dias,
    horas,
    minutos,
    segundos,
    tiempoTotal: diferencia,
    porcentajeRestante: Math.max(0, Math.min(100, (diferencia / (7 * 24 * 60 * 60 * 1000)) * 100)), // Asume 7 días como 100%
  };
};

// Formato amigable del tiempo restante
export const formatearTiempoRestante = (tiempoData) => {
  if (!tiempoData || tiempoData.expirado) {
    return 'Expirado';
  }
  
  if (tiempoData.dias > 0) {
    return `${tiempoData.dias}d ${tiempoData.horas}h`;
  } else if (tiempoData.horas > 0) {
    return `${tiempoData.horas}h ${tiempoData.minutos}m`;
  } else if (tiempoData.minutos > 0) {
    return `${tiempoData.minutos}m ${tiempoData.segundos}s`;
  } else {
    return `${tiempoData.segundos}s`;
  }
};
