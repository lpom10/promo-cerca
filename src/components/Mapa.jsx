import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import '../styles/mapa.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { categorias } from '../data/categorias';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const getEmoji = (categoriaId) => categorias.find(c => c.id === categoriaId)?.emoji || '🏷️';

const MapaFocus = ({ targetId, markerRefs, locales }) => {
  const map = useMap();
  useEffect(() => {
    if (!targetId) return;
    const local = locales.find((l) => l.id === targetId);
    if (local && local.lat && local.lng) {
      map.setView([Number(local.lat), Number(local.lng)], 17, { animate: true });
      setTimeout(() => markerRefs.current[local.id]?.openPopup(), 400);
    }
  }, [targetId, map, markerRefs, locales]);
  
  // Solución para el bug del mapa cortado cuando carga por primera vez
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);

  return null;
};

const Mapa = () => {
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const [catActiva, setCatActiva] = useState('todos');
  const [search, setSearch] = useState('');
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const markerRefs = useRef({});

  useEffect(() => {
    const cargarLocales = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, 'promociones'));
        setLocales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error cargando locales:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarLocales();
  }, []);

  
  const localesFiltrados = locales.filter((l) => {
    const tieneCoordenadas = l.lat !== undefined && l.lng !== undefined;
    const matchCat = catActiva === 'todos' || l.categoria === catActiva;
    const matchSearch = !search || (l.empresaNombre?.toLowerCase().includes(search.toLowerCase()) || l.titulo?.toLowerCase().includes(search.toLowerCase()));
    return tieneCoordenadas && matchCat && matchSearch && l.activa !== false;
  });
  return (
    <div className="mapa-page">
      <aside className="mapa-sidebar">
        <h2 className="mapa-sidebar-titulo">Negocios</h2>
        <input
          type="text"
          className="mapa-search"
          placeholder="🔍 Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mapa-cats">
          {categorias.slice(0, 4).map((c) => (
            <button
              key={c.id}
              className={`mapa-cat-btn ${catActiva === c.id ? 'active' : ''}`}
              onClick={() => setCatActiva(c.id)}
              title={c.label}
            >
              {c.emoji}
            </button>
          ))}
          {categorias.slice(4).map((c) => (
            <button
              key={c.id}
              className={`mapa-cat-btn ${catActiva === c.id ? 'active' : ''}`}
              onClick={() => setCatActiva(c.id)}
              title={c.label}
            >
              {c.emoji}
            </button>
          ))}
        </div>
        <div className="mapa-lista">
          {localesFiltrados.length === 0 && (
            <p className="mapa-sin-resultados">Sin resultados</p>
          )}
          {localesFiltrados.map((l) => (
            <div
              key={l.id}
              className={`mapa-item ${targetId === l.id ? 'active' : ''}`}
              onClick={() => {
                if (markerRefs.current[l.id]) {
                  const map = markerRefs.current[l.id]._map;
                  if (map) map.setView([Number(l.lat), Number(l.lng)], 17, { animate: true });
                  markerRefs.current[l.id].openPopup();
                }
              }}
            >
              <span className="mapa-item-emoji">{getEmoji(l.categoria)}</span>
              <div className="mapa-item-info">
                <strong>{l.empresaNombre}</strong>
                <span>{l.titulo}</span>
              </div>
              <span className="mapa-item-badge">{l.descuento}%</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="mapa-container">
        <MapContainer
          center={[-4.007, -79.211]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">Carto</a> contributors'
          />

          <MapaFocus targetId={targetId} markerRefs={markerRefs} locales={locales} />  {/* ← locales como prop */}

          {localesFiltrados.map((local) => (
            <Marker
              key={local.id}
              position={[Number(local.lat), Number(local.lng)]}
              ref={(ref) => { if (ref) markerRefs.current[local.id] = ref; }}
            >
              <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                <div style={{ width: '180px' }}>
                  {local.imagen && (
                    <div style={{ margin: '-6px -6px 8px -6px' }}>
                      <img src={local.imagen} alt="Promo" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px 4px 0 0' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{getEmoji(local.categoria)}</span>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{local.empresaNombre}</strong>
                  </div>
                  <div style={{ color: '#06b6d4', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.2' }}>{local.titulo}</div>
                  {local.descuento > 0 && (
                    <div style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block', margin: '6px 0 0 0' }}>
                      {local.descuento}% DTO
                    </div>
                  )}
                </div>
              </Tooltip>
              <Popup>
                <div className="popup-content">
                  <div className="popup-header">
                    <span>{getEmoji(local.categoria)}</span>
                    <strong>{local.empresaNombre}</strong>
                  </div>
                  <p className="popup-promo">{local.titulo}</p>
                  <p className="popup-dir">{local.direccion || '📍 Ubicación en mapa'}</p>
                  <Link to={`/locales?search=${encodeURIComponent(local.empresaNombre)}`} className="popup-btn">
                    🎫 Ver promociones
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Mapa;