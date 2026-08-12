import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useUserProfile } from '../../core/auth/useUserProfile';
import { useAuth } from '../../shared/hooks/useAuth';
import { Spinner } from '../../shared/ui';
import { PATHS } from './paths';
import { getDashboardPathByRole } from './dashboardPaths';
import { logError } from '../../shared/utils/errorHandler';

const RoleGuard = ({ allowedRoles, fallbackPath = null }) => {
  const { user, logout } = useAuth();
  const { role, loading } = useUserProfile(user);
  const navigate = useNavigate();
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (!loading && user && role === null && !hasLoggedOutRef.current) {
      hasLoggedOutRef.current = true;

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
  }, [loading, user, role, logout, navigate]);

  if (loading || (user && role === null)) {
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
