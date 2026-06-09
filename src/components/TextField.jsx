import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { categorias } from '../data/categorias';
import { verificarDisponibilidadTickets } from '../services/ticketService';
import { logError } from '../utils/errorHandler';
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

const TextField = () => {
  const [search, setSearch] = useState('');
  const [promociones, setPromociones] = useState([]);
  const navigate = useNavigate();

  // Estado para mapeo de empresas
  const [empresasMap, setEmpresasMap] = useState({});

  // Listener #1: Cargar empresas con limit
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const qe = query(collection(db, 'empresa'), limit(100));
        const empSnap = await getDocs(qe);
        const newEmpresasMap = {};
        empSnap.forEach(d => { newEmpresasMap[d.id] = { id: d.id, ...d.data() }; });
        setEmpresasMap(newEmpresasMap);
      } catch (err) {
        logError(err, { accion: 'cargarEmpresas', componente: 'TextField' });
      }
    };
    
    cargarEmpresas();
  }, []);

  // Listener #2: Cargar promociones con limit (depende de empresasMap)
  useEffect(() => {
    const cargarPromociones = async () => {
      try {
        const qp = query(collection(db, 'promociones'), orderBy('createdAt', 'desc'), limit(30));
        const promoSnap = await getDocs(qp);
        
        const promosEnriquecidas = promoSnap.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          const e = data.empresaId ? empresasMap[data.empresaId] : null;

          // Extraer lat/lng
          let rawLat = data.lat !== undefined && data.lat !== null ? data.lat : e?.lat;
          let rawLng = data.lng !== undefined && data.lng !== null ? data.lng : e?.lng;

          // LIMPIEZA A PRUEBA DE BALAS (cambia comas por puntos y fuerza a Número)
          if (typeof rawLat === 'string') rawLat = parseFloat(rawLat.replace(',', '.'));
          if (typeof rawLng === 'string') rawLng = parseFloat(rawLng.replace(',', '.'));

          return {
            ...data,
            empresaNombre: data.empresaNombre || e?.nombre || e?.empresaNombre || 'Negocio',
            lat: isNaN(rawLat) ? undefined : rawLat,
            lng: isNaN(rawLng) ? undefined : rawLng,
            categoria: data.categoria || e?.categoria
          };
        });
        
        setPromociones(promosEnriquecidas);
      } catch (err) {
        logError(err, { accion: 'cargarPromociones', componente: 'TextField' });
      }
    };
    
    if (Object.keys(empresasMap).length > 0) {
      cargarPromociones();
    }
  }, [empresasMap]);


  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : '/locales');
  };

  // Filtro protegido contra caídas
  const promoMap = promociones.filter(p => {
    const tieneCoords = p.lat !== undefined && p.lng !== undefined;
    const estaActiva = p.activa !== false;
    
    let ticketsDisponibles = true;
    try {
      const estado = verificarDisponibilidadTickets(p);
      ticketsDisponibles = estado ? estado.disponible : true;
    } catch (error) {
      logError(error, { accion: 'verificarTickets', promocionId: p.id, componente: 'TextField' });
    }

    return tieneCoords && estaActiva && ticketsDisponibles;
  });

  // Verificar pines en desarrollo
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.debug("🗺️ PINES LISTOS:", promoMap.length);
    }
  }, [promoMap]);

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
            <button type="submit" className="hero-search-btn">Buscar</button>
          </form>
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
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">Carto</a>'
                />
                {promoMap.map(promo => (
                  <Marker 
                    key={promo.id} 
                    position={[promo.lat, promo.lng]} 
                    icon={customIcon}
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
            <Link to="/mapa" className="mapa-btn">Ver mapa completo →</Link>
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