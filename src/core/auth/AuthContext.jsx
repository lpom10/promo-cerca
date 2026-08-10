import React from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { Spinner } from '../../shared/ui';
import { logError } from '../../shared/utils/errorHandler';

const AuthContext = React.createContext(null);

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!isMounted) return;

        setUser(firebaseUser || null);
        setLoading(false);
      },
      (error) => {
        logError(error, { accion: 'auth_state_changed' });
        if (!isMounted) return;
        setUser(null);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      logError(error, { accion: 'logout' });
      throw error;
    }
  }, []);

  const value = React.useMemo(() => ({ user, loading, logout }), [user, loading, logout]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Spinner message="Verificando sesión..." /> : children}
    </AuthContext.Provider>
  );
};
