import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fondo from '../assets/fondo.png';
import empresaImg from '../assets/empresa.png';

const TextField = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const normalizarTexto = (texto) => {
    return texto
      .normalize("NFD")                  
      .replace(/[\u0300-\u036f]/g, "")   
      .toLowerCase();                    
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/locales?search=${encodeURIComponent(q)}` : '/locales');
  };

  return (
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
          <button type="submit" className="hero-search-btn" >
            Buscar
          </button>
        </form>

        <div className="hero-btns">
          <button
            className="selectionButton cliente"
            onClick={() => navigate('/locales')}
          >
            <span className="icon">👤</span>
            Soy Cliente
          </button>
          <button
            className="selectionButton empresa"
            onClick={() => navigate('/registro?tipo=empresa')}
          >
            <span className="icon">🏢</span>
            Soy Empresa
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <strong>50+</strong>
            <span>Negocios</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <strong>200+</strong>
            <span>Promociones</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <strong>1,000+</strong>
            <span>Usuarios</span>
          </div>
        </div>        
      </div>
      <div className="hero-img-wrap">
        <img src={empresaImg} alt="Negocios locales" className="hero-img" />
      </div>
    </div>
  );
};

export default TextField;
