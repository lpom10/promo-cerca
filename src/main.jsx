import 'leaflet/dist/leaflet.css';
import './index.css'; // Estilos base (debe ser primero)
import './styles/index.css'; // Variables y utilidades del design system
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { setupSecurityHeaders, setupClickjackingProtection } from './shared/utils/securityHeaders';
import { validateEnvVars } from './shared/utils/environment';
// Importar componentes específicos después de base



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
