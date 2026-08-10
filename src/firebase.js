import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

if (typeof window !== 'undefined' && import.meta.env.VITE_APP_CHECK_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // App Check opcional; no interrumpir el arranque.
  }
}

// Servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
import { getStorage } from 'firebase/storage';

// Initialize Firebase Storage
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

export default app;