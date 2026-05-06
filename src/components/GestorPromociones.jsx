import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import '../styles/promociones.css';

const GestorPromociones = ({ onNavigateToSuscripcion }) => {
  const { user, userDetails } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suscripcion, setSuscripcion] = useState(null);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    descuento: '',
    fechaInicio: '',
    fechaFin: '',
    categoria: '',
    imagen: '',
    ticketsMaximos: '',
    fechaHoraExpiracion: '',
  });
  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarPromociones();
    cargarSuscripcion();
  }, [user]);

  const cargarPromociones = async () => {
    try {
      const q = query(collection(db, 'promociones'), where('empresaId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPromociones(data);
    } catch (error) {
      console.error('Error cargando promociones:', error);
    }
  };

  const cargarSuscripcion = async () => {
    try {
      const q = query(
        collection(db, 'suscripciones'),
        where('empresaId', '==', user.uid),
        where('estado', '==', 'activa')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setSuscripcion({ id: doc.id, ...doc.data() });
      } else {
        setSuscripcion(null);
      }
    } catch (error) {
      console.error('Error cargando suscripción:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validar = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'El título es requerido';
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es requerida';
    if (!form.descuento || isNaN(form.descuento) || form.descuento < 0 || form.descuento > 100) {
      e.descuento = 'Ingresa un descuento válido (0-100)';
    }
    if (!form.fechaInicio) e.fechaInicio = 'La fecha de inicio es requerida';
    if (!form.fechaFin) e.fechaFin = 'La fecha de fin es requerida';
    if (new Date(form.fechaFin) <= new Date(form.fechaInicio)) {
      e.fechaFin = 'La fecha de fin debe ser posterior a la de inicio';
    }
    if (!form.categoria) e.categoria = 'Selecciona una categoría';
    
    // Validar ticketsMaximos si está proporcionado
    if (form.ticketsMaximos && (isNaN(form.ticketsMaximos) || parseInt(form.ticketsMaximos) <= 0)) {
      e.ticketsMaximos = 'Ingresa un número válido de tickets (mayor a 0)';
    }
    
    // Validar fechaHoraExpiracion si está proporcionada
    if (form.fechaHoraExpiracion) {
      const fechaExpiracion = new Date(form.fechaHoraExpiracion);
      const fechaFin = new Date(form.fechaFin);
      if (fechaExpiracion > fechaFin) {
        e.fechaHoraExpiracion = 'La hora de expiración no puede ser después de la fecha de fin de la promoción';
      }
    }
    
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validar();
    if (Object.keys(e2).length > 0) {
      setErrores(e2);
      return;
    }

    if (!suscripcion && !editingId) {
      setErrores({ general: 'Necesitas una suscripción activa para crear promociones' });
      return;
    }

    setErrores({});
    setLoading(true);

    try {
      const datos = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        descuento: parseInt(form.descuento),
        fechaInicio: new Date(form.fechaInicio),
        fechaFin: new Date(form.fechaFin),
        categoria: form.categoria,
        imagen: form.imagen,
        empresaId: user.uid,
        empresaNombre: userDetails?.negocio,
        lat: userDetails?.lat || 0,
        lng: userDetails?.lng || 0,
        updatedAt: new Date(),
        // Nuevos campos para límites de tickets
        ticketsMaximos: form.ticketsMaximos ? parseInt(form.ticketsMaximos) : null,
        fechaHoraExpiracion: form.fechaHoraExpiracion ? new Date(form.fechaHoraExpiracion) : null,
      };

      if (editingId) {
        await updateDoc(doc(db, 'promociones', editingId), datos);
      } else {
        await addDoc(collection(db, 'promociones'), {
          ...datos,
          createdAt: new Date(),
          activa: true,
          visualizaciones: 0,
          ticketsGenerados: 0, // Contador inicial
        });
      }

      setForm({
        titulo: '',
        descripcion: '',
        descuento: '',
        fechaInicio: '',
        fechaFin: '',
        categoria: '',
        imagen: '',
        ticketsMaximos: '',
        fechaHoraExpiracion: '',
      });
      setEditingId(null);
      setShowForm(false);
      cargarPromociones();
    } catch (error) {
      console.error('Error guardando promoción:', error);
      setErrores({ general: 'Error al guardar la promoción' });
    }
    setLoading(false);
  };

  const handleEdit = (promo) => {
    setForm({
      titulo: promo.titulo,
      descripcion: promo.descripcion,
      descuento: promo.descuento,
      fechaInicio: promo.fechaInicio.toDate?.().toISOString().split('T')[0] || promo.fechaInicio,
      fechaFin: promo.fechaFin.toDate?.().toISOString().split('T')[0] || promo.fechaFin,
      categoria: promo.categoria,
      imagen: promo.imagen,
      ticketsMaximos: promo.ticketsMaximos ? promo.ticketsMaximos.toString() : '',
      fechaHoraExpiracion: promo.fechaHoraExpiracion 
        ? promo.fechaHoraExpiracion.toDate?.().toISOString().slice(0, 16) || promo.fechaHoraExpiracion
        : '',
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
      try {
        await deleteDoc(doc(db, 'promociones', id));
        cargarPromociones();
      } catch (error) {
        console.error('Error eliminando promoción:', error);
      }
    }
  };

  return (
    <div className="gestor-promociones">
      <div className="gestor-header">
        <h2>Gestión de Promociones</h2>
        {suscripcion ? (
          <div className="suscripcion-info">
            <span className="badge-activo">✅ Plan: {suscripcion.plan}</span>
            <span>Vencimiento: {new Date(suscripcion.fechaVencimiento.toDate?.()).toLocaleDateString()}</span>
          </div>
        ) : (
          <div className="sin-suscripcion">
            <span className="badge-inactivo">❌ Sin suscripción activa</span>
          </div>
        )}
      </div>

      {suscripcion ? (
        <>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-crear-promo">
              ➕ Crear Nueva Promoción
            </button>
          )}

          {showForm && (
            <div className="form-container">
              <h3>{editingId ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    placeholder="Ej: Descuento en Pizzas"
                    className={errores.titulo ? 'input-error' : ''}
                  />
                  {errores.titulo && <span className="error">{errores.titulo}</span>}
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    placeholder="Describe tu promoción con detalle"
                    rows="4"
                    className={errores.descripcion ? 'input-error' : ''}
                  />
                  {errores.descripcion && <span className="error">{errores.descripcion}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Descuento (%)</label>
                    <input
                      type="number"
                      name="descuento"
                      value={form.descuento}
                      onChange={handleChange}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      className={errores.descuento ? 'input-error' : ''}
                    />
                    {errores.descuento && <span className="error">{errores.descuento}</span>}
                  </div>

                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      name="categoria"
                      value={form.categoria}
                      onChange={handleChange}
                      className={errores.categoria ? 'input-error' : ''}
                    >
                      <option value="">Selecciona una categoría</option>
                      <option value="restaurantes">🍽️ Restaurante</option>
                      <option value="cafeterias">☕ Cafetería</option>
                      <option value="tiendas">🛍️ Tienda</option>
                      <option value="servicios">🔧 Servicios</option>
                      <option value="salud">💊 Salud</option>
                    </select>
                    {errores.categoria && <span className="error">{errores.categoria}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={form.fechaInicio}
                      onChange={handleChange}
                      className={errores.fechaInicio ? 'input-error' : ''}
                    />
                    {errores.fechaInicio && <span className="error">{errores.fechaInicio}</span>}
                  </div>

                  <div className="form-group">
                    <label>Fecha de Fin</label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={form.fechaFin}
                      onChange={handleChange}
                      className={errores.fechaFin ? 'input-error' : ''}
                    />
                    {errores.fechaFin && <span className="error">{errores.fechaFin}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>URL de Imagen (opcional)</label>
                  <input
                    type="url"
                    name="imagen"
                    value={form.imagen}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-separator" style={{ marginTop: '30px', marginBottom: '20px', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>⚙️ Límites de Tickets (Opcional)</h4>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Máximo de Tickets (opcional)</label>
                    <input
                      type="number"
                      name="ticketsMaximos"
                      value={form.ticketsMaximos}
                      onChange={handleChange}
                      placeholder="Ej: 50"
                      min="1"
                      className={errores.ticketsMaximos ? 'input-error' : ''}
                    />
                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                      Deja vacío si no hay límite de cantidad
                    </small>
                    {errores.ticketsMaximos && <span className="error">{errores.ticketsMaximos}</span>}
                  </div>

                  <div className="form-group">
                    <label>Fecha y Hora de Expiración (opcional)</label>
                    <input
                      type="datetime-local"
                      name="fechaHoraExpiracion"
                      value={form.fechaHoraExpiracion}
                      onChange={handleChange}
                      className={errores.fechaHoraExpiracion ? 'input-error' : ''}
                    />
                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                      Hora exacta hasta la cual se pueden generar tickets
                    </small>
                    {errores.fechaHoraExpiracion && <span className="error">{errores.fechaHoraExpiracion}</span>}
                  </div>
                </div>

                {errores.general && <div className="error-general">{errores.general}</div>}

                <div className="form-buttons">
                  <button type="submit" disabled={loading} className="btn-guardar">
                    {loading ? '⏳ Guardando...' : '💾 Guardar Promoción'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setForm({
                        titulo: '',
                        descripcion: '',
                        descuento: '',
                        fechaInicio: '',
                        fechaFin: '',
                        categoria: '',
                        imagen: '',
                        ticketsMaximos: '',
                        fechaHoraExpiracion: '',
                      });
                    }}
                    className="btn-cancelar"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="promociones-list">
            <h3>Mis Promociones ({promociones.length})</h3>
            {promociones.length === 0 ? (
              <p className="sin-promociones">Aún no tienes promociones. ¡Crea una ahora!</p>
            ) : (
              <div className="promociones-grid">
                {promociones.map(promo => (
                  <div key={promo.id} className="promo-card">
                    {promo.imagen && <img src={promo.imagen} alt={promo.titulo} />}
                    <div className="promo-content">
                      <h4>{promo.titulo}</h4>
                      <p className="promo-desc">{promo.descripcion}</p>
                      <div className="promo-info">
                        <span className="descuento-badge">-{promo.descuento}%</span>
                        <span className="categoria">{promo.categoria}</span>
                      </div>
                      <div className="promo-fechas">
                        <small>
                          {new Date(promo.fechaInicio.toDate?.()).toLocaleDateString()} - {new Date(promo.fechaFin.toDate?.()).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="promo-stats">
                        <span>👁️ {promo.visualizaciones || 0} visualizaciones</span>
                        {promo.ticketsMaximos && (
                          <span>🎟️ {promo.ticketsGenerados || 0}/{promo.ticketsMaximos} tickets</span>
                        )}
                      </div>
                      {(promo.ticketsMaximos || promo.fechaHoraExpiracion) && (
                        <div className="promo-limites" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                          {promo.ticketsMaximos && (
                            <p style={{ margin: '5px 0' }}>📊 Límite: {promo.ticketsMaximos} tickets</p>
                          )}
                          {promo.fechaHoraExpiracion && (
                            <p style={{ margin: '5px 0' }}>⏰ Expira: {new Date(promo.fechaHoraExpiracion.toDate?.()).toLocaleString()}</p>
                          )}
                        </div>
                      )}
                      <div className="promo-actions">
                        <button onClick={() => handleEdit(promo)} className="btn-edit">✏️ Editar</button>
                        <button onClick={() => handleDelete(promo.id)} className="btn-delete">🗑️ Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="suscripcion-requerida">
          <h3>Necesitas una suscripción activa</h3>
          <p>Para crear y gestionar promociones, necesitas tener una suscripción activa.</p>
          <button className="btn-suscribirse" onClick={onNavigateToSuscripcion}>
            💳 Contratar Suscripción
          </button>
        </div>
      )}
    </div>
  );
};

export default GestorPromociones;
