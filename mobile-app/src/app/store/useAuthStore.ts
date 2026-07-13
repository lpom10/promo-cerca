import { create } from 'zustand';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/core/config/firebase';

interface AuthState {
  user: User | null;
  isAuth: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  initializeAuthListener: () => () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  isLoading: false,
  isInitialized: false,
  
  setUser: (user) => set({ user, isAuth: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  initializeAuthListener: () => {
    // Escuchar cambios en la sesión de Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, isAuth: !!user, isInitialized: true });
    });
    
    // Retorna la función para desuscribirse cuando se desmonte
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // user y isAuth se actualizarán automáticamente gracias al listener
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
