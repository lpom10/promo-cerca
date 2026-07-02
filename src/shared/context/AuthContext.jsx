import React from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Spinner } from '../ui';

const AuthContext = React.createContext();

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [userType, setUserType] = React.useState(null);
  const [userDetails, setUserDetails] = React.useState(null);
  const [userStatus, setUserStatus] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Intentar detectar el tipo de usuario y obtener sus datos
        try {
          // Hacer las tres lecturas en paralelo para reducir latencia
          const [clientDoc, enterpriseDoc, adminDoc] = await Promise.all([
            getDoc(doc(db, 'usuarios', firebaseUser.uid)),
            getDoc(doc(db, 'empresa', firebaseUser.uid)),
            getDoc(doc(db, 'admin', firebaseUser.uid)),
          ]);

          if (clientDoc.exists()) {
            setUserType('cliente');
            setUserDetails(clientDoc.data());
            setUserStatus(clientDoc.data().estado || 'aprobado');
          } else if (enterpriseDoc.exists()) {
            setUserType('empresa');
            setUserDetails(enterpriseDoc.data());
            setUserStatus(enterpriseDoc.data().estado);
          } else if (adminDoc.exists()) {
            setUserType('admin');
            setUserDetails(adminDoc.data());
            setUserStatus('aprobado');
          } else {
            setUserType(null);
            setUserDetails(null);
            setUserStatus(null);
          }
        } catch (error) {
          console.error("Error al obtener detalles del usuario:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserType(null);
        setUserDetails(null);
        setUserStatus(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  const refreshUserDetails = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    try {
      const [clientDoc, enterpriseDoc, adminDoc] = await Promise.all([
        getDoc(doc(db, 'usuarios', firebaseUser.uid)),
        getDoc(doc(db, 'empresa', firebaseUser.uid)),
        getDoc(doc(db, 'admin', firebaseUser.uid)),
      ]);

      if (clientDoc.exists()) {
        setUserType('cliente');
        setUserDetails(clientDoc.data());
        setUserStatus(clientDoc.data().estado || 'aprobado');
      } else if (enterpriseDoc.exists()) {
        setUserType('empresa');
        setUserDetails(enterpriseDoc.data());
        setUserStatus(enterpriseDoc.data().estado);
      } else if (adminDoc.exists()) {
        setUserType('admin');
        setUserDetails(adminDoc.data());
        setUserStatus('aprobado');
      }
    } catch (error) {
      console.error('Error al refrescar detalles del usuario', error);
    }
  };

  const value = {
    user,
    userType,
    userDetails,
    userStatus,
    loading,
    logout,
    refreshUserDetails,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Spinner message="Verificando sesión..." /> : children}
    </AuthContext.Provider>
  );
};