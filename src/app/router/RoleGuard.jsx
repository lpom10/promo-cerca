import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useUserProfile } from '../../core/auth/useUserProfile';
import { useAuth } from '../../shared/hooks/useAuth';
import { Spinner } from '../../shared/ui';
import { PATHS } from '../../router/paths';
import { getDashboardPathByRole } from '../../router/dashboardPaths';
import { logError } from '../../shared/utils/errorHandler';

const RoleGuard = ({ allowedRoles, fallbackPath = null }) => {
  const { user, logout } = useAuth();
  const { role, loading } = useUserProfile(user);
  const navigate = useNavigate();
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  useEffect(() => {
    if (!loading && user && role === null && !hasLoggedOut) {
      setHasLoggedOut(true);

      const handleInvalidRole = async () => {
        try {
          await logout();
        } catch (error) {
          logError(error, { accion: 'RoleGuard_logout' });
        } finally {
          navigate(PATHS.login, { replace: true });
        }
      };

      handleInvalidRole();
    }
  }, [loading, user, role, logout, navigate, hasLoggedOut]);

  if (loading || (user && role === null && !hasLoggedOut)) {
    return <Spinner fullScreen />;
  }

  if (!user) {
    return <Navigate to={PATHS.login} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath || getDashboardPathByRole(role) || PATHS.home} replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
