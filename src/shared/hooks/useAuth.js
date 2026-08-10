import { useContext } from 'react';
import { AuthContext } from '../../core/auth/AuthContext';
import { useUserProfile } from '../../core/auth/useUserProfile';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }

  const profile = useUserProfile(context.user);

  return {
    ...context,
    ...profile,
    userType: profile.role,
    userDetails: profile.details,
    userStatus: profile.status,
  };
};