import { useState, useEffect } from 'react';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { logError } from '../../../../shared/utils/errorHandler';
import { obtenerHistorialSuscripcionesEmpresa } from '../../services/empresaService';
import './GestorSuscripcion.css';
import PaymentModal from './PaymentModal/PaymentModal';
import { PLANES } from '../../../../data/planes';

const GestorSuscripcion = () => {
  const { user } = useAuth();
  const [suscripcionActiva, setSuscripcionActiva] = useState(null);
  const [historialSuscripciones, setHistorialSuscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarSuscripciones();
  }, [user]);

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

  const handleSelectPlan = (plan) => {
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

      <div className="planes-container">
        <h3>Nuestros Planes</h3>
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
                disabled={suscripcionActiva?.planId === plan.id}
                className="btn-contratar"
              >
                {suscripcionActiva?.planId === plan.id ? 'Plan Actual' : 'Contratar'}
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
