/**
 * Utilidades de seguridad para el navegador
 */

/**
 * Establece los meta tags de seguridad del navegador
 */
export const setupSecurityHeaders = () => {
  // Content Security Policy
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com https://*.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://firebase.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com",
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.firebase.com",
  ].join('; ');

  // X-UA-Compatible
  const uaMeta = document.createElement('meta');
  uaMeta.httpEquiv = 'X-UA-Compatible';
  uaMeta.content = 'IE=edge';

  // Referrer Policy
  const refMeta = document.createElement('meta');
  refMeta.name = 'referrer';
  refMeta.content = 'strict-origin-when-cross-origin';

  // Permissions Policy
  const permMeta = document.createElement('meta');
  permMeta.httpEquiv = 'Permissions-Policy';
  permMeta.content = 'geolocation=(self), microphone=(), camera=()';

  document.head.appendChild(cspMeta);
  document.head.appendChild(uaMeta);
  document.head.appendChild(refMeta);
  document.head.appendChild(permMeta);
};

/**
 * Previene ataques de clickjacking
 */
export const setupClickjackingProtection = () => {
  if (window.self !== window.top) {
    window.top.location = window.self.location;
  }
};

/**
 * Deshabilita características potencialmente peligrosas
 */
export const disableDangerousFeatures = () => {
  // Deshabilitar drag and drop de archivos en ciertos contextos
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
  });

  // Deshabilitar menú de contexto en modo producción
  if (import.meta.env.MODE === 'production') {
    document.addEventListener('contextmenu', (e) => {
      // Permitir en inputs
      if (!e.target.matches('input, textarea, [contenteditable]')) {
        e.preventDefault();
      }
    });
  }
};

/**
 * Genera un nonce para scripts inline
 */
export const generateNonce = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Detecta y previene XSS
 */
export const detectXSSAttempt = (input) => {
  const xssPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
};

/**
 * Limpia strings para prevenir HTML injection
 */
export const sanitizeHTML = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  return tempDiv.innerHTML;
};