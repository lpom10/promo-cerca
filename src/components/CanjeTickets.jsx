import { useState, useRef } from 'react';
import { obtenerTicketPorCodigo, canjearTicket } from '../services/ticketService';
import '../styles/canje-tickets.css';

const CanjeTickets = ({ empresaId }) => {
  const [codigo, setCodigo] = useState('');
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exitoCanjeado, setExitoCanjeado] = useState(false);
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
      const foundTicket = await obtenerTicketPorCodigo(codigo.toUpperCase());
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

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setExitoCanjeado(false), 3000);

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
      <h2>🎟️ Canjear Tickets</h2>

      {/* Mensajes */}
      {error && <div className="alert alert-error">{error}</div>}
      {exitoCanjeado && (
        <div className="alert alert-success">
          ✓ Ticket canjeado correctamente
        </div>
      )}

      {/* Búsqueda de código */}
      {!ticket && (
        <form onSubmit={buscarTicket} className="buscar-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="Escanear o ingresar código..."
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
            {cargando ? '⏳ Buscando...' : '🔍 Buscar'}
          </button>
        </form>
      )}

      {/* Detalles del ticket encontrado */}
      {ticket && !ticket.canjeado && (
        <div className="ticket-detalles">
          <div className="ticket-header">
            <span className="codigo-grande">{ticket.codigo}</span>
            <span className={`estado ${ticket.estado}`}>
              {ticket.estado === 'generado' ? '✓ Activo' : '✓ Canjeado'}
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
                {cargando ? '⏳ Canjeando...' : '✓ Canjear Ticket'}
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
              ✓ Este ticket ya fue canjeado el {new Date(ticket.fechaCanjeado.toDate?.() || ticket.fechaCanjeado).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Estado inicial */}
      {!ticket && !error && (
        <div className="instrucciones">
          <p>📱 Escanea el código QR del cliente o ingresa el código manualmente</p>
          <p>Se mostrará la información del ticket para confirmar el canje</p>
        </div>
      )}
    </div>
  );
};

export default CanjeTickets;
