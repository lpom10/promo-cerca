/**
 * Archivo de configuración de environment variables
 * Validar que todas las variables requeridas están presentes
 */

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

/**
 * Valida que todas las variables de entorno requeridas están presentes
 */
export const validateEnvVars = () => {
  const missing = [];

  requiredEnvVars.forEach((varName) => {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0 && import.meta.env.MODE === 'production') {
    throw new Error('Configuración incompleta. No se puede iniciar la aplicación.');
  }
};

/**
 * Obtiene una variable de entorno de forma segura
 */
export const getEnvVar = (key, defaultValue = null) => import.meta.env[key] || defaultValue;
