import React from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = React.createContext();

export { AuthContext };

export const useAuth = () => React.useContext(AuthContext);

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
          // 1. Buscar en 'usuarios' (Clientes)
          const clientDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (clientDoc.exists()) {
            setUserType('cliente');
            setUserDetails(clientDoc.data());
            setUserStatus(clientDoc.data().estado || 'aprobado');
          } else {
            // 2. Buscar en 'empresa' (Empresas)
            const enterpriseDoc = await getDoc(doc(db, 'empresa', firebaseUser.uid));
            if (enterpriseDoc.exists()) {
              setUserType('empresa');
              setUserDetails(enterpriseDoc.data());
              setUserStatus(enterpriseDoc.data().estado);
            } else {
              // 3. Buscar en 'admin' (Administradores)
              const adminDoc = await getDoc(doc(db, 'admin', firebaseUser.uid));
              if (adminDoc.exists()) {
                setUserType('admin');
                setUserDetails(adminDoc.data());
                setUserStatus('aprobado');
              } else {
                setUserType(null);
                setUserDetails(null);
                setUserStatus(null);
              }
            }
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

  const value = {
    user,
    userType,
    userDetails,
    userStatus,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};