import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/tickets.css';

const VisualizarTicket = ({ ticket, onClose, promocion }) => {
  const [copied, setCopied] = useState(false);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(ticket.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ticket-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <div className="ticket-content">
          <h2>Tu Ticket</h2>

          {/* Información de la promoción */}
          <div className="ticket-info">
            <div className="promo-details">
              <h3>{ticket.promocionTitulo}</h3>
              <p className="empresa">{ticket.empresaNombre}</p>
              <div className="descuento-badge">-{ticket.descuento}%</div>
            </div>

            {/* Estado del ticket */}
            <div className={`ticket-status ${ticket.estado}`}>
              {ticket.estado === 'generado' ? '✓ Activo' : '✓ Canjeado'}
            </div>
          </div>

          {/* Código manual */}
          <div className="codigo-section">
            <p className="label">Código de canje:</p>
            <div className="codigo-container">
              <input
                type="text"
                value={ticket.codigo}
                readOnly
                className="codigo-input"
              />
              <button
                className="btn-copiar"
                onClick={copiarCodigo}
                title="Copiar código"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="instrucciones">
            <p><strong>Cómo usar:</strong></p>
            <ul>
              <li>Presenta este código en el local</li>
              <li>Solo puedes canjear una vez por promoción</li>
            </ul>
          </div>

          {/* Fechas */}
          <div className="fechas">
            <p>Generado: {new Date(ticket.fechaGeneracion.toDate?.() || ticket.fechaGeneracion).toLocaleDateString()}</p>
            {ticket.fechaCanjeado && (
              <p>Canjeado: {new Date(ticket.fechaCanjeado.toDate?.() || ticket.fechaCanjeado).toLocaleDateString()}</p>
            )}
          </div>

          {/* Información adicional sobre disponibilidad (si se proporciona promoción) */}
          {promocion && (promocion.ticketsMaximos || promocion.fechaHoraExpiracion) && (
            <div className="info-limites" style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff9f0', borderRadius: '6px', borderLeft: '3px solid #ffc22f' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#d97706' }}>Información de disponibilidad:</p>
              {promocion.ticketsMaximos && (
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#475569' }}>
                  Tickets disponibles: {Math.max(0, promocion.ticketsMaximos - (promocion.ticketsGenerados || 0))} de {promocion.ticketsMaximos}
                </p>
              )}
              {promocion.fechaHoraExpiracion && (
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#475569' }}>
                  Generación de tickets hasta: {new Date(promocion.fechaHoraExpiracion.toDate?.() || promocion.fechaHoraExpiracion).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Ver perfil de la empresa */}
          {ticket.empresaId && (
            <Link
              to={`/empresa/perfil/${ticket.empresaId}`}
              className="btn-ver-empresa"
              onClick={onClose}
            >
              Ver perfil de la empresa
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizarTicket;