import { useState, useEffect } from 'react';
import { useAuth } from '../../../../../shared/hooks/useAuth';
import { obtenerInfoAdminPago, subirComprobantePago, crearSuscripcionPendiente } from '../../../services/empresaService';
import { handleError, logError } from '../../../../../shared/utils/errorHandler';
import './PaymentModal.css';
import toast from 'react-hot-toast';

const PaymentModal = ({ onClose, plan, onSuccess }) => {
  const [adminInfo, setAdminInfo] = useState({ nombre: '', ruc: '', numeroCuenta: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await obtenerInfoAdminPago();
        if (info) {
          setAdminInfo(info);
        }
      } catch (err) {
        logError(err, { accion: 'fetchAdminInfo' });
      }
    };
    
    fetchInfo();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError(null);

    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError('El archivo no debe exceder 5MB');
      return;
    }

    if (!selected.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.onerror = () => {
      setError('Error al leer el archivo');
      logError(reader.error, { accion: 'fileRead' });
    };
    reader.readAsDataURL(selected);
  };

  const { user } = useAuth();

  const handleSubmit = async () => {
    setError(null);

    if (!plan || !plan.id) {
      setError('Error: Información del plan incompleta');
      logError(new Error('Plan info missing'), { accion: 'handleSubmit' });
      return;
    }

    setUploading(true);

    try {
      let receiptUrl = 'https://via.placeholder.com/300?text=Comprobante';
      if (file) {
        receiptUrl = await subirComprobantePago(file, user?.uid);
      }

      const payment = await crearSuscripcionPendiente(user?.uid, plan, null, receiptUrl);
      if (onSuccess) onSuccess(payment.id);
      onClose();
      toast.success('¡Comprobante enviado! Lo revisaremos en menos de 24 horas y te notificaremos automáticamente.');
    } catch (err) {
      const errorInfo = handleError(err, { accion: 'payment_upload' });
      setError(errorInfo.mensaje);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-content">
        <button className="payment-modal-close" onClick={onClose}>✕</button>
        
        <h2>Confirmar Pago</h2>
        <p className="payment-plan-display">{plan?.nombre}</p>
        <p className="payment-precio-display">${plan?.precio}/mes</p>
        
        {error && (
          <div className="payment-error-message">
            ⚠️ {error}
          </div>
        )}

        <section className="payment-admin-info">
          <h3>Datos de transferencia</h3>
          <p><strong>Nombre:</strong> {adminInfo.nombre || '—'}</p>
          <p><strong>RUC:</strong> {adminInfo.ruc || '—'}</p>
          <p><strong>Cuenta:</strong> {adminInfo.numeroCuenta || '—'}</p>
        </section>

        <section className="payment-sla-box" aria-label="SLA de revisión de pago">
          <h3>Proceso manual de revisión</h3>
          <p><strong>SLA:</strong> revisamos y respondemos en menos de 24 horas.</p>
          <p>Te notificaremos automáticamente cuando tu comprobante sea aprobado o rechazado.</p>
        </section>
        
        <section className="payment-receipt-upload">
          <h3>Sube el comprobante</h3>
          <input 
            type="file" 
            accept="image/png, image/jpeg" 
            onChange={handleFileChange}
            disabled={uploading}
          />
          {preview && <img src={preview} alt="Preview" className="payment-receipt-preview" />}
        </section>
        
        <div className="payment-modal-actions">
          <button onClick={onClose} disabled={uploading} className="payment-btn-cancel">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={uploading}
            className="payment-btn-submit"
          >
            {uploading ? 'Enviando...' : 'Enviar Comprobante'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
