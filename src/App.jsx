import React, { useState, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
} from "react-router-dom";

// Lazy-loaded route components for code splitting
const HomePage = React.lazy(() => import("./components/HomePage.jsx"));
const Locales = React.lazy(() => import("./components/Locales.jsx"));
const Mapa = React.lazy(() => import("./components/Mapa.jsx"));
const Registro = React.lazy(() => import("./components/Registro.jsx"));
const Login = React.lazy(() => import("./components/Login.jsx"));
const ClienteDashboard = React.lazy(
  () => import("./components/ClienteDashboard"),
);
const EmpresaDashboard = React.lazy(
  () => import("./components/EmpresaDashboard"),
);
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));
const GestorPromociones = React.lazy(
  () => import("./components/GestorPromociones"),
);
const PerfilEmpresaPublica = React.lazy(
  () => import("./components/PerfilEmpresaPublica"),
);
const CanjeTickets = React.lazy(() => import("./components/CanjeTickets"));

// Static imports for components needed immediately
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NotificationBell from "./components/NotificationBell.jsx";

// Loading fallback component for lazy routes
const LoadingFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#f0f4f8",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
      <div style={{ fontSize: "1.1rem", color: "#64748b" }}>Cargando...</div>
    </div>
  </div>
);

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, userType } = useAuth();
  const close = () => setMenuOpen(false);
  const navigate = useNavigate();

  const handleHashNavigation = (hash) => {
    close();

    if (window.location.pathname === "/") {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else {
      navigate(`/#${hash}`);
    }
  };

  return (
    <>
      <div className="navbar">
        <Link
          to="/"
          className="titulo"
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
            close();
          }}
        >
          Promo Cerca
        </Link>

        <nav className="navbar-links">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/locales">Locales</NavLink>
          <NavLink to="/mapa">Mapa</NavLink>

          <button
            className="nav-link-button"
            onClick={() => handleHashNavigation("contacto")}
          >
            Contacto
          </button>
        </nav>

        <div className="navbar-auth">
          {user && <NotificationBell />}

          {user ? (
            <>
              <NavLink
                to={
                  userType === "admin"
                    ? "/admin/dashboard"
                    : userType === "empresa"
                      ? "/empresa/dashboard"
                      : "/cliente/dashboard"
                }
              >
                Perfil
              </NavLink>

              {userType === "empresa" && (
                <>
                  <NavLink to="/empresa/canjear-tickets">
                    Canjear Tickets
                  </NavLink>

                  <NavLink to="/empresa/gestionar-promociones">
                    Gestionar Promociones
                  </NavLink>
                </>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login">Iniciar Sesión</NavLink>

              <NavLink to="/registro">Registrarse</NavLink>
            </>
          )}
        </div>
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/locales"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Locales />
            </Suspense>
          }
        />
        <Route
          path="/mapa"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Mapa />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/registro"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Registro />
            </Suspense>
          }
        />
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
          path="/empresa/canjear-tickets"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute requiredUserType="empresa">
                <CanjeTickets empresaId={user?.uid} />
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

        {/* Perfil Público de Empresa (al final para no interceptar rutas estáticas) */}
        <Route
          path="/empresa/:empresaId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PerfilEmpresaPublica />
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
