import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { categorias } from '../data/categorias';
import { usePromociones } from './usePromociones';
import fondo from '../assets/fondo.png';
import '../styles/homepage.css';
import '../styles/mapa.css';

// Diseño de tu pin azul
const customIcon = L.divIcon({
  html: `
    <div class="empresa-marker">
      <svg class="empresa-pin-svg" width="48" height="60" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.18"/>
          </filter>
        </defs>
        <path d="M24 0C14 0 6 8 6 18c0 12 18 36 18 36s18-24 18-36C42 8 34 0 24 0z" fill="#2B87FF" filter="url(#pinShadow)"/>
        <circle cx="24" cy="18" r="8" fill="#FFFFFF" opacity="0.98"/>
      </svg>
    </div>
  `,
  className: 'empresa-marker-div-icon',
  iconSize: [48, 60],
  iconAnchor: [24, 60],
});

const VisibleMarkers = ({ promociones, navigate, getEmoji }) => {
  const map = useMap();
  const [visibleItems, setVisibleItems] = useState([]);
  const timerRef = useRef(null);

  const updateVisible = () => {
    const bounds = map.getBounds();
    const filtered = promociones.filter(p => 
      p.lat !== undefined && p.lng !== undefined && bounds.contains([p.lat, p.lng])
    );
    setVisibleItems(filtered);
  };

  useEffect(() => {
    updateVisible();
  }, [promociones]);

  useMapEvents({
    moveend: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(updateVisible, 100);
    },
    zoomend: updateVisible
  });

  return visibleItems.map(promo => (
    <Marker 
      key={promo.id} 
      position={[promo.lat, promo.lng]} 
      icon={customIcon}
      eventHandlers={{ click: () => navigate(`/mapa?id=${promo.id}`) }}
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
          <div style={{ color: '#06b6d4', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.2' }}>
            {promo.titulo}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>Clic para explorar mapa</div>
        </div>
      </Tooltip>
    </Marker>
  ));
};

const HomePage = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { promociones, loading } = usePromociones(50);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : '/locales');
  };

  const getEmoji = (categoriaId) => categorias.find(c => c.id === categoriaId)?.emoji || '🏷️';

  return (
    <div className="homepage-container">
      {/* ──── Contenedor Hero Split (Pantalla Dividida) ──── */}
      <div className="hero-split" style={{ backgroundImage: `url(${fondo})` }}>
        <div className="hero-overlay" />
        
        <div className="hero-split-wrapper">
          {/* Mitad Izquierda: Texto y Buscador */}
          <div className="hero-left">
            <div className="hero-content-box">
              <h1 className="hero-title">
                Descubre las mejores<br />
                <span className="hero-title-accent">promociones</span> para ti
              </h1>
              <p className="hero-subtitle">
                Ahorra en tus negocios favoritos. Encuentra descuentos exclusivos y canjea tickets digitales al instante.
              </p>
              <form className="hero-search" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Negocio, categoría o promoción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="hero-input"
                />
                <button type="submit" className="hero-search-btn">🔍</button>
              </form>
            </div>
          </div>

          {/* Mitad Derecha: Mapa */}
          <div className="hero-right">
            <div className="map-preview-wrapper">
              <div className="map-preview-header">
                <span>📍 Negocios cercanos</span>
                <Link to="/mapa" className="map-preview-btn">Ver pantalla completa →</Link>
              </div>
              <div className="map-embedded-box">
                <MapContainer 
                  center={[-4.007, -79.211]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                  />
                  {!loading && (
                    <VisibleMarkers 
                      promociones={promociones} 
                      navigate={navigate} 
                      getEmoji={getEmoji} 
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;