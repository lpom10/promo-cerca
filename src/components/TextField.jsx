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

        
               
      </div>
      <div className="hero-img-wrap">
        <img src={empresaImg} alt="Negocios locales" className="hero-img" />
      </div>
    </div>
  );
};

export default TextField;
