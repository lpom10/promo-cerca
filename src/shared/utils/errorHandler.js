

// Niveles de severidad
export const ERROR_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Mensajes seguros para mostrar al usuario
 */
const MENSAJES_SEGUROS = {
  'auth/email-already-in-use': 'Este email ya está registrado',
  'auth/weak-password': 'La contraseña es muy débil',
  'auth/invalid-email': 'El formato del email no es válido',
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  'permission-denied': 'No tienes permisos para esta acción',
  'not-found': 'Recurso no encontrado',
  'unavailable': 'Servicio no disponible. Intenta más tarde.',
  'internal': 'Ocurrió un error interno. Por favor, contacta al soporte.',
  'network-error': 'Error de conexión. Verifica tu internet.',
  'timeout': 'La solicitud tardó demasiado. Intenta de nuevo.',
};

/**
 * Log seguro de errores (sin exponer datos sensibles)
 */
export const logError = (error, contexto = {}, level = ERROR_LEVELS.ERROR) => {
  // En desarrollo, mostrar más detalles
  const isDev = import.meta.env.MODE === 'development';

  const errorInfo = {
    timestamp: new Date().toISOString(),
    level,
    contexto,
    message: error?.message || 'Error desconocido',
    stack: isDev ? error?.stack : undefined,
  };

  // En producción, registrar el error de forma explícita para no perder eventos críticos.
  if (isDev) {
    console[level === ERROR_LEVELS.CRITICAL ? 'error' : 'warn'](
      `[${level}] ${contexto.accion || 'Error'}:`,
      errorInfo
    );
  } else {
    console.error('[ERROR PRODUCCION]', { ...errorInfo, stack: undefined });
  }

  return errorInfo;
};

/**
 * Obtiene un mensaje seguro para mostrar al usuario
 */
export const obtenerMensajeSeguro = (error) => {
  if (!error) {
    return MENSAJES_SEGUROS['internal'];
  }

  // Buscar código de error en el mapa
  if (error.code && MENSAJES_SEGUROS[error.code]) {
    return MENSAJES_SEGUROS[error.code];
  }

  // Buscar en el mensaje
  for (const [key, mensaje] of Object.entries(MENSAJES_SEGUROS)) {
    if (error.message?.includes(key)) {
      return mensaje;
    }
  }

  // Mensajes comunes de Firestore
  if (error.message?.includes('permission')) {
    return MENSAJES_SEGUROS['permission-denied'];
  }

  if (error.message?.includes('not found')) {
    return MENSAJES_SEGUROS['not-found'];
  }

  if (error.message?.includes('unavailable')) {
    return MENSAJES_SEGUROS['unavailable'];
  }

  // Error genérico por defecto
  return MENSAJES_SEGUROS['internal'];
};

/**
 * Manejador centralizado de errores de API/Firebase
 */
export const handleError = (error, contexto = {}) => {
  const mensajeSeguro = obtenerMensajeSeguro(error);
  const level = error.critical ? ERROR_LEVELS.CRITICAL : ERROR_LEVELS.ERROR;

  logError(error, contexto, level);

  return {
    mensaje: mensajeSeguro,
    codigo: error.code || 'ERROR_DESCONOCIDO',
    shouldRetry: error.shouldRetry ?? false,
    contexto,
  };
};

/**
 * Valida si un error es recuperable
 */
export const esErrorRecuperable = (error) => {
  const codigosRecuperables = [
    'unavailable',
    'timeout',
    'network-error',
    'auth/too-many-requests',
  ];

  return (
    codigosRecuperables.includes(error?.code) ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('network')
  );
};

/**
 * Envuelve una función con manejo de errores
 */
export const conManejadorErrores = async (fn, contexto = {}) => {
  try {
    return await fn();
  } catch (error) {
    return {
      exito: false,
      error: handleError(error, contexto),
    };
  }
};
