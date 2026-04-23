import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginTypeSelector.css';

const LoginTypeSelector = () => {
  const [selectedType, setSelectedType] = useState('cliente');
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(`/login?tipo=${selectedType}`);
  };

  return (
    <div className="login-type-selector-page">
      <div className="selector-card">
        <h1>Bienvenido a Promo Cerca</h1>
        <p className="subtitle">¿Cómo deseas iniciar sesión?</p>

        <div className="type-options">
          <div
            className={`type-option ${selectedType === 'cliente' ? 'active' : ''}`}
            onClick={() => setSelectedType('cliente')}
          >
            <div className="icon">👤</div>
            <h3>Cliente</h3>
            <p>Busca y disfruta de las mejores promociones cerca de ti</p>
          </div>

          <div
            className={`type-option ${selectedType === 'empresa' ? 'active' : ''}`}
            onClick={() => setSelectedType('empresa')}
          >
            <div className="icon">🏢</div>
            <h3>Empresa/Negocio</h3>
            <p>Gestiona tus promociones y atrae más clientes</p>
          </div>

          <div
            className={`type-option ${selectedType === 'admin' ? 'active' : ''}`}
            onClick={() => setSelectedType('admin')}
          >
            <div className="icon">⚙️</div>
            <h3>Administrador</h3>
            <p>Acceso exclusivo para administradores del sistema</p>
          </div>
        </div>

        <button onClick={handleContinue} className="continue-btn">
          Continuar
        </button>

        <p className="register-link">
          ¿No tienes cuenta? <a href="/registro">Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
};

export default LoginTypeSelector;
