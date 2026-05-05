import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GestorPromociones from './GestorPromociones';
import GestorSuscripcion from './GestorSuscripcion';
import {
  doc, updateDoc, collection, query, where, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import '../styles/dashboard-pro.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

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

const isPromoActive = (promo) => {
  const fin = toDate(promo.fechaFin);
  if (!fin) return false;
  return fin >= new Date();
};

// ── Sub-components ─────────────────────────────────────────
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({ click(e) { setPosition(e.latlng); } });
  return position ? <Marker position={position} /> : null;
};

const StatCard = ({ icon, label, value, sub, color = 'blue', trend }) => (
  <div className={`dpro-kpi-card ${color}`}>
    <div className="dpro-kpi-top">
      <div className="dpro-kpi-icon">{icon}</div>
      {trend !== undefined && (
        <span className={`dpro-kpi-trend ${trend >= 50 ? 'up' : trend >= 20 ? 'flat' : 'down'}`}>
          {trend}%
        </span>
      )}
    </div>
    <div className="dpro-kpi-value">{value}</div>
    <div className="dpro-kpi-label">{label}</div>
    {sub && <div className="dpro-kpi-sub">{sub}</div>}
  </div>
);

const BarChart = ({ items, maxVal, fillClass = '' }) => (
  <div className="dpro-barchart">
    {items.length === 0 && (
      <div className="dpro-empty"><div className="dpro-empty-text">Sin datos aún</div></div>
    )}
    {items.map((item, i) => (
      <div key={i} className="dpro-bar-row">
        <span className="dpro-bar-label" title={item.label}>{item.label}</span>
        <div className="dpro-bar-track">
          <div
            className={`dpro-bar-fill ${fillClass}`}
            style={{ width: maxVal > 0 ? `${(item.value / maxVal) * 100}%` : '0%' }}
          />
        </div>
        <span className="dpro-bar-value">{item.value}</span>
      </div>
    ))}
  </div>
);

// ── Main component ─────────────────────────────────────────
const EmpresaDashboard = () => {
  const { user, userDetails, userStatus, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resumen');

  // Dashboard data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ticketsGenerados: 0,
    ticketsCanjeados: 0,
    clientesUnicos: 0,
    tasaCanje: 0,
    totalVisualizaciones: 0,
    descuentoPromedio: 0,
    ingresosEstimados: 0,
    promocionesActivas: 0,
  });
  const [promociones, setPromociones] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [suscripcion, setSuscripcion] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('todos');
  const [ticketSearch, setTicketSearch] = useState('');

  // Profile edit
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    negocio: '', categoria: '', direccion: '',
    telefono: '', descripcion: '', lat: null, lng: null,
    valorVentaPromedio: 25,
  });

  useEffect(() => {
    if (userDetails) {
      setFormData({
        negocio:            userDetails.negocio       || '',
        categoria:          userDetails.categoria     || '',
        direccion:          userDetails.direccion     || '',
        telefono:           userDetails.telefono      || '',
        descripcion:        userDetails.descripcion   || '',
        lat:                userDetails.lat           || null,
        lng:                userDetails.lng           || null,
        valorVentaPromedio: userDetails.valorVentaPromedio || 25,
      });
    }
  }, [userDetails]);

  // ── Data fetch ──────────────────────────────────────────
  useEffect(() => {
    if (user && userStatus === 'aprobado') fetchDashboardData();
  }, [user, userStatus]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Promociones de esta empresa
      const promoSnap = await getDocs(
        query(collection(db, 'promociones'), where('empresaId', '==', user.uid))
      );
      const promos = promoSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Tickets (batched by promo IDs, Firestore supports up to 30 per 'in')
      let allTickets = [];
      if (promos.length > 0) {
        const ids = promos.map(p => p.id);
        for (let i = 0; i < ids.length; i += 30) {
          const chunk = ids.slice(i, i + 30);
          const snap = await getDocs(
            query(collection(db, 'tickets'), where('promocionId', 'in', chunk))
          );
          allTickets = [...allTickets, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))];
        }
      }

      // 3. Suscripción activa
      const suscSnap = await getDocs(
        query(collection(db, 'suscripciones'),
          where('empresaId', '==', user.uid),
          where('estado', '==', 'activa'))
      );
      const susc = suscSnap.empty
        ? null
        : { id: suscSnap.docs[0].id, ...suscSnap.docs[0].data() };

      // 4. Cálculo de métricas
      const ticketsCanjeados  = allTickets.filter(t => t.estado === 'canjeado').length;
      const ticketsGenerados  = allTickets.length;
      const clientesUnicos    = new Set(allTickets.map(t => t.usuarioId)).size;
      const tasaCanje         = ticketsGenerados > 0
        ? Math.round((ticketsCanjeados / ticketsGenerados) * 100) : 0;
      const totalVistas       = promos.reduce((s, p) => s + (p.visualizaciones || 0), 0);
      const descProm          = promos.length > 0
        ? Math.round(promos.reduce((s, p) => s + (Number(p.descuento) || 0), 0) / promos.length)
        : 0;
      const valorVenta        = userDetails?.valorVentaPromedio || 25;
      const ingresosEst       = ticketsCanjeados * (descProm / 100) * valorVenta;
      const promosActivas     = promos.filter(isPromoActive).length;

      // 5. Datos por promoción (para gráficos)
      const promoMap = promos.map(p => ({
        ...p,
        totalTickets:     allTickets.filter(t => t.promocionId === p.id).length,
        ticketsCanjeados: allTickets.filter(t => t.promocionId === p.id && t.estado === 'canjeado').length,
      })).sort((a, b) => b.totalTickets - a.totalTickets);

      // 6. Actividad reciente (ordenada por fecha)
      const promoById = Object.fromEntries(promos.map(p => [p.id, p]));
      const recent = [...allTickets]
        .sort((a, b) => {
          const da = toDate(a.fechaGeneracion)?.getTime() || 0;
          const db_ = toDate(b.fechaGeneracion)?.getTime() || 0;
          return db_ - da;
        })
        .slice(0, 12)
        .map(t => ({ ...t, _promo: promoById[t.promocionId] }));

      setStats({ ticketsGenerados, ticketsCanjeados, clientesUnicos, tasaCanje,
                 totalVisualizaciones: totalVistas, descuentoPromedio: descProm,
                 ingresosEstimados: ingresosEst, promocionesActivas: promosActivas });
      setPromociones(promoMap);
      setTickets(allTickets.map(t => ({ ...t, _promo: promoById[t.promocionId] })));
      setRecentActivity(recent);
      setSuscripcion(susc);
    } catch (err) {
      console.error('Error cargando dashboard empresa:', err);
    }
    setLoading(false);
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'empresa', user.uid), {
        negocio:            formData.negocio,
        categoria:          formData.categoria,
        direccion:          formData.direccion,
        telefono:           formData.telefono,
        descripcion:        formData.descripcion,
        lat:                formData.lat,
        lng:                formData.lng,
        valorVentaPromedio: Number(formData.valorVentaPromedio) || 25,
      });
      setEditMode(false);
      window.location.reload();
    } catch (err) {
      alert('Error al guardar los datos.');
    }
    setSaving(false);
  };

  // ── Ticket table filtered ──────────────────────────────
  const filteredTickets = tickets.filter(t => {
    const matchEstado  = ticketFilter === 'todos' || t.estado === ticketFilter;
    const matchSearch  = !ticketSearch
      || (t.codigo || '').toLowerCase().includes(ticketSearch.toLowerCase())
      || (t._promo?.titulo || '').toLowerCase().includes(ticketSearch.toLowerCase());
    return matchEstado && matchSearch;
  });

  // ── Subscription info ──────────────────────────────────
  const suscVencimiento = suscripcion ? toDate(suscripcion.fechaVencimiento) : null;
  const suscActiva = suscVencimiento && suscVencimiento >= new Date();
  const diasRestantes = suscVencimiento
    ? Math.max(0, Math.ceil((suscVencimiento - new Date()) / 86400000)) : 0;

  // ── Nav items ──────────────────────────────────────────
  const navItems = [
    { id: 'resumen',     icon: '📊', label: 'Resumen' },
    { id: 'tickets',     icon: '🎟️', label: 'Tickets' },
    { id: 'promociones', icon: '📢', label: 'Promociones' },
    { id: 'suscripcion', icon: '💳', label: 'Suscripción' },
    { id: 'negocio',     icon: '🏪', label: 'Mi Negocio' },
  ];

  const categories = {
    gastronomia:        'Gastronomía',
    moda_accesorios:    'Moda y Accesorios',
    salud_belleza:      'Salud y Belleza',
    tecnologia:         'Tecnología',
    entretenimiento:    'Entretenimiento',
    servicios:          'Servicios',
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="dpro-shell">
      {/* Top bar */}
      <div className="dpro-topbar">
        <div className="dpro-topbar-left">
          <div className="dpro-avatar">🏢</div>
          <div>
            <div className="dpro-topbar-name">{userDetails?.negocio || 'Mi Empresa'}</div>
            <div className="dpro-topbar-role">Panel de Empresa</div>
          </div>
        </div>
        <div className="dpro-topbar-right">
          <span className={`dpro-status-badge ${userStatus}`}>{userStatus}</span>
          <button className="dpro-logout-btn" onClick={handleLogout}>Salir</button>
        </div>
      </div>

      {/* Waiting screen */}
      {userStatus !== 'aprobado' && (
        <div className="dpro-waiting">
          <div className="dpro-waiting-icon">
            {userStatus === 'pendiente' ? '⏳' : '❌'}
          </div>
          <h2>
            {userStatus === 'pendiente' ? 'Solicitud en revisión' : 'Solicitud rechazada'}
          </h2>
          <p>
            {userStatus === 'pendiente'
              ? 'Un administrador revisará tu negocio pronto. Te notificaremos cuando sea aprobada.'
              : `Tu solicitud fue rechazada.${userDetails?.motivoRechazo ? ` Motivo: ${userDetails.motivoRechazo}` : ''}`}
          </p>
          <button className="dpro-btn ghost" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      )}

      {/* Main layout */}
      {userStatus === 'aprobado' && (
        <div className="dpro-layout">
          {/* Sidebar */}
          <div className="dpro-sidebar">
            {navItems.map((item, i) => (
              item.sep
                ? <div key={i} className="dpro-nav-sep" />
                : (
                  <button
                    key={item.id}
                    className={`dpro-nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="dpro-nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                )
            ))}
          </div>

          {/* Content */}
          <div className="dpro-content">

            {/* ── RESUMEN ── */}
            {activeTab === 'resumen' && (
              <>
                {/* Subscription bar */}
                {suscripcion ? (
                  <div className={`dpro-susc-bar ${!suscActiva ? 'expired' : ''}`}>
                    <div>
                      <div className={`dpro-susc-plan ${!suscActiva ? 'expired' : ''}`}>
                        {suscActiva ? `✦ ${suscripcion.plan?.charAt(0).toUpperCase() + suscripcion.plan?.slice(1) || 'Plan Activo'}` : '⚠ Suscripción vencida'}
                      </div>
                      <div className="dpro-susc-detail">
                        {suscActiva
                          ? `Vence el ${fmt(suscripcion.fechaVencimiento)} · ${diasRestantes} días restantes`
                          : `Venció el ${fmt(suscripcion.fechaVencimiento)}`}
                      </div>
                    </div>
                    <div className="dpro-susc-promo-count">
                      {suscripcion.promocionesDisponibles != null
                        ? `Límite: ${suscripcion.promocionesDisponibles} promos`
                        : ''}
                    </div>
                    <button className="dpro-susc-btn" onClick={() => setActiveTab('suscripcion')}>
                      {suscActiva ? 'Ver plan' : 'Renovar'}
                    </button>
                  </div>
                ) : (
                  <div className="dpro-susc-bar expired">
                    <div>
                      <div className="dpro-susc-plan expired">Sin suscripción activa</div>
                      <div className="dpro-susc-detail">Activa un plan para crear promociones</div>
                    </div>
                    <button className="dpro-susc-btn" onClick={() => setActiveTab('suscripcion')}>
                      Ver planes
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="dpro-loading">
                    <div className="dpro-spinner" />
                    <span>Cargando analítica…</span>
                  </div>
                ) : (
                  <>
                    {/* KPIs row 1 */}
                    <div className="dpro-section-title">📈 Métricas principales</div>
                    <div className="dpro-kpi-grid">
                      <StatCard icon="🎟️" label="Tickets Generados"  value={stats.ticketsGenerados}  color="blue"   sub="Total histórico" />
                      <StatCard icon="✅" label="Tickets Canjeados"  value={stats.ticketsCanjeados}  color="green"  sub={`${stats.tasaCanje}% tasa de canje`} trend={stats.tasaCanje} />
                      <StatCard icon="👥" label="Clientes Atraídos"  value={stats.clientesUnicos}    color="cyan"   sub="Personas únicas" />
                      <StatCard icon="💰" label="Impacto Estimado"   value={`$${stats.ingresosEstimados.toFixed(0)}`} color="gold" sub={`A $${userDetails?.valorVentaPromedio||25} prom. por visita`} />
                    </div>

                    {/* KPIs row 2 */}
                    <div className="dpro-kpi-grid">
                      <StatCard icon="👁️" label="Visualizaciones"     value={stats.totalVisualizaciones} color="purple" sub="Vistas en promos" />
                      <StatCard icon="📢" label="Promos Activas"       value={stats.promocionesActivas}   color="orange" sub="En curso ahora" />
                      <StatCard icon="🏷️" label="Descuento Promedio"   value={`${stats.descuentoPromedio}%`}  color="teal"   sub="Ofrecido en promos" />
                      <StatCard icon="📊" label="Tasa de Conversión"   value={`${stats.tasaCanje}%`}           color="red"    sub="Generados → Canjeados" trend={stats.tasaCanje} />
                    </div>

                    {/* Charts row */}
                    <div className="dpro-row-2">
                      {/* Bar: tickets por promo */}
                      <div className="dpro-panel">
                        <div className="dpro-panel-title">🎟️ Tickets por Promoción</div>
                        <BarChart
                          items={promociones.slice(0, 7).map(p => ({ label: p.titulo || 'Sin título', value: p.totalTickets }))}
                          maxVal={Math.max(1, ...promociones.map(p => p.totalTickets))}
                        />
                      </div>
                      {/* Bar: canjeados por promo */}
                      <div className="dpro-panel">
                        <div className="dpro-panel-title">✅ Canjeados por Promoción</div>
                        <BarChart
                          items={promociones.slice(0, 7).map(p => ({ label: p.titulo || 'Sin título', value: p.ticketsCanjeados }))}
                          maxVal={Math.max(1, ...promociones.map(p => p.ticketsCanjeados))}
                          fillClass="green"
                        />
                      </div>
                    </div>

                    {/* Activity + top promos */}
                    <div className="dpro-row-2">
                      {/* Recent activity feed */}
                      <div className="dpro-panel">
                        <div className="dpro-panel-title">⚡ Actividad Reciente</div>
                        {recentActivity.length === 0 ? (
                          <div className="dpro-empty">
                            <div className="dpro-empty-icon">📭</div>
                            <div className="dpro-empty-text">Sin actividad todavía</div>
                          </div>
                        ) : (
                          <div className="dpro-feed">
                            {recentActivity.map((t, i) => (
                              <div key={i} className="dpro-feed-item">
                                <div className={`dpro-feed-dot ${t.estado}`} />
                                <div className="dpro-feed-text">
                                  {t.estado === 'canjeado'
                                    ? <>Un cliente <strong>canjeó</strong> en <strong>{t._promo?.titulo || 'promo'}</strong></>
                                    : <>Un cliente <strong>generó</strong> un ticket de <strong>{t._promo?.titulo || 'promo'}</strong></>}
                                </div>
                                <span className="dpro-feed-time">{timeAgo(t.fechaGeneracion)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Top promos table */}
                      <div className="dpro-panel">
                        <div className="dpro-panel-title">🏆 Ranking de Promociones</div>
                        {promociones.length === 0 ? (
                          <div className="dpro-empty">
                            <div className="dpro-empty-icon">📢</div>
                            <div className="dpro-empty-text">Crea tu primera promoción</div>
                          </div>
                        ) : (
                          <div className="dpro-barchart">
                            {promociones.slice(0, 6).map((p, i) => {
                              const pct = p.totalTickets > 0
                                ? Math.round((p.ticketsCanjeados / p.totalTickets) * 100) : 0;
                              return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 12, borderBottom: i < 5 ? '1px solid #1a2540' : 'none', marginBottom: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '.84rem', color: '#e2e8f0', fontWeight: 600 }}>
                                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`} {p.titulo}
                                    </span>
                                    <span style={{ fontSize: '.78rem', color: '#64748b' }}>
                                      {p.ticketsCanjeados}/{p.totalTickets} · {pct}%
                                    </span>
                                  </div>
                                  <div className="dpro-bar-track">
                                    <div
                                      className="dpro-bar-fill green"
                                      style={{ width: p.totalTickets > 0 ? `${pct}%` : '0%' }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Descuento promedio chart */}
                    <div className="dpro-panel" style={{ marginBottom: 24 }}>
                      <div className="dpro-panel-title">🏷️ Descuento ofrecido por Promoción</div>
                      <BarChart
                        items={promociones.slice(0, 8).map(p => ({
                          label: p.titulo || 'Sin título',
                          value: Number(p.descuento) || 0,
                        }))}
                        maxVal={Math.max(1, ...promociones.map(p => Number(p.descuento) || 0))}
                        fillClass="gold"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── TICKETS ── */}
            {activeTab === 'tickets' && (
              <>
                <div className="dpro-section-title">🎟️ Gestión de Tickets</div>
                <div className="dpro-filters">
                  {['todos', 'generado', 'canjeado'].map(f => (
                    <button
                      key={f}
                      className={`dpro-filter-btn ${ticketFilter === f ? 'active' : ''}`}
                      onClick={() => setTicketFilter(f)}
                    >
                      {f === 'todos' ? `Todos (${tickets.length})` :
                       f === 'generado' ? `Generados (${tickets.filter(t=>t.estado==='generado').length})` :
                       `Canjeados (${tickets.filter(t=>t.estado==='canjeado').length})`}
                    </button>
                  ))}
                  <input
                    className="dpro-search-input"
                    placeholder="Buscar por código o promoción…"
                    value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)}
                  />
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
                          <th>Estado</th>
                          <th>Descuento</th>
                          <th>Generado</th>
                          <th>Canjeado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={6}>
                              <div className="dpro-empty">
                                <div className="dpro-empty-icon">🎟️</div>
                                <div className="dpro-empty-text">No hay tickets con ese filtro</div>
                              </div>
                            </td>
                          </tr>
                        ) : filteredTickets.map((t, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'monospace', color: '#06b6d4', fontSize: '.82rem' }}>
                              {t.codigo || '—'}
                            </td>
                            <td style={{ color: '#e2e8f0' }}>{t._promo?.titulo || '—'}</td>
                            <td><span className={`dpro-chip ${t.estado}`}>{t.estado}</span></td>
                            <td style={{ color: '#f59e0b', fontWeight: 600 }}>
                              {t._promo?.descuento ? `${t._promo.descuento}%` : '—'}
                            </td>
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

            {/* ── PROMOCIONES ── */}
            {activeTab === 'promociones' && (
              <GestorPromociones onNavigateToSuscripcion={() => setActiveTab('suscripcion')} />
            )}

            {/* ── SUSCRIPCIÓN ── */}
            {activeTab === 'suscripcion' && <GestorSuscripcion />}

            {/* ── MI NEGOCIO ── */}
            {activeTab === 'negocio' && (
              <>
                <div className="dpro-section-title">🏪 Perfil del Negocio</div>
                <div className="dpro-profile-card">
                  <div className="dpro-profile-banner" />
                  <div className="dpro-profile-avatar-wrap">
                    <div className="dpro-profile-avatar">🏪</div>
                  </div>
                  <div className="dpro-profile-body">
                    <div className="dpro-form-grid">
                      {/* Nombre */}
                      <div className="dpro-form-group full">
                        <label>Nombre del Negocio</label>
                        {editMode
                          ? <input value={formData.negocio} onChange={e => setFormData({...formData, negocio: e.target.value})} placeholder="Nombre del negocio" />
                          : <p>{userDetails?.negocio || '—'}</p>}
                      </div>
                      {/* Descripción */}
                      <div className="dpro-form-group full">
                        <label>Descripción</label>
                        {editMode
                          ? <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Describe tu negocio…" />
                          : <p>{userDetails?.descripcion || '—'}</p>}
                      </div>
                      {/* Categoría */}
                      <div className="dpro-form-group">
                        <label>Categoría</label>
                        {editMode
                          ? (
                            <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                              {Object.entries(categories).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                          )
                          : <p>{categories[userDetails?.categoria] || userDetails?.categoria || '—'}</p>}
                      </div>
                      {/* Teléfono */}
                      <div className="dpro-form-group">
                        <label>Teléfono</label>
                        {editMode
                          ? <input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g,'')})} maxLength={10} placeholder="0991234567" />
                          : <p>{userDetails?.telefono || '—'}</p>}
                      </div>
                      {/* Dirección */}
                      <div className="dpro-form-group full">
                        <label>Dirección</label>
                        {editMode
                          ? <input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Principal..." />
                          : <p>{userDetails?.direccion || '—'}</p>}
                      </div>
                      {/* Valor promedio de venta */}
                      <div className="dpro-form-group">
                        <label>Valor promedio de venta ($)</label>
                        {editMode
                          ? <input type="number" min={1} value={formData.valorVentaPromedio} onChange={e => setFormData({...formData, valorVentaPromedio: e.target.value})} placeholder="25" />
                          : <p>${userDetails?.valorVentaPromedio || 25}</p>}
                        {editMode && (
                          <span style={{ fontSize: '.75rem', color: '#475569', marginTop: 4 }}>
                            Usado para calcular el impacto estimado en el resumen
                          </span>
                        )}
                      </div>
                      {/* RUC / Email */}
                      <div className="dpro-form-group">
                        <label>RUC</label>
                        <p>{userDetails?.ruc || '—'}</p>
                      </div>
                      <div className="dpro-form-group">
                        <label>Email</label>
                        <p>{userDetails?.email || '—'}</p>
                      </div>
                      {/* Mapa */}
                      <div className="dpro-form-group full">
                        <label>Ubicación en el mapa {editMode && <span style={{color:'#06b6d4',fontSize:'.75rem',marginLeft:6}}>— Haz clic para marcar</span>}</label>
                        <div className="dpro-map-container">
                          <MapContainer
                            center={formData.lat && formData.lng ? [formData.lat, formData.lng] : [-0.18, -78.47]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {editMode
                              ? <LocationMarker
                                  position={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : null}
                                  setPosition={pos => setFormData({...formData, lat: pos.lat, lng: pos.lng})}
                                />
                              : (userDetails?.lat && userDetails?.lng && (
                                  <Marker position={[userDetails.lat, userDetails.lng]} />
                                ))
                            }
                          </MapContainer>
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
                          ✏️ Editar información
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>{/* /content */}
        </div>
      )}{/* /layout */}
    </div>
  );
};

export default EmpresaDashboard;
