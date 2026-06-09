import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ListarPromociones from './ListarPromociones';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/dashboard-pro.css';

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
  if (m < 1)  return 'ahora';
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
  const { user, userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');

  // Data
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [empresasData, setEmpresasData] = useState({});
  const [promosData, setPromosData] = useState({});
  const [stats, setStats] = useState({
    ticketsActivos: 0,
    ticketsCanjeados: 0,
    ahorroEstimado: 0,
    empresasUnicas: 0,
    favoritosCount: 0,
  });
  const [topEmpresa, setTopEmpresa] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('todos');

  // Profile edit
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', telefono: '' });

  useEffect(() => {
    if (userDetails) {
      setFormData({ nombre: userDetails.nombre || '', telefono: userDetails.telefono || '' });
    }
  }, [userDetails]);

  // ── Fetch data ──────────────────────────────────────────
  useEffect(() => {
    if (user) fetchClientData();
  }, [user]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // 1. Tickets del usuario
      const ticketSnap = await getDocs(
        query(collection(db, 'tickets'), where('usuarioId', '==', user.uid))
      );
      const myTickets = ticketSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Favoritos del usuario
      const favSnap = await getDocs(
        query(collection(db, 'favoritos'), where('usuarioId', '==', user.uid))
      );
      const myFavoritos = favSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Recopilar IDs de promos únicas y empresas únicas para enriquecer datos
      const promoIds = [...new Set(myTickets.map(t => t.promocionId).filter(Boolean))];
      const promoMap = {};
      if (promoIds.length > 0) {
        for (let i = 0; i < promoIds.length; i += 30) {
          const chunk = promoIds.slice(i, i + 30);
          const pSnap = await getDocs(
            query(collection(db, 'promociones'), where('__name__', 'in', chunk))
          );
          pSnap.docs.forEach(d => { promoMap[d.id] = { id: d.id, ...d.data() }; });
        }
      }

      // 4. Empresas únicas (de promo.empresaId)
      const empresaIds = [...new Set(
        Object.values(promoMap).map(p => p.empresaId).filter(Boolean)
      )];
      const empMap = {};
      if (empresaIds.length > 0) {
        for (let i = 0; i < empresaIds.length; i += 30) {
          const chunk = empresaIds.slice(i, i + 30);
          const eSnap = await getDocs(
            query(collection(db, 'empresa'), where('__name__', 'in', chunk))
          );
          eSnap.docs.forEach(d => { empMap[d.id] = { id: d.id, ...d.data() }; });
        }
      }

      // 5. Empresas favoritas (tipo 'empresa' en favoritos)
      const favEmpresaIds = [...new Set(
        myFavoritos.filter(f => f.tipo === 'empresa' && f.empresaId).map(f => f.empresaId)
      )];
      if (favEmpresaIds.length > 0) {
        for (let i = 0; i < favEmpresaIds.length; i += 30) {
          const chunk = favEmpresaIds.slice(i, i + 30);
          const eSnap = await getDocs(
            query(collection(db, 'empresa'), where('__name__', 'in', chunk))
          );
          eSnap.docs.forEach(d => { empMap[d.id] = { id: d.id, ...d.data() }; });
        }
      }

      // 6. Promos favoritas
      const favPromoIds = [...new Set(
        myFavoritos.filter(f => f.tipo === 'promocion' && f.promocionId).map(f => f.promocionId)
      )];
      if (favPromoIds.length > 0) {
        for (let i = 0; i < favPromoIds.length; i += 30) {
          const chunk = favPromoIds.slice(i, i + 30);
          const pSnap = await getDocs(
            query(collection(db, 'promociones'), where('__name__', 'in', chunk))
          );
          pSnap.docs.forEach(d => { promoMap[d.id] = { id: d.id, ...d.data() }; });
        }
      }

      // 7. Calcular stats
      const activos   = myTickets.filter(t => t.estado === 'generado').length;
      const canjeados = myTickets.filter(t => t.estado === 'canjeado').length;
      const empresasUnicas = new Set(
        myTickets.map(t => promoMap[t.promocionId]?.empresaId).filter(Boolean)
      ).size;

      // Ahorro estimado = sum of (promo.descuento / 100 * 25) for canjeados
      const ahorroEst = myTickets
        .filter(t => t.estado === 'canjeado')
        .reduce((sum, t) => {
          const desc = Number(promoMap[t.promocionId]?.descuento) || 0;
          return sum + (desc / 100) * 25;
        }, 0);

      // Top empresa (la que aparece más en tickets canjeados)
      const empCount = {};
      myTickets.filter(t => t.estado === 'canjeado').forEach(t => {
        const eId = promoMap[t.promocionId]?.empresaId;
        if (eId) empCount[eId] = (empCount[eId] || 0) + 1;
      });
      const topEmpId = Object.entries(empCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topEmp = topEmpId ? { ...empMap[topEmpId], _count: empCount[topEmpId] } : null;

      // Enrich tickets
      const enriched = myTickets
        .sort((a, b) => {
          const da = toDate(a.fechaGeneracion)?.getTime() || 0;
          const db_ = toDate(b.fechaGeneracion)?.getTime() || 0;
          return db_ - da;
        })
        .map(t => ({
          ...t,
          _promo: promoMap[t.promocionId],
          _empresa: empMap[promoMap[t.promocionId]?.empresaId],
        }));

      // Enrich favoritos
      const enrichedFavs = myFavoritos.map(f => ({
        ...f,
        _promo:   f.tipo === 'promocion' ? promoMap[f.promocionId]  : null,
        _empresa: f.tipo === 'empresa'   ? empMap[f.empresaId]      :
                  f.tipo === 'promocion' ? empMap[promoMap[f.promocionId]?.empresaId] : null,
      }));

      setTickets(enriched);
      setFavoritos(enrichedFavs);
      setEmpresasData(empMap);
      setPromosData(promoMap);
      setTopEmpresa(topEmp);
      setStats({
        ticketsActivos:   activos,
        ticketsCanjeados: canjeados,
        ahorroEstimado:   ahorroEst,
        empresasUnicas,
        favoritosCount:   myFavoritos.length,
      });
    } catch (err) {
      console.error('Error cargando dashboard cliente:', err);
    }
    setLoading(false);
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), {
        nombre: formData.nombre,
        telefono: formData.telefono,
      });
      setEditMode(false);
      window.location.reload();
    } catch {
      alert('Error al guardar los datos.');
    }
    setSaving(false);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t =>
    ticketFilter === 'todos' || t.estado === ticketFilter
  );

  const navItems = [
    { id: 'inicio',     icon: '🏠', label: 'Inicio' },
    { id: 'tickets',    icon: '🎟️', label: 'Mis Tickets' },
    { id: 'favoritos',  icon: '❤️', label: 'Favoritos' },
    { id: 'explorar',   icon: '🔍', label: 'Explorar' },
    { id: 'perfil',     icon: '👤', label: 'Mi Perfil' },
  ];

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="dpro-shell">
      {/* Top bar */}
      <div className="dpro-topbar">
        <div className="dpro-topbar-left">
          <div className="dpro-avatar">👤</div>
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
              <span className="dpro-nav-icon">{item.icon}</span>
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
                  {/* Welcome */}
                  <div style={{ marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f1f5f9' }}>
                      ¡Hola, {userDetails?.nombre?.split(' ')[0] || 'Cliente'}! 👋
                    </h2>
                    <p style={{ color: '#64748b', marginTop: 4, fontSize: '.9rem' }}>
                      Aquí tienes un resumen de tu actividad en Promo Cerca
                    </p>
                  </div>

                  {/* KPIs */}
                  <div className="dpro-kpi-grid">
                    <StatCard icon="🎟️" label="Tickets Activos"   value={stats.ticketsActivos}   color="cyan"   sub="Listos para canjear" />
                    <StatCard icon="✅" label="Tickets Canjeados"  value={stats.ticketsCanjeados}  color="green"  sub="Promos ya usadas" />
                    <StatCard icon="💸" label="Ahorro Estimado"    value={`$${stats.ahorroEstimado.toFixed(0)}`} color="gold" sub="En descuentos canjeados" />
                    <StatCard icon="🏢" label="Empresas Visitadas" value={stats.empresasUnicas}   color="blue"   sub="Locales únicos" />
                  </div>

                  <div className="dpro-kpi-grid">
                    <StatCard icon="❤️" label="Favoritos"         value={stats.favoritosCount}     color="purple" sub="Guardados" />
                    <StatCard icon="📊" label="Total de Tickets"  value={tickets.length}            color="teal"   sub="Histórico" />
                  </div>

                  {/* Top empresa */}
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
                    {/* Últimos tickets */}
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

                    {/* Empresas visitadas */}
                    <div className="dpro-panel">
                      <div className="dpro-panel-title">🏢 Empresas más visitadas</div>
                      {(() => {
                        const empVisits = {};
                        tickets.forEach(t => {
                          const eId = t._empresa?.id;
                          if (eId) {
                            empVisits[eId] = {
                              count: (empVisits[eId]?.count || 0) + 1,
                              data: t._empresa,
                            };
                          }
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
              <div className="dpro-section-title">🎟️ Mis Tickets</div>
              <div className="dpro-filters">
                {[
                  { key: 'todos',    label: `Todos (${tickets.length})` },
                  { key: 'generado', label: `Activos (${tickets.filter(t=>t.estado==='generado').length})` },
                  { key: 'canjeado', label: `Canjeados (${tickets.filter(t=>t.estado==='canjeado').length})` },
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={7}>
                            <div className="dpro-empty">
                              <div className="dpro-empty-icon">🎟️</div>
                              <div className="dpro-empty-text">
                                {ticketFilter === 'generado'
                                  ? 'No tienes tickets activos. ¡Explora promociones!'
                                  : ticketFilter === 'canjeado'
                                  ? 'Aún no has canjeado ningún ticket'
                                  : 'No tienes tickets todavía'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : filteredTickets.map((t, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', color: '#06b6d4', fontSize: '.82rem' }}>
                            {t.codigo || '—'}
                          </td>
                          <td style={{ color: '#e2e8f0' }}>{t._promo?.titulo || '—'}</td>
                          <td style={{ color: '#94a3b8' }}>{t._empresa?.negocio || '—'}</td>
                          <td style={{ color: '#f59e0b', fontWeight: 600 }}>
                            {t._promo?.descuento ? `${t._promo.descuento}%` : '—'}
                          </td>
                          <td><span className={`dpro-chip ${t.estado}`}>{t.estado}</span></td>
                          <td>{fmt(t.fechaGeneracion)}</td>
                          <td>{t.fechaCanjeado ? fmt(t.fechaCanjeado) : <span style={{color:'#334155'}}>—</span>}</td>
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
              <div className="dpro-section-title">❤️ Mis Favoritos</div>
              {loading ? (
                <div className="dpro-loading"><div className="dpro-spinner" /></div>
              ) : favoritos.length === 0 ? (
                <div className="dpro-empty" style={{ minHeight: 300 }}>
                  <div className="dpro-empty-icon">💔</div>
                  <div className="dpro-empty-text">Aún no tienes favoritos guardados</div>
                  
                </div>
              ) : (
                <>
                  {/* Empresas favoritas */}
                  {favoritos.some(f => f.tipo === 'empresa') && (
                    <>
                      <div style={{ color: '#94a3b8', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 12, marginTop: 8 }}>
                        Empresas
                      </div>
                      <div className="dpro-fav-grid" style={{ marginBottom: 28 }}>
                        {favoritos.filter(f => f.tipo === 'empresa').map((f, i) => (
                          <div key={i} className="dpro-fav-card">
                            <div className="dpro-fav-card-header">
                              <div className="dpro-fav-icon">🏢</div>
                              <div>
                                <div className="dpro-fav-name">{f._empresa?.negocio || 'Empresa'}</div>
                                <div className="dpro-fav-meta">{f._empresa?.categoria || ''}</div>
                              </div>
                            </div>
                            {f._empresa?.descripcion && (
                              <div style={{ fontSize: '.82rem', color: '#64748b', lineHeight: 1.4 }}>
                                {f._empresa.descripcion.slice(0, 80)}{f._empresa.descripcion.length > 80 ? '…' : ''}
                              </div>
                            )}
                            <div style={{ fontSize: '.75rem', color: '#334155', marginTop: 8 }}>
                              Guardado el {fmt(f.fechaAgregado)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Promociones favoritas */}
                  {favoritos.some(f => f.tipo === 'promocion') && (
                    <>
                      <div style={{ color: '#94a3b8', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 12 }}>
                        Promociones
                      </div>
                      <div className="dpro-fav-grid">
                        {favoritos.filter(f => f.tipo === 'promocion').map((f, i) => (
                          <div key={i} className="dpro-fav-card">
                            <div className="dpro-fav-card-header">
                              <div className="dpro-fav-icon">📢</div>
                              <div>
                                <div className="dpro-fav-name">{f._promo?.titulo || 'Promoción'}</div>
                                <div className="dpro-fav-meta">{f._empresa?.negocio || ''}</div>
                              </div>
                            </div>
                            {f._promo?.descripcion && (
                              <div style={{ fontSize: '.82rem', color: '#64748b', lineHeight: 1.4 }}>
                                {f._promo.descripcion.slice(0, 80)}{f._promo.descripcion.length > 80 ? '…' : ''}
                              </div>
                            )}
                            {f._promo?.descuento && (
                              <span className="dpro-fav-discount">{f._promo.descuento}% de descuento</span>
                            )}
                            <div style={{ fontSize: '.75rem', color: '#334155', marginTop: 8 }}>
                              Guardado el {fmt(f.fechaAgregado)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ── EXPLORAR ── */}
          {activeTab === 'explorar' && (
            <>
              <div className="dpro-section-title">🔍 Explorar Promociones</div>
              <ListarPromociones />
            </>
          )}

          {/* ── MI PERFIL ── */}
          {activeTab === 'perfil' && (
            <>
              <div className="dpro-section-title">👤 Mi Perfil</div>
              <div className="dpro-profile-card">
                <div className="dpro-profile-banner" />
                <div className="dpro-profile-avatar-wrap">
                  <div className="dpro-profile-avatar">👤</div>
                </div>
                <div className="dpro-profile-body">
                  <div className="dpro-form-grid">
                    <div className="dpro-form-group">
                      <label>Nombre completo</label>
                      {editMode
                        ? <input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Tu nombre" />
                        : <p>{userDetails?.nombre || '—'}</p>}
                    </div>
                    <div className="dpro-form-group">
                      <label>Teléfono</label>
                      {editMode
                        ? <input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g,'')})} maxLength={10} placeholder="0991234567" />
                        : <p>{userDetails?.telefono || '—'}</p>}
                    </div>
                    <div className="dpro-form-group full">
                      <label>Email (no editable)</label>
                      <p>{userDetails?.email || '—'}</p>
                    </div>

                    {/* Estadísticas del perfil */}
                    <div className="dpro-form-group full">
                      <label>Resumen de actividad</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 4 }}>
                        {[
                          { label: 'Tickets totales',  value: tickets.length },
                          { label: 'Canjeados',        value: stats.ticketsCanjeados },
                          { label: 'Ahorro estimado',  value: `$${stats.ahorroEstimado.toFixed(0)}` },
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
                          {saving ? '⏳ Guardando…' : '💾 Guardar cambios'}
                        </button>
                      </>
                    ) : (
                      <button className="dpro-btn primary" onClick={() => setEditMode(true)}>
                        ✏️ Editar perfil
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>{/* /content */}
      </div>
    </div>
  );
};

export default ClienteDashboard;
