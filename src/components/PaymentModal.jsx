import { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

  // Load admin account info from Firestore (admin/info single doc)
  useEffect(() => {
    const fetchInfo = async () => {
      const infoSnap = await getDoc(doc(db, 'admin', 'info'));
      if (infoSnap.exists()) {
        setAdminInfo(infoSnap.data());
      }
    };
    fetchInfo();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Selecciona una imagen del comprobante.');
      return;
    }
    setUploading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `comprobantes/${plan.id}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Create payment record
      await addDoc(collection(db, 'pagos'), {
        empresaId: plan.empresaId,
        planId: plan.id,
        monto: plan.precio,
        receiptUrl: url,
        status: 'espera', // waiting for admin confirmation
        createdAt: new Date(),
      });

      // Update parent state first to ensure modal disappears
      if (onSuccess) onSuccess();
      onClose();
      
      alert('¡Comprobante enviado con éxito! El administrador revisará tu pago pronto.');
    } catch (err) {
      console.error('Error uploading receipt:', err);
      alert('Hubo un error al enviar el comprobante. Por favor intenta de nuevo.');
    }
    setUploading(false);
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirmar Pago - {plan?.nombre}</h2>
        <p className="plan-precio-display">Precio: ${plan?.precio}/mes</p>
        <section className="admin-info">
          <h3>Datos de la cuenta del administrador</h3>
          <p><strong>Nombre:</strong> {adminInfo.nombre}</p>
          <p><strong>RUC:</strong> {adminInfo.ruc}</p>
          <p><strong>Número de cuenta:</strong> {adminInfo.numeroCuenta}</p>
        </section>
        <section className="receipt-upload">
          <h3>Sube el comprobante de pago</h3>
          <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
          {preview && <img src={preview} alt="Preview" className="receipt-preview" />}
        </section>
        <div className="modal-actions">
          <button onClick={onClose} disabled={uploading}>Cancelar</button>
          <button onClick={handleSubmit} disabled={uploading}>Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
