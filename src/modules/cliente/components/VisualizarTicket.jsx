import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../../styles/tickets.css';

const VisualizarTicket = ({ ticket, onClose, promocion }) => {
  const [copied, setCopied] = useState(false);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(ticket.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const imprimirTicket = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) return;

    const fecha = new Date(ticket?.fechaGeneracion?.toDate?.() || ticket?.fechaGeneracion || Date.now()).toLocaleDateString('es-ES');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ticket.codigo || '')}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket ${ticket?.codigo || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; background: #fffdfb; color: #111827; }
            .card { border: 2px solid #f59e0b; border-radius: 20px; padding: 24px; max-width: 700px; margin: 0 auto; background: #fff; }
            h1 { font-size: 24px; margin: 0 0 8px; color: #fb4c23; text-align: center; }
            h2 { font-size: 20px; margin: 6px 0; text-align: center; }
            .sub { color: #64748b; text-align: center; margin-bottom: 16px; }
            .qr { text-align: center; margin: 18px 0; }
            .code { text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 12px 0 8px; }
            .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 18px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Promo Cerca</h1>
            <h2>${ticket?.promocionTitulo || 'Ticket'}</h2>
            <div class="sub">${ticket?.empresaNombre || 'Empresa'}</div>
            <div class="qr"><img src="${qrUrl}" alt="QR" width="220" height="220" /></div>
            <div class="code">${ticket?.codigo || ''}</div>
            <div class="sub">Generado el ${fecha}</div>
            <div class="footer">Presenta este ticket en el local · Verifica antes de canjear</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ticket-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <div className="ticket-content">
          <h2>Tu Ticket</h2>

          {/* Información de la promoción */}
          <div className="ticket-info">
            {/* 🛡️ MEJORA: Generación automática de QR para escaneo rápido */}
            <div className="qr-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px', padding: '15px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticket.codigo}`} 
                alt="Código QR del Ticket"
                style={{ width: '180px', height: '180px', marginBottom: '10px' }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Presenta este QR en el local</p>
            </div>

            <div className="promo-details">
              <h3>{ticket.promocionTitulo}</h3>
              <p className="empresa">{ticket.empresaNombre}</p>
              <div className="descuento-badge">-{ticket.descuento}%</div>
              
              {(ticket.precioOriginal || ticket.precioDescuento) && (
                <div style={{ marginTop: '10px', fontSize: '1.1rem' }}>
                  {ticket.precioOriginal && <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '10px' }}>${ticket.precioOriginal}</span>}
                  {ticket.precioDescuento && <span style={{ fontWeight: 'bold', color: '#06b6d4' }}>${ticket.precioDescuento}</span>}
                </div>
              )}
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

          <div className="ticket-actions">
            <button className="btn-print" onClick={imprimirTicket}>
              🖨️ Imprimir / PDF
            </button>
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

          {/* Ver perfil de la empresa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {promocion && promocion.lat && promocion.lng && (
              <button 
                className="btn-secundario"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${promocion.lat},${promocion.lng}`, '_blank')}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#1e293b' }}
              >
                📍 Cómo llegar (Mapa)
              </button>
            )}
            
            {ticket.empresaId && (
              <Link
                to={`/empresa/${ticket.empresaId}`}
                className="btn-ver-empresa"
                onClick={onClose}
              >
                Ver perfil de la empresa
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizarTicket;