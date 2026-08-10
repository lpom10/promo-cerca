import { useClienteDashboard } from '../hooks/useClienteDashboard';
import VisualizarTicket from '../components/VisualizarTicket';
import '../../../shared/ui/dashboard-pro.css';

// ── Helpers ────────────────────────────────────────────────
const toDate = (ts) => {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};
const fmt = (ts) => {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
};
const timeAgo = (ts) => {
  const d = toDate(ts);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  if (h < 24) return `hace ${h}h`;
  return `hace ${days}d`;
};

// ── Sub-components ─────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'blue' }) => (
  <div className={`dpro-kpi-card ${color}`}>
    <div className="dpro-kpi-top">
      <div className="dpro-kpi-icon">{icon}</div>
    </div>
    <div className="dpro-kpi-value">{value}</div>
    <div className="dpro-kpi-label">{label}</div>
    {sub && <div className="dpro-kpi-sub">{sub}</div>}
  </div>
);

// ── Main component ─────────────────────────────────────────
const ClienteDashboard = () => {
  const {
    user, userDetails,
    activeTab, setActiveTab,
    ticketFilter, setTicketFilter,
    selectedTicketToView, setSelectedTicketToView,
    loading, tickets, favoritos, stats, topEmpresa, error,
    filteredTickets,
    editMode, setEditMode,
    saving, formData, setFormData,
    handleLogout, handleSaveProfile,
  } = useClienteDashboard();

  const navItems = [
    { id: 'inicio',    label: 'Inicio' },
    { id: 'tickets',   label: 'Mis Tickets' },
    { id: 'favoritos', label: 'Favoritos' },
    { id: 'perfil',    label: 'Mi Perfil' },
  ];

  return (
    <>
      <div className="dpro-shell">
        {/* Top bar */}
        <div className="dpro-topbar">
          <div className="dpro-topbar-left">
            <div className="dpro-avatar">C</div>
            <div>
              <div className="dpro-topbar-name">{userDetails?.nombre || 'Cliente'}</div>
              <div className="dpro-topbar-role">Mi cuenta</div>
            </div>
          </div>
          <div className="dpro-topbar-right">
            <button className="dpro-logout-btn" onClick={handleLogout}>Salir</button>
          </div>
        </div>

        <div className="dpro-layout">
          {/* Sidebar */}
          <div className="dpro-sidebar">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`dpro-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="dpro-content">

            {/* ── INICIO ── */}
            {activeTab === 'inicio' && (
              <>
                {loading ? (
                  <div className="dpro-loading">
                    <div className="dpro-spinner" />
                    <span>Cargando tu dashboard…</span>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f1f5f9' }}>
                        ¡Hola, {userDetails?.nombre?.split(' ')[0] || 'Cliente'}! 👋
                      </h2>
                      <p style={{ color: '#64748b', marginTop: 4, fontSize: '.9rem' }}>
                        Aquí tienes un resumen de tu actividad en Promo Cerca
                      </p>
                    </div>

                    <div className="dpro-kpi-grid">
                      <StatCard icon="🎟️" label="Tickets Activos"   value={stats.ticketsActivos}   color="cyan"  sub="Listos para canjear" />
                      <StatCard icon="✅" label="Tickets Canjeados"  value={stats.ticketsCanjeados}  color="green" sub="Promos ya usadas" />
                      <StatCard icon="💸" label="Ahorro Acumulado"   value={`$${stats.ahorroEstimado.toFixed(0)}`} color="gold" sub="En descuentos canjeados" />
                      <StatCard icon="🏢" label="Empresas Visitadas" value={stats.empresasUnicas}   color="blue"  sub="Locales únicos" />
                    </div>
                    <div className="dpro-kpi-grid">
                      <StatCard icon="❤️" label="Favoritos"        value={stats.favoritosCount}  color="purple" sub="Guardados" />
                      <StatCard icon="📊" label="Total de Tickets" value={tickets.length}          color="teal"   sub="Histórico" />
                    </div>

                    {error && <div className="dpro-empty"><div className="dpro-empty-text">{error}</div></div>}

                    {topEmpresa && (
                      <>
                        <div className="dpro-section-title">🏆 Tu Empresa Favorita</div>
                        <div className="dpro-top-empresa">
                          <div className="dpro-top-empresa-icon">🏢</div>
                          <div>
                            <div className="dpro-top-empresa-name">{topEmpresa.negocio || 'Empresa'}</div>
                            <div className="dpro-top-empresa-sub">
                              {topEmpresa.categoria || ''}{topEmpresa.direccion ? ` · ${topEmpresa.direccion}` : ''}
                            </div>
                          </div>
                          <div className="dpro-top-empresa-badge">
                            {topEmpresa._count} {topEmpresa._count === 1 ? 'visita' : 'visitas'}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="dpro-row-2">
                      {/* Actividad reciente */}
                      <div className="dpro-panel">
                        <div className="dpro-panel-title">⚡ Actividad Reciente</div>
                        {tickets.length === 0 ? (
                          <div className="dpro-empty">
                            <div className="dpro-empty-icon">🎟️</div>
                            <div className="dpro-empty-text">Aún no tienes tickets. ¡Explora promociones!</div>
                          </div>
                        ) : (
                          <div className="dpro-feed">
                            {tickets.slice(0, 8).map((t, i) => (
                              <div key={i} className="dpro-feed-item">
                                <div className={`dpro-feed-dot ${t.estado}`} />
                                <div className="dpro-feed-text">
                                  {t.estado === 'canjeado'
                                    ? <><strong>Canjeaste</strong> en <strong>{t._empresa?.negocio || 'empresa'}</strong> — {t._promo?.titulo || 'promo'}</>
                                    : <><strong>Generaste</strong> ticket de <strong>{t._promo?.titulo || 'promo'}</strong> en {t._empresa?.negocio || 'empresa'}</>}
                                </div>
                                <span className="dpro-feed-time">{timeAgo(t.fechaGeneracion)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Empresas más visitadas */}
                      <div className="dpro-panel">
                        <div className="dpro-panel-title">🏢 Empresas más visitadas</div>
                        {(() => {
                          const empVisits = {};
                          tickets.forEach(t => {
                            const eId = t._empresa?.id;
                            if (eId) empVisits[eId] = { count: (empVisits[eId]?.count || 0) + 1, data: t._empresa };
                          });
                          const sorted = Object.values(empVisits).sort((a, b) => b.count - a.count).slice(0, 6);
                          const maxCount = sorted[0]?.count || 1;
                          return sorted.length === 0 ? (
                            <div className="dpro-empty">
                              <div className="dpro-empty-icon">🏢</div>
                              <div className="dpro-empty-text">Explora y genera tickets para ver tus visitas</div>
                            </div>
                          ) : (
                            <div className="dpro-barchart">
                              {sorted.map((e, i) => (
                                <div key={i} className="dpro-bar-row">
                                  <span className="dpro-bar-label">{e.data?.negocio || 'Empresa'}</span>
                                  <div className="dpro-bar-track">
                                    <div className="dpro-bar-fill" style={{ width: `${(e.count / maxCount) * 100}%` }} />
                                  </div>
                                  <span className="dpro-bar-value">{e.count}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── MIS TICKETS ── */}
            {activeTab === 'tickets' && (
              <>
                <div className="dpro-section-title">Mis Tickets</div>
                <div className="dpro-filters">
                  {[
                    { key: 'todos',    label: `Todos (${tickets.length})` },
                    { key: 'generado', label: `Activos (${tickets.filter(t => t.estado === 'generado').length})` },
                    { key: 'canjeado', label: `Canjeados (${tickets.filter(t => t.estado === 'canjeado').length})` },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`dpro-filter-btn ${ticketFilter === f.key ? 'active' : ''}`}
                      onClick={() => setTicketFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="dpro-loading"><div className="dpro-spinner" /></div>
                ) : (
                  <div className="dpro-table-wrap">
                    <table className="dpro-table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Promoción</th>
                          <th>Empresa</th>
                          <th>Descuento</th>
                          <th>Estado</th>
                          <th>Generado</th>
                          <th>Canjeado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={8}>
                              <div className="dpro-empty">
                                <div className="dpro-empty-text">
                                  {ticketFilter === 'generado' ? 'No tienes tickets activos'
                                    : ticketFilter === 'canjeado' ? 'Aún no has canjeado ningún ticket'
                                    : 'No tienes tickets todavía'}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : filteredTickets.map((t, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'monospace', color: '#06b6d4', fontSize: '.82rem' }}>{t.codigo || '—'}</td>
                            <td style={{ color: '#000' }}>{t._promo?.titulo || '—'}</td>
                            <td style={{ color: '#000' }}>{t._empresa?.negocio || '—'}</td>
                            <td style={{ color: '#f59e0b', fontWeight: 600 }}>{t._promo?.descuento ? `${t._promo.descuento}%` : '—'}</td>
                            <td><span className={`dpro-chip ${t.estado}`}>{t.estado}</span></td>
                            <td>{fmt(t.fechaGeneracion)}</td>
                            <td>{t.fechaCanjeado ? fmt(t.fechaCanjeado) : <span style={{ color: '#334155' }}>—</span>}</td>
                            <td>
                              <button
                                className="dpro-btn ghost"
                                style={{ fontSize: '.75rem', padding: '4px 10px' }}
                                onClick={() => setSelectedTicketToView(t)}
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── FAVORITOS ── */}
            {activeTab === 'favoritos' && (
              <>
                <div className="dpro-section-title">Favoritos</div>
                {loading ? (
                  <div className="dpro-loading"><div className="dpro-spinner" /></div>
                ) : favoritos.length === 0 ? (
                  <div className="dpro-empty" style={{ minHeight: 300 }}>
                    <div className="dpro-empty-text">No tienes favoritos guardados</div>
                  </div>
                ) : (
                  <>
                    {favoritos.some(f => f.tipo === 'empresa') && (
                      <>
                        <div style={{ color: '#94a3b8', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 12, marginTop: 8 }}>Empresas</div>
                        <div className="dpro-fav-grid" style={{ marginBottom: 28 }}>
                          {favoritos.filter(f => f.tipo === 'empresa').map((f, i) => (
                            <div key={i} className="dpro-fav-card">
                              <div className="dpro-fav-name">{f._empresa?.negocio || 'Empresa'}</div>
                              <div className="dpro-fav-meta">{f._empresa?.categoria || ''}</div>
                              {f._empresa?.descripcion && (
                                <div style={{ fontSize: '.82rem', color: '#64748b', lineHeight: 1.4 }}>
                                  {f._empresa.descripcion.slice(0, 80)}{f._empresa.descripcion.length > 80 ? '…' : ''}
                                </div>
                              )}
                              <div style={{ fontSize: '.75rem', color: '#334155', marginTop: 8 }}>Guardado el {fmt(f.fechaAgregado)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {favoritos.some(f => f.tipo === 'promocion') && (
                      <>
                        <div style={{ color: '#94a3b8', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 12 }}>Promociones</div>
                        <div className="dpro-fav-grid">
                          {favoritos.filter(f => f.tipo === 'promocion').map((f, i) => (
                            <div key={i} className="dpro-fav-card">
                              <div className="dpro-fav-name">{f._promo?.titulo || 'Promoción'}</div>
                              <div className="dpro-fav-meta">{f._empresa?.negocio || ''}</div>
                              {f._promo?.descuento && <span className="dpro-fav-discount">{f._promo.descuento}% de descuento</span>}
                              <div style={{ fontSize: '.75rem', color: '#334155', marginTop: 8 }}>Guardado el {fmt(f.fechaAgregado)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── MI PERFIL ── */}
            {activeTab === 'perfil' && (
              <>
                <div className="dpro-section-title">Mi Perfil</div>
                <div className="dpro-profile-card">
                  <div className="dpro-profile-banner" />
                  <div className="dpro-profile-avatar-wrap">
                    <div className="dpro-profile-avatar">P</div>
                  </div>
                  <div className="dpro-profile-body">
                    <div className="dpro-form-grid">
                      <div className="dpro-form-group">
                        <label>Nombre completo</label>
                        {editMode
                          ? <input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Tu nombre" />
                          : <p>{userDetails?.nombre || '—'}</p>}
                      </div>
                      <div className="dpro-form-group">
                        <label>Teléfono</label>
                        {editMode
                          ? <input value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })} maxLength={10} placeholder="0991234567" />
                          : <p>{userDetails?.telefono || '—'}</p>}
                      </div>
                      <div className="dpro-form-group full">
                        <label>Email (no editable)</label>
                        <p>{userDetails?.email || '—'}</p>
                      </div>
                      <div className="dpro-form-group full">
                        <label>Resumen de actividad</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 4 }}>
                          {[
                            { label: 'Tickets totales', value: tickets.length },
                            { label: 'Canjeados',       value: stats.ticketsCanjeados },
                            { label: 'Ahorro estimado', value: `$${stats.ahorroEstimado.toFixed(0)}` },
                          ].map((s, i) => (
                            <div key={i} style={{ background: 'rgba(6,182,212,.06)', border: '1px solid rgba(6,182,212,.15)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#06b6d4' }}>{s.value}</div>
                              <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="dpro-form-actions">
                      {editMode ? (
                        <>
                          <button className="dpro-btn ghost" onClick={() => setEditMode(false)} disabled={saving}>Cancelar</button>
                          <button className="dpro-btn primary" onClick={handleSaveProfile} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </>
                      ) : (
                        <button className="dpro-btn primary" onClick={() => setEditMode(true)}>Editar perfil</button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {selectedTicketToView && (
        <VisualizarTicket
          ticket={selectedTicketToView}
          promocion={selectedTicketToView._promo}
          onClose={() => setSelectedTicketToView(null)}
        />
      )}
    </>
  );
};

export default ClienteDashboard;