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
          // Obtener datos adicionales de Firestore
          const userDocRef = doc(db, 'usuarios', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserType(data.tipo);
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