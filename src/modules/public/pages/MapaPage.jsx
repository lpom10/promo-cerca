import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { logError } from '../../../shared/utils/errorHandler';
import { LoadingSpinner } from '../../../shared/ui/Spinner/LoadingSpinner';
import "leaflet/dist/leaflet.css";
import '../styles/mapa.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { categorias } from '../../../data/categorias';
import { verificarDisponibilidadTickets, obtenerMensajeDisponibilidad, calcularTiempoRestante, formatearTiempoRestante, registrarVisualizacion, obtenerEmpresasLimitadas, obtenerPromocionesActivasLimitadas } from '../services/promocionesService';
import { crearTicket } from '../../cliente/services/ticketService';
import { useAuth } from '../../../shared/hooks/useAuth';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const getEmoji = (categoriaId) => categorias.find(c => c.id === categoriaId)?.emoji || '🏷️';

const isPromoVencida = (fechaFin) => {
  if (!fechaFin) return false;
  const fecha = fechaFin.toDate ? fechaFin.toDate() : new Date(fechaFin);
  return fecha < new Date();
};

const createEmpresaIcon = ({ count = 1, isCluster = false } = {}) => {
  const badgeClass = isCluster && count > 5 ? 'empresa-marker-badge pulse' : 'empresa-marker-badge';
  const badgeHtml = isCluster ? `<div class="${badgeClass}">${count}</div>` : '';
  const html = `
    <div class="empresa-marker">
      <svg class="empresa-pin-svg" width="48" height="60" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.18"/>
          </filter>
        </defs>
        <path d="M24 0C14 0 6 8 6 18c0 12 18 36 18 36s18-24 18-36C42 8 34 0 24 0z" fill="#2B87FF" filter="url(#pinShadow)"/>
        <circle cx="24" cy="18" r="8" fill="#FFFFFF" opacity="0.98"/>
      </svg>
      ${badgeHtml}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'empresa-marker-div-icon',
    iconSize: [48, 60],
    iconAnchor: [24, 60],
    popupAnchor: [0, -60],
  });
};

const MapaFocus = ({ targetId, markerRefs, locales }) => {
  const map = useMap();
  useEffect(() => {
    if (!targetId) return;
    const local = locales.find((l) => l.empresaId === targetId) || locales.find((l) => l.promociones.some((promo) => promo.id === targetId));
    if (local && local.lat && local.lng) {
      map.setView([Number(local.lat), Number(local.lng)], 17, { animate: true });
      setTimeout(() => markerRefs.current[local.empresaId]?.openPopup(), 400);
    }
  }, [targetId, map, markerRefs, locales]);
  
  // Solución para el bug del mapa cortado cuando carga por primera vez
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);

  return null;
};

const VisibleMarkers = ({ items, markerRefs, setSelected }) => {
  const map = useMap();
  const [clusters, setClusters] = useState([]);
  const moveTimeout = useRef(null);

  const rebuildClusters = () => {
    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const cell = Math.max(0.001, 0.5 / Math.pow(2, Math.max(0, zoom - 3)));

    const buckets = {};
    items.forEach((empresa) => {
      const lat = Number(empresa.lat);
      const lng = Number(empresa.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (!bounds.contains([lat, lng])) return; // only markers inside view
      const keyLat = Math.round(lat / cell) * cell;
      const keyLng = Math.round(lng / cell) * cell;
      const key = `${keyLat}_${keyLng}`;
      if (!buckets[key]) buckets[key] = { lat: keyLat, lng: keyLng, empresas: [] };
      buckets[key].empresas.push(empresa);
    });

    const arr = Object.values(buckets).map((b) => ({
      lat: b.lat,
      lng: b.lng,
      empresas: b.empresas,
      count: b.empresas.reduce((s, e) => s + (e.promoCount || 0), 0),
    }));
    setClusters(arr);
  };

  useEffect(() => {
    rebuildClusters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useMapEvents({
    moveend: () => {
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => rebuildClusters(), 150);
    },
    zoomend: () => {
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => rebuildClusters(), 150);
    }
  });

  return clusters.map((cluster, i) => {
    const isCluster = cluster.empresas.length > 1 || cluster.count > 1;
    const firstEmpresa = cluster.empresas[0];
    const primaryPromo = firstEmpresa && firstEmpresa.promociones && firstEmpresa.promociones[0];
    return (
      <Marker
        key={`cluster-${i}-${cluster.lat}-${cluster.lng}`}
        position={[cluster.lat, cluster.lng]}
        icon={createEmpresaIcon({ count: cluster.count, isCluster })}
        ref={(ref) => { if (ref && firstEmpresa) markerRefs.current[firstEmpresa.empresaId] = ref; }}
        eventHandlers={{ click: () => setSelected({ empresa: firstEmpresa, promo: primaryPromo }) }}
      >
        <Tooltip direction="top" offset={[0, -50]} opacity={1}>
          <div style={{ width: isCluster ? 300 : 220 }}>
            {isCluster ? (
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{cluster.count} promociones en este punto</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {cluster.empresas.slice(0, 4).flatMap(e => e.promociones.slice(0, 2)).slice(0, 6).map((promo) => (
                    <div key={promo.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {promo.imagen ? <img src={promo.imagen} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} loading="lazy"/> : <div style={{ width: 40, height: 40, background: '#e2e8f0', borderRadius: 6 }} />}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{promo.titulo}</div>
                        <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <span>-{promo.descuento}%</span>
                          {promo.precioOriginal && <span style={{ textDecoration: 'line-through', fontSize: '10px' }}>${promo.precioOriginal}</span>}
                          {promo.precioDescuento && <span style={{ fontWeight: 'bold', color: '#2B87FF' }}>${promo.precioDescuento}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {primaryPromo?.imagen ? <img src={primaryPromo.imagen} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} loading="lazy"/> : <div style={{ width: 56, height: 56, background: '#eef2ff', borderRadius: 8, display:'flex', alignItems:'center', justifyContent:'center' }}>{getEmoji(firstEmpresa?.categoria)}</div>}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {firstEmpresa.empresaNombre}
                    {primaryPromo?.precioDescuento && <span style={{ fontSize: '12px', color: '#2B87FF', marginLeft: '8px' }}>${primaryPromo.precioDescuento}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{primaryPromo?.titulo || 'Promoción'}</div>
                </div>
              </div>
            )}
          </div>
        </Tooltip>
      </Marker>
    );
  });
};

const Mapa = () => {
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const navigate = useNavigate();
  const [catActiva, setCatActiva] = useState('todos');
  const [search, setSearch] = useState('');
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const markerRefs = useRef({});
  const [selected, setSelected] = useState(null); // { empresa, promo }
  const [expandedPromo, setExpandedPromo] = useState(null);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState(null);
  const { user, userType, userDetails } = useAuth();

  const empresas = useMemo(() => {
    const empresasMap = {};

    locales.forEach((promo) => {
      if (promo.activa === false) return;
      
      const key = promo.empresaId || promo.id;
      if (!empresasMap[key]) {
        empresasMap[key] = {
          empresaId: key,
          empresaNombre: promo.empresaNombre || promo.empresa || 'Empresa',
          lat: promo.lat,
          lng: promo.lng,
          direccion: promo.direccion,
          categoria: promo.categoria,
          promociones: [],
        };
      }

      // Prefer promo coordinates: if a promo has coords, set/override empresa lat/lng
      if ((promo.lat !== undefined && promo.lat !== null) && (promo.lng !== undefined && promo.lng !== null)) {
        empresasMap[key].lat = promo.lat;
        empresasMap[key].lng = promo.lng;
      }

      empresasMap[key].promociones.push(promo);
    });

    return Object.values(empresasMap).map((empresa) => ({
      ...empresa,
      promoCount: empresa.promociones.length,
    }));
  }, [locales]);

  useEffect(() => {
    const cargarLocales = async () => {
      try {
        setLoading(true);
        // Intentar servir desde cache de sesión si es reciente
        const cacheKey = 'mapa_locales_v1';
        const cacheRaw = sessionStorage.getItem(cacheKey);
        if (cacheRaw) {
          try {
            const parsed = JSON.parse(cacheRaw);
            const age = Date.now() - (parsed._ts || 0);
            if (age < 1000 * 60 * 5 && parsed.locales) { // cache 5 minutos
              setLocales(parsed.locales);
              setLoading(false);
              return;
            }
          } catch (_) { /* ignore parse errors */ }
        }

        // Traemos empresas y promociones sin filtros de ordenamiento que oculten datos
        const [empresasDocs, promosDocs] = await Promise.all([
          obtenerEmpresasLimitadas(30),
          obtenerPromocionesActivasLimitadas(30),
        ]);

        const empresasMap = {};
        empresasDocs.forEach((empresa) => { 
          empresasMap[empresa.id] = empresa; 
        });

        // Convertimos Timestamps y ordenamos en memoria para evitar problemas de índices
        const sortedPromosDocs = promosDocs.map(data => ({ id: data.id, ...data }));
        sortedPromosDocs.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
          return dateB - dateA;
        });

        const promos = sortedPromosDocs.map(data => {
          const e = data.empresaId ? empresasMap[data.empresaId] : null;
          
          const rawLat = data.lat !== undefined && data.lat !== null ? data.lat : e?.lat;
          const rawLng = data.lng !== undefined && data.lng !== null ? data.lng : e?.lng;
          const lat = rawLat !== undefined && rawLat !== null && rawLat !== '' ? Number(rawLat) : undefined;
          const lng = rawLng !== undefined && rawLng !== null && rawLng !== '' ? Number(rawLng) : undefined;
          
          return {
            ...data,
            empresaNombre: data.empresaNombre || e?.nombre || e?.empresaNombre || 'Empresa',
            lat,
            lng,
            direccion: data.direccion || e?.direccion,
          };
        });

        // --- MEJORA: Incluir empresas que no tienen promociones para que siempre haya pines ---
        const empresasSinPromos = [];
        Object.values(empresasMap).forEach(emp => {
          const tienePromo = promos.some(p => p.empresaId === emp.id);
          if (!tienePromo && emp.lat && emp.lng) {
            empresasSinPromos.push({
              id: `empty-${emp.id}`,
              empresaId: emp.id,
              empresaNombre: emp.negocio || emp.nombre || 'Negocio',
              lat: Number(emp.lat),
              lng: Number(emp.lng),
              categoria: emp.categoria,
              activa: true,
              titulo: 'Sin promociones actuales',
              descripcion: 'Visita este local para conocer sus ofertas.',
              isEmpty: true
            });
          }
        });

        const result = [...promos, ...empresasSinPromos];
        setLocales(result);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ _ts: Date.now(), locales: result })); } catch (_) { /* ignore storage errors */ }
      } catch (error) {
        logError(error, { accion: 'cargarLocales', componente: 'Mapa' });
      } finally {
        setLoading(false);
      }
    };
    
    cargarLocales();
  }, []);

  // PARA EL MAPA: todas las empresas activas (sin filtro de disponibilidad)
  const empresasParaMapa = empresas.filter((empresa) => {
    const matchCat = catActiva === 'todos' || empresa.promociones.some((promo) => promo.categoria === catActiva);
    const searchLower = search.toLowerCase();
    const matchSearch = !searchLower || empresa.empresaNombre?.toLowerCase().includes(searchLower) || empresa.promociones.some((promo) => promo.titulo?.toLowerCase().includes(searchLower));
    return matchCat && matchSearch;
  });

  // PARA EL SIDEBAR: solo promociones disponibles
  const promocionesFiltradas = locales.filter((promo) => {
    if (promo.activa === false) return false;
    if (!verificarDisponibilidadTickets(promo).disponible) return false;

    const matchCat = catActiva === 'todos' || promo.categoria === catActiva;
    const searchLower = search.toLowerCase();
    const matchSearch = !searchLower || 
      promo.empresaNombre?.toLowerCase().includes(searchLower) || 
      promo.titulo?.toLowerCase().includes(searchLower);
    
    return matchCat && matchSearch;
  });

  const totalPromos = promocionesFiltradas.length;

  const closeOverlay = () => setSelected(null);

  const handleGenerateTicket = async (promo) => {
    setTicketError(null);
    if (!user) {
      setTicketError('Debes iniciar sesión para obtener un ticket.');
      return;
    }
    if (userType !== 'cliente') {
      setTicketError('Solo usuarios clientes pueden obtener tickets.');
      return;
    }
    try {
      setTicketLoading(true);
      try { await registrarVisualizacion(promo.id, selected.empresa.empresaId, user.uid); } catch (e) { /* ignore */ }
      const ticket = await crearTicket(user.uid, promo.id, selected.empresa.empresaId, undefined, userDetails);
      setGeneratedTicket(ticket);
    } catch (err) {
      logError(err, { accion: 'crearTicket', componente: 'Mapa' });
      setTicketError(err?.message || 'Error al generar ticket');
    } finally {
      setTicketLoading(false);
    }
  };

  // reset ephemeral overlay state when selection changes
  useEffect(() => {
    setExpandedPromo(null);
    setGeneratedTicket(null);
    setTicketError(null);
    setTicketLoading(false);
  }, [selected]);
  return (
    <div className="mapa-page">
      <div className="mapa-wrapper">
      <aside className="mapa-sidebar">
        <div className="mapa-sidebar-header">
          <h2 className="mapa-sidebar-titulo">Emprendimientos cercanos <span className="mapa-count">({empresasParaMapa.length})</span></h2>
          <div className="mapa-header-stats">Mostrando <strong>{empresasParaMapa.length}</strong> negocios · <strong>{totalPromos}</strong> promociones</div>
        </div>
        <div className="mapa-sidebar-card">
          <div className="mapa-card-controls">
            <input
              type="text"
              className="mapa-search"
              placeholder="Buscar promocion"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
          </div>
          <div className="mapa-cats">
            {categorias.slice(0, 4).map((c) => (
              <button
                key={c.id}
                className={`mapa-cat-btn ${catActiva === c.id ? 'active' : ''}`}
                onClick={() => setCatActiva(c.id)}
                title={c.label}
              >
                {c.emoji}
              </button>
            ))}
            {categorias.slice(4).map((c) => (
              <button
                key={c.id}
                className={`mapa-cat-btn ${catActiva === c.id ? 'active' : ''}`}
                onClick={() => setCatActiva(c.id)}
                title={c.label}
              >
                {c.emoji}
              </button>
            ))}
          </div>
          <div className="mapa-lista">
          {promocionesFiltradas.length === 0 && (
            <p className="mapa-sin-resultados">Sin resultados</p>
          )}
          {promocionesFiltradas.slice(0, visibleCount).map((promo) => {
            const fechaExp = promo.fechaHoraExpiracion || promo.fechaFin;
            const tiempoRest = fechaExp ? calcularTiempoRestante(fechaExp) : null;
            const textoTiempo = tiempoRest ? formatearTiempoRestante(tiempoRest) : null;
            const disp = verificarDisponibilidadTickets(promo);
            const disponibilidadMensaje = obtenerMensajeDisponibilidad(disp);
            
            // Buscar la empresa correspondiente para las coordenadas
            const empresa = empresas.find(e => e.empresaId === promo.empresaId);

            return (
              <div
                key={promo.id}
                className={`mapa-item ${targetId === promo.id ? 'active' : ''}`}
                onClick={() => {
                  if (empresa && markerRefs.current[empresa.empresaId]) {
                    const map = markerRefs.current[empresa.empresaId]._map;
                    if (map) map.setView([Number(empresa.lat), Number(empresa.lng)], 17, { animate: true });
                    markerRefs.current[empresa.empresaId].openPopup();
                    setSelected({ empresa, promo });
                  } else {
                    navigate(`/locales?search=${encodeURIComponent(promo.empresaNombre)}`);
                  }
                }}
              >
                <div className="mapa-item-img">
                  {promo.imagen ? <img src={promo.imagen} alt="" loading="lazy" /> : <span className="mapa-item-emoji">{getEmoji(promo.categoria)}</span>}
                </div>
                <div className="mapa-item-info">
                  <strong>{promo.empresaNombre}</strong>
                  <div className="mapa-item-title" style={{fontSize:13,color:'#06b6d4',fontWeight:600,marginTop:4}}>{promo.titulo}</div>
                  <div className="mapa-item-meta">
                    {fechaExp && <span className="mapa-item-exp">Vence en: {textoTiempo}</span>}
                    <span className={`mapa-item-availability ${disp.disponible ? 'available' : 'unavailable'}`}>{disponibilidadMensaje}</span>
                  </div>
                </div>
                <span className="mapa-item-badge">-{promo.descuento}%</span>
              </div>
            );
          })}
          {promocionesFiltradas.length > visibleCount && (
            <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>
              <button className="mapa-more-btn" onClick={() => setVisibleCount((v) => v + 6)}>Mostrar más</button>
            </div>
          )}
          </div>
        </div>
      </aside>

      <div className="mapa-container">
        {loading ? (
          <LoadingSpinner message="Cargando mapa..." />
        ) : (
          <MapContainer
            center={[-4.007, -79.211]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">Carto</a> contributors'
            />

            <MapaFocus targetId={targetId} markerRefs={markerRefs} locales={empresas} />

            <VisibleMarkers items={empresasParaMapa} markerRefs={markerRefs} setSelected={setSelected} />
          </MapContainer>
        )}
        {selected && (
          <div className="promo-overlay" onClick={closeOverlay}>
            <div className="promo-overlay-card" onClick={(e) => e.stopPropagation()}>
              <button className="promo-overlay-close" onClick={closeOverlay}>✕</button>
              <div className="promo-overlay-hero">
                {selected.promo?.imagen ? (
                  <img src={selected.promo.imagen} alt="" />
                ) : (
                  <div className="promo-overlay-placeholder">{getEmoji(selected.empresa.categoria)}</div>
                )}
              </div>
              <div className="promo-overlay-body">
                <h2 className="promo-overlay-title">{selected.promo?.titulo || selected.empresa.empresaNombre}</h2>
                <div className="promo-overlay-sub">{selected.empresa.empresaNombre} • {selected.empresa.direccion || ''}</div>
                <div className="promo-overlay-badges">
                  <span className="badge categoria">{categorias.find(c => c.id === selected.empresa.categoria)?.label || 'Comercio'}</span>
                  <span className="badge promos-count">{selected.empresa.promociones?.length || 0} promociones</span>
                </div>

                {(selected.promo?.precioOriginal || selected.promo?.precioDescuento) && (
                  <div style={{ margin: '10px 0', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    {selected.promo?.precioOriginal && <span style={{ fontSize: '1rem', color: '#64748b', textDecoration: 'line-through' }}>${selected.promo.precioOriginal}</span>}
                    {selected.promo?.precioDescuento && <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2B87FF' }}>${selected.promo.precioDescuento}</span>}
                    <span className="badge-activo" style={{ background: '#ecfdf5', color: '#059669', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>Ahorras {selected.promo.descuento}%</span>
                  </div>
                )}

                <p className="promo-overlay-desc">{selected.promo?.descripcion || selected.promo?.titulo}</p>

                {/* Expanded promo detail (shows when user clicks Ver perfil) */}
                {expandedPromo && expandedPromo.id === selected.promo?.id && (
                  <div className="promo-overlay-detailed">
                    <h3>Detalle de la promoción</h3>
                    <div style={{ color:'#475569', fontSize:14, marginBottom:8 }}>{expandedPromo.descripcion || expandedPromo.titulo}</div>
                    {expandedPromo.fechaFin && <div style={{ fontSize:13, color:'#64748b' }}>Válido hasta: {expandedPromo.fechaFin.toDate ? expandedPromo.fechaFin.toDate().toLocaleString() : String(expandedPromo.fechaFin)}</div>}
                    <div style={{ marginTop:12 }}>
                      {generatedTicket ? (
                        <div className="generated-ticket">
                          <div className="ticket-code">Código: <strong>{generatedTicket.codigo || generatedTicket.code || generatedTicket.id}</strong></div>
                          <button className="btn-secondary" onClick={() => { navigator.clipboard?.writeText(generatedTicket.codigo || generatedTicket.code || generatedTicket.id); }}>Copiar código</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <button className="btn-primary" onClick={() => handleGenerateTicket(expandedPromo)} disabled={ticketLoading}>{ticketLoading ? 'Generando...' : 'Obtener ticket'}</button>
                          {ticketError && <div style={{ color:'#dc2626', fontSize:13 }}>{ticketError}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="promo-overlay-others">
                  <h4>Otras promociones</h4>
                  <div className="promo-overlay-others-list">
                    {selected.empresa.promociones?.filter(p => p.id !== (selected.promo && selected.promo.id)).map(p => (
                      <div key={p.id} className="promo-mini">
                        {p.imagen ? <img src={p.imagen} alt=""/> : <div className="mini-emoji">{getEmoji(p.categoria)}</div>}
                        <div className="mini-info">
                          <div className="mini-title">{p.titulo}</div>
                          <div className="mini-meta">-{p.descuento ?? 0}%</div>
                        </div>
                      </div>
                    ))}
                    {!selected.empresa.promociones?.length && <div className="empty">No hay otras promociones</div>}
                  </div>
                </div>

                <div className="promo-overlay-actions">
                  <button className="btn-secondary" onClick={() => { navigate(`/locales?search=${encodeURIComponent(selected.empresa.empresaNombre)}`); }}>Ver en la lista</button>
                  {!expandedPromo || expandedPromo.id !== selected.promo?.id ? (
                    <button className="btn-primary" onClick={() => { setExpandedPromo(selected.promo); }}>Ver perfil</button>
                  ) : (
                    <button className="btn-primary" onClick={() => { setExpandedPromo(null); }}>Cerrar detalle</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Mapa;