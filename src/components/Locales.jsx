import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { categorias } from '../data/categorias';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const TicketModal = ({ local, onClose }) => {
  const codigo = `PROMO-${local.id}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const catEmoji = categorias.find(c => c.id === local.categoria)?.emoji || '🏷️';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="ticket-header">
          <span className="ticket-emoji">{catEmoji}</span>
          <h2>{local.empresaNombre || 'Negocio'}</h2>
        </div>
        <div className="ticket-promo">{local.titulo}</div>
        <div className="ticket-codigo">
          <span className="ticket-codigo-label">Codigo de canje</span>
          <span className="ticket-codigo-valor">{codigo}</span>
        </div>
        <p className="ticket-instruccion">
          Muestra este código en el establecimiento para obtener tu descuento del {local.descuento}%.
        </p>
        <div className="ticket-meta">
          <span>🗓️ Válido hasta: {local.fechaFin?.toDate ? new Date(local.fechaFin.toDate()).toLocaleDateString() : ''}</span>
        </div>
        <button className="ticket-copiar" onClick={() => navigator.clipboard?.writeText(codigo)}>
          📋 Copiar código
        </button>
        <Link to={`/PerfilEmpresas?id=${local.empresaId}`} className="perfil-empresa-btn">
          Ver perfil de la empresa
        </Link>
      </div>
    </div>
  );
};

const LocalCard = ({ local, onTicket }) => {
  const catEmoji = categorias.find(c => c.id === local.categoria)?.emoji || '🏷️';
  const catLabel = categorias.find(c => c.id === local.categoria)?.label || 'Promoción';
  const color = '#06b6d4';
  const fechaFinStr = local.fechaFin?.toDate ? new Date(local.fechaFin.toDate()).toLocaleDateString() : '';

  return (
    <div className="local-card">
      <div className="local-card-top" style={{ background: color + '22', borderBottom: `3px solid ${color}` }}>
        <span className="local-emoji-big">{catEmoji}</span>
        {local.descuento && <span className="descuento-badge">-{local.descuento}%</span>}
      </div>
      <div className="local-card-body">
        <h3 className="local-nombre">{local.empresaNombre || 'Negocio'}</h3>
        <span className="local-cat-tag">{catEmoji} {catLabel}</span>
        <p className="local-desc">{local.descripcion}</p>
        <div className="local-promo-box">
          🏷️ {local.titulo}
        </div>
        <div className="local-meta">
          <span>🗓️ Válido hasta: {fechaFinStr}</span>
        </div>
      </div>
      <div className="local-card-footer">
        <Link to={`/mapa?id=${local.id}`} className="btn-mapa">
          🗺️ Ver en mapa
        </Link>
        <button className="btn-ticket" onClick={() => onTicket(local)}>
          🎫 Obtener ticket
        </button>
      </div>
    </div>
  );
};

const normalizarTexto = (texto) => {
  if (!texto) return '';
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const Locales = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [catActiva, setCatActiva] = useState('todos');
  const [ticketLocal, setTicketLocal] = useState(null);
  const [locales, setLocales] = useState([]); 

  useEffect(() => { 
    const unsub = onSnapshot(collection(db, 'promociones'), (snapshot) => {
      setLocales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const localesFiltrados = useMemo(() => {
    const q = search.toLowerCase();
    return locales.filter((l) => {
      const matchSearch =
        !q ||
        normalizarTexto(l.empresaNombre).includes(q) ||
        normalizarTexto(l.descripcion).includes(q) ||
        normalizarTexto(l.titulo).includes(q);
      const matchCat = catActiva === 'todos' || l.categoria === catActiva;
      return matchSearch && matchCat;
    });
  }, [search, catActiva, locales]); 

  return (
    <div className="locales-page">
      <div className="locales-header">
        <h1 className="locales-titulo">Locales y Promociones</h1>
        <input
          type="text"
          className="locales-search"
          placeholder=" Buscar negocios, categorías o promociones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="categorias-bar">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${catActiva === cat.id ? 'active' : ''}`}
              onClick={() => setCatActiva(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
        <p className="locales-count">
          {localesFiltrados.length === 0
            ? 'Sin resultados'
            : `${localesFiltrados.length} negocio${localesFiltrados.length !== 1 ? 's' : ''} encontrado${localesFiltrados.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {localesFiltrados.length === 0 ? (
        <div className="no-results">
          <p>😕 No encontramos negocios con esos criterios.</p>
          <button
            className="btn-limpiar"
            onClick={() => { setSearch(''); setCatActiva('todos'); }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="locales-grid">
          {localesFiltrados.map((local) => (
            <LocalCard key={local.id} local={local} onTicket={setTicketLocal} />
          ))}
        </div>
      )}

      {ticketLocal && (
        <TicketModal local={ticketLocal} onClose={() => setTicketLocal(null)} />
      )}
    </div>
  );
};

export default Locales;