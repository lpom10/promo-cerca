import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { categorias } from '../data/categorias';
import { logError } from '../utils/errorHandler';
import '../styles/promociones.css';

const FORM_VACIO = {
  titulo:              '',
  descripcion:         '',
  descuento:           '',
  precioOriginal:      '',
  precioDescuento:     '',
  fechaInicio:         '',
  fechaFin:            '',
  categoria:           '',
  imagen:              '',
  ticketsMaximos:      '',
  fechaHoraExpiracion: '',
};

const GestorPromociones = ({ onNavigateToSuscripcion }) => {
  const { user, userDetails } = useAuth();
  const location = useLocation();

  const [promociones,    setPromociones]    = useState([]);
  const [showForm,       setShowForm]       = useState(false);
  const [editingId,      setEditingId]      = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [suscripcion,    setSuscripcion]    = useState(null);
  const [form,           setForm]           = useState(FORM_VACIO);
  const [errores,        setErrores]        = useState({});
  // FIX: reemplaza window.confirm — guarda el id pendiente de eliminar
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    cargarPromociones();
    cargarSuscripcion();
  }, [user]);

  // FIX: Lee el editId que llega desde Locales.jsx via navigate state
  // Antes: LocalCard hacía window.location.href = '/GestorPromociones?id=...' (ruta inexistente)
  // Ahora: Locales usa navigate('/empresa/gestionar-promociones', { state: { editId } })
  useEffect(() => {
    const editId = location.state?.editId;
    if (!editId) return;

    const cargarParaEditar = async () => {
      try {
        const snap = await getDoc(doc(db, 'promociones', editId));
        if (snap.exists()) {
          poblarFormulario({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        logError(error, { accion: 'cargarParaEditar', editId, componente: 'GestorPromociones' });
      }
    };
    cargarParaEditar();
  }, [location.state?.editId]);

  const cargarPromociones = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'promociones'), where('empresaId', '==', user.uid));
      const snapshot = await getDocs(q);
      setPromociones(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      logError(error, { accion: 'cargarPromociones', userId: user.uid, componente: 'GestorPromociones' });
    }
  };

  const cargarSuscripcion = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'suscripciones'),
        where('empresaId', '==', user.uid),
        where('estado',    '==', 'activa'),
      );
      const snapshot = await getDocs(q);
      setSuscripcion(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } catch (error) {
      logError(error, { accion: 'cargarSuscripcion', userId: user.uid, componente: 'GestorPromociones' });
    }
  };

  // Extrae la lógica de poblar el form para reutilizarla (editar desde lista y editar desde Locales)
  const poblarFormulario = (promo) => {
    setForm({
      titulo:       promo.titulo,
      descripcion:  promo.descripcion,
      descuento:    promo.descuento,
      precioOriginal:  promo.precioOriginal?.toString()  || '',
      precioDescuento: promo.precioDescuento?.toString() || '',
      fechaInicio: promo.fechaInicio.toDate?.().toISOString().split('T')[0] || promo.fechaInicio,
      fechaFin:    promo.fechaFin.toDate?.().toISOString().split('T')[0]    || promo.fechaFin,
      categoria:   promo.categoria,
      imagen:      promo.imagen,
      ticketsMaximos: promo.ticketsMaximos ? promo.ticketsMaximos.toString() : '',
      fechaHoraExpiracion: promo.fechaHoraExpiracion
        ? promo.fechaHoraExpiracion.toDate?.().toISOString().slice(0, 16) || promo.fechaHoraExpiracion
        : '',
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'precioOriginal' || name === 'descuento') {
        const pOriginal = parseFloat(name === 'precioOriginal' ? value : prev.precioOriginal);
        const desc      = parseFloat(name === 'descuento'      ? value : prev.descuento);
        updated.precioDescuento = (!isNaN(pOriginal) && !isNaN(desc))
          ? (pOriginal - pOriginal * (desc / 100)).toFixed(2)
          : '';
      }
      return updated;
    });
  };

  const validar = () => {
    const e = {};
    if (!form.titulo.trim())       e.titulo      = 'El título es requerido';
    if (!form.descripcion.trim())  e.descripcion = 'La descripción es requerida';
    if (!form.descuento || isNaN(form.descuento) || form.descuento < 0 || form.descuento > 100)
      e.descuento = 'Ingresa un descuento válido (0-100)';
    if (!form.precioOriginal || isNaN(form.precioOriginal) || parseFloat(form.precioOriginal) <= 0)
      e.precioOriginal = 'El precio original debe ser mayor a 0';
    if (!form.fechaInicio) e.fechaInicio = 'La fecha de inicio es requerida';
    if (!form.fechaFin)    e.fechaFin    = 'La fecha de fin es requerida';
    if (form.fechaFin && form.fechaInicio && new Date(form.fechaFin) <= new Date(form.fechaInicio))
      e.fechaFin = 'La fecha de fin debe ser posterior a la de inicio';
    if (!form.categoria) e.categoria = 'Selecciona una categoría';
    if (form.ticketsMaximos && (isNaN(form.ticketsMaximos) || parseInt(form.ticketsMaximos) <= 0))
      e.ticketsMaximos = 'Ingresa un número válido de tickets (mayor a 0)';
    if (form.fechaHoraExpiracion && form.fechaFin) {
      if (new Date(form.fechaHoraExpiracion) > new Date(form.fechaFin))
        e.fechaHoraExpiracion = 'La hora de expiración no puede ser después de la fecha de fin';
    }
    return e;
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    const erroresValidacion = validar();
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    setErrores({});
    setLoading(true);

    try {
      const datos = {
        titulo:       form.titulo,
        descripcion:  form.descripcion,
        descuento:    parseInt(form.descuento),
        precioOriginal:  parseFloat(form.precioOriginal),
        precioDescuento: parseFloat(form.precioDescuento),
        fechaInicio:  new Date(form.fechaInicio),
        fechaFin:     new Date(form.fechaFin),
        categoria:    form.categoria,
        imagen:       form.imagen,
        empresaId:    user.uid,
        empresaNombre: userDetails?.negocio,
        lat:          userDetails?.lat || 0,
        lng:          userDetails?.lng || 0,
        updatedAt:    new Date(),
        ticketsMaximos:      form.ticketsMaximos ? parseInt(form.ticketsMaximos) : null,
        fechaHoraExpiracion: form.fechaHoraExpiracion ? new Date(form.fechaHoraExpiracion) : null,
      };

      if (editingId) {
        await updateDoc(doc(db, 'promociones', editingId), datos);
      } else {
        await addDoc(collection(db, 'promociones'), {
          ...datos,
          createdAt:       new Date(),
          activa:          true,
          visualizaciones: 0,
          ticketsGenerados: 0,
        });
      }

      setForm(FORM_VACIO);
      setEditingId(null);
      setShowForm(false);
      cargarPromociones();
    } catch (error) {
      logError(error, { accion: 'guardarPromocion', userId: user.uid, componente: 'GestorPromociones' });
      setErrores({ general: 'Error al guardar la promoción' });
    }
    setLoading(false);
  };

  const handleEdit = (promo) => poblarFormulario(promo);

  // FIX: Reemplaza window.confirm con un patrón de doble clic.
  // Primera llamada: pide confirmación mostrando botones en la UI.
  // Segunda llamada con el mismo id: ejecuta el delete.
  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    try {
      await deleteDoc(doc(db, 'promociones', id));
      cargarPromociones(); // Actualiza el estado sin recargar la página
    } catch (error) {
      logError(error, { accion: 'eliminarPromocion', promocionId: id, componente: 'GestorPromociones' });
    }
    setConfirmDeleteId(null);
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(FORM_VACIO);
    setErrores({});
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

      {true || suscripcion ? (
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
                  <input type="text" name="titulo" value={form.titulo} onChange={handleChange}
                    placeholder="Ej: Descuento en Pizzas"
                    className={errores.titulo ? 'input-error' : ''} />
                  {errores.titulo && <span className="error">{errores.titulo}</span>}
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                    placeholder="Describe tu promoción con detalle" rows="4"
                    className={errores.descripcion ? 'input-error' : ''} />
                  {errores.descripcion && <span className="error">{errores.descripcion}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Descuento (%)</label>
                    <input type="number" name="descuento" value={form.descuento} onChange={handleChange}
                      placeholder="0-100" min="0" max="100"
                      className={errores.descuento ? 'input-error' : ''} />
                    {errores.descuento && <span className="error">{errores.descuento}</span>}
                  </div>

                  <div className="form-group">
                    <label>Precio Original ($)</label>
                    <input type="number" name="precioOriginal" value={form.precioOriginal} min="0.01"
                      onChange={handleChange} placeholder="Ej: 50.00" step="0.01"
                      className={errores.precioOriginal ? 'input-error' : ''} />
                    {errores.precioOriginal && <span className="error">{errores.precioOriginal}</span>}
                  </div>

                  <div className="form-group">
                    <label>Precio Final (Calculado)</label>
                    <input type="text" name="precioDescuento" value={form.precioDescuento} readOnly
                      placeholder="Calculado"
                      style={{ backgroundColor: '#f0f9ff', fontWeight: 'bold', color: '#0369a1' }} />
                  </div>

                  <div className="form-group">
                    <label>Categoría</label>
                    <select name="categoria" value={form.categoria} onChange={handleChange}
                      className={errores.categoria ? 'input-error' : ''}>
                      <option value="">Selecciona una categoría...</option>
                      {categorias.filter(cat => cat.id !== 'todos').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    {errores.categoria && <span className="error">{errores.categoria}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Inicio</label>
                    <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleChange}
                      className={errores.fechaInicio ? 'input-error' : ''} />
                    {errores.fechaInicio && <span className="error">{errores.fechaInicio}</span>}
                  </div>

                  <div className="form-group">
                    <label>Fecha de Fin</label>
                    <input type="date" name="fechaFin" value={form.fechaFin} onChange={handleChange}
                      className={errores.fechaFin ? 'input-error' : ''} />
                    {errores.fechaFin && <span className="error">{errores.fechaFin}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>URL de Imagen (opcional)</label>
                  <input type="url" name="imagen" value={form.imagen} onChange={handleChange}
                    placeholder="https://..." />
                </div>

                <div className="form-separator" style={{ marginTop: '30px', marginBottom: '20px', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>Límites de Tickets (Opcional)</h4>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Máximo de Tickets (opcional)</label>
                    <input type="number" name="ticketsMaximos" value={form.ticketsMaximos}
                      onChange={handleChange} placeholder="Ej: 50" min="1"
                      className={errores.ticketsMaximos ? 'input-error' : ''} />
                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                      Deja vacío si no hay límite de cantidad
                    </small>
                    {errores.ticketsMaximos && <span className="error">{errores.ticketsMaximos}</span>}
                  </div>

                  <div className="form-group">
                    <label>Fecha y Hora de Expiración (opcional)</label>
                    <input type="datetime-local" name="fechaHoraExpiracion" value={form.fechaHoraExpiracion}
                      onChange={handleChange}
                      className={errores.fechaHoraExpiracion ? 'input-error' : ''} />
                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                      Hora exacta hasta la cual se pueden generar tickets
                    </small>
                    {errores.fechaHoraExpiracion && <span className="error">{errores.fechaHoraExpiracion}</span>}
                  </div>
                </div>

                {errores.general && <div className="error-general">{errores.general}</div>}

                <div className="form-buttons">
                  <button type="submit" disabled={loading} className="btn-guardar">
                    {loading ? 'Guardando...' : 'Guardar Promoción'}
                  </button>
                  <button type="button" onClick={cancelarForm} className="btn-cancelar">
                    Cancelar
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
                        <span className={`estado-badge-mini ${promo.estado || 'pendiente'}`}
                          style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', marginLeft: '5px' }}>
                          {promo.estado || 'pendiente'}
                        </span>
                      </div>
                      <div className="promo-fechas">
                        <small>
                          {new Date(promo.fechaInicio.toDate?.()).toLocaleDateString()} -{' '}
                          {new Date(promo.fechaFin.toDate?.()).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="promo-stats">
                        <span>Vistas: {promo.visualizaciones || 0}</span>
                        {promo.ticketsMaximos && (
                          <span>Tickets: {promo.ticketsGenerados || 0}/{promo.ticketsMaximos}</span>
                        )}
                      </div>
                      {(promo.ticketsMaximos || promo.fechaHoraExpiracion) && (
                        <div className="promo-limites" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                          {promo.ticketsMaximos && <p style={{ margin: '5px 0' }}>Límite: {promo.ticketsMaximos} tickets</p>}
                          {promo.fechaHoraExpiracion && (
                            <p style={{ margin: '5px 0' }}>Expira: {new Date(promo.fechaHoraExpiracion.toDate?.()).toLocaleString()}</p>
                          )}
                        </div>
                      )}
                      <div className="promo-actions">
                        <button onClick={() => handleEdit(promo)} className="btn-edit">Editar</button>

                        {/* FIX: Patrón de doble clic reemplaza window.confirm */}
                        {confirmDeleteId === promo.id ? (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                            <button onClick={() => handleDelete(promo.id)} className="btn-delete"
                              style={{ fontSize: '12px' }}>
                              ¿Confirmar?
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="btn-cancelar"
                              style={{ fontSize: '12px' }}>
                              No
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleDelete(promo.id)} className="btn-delete">
                            Eliminar
                          </button>
                        )}
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
            Contratar Suscripción
          </button>
        </div>
      )}
    </div>
  );
};

export default GestorPromociones;