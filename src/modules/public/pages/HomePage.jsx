import React from "react";
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
import { categorias } from "../../../data/categorias";
import { logError } from "../../../shared/utils/errorHandler";
import { obtenerDatosHomePage, verificarDisponibilidadTickets } from "../services/promocionesService";

import fondo from "../../../assets/fondo.png";
import logo from "../../../assets/logo.png";
import "../styles/homepage.css";
import "../styles/mapa.css";

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
  className: "empresa-marker-div-icon",
  iconSize: [48, 60],
  iconAnchor: [24, 60],
});

// Habilita/deshabilita zoom con rueda según si el mouse está sobre el mapa
const ScrollWheelZoom = ({ enabled }) => {
  const map = useMap();
  React.useEffect(() => {
    if (enabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [enabled, map]);
  return null;
};

const useHasHoverSupport = () => {
  const [hasHoverSupport, setHasHoverSupport] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(hover: hover)").matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(hover: hover)");
    const updateHoverSupport = () => setHasHoverSupport(mediaQuery.matches);

    updateHoverSupport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateHoverSupport);
      return () => mediaQuery.removeEventListener("change", updateHoverSupport);
    }

    mediaQuery.addListener(updateHoverSupport);
    return () => mediaQuery.removeListener(updateHoverSupport);
  }, []);

  return hasHoverSupport;
};

const VisibleMarkers = ({ promociones, navigate, getEmoji }) => {
  const map = useMap();
  const [visibleItems, setVisibleItems] = React.useState([]);
  const timerRef = React.useRef(null);

  const updateVisible = () => {
    const bounds = map.getBounds();
    const filtered = promociones.filter(
      (p) =>
        p.lat !== undefined &&
        p.lng !== undefined &&
        bounds.contains([p.lat, p.lng]),
    );
    setVisibleItems(filtered);
  };

  React.useEffect(() => {
    updateVisible();
  }, [promociones]);

  useMapEvents({
    moveend: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(updateVisible, 100);
    },
    zoomend: updateVisible,
  });

  return visibleItems.map((promo) => (
    <Marker
      key={promo.id}
      position={[promo.lat, promo.lng]}
      icon={customIcon}
      eventHandlers={{ click: () => navigate(`/mapa?id=${promo.id}`) }}
    >
      <Tooltip direction="top" offset={[0, -40]} opacity={1}>
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
          {promo.precioDescuento && (
            <div
              style={{
                fontSize: "12px",
                color: "#2B87FF",
                fontWeight: "bold",
                marginTop: "4px",
              }}
            >
              ${promo.precioDescuento}{" "}
              {promo.precioOriginal && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    textDecoration: "line-through",
                  }}
                >
                  ${promo.precioOriginal}
                </span>
              )}
            </div>
          )}
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "6px" }}>
            Click para explorar mapa
          </div>
        </div>
      </Tooltip>
    </Marker>
  ));
};

const HomePage = () => {
  const [search, setSearch] = React.useState("");
  const [promociones, setPromociones] = React.useState([]);
  const [mapHovered, setMapHovered] = React.useState(false);
  const hasHoverSupport = useHasHoverSupport();
  const navigate = useNavigate();
  const [empresasMap, setEmpresasMap] = React.useState({});

  React.useEffect(() => {
    const cargarDatosHome = async () => {
      try {
        const { empresasMap: nuevasEmpresasMap, promociones: promosEnriquecidas } =
          await obtenerDatosHomePage();

        setEmpresasMap(nuevasEmpresasMap);
        setPromociones(promosEnriquecidas);
      } catch (err) {
        logError(err, { accion: "cargarDatosHome", componente: "HomePage" });
      }
    };

    cargarDatosHome();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : "/locales");
  };

  const activePromos = promociones.filter((p) => {
    const tieneCoords = p.lat !== undefined && p.lng !== undefined;
    const estaActiva = p.activa !== false;

    let ticketsDisponibles = true;
    try {
      const estado = verificarDisponibilidadTickets(p);
      ticketsDisponibles = estado ? estado.disponible : true;
    } catch (error) {
      logError(error, {
        accion: "verificarTickets",
        promocionId: p.id,
        componente: "HomePage",
      });
    }

    return tieneCoords && estaActiva && ticketsDisponibles;
  });


  const getEmoji = (categoriaId) =>
    categorias.find((c) => c.id === categoriaId)?.emoji || "🏷️";

  const shouldEnableZoom = !hasHoverSupport || mapHovered;

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
                <button type="submit" className="hp-search-btn">
                  Buscar
                </button>
              </form>
            </div>
          </div>

          {/* ── Mitad Derecha: Mapa + Botón ── */}
          <div className="hp-right">
            <div className="hp-map-wrapper">
              <div
                className="hp-map-container"
                onMouseEnter={() => hasHoverSupport && setMapHovered(true)}
                onMouseLeave={() => hasHoverSupport && setMapHovered(false)}
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
                  <ScrollWheelZoom enabled={shouldEnableZoom} />
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
      <section className="steps-section">
        <h2>¿Cómo funciona?</h2>

        <div className="how-it-works">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Busca</h3>
            <p>Encuentra promociones cerca de ti.</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h3>Genera Ticket</h3>
            <p>Obtén tu cupón digital.</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h3>Canjea</h3>
            <p>Recibe tu descuento en el local.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;