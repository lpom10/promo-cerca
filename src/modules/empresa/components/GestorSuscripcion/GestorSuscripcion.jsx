import { useState, useEffect } from 'react';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { logError } from '../../../../shared/utils/errorHandler';
import { obtenerHistorialSuscripcionesEmpresa, suscribirseSuscripcionesEmpresa } from '../../services/empresaService';
import './GestorSuscripcion.css';
import PaymentModal from './PaymentModal/PaymentModal';
import { PLANES } from '../../../../data/planes';

const GestorSuscripcion = () => {
  const { user } = useAuth();
  const [suscripcionActiva, setSuscripcionActiva] = useState(null);
  const [historialSuscripciones, setHistorialSuscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    if (!user?.uid) {
      setSuscripcionActiva(null);
      setHistorialSuscripciones([]);
      return undefined;
    }

    cargarSuscripciones();

    let active = true;
    const unsubscribePromise = suscribirseSuscripcionesEmpresa(user.uid, (suscripciones) => {
      if (!active) return;
      const activa = suscripciones.find(s => s.estado === 'activa');
      setSuscripcionActiva(activa || null);
      setHistorialSuscripciones(suscripciones);
    });

    const intervalId = setInterval(() => setTick(Date.now()), 60000);

    return () => {
      active = false;
      clearInterval(intervalId);
      if (typeof unsubscribePromise?.then === 'function') {
        unsubscribePromise.then((unsubscribe) => unsubscribe?.());
      }
    };
  }, [user?.uid]);

  const cargarSuscripciones = async () => {
    try {
      const suscripciones = await obtenerHistorialSuscripcionesEmpresa(user.uid);
      const activa = suscripciones.find(s => s.estado === 'activa');
      setSuscripcionActiva(activa || null);
      setHistorialSuscripciones(suscripciones);
    } catch (error) {
      logError(error, { accion: 'cargarSuscripciones', userId: user.uid, componente: 'GestorSuscripcion' });
    }
  };

  const planes = PLANES;
  const suscripcionPendiente = historialSuscripciones.find((s) => s.estado === 'espera') || null;
  const bloqueoPorRevision = Boolean(suscripcionPendiente);

  const formatearTiempoTranscurrido = (createdAt) => {
    if (!createdAt) return 'recién enviada';

    const fecha = createdAt?.toDate?.() || new Date(createdAt);
    if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
      return 'recién enviada';
    }

    const diffMs = Date.now() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 60) return `hace ${diffMin} min`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays} d`;
  };

  const handleSelectPlan = (plan) => {
    if (bloqueoPorRevision) {
      return;
    }

    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handlePaymentSuccess = async (paymentId = null) => {
    // No activar directamente la suscripción — el registro ya se crea en el modal
    setLoading(true);
    try {
      await cargarSuscripciones();
      setShowModal(false);
      setSelectedPlan(null);
    } catch (error) {
      logError(error, { accion: 'handlePaymentSuccess', userId: user.uid });
    }
    setLoading(false);
  };

  return (
    <div className="gestor-suscripcion">
      <h2>Gestión de Suscripción</h2>

      {suscripcionActiva && (
        <div className="suscripcion-activa">
          <h3>📌 Suscripción Activa</h3>
          <div className="plan-actual">
            <p><strong>Plan:</strong> {suscripcionActiva.planNombre}</p>
            <p className="plan-precio">${suscripcionActiva.precio}/mes</p>
            <p><strong>Próxima renovación:</strong> {suscripcionActiva.proximoRenovacion?.toDate?.().toLocaleDateString?.()}</p>
          </div>
        </div>
      )}

      {!suscripcionActiva && suscripcionPendiente && (
        <div className="suscripcion-pendiente">
          <h3>⏳ Solicitud en revisión</h3>
          <p>Tu comprobante ya fue recibido y está siendo revisado por el equipo.</p>
          <p className="suscripcion-tiempo">{formatearTiempoTranscurrido(suscripcionPendiente.createdAt)}</p>
          <p className="suscripcion-ayuda">SLA: respondemos en menos de 24 horas y te notificamos automáticamente al aprobarlo o rechazarlo.</p>
        </div>
      )}

      <div className="planes-container">
        <h3>Nuestros Planes</h3>
        <div className="planes-hero">
          <p>Para activar tu plan con la menor fricción posible, el camino ideal es un pago instantáneo. El proceso manual por transferencia sigue disponible, pero puede demorar hasta 24 horas.</p>
        </div>
        <div className="planes-grid">
          {planes.map(plan => (
            <div key={plan.id} className="plan-card">
              <h4>{plan.nombre}</h4>
              <div className="plan-precio">${plan.precio}/mes</div>
              <ul className="plan-features">
                {plan.caracteristicas.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={suscripcionActiva?.planId === plan.id || bloqueoPorRevision}
                className="btn-contratar"
              >
                {bloqueoPorRevision
                  ? 'Revisión pendiente'
                  : suscripcionActiva?.planId === plan.id
                    ? 'Plan Actual'
                    : 'Pagar ahora'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowModal(false)}
          onSuccess={(paymentId) => handlePaymentSuccess(paymentId)}
        />
      )}
    </div>
  );
};

export default GestorSuscripcion;
