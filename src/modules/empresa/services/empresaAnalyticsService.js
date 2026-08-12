import { logError } from '../../../shared/utils/errorHandler';
import { fetchDocsByField } from '../../../shared/services/firestoreUtils';

const normalizeNumber = (value) => Number(value || 0);

const getTicketState = (ticket) => {
  const estado = ticket?.estado || 'activo';
  if (estado === 'canjeado') return 'canjeado';
  if (estado === 'expirado') return 'expirado';
  if (estado === 'cancelado') return 'cancelado';
  return 'activo';
};

export const obtenerAnalyticsEmpresa = async (empresaId) => {
  try {
    if (!empresaId) throw new Error('Empresa ID es requerido');

    const [promociones, tickets] = await Promise.all([
      fetchDocsByField('promociones', 'empresaId', empresaId),
      fetchDocsByField('tickets', 'empresaId', empresaId),
    ]);

    const ticketsEmitidos = tickets.length;
    const ticketsCanjeados = tickets.filter((ticket) => getTicketState(ticket) === 'canjeado').length;
    const ticketsActivos = tickets.filter((ticket) => getTicketState(ticket) === 'activo').length;
    const ticketsExpirados = tickets.filter((ticket) => getTicketState(ticket) === 'expirado').length;

    const ingresosBrutos = tickets
      .filter((ticket) => getTicketState(ticket) === 'canjeado')
      .reduce((sum, ticket) => sum + normalizeNumber(ticket.precioDescuento || ticket.precioOriginal || 0), 0);

    const comisiones = tickets
      .filter((ticket) => getTicketState(ticket) === 'canjeado')
      .reduce((sum, ticket) => sum + normalizeNumber(ticket.comisionPlataforma || 0), 0);

    const margenEmpresa = tickets
      .filter((ticket) => getTicketState(ticket) === 'canjeado')
      .reduce((sum, ticket) => sum + normalizeNumber(ticket.margenEmpresa || 0), 0);

    const ingresoNeto = ingresosBrutos - comisiones;
    const conversionRate = ticketsEmitidos ? (ticketsCanjeados / ticketsEmitidos) * 100 : 0;

    const promocionesConMetricas = promociones.map((promo) => {
      const promoTickets = tickets.filter((ticket) => ticket.promocionId === promo.id);
      const emitidos = promoTickets.length;
      const canjeados = promoTickets.filter((ticket) => getTicketState(ticket) === 'canjeado').length;
      const ingresos = promoTickets
        .filter((ticket) => getTicketState(ticket) === 'canjeado')
        .reduce((sum, ticket) => sum + normalizeNumber(ticket.precioDescuento || ticket.precioOriginal || 0), 0);

      const margen = promoTickets
        .filter((ticket) => getTicketState(ticket) === 'canjeado')
        .reduce((sum, ticket) => sum + normalizeNumber(ticket.margenEmpresa || 0), 0);

      const tasaCanje = emitidos ? (canjeados / emitidos) * 100 : 0;
      const rentable = margen > 0 && tasaCanje >= 10;

      return {
        ...promo,
        ticketsEmitidos: emitidos,
        ticketsCanjeados: canjeados,
        ingresosGenerados: Number(ingresos.toFixed(2)),
        margenEmpresa: Number(margen.toFixed(2)),
        tasaCanje: Number(tasaCanje.toFixed(2)),
        rentable,
        estadoPromocion: promo.estado || 'activo',
      };
    });

    return {
      empresaId,
      ingresosBrutos: Number(ingresosBrutos.toFixed(2)),
      ingresosNetos: Number(ingresoNeto.toFixed(2)),
      margenEmpresa: Number(margenEmpresa.toFixed(2)),
      ticketsEmitidos,
      ticketsCanjeados,
      ticketsActivos,
      ticketsExpirados,
      conversionRate: Number(conversionRate.toFixed(2)),
      promociones: promocionesConMetricas,
      promocionesActivas: promociones.filter((promo) => (promo.estado || 'activo') === 'activo').length,
    };
  } catch (error) {
    logError(error, { accion: 'obtenerAnalyticsEmpresa', empresaId });
    throw error;
  }
};

export const obtenerMetricasPromocion = async (promocionId) => {
  try {
    if (!promocionId) throw new Error('Promoción ID es requerido');

    const tickets = await fetchDocsByField('tickets', 'promocionId', promocionId);
    const emitidos = tickets.length;
    const canjeados = tickets.filter((ticket) => getTicketState(ticket) === 'canjeado').length;
    const ingresos = tickets
      .filter((ticket) => getTicketState(ticket) === 'canjeado')
      .reduce((sum, ticket) => sum + normalizeNumber(ticket.precioDescuento || ticket.precioOriginal || 0), 0);
    const margen = tickets
      .filter((ticket) => getTicketState(ticket) === 'canjeado')
      .reduce((sum, ticket) => sum + normalizeNumber(ticket.margenEmpresa || 0), 0);
    const tasaCanje = emitidos ? (canjeados / emitidos) * 100 : 0;

    return {
      promocionId,
      ticketsEmitidos: emitidos,
      ticketsCanjeados: canjeados,
      ingresosGenerados: Number(ingresos.toFixed(2)),
      margenEmpresa: Number(margen.toFixed(2)),
      tasaCanje: Number(tasaCanje.toFixed(2)),
      rentable: margen > 0 && tasaCanje >= 10,
    };
  } catch (error) {
    logError(error, { accion: 'obtenerMetricasPromocion', promocionId });
    throw error;
  }
};
