// src/modules/empresa/hooks/useCanjeTickets.js
import React from 'react';
import { obtenerTicketsEmpresa, canjearTicket } from '../services/ticketService';
import { useAuth } from '../../../shared/context/AuthContext';
import { logError } from '../../../shared/utils/errorHandler';

export const useCanjeTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const cargarTickets = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const datos = await obtenerTicketsEmpresa(user.uid);
      setTickets(datos);
      setError(null);
    } catch (err) {
      logError('cargarTickets', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargarTickets();
  }, [user?.uid]);

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