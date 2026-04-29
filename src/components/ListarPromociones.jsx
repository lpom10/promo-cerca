import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { categorias } from '../data/categorias';
import '../styles/promociones.css';

const ListarPromociones = () => {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => {
    cargarPromociones();
  }, [filtroCategoria]);

  const cargarPromociones = async () => {
    try {
      setLoading(true);
      let q;

      if (filtroCategoria) {
        q = query(
          collection(db, 'promociones'),
          where('categoria', '==', filtroCategoria),
          where('activa', '==', true)
        );
      } else {
        q = query(
          collection(db, 'promociones'),
          where('activa', '==', true)
        );
      }

      const snapshot = await getDocs(q);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(promo => {
          const fechaFin = promo.fechaFin.toDate?.() || new Date(promo.fechaFin);
          return fechaFin >= hoy;
        })
        .sort((a, b) => {
          const fechaA = a.fechaFin.toDate?.() || new Date(a.fechaFin);
          const fechaB = b.fechaFin.toDate?.() || new Date(b.fechaFin);
          return fechaA - fechaB;
        });

      setPromociones(data);
    } catch (error) {
      console.error('Error cargando promociones:', error);
    }
    setLoading(false);
  };

  const categoriasFormato = [
    { valor: '', etiqueta: '🗂️ Todas' },
    ...categorias.slice(1).map(cat => ({
      valor: cat.id,
      etiqueta: `${cat.emoji} ${cat.label}`
    }))
  ];

  const isPromoVencida = (fechaFin) => {
    const fecha = fechaFin.toDate?.() || new Date(fechaFin);
    return fecha < new Date();
  };

  const diasFaltantes = (fechaFin) => {
    const fecha = fechaFin.toDate?.() || new Date(fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diferencia = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  return (
    <div className="listar-promociones">
      <div className="filtro-container">
        <h2>Promociones Disponibles</h2>
        <div className="filtros">
          {categoriasFormato.map(cat => (
            <button
              key={cat.valor}
              onClick={() => setFiltroCategoria(cat.valor)}
              className={`filtro-btn ${filtroCategoria === cat.valor ? 'active' : ''}`}
            >
              {cat.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando promociones...</div>
      ) : promociones.length === 0 ? (
        <div className="sin-promociones">
          <p>No hay promociones disponibles en esta categoría</p>
        </div>
      ) : (
        <div className="promociones-grid">
          {promociones.map(promo => {
            const dias = diasFaltantes(promo.fechaFin);
            const vencida = dias < 0;

            return (
              <div
                key={promo.id}
                className={`promo-card-cliente ${vencida ? 'vencida' : ''}`}
              >
                {promo.imagen && (
                  <div className="promo-imagen">
                    <img src={promo.imagen} alt={promo.titulo} />
                  </div>
                )}

                <div className="promo-body">
                  <div className="promo-header">
                    <h3>{promo.titulo}</h3>
                    <span className="descuento-grande">-{promo.descuento}%</span>
                  </div>

                  <p className="negocio-nombre">
                    <strong>{promo.empresaNombre}</strong>
                  </p>

                  <p className="promo-descripcion">{promo.descripcion}</p>

                  <div className="promo-footer">
                    <div className="tiempo-restante">
                      {vencida ? (
                        <span className="vencida-text">⏰ Vencida</span>
                      ) : dias === 0 ? (
                        <span className="vence-hoy">🔴 Vence hoy</span>
                      ) : dias === 1 ? (
                        <span className="vence-pronto">🟡 Vence mañana</span>
                      ) : (
                        <span className="tiempo-normal">📅 Vence en {dias} días</span>
                      )}
                    </div>
                    <button className="btn-guardar-promo">❤️ Guardar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListarPromociones;
