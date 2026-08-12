import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { logError } from '../../shared/utils/errorHandler';

const DEFAULT_PROFILE = {
  role: null,
  details: null,
  status: null,
  loading: true,
  error: null,
};

const getRoleFromCollection = (collectionName) => {
  switch (collectionName) {
    case 'usuarios':
      return 'cliente';
    case 'empresa':
      return 'empresa';
    case 'admin':
      return 'admin';
    default:
      return null;
  }
};

export const useUserProfile = (user = null) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    if (!user?.uid) {
      Promise.resolve().then(() => {
        setProfile(DEFAULT_PROFILE);
      });
      return undefined;
    }

    let isMounted = true;
    let unsubscribe = null;

    const setProfileState = (role, details, status = null, error = null) => {
      if (!isMounted) return;
      setProfile({
        role,
        details,
        status,
        loading: false,
        error,
      });
    };

    const subscribeToCollection = (collectionName) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }

      const ref = doc(db, collectionName, user.uid);
      unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (!isMounted) return;

          if (snap.exists()) {
            const data = snap.data();
            const role = getRoleFromCollection(collectionName);
            const status = collectionName === 'empresa'
              ? data.estado || 'pendiente'
              : data.estado || 'aprobado';

            setProfileState(role, data, status);
            return;
          }

          if (collectionName === 'usuarios') {
            subscribeToCollection('empresa');
            return;
          }

          if (collectionName === 'empresa') {
            subscribeToCollection('admin');
            return;
          }

          setProfileState(null, null, null);
        },
        (error) => {
          logError(error, { accion: `snapshotUserProfile_${collectionName}` });
          if (!isMounted) return;

          if (collectionName === 'usuarios') {
            subscribeToCollection('empresa');
            return;
          }

          if (collectionName === 'empresa') {
            subscribeToCollection('admin');
            return;
          }

          setProfileState(null, null, null, error.message || 'Error al cargar el perfil');
        }
      );
    };

    Promise.resolve().then(() => {
      setProfile((prev) => ({ ...prev, loading: true, error: null }));
    });
    subscribeToCollection('usuarios');

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  return useMemo(() => profile, [profile]);
};
