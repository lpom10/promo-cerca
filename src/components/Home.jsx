import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para iconos de Leaflet en React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import Footer from "./Footer";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Componente para forzar la activación del zoom con la rueda y el foco del mapa
const MapController = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Habilitar explícitamente el zoom con la rueda
    map.scrollWheelZoom.enable();

    // Opcional: Centrar el mapa si es necesario al cargar
    // map.setView([-0.1807, -78.4678], 13);

    // Asegurar que el contenedor del mapa pueda recibir foco para eventos de teclado/rueda
    const container = map.getContainer();
    container.style.outline = "none";
  }, [map]);

  return null;
};

const Home = () => {
  const [locales, setLocales] = useState([]);
  const center = [-0.1807, -78.4678]; // Coordenadas por defecto (ej. Quito)

  useEffect(() => {
    const fetchLocales = async () => {
      try {
        // Consultamos las empresas que tengan promociones activas
        // Nota: Asegúrate de que tus documentos de 'empresa' tengan lat y lng
        const q = query(
          collection(db, "empresa"),
          where("estado", "==", "aprobado"),
        );
        const snapshot = await getDocs(q);
        const lista = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((emp) => (emp.lat || emp.ubicacion?.lat) && (emp.lng || emp.ubicacion?.lng));
        setLocales(lista);
      } catch (error) {
        console.error("Error al cargar locales para el mapa:", error);
      }
    };

    fetchLocales();
  }, []);

  return (
    <>
      <div className="hero">
        {/* Lado Izquierdo: Información */}
        <div className="hero-content">
          <h1 className="hero-title">
            Descubre las mejores <br />
            <span className="hero-title-accent">promociones para ti</span>
          </h1>
          <p className="hero-subtitle">
            Explora descuentos exclusivos en los negocios más cercanos. Ahorra
            dinero en tiempo real con nuestra red de locales asociados.
          </p>

          <div className="hero-search">
            <input
              type="text"
              placeholder="¿Qué buscas? (Pizza, Ropa, Café...)"
              className="hero-input"
            />
            <button className="hero-search-btn">Buscar Ahora</button>
          </div>
        </div>

        {/* Lado Derecho: Mapa con Pines */}
        <div className="hero-map-wrapper">
          <div className="hero-map-preview">
            <MapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <MapController />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              {locales.map((local) => (
                <Marker
                  key={local.id}
                  position={[
                    Number(local.lat || local.ubicacion?.lat),
                    Number(local.lng || local.ubicacion?.lng)
                  ]}
                >
                  <Popup>
                    <div style={{ textAlign: "center" }}>
                      <strong>{local.negocio}</strong>
                      <br />
                      <span>{local.categoria}</span>
                      <br />
                      <Link
                        to={`/perfil-empresa/${local.id}`}
                        style={{ color: "#fb4c23", fontSize: "12px" }}
                      >
                        Ver Promos
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <Link to="/mapa" className="btn-hero-mapa">
            Ver Mapa Completo
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
