import { useState } from 'react';
import '../styles/tickets.css';

const VisualizarTicket = ({ ticket, onClose }) => {
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
          <h2>🎟️ Tu Ticket</h2>

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
                {copied ? '✓ Copiado' : '📋 Copiar'}
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
        </div>
      </div>
    </div>
  );
};

export default VisualizarTicket;
