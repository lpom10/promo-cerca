// src/components/Login.jsx
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('tipo') || 'cliente';
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, userType: authUserType, userStatus } = useAuth();

  // Si ya está logueado, redirigir al dashboard correspondiente
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
      case 'cliente':
      default:
        navigate('/cliente/dashboard');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateLoginByType = async (firebaseUser, tipo) => {
    try {
      const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setErrores({ general: 'Usuario no encontrado en el sistema' });
        return false;
      }

      const userData = userDocSnap.data();

      // Validar que el tipo de usuario coincida
      if (userData.tipo !== tipo) {
        setErrores({ general: `Este usuario es de tipo "${userData.tipo}", no "${tipo}"` });
        return false;
      }

      // Validar estado según tipo
      if (tipo === 'admin') {
        // Solo admins con permisos
        if (!userData.puedeAprobar) {
          setErrores({ general: 'No tienes permisos de administrador' });
          return false;
        }
      } else if (tipo === 'empresa') {
        // Empresas deben estar aprobadas
        if (userData.estado === 'pendiente') {
          setErrores({ general: 'Tu solicitud aún está pendiente de aprobación' });
          return false;
        } else if (userData.estado === 'rechazado') {
          setErrores({ 
            general: `Tu solicitud fue rechazada${userData.motivoRechazo ? ': ' + userData.motivoRechazo : ''}` 
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating user:', error);
      setErrores({ general: 'Error al validar usuario' });
      return false;
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrores({});
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const isValid = await validateLoginByType(userCredential.user, userType);
      
      if (isValid) {
        redirectByUserType(userType);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrores({ general: 'Correo o contraseña incorrectos' });
      } else {
        setErrores({ general: error.message });
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrores({});
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Para Google login, solo permitir clientes
      if (userType !== 'cliente') {
        await auth.currentUser.delete();
        setErrores({ general: 'Google login solo disponible para clientes' });
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
          nombre: firebaseUser.displayName || 'Usuario Google',
          email: firebaseUser.email,
          tipo: 'cliente',
          telefono: '',
          estado: 'aprobado',
          createdAt: new Date(),
        });
      }
      redirectByUserType('cliente');
    } catch (error) {
      console.error('Google login error:', error);
      setErrores({ general: `Error: ${error.message}` });
    }
    setLoading(false);
  };

  return (
    <>
      {user && authUserType ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Redirigiendo...</div>
      ) : (
        <div className="login-page">
          <div className="registro-card">
            <h2>Iniciar Sesión - {userType === 'admin' ? 'Administrador' : userType === 'empresa' ? 'Empresa' : 'Cliente'}</h2>
            <p>
              {userType === 'admin' && 'Acceso exclusivo para administradores'}
              {userType === 'empresa' && 'Gestiona tus promociones y negocio'}
              {userType === 'cliente' && 'Accede a tu cuenta para explorar promociones'}
            </p>

            <form onSubmit={handleEmailLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {errores.general && <p className="error">{errores.general}</p>}
              <button type="submit" disabled={loading}>
                {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            </form>

            {userType === 'cliente' && (
              <>
                <div className="divider">O</div>
                <button onClick={handleGoogleLogin} className="google-btn" disabled={loading}>
                  🔵 Iniciar con Google
                </button>
              </>
            )}

            <p>
              ¿No tienes cuenta?{' '}
              <Link to={`/registro?tipo=${userType}`}>Regístrate</Link>
            </p>
            <p>
              <Link to="/login-tipo" className="back-link">← Cambiar tipo de usuario</Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;