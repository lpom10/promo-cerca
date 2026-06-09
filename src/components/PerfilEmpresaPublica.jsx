import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { logError } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { toggleEmpresaFavorita, obtenerFavoritos } from '../services/favoritosService';
import '../styles/PerfilEmpresaPublica.css';

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

  return (
    <div className="perfil-publico-container">
      <header className="perfil-publico-header">
        <button onClick={() => navigate(-1)} className="btn-volver-header">
          ← Volver
        </button>
        <h1 style={{ flex: 1 }}>{empresa?.nombreComercial || 'Perfil de Empresa'}</h1>
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
        <div className="perfil-publico-info">
          <div className="perfil-publico-avatar">
            {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" />
            ) : (
              <div className="avatar-placeholder">{empresa?.nombreComercial?.charAt(0)}</div>
            )}
          </div>
          <div className="perfil-publico-detalles">
            <h2>{empresa?.nombreComercial}</h2>
            <p className="info-item">📍 {empresa?.direccion}</p>
            <p className="info-item">📞 {empresa?.telefono}</p>
            <p className="perfil-descripcion">{empresa?.descripcion}</p>
          </div>
        </div>

        <div className="promociones-seccion">
          <h3 className="section-title">
            Promociones Activas <span className="count">{promociones.length}</span>
          </h3>

          {promociones.length === 0 ? (
            <div className="no-promociones">
              <p>Esta empresa no tiene promociones activas en este momento.</p>
            </div>
          ) : (
            <div className="promociones-grid">
              {promociones.map((promo) => (
                <div key={promo.id} className="promo-card-public">
                  
                  {/* CONTENEDOR DE IMAGEN */}
                  <div className="promo-image-container">
                    {promo.imagenUrl ? (
                      <img 
                        src={promo.imagenUrl} 
                        alt={promo.titulo} 
                        className="promo-image" 
                      />
                    ) : (
                      <div className="promo-image-placeholder">
                        <span className="promo-emoji-large">{promo.emoji || '🏷️'}</span>
                      </div>
                    )}
                    
                    {promo.descuento && (
                      <div className="descuento-badge-overlay">
                        -{promo.descuento}%
                      </div>
                    )}
                  </div>

                  <div className="promo-card-content">
                    <h4>{promo.titulo}</h4>
                    <p className="promo-descripcion">{promo.descripcion}</p>
                    
                    <div className="promo-footer">
                      <span className="valido-hasta">
                        Válido hasta: {promo.fechaFin?.toDate 
                          ? new Date(promo.fechaFin.toDate()).toLocaleDateString('es-ES') 
                          : 'Sin fecha'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilEmpresaPublica;