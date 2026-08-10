export const obtenerEstadoInicialPromocion = (datosPromocion = {}) => {
  if (typeof datosPromocion.estado === 'string' && datosPromocion.estado.trim()) {
    return datosPromocion.estado;
  }

  return 'pendiente';
};

export const obtenerActivaPorEstado = (estado) => estado === 'aprobado';
