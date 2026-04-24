import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'admin' | 'cliente' | 'empresa'
  const [userStatus, setUserStatus] = useState(null); // 'pendiente' | 'aprobado' | 'rechazado'
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Obtener datos adicionales de Firestore según el tipo
          let userDocSnap = null;
          let userType = null;
          
          // Intentar buscar en colección usuarios (clientes)
          userDocSnap = await getDoc(doc(db, 'usuarios', currentUser.uid));
          if (userDocSnap.exists()) {
            userType = 'cliente';
          } else {
            // Intentar buscar en colección empresa
            userDocSnap = await getDoc(doc(db, 'empresa', currentUser.uid));
            if (userDocSnap.exists()) {
              userType = 'empresa';
            } else {
              // Intentar buscar en colección admin
              userDocSnap = await getDoc(doc(db, 'admin', currentUser.uid));
              if (userDocSnap.exists()) {
                userType = 'admin';
              }
            }
          }
          
          if (userDocSnap && userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserType(userType);
            setUserStatus(data.estado || 'aprobado');
            setUserDetails(data);
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      } else {
        setUserType(null);
        setUserStatus(null);
        setUserDetails(null);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUserType(null);
    setUserStatus(null);
    setUserDetails(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userType, 
      userStatus, 
      userDetails,
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};