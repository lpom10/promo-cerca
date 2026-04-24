// src/components/Login.jsx
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

/* SVG logo de Google inline */
const GoogleIcon = () => (
  <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* Datos del panel de marca según tipo */
const brandData = {
  cliente: {
    badge: '👤 Cliente',
    title: 'Bienvenido de vuelta',
    subtitle: 'Inicia sesión para explorar las mejores promociones cerca de ti',
    features: [
      { icon: '🗺️', text: 'Promociones geolocalizadas a tu alrededor' },
      { icon: '🔖', text: 'Guarda tus favoritos y descuentos preferidos' },
      { icon: '🔔', text: 'Recibe alertas de nuevas ofertas en tu zona' },
    ],
  },
  empresa: {
    badge: '🏢 Empresa',
    title: 'Panel de empresa',
    subtitle: 'Gestiona tus promociones y llega a más clientes locales',
    features: [
      { icon: '📈', text: 'Publica y administra tus promociones fácilmente' },
      { icon: '📍', text: 'Aparece en el mapa para clientes cercanos' },
      { icon: '📊', text: 'Monitorea el alcance de tus campañas' },
    ],
  },
  admin: {
    badge: '🛡️ Admin',
    title: 'Acceso administrativo',
    subtitle: 'Panel exclusivo para administradores del sistema',
    features: [
      { icon: '✅', text: 'Aprueba y gestiona empresas registradas' },
      { icon: '👥', text: 'Administra usuarios de la plataforma' },
      { icon: '⚙️', text: 'Configura y supervisa el sistema' },
    ],
  },
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('tipo') || 'cliente';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userType: authUserType } = useAuth();

  const brand = brandData[userType] || brandData.cliente;

  useEffect(() => {
    if (user && authUserType) redirectByUserType(authUserType);
  }, [user, authUserType]);

  const redirectByUserType = (tipo) => {
    switch (tipo) {
      case 'admin':   navigate('/admin/dashboard'); break;
      case 'empresa': navigate('/empresa/dashboard'); break;
      default:        navigate('/cliente/dashboard');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateLoginByType = async (firebaseUser, tipo) => {
    try {
      const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (!snap.exists()) { setErrores({ general: 'Usuario no encontrado en el sistema' }); return false; }
      const data = snap.data();
      if (data.tipo !== tipo) { setErrores({ general: `Este usuario es de tipo "${data.tipo}", no "${tipo}"` }); return false; }
      if (tipo === 'admin' && !data.puedeAprobar) { setErrores({ general: 'No tienes permisos de administrador' }); return false; }
      if (tipo === 'empresa') {
        if (data.estado === 'pendiente') { setErrores({ general: 'Tu solicitud aún está pendiente de aprobación' }); return false; }
        if (data.estado === 'rechazado') { setErrores({ general: `Tu solicitud fue rechazada${data.motivoRechazo ? ': ' + data.motivoRechazo : ''}` }); return false; }
      }
      return true;
    } catch {
      setErrores({ general: 'Error al validar usuario' });
      return false;
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrores({});
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      if (await validateLoginByType(cred.user, userType)) redirectByUserType(userType);
    } catch (error) {
      setErrores({ general: error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
        ? 'Correo o contraseña incorrectos'
        : error.message });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrores({});
    setLoading(true);
    try {
      if (userType !== 'cliente') {
        setErrores({ general: 'Google login solo disponible para clientes' });
        setLoading(false);
        return;
      }
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userDoc = await getDoc(doc(db, 'usuarios', fbUser.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'usuarios', fbUser.uid), {
          nombre: fbUser.displayName || 'Usuario Google',
          email: fbUser.email,
          tipo: 'cliente',
          telefono: '',
          estado: 'aprobado',
          createdAt: new Date(),
        });
      }
      redirectByUserType('cliente');
    } catch (error) {
      setErrores({ general: `Error: ${error.message}` });
    }
    setLoading(false);
  };

  if (user && authUserType) {
    return <div className="auth-redirecting">Redirigiendo...</div>;
  }

  return (
    <div className="auth-page" data-type={userType}>

      {/* ── Panel izquierdo: Branding ── */}
      <div className="auth-panel-brand">
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <span className="brand-logo-icon">📍</span>
            <span className="brand-logo-text">Promo Cerca</span>
          </div>
          <p className="brand-tagline">{brand.title}</p>
          <p className="brand-desc">{brand.subtitle}</p>
          <div className="brand-features">
            {brand.features.map((f, i) => (
              <div className="brand-feature" key={i}>
                <span className="brand-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho: Formulario ── */}
      <div className="auth-panel-form">
        <div className="auth-form-container">
          <div className="auth-card">

            {/* Cabecera */}
            <div className="auth-header">
              <div className="auth-type-badge">{brand.badge}</div>
              <h2 className="auth-title">Iniciar sesión</h2>
              <p className="auth-subtitle">{brand.subtitle}</p>
            </div>

            {/* Formulario email/contraseña */}
            <form className="auth-form" onSubmit={handleEmailLogin}>
              <div className="auth-field">
                <label className="auth-label">Correo electrónico</label>
                <input
                  className={`auth-input${errores.email ? ' is-error' : ''}`}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Contraseña</label>
                <input
                  className={`auth-input${errores.password ? ' is-error' : ''}`}
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              {errores.general && (
                <div className="auth-alert-error">{errores.general}</div>
              )}

              <button className="auth-btn-primary" type="submit" disabled={loading}>
                {loading ? '⏳ Verificando...' : 'Iniciar sesión'}
              </button>
            </form>

            {/* Google (solo clientes) */}
            {userType === 'cliente' && (
              <>
                <div className="auth-divider-or">
                  <hr /><span>o continúa con</span><hr />
                </div>
                <button onClick={handleGoogleLogin} className="auth-btn-google" disabled={loading}>
                  <GoogleIcon />
                  Iniciar con Google
                </button>
              </>
            )}

            {/* Footer */}
            <div className="auth-footer">
              <p>
                ¿No tienes cuenta?{' '}
                <Link to={`/registro?tipo=${userType}`} className="auth-link">Regístrate gratis</Link>
              </p>
              <Link to="/login-tipo" className="auth-back-link">← Cambiar tipo de usuario</Link>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
