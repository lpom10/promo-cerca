import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ListarPromociones from './ListarPromociones';

const ClienteDashboard = () => {
  const { user, userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('promociones');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Panel del Cliente - {userDetails?.nombre}</h1>
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'promociones' ? 'active' : ''}`}
          onClick={() => setActiveTab('promociones')}
        >
          📢 Promociones Disponibles
        </button>
        <button
          className={`tab ${activeTab === 'favoritas' ? 'active' : ''}`}
          onClick={() => setActiveTab('favoritas')}
        >
          ❤️ Mis Favoritas
        </button>
        <button
          className={`tab ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => setActiveTab('perfil')}
        >
          👤 Mi Perfil
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'promociones' && <ListarPromociones />}

        {activeTab === 'favoritas' && (
          <div className="favoritas-section">
            <h2>Mis Promociones Favoritas</h2>
            <p className="sin-promociones">Aún no tienes promociones guardadas como favoritas</p>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="perfil-section">
            <h2>Mi Perfil</h2>
            <div className="perfil-info">
              <div className="info-group">
                <label>Nombre Completo:</label>
                <p>{userDetails?.nombre}</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteDashboard;
