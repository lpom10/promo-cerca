import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ListarPromociones from './ListarPromociones';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ClienteDashboard = () => {
  const { user, userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('promociones');

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userDetails) {
      setFormData({
        nombre: userDetails.nombre || '',
        telefono: userDetails.telefono || '',
      });
    }
  }, [userDetails]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), {
        nombre: formData.nombre,
        telefono: formData.telefono,
      });
      // Recargar la página para limpiar el caché y context sin complicaciones (o forzar refresco)
      window.location.reload();
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      alert('Hubo un error al guardar los datos.');
    }
    setSaving(false);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Mi Perfil</h2>
              {!editMode && (
                <button className="btn-editar" onClick={() => setEditMode(true)}>
                  ✏️ Editar Perfil
                </button>
              )}
            </div>

            <div className="perfil-info" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              <div className="perfil-avatar" style={{ flexBasis: '150px', textAlign: 'center' }}>
                <div style={{ fontSize: '100px', lineHeight: '1', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'inline-block', width: '120px', height: '120px' }}>
                  👤
                </div>
              </div>

              <div className="perfil-detalles" style={{ flex: '1', minWidth: '300px' }}>
                <div className="info-group">
                  <label>Nombre Completo:</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      className="auth-input" 
                      value={formData.nombre} 
                      onChange={e => setFormData({...formData, nombre: e.target.value})} 
                    />
                  ) : (
                    <p>{userDetails?.nombre}</p>
                  )}
                </div>
                
                <div className="info-group">
                  <label>Email (No editable):</label>
                  <p>{userDetails?.email}</p>
                </div>
                
                <div className="info-group">
                  <label>Teléfono:</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      className="auth-input" 
                      value={formData.telefono} 
                      onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} 
                      maxLength="10"
                    />
                  ) : (
                    <p>{userDetails?.telefono || 'No proporcionado'}</p>
                  )}
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
    </div>
  );
};

export default ClienteDashboard;
