import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GestorPromociones from './GestorPromociones';
import GestorSuscripcion from './GestorSuscripcion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

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
    lat: null,
    lng: null,
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
        lat: userDetails.lat || null,
        lng: userDetails.lng || null,
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
        lat: formData.lat,
        lng: formData.lng,
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

            {activeTab === 'promociones' && <GestorPromociones onNavigateToSuscripcion={() => setActiveTab('suscripcion')} />}

            {activeTab === 'suscripcion' && <GestorSuscripcion />}

            {activeTab === 'negocio' && (
              <div className="negocio-section">
                <div className="negocio-header">
                  <h2>Perfil de la Empresa</h2>
                  {!editMode && (
                    <button className="btn-editar-premium" onClick={() => setEditMode(true)}>
                      ✏️ Editar Información
                    </button>
                  )}
                </div>

                <div className="negocio-premium-card">
                  <div className="negocio-banner"></div>
                  <div className="negocio-avatar-wrapper">
                    <div className="negocio-avatar">
                      🏪
                    </div>
                  </div>

                  <div className="negocio-body">
                    <div className="negocio-info-grid">
                      <div className="info-group-premium info-group-full">
                        <label>Nombre del Negocio</label>
                        {editMode ? (
                          <input value={formData.negocio} onChange={e => setFormData({...formData, negocio: e.target.value})} placeholder="Nombre de tu empresa" />
                        ) : (
                          <p>{userDetails?.negocio}</p>
                        )}
                      </div>
                      
                      <div className="info-group-premium info-group-full">
                        <label>Descripción</label>
                        {editMode ? (
                          <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} rows="3" placeholder="Ej: Restaurante de comida rápida..."></textarea>
                        ) : (
                          <p>{userDetails?.descripcion || 'No proporcionada'}</p>
                        )}
                      </div>

                      <div className="info-group-premium">
                        <label>Categoría</label>
                        {editMode ? (
                          <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
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

                      <div className="info-group-premium">
                        <label>Teléfono</label>
                        {editMode ? (
                          <input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} maxLength="10" placeholder="0991234567" />
                        ) : (
                          <p>{userDetails?.telefono || 'No proporcionado'}</p>
                        )}
                      </div>

                      <div className="info-group-premium info-group-full">
                        <label>Dirección</label>
                        {editMode ? (
                          <input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Principal..." />
                        ) : (
                          <p>{userDetails?.direccion || 'No proporcionada'}</p>
                        )}
                      </div>

                      <div className="info-group-premium info-group-full">
                        <label>Ubicación en el mapa</label>
                        {editMode ? (
                          <div className="map-container-premium">
                            <MapContainer center={formData.lat && formData.lng ? [formData.lat, formData.lng] : [-4.007, -79.211]} zoom={14} style={{ height: '100%', width: '100%' }}>
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <LocationMarker 
                                position={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : null} 
                                setPosition={(pos) => setFormData({ ...formData, lat: pos.lat, lng: pos.lng })} 
                              />
                            </MapContainer>
                          </div>
                        ) : (
                          <div className="map-container-premium">
                            <MapContainer center={userDetails?.lat && userDetails?.lng ? [userDetails.lat, userDetails.lng] : [-4.007, -79.211]} zoom={14} style={{ height: '100%', width: '100%' }}>
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              {userDetails?.lat && userDetails?.lng && (
                                <Marker position={{ lat: userDetails.lat, lng: userDetails.lng }} />
                              )}
                            </MapContainer>
                          </div>
                        )}
                      </div>

                      <div className="info-group-premium">
                        <label>RUC</label>
                        <p>{userDetails?.ruc}</p>
                      </div>

                      <div className="info-group-premium">
                        <label>Email</label>
                        <p>{userDetails?.email}</p>
                      </div>

                      {editMode && (
                        <div className="info-group-full" style={{ marginTop: '15px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                          <button className="auth-btn-google" onClick={() => setEditMode(false)} disabled={saving} style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                          <button className="auth-btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                            {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                          </button>
                        </div>
                      )}
                    </div>
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
