import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { PATHS } from '../paths';

const RoleGuard = ({ children, allowedRoles }) => {
  const { userType } = useAuth();
  if (!allowedRoles.includes(userType)) {
    return <Navigate to={PATHS.home} replace />;
  }
  return children;
};
export default RoleGuard;