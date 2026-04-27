// src/components/PerfilEmpresa.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import '../styles/perfil.css';

const PerfilEmpresa = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [datosEmpresa, setDatosEmpresa] = useState(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    negocio: '',
    descripcion: '',
    logo: '',
    telefono: '',
    horarios: '',
    responsable: '',
    direccion: ''
  });
  const [tabs, setTabs] = useState('info');

  useEffect(() => {
    const cargarDatos = async () => {
      if (user) {
        try {
          const empresaDoc = await getDoc(doc(db, 'empresa', user.uid));
          if (empresaDoc.exists()) {
            const data = empresaDoc.data();
            setDatosEmpresa(data);
            setForm({
              negocio: data.negocio || '',
              descripcion: data.descripcion || '',
              logo: data.logo || '',
              telefono: data.telefono || '',
              horarios: data.horarios || '',
              responsable: data.responsable || '',
              direccion: data.direccion || ''
            });
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
      setLoading(false);
    };
    cargarDatos();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const guardarCambios = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'empresa', user.uid), form);
      setDatosEmpresa({ ...datosEmpresa, ...form });
      setEditando(false);
    } catch (error) {
      console.error('Error al guardar:', error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return <div className="perfil-loading">Cargando perfil...</div>;
  }

  if (!datosEmpresa) {
    return <div className="perfil-error">Error al cargar el perfil de empresa</div>;
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="perfil-avatar empresa">
          {form.logo ? (
            <img src={form.logo} alt={form.negocio} />
          ) : (
            <div className="avatar-placeholder">🏢</div>
          )}
        </div>
        <div className="perfil-info-header">
          <h1>{form.negocio || 'Mi Negocio'}</h1>
          <p>{form.direccion || 'Dirección no especificada'}</p>
          <span className={`estado-badge ${datosEmpresa.estado}`}>
            {datosEmpresa.estado === 'aprobado' ? '✓ Aprobado' : '⏳ Pendiente'}
          </span>
        </div>
      </div>

      <div className="perfil-tabs">
        <button
          className={`tab-btn ${tabs === 'info' ? 'active' : ''}`}
          onClick={() => setTabs('info')}
        >
          📋 Información
        </button>
        <button
          className={`tab-btn ${tabs === 'estadisticas' ? 'active' : ''}`}
          onClick={() => setTabs('estadisticas')}
        >
          📊 Estadísticas
        </button>
        <button
          className={`tab-btn ${tabs === 'suscripcion' ? 'active' : ''}`}
          onClick={() => setTabs('suscripcion')}
        >
          💳 Suscripción
        </button>
      </div>

      <div className="perfil-content">
        {tabs === 'info' && (
          <div className="tab-pane">
            {!editando ? (
              <div className="info-display">
                <div className="info-item">
                  <strong>Nombre del Negocio:</strong>
                  <span>{form.negocio}</span>
                </div>
                <div className="info-item">
                  <strong>Descripción:</strong>
                  <span>{form.descripcion || 'No especificada'}</span>
                </div>
                <div className="info-item">
                  <strong>Teléfono:</strong>
                  <span>{form.telefono || 'No especificado'}</span>
                </div>
                <div className="info-item">
                  <strong>Dirección:</strong>
                  <span>{form.direccion || 'No especificada'}</span>
                </div>
                <div className="info-item">
                  <strong>Horarios:</strong>
                  <span>{form.horarios || 'No especificados'}</span>
                </div>
                <div className="info-item">
                  <strong>Responsable:</strong>
                  <span>{form.responsable || 'No especificado'}</span>
                </div>
                <button className="btn-edit" onClick={() => setEditando(true)}>
                  ✏️ Editar perfil
                </button>
              </div>
            ) : (
              <div className="info-form">
                <div className="form-group">
                  <label>Nombre del Negocio:</label>
                  <input
                    type="text"
                    name="negocio"
                    value={form.negocio}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Descripción:</label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono:</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Dirección:</label>
                  <input
                    type="text"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Horarios:</label>
                  <input
                    type="text"
                    name="horarios"
                    value={form.horarios}
                    onChange={handleChange}
                    placeholder="Ej: Lunes a Viernes 9:00-18:00"
                  />
                </div>
                <div className="form-group">
                  <label>Responsable:</label>
                  <input
                    type="text"
                    name="responsable"
                    value={form.responsable}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>URL Logo:</label>
                  <input
                    type="url"
                    name="logo"
                    value={form.logo}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
                <div className="form-actions">
                  <button className="btn-save" onClick={guardarCambios} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button className="btn-cancel" onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tabs === 'estadisticas' && (
          <div className="tab-pane">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Tickets Generados</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Tickets Canjeados</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Promociones Activas</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">$0.00</div>
                <div className="stat-label">Ingresos Totales</div>
              </div>
            </div>
          </div>
        )}

        {tabs === 'suscripcion' && (
          <div className="tab-pane">
            <div className="empty-state">
              <p>💳 Información de suscripción</p>
              <p className="subtitle">Gestiona tu plan y acceso a promociones</p>
            </div>
          </div>
        )}
      </div>

      <div className="perfil-actions">
        <Link to="/empresa/gestionar-promociones" className="btn-primary">
          📢 Gestionar Promociones
        </Link>
      </div>

      <div className="perfil-footer">
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default PerfilEmpresa;
