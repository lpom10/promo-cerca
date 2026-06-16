<<<<<<< HEAD
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { collection, getDocs, query, limit, where } from "firebase/firestore";
import { db } from "../firebase";
import { categorias } from "../data/categorias";
import { verificarDisponibilidadTickets } from "../services/ticketService";
import { logError } from "../utils/errorHandler";
import fondo from "../assets/fondo.png";
import Footer from "./Footer";
import "../styles/homepage.css";
import "../styles/mapa.css";
=======
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { categorias } from '../data/categorias';
import { verificarDisponibilidadTickets } from '../services/ticketService';
import { logError } from '../utils/errorHandler';
import fondo from '../assets/fondo.png';
import logo from '../assets/logo.png';
import Footer from './Footer';
import '../styles/homepage.css';
import '../styles/mapa.css';
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf

// Pin azul personalizado
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
<<<<<<< HEAD
  className: "empresa-marker-div-icon",
=======
  className: 'empresa-marker-div-icon',
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
  iconSize: [48, 60],
  iconAnchor: [24, 60],
});

// Habilita/deshabilita zoom con rueda según si el mouse está sobre el mapa
const ScrollWheelZoom = ({ enabled }) => {
  const map = useMap();
  useEffect(() => {
    if (enabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [enabled, map]);
  return null;
};

const VisibleMarkers = ({ promociones, navigate, getEmoji }) => {
  const map = useMap();
  const [visibleItems, setVisibleItems] = useState([]);
  const timerRef = useRef(null);

  const updateVisible = () => {
    const bounds = map.getBounds();
<<<<<<< HEAD
    const filtered = promociones.filter(
      (p) =>
        p.lat !== undefined &&
        p.lng !== undefined &&
        bounds.contains([p.lat, p.lng]),
=======
    const filtered = promociones.filter(p =>
      p.lat !== undefined && p.lng !== undefined && bounds.contains([p.lat, p.lng])
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
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
<<<<<<< HEAD
    zoomend: updateVisible,
  });

  return visibleItems.map((promo) => (
=======
    zoomend: updateVisible
  });

  return visibleItems.map(promo => (
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
    <Marker
      key={promo.id}
      position={[promo.lat, promo.lng]}
      icon={customIcon}
      eventHandlers={{ click: () => navigate(`/mapa?id=${promo.id}`) }}
    >
      <Tooltip direction="top" offset={[0, -40]} opacity={1}>
<<<<<<< HEAD
        <div style={{ width: "180px" }}>
          {promo.imagen && (
            <div style={{ margin: "-6px -6px 8px -6px" }}>
              <img
                src={promo.imagen}
                alt="Promo"
                style={{
                  width: "100%",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "16px" }}>
              {getEmoji(promo.categoria)}
            </span>
            <strong style={{ fontSize: "13px", color: "#1e293b" }}>
              {promo.empresaNombre}
            </strong>
          </div>
          <div
            style={{
              color: "#06b6d4",
              fontSize: "13px",
              fontWeight: "bold",
              lineHeight: "1.2",
            }}
          >
            {promo.titulo}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "6px" }}>
            Clic para explorar mapa
          </div>
=======
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
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>Click para explorar mapa</div>
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
        </div>
      </Tooltip>
    </Marker>
  ));
};

const HomePage = () => {
<<<<<<< HEAD
  const [search, setSearch] = useState("");
=======
  const [search, setSearch] = useState('');
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
  const [promociones, setPromociones] = useState([]);
  const [mapHovered, setMapHovered] = useState(false);
  const navigate = useNavigate();
  const [empresasMap, setEmpresasMap] = useState({});

  // Cargar empresas aprobadas
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
<<<<<<< HEAD
        const qe = query(
          collection(db, "empresa"),
          where("estado", "==", "aprobado"),
          limit(100),
        );
        const empSnap = await getDocs(qe);
        const newEmpresasMap = {};
        empSnap.forEach((d) => {
          newEmpresasMap[d.id] = { id: d.id, ...d.data() };
        });
        setEmpresasMap(newEmpresasMap);
      } catch (err) {
        logError(err, { accion: "cargarEmpresas", componente: "TextField" });
=======
        const qe = query(collection(db, 'empresa'), where('estado', '==', 'aprobado'), limit(100));
        const empSnap = await getDocs(qe);
        const newEmpresasMap = {};
        empSnap.forEach(d => { newEmpresasMap[d.id] = { id: d.id, ...d.data() }; });
        setEmpresasMap(newEmpresasMap);
      } catch (err) {
        logError(err, { accion: 'cargarEmpresas', componente: 'TextField' });
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
      }
    };
    cargarEmpresas();
  }, []);

  // Cargar promociones activas
  useEffect(() => {
    const cargarPromociones = async () => {
      try {
<<<<<<< HEAD
        const qp = query(
          collection(db, "promociones"),
          where("activa", "==", true),
          limit(30),
        );
        const promoSnap = await getDocs(qp);

        const promosEnriquecidas = promoSnap.docs.map((doc) => {
=======
        // Simplificación de la consulta para evitar procesamiento excesivo en el cliente
        const qp = query(
          collection(db, 'promociones'), 
          where('estado', '==', 'aprobado'),
          where('activa', '==', true), 
          limit(20)
        );
        const promoSnap = await getDocs(qp);

        const promosEnriquecidas = promoSnap.docs.map(doc => {
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
          const data = { id: doc.id, ...doc.data() };
          const e = data.empresaId ? empresasMap[data.empresaId] : null;

          let rawLat = data.lat ?? e?.lat;
          let rawLng = data.lng ?? e?.lng;

<<<<<<< HEAD
          if (typeof rawLat === "string")
            rawLat = parseFloat(rawLat.replace(",", "."));
          if (typeof rawLng === "string")
            rawLng = parseFloat(rawLng.replace(",", "."));

          return {
            ...data,
            empresaNombre:
              data.empresaNombre || e?.nombre || e?.empresaNombre || "Negocio",
            lat: isNaN(rawLat) ? undefined : rawLat,
            lng: isNaN(rawLng) ? undefined : rawLng,
            categoria: data.categoria || e?.categoria,
=======
          if (typeof rawLat === 'string') rawLat = parseFloat(rawLat.replace(',', '.'));
          if (typeof rawLng === 'string') rawLng = parseFloat(rawLng.replace(',', '.'));

          return {
            ...data,
            empresaNombre: data.empresaNombre || e?.nombre || e?.empresaNombre || 'Negocio',
            lat: isNaN(rawLat) ? undefined : rawLat,
            lng: isNaN(rawLng) ? undefined : rawLng,
            categoria: data.categoria || e?.categoria
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
          };
        });

        setPromociones(promosEnriquecidas);
      } catch (err) {
<<<<<<< HEAD
        logError(err, { accion: "cargarPromociones", componente: "TextField" });
=======
        logError(err, { accion: 'cargarPromociones', componente: 'TextField' });
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
      }
    };

    if (Object.keys(empresasMap).length > 0) {
      cargarPromociones();
    }
  }, [empresasMap]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
<<<<<<< HEAD
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : "/locales");
  };

  const activePromos = promociones.filter((p) => {
=======
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : '/locales');
  };

  const activePromos = promociones.filter(p => {
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
    const tieneCoords = p.lat !== undefined && p.lng !== undefined;
    const estaActiva = p.activa !== false;

    let ticketsDisponibles = true;
    try {
      const estado = verificarDisponibilidadTickets(p);
      ticketsDisponibles = estado ? estado.disponible : true;
    } catch (error) {
<<<<<<< HEAD
      logError(error, {
        accion: "verificarTickets",
        promocionId: p.id,
        componente: "TextField",
      });
=======
      logError(error, { accion: 'verificarTickets', promocionId: p.id, componente: 'TextField' });
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
    }

    return tieneCoords && estaActiva && ticketsDisponibles;
  });

  useEffect(() => {
<<<<<<< HEAD
    if (import.meta.env.MODE === "development") {
=======
    if (import.meta.env.MODE === 'development') {
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
      console.debug("🗺️ PINES LISTOS:", activePromos.length);
    }
  }, [activePromos]);

<<<<<<< HEAD
  const getEmoji = (categoriaId) =>
    categorias.find((c) => c.id === categoriaId)?.emoji || "🏷️";

  return (
    <>
      <div
        className="hp-fullscreen"
        style={{ backgroundImage: `url(${fondo})` }}
      >
        {/* Overlay oscuro sobre toda la ventana */}
        <div className="hp-overlay" />

        {/* Layout dividido en dos mitades */}
        <div className="hp-split">
          {/* ── Mitad Izquierda: Texto introductorio + Buscador ── */}
          <div className="hp-left">
            <div className="hp-text-box">
              <h1 className="hp-title">
                Descubre las mejores
                <br />
                <span className="hp-title-accent">promociones</span> cerca de ti
              </h1>
              <p className="hp-subtitle">
                Restaurantes, cafeterías, tiendas y servicios con promociones
                exclusivas disponibles ahora.
              </p>
              <div className="buttons-container">
                <button type="submit" className="hp-search-btn">
                  Ver promociones
                </button>
                <button type="submit" className="hp-search-btn">
                  Registrar negocio
                </button>
              </div>

              <section className="stats">
                <div>
                  <h2>500+</h2>
                  <p>Promociones activas</p>
                </div>

                <div>
                  <h2>200+</h2>
                  <p>Negocios afiliados</p>
                </div>

                <div>
                  <h2>10K+</h2>
                  <p>Usuarios registrados</p>
                </div>
              </section>
            </div>
          </div>

          {/* ── Mitad Derecha: Mapa + Botón ── */}
          <div className="hp-right">
            <div className="hp-map-wrapper">
              <div
                className="hp-map-container"
                onMouseEnter={() => setMapHovered(true)}
                onMouseLeave={() => setMapHovered(false)}
              >
                <MapContainer
                  center={[-4.007, -79.211]}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                  />
                  <ScrollWheelZoom enabled={mapHovered} />
                  <VisibleMarkers
                    promociones={activePromos}
                    navigate={navigate}
                    getEmoji={getEmoji}
                  />
                </MapContainer>
              </div>
              <Link to="/mapa" className="hp-map-btn">
                🗺️ Acceder al mapa completo
              </Link>
            </div>
          </div>
        </div>
      </div>
      <section className="steps-section">
        
        <h2>¿Cómo funciona?</h2>
        <p>Obtén promociones exclusivas cerca de ti en solo tres pasos.</p>

        <div className="how-it-works">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Busca</h3>
            <p>Explora promociones disponibles cerca de tu ubicación.</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h3>Genera Ticket</h3>
            <p>Obtén tu ticket digital para asegurar la promoción.</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h3>Canjea</h3>
            <p>Visita el negocio y disfruta tu descuento o beneficio.</p>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <h2>¿Listo para ahorrar?</h2>

        <p>
          Descubre promociones exclusivas, genera tickets digitales y aprovecha
          descuentos en negocios cerca de ti.
        </p>

        <div className="cta-buttons">
          <button>Explorar Promociones</button>
          <button className="secondary-btn">Registrar Negocio</button>
        </div>
      </section>
      <Footer />
=======
  const getEmoji = (categoriaId) => categorias.find(c => c.id === categoriaId)?.emoji || '🏷️';

  return (
    <>
    <div className="hp-fullscreen" style={{ backgroundImage: `url(${fondo})` }}>
      {/* Overlay oscuro sobre toda la ventana */}
      <div className="hp-overlay" />

      {/* Layout dividido en dos mitades */}
      <div className="hp-split">

        {/* ── Mitad Izquierda: Texto introductorio + Buscador ── */}
        <div className="hp-left">
          <div className="hp-text-box">
            <h1 className="hp-title">
              Descubre las mejores<br />
              <span className="hp-title-accent">promociones</span> cerca de ti
            </h1>
            <p className="hp-subtitle">
              Conectamos clientes con los negocios locales más cercanos.
              Ahorra con descuentos exclusivos y canjea tickets digitales.
            </p>
            <form className="hp-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Busca un negocio, categoría o promoción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hp-input"
              />
              <button type="submit" className="hp-search-btn">Buscar</button>
            </form>
          </div>
        </div>

        {/* ── Mitad Derecha: Mapa + Botón ── */}
        <div className="hp-right">
          <div className="hp-map-wrapper">
            <div
              className="hp-map-container"
              onMouseEnter={() => setMapHovered(true)}
              onMouseLeave={() => setMapHovered(false)}
            >
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
                <ScrollWheelZoom enabled={mapHovered} />
                <VisibleMarkers
                  promociones={activePromos}
                  navigate={navigate}
                  getEmoji={getEmoji}
                />
              </MapContainer>
            </div>
            <Link to="/mapa" className="hp-map-btn">
              Acceder al mapa completo
            </Link>
          </div>
        </div>

      </div>
    </div>
    <Footer />
>>>>>>> 1772f0a0515c0ce6d30984bcb7440fc6849feedf
    </>
  );
};

export default HomePage;
