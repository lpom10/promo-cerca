import 'leaflet/dist/leaflet.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { setupSecurityHeaders, setupClickjackingProtection } from './utils/securityHeaders';
import { validateEnvVars } from './utils/environment';
import './index.css';
import './styles/LoginTypeSelector.css';
import './styles/dashboard.css';
import './styles/promociones.css';
import './styles/suscripciones.css';

// Inicializar seguridad
validateEnvVars();
setupSecurityHeaders();
setupClickjackingProtection();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
