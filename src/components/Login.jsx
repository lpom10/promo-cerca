// src/components/Login.jsx
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si ya está logueado, redirigir
  useEffect(() => {
    if (user) {
      navigate('/locales');
    }
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrores({});
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate('/locales');
    } catch (error) {
      setErrores({ general: 'Credenciales incorrectas' });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrores({});
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Usuario Google:', user.uid);
      // Verificar si el usuario existe en Firestore, si no, crearlo como cliente
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (!userDoc.exists()) {
        console.log('Creando documento en Firestore...');
        await setDoc(doc(db, 'usuarios', user.uid), {
          nombre: user.displayName || 'Usuario Google',
          email: user.email,
          tipo: 'cliente',
          telefono: '',
          createdAt: new Date(),
        });
        console.log('Documento creado exitosamente');
      } else {
        console.log('Usuario ya existe en Firestore');
      }
      navigate('/locales');
    } catch (error) {
      console.error('Error detallado:', error.code, error.message);
      setErrores({ general: `Error: ${error.message}` });
    }
    setLoading(false);
  };

  return (
    <>
      {user ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Redirigiendo...</div>
      ) : (
        <div className="login-page">
          <div className="registro-card">
            <h2>Iniciar Sesión</h2>
            <p>Accede a tu cuenta para explorar promociones.</p>

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

        <div className="divider">O</div>
        <button onClick={handleGoogleLogin} className="google-btn" disabled={loading}>
          🔵 Iniciar con Google
        </button>

        <p>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;