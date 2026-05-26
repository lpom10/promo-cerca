/**
 * Rate limiter en cliente para prevenir spam y ataques de fuerza bruta
 * Nota: Esto es una primera línea de defensa. La verdadera protección está en el servidor.
 */

class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.blocked = new Map();
  }

  /**
   * Registra un intento para una acción específica
   * @param {string} key - Identificador único (ej: "login_user@email.com")
   * @param {number} maxAttempts - Máximo de intentos permitidos
   * @param {number} windowMs - Ventana de tiempo en ms
   * @returns {object} - { permitido: boolean, intentosRestantes: number, esperarMs: number }
   */
  check(key, maxAttempts = 5, windowMs = 60000) {
    const ahora = Date.now();
    
    // Verificar si está bloqueado
    if (this.blocked.has(key)) {
      const desbloqueoEn = this.blocked.get(key);
      if (ahora < desbloqueoEn) {
        return {
          permitido: false,
          intentosRestantes: 0,
          esperarMs: desbloqueoEn - ahora,
          mensaje: `Demasiados intentos. Intenta más tarde.`,
        };
      } else {
        this.blocked.delete(key);
      }
    }

    // Obtener historial de intentos
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const intentos = this.attempts.get(key);
    
    // Limpiar intentos antiguos fuera de la ventana
    const intentosValidos = intentos.filter((ts) => ahora - ts < windowMs);
    
    if (intentosValidos.length >= maxAttempts) {
      // Bloquear por 5 minutos
      const bloqueoPor = 5 * 60 * 1000;
      this.blocked.set(key, ahora + bloqueoPor);
      this.attempts.delete(key);
      
      return {
        permitido: false,
        intentosRestantes: 0,
        esperarMs: bloqueoPor,
        mensaje: `Demasiados intentos. Bloqueado por 5 minutos.`,
      };
    }

    // Registrar nuevo intento
    intentosValidos.push(ahora);
    this.attempts.set(key, intentosValidos);

    return {
      permitido: true,
      intentosRestantes: maxAttempts - intentosValidos.length,
      esperarMs: 0,
      mensaje: null,
    };
  }

  /**
   * Resetea los intentos para una clave
   */
  reset(key) {
    this.attempts.delete(key);
    this.blocked.delete(key);
  }

  /**
   * Limpia intentos antiguos (ejecutar periódicamente)
   */
  limpiar() {
    const ahora = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hora

    for (const [key, intentos] of this.attempts) {
      const intentosValidos = intentos.filter((ts) => ahora - ts < windowMs);
      if (intentosValidos.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, intentosValidos);
      }
    }

    // Limpiar bloqueos expirados
    for (const [key, desbloqueoEn] of this.blocked) {
      if (ahora > desbloqueoEn) {
        this.blocked.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Ejecutar limpieza cada 30 minutos
setInterval(() => rateLimiter.limpiar(), 30 * 60 * 1000);
