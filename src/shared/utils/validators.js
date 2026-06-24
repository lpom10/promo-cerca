/**
 * Validadores y sanitizadores seguros para inputs de usuario
 */

/**
 * Valida formato de email
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string') return false;
  return regex.test(email) && email.length <= 254;
};

/**
 * Valida contraseña con requisitos de seguridad
 */
export const validarPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      valida: false,
      error: 'La contraseña es requerida',
    };
  }

  if (password.length < 8) {
    return { valida: false, error: 'Mínimo 8 caracteres' };
  }

  if (password.length > 128) {
    return { valida: false, error: 'Máximo 128 caracteres' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|\-_]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      valida: false,
      error: 'Debe incluir mayúscula, minúscula, número y carácter especial',
    };
  }

  return { valida: true, error: null };
};

/**
 * Valida número telefónico (10 dígitos para Ecuador)
 */
export const validarTelefono = (telefono) => {
  if (!telefono || typeof telefono !== 'string') return false;
  const regex = /^\d{10}$/;
  return regex.test(telefono.replace(/\D/g, ''));
};

/**
 * Valida cédula ecuatoriana (10 dígitos)
 */
export const validarCedula = (cedula) => {
  if (!cedula || typeof cedula !== 'string') return false;
  const regex = /^\d{10}$/;
  return regex.test(cedula.replace(/\D/g, ''));
};

/**
 * Valida RUC ecuatoriano (13 dígitos)
 */
export const validarRuc = (ruc) => {
  if (!ruc || typeof ruc !== 'string') return false;
  const regex = /^\d{13}$/;
  return regex.test(ruc.replace(/\D/g, ''));
};

/**
 * Sanitiza strings para prevenir XSS básico
 */
export const sanitizar = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .substring(0, 500) // Limitar longitud
    .replace(/[<>]/g, '') // Remover caracteres peligrosos
    .replace(/javascript:/gi, '') // Prevenir javascript: URIs
    .replace(/on\w+\s*=/gi, ''); // Remover event handlers
};

/**
 * Sanitiza números (remover caracteres no numéricos)
 */
export const sanitizarNumero = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/\D/g, '');
};

/**
 * Valida objeto de ubicación geográfica
 */
export const validarUbicacion = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return { valida: false, error: 'Coordenadas inválidas' };
  }

  if (latNum < -90 || latNum > 90) {
    return { valida: false, error: 'Latitud fuera de rango' };
  }

  if (lngNum < -180 || lngNum > 180) {
    return { valida: false, error: 'Longitud fuera de rango' };
  }

  return { valida: true, error: null };
};

/**
 * Valida que dos strings coincidan (para confirmación de contraseña, etc.)
 */
export const validarCoincidencia = (value1, value2, campo = 'campos') => {
  if (value1 !== value2) {
    return {
      valida: false,
      error: `Los ${campo} no coinciden`,
    };
  }
  return { valida: true, error: null };
};

/**
 * Validador genérico para strings requeridos
 */
export const validarRequerido = (value, nombreCampo = 'Campo') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return {
      valida: false,
      error: `${nombreCampo} es requerido`,
    };
  }
  return { valida: true, error: null };
};

/**
 * Valida longitud de string
 */
export const validarLongitud = (value, min = 0, max = 255, nombreCampo = 'Campo') => {
  const longitud = value ? value.toString().length : 0;

  if (longitud < min) {
    return {
      valida: false,
      error: `${nombreCampo} debe tener al menos ${min} caracteres`,
    };
  }

  if (longitud > max) {
    return {
      valida: false,
      error: `${nombreCampo} no puede exceder ${max} caracteres`,
    };
  }

  return { valida: true, error: null };
};
