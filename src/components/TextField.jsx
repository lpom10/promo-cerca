import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { categorias } from '../data/categorias';
import fondo from '../assets/fondo.png';
import empresaImg from '../assets/empresa.png';
import '../styles/homepage.css';

const TextField = () => {
  const [search, setSearch] = useState('');
  const [promociones, setPromociones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'promociones'), (snapshot) => {
      setPromociones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : '/locales');
  };

  const promoMap = promociones.filter(p => p.lat !== undefined && p.lng !== undefined && p.activa !== false);

  const getEmoji = (categoriaId) => categorias.find(c => c.id === categoriaId)?.emoji || '🏷️';

  return (
    <>
      {/* ──── Sección Hero Principal ──── */}
      <div className="hero" style={{ backgroundImage: `url(${fondo})` }}>
        <div className="hero-overlay" />

        <div className="hero-content">
          <h1 className="hero-title">
            Descubre las mejores<br />
            <span className="hero-title-accent">promociones</span> cerca de ti
          </h1>

          <p className="hero-subtitle">
            Conectamos clientes con los negocios locales más cercanos.<br />
            Ahorra con descuentos exclusivos y canjea tickets digitales.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Busca un negocio, categoría o promoción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hero-input"
            />
            <button type="submit" className="hero-search-btn">
              Buscar
            </button>
          </form>
        </div>

        <div className="hero-img-wrap">
          <img src={empresaImg} alt="Negocios locales" className="hero-img" />
        </div>
      </div>

      {/* ──── Sección Mapa ──── */}
      <section className="mapa-section">
        <div className="mapa-container">
          <div className="mapa-box">
            <div className="mapa-embedded" style={{ height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
              <MapContainer 
                center={[-4.007, -79.211]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">Carto</a>'
                />
                {promoMap.map(promo => (
                  <Marker 
                    key={promo.id} 
                    position={[Number(promo.lat), Number(promo.lng)]} 
                    eventHandlers={{ click: () => navigate('/mapa') }}
                  >
                    <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                      <div style={{ width: '180px' }}>
                        {promo.imagen && (
                          <div style={{ margin: '-6px -6px 8px -6px' }}>
                            <img src={promo.imagen} alt="Promo" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px 4px 0 0' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px' }}>{getEmoji(promo.categoria)}</span>
                          <strong style={{ fontSize: '13px', color: '#1e293b' }}>{promo.empresaNombre}</strong>
                        </div>
                        <div style={{ color: '#06b6d4', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.2' }}>{promo.titulo}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>Clic para explorar mapa</div>
                      </div>
                    </Tooltip>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="mapa-info">
            <h2 className="mapa-title">Encuentra negocios cerca de ti</h2>
            <p className="mapa-desc">
              Nuestro mapa interactivo muestra todos los negocios locales que participan en Promo Cerca.
              Descubre restaurantes, tiendas, servicios y más con promociones exclusivas a tu alcance.
            </p>
            
            <ul className="mapa-features">
              <li>
                <span className="feature-icon">📍</span>
                <div>
                  <strong>Localización precisa</strong>
                  <p>Ve exactamente dónde están los negocios</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">🏷️</span>
                <div>
                  <strong>Promociones activas</strong>
                  <p>Conoce todas las ofertas disponibles</p>
                </div>
              </li>
              <li>
                <span className="feature-icon">⭐</span>
                <div>
                  <strong>Información del negocio</strong>
                  <p>Horarios, teléfono y servicios</p>
                </div>
              </li>
            </ul>

            <Link to="/mapa" className="mapa-btn">
              Ver mapa completo →
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Sección CTA ──── */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Listo para ahorrar?</h2>
          <p>Explora cientos de promociones en tu ciudad y canjea tickets digitales</p>
          <Link to="/locales" className="cta-btn">Explorar ofertas</Link>
        </div>
      </section>
    </>
  );
};

export default TextField;
