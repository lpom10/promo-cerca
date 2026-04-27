import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Mapa from './Mapa';
import fondo from '../assets/fondo.png';
import empresaImg from '../assets/empresa.png';
import '../styles/homepage.css';

const TextField = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : '/locales');
  };

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
            <div className="mapa-embedded">
              <Mapa />
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

            <Link to="/locales" className="mapa-btn">
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
