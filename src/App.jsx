import React, { useState, Suspense } from "react";
import { Routes, Route, Link, NavLink, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy-loaded route components for code splitting
const TextField = React.lazy(() => import("./components/TextField"));
const Locales = React.lazy(() => import("./components/Locales"));
const Mapa = React.lazy(() => import("./components/Mapa"));
const Registro = React.lazy(() => import("./components/Registro"));
const Login = React.lazy(() => import("./components/Login"));
const ClienteDashboard = React.lazy(() => import("./components/ClienteDashboard"));
const EmpresaDashboard = React.lazy(() => import("./components/EmpresaDashboard"));
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));
const GestorPromociones = React.lazy(() => import("./components/GestorPromociones"));
const PerfilEmpresaPublica = React.lazy(() => import("./components/PerfilEmpresaPublica"));

// Static imports for components needed immediately
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NotificationBell from "./components/NotificationBell.jsx";

// Loading fallback component for lazy routes
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <div style={{ fontSize: '1.1rem', color: '#64748b' }}>Cargando...</div>
    </div>
  </div>
);

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, userType } = useAuth();
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

        {user && <NotificationBell />}

        <nav className={`barra ${menuOpen ? "active" : ""}`}>
          <ul>
            <li>
              <NavLink to="/locales" onClick={close}>
                Locales
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
                    Perfil
                  </NavLink>
                </li>
                {userType === 'empresa' && (
                  <li>
                    <NavLink to="/empresa/gestionar-promociones" onClick={close}>
                      Gestionar Promociones
                    </NavLink>
                  </li>
                )}
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/login" onClick={close}>
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
        <Route path="/" element={<Suspense fallback={<LoadingFallback />}><TextField /></Suspense>} />
        <Route path="/locales" element={<Suspense fallback={<LoadingFallback />}><Locales /></Suspense>} />
        <Route path="/mapa" element={<Suspense fallback={<LoadingFallback />}><Mapa /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><Login /></Suspense>} />
        <Route path="/registro" element={<Suspense fallback={<LoadingFallback />}><Registro /></Suspense>} />

        {/* Perfil Público de Empresa */}
        <Route path="/empresa/:empresaId" element={<Suspense fallback={<LoadingFallback />}><PerfilEmpresaPublica /></Suspense>} />

        {/* Rutas Protegidas */}
        <Route 
          path="/cliente/dashboard" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute requiredUserType="cliente">
                <ClienteDashboard />
              </ProtectedRoute>
            </Suspense>
          } 
        />
        
        <Route 
          path="/empresa/dashboard" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute requiredUserType="empresa">
                <EmpresaDashboard />
              </ProtectedRoute>
            </Suspense>
          } 
        />

        <Route
          path="/empresa/gestionar-promociones"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute requiredUserType="empresa">
                <GestorPromociones />
              </ProtectedRoute>
            </Suspense>
          }
        />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute requiredUserType="admin">
                <AdminDashboard />
              </ProtectedRoute>
            </Suspense>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary name="App">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;