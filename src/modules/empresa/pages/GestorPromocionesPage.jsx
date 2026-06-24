import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useGestorPromociones } from '../hooks/useGestorPromociones';
import { useAuth } from '../../../shared/context/AuthContext';
import { categorias } from '../../../data/categorias';
import { Spinner, ErrorBoundary } from '../../../shared/ui';
import { storage } from '../../../firebase';
import '../styles/gestor-promociones.css';

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

const calcularPrecioFinal = (precioOriginal, descuento) => {
  const precio = Number(precioOriginal);
  const porc = Number(descuento);

  if (!precio || Number.isNaN(precio) || !porc || Number.isNaN(porc)) return '';
  if (porc < 0 || porc > 100) return '';

  return (precio - precio * (porc / 100)).toFixed(2);
};

const GestorPromocionesPage = () => {
  const { user } = useAuth();
  const { promociones, loading, error, crear, actualizar, eliminar, refetch } = useGestorPromociones();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [errores, setErrores] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const precioFinalCalculado = calcularPrecioFinal(form.precioOriginal, form.descuento);

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
      imagen:      promo.imagen || promo.imagenUrl || '',
      ticketsMaximos: promo.ticketsMaximos ? promo.ticketsMaximos.toString() : '',
      fechaHoraExpiracion: promo.fechaHoraExpiracion
        ? promo.fechaHoraExpiracion.toDate?.().toISOString().slice(0, 16) || promo.fechaHoraExpiracion
        : '',
    });
    setImagePreview(promo.imagen || promo.imagenUrl || '');
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'precioOriginal' || name === 'descuento') {
        const pOriginal = parseFloat(name === 'precioOriginal' ? value : prev.precioOriginal);
        const desc = parseFloat(name === 'descuento' ? value : prev.descuento);
        updated.precioDescuento = (!Number.isNaN(pOriginal) && !Number.isNaN(desc) && desc >= 0 && desc <= 100)
          ? (pOriginal - pOriginal * (desc / 100)).toFixed(2)
          : '';
      }
      return updated;
    });
  };

  const convertirADataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

  const subirImagen = async (file) => {
    if (!file) return '';
    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen');
    }
    if (!user?.uid) {
      throw new Error('Debes iniciar sesión para subir una imagen');
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const nombreArchivo = `promociones/${user.uid}/${Date.now()}.${extension}`;
    const storageRef = ref(storage, nombreArchivo);

    setUploadingImage(true);
    try {
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error('La subida tardó demasiado. Revisa tu conexión o los permisos de Firebase Storage.')), 20000);
      });

      await Promise.race([uploadPromise, timeoutPromise]);
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.warn('Firebase Storage no aceptó la subida; se usará una imagen en memoria.', err);

      try {
        return await convertirADataUrl(file);
      } catch (fallbackErr) {
        if (fallbackErr?.message === 'No se pudo leer la imagen') {
          throw fallbackErr;
        }

        throw new Error(err?.message || 'No se pudo subir la imagen');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const manejarArchivoSeleccionado = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await subirImagen(file);
      setForm(prev => ({ ...prev, imagen: url }));
      setImagePreview(url);
      setFormError(null);
    } catch (err) {
      setFormError(err.message || 'No se pudo subir la imagen');
    }
  };

  const manejarPegado = async (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imagenItem = Array.from(items).find(item => item.type.startsWith('image/'));
    if (!imagenItem) return;

    event.preventDefault();
    const file = imagenItem.getAsFile();
    if (!file) return;

    try {
      const url = await subirImagen(file);
      setForm(prev => ({ ...prev, imagen: url }));
      setImagePreview(url);
      setFormError(null);
    } catch (err) {
      setFormError(err.message || 'No se pudo pegar la imagen');
    }
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
    setFormLoading(true);
    setFormError(null);

    try {
      const imagenFinal = form.imagen || imagePreview || '';

      const datos = {
        titulo:       form.titulo,
        descripcion:  form.descripcion,
        descuento:    parseInt(form.descuento),
        precioOriginal:  parseFloat(form.precioOriginal),
        precioDescuento: parseFloat(form.precioDescuento),
        fechaInicio:  new Date(form.fechaInicio),
        fechaFin:     new Date(form.fechaFin),
        categoria:    form.categoria,
        imagen:       imagenFinal,
        imagenUrl:    imagenFinal,
        ticketsMaximos:      form.ticketsMaximos ? parseInt(form.ticketsMaximos) : null,
        fechaHoraExpiracion: form.fechaHoraExpiracion ? new Date(form.fechaHoraExpiracion) : null,
      };

      if (editingId) {
        await actualizar(editingId, datos);
      } else {
        await crear(datos);
      }

      setForm(FORM_VACIO);
      setEditingId(null);
      setShowForm(false);
      setImagePreview('');
      await refetch();
    } catch (err) {
      setFormError(err.message || 'Error al guardar la promoción');
    }
    setFormLoading(false);
  };

  const handleEdit = (promo) => poblarFormulario(promo);

  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    try {
      await eliminar(id);
      await refetch();
    } catch (err) {
      setFormError(err.message || 'Error al eliminar la promoción');
    }
    setConfirmDeleteId(null);
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(FORM_VACIO);
    setErrores({});
    setFormError(null);
    setImagePreview('');
  };

  if (loading) return <Spinner fullScreen />;

  return (
    <ErrorBoundary name="GestorPromociones">
      <div className="gestor-promociones">
        <div className="gestor-header">
          <h2>Gestión de Promociones</h2>
        </div>

        {error && (
          <div className="error-banner" style={{ backgroundColor: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

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
                    <input
                      type="text"
                      name="precioDescuento"
                      value={precioFinalCalculado || form.precioDescuento}
                      readOnly
                      placeholder="Calculado"
                      style={{ backgroundColor: '#f0f9ff', fontWeight: 'bold', color: '#0369a1' }}
                    />
                    <small style={{ color: '#64748b' }}>
                      El precio final se calcula automáticamente a partir del precio original y el descuento.
                    </small>
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
                  <label>Imagen del producto</label>
                  <div
                    className="imagen-upload-zone"
                    onPaste={manejarPegado}
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={manejarArchivoSeleccionado}
                      style={{ display: 'none' }}
                    />
                    <div className="imagen-upload-icon">📷</div>
                    <div className="imagen-upload-text">
                      <strong>Sube una foto o pégala aquí</strong>
                      <p>También puedes elegir una imagen desde tu dispositivo.</p>
                    </div>
                    {uploadingImage && <span className="uploading-label">Subiendo...</span>}
                  </div>

                  <input
                    type="url"
                    name="imagen"
                    value={form.imagen}
                    onChange={handleChange}
                    placeholder="O pega un enlace a la imagen"
                    style={{ marginTop: '10px' }}
                  />

                  {(imagePreview || form.imagen) && (
                    <div className="imagen-preview">
                      <img src={imagePreview || form.imagen} alt="Vista previa" />
                    </div>
                  )}
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

                {formError && <div className="error-general" style={{ color: '#c33', backgroundColor: '#fee', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>{formError}</div>}

                <div className="form-buttons">
                  <button type="submit" disabled={formLoading} className="btn-guardar">
                    {formLoading ? 'Guardando...' : 'Guardar Promoción'}
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
                      </div>
                      <div className="promo-fechas">
                        <small>
                          {new Date(promo.fechaInicio.toDate?.()).toLocaleDateString()} -{' '}
                          {new Date(promo.fechaFin.toDate?.()).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="promo-stats">
                        <span>Vistas: {promo.vistas || 0}</span>
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
      </div>
    </ErrorBoundary>
  );
};

export default GestorPromocionesPage;
