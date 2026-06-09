import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../utils/errorHandler';
import '../styles/perfil-empresa-publica.css';

const PerfilPublicoEmpresa = () => {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const empresaRef = doc(db, 'empresa', empresaId);
        const empresaSnap = await getDoc(empresaRef);

        if (!empresaSnap.exists()) {
          setError('Empresa no encontrada');
          setLoading(false);
          return;
        }

        setEmpresa({ id: empresaSnap.id, ...empresaSnap.data() });

        const promoQuery = query(
          collection(db, 'promociones'),
          where('empresaId', '==', empresaId),
          where('activa', '==', true)
        );
        const promoSnap = await getDocs(promoQuery);
        const promos = promoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPromociones(promos);
      } catch (err) {
        setError('Error al cargar el perfil');
        logError(err, { accion: 'cargarDatosEmpresa', empresaId, componente: 'PerfilPublicoEmpresa' });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [empresaId]);

  if (loading) {
    return (
      <div className="pep-loading">
        <div className="pep-spinner" />
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pep-error">
        <span className="pep-error-icon">⚠️</span>
        <h2>{error}</h2>
        <button className="pep-back-btn" onClick={() => navigate(-1)}>← Volver</button>
      </div>
    );
  }

  return (
    <div className="pep-page">
      {/* Header con banner */}
      <div className="pep-banner">
        <button className="pep-back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </div>

      <div className="pep-container">
        {/* Card principal de la empresa */}
        <div className="pep-empresa-card">
          <div className="pep-empresa-header">
            <div className="pep-empresa-avatar">
              {empresa.logoUrl ? (
                <img src={empresa.logoUrl} alt={empresa.nombre} />
              ) : (
                <span>{empresa.nombre?.charAt(0)?.toUpperCase() || '🏢'}</span>
              )}
            </div>
            <div className="pep-empresa-info">
              <h1 className="pep-empresa-nombre">{empresa.nombre}</h1>
              {empresa.categoria && (
                <span className="pep-empresa-categoria">{empresa.categoria}</span>
              )}
              {empresa.estado && (
                <span className={`pep-estado-badge ${empresa.estado}`}>
                  {empresa.estado === 'aprobado' ? '✓ Verificada' : empresa.estado}
                </span>
              )}
            </div>
          </div>

          <div className="pep-empresa-detalle">
            {empresa.descripcion && (
              <div className="pep-detalle-item pep-full">
                <label>Descripción</label>
                <p>{empresa.descripcion}</p>
              </div>
            )}
            {empresa.email && (
              <div className="pep-detalle-item">
                <label>📧 Email</label>
                <p>{empresa.email}</p>
              </div>
            )}
            {empresa.telefono && (
              <div className="pep-detalle-item">
                <label>📞 Teléfono</label>
                <p>{empresa.telefono}</p>
              </div>
            )}
            {empresa.direccion && (
              <div className="pep-detalle-item pep-full">
                <label>📍 Dirección</label>
                <p>{empresa.direccion}</p>
              </div>
            )}
            {empresa.ciudad && (
              <div className="pep-detalle-item">
                <label>🏙️ Ciudad</label>
                <p>{empresa.ciudad}</p>
              </div>
            )}
            {empresa.sitioWeb && (
              <div className="pep-detalle-item">
                <label>🌐 Sitio web</label>
                <a href={empresa.sitioWeb} target="_blank" rel="noopener noreferrer" className="pep-link">
                  {empresa.sitioWeb}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Promociones activas */}
        <section className="pep-promos-section">
          <h2 className="pep-promos-titulo">
            🏷️ Promociones activas
            <span className="pep-promos-count">{promociones.length}</span>
          </h2>

          {promociones.length === 0 ? (
            <div className="pep-promos-empty">
              <span>🔍</span>
              <p>Esta empresa no tiene promociones activas en este momento.</p>
            </div>
          ) : (
            <div className="pep-promos-grid">
              {promociones.map(promo => (
                <div key={promo.id} className="pep-promo-card">
                  <div className="pep-promo-badge">-{promo.descuento}%</div>
                  <h3 className="pep-promo-titulo">{promo.titulo}</h3>
                  {promo.descripcion && (
                    <p className="pep-promo-desc">{promo.descripcion}</p>
                  )}
                  <div className="pep-promo-meta">
                    {promo.ticketsMaximos && (
                      <span>
                        🎟️ {Math.max(0, promo.ticketsMaximos - (promo.ticketsGenerados || 0))} disponibles
                      </span>
                    )}
                    {promo.fechaHoraExpiracion && (
                      <span>
                        ⏰ Hasta {new Date(promo.fechaHoraExpiracion.toDate?.() || promo.fechaHoraExpiracion).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PerfilPublicoEmpresa;
