// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase (reemplaza con tus claves reales de Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDndgGJAu9_LKb4XWfdPM5HQrYB4Vbdhsk",
  authDomain: "promo-cerca-26495.firebaseapp.com",
  projectId: "promo-cerca-26495",
  storageBucket: "promo-cerca-26495.firebasestorage.app",
  messagingSenderId: "789930623196",
  appId: "1:789930623196:web:1da51efe73bbf7216f3419"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;