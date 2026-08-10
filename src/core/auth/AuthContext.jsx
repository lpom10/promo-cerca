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

    const verifyProfile = async (uid) => {
      const checkProfile = async () => {
        try {
          const [userSnap, empresaSnap, adminSnap] = await Promise.all([
            getDoc(doc(db, 'usuarios', uid)),
            getDoc(doc(db, 'empresa', uid)),
            getDoc(doc(db, 'admin', uid)),
          ]);

          return userSnap.exists() || empresaSnap.exists() || adminSnap.exists();
        } catch (error) {
          logError(error, { accion: 'verify_orphan_account', uid });
          return false;
        }
      };

      const firstTry = await checkProfile();
      if (firstTry) return true;

      await new Promise((resolve) => setTimeout(resolve, 1500));
      return await checkProfile();
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isMounted) return;

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        const hasProfile = await verifyProfile(firebaseUser.uid);

        if (!isMounted) return;

        if (!hasProfile) {
          try {
            await signOut(auth);
          } catch (error) {
            logError(error, { accion: 'signOut_orphan_account' });
          }
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(firebaseUser);
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
