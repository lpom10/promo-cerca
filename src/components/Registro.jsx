import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Registro = () => {
  const [searchParams] = useSearchParams();
  const [tipo, setTipo] = useState(searchParams.get('tipo') === 'empresa' ? 'empresa' : 'cliente');
  const [step, setStep] = useState(1); // 1 = formulario, 2 = éxito
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    negocio: '',
    categoria: '',
    direccion: '',
    ruc: '',
    cedula: '',
  });
  const [errores, setErrores] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cedula' || name === 'ruc') {
      const numericValue = value.replace(/\D/g, '');
      setForm((f) => ({ ...f, [name]: numericValue }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.email.includes('@')) e.email = 'Correo no válido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (tipo === 'cliente') {
      if (!form.cedula) {
        e.cedula = 'La cédula es requerida';
      } else if (form.cedula.length !== 10) {
        e.cedula = 'La cédula debe tener 10 dígitos';
      }
    }
    if (tipo === 'empresa') {
      if (!form.negocio.trim()) e.negocio = 'El nombre del negocio es requerido';
      if (!form.categoria) e.categoria = 'Selecciona una categoría';      
      if (!form.ruc) {
        e.ruc = 'El RUC es requerido';
      } else if (form.ruc.length !== 13) {
        e.ruc = 'El RUC debe tener 13 dígitos';
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validar();
    if (Object.keys(e2).length > 0) { setErrores(e2); return; }
    setErrores({});
    setLoading(true);
    try {
      if (tipo === 'cliente') {
        const q = query(collection(db, 'usuarios'), where('cedula', '==', form.cedula));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setErrores({ cedula: 'Esta cédula ya está registrada' });
          setLoading(false);
          return;
        }
      } else if (tipo === 'empresa') {
        const q = query(collection(db, 'empresa'), where('ruc', '==', form.ruc));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setErrores({ ruc: 'Este RUC ya está registrado' });
          setLoading(false);
          return;
        }
      }

      console.log('Creando usuario en Auth...');
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      console.log('Usuario Auth creado:', user.uid);

      // Determinar colección según tipo
      const coleccion = tipo === 'empresa' ? 'empresa' : 'usuarios';
      
      console.log(`Guardando datos en Firestore - colección: ${coleccion}...`);
      // Guardar datos adicionales en Firestore
      const datosUsuario = {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono || '',
        // Estado según tipo de usuario
        estado: tipo === 'empresa' ? 'pendiente' : 'aprobado',
        createdAt: new Date(),
      };

      // Agregar campos específicos según tipo
      if (tipo === 'empresa') {
        datosUsuario.negocio = form.negocio;
        datosUsuario.categoria = form.categoria;
        datosUsuario.direccion = form.direccion;
        datosUsuario.ruc = form.ruc;
      } else {
        datosUsuario.cedula = form.cedula;
      }

      await setDoc(doc(db, coleccion, user.uid), datosUsuario);
      console.log('Datos guardados en Firestore exitosamente');

      setStep(2);
    } catch (error) {
      console.error('Error detallado:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        setErrores({ email: 'El email ya está registrado' });
      } else if (error.code === 'permission-denied') {
        setErrores({ general: 'Permisos de Firestore insuficientes. Verifica las reglas de seguridad.' });
      } else {
        setErrores({ general: `Error: ${error.message}` });
      }
    }
    setLoading(false);
  };

  if (step === 2) {
    return (
      <div className="registro-page">
        <div className="registro-card exito">
          <div className="exito-icon">🎉</div>
          <h2>¡Cuenta creada con éxito!</h2>
          {tipo === 'empresa' ? (
            <>
              <p>
                Tu negocio <strong>"{form.negocio}"</strong> ha sido registrado y está <strong>pendiente de aprobación</strong>.
              </p>
              <p className="info-texto">
                Un administrador revisará tu solicitud en breve. Recibirás una notificación cuando sea aprobada.
              </p>
              <Link to="/" className="exito-btn">
                Ir al inicio
              </Link>
            </>
          ) : (
            <>
              <p>
                Bienvenido, <strong>{form.nombre}</strong>. Ya puedes explorar las mejores promociones cerca de ti.
              </p>
              <Link to="/cliente/dashboard" className="exito-btn">
                Ver promociones
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="registro-page">
      <div className="registro-card">
        <h2>Crear cuenta</h2>
        <p className="registro-sub">Crea tu cuenta para acceder a los beneficios.</p>

       
        <div className="tipo-selector">
          <button
            type="button"
            className={`tipo-btn ${tipo === 'cliente' ? 'active' : ''}`}
            onClick={() => setTipo('cliente')}
          >
            👤 Cliente
          </button>
          <button
            type="button"
            className={`tipo-btn ${tipo === 'empresa' ? 'active' : ''}`}
            onClick={() => setTipo('empresa')}
          >
            🏢 Empresa
          </button>
        </div>

        <form className="registro-form" onSubmit={handleSubmit} noValidate>
         
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre y apellido"
              className={errores.nombre ? 'input-error' : ''}
            />
            {errores.nombre && <span className="campo-error">{errores.nombre}</span>}
          </div>

          
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className={errores.email ? 'input-error' : ''}
            />
            {errores.email && <span className="campo-error">{errores.email}</span>}
          </div>

          
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              className={errores.password ? 'input-error' : ''}
            />
            {errores.password && <span className="campo-error">{errores.password}</span>}
          </div>

          
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              className={errores.confirmPassword ? 'input-error' : ''}
            />
            {errores.confirmPassword && <span className="campo-error">{errores.confirmPassword}</span>}
          </div>

          
          <div className="form-group">
            <label>Teléfono <span className="opcional">(opcional)</span></label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="0991234567"
            />
          </div>

          {tipo === 'cliente' && (
            <div className="form-group">
              <label>Cédula <span className="obligatorio">(obligatorio)</span></label>
              <input
                name="cedula"
                value={form.cedula}
                onChange={handleChange}
                placeholder="ingrese su cedula"
                maxLength="10"
                className={errores.cedula ? 'input-error' : ''}
              />
              {errores.cedula && <span className="campo-error">{errores.cedula}</span>}
            </div>
          )}

          
          {tipo === 'empresa' && (
            <>
              <hr className="form-divider" />
              <p className="form-section-label">Información del negocio</p>

              <div className="form-group">
                <label>Nombre del negocio</label>
                <input
                  name="negocio"
                  value={form.negocio}
                  onChange={handleChange}
                  required
                  placeholder="Nombre de tu empresa o negocio"
                  className={errores.negocio ? 'input-error' : ''}
                />
                {errores.negocio && <span className="campo-error">{errores.negocio}</span>}
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                  className={errores.categoria ? 'input-error' : ''}
                >
                  <option value="">Selecciona una categoría...</option>
                  <option value="restaurantes">🍽️ Restaurante</option>
                  <option value="cafeterias">☕ Cafetería</option>
                  <option value="tiendas">🛍️ Tienda</option>
                  <option value="servicios">🔧 Servicios</option>
                  <option value="salud">💊 Salud</option>
                </select>
                {errores.categoria && <span className="campo-error">{errores.categoria}</span>}
              </div>

              <div className="form-group">
                <label>Dirección <span className="opcional">(opcional)</span></label>
                <input
                  name="direccion"
                  required
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Av. Principal 123, Ciudad"
                  
                />
                {errores.direccion && <span className="campo-error">{errores.direccion}</span>}
              </div>
              <div className="form-group">
                <label>RUC: <span className="obligatorio">(obligatorio)</span></label>
                <input
                    name="ruc"
                    value={form.ruc}
                    onChange={handleChange}
                    placeholder='1234567890001'
                    maxLength="13"
                    required
                    className={errores.ruc ? 'input-error' : ''}
                />
                {errores.ruc && <span className="campo-error">{errores.ruc}</span>}

              </div>
            </>
          )}

          <button type="submit" className="registro-submit" disabled={loading}>
            {loading ? '⏳ Creando cuenta...' : '✅ Crear cuenta'}
          </button>
        </form>

        <p>¿Ya tienes cuenta? <Link to="/login-tipo">Inicia sesión</Link></p>
      </div>
    </div>
  );
};

export default Registro;
