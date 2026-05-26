import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleError, logError } from '../utils/errorHandler';
import '../styles/paymentModal.css';

/**
 * PaymentModal
 * Props:
 *  - visible (boolean): show/hide modal
 *  - onClose (function): callback to close modal
 *  - plan (object): selected plan details {id, nombre, precio, duracion}
 */
const PaymentModal = ({ visible, onClose, plan, onSuccess }) => {
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
        // No mostrar error al usuario aquí
      }
    };
    
    if (visible) {
      fetchInfo();
    }
  }, [visible]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError(null);

    if (!selected) return;

    // Validar tamaño (máximo 5MB)
    if (selected.size > 5 * 1024 * 1024) {
      setError('El archivo no debe exceder 5MB');
      return;
    }

    // Validar tipo
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

    if (!file) {
      setError('Por favor selecciona una imagen del comprobante');
      return;
    }

    if (!plan || !plan.id || !plan.empresaId) {
      setError('Error: Información del plan incompleta');
      logError(new Error('Plan info missing'), { accion: 'handleSubmit' });
      return;
    }

    setUploading(true);

    try {
      // Validar que el archivo aún existe
      if (!file) throw new Error('Archivo no encontrado');

      // Upload a Storage con nombre seguro
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100);
      
      const storageRef = ref(
        storage,
        `comprobantes/${plan.empresaId}_${Date.now()}_${sanitizedFileName}`
      );
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Crear registro de pago
      await addDoc(collection(db, 'pagos'), {
        empresaId: plan.empresaId,
        planId: plan.id,
        monto: plan.precio,
        receiptUrl: url,
        status: 'pendiente',
        createdAt: new Date(),
      });

      if (onSuccess) onSuccess();
      onClose();
      
      // Mensaje de éxito sin detalles técnicos
      alert('¡Comprobante enviado! El equipo lo revisará pronto.');
    } catch (err) {
      const errorInfo = handleError(err, { accion: 'payment_upload' });
      setError(errorInfo.mensaje);
    } finally {
      setUploading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirmar Pago - {plan?.nombre}</h2>
        <p className="plan-precio-display">Precio: ${plan?.precio}/mes</p>
        
        {error && (
          <div className="error-message" style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fee',
            borderLeft: '3px solid #f55',
            borderRadius: '4px',
            color: '#c00',
            fontSize: '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <section className="admin-info">
          <h3>Datos de la cuenta del administrador</h3>
          <p><strong>Nombre:</strong> {adminInfo.nombre || '—'}</p>
          <p><strong>RUC:</strong> {adminInfo.ruc || '—'}</p>
          <p><strong>Número de cuenta:</strong> {adminInfo.numeroCuenta || '—'}</p>
        </section>
        
        <section className="receipt-upload">
          <h3>Sube el comprobante de pago</h3>
          <input 
            type="file" 
            accept="image/png, image/jpeg" 
            onChange={handleFileChange}
            disabled={uploading}
          />
          {preview && <img src={preview} alt="Preview" className="receipt-preview" />}
        </section>
        
        <div className="modal-actions">
          <button onClick={onClose} disabled={uploading}>Cancelar</button>
          <button 
            onClick={handleSubmit} 
            disabled={uploading || !file}
            style={{ opacity: uploading || !file ? 0.5 : 1 }}
          >
            {uploading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
