import React from 'react';
import { useCanjeTickets } from '../hooks/useCanjeTickets';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Spinner, ErrorBoundary } from '../../../shared/ui';
import { obtenerTicketPorCodigo } from '../services/ticketService';
import '../styles/canje-tickets.css';

const CanjeTicketsPage = () => {
  const { user } = useAuth();
  const { tickets, loading, error, canjear } = useCanjeTickets();
  const [canjeError, setCanjeError] = React.useState(null);
  const [canjeSuccess, setCanjeSuccess] = React.useState(null);
  const [codigoInput, setCodigoInput] = React.useState('');
  const [codigoBuscando, setCodigoBuscando] = React.useState(false);

  const handleCanjearTicket = async (ticketId) => {
    try {
      setCanjeError(null);
      setCanjeSuccess(null);
      await canjear(ticketId);
      setCanjeSuccess('Ticket canjeado exitosamente');
      setTimeout(() => setCanjeSuccess(null), 3000);
    } catch (err) {
      setCanjeError(err.message || 'Error al canjear el ticket');
    }
  };

  const handleCanjearPorCodigo = async (e) => {
    e.preventDefault();
    const codigo = codigoInput.trim().toUpperCase();
    if (!codigo) {
      setCanjeError('Ingresa un código de ticket');
      return;
    }

    try {
      setCanjeError(null);
      setCanjeSuccess(null);
      setCodigoBuscando(true);
      const ticket = await obtenerTicketPorCodigo(codigo, user?.uid);
      if (!ticket) {
        throw new Error('No se encontró un ticket con ese código');
      }
      await canjear(ticket.id);
      setCanjeSuccess(`Ticket ${codigo} canjeado correctamente`);
      setCodigoInput('');
    } catch (err) {
      setCanjeError(err.message || 'No se pudo canjear el ticket por código');
    } finally {
      setCodigoBuscando(false);
    }
  };

  if (loading) return <Spinner fullScreen />;

  return (
    <ErrorBoundary name="CanjeTickets">
      <div className="canje-tickets">
        <div className="header">
          <h2>Canjear Tickets</h2>
          <p>Aquí puedes canjear los tickets generados por tus promociones.</p>
        </div>

        {error && (
          <div className="error-banner" style={{ backgroundColor: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {canjeError && (
          <div className="error-banner" style={{ backgroundColor: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
            {canjeError}
          </div>
        )}

        {canjeSuccess && (
          <div className="success-banner" style={{ backgroundColor: '#efe', color: '#3c3', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
            {canjeSuccess}
          </div>
        )}

        <form className="codigo-canje-form" onSubmit={handleCanjearPorCodigo}>
          <label htmlFor="codigoTicket">Canjear por código</label>
          <div className="codigo-canje-row">
            <input
              id="codigoTicket"
              type="text"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              placeholder="Ingresa el código del ticket"
              autoComplete="off"
            />
            <button type="submit" disabled={codigoBuscando}>
              {codigoBuscando ? 'Buscando...' : 'Canjear'}
            </button>
          </div>
        </form>

        <div className="tickets-container">
          {tickets.length === 0 ? (
            <div className="sin-tickets">
              <p>No hay tickets para canjear en este momento.</p>
            </div>
          ) : (
            <div className="tickets-grid">
              {tickets.map(ticket => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <h3>{ticket.promocionTitulo || 'Sin título'}</h3>
                    <span className={`ticket-status ${ticket.estado || 'pendiente'}`}>
                      {ticket.estado || 'Pendiente'}
                    </span>
                  </div>

                  <div className="ticket-info">
                    <p><strong>Usuario:</strong> {ticket.usuarioNombre || ticket.usuarioEmail}</p>
                    <p><strong>Descuento:</strong> {ticket.descuento}%</p>
                    <p><strong>Fecha de generación:</strong> {new Date(ticket.fechaGenerado?.toDate?.()).toLocaleDateString()}</p>
                    {ticket.fechaCanjeado && (
                      <p><strong>Fecha de canje:</strong> {new Date(ticket.fechaCanjeado?.toDate?.()).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="ticket-actions">
                    {ticket.estado !== 'canjeado' && (
                      <button
                        onClick={() => handleCanjearTicket(ticket.id)}
                        className="btn-canjear"
                      >
                        Canjear
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CanjeTicketsPage;
