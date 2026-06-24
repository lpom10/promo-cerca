import { useAuth } from '../../shared/hooks/useAuth';

const StatusGuard = ({ children, requiredStatus }) => {
  const { userStatus } = useAuth();
  if (userStatus !== requiredStatus) return <p>Acceso denegado: Cuenta no verificada.</p>;
  return children;
};
export default StatusGuard;