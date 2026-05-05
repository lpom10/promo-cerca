import { useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import '../styles/tickets.css';

const VisualizarTicket = ({ ticket, onClose }) => {
  const qrRef = useRef();
  const [copied, setCopied] = useState(false);

  const descargarQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `ticket-${ticket.codigo}.png`;
    link.click();
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(ticket.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const imprimirTicket = () => {
    window.print();
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

          {/* Código QR */}
          <div className="qr-section" ref={qrRef}>
            <div className="qr-code">
              <QRCode
                value={ticket.codigo}
                size={200}
                level="H"
                includeMargin={true}
                renderAs="canvas"
              />
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
              <li>Puedes mostrar el QR o el código manual</li>
              <li>Solo puedes canjear una vez por promoción</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="acciones">
            <button className="btn-descargar" onClick={descargarQR}>
              ⬇️ Descargar QR
            </button>
            <button className="btn-imprimir" onClick={imprimirTicket}>
              🖨️ Imprimir
            </button>
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
