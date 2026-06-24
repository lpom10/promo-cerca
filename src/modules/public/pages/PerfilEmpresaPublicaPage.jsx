import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logError } from '../../../shared/utils/errorHandler';
import { useAuth } from '../../../shared/context/AuthContext';
import { toggleEmpresaFavorita, obtenerFavoritos } from '../../cliente/services/favoritosService';
import '../styles/PerfilEmpresaPublica.css';

const formatearPrecio = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(valor));
};

const PerfilEmpresaPublica = () => {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const { user, userType } = useAuth();

  const [empresa, setEmpresa] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  // Cargar estado de favorito
  useEffect(() => {
    const cargarFavEmpresa = async () => {
      if (!user || !empresaId) return;
      try {
        const favs = await obtenerFavoritos(user.uid);
        const esFav = favs.some(f => f.tipo === 'empresa' && f.empresaId === empresaId);
        setIsFavorite(esFav);
      } catch (err) {
        logError(err, { accion: 'cargarFavEmpresa', empresaId, componente: 'PerfilEmpresaPublica' });
      }
    };
    cargarFavEmpresa();
  }, [user, empresaId]);

  const handleToggleFav = async () => {
    if (!user) {
      alert('Debes iniciar sesión para agregar favoritos.');
      return;
    }
    setLoadingFav(true);
    try {
      await toggleEmpresaFavorita(user.uid, empresaId, {
        nombre: empresa?.nombreComercial || empresa?.nombre || '',
        descripcion: empresa?.descripcion || '',
        categoria: empresa?.categoria || '',
        imagen: empresa?.logoUrl || '',
      });
      setIsFavorite(prev => !prev);
    } catch (err) {
      logError(err, { accion: 'toggleFavEmpresa', empresaId, componente: 'PerfilEmpresaPublica' });
      alert('Error al guardar favorito.');
    } finally {
      setLoadingFav(false);
    }
  };

  // 1. Cargar datos de la empresa
  useEffect(() => {
    if (!empresaId) return;

    const cargarEmpresa = async () => {
      try {
        // CORRECCIÓN: 'empresas' en plural como en tu Firebase
        const empresaRef = doc(db, 'empresa', empresaId);
        const snap = await getDoc(empresaRef);

        if (snap.exists()) {
          setEmpresa({ id: snap.id, ...snap.data() });
        } else {
          setError("Empresa no encontrada");
        }
      } catch (err) {
        logError(err, { accion: 'cargarEmpresa', empresaId, componente: 'PerfilEmpresaPublica' });
        setError("Error al cargar la empresa");
      }
    };

    cargarEmpresa();
  }, [empresaId]);

  // 2. Cargar promociones en tiempo real
  useEffect(() => {
    if (!empresaId) return;

    const q = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId),
      where('activa', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const promosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPromociones(promosData);
      setLoading(false);
    }, (err) => {
      logError(err, { accion: 'cargarPromocionesTiempoReal', empresaId, componente: 'PerfilEmpresaPublica' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [empresaId]);

  if (loading) return <div className="perfil-publico-loading"><div className="loader"></div></div>;
  if (error) return <div className="error-container">{error}</div>;

  const nombreEmpresa = empresa?.nombreComercial || empresa?.nombre || 'Perfil de Empresa';

  return (
    <div className="perfil-publico-container">
      <header className="perfil-publico-header">
        <button onClick={() => navigate(-1)} className="btn-volver-header">
          ← Volver
        </button>
        <h1>{nombreEmpresa}</h1>
        {user && userType === 'cliente' && (
          <button
            className={`btn-fav-empresa ${isFavorite ? 'active' : ''}`}
            onClick={handleToggleFav}
            disabled={loadingFav}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
      </header>

      <div className="perfil-publico-content">
        <section className="perfil-publico-hero">
          <div className="perfil-publico-hero-main">
            <div className="perfil-publico-avatar">
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo de la empresa" />
              ) : (
                <div className="avatar-placeholder">{nombreEmpresa.charAt(0)}</div>
              )}
            </div>

            <div className="perfil-publico-detalles">
              <div className="perfil-publico-badges">
                {empresa?.categoria && <span className="perfil-chip">{empresa.categoria}</span>}
                <span className="perfil-chip perfil-chip-soft">Empresa verificada</span>
              </div>
              <h2>{nombreEmpresa}</h2>
              <p className="perfil-descripcion">{empresa?.descripcion || 'Próximamente más información sobre este negocio.'}</p>

              <div className="perfil-publico-metainfo">
                <div className="meta-item">
                  <span className="meta-label">Ubicación</span>
                  <strong>{empresa?.direccion || 'Por confirmar'}</strong>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Contacto</span>
                  <strong>{empresa?.telefono || 'Sin teléfono'}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="promociones-seccion">
          <div className="section-title-row">
            <h3 className="section-title">
              Promociones activas <span className="count">{promociones.length}</span>
            </h3>
            <p className="section-copy">Descubre las mejores ofertas disponibles hoy.</p>
          </div>

          {promociones.length === 0 ? (
            <div className="no-promociones">
              <p>Esta empresa no tiene promociones activas en este momento.</p>
            </div>
          ) : (
            <div className="promociones-grid">
              {promociones.map((promo) => {
                const precioOriginal = formatearPrecio(promo.precioOriginal);
                const precioDescuento = formatearPrecio(promo.precioDescuento);

                return (
                  <article key={promo.id} className="promo-card-public">
                    <div className="promo-image-container">
                      {promo.imagenUrl ? (
                        <img src={promo.imagenUrl} alt={promo.titulo} className="promo-image" />
                      ) : (
                        <div className="promo-image-placeholder">
                          <span className="promo-emoji-large">{promo.emoji || '🏷️'}</span>
                        </div>
                      )}

                      {promo.descuento && <div className="descuento-badge-overlay">-{promo.descuento}%</div>}
                    </div>

                    <div className="promo-card-content">
                      <div className="promo-card-top">
                        <h4>{promo.titulo}</h4>
                        {precioDescuento && <span className="promo-price">{precioDescuento}</span>}
                      </div>

                      <p className="promo-descripcion">{promo.descripcion}</p>

                      {(precioOriginal || precioDescuento) && (
                        <div className="promo-price-row">
                          {precioOriginal && <span className="promo-original-price">{precioOriginal}</span>}
                        </div>
                      )}

                      <div className="promo-footer">
                        <span className="valido-hasta">
                          Válido hasta: {promo.fechaFin?.toDate
                            ? new Date(promo.fechaFin.toDate()).toLocaleDateString('es-ES')
                            : 'Sin fecha'}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PerfilEmpresaPublica;