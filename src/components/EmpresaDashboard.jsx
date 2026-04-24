import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GestorPromociones from './GestorPromociones';
import GestorSuscripcion from './GestorSuscripcion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EmpresaDashboard = () => {
  const { user, userDetails, userStatus, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    negocio: '',
    categoria: '',
    direccion: '',
    telefono: '',
    descripcion: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userDetails) {
      setFormData({
        negocio: userDetails.negocio || '',
        categoria: userDetails.categoria || '',
        direccion: userDetails.direccion || '',
        telefono: userDetails.telefono || '',
        descripcion: userDetails.descripcion || '',
      });
    }
  }, [userDetails]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'empresa', user.uid), {
        negocio: formData.negocio,
        categoria: formData.categoria,
        direccion: formData.direccion,
        telefono: formData.telefono,
        descripcion: formData.descripcion,
      });
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando:', error);
      alert('Hubo un error al guardar los datos.');
    }
    setSaving(false);
  };

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Información de tu Negocio</h2>
                  {!editMode && (
                    <button className="btn-editar" onClick={() => setEditMode(true)}>
                      ✏️ Editar Información
                    </button>
                  )}
                </div>

                <div className="negocio-info" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  <div className="perfil-avatar" style={{ flexBasis: '150px', textAlign: 'center' }}>
                    <div style={{ fontSize: '100px', lineHeight: '1', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'inline-block', width: '120px', height: '120px' }}>
                      🏪
                    </div>
                  </div>

                  <div className="perfil-detalles" style={{ flex: '1', minWidth: '300px' }}>
                    <div className="info-group">
                      <label>Nombre del Negocio:</label>
                      {editMode ? (
                        <input className="auth-input" value={formData.negocio} onChange={e => setFormData({...formData, negocio: e.target.value})} />
                      ) : (
                        <p>{userDetails?.negocio}</p>
                      )}
                    </div>
                    
                    <div className="info-group">
                      <label>Descripción:</label>
                      {editMode ? (
                        <textarea className="auth-input" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} rows="3" placeholder="Ej: Restaurante de comida rápida..."></textarea>
                      ) : (
                        <p>{userDetails?.descripcion || 'No proporcionada'}</p>
                      )}
                    </div>

                    <div className="info-group">
                      <label>Categoría:</label>
                      {editMode ? (
                        <select className="auth-input" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                          <option value="gastronomia">Gastronomía</option>
                          <option value="moda_accesorios">Moda y Accesorios</option>
                          <option value="salud_belleza">Salud y Belleza</option>
                          <option value="tecnologia">Tecnología</option>
                          <option value="entretenimiento">Entretenimiento</option>
                          <option value="servicios">Servicios</option>
                        </select>
                      ) : (
                        <p>{userDetails?.categoria}</p>
                      )}
                    </div>

                    <div className="info-group">
                      <label>Dirección:</label>
                      {editMode ? (
                        <input className="auth-input" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                      ) : (
                        <p>{userDetails?.direccion || 'No proporcionada'}</p>
                      )}
                    </div>

                    <div className="info-group">
                      <label>Teléfono:</label>
                      {editMode ? (
                        <input className="auth-input" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} maxLength="10" />
                      ) : (
                        <p>{userDetails?.telefono || 'No proporcionado'}</p>
                      )}
                    </div>

                    <div className="info-group">
                      <label>RUC (No editable):</label>
                      <p>{userDetails?.ruc}</p>
                    </div>
                    <div className="info-group">
                      <label>Email (No editable):</label>
                      <p>{userDetails?.email}</p>
                    </div>

                    {editMode && (
                      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button className="auth-btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ width: 'auto', padding: '10px 20px' }}>
                          {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                        </button>
                        <button className="auth-btn-google" onClick={() => setEditMode(false)} disabled={saving} style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#333' }}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
