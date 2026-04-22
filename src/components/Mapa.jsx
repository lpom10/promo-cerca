import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { categorias } from '../data/categorias';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const MapaFocus = ({ targetId, markerRefs, locales }) => {  // ← locales como prop
  const map = useMap();
  useEffect(() => {
    if (!targetId) return;
    const local = locales.find((l) => l.id === targetId);  // ← sin parseInt, Firestore usa string como id
    if (local) {
      map.setView([local.lat, local.lng], 17, { animate: true });
      setTimeout(() => markerRefs.current[local.id]?.openPopup(), 400);
    }
  }, [targetId, map, markerRefs, locales]);
  return null;
};


const Mapa = () => {
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const [catActiva, setCatActiva] = useState('todos');
  const [search, setSearch] = useState('');
  const [locales, setLocales] = useState([]);  // ← nuevo
  const markerRefs = useRef({});

  useEffect(() => {  // ← nuevo
    const unsub = onSnapshot(collection(db, 'locales'), (snapshot) => {
      setLocales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  
const localesFiltrados = locales.filter((l) => {
  const tieneCoordenadas = l.lat && l.lng;
  const matchCat = catActiva === 'todos' || l.categoria === catActiva;
  const matchSearch = !search || l.nombre.toLowerCase().includes(search.toLowerCase());
  return tieneCoordenadas && matchCat && matchSearch;
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
              className={`mapa-item ${targetId === l.id ? 'active' : ''}`}  // ← sin parseInt
              onClick={() => markerRefs.current[l.id]?.openPopup()}
            >
              <span className="mapa-item-emoji">{l.emoji}</span>
              <div className="mapa-item-info">
                <strong>{l.nombre}</strong>
                <span>{l.promocion}</span>
              </div>
              <span className="mapa-item-badge">{l.descuento}</span>
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
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapaFocus targetId={targetId} markerRefs={markerRefs} locales={locales} />  {/* ← locales como prop */}

          {localesFiltrados.map((local) => (
            <Marker
              key={local.id}
              position={[local.lat, local.lng]}
              ref={(ref) => { if (ref) markerRefs.current[local.id] = ref; }}
            >
              <Popup>
                <div className="popup-content">
                  <div className="popup-header">
                    <span>{local.emoji}</span>
                    <strong>{local.nombre}</strong>
                  </div>
                  <p className="popup-promo">{local.promocion}</p>
                  <p className="popup-dir">{local.direccion}</p>
                  <p className="popup-hora">{local.horario}</p>
                  <p className="popup-tel">{local.telefono}</p>
                  <Link to={`/locales`} className="popup-btn">
                    🎫 Ver ticket
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