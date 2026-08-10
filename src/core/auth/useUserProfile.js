import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { logError } from '../../shared/utils/errorHandler';

const DEFAULT_PROFILE = {
  role: null,
  details: null,
  status: null,
  loading: true,
  error: null,
};

export const useUserProfile = (user = null) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(DEFAULT_PROFILE);
      return undefined;
    }

    let isMounted = true;
    let unsubscribe = null;

    const applyProfile = (role, details, status = null) => {
      if (!isMounted) return;
      setProfile({
        role,
        details,
        status,
        loading: false,
        error: null,
      });
    };

    const loadProfile = async () => {
      setProfile((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [clientSnap, companySnap, adminSnap] = await Promise.all([
          getDoc(doc(db, 'usuarios', user.uid)),
          getDoc(doc(db, 'empresa', user.uid)),
          getDoc(doc(db, 'admin', user.uid)),
        ]);

        if (!isMounted) return;

        if (clientSnap.exists()) {
          const data = clientSnap.data();
          applyProfile('cliente', data, data.estado || 'aprobado');
          return;
        }

        if (companySnap.exists()) {
          const data = companySnap.data();
          applyProfile('empresa', data, data.estado || 'pendiente');
          return;
        }

        if (adminSnap.exists()) {
          applyProfile('admin', adminSnap.data(), 'aprobado');
          return;
        }

        applyProfile(null, null, null);
      } catch (error) {
        if (!isMounted) return;
        logError(error, { accion: 'useUserProfile' });
        setProfile({ ...DEFAULT_PROFILE, loading: false, error: error.message || 'Error al cargar el perfil' });
      }
    };

    const subscribe = () => {
      const clientRef = doc(db, 'usuarios', user.uid);
      const companyRef = doc(db, 'empresa', user.uid);
      const adminRef = doc(db, 'admin', user.uid);

      const unsubscribeClient = onSnapshot(clientRef, (snap) => {
        if (snap.exists()) {
          applyProfile('cliente', snap.data(), snap.data().estado || 'aprobado');
        }
      }, (error) => {
        logError(error, { accion: 'snapshotUserProfile_cliente' });
      });

      const unsubscribeCompany = onSnapshot(companyRef, (snap) => {
        if (snap.exists()) {
          applyProfile('empresa', snap.data(), snap.data().estado || 'pendiente');
        }
      }, (error) => {
        logError(error, { accion: 'snapshotUserProfile_empresa' });
      });

      const unsubscribeAdmin = onSnapshot(adminRef, (snap) => {
        if (snap.exists()) {
          applyProfile('admin', snap.data(), 'aprobado');
        }
      }, (error) => {
        logError(error, { accion: 'snapshotUserProfile_admin' });
      });

      unsubscribe = () => {
        unsubscribeClient();
        unsubscribeCompany();
        unsubscribeAdmin();
      };
    };

    loadProfile();
    subscribe();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  return useMemo(() => profile, [profile]);
};
