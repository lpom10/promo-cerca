import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/PerfilEmpresaPublica.css';

const PerfilEmpresaPublica = () => {
  const { empresaId } = useParams();
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar empresa
  useEffect(() => {
    if (!empresaId) return;

    const cargarEmpresa = async () => {
      try {
        const empresaRef = doc(db, 'empresas', empresaId);
        const snap = await getDoc(empresaRef);

        if (snap.exists()) {
          setEmpresa({ id: snap.id, ...snap.data() });
        } else {
          setError("Empresa no encontrada");
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar la empresa");
      } finally {
        setLoading(false);
      }
    };

    cargarEmpresa();
  }, [empresaId]);

  // Cargar promociones
  useEffect(() => {
    if (!empresaId) return;

    const q = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId),
      where('activa', '==', true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setPromociones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [empresaId]);

  if (loading) {
    return (
      <div className="perfil-publico-loading">
        <div className="loader"></div>
        <p>Cargando perfil de la empresa...</p>
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="perfil-publico-error">
        <h2>❌ {error || "Empresa no encontrada"}</h2>
        <button onClick={() => navigate(-1)} className="btn-volver">
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-publico-container">
      {/* Header */}
      <div className="perfil-publico-header">
        <button onClick={() => navigate(-1)} className="btn-volver-header">
          ← Volver
        </button>
        <h1>{empresa.nombre || empresa.negocio}</h1>
      </div>

      <div className="perfil-publico-content">
        {/* Información principal */}
        <div className="perfil-publico-info">
          <div className="perfil-publico-avatar">
            {empresa.logo ? (
              <img src={empresa.logo} alt={empresa.nombre} />
            ) : (
              <div className="avatar-placeholder">🏪</div>
            )}
          </div>

          <div className="perfil-publico-detalles">
            <h2>{empresa.nombre || empresa.negocio}</h2>
            
            {empresa.direccion && (
              <p className="info-item">
                📍 {empresa.direccion}
              </p>
            )}
            {empresa.telefono && (
              <p className="info-item">
                📞 {empresa.telefono}
              </p>
            )}
            {empresa.horarios && (
              <p className="info-item">
                🕒 {empresa.horarios}
              </p>
            )}

            {empresa.descripcion && (
              <p className="perfil-descripcion">{empresa.descripcion}</p>
            )}
          </div>
        </div>

        {/* Promociones */}
        <div className="promociones-section">
          <h3 className="section-title">
            Promociones Activas 
            <span className="count">({promociones.length})</span>
          </h3>

          {promociones.length === 0 ? (
            <div className="no-promociones">
              <p>Esta empresa no tiene promociones activas en este momento.</p>
            </div>
          ) : (
            <div className="promociones-grid">
              {promociones.map((promo) => (
                <div key={promo.id} className="promo-card-public">
                  <div className="promo-card-content">
                    <div className="promo-header">
                      <span className="promo-emoji">{promo.emoji || '🏷️'}</span>
                      <h4>{promo.titulo}</h4>
                    </div>
                    <p className="promo-descripcion">{promo.descripcion}</p>
                    
                    {promo.descuento && (
                      <div className="descuento-badge">
                        -{promo.descuento}%
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