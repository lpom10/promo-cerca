// src/components/PerfilCliente.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import '../styles/perfil.css';

const PerfilCliente = () => {
  const { user, userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    foto: ''
  });
  const [tabs, setTabs] = useState('info');

  useEffect(() => {
    const cargarDatos = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          if (userDoc.exists()) {
            setDatosUsuario(userDoc.data());
            setForm({
              nombre: userDoc.data().nombre || user.displayName || '',
              telefono: userDoc.data().telefono || '',
              foto: userDoc.data().foto || user.photoURL || ''
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
      // Actualizar Firestore
      await updateDoc(doc(db, 'usuarios', user.uid), {
        nombre: form.nombre,
        telefono: form.telefono,
        foto: form.foto
      });

      // Actualizar Auth Profile
      await updateProfile(user, {
        displayName: form.nombre,
        photoURL: form.foto || null
      });

      setDatosUsuario({
        ...datosUsuario,
        nombre: form.nombre,
        telefono: form.telefono,
        foto: form.foto
      });
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

  if (!datosUsuario) {
    return <div className="perfil-error">Error al cargar el perfil</div>;
  }

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <div className="perfil-avatar">
          {form.foto ? (
            <img src={form.foto} alt={form.nombre} />
          ) : (
            <div className="avatar-placeholder">👤</div>
          )}
        </div>
        <div className="perfil-info-header">
          <h1>{form.nombre || 'Cliente'}</h1>
          <p>{user?.email}</p>
          <span className="estado-badge">✓ Activo</span>
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
          className={`tab-btn ${tabs === 'tickets' ? 'active' : ''}`}
          onClick={() => setTabs('tickets')}
        >
          🎟️ Mis Tickets
        </button>
        <button
          className={`tab-btn ${tabs === 'favoritos' ? 'active' : ''}`}
          onClick={() => setTabs('favoritos')}
        >
          ⭐ Favoritos
        </button>
      </div>

      <div className="perfil-content">
        {tabs === 'info' && (
          <div className="tab-pane">
            {!editando ? (
              <div className="info-display">
                <div className="info-item">
                  <strong>Nombre:</strong>
                  <span>{form.nombre}</span>
                </div>
                <div className="info-item">
                  <strong>Email:</strong>
                  <span>{user?.email}</span>
                </div>
                <div className="info-item">
                  <strong>Teléfono:</strong>
                  <span>{form.telefono || 'No especificado'}</span>
                </div>
                <div className="info-item">
                  <strong>Miembro desde:</strong>
                  <span>{datosUsuario.createdAt?.toDate?.().toLocaleDateString?.('es-ES') || 'Reciente'}</span>
                </div>
                <button className="btn-edit" onClick={() => setEditando(true)}>
                  ✏️ Editar perfil
                </button>
              </div>
            ) : (
              <div className="info-form">
                <div className="form-group">
                  <label>Nombre:</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono:</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="Tu teléfono"
                  />
                </div>
                <div className="form-group">
                  <label>URL Foto de Perfil:</label>
                  <input
                    type="url"
                    name="foto"
                    value={form.foto}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/foto.jpg"
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

        {tabs === 'tickets' && (
          <div className="tab-pane">
            <div className="empty-state">
              <p>🎟️ No tienes tickets generados aún</p>
              <p className="subtitle">Explora promociones y genera tickets para canjearlos</p>
            </div>
          </div>
        )}

        {tabs === 'favoritos' && (
          <div className="tab-pane">
            <div className="empty-state">
              <p>⭐ No tienes favoritos guardados</p>
              <p className="subtitle">Guarda tus promociones y empresas favoritas aquí</p>
            </div>
          </div>
        )}
      </div>

      <div className="perfil-footer">
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default PerfilCliente;
