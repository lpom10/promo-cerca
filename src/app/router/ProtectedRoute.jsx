import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUserProfile } from '../../core/auth/useUserProfile';
import { useAuth } from '../../shared/hooks/useAuth';
import { Spinner } from '../../shared/ui';
import { PATHS } from '../../router/paths';

const ProtectedRoute = ({ redirectTo = PATHS.login }) => {
  const { user, logout, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useUserProfile(user);
  const location = useLocation();
  const navigate = useNavigate();
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (!loading && user && role === null && !hasLoggedOut) {
      setHasLoggedOut(true);
      logout()
        .catch(() => {})
        .finally(() => {
          navigate(PATHS.login, { replace: true });
        });
    }
  }, [loading, user, role, logout, navigate, hasLoggedOut]);

  if (loading || (user && role === null && !hasLoggedOut)) {
    return <Spinner fullScreen />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
