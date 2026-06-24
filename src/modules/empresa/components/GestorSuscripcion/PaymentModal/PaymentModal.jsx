import { useState, useEffect } from 'react';
import { db, storage } from '../../../../../firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleError, logError } from '../../../../../shared/utils/errorHandler';
import './PaymentModal.css';

const PaymentModal = ({ onClose, plan, onSuccess }) => {
  const [adminInfo, setAdminInfo] = useState({ nombre: '', ruc: '', numeroCuenta: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const infoSnap = await getDoc(doc(db, 'admin', 'info'));
        if (infoSnap.exists()) {
          setAdminInfo(infoSnap.data());
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

  const handleSubmit = async () => {
    setError(null);

    if (!plan || !plan.id) {
      setError('Error: Información del plan incompleta');
      logError(new Error('Plan info missing'), { accion: 'handleSubmit' });
      return;
    }

    setUploading(true);

    try {
      let url = 'https://via.placeholder.com/300?text=Comprobante';
      
      if (file) {
        const sanitizedFileName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .substring(0, 100);
        
        const storageRef = ref(
          storage,
          `comprobantes/${Date.now()}_${sanitizedFileName}`
        );
        
        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'pagos'), {
        planId: plan.id,
        monto: plan.precio,
        receiptUrl: url,
        status: 'pendiente',
        createdAt: new Date(),
      });

      if (onSuccess) onSuccess();
      onClose();
      alert('¡Comprobante enviado! El equipo lo revisará pronto.');
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
