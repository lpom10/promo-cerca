import { create } from 'zustand';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/core/config/firebase';

export type UserType = 'cliente' | 'empresa' | 'admin' | null;

interface AuthState {
  user: User | null;
  userType: UserType;
  userDetails: any;
  isAuth: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  initializeAuthListener: () => () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (tipo: 'cliente' | 'empresa', form: any) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userType: null,
  userDetails: null,
  isAuth: false,
  isLoading: true, // Start loading initially
  isInitialized: false,
  
  setUser: (user) => set({ user, isAuth: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  initializeAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      set({ isLoading: true });
      if (firebaseUser) {
        try {
          // 1. Buscar en 'usuarios' (Clientes)
          const clientDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (clientDoc.exists()) {
            set({
              user: firebaseUser,
              isAuth: true,
              userType: 'cliente',
              userDetails: clientDoc.data(),
              isInitialized: true,
              isLoading: false,
            });
            return;
          }
          
          // 2. Buscar en 'empresa' (Empresas)
          const enterpriseDoc = await getDoc(doc(db, 'empresa', firebaseUser.uid));
          if (enterpriseDoc.exists()) {
            set({
              user: firebaseUser,
              isAuth: true,
              userType: 'empresa',
              userDetails: enterpriseDoc.data(),
              isInitialized: true,
              isLoading: false,
            });
            return;
          }

          // 3. Buscar en 'admin' (Administradores)
          const adminDoc = await getDoc(doc(db, 'admin', firebaseUser.uid));
          if (adminDoc.exists()) {
            set({
              user: firebaseUser,
              isAuth: true,
              userType: 'admin',
              userDetails: adminDoc.data(),
              isInitialized: true,
              isLoading: false,
            });
            return;
          }

          // Si no está en ninguna, asumimos cliente básico sin doc
          set({
            user: firebaseUser,
            isAuth: true,
            userType: 'cliente',
            userDetails: null,
            isInitialized: true,
            isLoading: false,
          });

        } catch (error) {
          console.error("Error al obtener detalles del usuario:", error);
          set({
            user: firebaseUser,
            isAuth: true,
            userType: null,
            userDetails: null,
            isInitialized: true,
            isLoading: false,
          });
        }
      } else {
        set({ 
          user: null, 
          isAuth: false, 
          userType: null,
          userDetails: null,
          isInitialized: true, 
          isLoading: false 
        });
      }
    });
    
    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
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

  updateProfile: async (data: any) => {
    const { user, userType, userDetails } = get();
    if (!user) throw new Error("No user authenticated");
    if (!userType) throw new Error("Unknown user type");

    const collectionName = userType === 'empresa' ? 'empresa' : (userType === 'admin' ? 'admin' : 'usuarios');
    const userRef = doc(db, collectionName, user.uid);

    await updateDoc(userRef, data);

    // Update local state
    set({
      userDetails: {
        ...userDetails,
        ...data,
      }
    });
  },

  register: async (tipo, form) => {
    set({ isLoading: true });
    let firebaseUser = null;
    try {
      // 1. Verificar duplicados (Cédula o RUC) antes de crear la cuenta en Auth
      if (tipo === 'cliente' && form.cedula) {
        const q = query(collection(db, 'usuarios'), where('cedula', '==', form.cedula));
        const snap = await getDocs(q);
        if (!snap.empty) throw { code: 'auth/duplicate-cedula', message: 'Esta cédula ya está registrada' };
      } else if (tipo === 'empresa' && form.ruc) {
        const q = query(collection(db, 'empresa'), where('ruc', '==', form.ruc));
        const snap = await getDocs(q);
        if (!snap.empty) throw { code: 'auth/duplicate-ruc', message: 'Este RUC ya está registrado' };
      }

      // 2. Crear usuario en Firebase Auth
      const credencial = await createUserWithEmailAndPassword(auth, form.email, form.password);
      firebaseUser = credencial.user;

      // 3. Crear documento en Firestore
      const base = {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono || '',
        estado: tipo === 'empresa' ? 'pendiente' : 'aprobado',
        createdAt: new Date(),
        isMobileUser: true,
      };

      if (tipo === 'empresa') {
        const datosEmpresa = {
          ...base,
          negocio: form.negocio,
          categoria: form.categoria,
          direccion: form.direccion || '',
          ruc: form.ruc,
          lat: form.lat || null,
          lng: form.lng || null,
        };
        await setDoc(doc(db, 'empresa', firebaseUser.uid), datosEmpresa);
      } else {
        const datosCliente = {
          ...base,
          tipo: 'cliente',
          cedula: form.cedula,
          favoritos: [],
        };
        await setDoc(doc(db, 'usuarios', firebaseUser.uid), datosCliente);
      }
      
    } catch (error) {
      if (firebaseUser) {
        try { await firebaseUser.delete(); } catch (e) { console.error("Error borrando usuario huérfano", e); }
      }
      set({ isLoading: false });
      throw error;
    }
  }
}));
