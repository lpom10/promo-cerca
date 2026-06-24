import { useState, useEffect } from 'react';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { db } from '../../../../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { logError } from '../../../../shared/utils/errorHandler';
import './GestorSuscripcion.css';
import PaymentModal from './PaymentModal/PaymentModal';

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
      const q = query(collection(db, 'suscripciones'), where('empresaId', '==', user.uid));
      const snapshot = await getDocs(q);
      const suscripciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por fecha más reciente primero
      suscripciones.sort((a, b) => b.createdAt.toDate?.() - a.createdAt.toDate?.());

      // La primera activa es la actual
      const activa = suscripciones.find(s => s.estado === 'activa');
      setSuscripcionActiva(activa || null);
      setHistorialSuscripciones(suscripciones);
    } catch (error) {
      logError(error, { accion: 'cargarSuscripciones', userId: user.uid, componente: 'GestorSuscripcion' });
    }
  };

  const planes = [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      precio: 9.99,
      duracion: 30,
      caracteristicas: [
        '✅ Hasta 5 promociones activas',
        '✅ Análisis básico',
        '✅ Soporte por email',
        '✅ Dashboard simple'
      ]
    },
    {
      id: 'profesional',
      nombre: 'Plan Profesional',
      precio: 24.99,
      duracion: 30,
      caracteristicas: [
        '✅ Hasta 20 promociones activas',
        '✅ Análisis avanzado',
        '✅ Soporte prioritario',
        '✅ API access',
        '✅ Reportes mensuales'
      ]
    },
    {
      id: 'empresarial',
      nombre: 'Plan Empresarial',
      precio: 99.99,
      duracion: 30,
      caracteristicas: [
        '✅ Promociones ilimitadas',
        '✅ Análisis en tiempo real',
        '✅ Soporte 24/7',
        '✅ API access completo',
        '✅ Gestor de cuentas dedicado',
        '✅ Integración personalizada'
      ]
    }
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'suscripciones'), {
        empresaId: user.uid,
        planId: selectedPlan.id,
        planNombre: selectedPlan.nombre,
        precio: selectedPlan.precio,
        estado: 'activa',
        createdAt: new Date(),
        proximoRenovacion: new Date(Date.now() + selectedPlan.duracion * 24 * 60 * 60 * 1000)
      });
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
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default GestorSuscripcion;
