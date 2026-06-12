// src/components/Login.jsx
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validarEmail, sanitizar } from '../utils/validators';
import { rateLimiter } from '../utils/rateLimiter';
import { handleError, logError } from '../utils/errorHandler';
import logo from '../assets/logo.png';
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

/* Datos de marca para cada tipo */
const brandData = {
  cliente: {
    badge: 'Cliente',
    title: 'Bienvenido de vuelta',
    subtitle: 'Inicia sesión para explorar las mejores promociones',
    features: [
      { text: 'Promociones geolocalizadas a tu alrededor' },
      { text: 'Guarda tus favoritos y descuentos preferidos' },
      { text: 'Genera y canjea tickets de promociones' },
    ],
  },
  empresa: {
    badge: 'Empresa',
    title: 'Panel de empresa',
    subtitle: 'Gestiona tus promociones y llega a más clientes',
    features: [
      { text: 'Publica y administra promociones' },
      { text: 'Monitorea el rendimiento de campañas' },
      { text: 'Llega a más clientes de tu zona' },
    ],
  },
  admin: {
    badge: 'Administrador',
    title: 'Acceso administrativo',
    subtitle: 'Panel exclusivo para administradores',
    features: [
      { text: 'Aprueba empresas registradas' },
      { text: 'Administra usuarios' },
      { text: 'Supervisa el sistema' },
    ],
  },
};

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [detectedUserType, setDetectedUserType] = useState('cliente');
  const navigate = useNavigate();
  const { user, userType: authUserType } = useAuth();

  const brand = brandData[detectedUserType] || brandData.cliente;

  useEffect(() => {
    if (user && authUserType) {
      redirectByUserType(authUserType);
    }
  }, [user, authUserType]);

  const redirectByUserType = (tipo) => {
    switch (tipo) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'empresa':
        navigate('/empresa/dashboard');
        break;
      default:
        navigate('/cliente/dashboard');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Detectar tipo de usuario en la BD
  const detectUserType = async (firebaseUser) => {
    try {
      // Intentar buscar en usuarios (cliente)
      let userDocSnap = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.tipo !== 'cliente') {
          setErrores({ general: 'Datos inconsistentes en la base de datos' });
          return null;
        }
        return { type: 'cliente', data: userData };
      }

      // Intentar buscar en empresa
      userDocSnap = await getDoc(doc(db, 'empresa', firebaseUser.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.estado === 'pendiente') {
          setErrores({ general: 'Tu solicitud aún está pendiente de aprobación' });
          return null;
        } else if (userData.estado === 'rechazado') {
          setErrores({
            general: 'Tu solicitud de empresa fue rechazada. Contacta con soporte.',
          });
          return null;
        }
        return { type: 'empresa', data: userData };
      }

      // Intentar buscar en admin
      userDocSnap = await getDoc(doc(db, 'admin', firebaseUser.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (!userData.puedeAprobar) {
          setErrores({ general: 'No tienes permisos de administrador' });
          return null;
        }
        return { type: 'admin', data: userData };
      }

      setErrores({ general: 'Usuario no encontrado en el sistema' });
      return null;
    } catch (error) {
      logError(error, { accion: 'detectUserType' });
      setErrores({ general: 'Error al verificar usuario. Intenta de nuevo.' });
      return null;
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrores({});

    // Validar rate limiting
    const checkRateLimit = rateLimiter.check(
      `login_${form.email}`,
      5, // 5 intentos
      60000 // en 1 minuto
    );

    if (!checkRateLimit.permitido) {
      setErrores({ general: checkRateLimit.mensaje });
      setLoading(false);
      return;
    }

    // Validar inputs
    if (!form.email || !form.password) {
      setErrores({ general: 'Email y contraseña son requeridos' });
      setLoading(false);
      return;
    }

    if (!validarEmail(form.email)) {
      setErrores({ email: 'Email inválido' });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      
      const result = await detectUserType(cred.user);
      
      if (result) {
        setDetectedUserType(result.type);
        rateLimiter.reset(`login_${form.email}`);
      }
    } catch (error) {
      const errorInfo = handleError(error, { accion: 'login_email' });
      setErrores({ general: errorInfo.mensaje });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrores({});
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Verificar si el usuario ya existe
      let userDoc = await getDoc(doc(db, 'usuarios', fbUser.uid));
      
      if (!userDoc.exists()) {
        // Crear nuevo cliente con Google
        await setDoc(doc(db, 'usuarios', fbUser.uid), {
          nombre: fbUser.displayName || 'Usuario Google',
          email: fbUser.email,
          tipo: 'cliente',
          telefono: '',
          estado: 'aprobado',
          foto: fbUser.photoURL || null,
          createdAt: new Date(),
        });
        setDetectedUserType('cliente');
      } else {
        const userData = userDoc.data();
        if (userData.tipo !== 'cliente') {
          setErrores({ general: 'Esta cuenta no es de cliente. Use el login tradicional.' });
          setLoading(false);
          return;
        }
        setDetectedUserType('cliente');
      }
      
      redirectByUserType('cliente');
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        setErrores({ general: 'Inicio de sesión cancelado' });
      } else {
        const errorInfo = handleError(error, { accion: 'login_google' });
        setErrores({ general: errorInfo.mensaje });
      }
    } finally {
      setLoading(false);
    }
  };

  if (user && authUserType) {
    return <div className="auth-redirecting">Redirigiendo...</div>;
  }

  return (
    <div className="auth-page" data-type={detectedUserType}>

      {/* ── Panel izquierdo: Branding ── */}
      <div className="auth-panel-brand">
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <img src={logo} alt="Promo Cerca Logo" className="brand-logo-img" style={{ maxWidth: '180px', marginBottom: '20px' }} />
          </div>
          <p className="brand-tagline">{brand.title}</p>
          <p className="brand-desc">{brand.subtitle}</p>
          <div className="brand-features">
            {brand.features.map((f, i) => (
              <div className="brand-feature" key={i}>
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
              <h2 className="auth-title">Iniciar sesión</h2>
              <p className="auth-subtitle">Ingresa con tu correo para acceder</p>
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
                  disabled={loading}
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
                  disabled={loading}
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
            {detectedUserType === 'cliente' && (
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
                <Link to={`/registro?tipo=${detectedUserType}`} className="auth-link">Regístrate gratis</Link>
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
