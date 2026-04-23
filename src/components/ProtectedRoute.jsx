import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredUserType, requiredStatus = null }) => {
  const { user, userType, userStatus, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login-tipo" replace />;
  }

  // Verificar tipo de usuario si es requerido
  if (requiredUserType) {
    const types = Array.isArray(requiredUserType) ? requiredUserType : [requiredUserType];
    if (!types.includes(userType)) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Acceso denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      );
    }
  }

  // Verificar estado del usuario si es requerido (ej: empresa debe estar aprobada)
  if (requiredStatus && userStatus !== requiredStatus) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Acceso limitado</h2>
        <p>Tu cuenta está en estado: <strong>{userStatus}</strong></p>
        <p>Espera a que sea aprobada para acceder a esta sección.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
