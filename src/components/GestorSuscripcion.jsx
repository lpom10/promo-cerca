import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import '../styles/suscripciones.css';
import PaymentModal from './PaymentModal';

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
      console.error('Error cargando suscripciones:', error);
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
        '✅ Duración de 30 días',
        '✅ Soporte por email',
      ],
    },
    {
      id: 'premium',
      nombre: 'Plan Premium',
      precio: 19.99,
      duracion: 30,
      caracteristicas: [
        '✅ Hasta 20 promociones activas',
        '✅ Duración de 30 días',
        '✅ Análisis detallados',
        '✅ Soporte prioritario',
      ],
    },
    {
      id: 'profesional',
      nombre: 'Plan Profesional',
      precio: 49.99,
      duracion: 30,
      caracteristicas: [
        '✅ Promociones ilimitadas',
        '✅ Duración de 30 días',
        '✅ Análisis avanzados',
        '✅ Soporte 24/7',
        '✅ API access',
      ],
    },
  ];

  const handlePlanSelect = async (plan) => {
    // Open modal to confirm and upload receipt
    setSelectedPlan({ ...plan, empresaId: user.uid });
    setShowModal(true);
    // No immediate processing here; modal will handle upload
  };

  return (
    <div className="gestor-suscripcion">
      <h2>Gestión de Suscripción</h2>

      {suscripcionActiva && (
        <div className="suscripcion-activa">
          <h3>Suscripción Activa</h3>
          <div className="plan-actual">
            <p className="plan-nombre">Plan: <strong>{suscripcionActiva.plan}</strong></p>
            <p className="plan-precio">${suscripcionActiva.precio}/mes</p>
            <p className="plan-vencimiento">
              Vencimiento: <strong>{new Date(suscripcionActiva.fechaVencimiento.toDate?.()).toLocaleDateString()}</strong>
            </p>
            <p className="plan-renovacion">
              {suscripcionActiva.renovacionAutomatica ? (
                <span className="renovacion-automatica">🔄 Renovación automática habilitada</span>
              ) : (
                <span className="renovacion-deshabilitada">⚠️ Renovación automática deshabilitada</span>
              )}
            </p>
          </div>
        </div>
      )}

      {paymentPending && (
        <div className="alert-info" style={{ 
          backgroundColor: '#e3f2fd', 
          color: '#1976d2', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          border: '1px solid #bbdefb',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>⏳</span>
          <p style={{ margin: 0 }}><strong>Pago en revisión:</strong> Hemos recibido tu comprobante. Un administrador lo validará pronto para activar tu suscripción.</p>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && selectedPlan && (
        <PaymentModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          plan={selectedPlan}
          onSuccess={() => {
            setPaymentPending(true);
            setShowModal(false);
          }}
        />
      )}

      <div className="planes-container">
        <h3>{suscripcionActiva ? 'Cambiar de Plan' : 'Selecciona un Plan'}</h3>
        <div className="planes-grid">
          {planes.map(plan => (
            <div
              key={plan.id}
              className={`plan-card ${suscripcionActiva?.plan === plan.id ? 'active' : ''}`}
            >
              <h4>{plan.nombre}</h4>
              <div className="plan-precio-display">
                <span className="precio">${plan.precio}</span>
                <span className="periodo">/mes</span>
              </div>
              <ul className="caracteristicas">
                {plan.caracteristicas.map((car, idx) => (
                  <li key={idx}>{car}</li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanSelect(plan)}
                disabled={loading || suscripcionActiva?.plan === plan.id}
                className={`btn-seleccionar ${suscripcionActiva?.plan === plan.id ? 'btn-actual' : ''}`}
              >
                {loading ? '⏳ Procesando...' : suscripcionActiva?.plan === plan.id ? '✅ Plan Actual' : '💳 Contratar'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {historialSuscripciones.length > 0 && (
        <div className="historial-suscripciones">
          <h3>Historial de Suscripciones</h3>
          <table className="historial-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Precio</th>
                <th>Fecha Inicio</th>
                <th>Fecha Vencimiento</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {historialSuscripciones.map(sub => (
                <tr key={sub.id}>
                  <td>{sub.plan}</td>
                  <td>${sub.precio}</td>
                  <td>{new Date(sub.fechaInicio.toDate?.()).toLocaleDateString()}</td>
                  <td>{new Date(sub.fechaVencimiento.toDate?.()).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge-${sub.estado}`}>
                      {sub.estado === 'activa' ? '✅ Activa' : sub.estado === 'vencida' ? '⏰ Vencida' : '❌ Cancelada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="nota-importante">
        <p>
          <strong>Nota:</strong> Este es un sistema simulado de suscripciones. 
          La integración con pasarelas de pago (Stripe, MercadoPago) se realizará en la próxima actualización.
        </p>
      </div>
    </div>
  );
};

export default GestorSuscripcion;
