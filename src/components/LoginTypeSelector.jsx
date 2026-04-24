// src/components/LoginTypeSelector.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const LoginTypeSelector = () => {
  const [selectedType, setSelectedType] = useState('cliente');
  const navigate = useNavigate();

  const handleContinue = () => navigate(`/login?tipo=${selectedType}`);

  return (
    <div className="lts-page">
      <div className="lts-card">

        {/* Logo / Marca */}
        <div className="lts-brand">
          <span className="lts-brand-icon">📍</span>
          <span className="lts-brand-name">
            Promo<span>Cerca</span>
          </span>
        </div>

        <h1 className="lts-title">¿Cómo deseas ingresar?</h1>
        <p className="lts-subtitle">Selecciona el tipo de cuenta para continuar</p>

        <div className="lts-options">
          <div
            className={`lts-option${selectedType === 'cliente' ? ' active' : ''}`}
            onClick={() => setSelectedType('cliente')}
          >
            <span className="lts-option-icon">👤</span>
            <h3>Cliente</h3>
            <p>Explora y disfruta promociones cerca de ti</p>
          </div>

          <div
            className={`lts-option${selectedType === 'empresa' ? ' active' : ''}`}
            onClick={() => setSelectedType('empresa')}
          >
            <span className="lts-option-icon">🏢</span>
            <h3>Empresa</h3>
            <p>Gestiona tu negocio y atrae más clientes</p>
          </div>
        </div>

        <button onClick={handleContinue} className="lts-continue-btn">
          Continuar →
        </button>

        <p className="lts-register">
          ¿No tienes cuenta?{' '}
          <a href="/registro">Regístrate aquí</a>
        </p>

      </div>
    </div>
  );
};

export default LoginTypeSelector;
