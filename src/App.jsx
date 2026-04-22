import { useState } from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import TextField from "./components/TextField.jsx";
import Locales from "./components/Locales.jsx";
import Mapa from "./components/Mapa.jsx";
import Registro from "./components/Registro.jsx";
import Login from "./components/Login.jsx";
//importando los modulos de firebase

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
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
            <li>
              <NavLink to="/registro" onClick={close}>
                Registrarse
              </NavLink>
            </li>
            {user ? (
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
        <Route path="/" element={<TextField />} />
        <Route path="/locales" element={<Locales />} />
        <Route path="/mapa" element={<Mapa />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
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
