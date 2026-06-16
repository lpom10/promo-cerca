import { useState, useRef } from 'react';
import { obtenerTicketPorCodigo, canjearTicket } from '../services/ticketService';
import '../styles/canje-tickets.css';

const CanjeTickets = ({ empresaId }) => {
  const [codigo, setCodigo] = useState('');
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exitoCanjeado, setExitoCanjeado] = useState(false);
  const [mostrandoEscanner, setMostrandoEscanner] = useState(false);
  const inputRef = useRef();

  const buscarTicket = async (e) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      setError('Ingresa un código de ticket');
      return;
    }

    setCargando(true);
    setError('');
    setTicket(null);
    setExitoCanjeado(false);

    try {
      const foundTicket = await obtenerTicketPorCodigo(codigo.toUpperCase(), empresaId);
      setTicket(foundTicket);
    } catch (err) {
      setError(err.message);
      setCodigo('');
    } finally {
      setCargando(false);
    }
  };

  const handleCanjeTicket = async () => {
    if (!ticket) return;

    setCargando(true);
    setError('');

    try {
      await canjearTicket(ticket.id, empresaId);
      setExitoCanjeado(true);
      setTicket(null);
      setCodigo('');

      // Enfocar input para siguiente escaneo
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="canje-tickets-container">
      <h2>Canjear Tickets</h2>

      {/* Mensajes */}
      {error && <div className="alert alert-error">{error}</div>}
      
      {exitoCanjeado && (
        <div className="exito-canjeado-container">
          <div className="alert alert-success">
            Ticket canjeado correctamente
          </div>
          <button 
            className="btn-otro-ticket"
            onClick={() => {
              setExitoCanjeado(false);
              setError('');
              setCodigo('');
              setTicket(null);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          >
            Canjear otro ticket
          </button>
        </div>
      )}

      {/* Búsqueda de código */}
      {!ticket && !exitoCanjeado && (
        <div className="canje-controles">
          <form onSubmit={buscarTicket} className="buscar-form">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ingresar código de ticket..."
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              autoFocus
              maxLength="8"
              className="codigo-input"
            />
            <button
              type="submit"
              disabled={cargando}
              className="btn-buscar"
            >
              {cargando ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
          
          <div className="divider" style={{ margin: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>— o —</div>
          
          <button 
            className="btn-qr-scan"
            onClick={() => setMostrandoEscanner(!mostrandoEscanner)}
            style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#fb4c23', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(251, 76, 35, 0.2)' }}
          >
            {mostrandoEscanner ? 'Cerrar Cámara' : '📷 Escanear Código QR'}
          </button>

          {mostrandoEscanner && (
            <div className="scanner-placeholder" style={{ marginTop: '20px', padding: '40px', border: '2px dashed #fb4c23', borderRadius: '12px', textAlign: 'center', background: '#fff5f2' }}>
              <p style={{ color: '#fb4c23', fontWeight: '600' }}>Iniciando cámara...</p>
              <small style={{ color: '#94a3b8' }}>Para habilitar el escaneo en vivo, instala la librería 'html5-qrcode'</small>
            </div>
          )}
        </div>
      )}

      {/* Detalles del ticket encontrado */}
      {ticket && !exitoCanjeado && !ticket.canjeado && (
        <div className="ticket-detalles">
          <div className="ticket-header">
            <span className="codigo-grande">{ticket.codigo}</span>
            <span className={`estado ${ticket.estado}`}>
              {ticket.estado === 'generado' ? 'Activo' : 'Canjeado'}
            </span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Cliente:</label>
              <p>{ticket.usuarioNombre || 'No especificado'}</p>
            </div>
            <div className="info-item">
              <label>Teléfono:</label>
              <p>{ticket.usuarioTelefono || 'N/A'}</p>
            </div>
            <div className="info-item">
              <label>Promoción:</label>
              <p>{ticket.promocionTitulo}</p>
            </div>
            <div className="info-item">
              <label>Descuento:</label>
              <p className="descuento">-{ticket.descuento}%</p>
            </div>
            <div className="info-item">
              <label>Generado:</label>
              <p>{new Date(ticket.fechaGeneracion.toDate?.() || ticket.fechaGeneracion).toLocaleString()}</p>
            </div>
            {ticket.estado === 'canjeado' && (
              <div className="info-item">
                <label>Canjeado:</label>
                <p>{new Date(ticket.fechaCanjeado.toDate?.() || ticket.fechaCanjeado).toLocaleString()}</p>
              </div>
            )}
          </div>

          {ticket.estado === 'generado' ? (
            <div className="acciones">
              <button
                className="btn-canjear"
                onClick={handleCanjeTicket}
                disabled={cargando}
              >
                {cargando ? 'Canjeando...' : 'Canjear Ticket'}
              </button>
              <button
                className="btn-cancelar"
                onClick={() => {
                  setTicket(null);
                  setCodigo('');
                  inputRef.current?.focus();
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="ticket-canjeado-msg">
              Este ticket ya fue canjeado el {new Date(ticket.fechaCanjeado.toDate?.() || ticket.fechaCanjeado).toLocaleString()}
              <button 
                className="btn-cancelar" 
                style={{marginTop: '1rem', width: '100%'}}
                onClick={() => {
                  setTicket(null);
                  setCodigo('');
                  inputRef.current?.focus();
                }}
              >
                Volver
              </button>
            </div>
          )}
        </div>
      )}

      {/* Estado inicial */}
      {!ticket && !error && !exitoCanjeado && (
        <div className="instrucciones">
          <p>Ingrese el código de ticket proporcionado por el cliente.</p>
          <p>Se mostrará la información de la promoción para validar la transacción.</p>
        </div>
      )}
    </div>
  );
};

export default CanjeTickets;
