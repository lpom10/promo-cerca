import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { useEmpresaDashboard } from '../hooks';
import PerfilEmpresa from "../components/PerfilEmpresa/PerfilEmpresa";
import GestorSuscripcion from "../components/GestorSuscripcion/GestorSuscripcion";
import { Spinner, ErrorBoundary } from "../../../shared/ui";
import '../../../shared/ui/dashboard-pro.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const TABS = [
  { id: 'resumen',      icon: '📊', label: 'Resumen' },
  { id: 'tickets',      icon: '🎟️', label: 'Tickets' },
  { id: 'promociones',  icon: '🏷️', label: 'Promociones' },
  { id: 'suscripcion',  icon: '💳', label: 'Suscripción' },
  { id: 'negocio',      icon: '🏢', label: 'Mi Negocio' },
];

const EmpresaDashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { perfil, suscripcion, estadisticas, finanzas, promociones, loading, error } = useEmpresaDashboard();
  const [activeTab, setActiveTab] = useState('resumen');

  if (loading) return <Spinner fullScreen />;
  if (error) return <div className="dpro-waiting"><p>{error}</p></div>;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <ErrorBoundary name="EmpresaDashboard">
      <div className="dpro-shell">

        {/* ── Topbar ── */}
        <div className="dpro-topbar">
          <div className="dpro-topbar-left">
            <div className="dpro-avatar">E</div>
            <div>
              <div className="dpro-topbar-name">{perfil?.negocio || 'Mi Empresa'}</div>
              <div className="dpro-topbar-role">Panel de Empresa</div>
            </div>
          </div>
          <div className="dpro-topbar-right">
            {perfil?.estado && (
              <span className={`dpro-status-badge ${perfil.estado}`}>
                {perfil.estado === 'aprobado' ? '✓ Aprobado' : '⏳ Pendiente'}
              </span>
            )}
            <button className="dpro-logout-btn" onClick={handleLogout}>Salir</button>
          </div>
        </div>

        {/* ── Layout: Sidebar + Content ── */}
        <div className="dpro-layout">

          {/* Sidebar */}
          <aside className="dpro-sidebar">
            {TABS.map((tab, i) => (
              <>
                {i === TABS.length - 1 && <div key="sep" className="dpro-nav-sep" />}
                <button
                  key={tab.id}
                  className={`dpro-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="dpro-nav-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              </>
            ))}
          </aside>

          {/* Main content */}
          <main className="dpro-content">

            {activeTab === 'resumen' && (
              <>
                <h2 className="dpro-section-title">📊 Resumen de tu negocio</h2>
                {estadisticas ? (
                  <>
                    <div className="dpro-kpi-grid">
                      <div className="dpro-kpi-card blue">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">🏷️</div>
                        </div>
                        <div className="dpro-kpi-value">{estadisticas.promosActivas ?? 0}</div>
                        <div className="dpro-kpi-label">Promociones activas</div>
                      </div>
                      <div className="dpro-kpi-card gold">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">👁️</div>
                        </div>
                        <div className="dpro-kpi-value">{estadisticas.vistasTotal ?? 0}</div>
                        <div className="dpro-kpi-label">Vistas totales</div>
                      </div>
                      <div className="dpro-kpi-card green">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">🎟️</div>
                        </div>
                        <div className="dpro-kpi-value">{finanzas?.ticketsGenerados ?? 0}</div>
                        <div className="dpro-kpi-label">Tickets generados</div>
                      </div>
                      <div className="dpro-kpi-card cyan">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">✅</div>
                        </div>
                        <div className="dpro-kpi-value">{finanzas?.ticketsCanjeados ?? 0}</div>
                        <div className="dpro-kpi-label">Tickets canjeados</div>
                      </div>
                    </div>

                    <h3 className="dpro-section-title" style={{ marginTop: '8px' }}>💰 Impacto financiero real</h3>
                    <div className="dpro-kpi-grid">
                      <div className="dpro-kpi-card orange">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">💵</div>
                        </div>
                        <div className="dpro-kpi-value">{formatCurrency(finanzas?.valorPromocionalEstimado)}</div>
                        <div className="dpro-kpi-label">Ingreso estimado</div>
                      </div>
                      <div className="dpro-kpi-card purple">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">📈</div>
                        </div>
                        <div className="dpro-kpi-value">{formatCurrency(finanzas?.ahorroEstimado)}</div>
                        <div className="dpro-kpi-label">Ahorro para clientes</div>
                      </div>
                      <div className="dpro-kpi-card teal">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">📉</div>
                        </div>
                        <div className="dpro-kpi-value">{finanzas?.tasaCanjeamiento ?? 0}%</div>
                        <div className="dpro-kpi-label">Tasa de canje</div>
                      </div>
                      <div className="dpro-kpi-card red">
                        <div className="dpro-kpi-top">
                          <div className="dpro-kpi-icon">🎯</div>
                        </div>
                        <div className="dpro-kpi-value">{finanzas?.promedioDescuento ?? 0}%</div>
                        <div className="dpro-kpi-label">Descuento promedio</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="dpro-empty">
                    <div className="dpro-empty-icon">📊</div>
                    <div className="dpro-empty-text">Sin estadísticas aún</div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'tickets' && (
              <>
                <h2 className="dpro-section-title">🎟️ Gestión de Tickets</h2>
                <div className="dpro-empty">
                  <div className="dpro-empty-icon">🎟️</div>
                  <div className="dpro-empty-text">Módulo de tickets en construcción</div>
                </div>
              </>
            )}

            {activeTab === 'promociones' && (
              <>
                <h2 className="dpro-section-title">🏷️ Tus Promociones</h2>
                {promociones && promociones.length > 0 ? (
                  <div className="dpro-table-wrap">
                    <table className="dpro-table">
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Descripción</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promociones.map(promo => (
                          <tr key={promo.id}>
                            <td>{promo.titulo}</td>
                            <td>{promo.descripcion}</td>
                            <td>
                              <span className={`dpro-chip ${promo.estado || 'generado'}`}>
                                {promo.estado || 'activa'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="dpro-empty">
                    <div className="dpro-empty-icon">🏷️</div>
                    <div className="dpro-empty-text">No tienes promociones activas</div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'suscripcion' && (
              <>
                <h2 className="dpro-section-title">💳 Suscripción</h2>
                <GestorSuscripcion suscripcion={suscripcion} />
              </>
            )}

            {activeTab === 'negocio' && (
              <PerfilEmpresa perfil={perfil} onSave={() => {}} />
            )}

          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EmpresaDashboardPage;