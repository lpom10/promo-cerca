// src/components/Registro.jsx
import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../styles/auth.css';

const Registro = () => {
  const [searchParams] = useSearchParams();
  const [tipo, setTipo] = useState(searchParams.get('tipo') === 'empresa' ? 'empresa' : 'cliente');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', confirmPassword: '',
    telefono: '', negocio: '', categoria: '', direccion: '', ruc: '',
  });
  const [errores, setErrores] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validar = () => {
    const e = {};
    if (!form.nombre.trim())             e.nombre = 'El nombre es requerido';
    if (!form.email.includes('@'))       e.email  = 'Correo no válido';
    if (form.password.length < 8)       e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (tipo === 'empresa') {
      if (!form.negocio.trim()) e.negocio   = 'El nombre del negocio es requerido';
      if (!form.categoria)      e.categoria = 'Selecciona una categoría';
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
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'usuarios', userCred.user.uid), {
        nombre: form.nombre,
        email: form.email,
        tipo,
        telefono: form.telefono || '',
        negocio:   tipo === 'empresa' ? form.negocio   : '',
        categoria: tipo === 'empresa' ? form.categoria : '',
        direccion: tipo === 'empresa' ? form.direccion : '',
        ruc:       tipo === 'empresa' ? form.ruc       : '',
        estado: tipo === 'empresa' ? 'pendiente' : 'aprobado',
        createdAt: new Date(),
      });
      setStep(2);
    } catch (error) {
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

  /* ── Pantalla de éxito ── */
  if (step === 2) {
    return (
      <div className="auth-page" data-type={tipo}>
        <div className="auth-panel-brand">
          <div className="brand-content">
            <div className="brand-logo-wrap">
              <span className="brand-logo-icon">📍</span>
              <span className="brand-logo-text">Promo Cerca</span>
            </div>
            <p className="brand-tagline">¡Registro exitoso!</p>
            <p className="brand-desc">
              {tipo === 'empresa'
                ? 'Tu negocio ha sido registrado y está en proceso de verificación.'
                : 'Ya puedes explorar las mejores promociones cerca de ti.'}
            </p>
          </div>
        </div>

        <div className="auth-panel-form">
          <div className="auth-form-container">
            <div className="auth-card">
              <div className="auth-success">
                <div className="auth-success-icon">
                  {tipo === 'empresa' ? '🏢' : '🎉'}
                </div>
                <h2>¡Cuenta creada con éxito!</h2>
                {tipo === 'empresa' ? (
                  <>
                    <p>
                      Tu negocio <strong>"{form.negocio}"</strong> ha sido registrado correctamente.
                    </p>
                    <div className="info-box">
                      📋 <strong>Próximo paso:</strong> Un administrador revisará tu solicitud en breve. Recibirás acceso una vez sea aprobada.
                    </div>
                    <Link to="/" className="auth-success-btn">Ir al inicio →</Link>
                  </>
                ) : (
                  <>
                    <p>
                      Bienvenido, <strong>{form.nombre}</strong>. Tu cuenta está lista para explorar promociones cerca de ti.
                    </p>
                    <Link to="/cliente/dashboard" className="auth-success-btn">Explorar promociones →</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulario principal ── */
  return (
    <div className="auth-page" data-type={tipo}>

      {/* Panel izquierdo */}
      <div className="auth-panel-brand">
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <span className="brand-logo-icon">📍</span>
            <span className="brand-logo-text">Promo Cerca</span>
          </div>
          <p className="brand-tagline">
            {tipo === 'empresa' ? 'Haz crecer tu negocio' : 'Ahorra con promociones locales'}
          </p>
          <p className="brand-desc">
            {tipo === 'empresa'
              ? 'Publica promociones, llega a clientes cercanos y monitorea el impacto de tus campañas.'
              : 'Crea tu cuenta gratuita y accede a cientos de promociones y descuentos en tu ciudad.'}
          </p>
          <div className="brand-features">
            {tipo === 'empresa' ? (
              <>
                <div className="brand-feature"><span className="brand-feature-icon">📍</span><span>Aparece en el mapa para clientes cercanos</span></div>
                <div className="brand-feature"><span className="brand-feature-icon">📈</span><span>Obten tu membresia y accede a diferentes tipos de publicidad</span></div>
                <div className="brand-feature"><span className="brand-feature-icon">✅</span><span>Aprobación rápida en 24-48 h</span></div>
              </>
            ) : (
              <>
                <div className="brand-feature"><span className="brand-feature-icon">🗺️</span><span>Descubre descuentos en tu barrio</span></div>
                <div className="brand-feature"><span className="brand-feature-icon">🔖</span><span>Guarda y comparte tus favoritos</span></div>
                <div className="brand-feature"><span className="brand-feature-icon">🆓</span><span>100% gratis para clientes</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Panel formulario */}
      <div className="auth-panel-form">
        <div className="auth-form-container">
          <div className="auth-card">

            <div className="auth-header">
              <h2 className="auth-title">Crear cuenta</h2>
              <p className="auth-subtitle">Elige tu tipo de cuenta para comenzar</p>
            </div>

            {/* Selector de tipo */}
            <div className="auth-tipo-selector">
              <button
                type="button"
                className={`auth-tipo-btn${tipo === 'cliente' ? ' active' : ''}`}
                onClick={() => setTipo('cliente')}
              >
                <span className="tipo-icon">👤</span>
                Cliente
              </button>
              <button
                type="button"
                className={`auth-tipo-btn${tipo === 'empresa' ? ' active' : ''}`}
                onClick={() => setTipo('empresa')}
              >
                <span className="tipo-icon">🏢</span>
                Empresa
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>

              {/* Nombre */}
              <div className="auth-field">
                <label className="auth-label">Nombre completo</label>
                <input
                  className={`auth-input${errores.nombre ? ' is-error' : ''}`}
                  name="nombre" value={form.nombre} onChange={handleChange}
                  placeholder="Tu nombre y apellido"
                />
                {errores.nombre && <span className="auth-field-error">{errores.nombre}</span>}
              </div>

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label">Correo electrónico</label>
                <input
                  className={`auth-input${errores.email ? ' is-error' : ''}`}
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                />
                {errores.email && <span className="auth-field-error">{errores.email}</span>}
              </div>

              {/* Contraseña */}
              <div className="auth-field">
                <label className="auth-label">Contraseña</label>
                <input
                  className={`auth-input${errores.password ? ' is-error' : ''}`}
                  type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                />
                {errores.password && <span className="auth-field-error">{errores.password}</span>}
              </div>

              {/* Confirmar contraseña */}
              <div className="auth-field">
                <label className="auth-label">Confirmar contraseña</label>
                <input
                  className={`auth-input${errores.confirmPassword ? ' is-error' : ''}`}
                  type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  placeholder="Repite tu contraseña"
                />
                {errores.confirmPassword && <span className="auth-field-error">{errores.confirmPassword}</span>}
              </div>

              {/* Teléfono */}
              <div className="auth-field">
                <label className="auth-label">
                  Teléfono <span className="optional">(opcional)</span>
                </label>
                <input
                  className="auth-input"
                  name="telefono" value={form.telefono} onChange={handleChange}
                  placeholder="0991234567"
                />
              </div>

              {/* Sección empresa */}
              {tipo === 'empresa' && (
                <>
                  <div className="auth-section-divider">
                    <hr />
                    <span className="auth-section-label">Datos del negocio</span>
                    <hr />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Nombre del negocio</label>
                    <input
                      className={`auth-input${errores.negocio ? ' is-error' : ''}`}
                      name="negocio" value={form.negocio} onChange={handleChange}
                      placeholder="Nombre de tu empresa o negocio"
                    />
                    {errores.negocio && <span className="auth-field-error">{errores.negocio}</span>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Categoría</label>
                    <select
                      className={`auth-input${errores.categoria ? ' is-error' : ''}`}
                      name="categoria" value={form.categoria} onChange={handleChange}
                    >
                      <option value="">Selecciona una categoría...</option>
                      <option value="restaurantes">🍽️ Restaurante</option>
                      <option value="cafeterias">☕ Cafetería</option>
                      <option value="tiendas">🛍️ Tienda</option>
                      <option value="servicios">🔧 Servicios</option>
                      <option value="salud">💊 Salud</option>
                    </select>
                    {errores.categoria && <span className="auth-field-error">{errores.categoria}</span>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">
                      Dirección <span className="optional">(opcional)</span>
                    </label>
                    <input
                      className="auth-input"
                      name="direccion" value={form.direccion} onChange={handleChange}
                      placeholder="Av. Principal 123, Ciudad"
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">
                      RUC <span className="required-tag">obligatorio</span>
                    </label>
                    <input
                      className={`auth-input${errores.ruc ? ' is-error' : ''}`}
                      name="ruc" value={form.ruc} onChange={handleChange}
                      placeholder="1234567890001"
                    />
                    {errores.ruc && <span className="auth-field-error">{errores.ruc}</span>}
                  </div>
                </>
              )}

              {errores.general && (
                <div className="auth-alert-error">{errores.general}</div>
              )}

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? '⏳ Creando cuenta...' : `Crear cuenta ${tipo === 'empresa' ? 'de empresa' : 'gratis'}`}
              </button>
            </form>

            <div className="auth-footer">
              <p>¿Ya tienes cuenta? <Link to="/login-tipo" className="auth-link">Inicia sesión</Link></p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default Registro;
