import { Link } from 'react-router-dom';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

const fmtFecha = (ts) => {
  if (!ts) return 'N/A';
  try { return new Date(ts.toDate()).toLocaleDateString(); } catch { return 'N/A'; }
};

const AdminDashboardPage = () => {
  const {
    activeTab, setActiveTab,
    loading,
    solicitudes, empresasAprobadas, pagosPendientes,
    promosRevision, todasPromociones, stats,
    handleLogout,
    handleAprobarEmpresa, handleRechazarEmpresa, handleEliminarEmpresa,
    handleGestionarPromocion, handleEliminarPromocion,
    handleAprobarPago, handleRechazarPago,
  } = useAdminDashboard();

  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administrador</h1>
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
      </div>

      <div className="admin-tabs">
        {[
          { id: 'solicitudes',   label: `Solicitudes (${solicitudes.length})` },
          { id: 'empresas',      label: 'Empresas Aprobadas' },
          { id: 'revisiones',    label: `Revisiones (${promosRevision.length})` },
          { id: 'suscripciones', label: `Suscripciones (${pagosPendientes.length})` },
          { id: 'promociones',   label: 'Promociones' },
          { id: 'estadisticas',  label: 'Estadísticas' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">

        {/* ── SOLICITUDES ── */}
        {activeTab === 'solicitudes' && (
          <div className="solicitudes-section">
            <h2>Solicitudes Pendientes de Aprobación</h2>
            {loading ? <p>Cargando...</p> : solicitudes.length === 0 ? (
              <p className="info-texto">No hay solicitudes pendientes</p>
            ) : (
              <div className="solicitudes-list">
                {solicitudes.map(s => (
                  <div key={s.id} className="solicitud-card">
                    <div className="solicitud-info">
                      <h3>{s.negocio}</h3>
                      <p><strong>Propietario:</strong> {s.nombre}</p>
                      <p><strong>Email:</strong> {s.email}</p>
                      <p><strong>Teléfono:</strong> {s.telefono || 'No proporcionado'}</p>
                      <p><strong>Categoría:</strong> {s.categoria}</p>
                      <p><strong>Dirección:</strong> {s.direccion}</p>
                      <p><strong>RUC:</strong> {s.ruc}</p>
                      <p><strong>Fecha de registro:</strong> {fmtFecha(s.createdAt)}</p>
                    </div>
                    <div className="solicitud-actions">
                      <button onClick={() => handleAprobarEmpresa(s.id)} className="btn-approve">Aprobar</button>
                      <button
                        onClick={() => {
                          const motivo = prompt('¿Motivo del rechazo?');
                          if (motivo) handleRechazarEmpresa(s.id, motivo);
                        }}
                        className="btn-reject"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EMPRESAS APROBADAS ── */}
        {activeTab === 'empresas' && (
          <div className="empresas-section">
            <h2>Empresas Aprobadas</h2>
            {empresasAprobadas.length === 0 ? (
              <p className="info-texto">No hay empresas aprobadas por el momento.</p>
            ) : (
              <div className="solicitudes-list">
                {empresasAprobadas.map(e => (
                  <div key={e.id} className="solicitud-card" style={{ borderLeftColor: '#4CAF50' }}>
                    <div className="solicitud-info">
                      <h3>{e.negocio}</h3>
                      <p><strong>Propietario:</strong> {e.nombre}</p>
                      <p><strong>Email:</strong> {e.email}</p>
                      <p><strong>Teléfono:</strong> {e.telefono || 'No proporcionado'}</p>
                      <p><strong>Categoría:</strong> {e.categoria}</p>
                      <p><strong>Dirección:</strong> {e.direccion}</p>
                      <p><strong>RUC:</strong> {e.ruc}</p>
                      <p><strong>Aprobado desde:</strong> {fmtFecha(e.createdAt)}</p>
                    </div>
                    <div className="solicitud-actions">
                      <Link
                        to={`/empresa/${e.id}`}
                        className="btn-approve"
                        style={{ textDecoration: 'none', textAlign: 'center', backgroundColor: '#2196F3' }}
                      >
                        Perfil
                      </Link>
                      <button onClick={() => handleEliminarEmpresa(e.id)} className="btn-reject">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVISIONES ── */}
        {activeTab === 'revisiones' && (
          <div className="promociones-revision-section">
            <h2>Promociones Pendientes de Revisión</h2>
            {promosRevision.length === 0 ? (
              <p className="info-texto">No hay promociones para revisar</p>
            ) : (
              <div className="solicitudes-list">
                {promosRevision.map(p => (
                  <div key={p.id} className="solicitud-card">
                    <div className="solicitud-info">
                      <h3>{p.titulo}</h3>
                      <p><strong>Empresa:</strong> {p.empresaNombre}</p>
                      <p><strong>Descripción:</strong> {p.descripcion}</p>
                      <p><strong>Descuento:</strong> {p.descuento}%</p>
                    </div>
                    <div className="solicitud-actions">
                      <button onClick={() => handleGestionarPromocion(p.id, 'aprobado')} className="btn-approve">Aprobar</button>
                      <button onClick={() => handleGestionarPromocion(p.id, 'rechazado')} className="btn-reject">Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUSCRIPCIONES ── */}
        {activeTab === 'suscripciones' && (
          <div className="pagos-section">
            <h2>Gestión de Suscripciones y Pagos</h2>
            <p className="info-sub">Revisa los comprobantes de transferencia y aprueba las suscripciones.</p>
            {pagosPendientes.length === 0 ? (
              <p className="info-texto">No hay pagos pendientes de revisión.</p>
            ) : (
              <div className="pagos-list">
                {pagosPendientes.map(pago => (
                  <div key={pago.id} className="pago-card" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0' }}>{pago.empresaNombre}</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>ID: {pago.empresaId}</p>
                      </div>
                      <span style={{ backgroundColor: '#fff3e0', color: '#ef6c00', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Pendiente</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                      <div>
                        <p><strong>Plan solicitado:</strong> {pago.planId}</p>
                        <p><strong>Monto a validar:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>${pago.monto}</span></p>
                        <p><strong>Fecha:</strong> {pago.createdAt?.toDate?.() ? new Date(pago.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ marginBottom: '5px' }}><strong>Comprobante:</strong></p>
                        <a href={pago.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <img src={pago.receiptUrl} alt="Comprobante" style={{ maxWidth: '150px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'zoom-in' }} />
                        </a>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button onClick={() => handleAprobarPago(pago)} className="btn-approve" style={{ flex: 1, padding: '10px', fontWeight: 600 }}>
                        Aprobar y Activar Suscripción
                      </button>
                      <button onClick={() => handleRechazarPago(pago.id)} className="btn-reject" style={{ padding: '10px', fontWeight: 600 }}>
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROMOCIONES ── */}
        {activeTab === 'promociones' && (
          <div className="promociones-admin-section">
            <h2>Gestión Global de Promociones</h2>
            {todasPromociones.length === 0 ? (
              <p className="info-texto">No hay promociones activas.</p>
            ) : (
              <div className="solicitudes-list">
                {todasPromociones.map(p => (
                  <div key={p.id} className="solicitud-card">
                    <div className="solicitud-info">
                      <h3>{p.titulo}</h3>
                      <p><strong>Empresa:</strong> {p.empresaNombre}</p>
                      <p><strong>Descuento:</strong> {p.descuento}%</p>
                      <p><strong>Creada:</strong> {fmtFecha(p.createdAt)}</p>
                    </div>
                    <div className="solicitud-actions">
                      <Link to={`/empresa/${p.empresaId}`} className="btn-approve" style={{ textDecoration: 'none', textAlign: 'center', backgroundColor: '#2196F3' }}>
                        Empresa
                      </Link>
                      <button onClick={() => handleEliminarPromocion(p.id)} className="btn-reject">Borrar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {activeTab === 'estadisticas' && (
          <div className="estadisticas-section">
            <h2>Estadísticas del Sistema</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div className="stat-card" style={{ padding: '20px', background: '#e3f2fd', borderRadius: '12px', textAlign: 'center' }}>
                <h3>Tickets Generados</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{stats.totalTickets}</p>
              </div>
              <div className="stat-card" style={{ padding: '20px', background: '#e8f5e9', borderRadius: '12px', textAlign: 'center' }}>
                <h3>Empresas Totales</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>{stats.totalEmpresas}</p>
              </div>
              <div className="stat-card" style={{ padding: '20px', background: '#fff3e0', borderRadius: '12px', textAlign: 'center' }}>
                <h3>Promociones Activas</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>{stats.totalPromos}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboardPage;
