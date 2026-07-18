import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { registrarConEmail, registrarConGoogle } from '../services/authService';
import {
  validarEmail,
  validarPassword,
  validarTelefono,
  validarCedula,
  validarRuc,
  validarUbicacion,
  sanitizar,
  sanitizarNumero,
} from '../../../shared/utils/validators';
import logo from '../../../assets/logo.png';
import { categorias } from '../../../data/categorias';
import { rateLimiter } from '../../../shared/utils/rateLimiter';
import '../styles/auth.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const GoogleIcon = () => (
  <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) { setPosition(e.latlng); },
  });
  return position === null ? null : <Marker position={position} />;
};

const FORM_INICIAL = {
  nombre: '', email: '', password: '', confirmPassword: '',
  telefono: '', negocio: '', categoria: '', direccion: '',
  ruc: '', cedula: '', codigoReferido: '', lat: null, lng: null,
};

const Registro = () => {
  const [searchParams] = useSearchParams();
  const [tipo, setTipo] = useState(searchParams.get('tipo') === 'empresa' ? 'empresa' : 'cliente');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (['cedula', 'ruc', 'telefono'].includes(name)) newValue = sanitizarNumero(value);
    else if (['nombre', 'negocio', 'direccion'].includes(name)) newValue = sanitizar(value);

    setForm((f) => ({ ...f, [name]: newValue }));
    if (errores[name]) setErrores(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    else if (form.nombre.length < 3) e.nombre = 'El nombre debe tener al menos 3 caracteres';
    if (!validarEmail(form.email)) e.email = 'Email inválido';
    const passVal = validarPassword(form.password);
    if (!passVal.valida) e.password = passVal.error;
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (!validarTelefono(form.telefono)) e.telefono = 'Teléfono inválido (debe tener 10 dígitos)';
    if (tipo === 'cliente' && !validarCedula(form.cedula)) e.cedula = 'Cédula inválida (debe tener 10 dígitos)';
    if (tipo === 'empresa') {
      if (!form.negocio.trim()) e.negocio = 'El nombre del negocio es requerido';
      if (!form.categoria) e.categoria = 'Selecciona una categoría';
      if (!validarRuc(form.ruc)) e.ruc = 'RUC inválido (debe tener 13 dígitos)';
      if (!form.direccion.trim()) e.direccion = 'La dirección es requerida';
      if (!validarUbicacion(form.lat, form.lng).valida) e.mapa = 'Debes seleccionar la ubicación en el mapa';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rl = rateLimiter.check(`registro_${form.email}`, 3, 60000);
    if (!rl.permitido) {
      setErrores({ general: `${rl.mensaje} La protección real del acceso se aplica en el servidor.` });
      return;
    }

    const erroresValidacion = validar();
    if (Object.keys(erroresValidacion).length > 0) { setErrores(erroresValidacion); return; }

    setErrores({});
    setLoading(true);

    try {
      await registrarConEmail(tipo, form);
      rateLimiter.reset(`registro_${form.email}`);
      setStep(2);
    } catch (error) {
      // authService lanza { campo, mensaje } para duplicados, o { mensaje } para el resto
      if (error.campo) {
        setErrores({ [error.campo]: error.mensaje });
      } else {
        setErrores({ general: error.mensaje || 'Error al crear la cuenta. Intenta de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (tipo !== 'cliente') {
      setErrores({ general: 'El registro con Google solo está disponible para clientes' });
      return;
    }
    setErrores({});
    setLoading(true);
    try {
      await registrarConGoogle(tipo, form);
      setStep(2);
    } catch (error) {
      setErrores({ general: error.mensaje || 'Error con Google. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Pantalla de éxito ── */
  if (step === 2) {
    return (
      <div className="auth-page" data-type={tipo}>
        <div className="auth-panel-brand">
          <div className="brand-content">
            <div className="brand-logo-wrap">
              <img src={logo} alt="Promo Cerca Logo" className="brand-logo-img" style={{ maxWidth: '180px', marginBottom: '20px' }} />
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
                <div className="auth-success-icon">{tipo === 'empresa' ? 'Check' : 'Exito'}</div>
                <h2>¡Cuenta creada con éxito!</h2>
                {tipo === 'empresa' ? (
                  <>
                    <p>Tu negocio <strong>"{form.negocio}"</strong> ha sido registrado correctamente.</p>
                    <div className="info-box">
                      <strong>Próximo paso:</strong> Un administrador revisará tu solicitud en breve.
                    </div>
                    <a href="/" className="auth-success-btn">Ir al inicio</a>
                  </>
                ) : (
                  <>
                    <p>Bienvenido, <strong>{form.nombre}</strong>. Tu cuenta está lista.</p>
                    <a href="/cliente/dashboard" className="auth-success-btn">Explorar promociones</a>
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
      <div className="auth-panel-brand">
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <img src={logo} alt="Promo Cerca Logo" className="brand-logo-img" style={{ maxWidth: '180px', marginBottom: '20px' }} />
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
                <div className="brand-feature"><span>Aparece en el mapa para clientes cercanos</span></div>
                <div className="brand-feature"><span>Accede a diferentes tipos de publicidad</span></div>
                <div className="brand-feature"><span>Aprobación rápida en 24-48 h</span></div>
              </>
            ) : (
              <>
                <div className="brand-feature"><span>Descubre descuentos en tu barrio</span></div>
                <div className="brand-feature"><span>Guarda y comparte tus favoritos</span></div>
                <div className="brand-feature"><span>100% gratis para clientes</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="auth-panel-form">
        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2 className="auth-title">Crear cuenta</h2>
              <p className="auth-subtitle">Elige tu tipo de cuenta para comenzar</p>
            </div>

            <div className="auth-tipo-selector">
              <button type="button" className={`auth-tipo-btn${tipo === 'cliente' ? ' active' : ''}`} onClick={() => setTipo('cliente')}>Cliente</button>
              <button type="button" className={`auth-tipo-btn${tipo === 'empresa' ? ' active' : ''}`} onClick={() => setTipo('empresa')}>Empresa</button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>

              <div className="auth-field">
                <label className="auth-label">Nombre completo</label>
                <input className="auth-input" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Tu nombre y apellido" />
                {errores.nombre && <span className="auth-field-error">{errores.nombre}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label">Correo electrónico</label>
                <input className="auth-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                {errores.email && <span className="auth-field-error">{errores.email}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label">Contraseña</label>
                <input className="auth-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" />
                {errores.password && <span className="auth-field-error">{errores.password}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label">Confirmar contraseña</label>
                <input className="auth-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repite tu contraseña" />
                {errores.confirmPassword && <span className="auth-field-error">{errores.confirmPassword}</span>}
              </div>

              {tipo === 'cliente' && (
                <div className="auth-field">
                  <label className="auth-label">Cédula <span className="required-tag">obligatorio</span></label>
                  <input className="auth-input" name="cedula" value={form.cedula} onChange={handleChange} placeholder="Ingrese su cédula" maxLength="10" />
                  {errores.cedula && <span className="auth-field-error">{errores.cedula}</span>}
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">Teléfono <span className="required-tag">obligatorio</span></label>
                <input className="auth-input" name="telefono" value={form.telefono} onChange={handleChange} placeholder="0991234567" maxLength="10" />
                {errores.telefono && <span className="auth-field-error">{errores.telefono}</span>}
              </div>

              {tipo === 'cliente' && (
                <div className="auth-field">
                  <label className="auth-label">Código de referido <span className="optional">(opcional)</span></label>
                  <input className="auth-input" name="codigoReferido" value={form.codigoReferido} onChange={handleChange} placeholder="Ej: PROMOABC1" />
                </div>
              )}

              {tipo === 'empresa' && (
                <>
                  <div className="auth-section-divider">
                    <hr /><span className="auth-section-label">Datos del negocio</span><hr />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Nombre del negocio</label>
                    <input className="auth-input" name="negocio" value={form.negocio} onChange={handleChange} placeholder="Nombre de tu empresa o negocio" />
                    {errores.negocio && <span className="auth-field-error">{errores.negocio}</span>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Categoría</label>
                    <select className="auth-input" name="categoria" value={form.categoria} onChange={handleChange}>
                      <option value="">Selecciona una categoría...</option>
                      {categorias.filter(cat => cat.id !== 'todos').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    {errores.categoria && <span className="auth-field-error">{errores.categoria}</span>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Dirección <span className="optional">(opcional)</span></label>
                    <input className="auth-input" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Av. Principal 123, Ciudad" />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">RUC <span className="required-tag">obligatorio</span></label>
                    <input className="auth-input" name="ruc" value={form.ruc} onChange={handleChange} placeholder="1234567890001" />
                    {errores.ruc && <span className="auth-field-error">{errores.ruc}</span>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Ubicación en el mapa <span className="required-tag">obligatorio</span></label>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>Haz clic en el mapa para fijar la ubicación de tu negocio.</p>
                    <div style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid var(--auth-border)', position: 'relative', zIndex: 1 }}>
                      <MapContainer center={[-4.007, -79.211]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker
                          position={form.lat && form.lng ? { lat: form.lat, lng: form.lng } : null}
                          setPosition={(pos) => setForm({ ...form, lat: pos.lat, lng: pos.lng })}
                        />
                      </MapContainer>
                    </div>
                    {errores.mapa && <span className="auth-field-error">{errores.mapa}</span>}
                  </div>
                </>
              )}

              {errores.general && <div className="auth-alert-error">{errores.general}</div>}

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? '⏳ Creando cuenta...' : `Crear cuenta ${tipo === 'empresa' ? 'de empresa' : 'e iniciar sesión'}`}
              </button>

              {tipo === 'cliente' && (
                <>
                  <div className="auth-divider-or"><hr /><span>o regístrate con</span><hr /></div>
                  <button onClick={handleGoogleRegister} type="button" className="auth-btn-google" disabled={loading}>
                    <GoogleIcon />
                    Registrarse con Google
                  </button>
                </>
              )}
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