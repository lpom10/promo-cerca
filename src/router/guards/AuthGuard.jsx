import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { Spinner } from '../../shared/ui';
import { PATHS } from '../paths';

const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullScreen />;
  if (!user) return <Navigate to={PATHS.login} replace />;
  return children;
};
export default AuthGuard;