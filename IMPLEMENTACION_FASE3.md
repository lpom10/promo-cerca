# GUÍA DE IMPLEMENTACIÓN - FASE 3 🚀

## 📋 Resumen de Cambios Requeridos

Este documento describe los cambios arquitectónicos necesarios para mejorar significativamente la experiencia de usuario y funcionalidad del sistema.

---

## 1️⃣ UNIFICACIÓN DE LOGIN/REGISTRO

### Objetivo
Crear un sistema de autenticación único donde el mismo formulario valide si el usuario es cliente o empresa basándose en los datos en la base de datos.

### Cambios Necesarios

#### 1.1 Actualizar estructura de usuario en Firestore
```javascript
// Colección: usuarios
{
  uid: "user_001",
  email: "usuario@email.com",
  tipo: "cliente" | "empresa" | "admin",
  
  // Datos de Cliente
  nombreCompleto: "Juan Pérez",
  fotoPerfil: "https://...",
  datosPersonales: {
    telefono: "+34 600 123 456",
    ciudad: "Madrid",
    fechaNacimiento: "1990-01-15"
  },
  tickets: [],        // array de IDs de tickets
  favoritos: [],      // array de IDs favoritos
  createdAt: timestamp,
  
  // Datos de Empresa
  nombreNegocio: "Pizzería XYZ",
  logoEmpresa: "https://...",
  descripcionNegocio: "Pizzería tradicional...",
  horarios: {
    lunes: { apertura: "12:00", cierre: "23:00" },
    martes: { apertura: "12:00", cierre: "23:00" },
    // ... resto de días
  },
  responsable: "Juan García",
  categoriaEmpresa: "restaurantes",
  direccionEmpresa: "Calle Principal 123",
  ruc: "12345678",
  suscripcionActiva: "sub_001",
  suscripcionEstado: "activa" | "inactiva",
  aprobadoPor: "admin_001",
  fechaAprobacion: timestamp,
  banderaVerificacion: boolean
}
```

#### 1.2 Nuevo formulario unificado de login (LoginUnificado.jsx)
```javascript
// Componente que:
// 1. Acepta email y contraseña
// 2. Intenta autenticación
// 3. Busca el documento de usuario
// 4. Verifica campo 'tipo'
// 5. Redirige según rol (cliente, empresa, admin)
// 6. Muestra interfaz correspondiente

import { useState } from 'react';
import { loginUsuario } from '../services/authService';

export default function LoginUnificado() {
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    
    try {
      const usuario = await loginUsuario(email, contraseña);
      // El servicio detectará el tipo y redirigirá automáticamente
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h1>Bienvenido a Promo Cerca</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          required
        />
        
        <button type="submit" disabled={cargando}>
          {cargando ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
      </form>
      
      <p>¿No tienes cuenta? <a href="/registro-cliente">Cliente</a> | <a href="/registro-empresa">Empresa</a></p>
    </div>
  );
}
```

---

## 2️⃣ REDISEÑO DE NAVBAR Y CIERRE DE SESIÓN

### Objetivo
Eliminar botón de mapa del navbar y agregar cierre de sesión en perfil.

### Cambios Necesarios

#### 2.1 NavBar Rediseñado (Navbar.jsx)
```javascript
// El navbar debe mostrar:
// 1. Logo/marca
// 2. Enlaces de navegación (dinámicos según rol)
// 3. Avatar del usuario con menú dropdown
// 4. Opción de cerrar sesión en el dropdown

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { usuarioActual, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    navigate('/login');
  };

  const renderNavegacion = () => {
    if (!usuarioActual) return null;

    if (usuarioActual.tipo === 'cliente') {
      return (
        <nav>
          <a href="/">Inicio</a>
          <a href="/promociones">Promociones</a>
          <a href="/empresas">Empresas</a>
          <a href="/dashboard">Mi Dashboard</a>
        </nav>
      );
    }

    if (usuarioActual.tipo === 'empresa') {
      return (
        <nav>
          <a href="/">Inicio</a>
          <a href="/gestor-promociones">Gestionar Promociones</a>
          <a href="/dashboard">Mi Dashboard</a>
          <a href="/suscripcion">Suscripción</a>
        </nav>
      );
    }

    if (usuarioActual.tipo === 'admin') {
      return (
        <nav>
          <a href="/admin/dashboard">Panel de Control</a>
          <a href="/admin/empresas">Empresas</a>
          <a href="/admin/usuarios">Usuarios</a>
        </nav>
      );
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <h1>Promo Cerca</h1>
        </div>

        {renderNavegacion()}

        <div className="user-menu">
          <button 
            className="avatar-btn"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <img 
              src={usuarioActual?.fotoPerfil || '/default-avatar.png'} 
              alt="Avatar"
            />
          </button>

          {menuAbierto && (
            <div className="dropdown-menu">
              <a href="/perfil">Ver Perfil</a>
              <a href="/configuracion">Configuración</a>
              <button onClick={handleCerrarSesion}>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

## 3️⃣ MAPA EN VENTANA PRINCIPAL

### Objetivo
Mover el botón de mapa del navbar a la página principal con visualización de mapa reducido y descripción lateral.

### Cambios Necesarios

#### 3.1 Nuevo componente: MapaSeccion.jsx
```javascript
// Ubicar en: src/components/MapaSeccion.jsx

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import '../styles/mapa-seccion.css';

export default function MapaSeccion() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    // Cargar empresas con coordenadas
    cargarEmpresas();
  }, []);

  return (
    <section className="mapa-seccion">
      <div className="mapa-container">
        <div className="mapa-pequeno">
          <MapContainer center={[40.4168, -3.7038]} zoom={13}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            {empresas.map(empresa => (
              <Marker key={empresa.id} position={[empresa.lat, empresa.lng]}>
                <Popup>{empresa.nombreNegocio}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="mapa-descripcion">
          <h2>Descubre Empresas Cercanas</h2>
          <p>Visualiza todas las empresas participantes en tu área y accede a sus promociones exclusivas.</p>
          
          <div className="mapa-info">
            <p>✓ Más de 50 empresas activas</p>
            <p>✓ Promociones actualizadas diariamente</p>
            <p>✓ Ubicación en tiempo real</p>
          </div>

          <button 
            className="btn-ver-mapa"
            onClick={() => navigate('/mapa-completo')}
          >
            Ver Mapa Completo
          </button>
        </div>
      </div>
    </section>
  );
}
```

#### 3.1.1 Estilos CSS
```css
/* src/styles/mapa-seccion.css */

.mapa-seccion {
  padding: 60px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mapa-container {
  display: flex;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
}

.mapa-pequeno {
  flex: 0 0 45%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.mapa-descripcion {
  flex: 1;
  color: white;
  padding: 30px;
}

.mapa-descripcion h2 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: bold;
}

.mapa-descripcion p {
  font-size: 1.1rem;
  margin-bottom: 10px;
  line-height: 1.6;
}

.mapa-info {
  margin: 30px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.mapa-info p {
  margin: 10px 0;
  font-size: 1rem;
}

.btn-ver-mapa {
  background: white;
  color: #667eea;
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-ver-mapa:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .mapa-container {
    flex-direction: column;
    gap: 20px;
  }

  .mapa-pequeno {
    flex: 0 0 100%;
    height: 300px;
  }

  .mapa-descripcion h2 {
    font-size: 1.8rem;
  }
}
```

---

## 4️⃣ SISTEMA DE PERFILES MEJORADO

### Objetivo
Crear perfiles completos para clientes y empresas con datos editables.

#### 4.1 PerfilCliente.jsx
```javascript
// src/components/PerfilCliente.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfil, obtenerUsuario } from '../services/usuarioService';
import '../styles/perfil.css';

export default function PerfilCliente() {
  const { usuarioActual } = useAuth();
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    const usuario = await obtenerUsuario(usuarioActual.uid);
    setDatos(usuario);
  };

  const handleFotoPerfil = async (e) => {
    const archivo = e.target.files[0];
    // Subir a Storage y obtener URL
    setFotoPerfil(URL.createObjectURL(archivo));
  };

  const guardarCambios = async () => {
    setCargando(true);
    try {
      await actualizarPerfil(usuarioActual.uid, datos);
      setEditando(false);
      // Mostrar mensaje de éxito
    } finally {
      setCargando(false);
    }
  };

  if (!datos) return <div>Cargando...</div>;

  return (
    <div className="perfil-cliente">
      <div className="perfil-header">
        <div className="foto-perfil-container">
          <img 
            src={fotoPerfil || datos.fotoPerfil || '/default-avatar.png'} 
            alt="Perfil"
            className="foto-perfil"
          />
          {editando && (
            <label className="btn-cambiar-foto">
              Cambiar Foto
              <input 
                type="file" 
                onChange={handleFotoPerfil}
                accept="image/*"
              />
            </label>
          )}
        </div>

        <div className="info-basica">
          {editando ? (
            <>
              <input
                value={datos.nombreCompleto || ''}
                onChange={(e) => setDatos({...datos, nombreCompleto: e.target.value})}
                placeholder="Nombre completo"
              />
            </>
          ) : (
            <h1>{datos.nombreCompleto}</h1>
          )}
          <p>{datos.email}</p>
        </div>

        <button 
          className={`btn-editar ${editando ? 'activo' : ''}`}
          onClick={() => setEditando(!editando)}
        >
          {editando ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      <div className="perfil-contenido">
        <div className="seccion-datos">
          <h2>Datos Personales</h2>
          
          <div className="campo">
            <label>Teléfono</label>
            {editando ? (
              <input
                value={datos.datosPersonales?.telefono || ''}
                onChange={(e) => setDatos({
                  ...datos,
                  datosPersonales: {
                    ...datos.datosPersonales,
                    telefono: e.target.value
                  }
                })}
              />
            ) : (
              <p>{datos.datosPersonales?.telefono || 'No especificado'}</p>
            )}
          </div>

          <div className="campo">
            <label>Ciudad</label>
            {editando ? (
              <input
                value={datos.datosPersonales?.ciudad || ''}
                onChange={(e) => setDatos({
                  ...datos,
                  datosPersonales: {
                    ...datos.datosPersonales,
                    ciudad: e.target.value
                  }
                })}
              />
            ) : (
              <p>{datos.datosPersonales?.ciudad || 'No especificado'}</p>
            )}
          </div>

          <div className="campo">
            <label>Fecha de Nacimiento</label>
            {editando ? (
              <input
                type="date"
                value={datos.datosPersonales?.fechaNacimiento || ''}
                onChange={(e) => setDatos({
                  ...datos,
                  datosPersonales: {
                    ...datos.datosPersonales,
                    fechaNacimiento: e.target.value
                  }
                })}
              />
            ) : (
              <p>{datos.datosPersonales?.fechaNacimiento || 'No especificado'}</p>
            )}
          </div>
        </div>

        {editando && (
          <button 
            className="btn-guardar"
            onClick={guardarCambios}
            disabled={cargando}
          >
            {cargando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>

      <div className="btn-cerrar-sesion-perfil">
        <button onClick={() => cerrarSesion()}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
```

#### 4.2 PerfilEmpresa.jsx
```javascript
// src/components/PerfilEmpresa.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { actualizarPerfil } from '../services/usuarioService';
import '../styles/perfil-empresa.css';

export default function PerfilEmpresa() {
  const { usuarioActual } = useAuth();
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState(null);
  const [horarios, setHorarios] = useState({});

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    // Cargar datos de la empresa
    const empresa = await obtenerEmpresa(usuarioActual.uid);
    setDatos(empresa);
    setHorarios(empresa.horarios || {});
  };

  const guardarCambios = async () => {
    await actualizarPerfil(usuarioActual.uid, { ...datos, horarios });
    setEditando(false);
  };

  const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  if (!datos) return <div>Cargando...</div>;

  return (
    <div className="perfil-empresa">
      <div className="empresa-header">
        <div className="logo-container">
          <img 
            src={datos.logoEmpresa || '/default-logo.png'} 
            alt="Logo"
            className="logo-empresa"
          />
          {editando && (
            <label className="btn-cambiar-logo">
              Cambiar Logo
              <input type="file" accept="image/*" />
            </label>
          )}
        </div>

        <div className="info-empresa">
          {editando ? (
            <input
              value={datos.nombreNegocio || ''}
              onChange={(e) => setDatos({...datos, nombreNegocio: e.target.value})}
              className="input-nombre-negocio"
            />
          ) : (
            <h1>{datos.nombreNegocio}</h1>
          )}
          
          <div className="badges">
            <span className="badge categoria">{datos.categoriaEmpresa}</span>
            <span className={`badge suscripcion ${datos.suscripcionEstado}`}>
              {datos.suscripcionEstado === 'activa' ? '✓ Suscripción Activa' : '✗ Sin Suscripción'}
            </span>
          </div>
        </div>

        <button 
          className="btn-editar"
          onClick={() => setEditando(!editando)}
        >
          {editando ? 'Cancelar' : 'Editar Información'}
        </button>
      </div>

      <div className="empresa-contenido">
        <section className="seccion">
          <h2>Descripción del Negocio</h2>
          {editando ? (
            <textarea
              value={datos.descripcionNegocio || ''}
              onChange={(e) => setDatos({...datos, descripcionNegocio: e.target.value})}
              rows="4"
            />
          ) : (
            <p>{datos.descripcionNegocio}</p>
          )}
        </section>

        <section className="seccion">
          <h2>Información de Contacto</h2>
          <div className="campo">
            <label>Dirección</label>
            {editando ? (
              <input
                value={datos.direccionEmpresa || ''}
                onChange={(e) => setDatos({...datos, direccionEmpresa: e.target.value})}
              />
            ) : (
              <p>{datos.direccionEmpresa}</p>
            )}
          </div>

          <div className="campo">
            <label>Responsable</label>
            {editando ? (
              <input
                value={datos.responsable || ''}
                onChange={(e) => setDatos({...datos, responsable: e.target.value})}
              />
            ) : (
              <p>{datos.responsable}</p>
            )}
          </div>
        </section>

        <section className="seccion">
          <h2>Horarios</h2>
          <div className="horarios-grid">
            {dias.map(dia => (
              <div key={dia} className="horario-dia">
                <label>{dia.charAt(0).toUpperCase() + dia.slice(1)}</label>
                {editando ? (
                  <>
                    <input
                      type="time"
                      value={horarios[dia]?.apertura || ''}
                      onChange={(e) => setHorarios({
                        ...horarios,
                        [dia]: {...horarios[dia], apertura: e.target.value}
                      })}
                    />
                    <input
                      type="time"
                      value={horarios[dia]?.cierre || ''}
                      onChange={(e) => setHorarios({
                        ...horarios,
                        [dia]: {...horarios[dia], cierre: e.target.value}
                      })}
                    />
                  </>
                ) : (
                  <p>{horarios[dia]?.apertura || '--'} - {horarios[dia]?.cierre || '--'}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {editando && (
          <button className="btn-guardar" onClick={guardarCambios}>
            Guardar Cambios
          </button>
        )}
      </div>

      <div className="btn-cerrar-sesion-perfil">
        <button onClick={() => cerrarSesion()}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
```

---

## 5️⃣ GESTOR DE PROMOCIONES MEJORADO (EMPRESA)

### Objetivo
Dashboard empresarial para gestionar todas las promociones con control total.

#### 5.1 GestorPromocionesMejorado.jsx
```javascript
// src/components/GestorPromocionesMejorado.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
  obtenerPromocionesPorEmpresa
} from '../services/promocionesService';
import '../styles/gestor-promociones.css';

export default function GestorPromocionesMejorado() {
  const { usuarioActual } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    descuento: '',
    categoria: '',
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    disponibilidad: '',
    limite: '',
    imagen: null,
    estado: 'activa'
  });

  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    const promos = await obtenerPromocionesPorEmpresa(usuarioActual.uid);
    setPromociones(promos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.titulo || !formData.descripcion) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (parseInt(formData.limite) <= 0) {
      alert('El límite de tickets debe ser mayor a 0');
      return;
    }

    const promocionData = {
      ...formData,
      empresaId: usuarioActual.uid,
      limite: parseInt(formData.limite),
      descuento: parseInt(formData.descuento)
    };

    try {
      if (editando) {
        await actualizarPromocion(editando.id, promocionData);
      } else {
        await crearPromocion(promocionData);
      }
      
      limpiarFormulario();
      cargarPromociones();
    } catch (error) {
      alert('Error al guardar promoción: ' + error.message);
    }
  };

  const handleEditar = (promo) => {
    setEditando(promo);
    setFormData(promo);
    setFormularioAbierto(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
      await eliminarPromocion(id);
      cargarPromociones();
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      descuento: '',
      categoria: '',
      fechaInicio: '',
      fechaFin: '',
      horaInicio: '',
      horaFin: '',
      disponibilidad: '',
      limite: '',
      imagen: null,
      estado: 'activa'
    });
    setEditando(null);
    setFormularioAbierto(false);
  };

  return (
    <div className="gestor-promociones">
      <div className="gestor-header">
        <h1>Gestor de Promociones</h1>
        <button 
          className="btn-crear"
          onClick={() => setFormularioAbierto(true)}
        >
          + Crear Nueva Promoción
        </button>
      </div>

      {formularioAbierto && (
        <div className="modal-overlay">
          <div className="modal-form">
            <h2>{editando ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ej: Descuento en pizzas"
                />
              </div>

              <div className="form-group">
                <label>Descripción *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Describe la promoción..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Descuento (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.descuento}
                    onChange={(e) => setFormData({...formData, descuento: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    <option value="">Selecciona categoría</option>
                    <option value="comida">Comida</option>
                    <option value="ropa">Ropa</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="belleza">Belleza</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio *</label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Fin *</label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio</label>
                  <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Hora Fin</label>
                  <input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Disponibilidad *</label>
                  <select
                    value={formData.disponibilidad}
                    onChange={(e) => setFormData({...formData, disponibilidad: e.target.value})}
                  >
                    <option value="">Selecciona</option>
                    <option value="todos-los-dias">Todos los días</option>
                    <option value="fin-de-semana">Fin de semana</option>
                    <option value="entre-semana">Entre semana</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Límite de Tickets (EXACTO) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.limite}
                    onChange={(e) => setFormData({...formData, limite: e.target.value})}
                    placeholder="Ej: 50"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Imagen de Promoción</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, imagen: e.target.files[0]})}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={limpiarFormulario} className="btn-cancelar">
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {editando ? 'Guardar Cambios' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="promociones-grid">
        {promociones.length === 0 ? (
          <p className="sin-promociones">No tienes promociones creadas. ¡Crea tu primera promoción!</p>
        ) : (
          promociones.map(promo => (
            <div key={promo.id} className="promo-card">
              {promo.imagen && <img src={promo.imagen} alt={promo.titulo} />}
              
              <div className="promo-content">
                <h3>{promo.titulo}</h3>
                <p className="descripcion">{promo.descripcion}</p>
                
                <div className="promo-detalles">
                  <span className="badge-descuento">{promo.descuento}% OFF</span>
                  <span className="badge-categoria">{promo.categoria}</span>
                </div>

                <div className="promo-info">
                  <p><strong>Límite:</strong> {promo.limite} tickets</p>
                  <p><strong>Disponibles:</strong> {promo.limite - (promo.ticketsGenerados || 0)}</p>
                  <p><strong>Vigencia:</strong> {promo.fechaInicio} a {promo.fechaFin}</p>
                </div>

                <div className="promo-actions">
                  <button 
                    className="btn-editar"
                    onClick={() => handleEditar(promo)}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn-eliminar"
                    onClick={() => handleEliminar(promo.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 6️⃣ SISTEMA DE FAVORITOS

### Objetivo
Permitir que clientes guarden promociones y empresas como favoritos.

#### 6.1 Colección en Firestore
```javascript
// Colección: favoritos
{
  id: "fav_001",
  clienteId: "uid_cliente",
  tipo: "promocion" | "empresa",
  referenciaId: "id_promocion_o_empresa",
  nombreReferencia: "Pizzería XYZ",
  fechaGuardado: timestamp,
  createdAt: timestamp
}
```

#### 6.2 Servicio de Favoritos (favoritos.service.js)
```javascript
import { db } from '../config/firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

export async function guardarFavorito(clienteId, tipo, referenciaId, nombreReferencia) {
  try {
    const favorito = await addDoc(collection(db, 'favoritos'), {
      clienteId,
      tipo,
      referenciaId,
      nombreReferencia,
      fechaGuardado: new Date(),
      createdAt: new Date()
    });
    return favorito.id;
  } catch (error) {
    throw error;
  }
}

export async function eliminarFavorito(clienteId, referenciaId) {
  try {
    const q = query(
      collection(db, 'favoritos'),
      where('clienteId', '==', clienteId),
      where('referenciaId', '==', referenciaId)
    );
    const docs = await getDocs(q);
    
    docs.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  } catch (error) {
    throw error;
  }
}

export async function obtenerFavoritos(clienteId, tipo = null) {
  try {
    let q;
    if (tipo) {
      q = query(
        collection(db, 'favoritos'),
        where('clienteId', '==', clienteId),
        where('tipo', '==', tipo)
      );
    } else {
      q = query(
        collection(db, 'favoritos'),
        where('clienteId', '==', clienteId)
      );
    }
    
    const docs = await getDocs(q);
    return docs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
}

export async function isFavorito(clienteId, referenciaId) {
  try {
    const q = query(
      collection(db, 'favoritos'),
      where('clienteId', '==', clienteId),
      where('referenciaId', '==', referenciaId)
    );
    const docs = await getDocs(q);
    return docs.docs.length > 0;
  } catch (error) {
    return false;
  }
}
```

---

## 7️⃣ SISTEMA DE TICKETS (CRÍTICO)

### Objetivo
Sistema robusto de tickets únicos con límite exacto y restricción de duplicados.

#### 7.1 Colección en Firestore
```javascript
// Colección: tickets
{
  id: "ticket_001",
  promocionId: "promo_001",
  clienteId: "uid_cliente",
  empresaId: "uid_empresa",
  codigo: "PROMO-ABC123",  // Único
  qrCode: "data:image/png;...",  // QR generado
  estado: "activo" | "canjeado" | "expirado",
  fechaGeneracion: timestamp,
  fechaCanjeado: timestamp,
  horaCanjeado: "12:30",
  detallesPromocion: {
    titulo: "Descuento en Pizzas",
    descuento: 20,
    empresa: "Pizzería XYZ"
  },
  createdAt: timestamp
}
```

#### 7.2 Servicio de Tickets (tickets.service.js)
```javascript
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import QRCode from 'qrcode';

// Generar código único
function generarCodigoTicket() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = 'PROMO-';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

// Generar QR
async function generarQR(datos) {
  try {
    const qr = await QRCode.toDataURL(JSON.stringify(datos));
    return qr;
  } catch (error) {
    console.error('Error generando QR:', error);
    throw error;
  }
}

// Verificar que el cliente NO tenga ticket para esta promoción
async function clienteTieneTicket(clienteId, promocionId) {
  const q = query(
    collection(db, 'tickets'),
    where('clienteId', '==', clienteId),
    where('promocionId', '==', promocionId),
    where('estado', 'in', ['activo', 'canjeado'])  // No contar expirados
  );

  const docs = await getDocs(q);
  return docs.docs.length > 0;
}

// Contar tickets generados de una promoción
async function contarTicketsGenerados(promocionId) {
  const q = query(
    collection(db, 'tickets'),
    where('promocionId', '==', promocionId),
    where('estado', 'in', ['activo', 'canjeado'])
  );

  const docs = await getDocs(q);
  return docs.docs.length;
}

// FUNCIÓN PRINCIPAL: Generar Ticket
export async function generarTicket(clienteId, promocionId, datosPromocion) {
  try {
    // 1. Verificar que el cliente NO tenga ticket
    const yaHayTicket = await clienteTieneTicket(clienteId, promocionId);
    if (yaHayTicket) {
      throw new Error('Ya tienes un ticket para esta promoción');
    }

    // 2. Verificar que NO se ha alcanzado el límite
    const ticketsGenerados = await contarTicketsGenerados(promocionId);
    if (ticketsGenerados >= datosPromocion.limite) {
      throw new Error('Esta promoción ha alcanzado su límite de tickets');
    }

    // 3. Generar código único y QR
    const codigo = generarCodigoTicket();
    const qrCode = await generarQR({
      ticket_id: codigo,
      promocion: datosPromocion.titulo,
      cliente: clienteId
    });

    // 4. Crear el ticket
    const ticket = await addDoc(collection(db, 'tickets'), {
      promocionId,
      clienteId,
      empresaId: datosPromocion.empresaId,
      codigo,
      qrCode,
      estado: 'activo',
      fechaGeneracion: new Date(),
      detallesPromocion: {
        titulo: datosPromocion.titulo,
        descuento: datosPromocion.descuento,
        empresa: datosPromocion.empresaNombre
      },
      createdAt: new Date()
    });

    // 5. Actualizar contador en promoción
    await updateDoc(doc(db, 'promociones', promocionId), {
      ticketsGenerados: increment(1)
    });

    return { id: ticket.id, codigo, qrCode };
  } catch (error) {
    throw error;
  }
}

// Obtener tickets del cliente
export async function obtenerTicketsCliente(clienteId, estado = null) {
  try {
    let q;
    if (estado) {
      q = query(
        collection(db, 'tickets'),
        where('clienteId', '==', clienteId),
        where('estado', '==', estado)
      );
    } else {
      q = query(
        collection(db, 'tickets'),
        where('clienteId', '==', clienteId)
      );
    }

    const docs = await getDocs(q);
    return docs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
}

// Obtener tickets de una empresa
export async function obtenerTicketsEmpresa(empresaId) {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('empresaId', '==', empresaId)
    );

    const docs = await getDocs(q);
    return docs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
}

// Canjear ticket (por la empresa)
export async function canjearTicket(ticketId, codigoVerificacion) {
  try {
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    const ticket = ticketDoc.data();

    // Verificar código
    if (ticket.codigo !== codigoVerificacion) {
      throw new Error('Código de ticket inválido');
    }

    // Actualizar ticket
    await updateDoc(doc(db, 'tickets', ticketId), {
      estado: 'canjeado',
      fechaCanjeado: new Date(),
      horaCanjeado: new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });

    return true;
  } catch (error) {
    throw error;
  }
}
```

#### 7.3 Componente para generar ticket (ClienteTicketButton.jsx)
```javascript
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generarTicket } from '../services/ticketsService';

export default function ClienteTicketButton({ promocion }) {
  const { usuarioActual } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  const handleGenerarTicket = async () => {
    setCargando(true);
    setError('');
    
    try {
      const nuevoTicket = await generarTicket(
        usuarioActual.uid,
        promocion.id,
        {
          titulo: promocion.titulo,
          descuento: promocion.descuento,
          limite: promocion.limite,
          empresaId: promocion.empresaId,
          empresaNombre: promocion.empresaNombre
        }
      );
      setTicket(nuevoTicket);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  if (ticket) {
    return (
      <div className="ticket-generado">
        <h3>¡Ticket Generado!</h3>
        <p className="codigo">{ticket.codigo}</p>
        <img src={ticket.qrCode} alt="QR" className="qr-code" />
        <p>Muestra este código en la empresa para canjear tu promoción</p>
        <button onClick={() => setTicket(null)}>Cerrar</button>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={handleGenerarTicket}
        disabled={cargando}
        className="btn-generar-ticket"
      >
        {cargando ? 'Generando...' : 'Obtener Ticket'}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
```

---

## 8️⃣ DASHBOARD EMPRESARIAL (MEJORADO)

### Objetivo
Panel de control completo con estadísticas profesionales.

#### 8.1 EmpresaDashboardMejorado.jsx
```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerEstadisticas } from '../services/estadisticasService';
import { obtenerTicketsEmpresa } from '../services/ticketsService';
import '../styles/dashboard-empresa.css';

export default function EmpresaDashboardMejorado() {
  const { usuarioActual } = useAuth();
  const [estadisticas, setEstadisticas] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const stats = await obtenerEstadisticas(usuarioActual.uid);
    const ticketsData = await obtenerTicketsEmpresa(usuarioActual.uid);
    setEstadisticas(stats);
    setTickets(ticketsData);
  };

  if (!estadisticas) return <div>Cargando...</div>;

  return (
    <div className="dashboard-empresa">
      <h1>Dashboard Empresarial</h1>

      {/* KPIs Principales */}
      <div className="kpis-grid">
        <div className="kpi-card">
          <h3>Ingresos Totales</h3>
          <p className="valor">${estadisticas.ingresosTotales.toFixed(2)}</p>
          <p className="subtext">Mes actual</p>
        </div>

        <div className="kpi-card">
          <h3>Tickets Generados</h3>
          <p className="valor">{estadisticas.ticketsGenerados}</p>
          <p className="subtext">Total activos y canjeados</p>
        </div>

        <div className="kpi-card">
          <h3>Tickets Canjeados</h3>
          <p className="valor">{estadisticas.ticketsCanjeados}</p>
          <p className="subtext">{estadisticas.porcentajeCanjeado}% de conversión</p>
        </div>

        <div className="kpi-card">
          <h3>Promociones Activas</h3>
          <p className="valor">{estadisticas.promocionesActivas}</p>
          <p className="subtext">De {estadisticas.suscripcionLimite} permitidas</p>
        </div>

        <div className="kpi-card">
          <h3>Visualizaciones</h3>
          <p className="valor">{estadisticas.visualizacionesTotales}</p>
          <p className="subtext">Últimos 30 días</p>
        </div>

        <div className="kpi-card">
          <h3>Clientes Únicos</h3>
          <p className="valor">{estadisticas.clientesUnicos}</p>
          <p className="subtext">Que han usado promos</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="graficos-container">
        <div className="grafico-card">
          <h3>Promociones Más Populares</h3>
          <div className="chart">
            {estadisticas.promocionesPorVisualizaciones.map((promo, idx) => (
              <div key={idx} className="chart-item">
                <span>{promo.titulo}</span>
                <div className="bar" style={{width: `${(promo.visualizaciones / estadisticas.visualizacionesMax) * 100}%`}}>
                  {promo.visualizaciones}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grafico-card">
          <h3>Tendencia de Tickets</h3>
          {/* Aquí iría un gráfico de líneas con chart.js o similar */}
        </div>
      </div>

      {/* Tabla de Tickets Recientes */}
      <div className="tickets-section">
        <h2>Tickets Generados</h2>
        
        <div className="filtros">
          <button 
            className={filtro === 'todas' ? 'activo' : ''}
            onClick={() => setFiltro('todas')}
          >
            Todos
          </button>
          <button 
            className={filtro === 'activos' ? 'activo' : ''}
            onClick={() => setFiltro('activos')}
          >
            Activos
          </button>
          <button 
            className={filtro === 'canjeados' ? 'activo' : ''}
            onClick={() => setFiltro('canjeados')}
          >
            Canjeados
          </button>
        </div>

        <div className="tabla-tickets">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Promoción</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td className="codigo">{ticket.codigo}</td>
                  <td>{ticket.detallesPromocion.titulo}</td>
                  <td>{ticket.clienteId}</td>
                  <td>{new Date(ticket.fechaGeneracion).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${ticket.estado}`}>
                      {ticket.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 9️⃣ DASHBOARD CLIENTE (MEJORADO)

#### 9.1 ClienteDashboardMejorado.jsx
```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerTicketsCliente } from '../services/ticketsService';
import { obtenerFavoritos } from '../services/favoritosService';
import '../styles/dashboard-cliente.css';

export default function ClienteDashboardMejorado() {
  const { usuarioActual } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    ticketsGenerados: 0,
    ticketsCanjeados: 0,
    ticketsActivos: 0,
    empresasMasFrecuentes: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const ticketsData = await obtenerTicketsCliente(usuarioActual.uid);
    const favoritosData = await obtenerFavoritos(usuarioActual.uid);
    
    setTickets(ticketsData);
    setFavoritos(favoritosData);

    // Calcular estadísticas
    const ticketsCanjeados = ticketsData.filter(t => t.estado === 'canjeado').length;
    const ticketsActivos = ticketsData.filter(t => t.estado === 'activo').length;

    // Contar empresas más frecuentes
    const empresasFreq = {};
    ticketsData.forEach(ticket => {
      const empresa = ticket.detallesPromocion.empresa;
      empresasFreq[empresa] = (empresasFreq[empresa] || 0) + 1;
    });

    const empresasMasFrecuentes = Object.entries(empresasFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([empresa, count]) => ({ empresa, count }));

    setEstadisticas({
      ticketsGenerados: ticketsData.length,
      ticketsCanjeados,
      ticketsActivos,
      empresasMasFrecuentes
    });
  };

  return (
    <div className="dashboard-cliente">
      <h1>Mi Dashboard</h1>

      {/* Resumen Rápido */}
      <div className="resumen-grid">
        <div className="resumen-card">
          <h3>Tickets Generados</h3>
          <p className="numero">{estadisticas.ticketsGenerados}</p>
        </div>

        <div className="resumen-card">
          <h3>Tickets Canjeados</h3>
          <p className="numero">{estadisticas.ticketsCanjeados}</p>
        </div>

        <div className="resumen-card">
          <h3>Tickets Activos</h3>
          <p className="numero">{estadisticas.ticketsActivos}</p>
        </div>
      </div>

      {/* Empresas Favoritas */}
      <div className="seccion-favoritas">
        <h2>Empresas en las que más compras</h2>
        <div className="empresas-frecuentes">
          {estadisticas.empresasMasFrecuentes.map((item, idx) => (
            <div key={idx} className="empresa-item">
              <h4>{item.empresa}</h4>
              <p>{item.count} tickets canjeados</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tickets Pendientes */}
      <div className="seccion-tickets">
        <h2>Mis Tickets Activos</h2>
        <div className="tickets-list">
          {tickets.filter(t => t.estado === 'activo').length === 0 ? (
            <p>No tienes tickets activos</p>
          ) : (
            tickets.filter(t => t.estado === 'activo').map(ticket => (
              <div key={ticket.id} className="ticket-item">
                <div className="ticket-info">
                  <h4>{ticket.detallesPromocion.titulo}</h4>
                  <p className="empresa">{ticket.detallesPromocion.empresa}</p>
                  <p className="codigo">Código: {ticket.codigo}</p>
                </div>
                <div className="ticket-qr">
                  <img src={ticket.qrCode} alt="QR" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Favoritos */}
      <div className="seccion-favoritos">
        <h2>Mis Favoritos</h2>
        <div className="favoritos-grid">
          {favoritos.length === 0 ? (
            <p>No tienes favoritos guardados</p>
          ) : (
            favoritos.map(fav => (
              <div key={fav.id} className="favorito-card">
                <h4>{fav.nombreReferencia}</h4>
                <p className="tipo">{fav.tipo === 'promocion' ? '🏷️ Promoción' : '🏪 Empresa'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔟 SERVICIO DE ESTADÍSTICAS

#### 10.1 estadisticas.service.js
```javascript
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function obtenerEstadisticas(empresaId) {
  try {
    // Obtener todos los tickets de la empresa
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('empresaId', '==', empresaId)
    );
    const ticketsDocs = await getDocs(ticketsQuery);
    const tickets = ticketsDocs.docs.map(doc => doc.data());

    // Calcular métricas
    const ticketsGenerados = tickets.length;
    const ticketsCanjeados = tickets.filter(t => t.estado === 'canjeado').length;
    const porcentajeCanjeado = ticketsGenerados > 0 ? 
      Math.round((ticketsCanjeados / ticketsGenerados) * 100) : 0;

    // Obtener promociones
    const promosQuery = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId),
      where('estado', '==', 'activa')
    );
    const promosDocs = await getDocs(promosQuery);
    const promociones = promosDocs.docs.map(doc => doc.data());

    const promocionesActivas = promociones.length;
    const visualizacionesTotales = promociones.reduce((sum, p) => sum + (p.visualizaciones || 0), 0);

    // Clientos únicos
    const clientesUnicos = new Set(tickets.map(t => t.clienteId)).size;

    // Ingresos estimados (si tienes tabla de precios de suscripción)
    const ingresosTotales = tickets.length * 5; // Ejemplo: $5 por ticket

    // Promociones más populares
    const promocionesPorVisualizaciones = promociones
      .sort((a, b) => (b.visualizaciones || 0) - (a.visualizaciones || 0))
      .slice(0, 5)
      .map(p => ({
        titulo: p.titulo,
        visualizaciones: p.visualizaciones || 0
      }));

    return {
      ticketsGenerados,
      ticketsCanjeados,
      porcentajeCanjeado,
      promocionesActivas,
      visualizacionesTotales,
      clientesUnicos,
      ingresosTotales,
      promocionesPorVisualizaciones,
      visualizacionesMax: Math.max(...promocionesPorVisualizaciones.map(p => p.visualizaciones)),
      suscripcionLimite: 5 // Esto debería venir del plan de suscripción
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}
```

---

## 1️⃣1️⃣ ACTUALIZAR ROUTING (main.jsx o App.jsx)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginUnificado from './pages/LoginUnificado';
import RegistroCliente from './pages/RegistroCliente';
import RegistroEmpresa from './pages/RegistroEmpresa';
import Inicio from './pages/Inicio';
import ClienteDashboard from './pages/ClienteDashboard';
import EmpresaDashboard from './pages/EmpresaDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PerfilCliente from './components/PerfilCliente';
import PerfilEmpresa from './components/PerfilEmpresa';
import GestorPromociones from './components/GestorPromociones';
import MapaCompleto from './pages/MapaCompleto';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Autenticación */}
        <Route path="/login" element={<LoginUnificado />} />
        <Route path="/registro-cliente" element={<RegistroCliente />} />
        <Route path="/registro-empresa" element={<RegistroEmpresa />} />

        {/* Inicio */}
        <Route path="/" element={<Inicio />} />

        {/* Cliente */}
        <Route path="/dashboard" element={<ClienteDashboard />} />
        <Route path="/perfil" element={<PerfilCliente />} />
        <Route path="/promociones" element={<Promociones />} />
        <Route path="/favoritos" element={<Favoritos />} />

        {/* Empresa */}
        <Route path="/empresa/dashboard" element={<EmpresaDashboard />} />
        <Route path="/empresa/perfil" element={<PerfilEmpresa />} />
        <Route path="/empresa/promociones" element={<GestorPromociones />} />
        <Route path="/empresa/suscripcion" element={<GestorSuscripcion />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Mapa */}
        <Route path="/mapa-completo" element={<MapaCompleto />} />

        {/* Redirección */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 1️⃣2️⃣ FIRESTORE SECURITY RULES (ACTUALIZADO)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // USUARIOS
    match /usuarios/{userId} {
      allow read: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
      allow create: if request.auth.uid != null;
      allow update: if request.auth.uid == userId || 
                       get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }

    // PROMOCIONES
    match /promociones/{promoId} {
      allow read: if true; // Todos pueden ver
      allow create, update: if request.auth.uid != null &&
                               get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'empresa' &&
                               request.resource.data.empresaId == request.auth.uid;
      allow delete: if request.auth.uid != null &&
                       get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'empresa' &&
                       resource.data.empresaId == request.auth.uid;
    }

    // TICKETS
    match /tickets/{ticketId} {
      allow read: if request.auth.uid == resource.data.clienteId ||
                     request.auth.uid == resource.data.empresaId ||
                     get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
      allow create: if request.auth.uid == request.resource.data.clienteId;
      allow update: if request.auth.uid == resource.data.empresaId ||
                       get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }

    // FAVORITOS
    match /favoritos/{favId} {
      allow read, create, delete: if request.auth.uid == resource.data.clienteId;
    }

    // SUSCRIPCIONES
    match /suscripciones/{subId} {
      allow read: if request.auth.uid == resource.data.empresaId ||
                     get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
      allow create, update: if request.auth.uid == resource.data.empresaId ||
                               get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
  }
}
```

---

## 📊 ESTRUCTURA DE DIRECTORIOS RECOMENDADA

```
src/
├── components/
│   ├── Navbar.jsx
│   ├── PerfilCliente.jsx
│   ├── PerfilEmpresa.jsx
│   ├── GestorPromocionesMejorado.jsx
│   ├── ClienteTicketButton.jsx
│   ├── MapaSeccion.jsx
│   └── ...
├── pages/
│   ├── LoginUnificado.jsx
│   ├── RegistroCliente.jsx
│   ├── RegistroEmpresa.jsx
│   ├── Inicio.jsx
│   ├── ClienteDashboard.jsx
│   ├── EmpresaDashboard.jsx
│   ├── AdminDashboard.jsx
│   └── ...
├── services/
│   ├── authService.js
│   ├── usuarioService.js
│   ├── promocionesService.js
│   ├── ticketsService.js
│   ├── favoritosService.js
│   ├── estadisticasService.js
│   └── ...
├── styles/
│   ├── navbar.css
│   ├── perfil.css
│   ├── perfil-empresa.css
│   ├── gestor-promociones.css
│   ├── dashboard-empresa.css
│   ├── dashboard-cliente.css
│   ├── mapa-seccion.css
│   ├── tickets.css
│   └── ...
├── context/
│   ├── AuthContext.jsx
│   └── ...
├── config/
│   ├── firebase.js
│   └── ...
└── main.jsx
```

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### Semana 1:
1. Unificar login/registro ✅
2. Actualizar estructura de datos en Firestore ✅
3. Crear componentes de Perfil ✅

### Semana 2:
4. Sistema de Tickets completo ✅
5. Validaciones de límites exactos ✅
6. Componente de generación de tickets ✅

### Semana 3:
7. Gestor de Promociones mejorado ✅
8. Sistema de Favoritos ✅
9. MapaSeccion en inicio ✅

### Semana 4:
10. Dashboards con estadísticas ✅
11. Testing y debugging ✅
12. Optimización de UI/UX ✅

---

## ✨ NOTAS IMPORTANTES

- **Límites de Tickets**: El sistema es exacto - no permite duplicados ni supera el límite
- **Cerrar Sesión**: Está en el perfil, NO en navbar
- **Mapa**: Solo en inicio reducido, botón lleva a mapa completo
- **Perfiles**: Editables con foto/logo y todos los datos necesarios
- **Dashboards**: Profesionales, didácticos y completos
- **Favoritos**: Se guardan en nueva colección "favoritos"
- **QR**: Generado automáticamente con código único por ticket

---

Este documento es tu roadmap completo. ¡Adelante! 🚀
