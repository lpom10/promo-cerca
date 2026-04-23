import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GestorPromociones from './GestorPromociones';
import GestorSuscripcion from './GestorSuscripcion';

const EmpresaDashboard = () => {
  const { user, userDetails, userStatus, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel de Empresa - {userDetails?.negocio}</h1>
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
      </div>

      {userStatus === 'pendiente' && (
        <div className="alert alert-warning">
          ⏳ Tu solicitud está pendiente de aprobación. Un administrador revisará tu negocio pronto.
        </div>
      )}

      {userStatus === 'rechazado' && (
        <div className="alert alert-danger">
          ❌ Tu solicitud fue rechazada. 
          {userDetails?.motivoRechazo && ` Motivo: ${userDetails.motivoRechazo}`}
        </div>
      )}

      {userStatus === 'aprobado' && (
        <>
          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === 'inicio' ? 'active' : ''}`}
              onClick={() => setActiveTab('inicio')}
            >
              🏠 Inicio
            </button>
            <button
              className={`tab ${activeTab === 'promociones' ? 'active' : ''}`}
              onClick={() => setActiveTab('promociones')}
            >
              📢 Mis Promociones
            </button>
            <button
              className={`tab ${activeTab === 'suscripcion' ? 'active' : ''}`}
              onClick={() => setActiveTab('suscripcion')}
            >
              💳 Suscripción
            </button>
            <button
              className={`tab ${activeTab === 'negocio' ? 'active' : ''}`}
              onClick={() => setActiveTab('negocio')}
            >
              🏪 Mi Negocio
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'inicio' && (
              <div className="welcome-section">
                <h2>¡Bienvenido, {userDetails?.nombre}!</h2>
                <div className="alert alert-success">
                  ✅ ¡Tu negocio está aprobado! Ya puedes crear y gestionar promociones.
                </div>
                <div className="dashboard-grid">
                  <div className="card">
                    <h3>📢 Crear Promoción</h3>
                    <p>Publica una nueva promoción para atraer clientes</p>
                    <button onClick={() => setActiveTab('promociones')} className="btn-primary">
                      Ir a Promociones
                    </button>
                  </div>
                  <div className="card">
                    <h3>💳 Suscripción</h3>
                    <p>Gestiona tu plan y acceso a promociones</p>
                    <button onClick={() => setActiveTab('suscripcion')} className="btn-primary">
                      Ir a Suscripción
                    </button>
                  </div>
                  <div className="card">
                    <h3>📊 Estadísticas</h3>
                    <p>Visualiza el rendimiento de tus promociones</p>
                    <button className="btn-primary" disabled>
                      Próximamente
                    </button>
                  </div>
                  <div className="card">
                    <h3>🏪 Mi Negocio</h3>
                    <p>Edita la información de tu empresa</p>
                    <button onClick={() => setActiveTab('negocio')} className="btn-primary">
                      Ir a Negocio
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'promociones' && <GestorPromociones />}

            {activeTab === 'suscripcion' && <GestorSuscripcion />}

            {activeTab === 'negocio' && (
              <div className="negocio-section">
                <h2>Información de tu Negocio</h2>
                <div className="negocio-info">
                  <div className="info-group">
                    <label>Nombre del Negocio:</label>
                    <p>{userDetails?.negocio}</p>
                  </div>
                  <div className="info-group">
                    <label>Categoría:</label>
                    <p>{userDetails?.categoria}</p>
                  </div>
                  <div className="info-group">
                    <label>Dirección:</label>
                    <p>{userDetails?.direccion}</p>
                  </div>
                  <div className="info-group">
                    <label>RUC:</label>
                    <p>{userDetails?.ruc}</p>
                  </div>
                  <div className="info-group">
                    <label>Email:</label>
                    <p>{userDetails?.email}</p>
                  </div>
                  <div className="info-group">
                    <label>Teléfono:</label>
                    <p>{userDetails?.telefono || 'No proporcionado'}</p>
                  </div>
                </div>
                <button className="btn-editar" disabled>
                  ✏️ Editar Información (Próximamente)
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {userStatus !== 'aprobado' && (
        <div className="waiting-section">
          <h3>Esperando aprobación...</h3>
          <p>
            Mientras tu solicitud es revisada, puedes preparar la información de tu negocio.
            Te notificaremos cuando sea aprobada.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmpresaDashboard;
