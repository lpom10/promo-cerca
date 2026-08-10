// src/modules/empresa/hooks/useCanjeTickets.js
import React from 'react';
import { obtenerTicketsEmpresa, canjearTicket } from '../services/ticketService';
import { useAuth } from '../../../shared/hooks/useAuth';
import { logError } from '../../../shared/utils/errorHandler';

export const useCanjeTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const cargarTickets = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const datos = await obtenerTicketsEmpresa(user.uid);
      setTickets(datos);
      setError(null);
    } catch (err) {
      logError(err, { accion: 'cargarTickets' });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    cargarTickets();
  }, [cargarTickets]);

  const canjear = async (ticketId) => {
    try {
      await canjearTicket(ticketId, user.uid);
      await cargarTickets();
      return { exito: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    tickets,
    loading,
    error,
    canjear,
    refetch: cargarTickets,
  };
};