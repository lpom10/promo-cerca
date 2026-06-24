import { useState, useEffect } from 'react';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import { logError } from '../../../../shared/utils/errorHandler';
import './PerfilEmpresa.css';

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
          const perfil = await getDoc(doc(db, 'empresa', user.uid));
          const datos = perfil.data() || {};
          setDatosEmpresa(datos);
          setForm(datos);
        } catch (error) {
          logError(error, { accion: 'cargarDatos', userId: user.uid, componente: 'PerfilEmpresa' });
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
      logError(error, { accion: 'guardarCambios', userId: user.uid, componente: 'PerfilEmpresa' });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/');
    } catch (error) {
      logError(error, { accion: 'logout', userId: user.uid, componente: 'PerfilEmpresa' });
    }
  };

  if (loading) {
    return <div className="empresa-perfil-loading">Cargando perfil...</div>;
  }

  if (!datosEmpresa) {
    return <div className="empresa-perfil-error">Error al cargar el perfil de empresa</div>;
  }

  return (
    <div className="empresa-perfil-container">
      <div className="empresa-perfil-header">
        <div className="empresa-perfil-avatar">
          {form.logo ? (
            <img src={form.logo} alt={form.negocio} />
          ) : (
            <div className="empresa-perfil-placeholder">🏢</div>
          )}
        </div>
        <div className="empresa-perfil-info-header">
          <h1>{form.negocio || 'Mi Negocio'}</h1>
          <p>{form.direccion || 'Dirección no especificada'}</p>
          <span className={`empresa-perfil-estado ${datosEmpresa.estado}`}>
            {datosEmpresa.estado === 'aprobado' ? '✓ Aprobado' : '⏳ Pendiente'}
          </span>
        </div>
      </div>

      <div className="empresa-perfil-tabs">
        <button
          className={`empresa-perfil-tab-btn ${tabs === 'info' ? 'active' : ''}`}
          onClick={() => setTabs('info')}
        >
          📋 Información
        </button>
        <button
          className={`empresa-perfil-tab-btn ${tabs === 'estadisticas' ? 'active' : ''}`}
          onClick={() => setTabs('estadisticas')}
        >
          📊 Estadísticas
        </button>
        <button
          className={`empresa-perfil-tab-btn ${tabs === 'suscripcion' ? 'active' : ''}`}
          onClick={() => setTabs('suscripcion')}
        >
          💳 Suscripción
        </button>
      </div>

      <div className="empresa-perfil-content">
        {tabs === 'info' && (
          <div className="empresa-perfil-pane">
            {!editando ? (
              <div className="empresa-perfil-display">
                <div className="empresa-perfil-item">
                  <strong>Nombre del Negocio:</strong>
                  <span>{form.negocio}</span>
                </div>
                <div className="empresa-perfil-item">
                  <strong>Descripción:</strong>
                  <span>{form.descripcion || 'No especificada'}</span>
                </div>
                <div className="empresa-perfil-item">
                  <strong>Teléfono:</strong>
                  <span>{form.telefono || 'No especificado'}</span>
                </div>
                <div className="empresa-perfil-item">
                  <strong>Dirección:</strong>
                  <span>{form.direccion || 'No especificada'}</span>
                </div>
                <div className="empresa-perfil-item">
                  <strong>Horarios:</strong>
                  <span>{form.horarios || 'No especificados'}</span>
                </div>
                <div className="empresa-perfil-item">
                  <strong>Responsable:</strong>
                  <span>{form.responsable || 'No especificado'}</span>
                </div>
                <button className="empresa-perfil-btn-edit" onClick={() => setEditando(true)}>
                  ✏️ Editar perfil
                </button>
              </div>
            ) : (
              <div className="empresa-perfil-form">
                <div className="empresa-perfil-form-group">
                  <label>Nombre del Negocio:</label>
                  <input
                    type="text"
                    name="negocio"
                    value={form.negocio}
                    onChange={handleChange}
                  />
                </div>
                <div className="empresa-perfil-form-group">
                  <label>Descripción:</label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
                <div className="empresa-perfil-form-group">
                  <label>Teléfono:</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                  />
                </div>
                <div className="empresa-perfil-form-group">
                  <label>Dirección:</label>
                  <input
                    type="text"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                  />
                </div>
                <div className="empresa-perfil-form-group">
                  <label>Horarios:</label>
                  <input
                    type="text"
                    name="horarios"
                    value={form.horarios}
                    onChange={handleChange}
                    placeholder="Ej: Lunes-Viernes 09:00-18:00"
                  />
                </div>
                <div className="empresa-perfil-form-group">
                  <label>Responsable:</label>
                  <input
                    type="text"
                    name="responsable"
                    value={form.responsable}
                    onChange={handleChange}
                  />
                </div>
                <div className="empresa-perfil-form-group">
                  <label>URL del Logo:</label>
                  <input
                    type="url"
                    name="logo"
                    value={form.logo}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
                <div className="empresa-perfil-form-actions">
                  <button className="empresa-perfil-btn-save" onClick={guardarCambios} disabled={loading}>
                    {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                  </button>
                  <button className="empresa-perfil-btn-cancel" onClick={() => setEditando(false)}>
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilEmpresa;
