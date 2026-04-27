// src/components/Login.jsx - Login unificado
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const GoogleIcon = () => (
  <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [detectedUserType, setDetectedUserType] = useState('cliente');
  const navigate = useNavigate();
  const { user, userType: authUserType } = useAuth();

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

  const detectUserType = async (firebaseUser) => {
    try {
      // Buscar en usuarios (cliente)
      let userDocSnap = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDocSnap.exists()) {
        return { type: 'cliente', data: userDocSnap.data() };
      }

      // Buscar en empresa
      userDocSnap = await getDoc(doc(db, 'empresa', firebaseUser.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.estado === 'pendiente') {
          setErrores({ general: 'Tu solicitud aún está pendiente de aprobación' });
          return null;
        } else if (userData.estado === 'rechazado') {
          setErrores({
            general: `Tu solicitud fue rechazada${userData.motivoRechazo ? ': ' + userData.motivoRechazo : ''}`
          });
          return null;
        }
        return { type: 'empresa', data: userData };
      }

      // Buscar en admin
      userDocSnap = await getDoc(doc(db, 'admin', firebaseUser.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (!userData.puedeAprobar) {
          setErrores({ general: 'No tienes permisos de administrador' });
          return null;
        }
        return { type: 'admin', data: userData };
      }

      setErrores({ general: 'Usuario no registrado en el sistema' });
      return null;
    } catch (error) {
      setErrores({ general: 'Error al buscar usuario: ' + error.message });
      return null;
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrores({});
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const result = await detectUserType(cred.user);

      if (result) {
        setDetectedUserType(result.type);
        redirectByUserType(result.type);
      }
    } catch (error) {
      const errorMsg = error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
        ? 'Correo o contraseña incorrectos'
        : error.code === 'auth/too-many-requests'
        ? 'Demasiados intentos fallidos. Intenta más tarde.'
        : error.message;
      setErrores({ general: errorMsg });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrores({});
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      let userDoc = await getDoc(doc(db, 'usuarios', fbUser.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'usuarios', fbUser.uid), {
          nombre: fbUser.displayName || 'Usuario Google',
          email: fbUser.email,
          tipo: 'cliente',
          telefono: '',
          estado: 'aprobado',
          foto: fbUser.photoURL || null,
          createdAt: new Date(),
        });
      }

      setDetectedUserType('cliente');
      redirectByUserType('cliente');
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        setErrores({ general: 'Inicio de sesión cancelado' });
      } else {
        setErrores({ general: `Error: ${error.message}` });
      }
    }
    setLoading(false);
  };

  if (user && authUserType) {
    return <div className="auth-redirecting">Redirigiendo...</div>;
  }

  return (
    <div className="auth-page" data-type={detectedUserType}>
      {/* Panel izquierdo: Branding */}
      <div className="auth-panel-brand">
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <span className="brand-logo-icon">📍</span>
            <span className="brand-logo-text">Promo Cerca</span>
          </div>
          <p className="brand-tagline">Login Unificado</p>
          <p className="brand-desc">Accede con tu cuenta. Detectaremos automáticamente si eres cliente o empresa</p>
          <div className="brand-features">
            <div className="brand-feature">
              <span className="brand-feature-icon">🔐</span>
              <span>Seguridad certificada</span>
            </div>
            <div className="brand-feature">
              <span className="brand-feature-icon">⚡</span>
              <span>Acceso inmediato</span>
            </div>
            <div className="brand-feature">
              <span className="brand-feature-icon">✓</span>
              <span>Sin formularios complicados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho: Formulario */}
      <div className="auth-panel-form">
        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Iniciar sesión</h2>
              <p className="auth-subtitle">Usa tu correo y contraseña</p>
            </div>

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

            <div className="auth-divider-or">
              <hr /><span>o continúa con</span><hr />
            </div>
            <button onClick={handleGoogleLogin} className="auth-btn-google" disabled={loading}>
              <GoogleIcon />
              Iniciar con Google
            </button>

            <div className="auth-footer">
              <p>
                ¿No tienes cuenta?{' '}
                <Link to="/registro" className="auth-link">Regístrate gratis</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
