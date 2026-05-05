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
    // Verificar que no exista un ticket activo para esta promoción
    const q = query(
      collection(db, 'tickets'),
      where('usuarioId', '==', usuarioId),
      where('promocionId', '==', promocionId),
      where('estado', '==', 'generado')
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error('Ya tienes un ticket activo para esta promoción');
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
    
    return { id: docRef.id, ...ticket };
  } catch (error) {
    console.error('Error creando ticket:', error);
    throw error;
  }
};

// Obtener ticket por código (para validar en local)
export const obtenerTicketPorCodigo = async (codigo) => {
  try {
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
    console.error('Error obteniendo ticket:', error);
    throw error;
  }
};

// Canjear ticket
export const canjearTicket = async (ticketId, empresaId) => {
  try {
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
    console.error('Error canjeando ticket:', error);
    throw error;
  }
};

// Obtener tickets de usuario
export const obtenerTicketsUsuario = async (usuarioId) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('usuarioId', '==', usuarioId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error obteniendo tickets:', error);
    throw error;
  }
};

// Obtener tickets de empresa (para validar en local)
export const obtenerTicketsEmpresa = async (empresaId) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('empresaId', '==', empresaId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error obteniendo tickets empresa:', error);
    throw error;
  }
};

// Registrar visualización de promoción
export const registrarVisualizacion = async (promocionId, empresaId, usuarioId = null) => {
  try {
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
    console.error('Error registrando visualización:', error);
    // No lanzar error, es secundario
  }
};

// Obtener promociones trending
export const obtenerPromocionesTrending = async (limite = 5) => {
  try {
    const q = query(
      collection(db, 'promociones'),
      where('activa', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Ordenar por visualizaciones
    return promos
      .sort((a, b) => (b.visualizaciones || 0) - (a.visualizaciones || 0))
      .slice(0, limite);
  } catch (error) {
    console.error('Error obteniendo trending:', error);
    throw error;
  }
};

// Obtener estadísticas de vistas por periodo
export const obtenerEstadisticasVistas = async (promocionId, dias = 7) => {
  try {
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
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};
