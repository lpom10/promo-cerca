import { useState } from "react";
import { Routes, Route, Link, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import TextField from "./components/TextField.jsx";
import Locales from "./components/Locales.jsx";
import Mapa from "./components/Mapa.jsx";
import Registro from "./components/Registro.jsx";
import Login from "./components/Login.jsx";
import LoginTypeSelector from "./components/LoginTypeSelector.jsx";
import ClienteDashboard from "./components/ClienteDashboard.jsx";
import EmpresaDashboard from "./components/EmpresaDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, userType, logout } = useAuth();
  const close = () => setMenuOpen(false);

  return (
    <>
      <div className="navbar">
        <Link to="/" className="titulo" onClick={close}>
          Promo Cerca
        </Link>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span className={`bar ${menuOpen ? "open" : ""}`} />
          <span className={`bar ${menuOpen ? "open" : ""}`} />
          <span className={`bar ${menuOpen ? "open" : ""}`} />
        </button>

        <nav className={`barra ${menuOpen ? "active" : ""}`}>
          <ul>
            <li>
              <NavLink to="/locales" onClick={close}>
                Locales
              </NavLink>
            </li>
            <li>
              <NavLink to="/mapa" onClick={close}>
                Mapa
              </NavLink>
            </li>
            {user ? (
              <>
                <li>
                  <NavLink 
                    to={
                      userType === 'admin' 
                        ? '/admin/dashboard' 
                        : userType === 'empresa' 
                        ? '/empresa/dashboard' 
                        : '/cliente/dashboard'
                    } 
                    onClick={close}
                  >
                    {userType === 'admin' ? '⚙️' : userType === 'empresa' ? '🏢' : '👤'} Dashboard
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={() => {
                      logout();
                      close();
                    }}
                    className="logout-btn"
                  >
                    Cerrar Sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/login-tipo" onClick={close}>
                    Iniciar Sesión
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/registro" onClick={close}>
                    Registrarse
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<TextField />} />
        <Route path="/locales" element={<Locales />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login-tipo" element={<LoginTypeSelector />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas por tipo de usuario */}
        <Route 
          path="/cliente/dashboard" 
          element={
            <ProtectedRoute requiredUserType="cliente">
              <ClienteDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/empresa/dashboard" 
          element={
            <ProtectedRoute requiredUserType="empresa">
              <EmpresaDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredUserType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
