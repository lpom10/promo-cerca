// src/components/PerfilCliente.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import { logError } from '../utils/errorHandler';
import { obtenerFavoritos, eliminarPromocionFavorita, eliminarEmpresaFavorita } from '../services/favoritosService';
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
  const [favoritos, setFavoritos] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [favTab, setFavTab] = useState('promociones');

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
          logError(error, { accion: 'cargarDatosUsuario', userId: user.uid, componente: 'PerfilCliente' });
        }
      }
      setLoading(false);
    };
    cargarDatos();
  }, [user]);

  // Cargar favoritos cuando se abre esa pestaña
  useEffect(() => {
    if (tabs !== 'favoritos' || !user) return;
    const cargarFavoritos = async () => {
      setLoadingFavs(true);
      try {
        const favs = await obtenerFavoritos(user.uid);
        setFavoritos(favs);
      } catch (error) {
        logError(error, { accion: 'cargarFavoritos', userId: user.uid, componente: 'PerfilCliente' });
      } finally {
        setLoadingFavs(false);
      }
    };
    cargarFavoritos();
  }, [tabs, user]);

  const handleRemoveFav = async (fav) => {
    try {
      if (fav.tipo === 'promocion') {
        await eliminarPromocionFavorita(user.uid, fav.promocionId);
      } else {
        await eliminarEmpresaFavorita(user.uid, fav.empresaId);
      }
      setFavoritos(prev => prev.filter(f => f.id !== fav.id));
    } catch (error) {
      logError(error, { accion: 'removeFavorito', userId: user.uid, componente: 'PerfilCliente' });
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const value = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return value.toLocaleDateString('es-ES');
    } catch { return ''; }
  };

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
      logError(error, { accion: 'guardarCambios', userId: user.uid, componente: 'PerfilCliente' });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate('/');
    } catch (error) {
      logError(error, { accion: 'logout', userId: user.uid, componente: 'PerfilCliente' });
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
            {/* Separador: Promociones / Empresas */}
            <div className="fav-subtabs">
              <button
                className={`fav-subtab-btn ${favTab === 'promociones' ? 'active' : ''}`}
                onClick={() => setFavTab('promociones')}
              >
                🏷️ Promociones
              </button>
              <button
                className={`fav-subtab-btn ${favTab === 'empresas' ? 'active' : ''}`}
                onClick={() => setFavTab('empresas')}
              >
                🏢 Empresas
              </button>
            </div>

            {loadingFavs ? (
              <div className="empty-state">
                <p>⏳</p>
                <p>Cargando favoritos...</p>
              </div>
            ) : favTab === 'promociones' ? (
              (() => {
                const promos = favoritos.filter(f => f.tipo === 'promocion');
                return promos.length === 0 ? (
                  <div className="empty-state">
                    <p>🏷️</p>
                    <p>Sin promociones favoritas</p>
                    <p className="subtitle">Dale al ❤️ en las tarjetas de promoción</p>
                  </div>
                ) : (
                  <div className="fav-grid">
                    {promos.map(fav => (
                      <div key={fav.id} className="fav-card">
                        {fav.imagen
                          ? <img src={fav.imagen} alt={fav.titulo} className="fav-card-img" />
                          : <div className="fav-card-img-placeholder">🏷️</div>
                        }
                        <div className="fav-card-body">
                          <div className="fav-card-header">
                            <h4 className="fav-card-title">{fav.titulo}</h4>
                            <button
                              className="fav-remove-btn"
                              onClick={() => handleRemoveFav(fav)}
                              title="Quitar de favoritos"
                            >❤️</button>
                          </div>
                          {fav.descuento && (
                            <span className="fav-badge">-{fav.descuento}%</span>
                          )}
                          <p className="fav-empresa-name">🏢 {fav.empresaNombre}</p>
                          {fav.fechaFin && (
                            <p className="fav-vence">⏰ Vence: {formatFecha(fav.fechaFin)}</p>
                          )}
                          <Link to={`/empresa/${fav.empresaId}`} className="fav-link">
                            Ver empresa →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              (() => {
                const empresas = favoritos.filter(f => f.tipo === 'empresa');
                return empresas.length === 0 ? (
                  <div className="empty-state">
                    <p>🏢</p>
                    <p>Sin empresas favoritas</p>
                    <p className="subtitle">Agrégalas desde el ❤️ en su perfil público</p>
                  </div>
                ) : (
                  <div className="fav-grid">
                    {empresas.map(fav => (
                      <div key={fav.id} className="fav-card">
                        {fav.imagen
                          ? <img src={fav.imagen} alt={fav.nombre} className="fav-card-img" />
                          : <div className="fav-card-img-placeholder">🏢</div>
                        }
                        <div className="fav-card-body">
                          <div className="fav-card-header">
                            <h4 className="fav-card-title">{fav.nombre}</h4>
                            <button
                              className="fav-remove-btn"
                              onClick={() => handleRemoveFav(fav)}
                              title="Quitar de favoritos"
                            >❤️</button>
                          </div>
                          {fav.categoria && (
                            <span className="fav-cat-badge">{fav.categoria}</span>
                          )}
                          {fav.descripcion && (
                            <p className="fav-desc">{fav.descripcion}</p>
                          )}
                          <Link to={`/empresa/${fav.empresaId}`} className="fav-link">
                            Ver perfil →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
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