import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

const AdminDashboard = () => {
  const { user, userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('solicitudes');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      // Buscar empresas en estado 'pendiente'
      const q = query(
        collection(db, 'usuarios'),
        where('tipo', '==', 'empresa'),
        where('estado', '==', 'pendiente')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSolicitudes(data);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const aprobarSolicitud = async (empresaId) => {
    try {
      await updateDoc(doc(db, 'usuarios', empresaId), {
        estado: 'aprobado'
      });
      setSolicitudes(solicitudes.filter(s => s.id !== empresaId));
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
    }
  };

  const rechazarSolicitud = async (empresaId, motivo) => {
    try {
      await updateDoc(doc(db, 'usuarios', empresaId), {
        estado: 'rechazado',
        motivoRechazo: motivo
      });
      setSolicitudes(solicitudes.filter(s => s.id !== empresaId));
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administrador</h1>
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'solicitudes' ? 'active' : ''}`}
          onClick={() => setActiveTab('solicitudes')}
        >
          📋 Solicitudes Pendientes ({solicitudes.length})
        </button>
        <button 
          className={`tab ${activeTab === 'empresas' ? 'active' : ''}`}
          onClick={() => setActiveTab('empresas')}
        >
          🏢 Empresas Aprobadas
        </button>
        <button 
          className={`tab ${activeTab === 'suscripciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('suscripciones')}
        >
          💳 Suscripciones
        </button>
        <button 
          className={`tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => setActiveTab('estadisticas')}
        >
          📊 Estadísticas
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'solicitudes' && (
          <div className="solicitudes-section">
            <h2>Solicitudes Pendientes de Aprobación</h2>
            
            {loading ? (
              <p>Cargando...</p>
            ) : solicitudes.length === 0 ? (
              <p className="info-texto">No hay solicitudes pendientes</p>
            ) : (
              <div className="solicitudes-list">
                {solicitudes.map(solicitud => (
                  <div key={solicitud.id} className="solicitud-card">
                    <div className="solicitud-info">
                      <h3>{solicitud.negocio}</h3>
                      <p><strong>Propietario:</strong> {solicitud.nombre}</p>
                      <p><strong>Email:</strong> {solicitud.email}</p>
                      <p><strong>Teléfono:</strong> {solicitud.telefono || 'No proporcionado'}</p>
                      <p><strong>Categoría:</strong> {solicitud.categoria}</p>
                      <p><strong>Dirección:</strong> {solicitud.direccion}</p>
                      <p><strong>RUC:</strong> {solicitud.ruc}</p>
                      <p><strong>Fecha de registro:</strong> {new Date(solicitud.createdAt.toDate()).toLocaleDateString()}</p>
                    </div>
                    <div className="solicitud-actions">
                      <button 
                        onClick={() => aprobarSolicitud(solicitud.id)}
                        className="btn-approve"
                      >
                        ✅ Aprobar
                      </button>
                      <button 
                        onClick={() => {
                          const motivo = prompt('¿Cuál es el motivo del rechazo?');
                          if (motivo) rechazarSolicitud(solicitud.id, motivo);
                        }}
                        className="btn-reject"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'empresas' && (
          <div className="empresas-section">
            <h2>Empresas Aprobadas</h2>
            <p>Aquí verás las empresas aprobadas</p>
          </div>
        )}

        {activeTab === 'suscripciones' && (
          <div className="suscripciones-section">
            <h2>Gestión de Suscripciones</h2>
            <p>Aquí verás las suscripciones activas</p>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="estadisticas-section">
            <h2>Estadísticas del Sistema</h2>
            <p>Aquí verás las estadísticas generales</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
