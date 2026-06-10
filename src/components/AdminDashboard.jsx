import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, onSnapshot, addDoc, getDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { logError } from '../utils/errorHandler';

const AdminDashboard = () => {
  const { user, userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [empresasAprobadas, setEmpresasAprobadas] = useState([]);
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [todasPromociones, setTodasPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('solicitudes');

  // Estado para estadísticas
  const [stats, setStats] = useState({ totalTickets: 0, totalEmpresas: 0, totalPromos: 0 });

  useEffect(() => {
    cargarSolicitudes();
    cargarEmpresasAprobadas();
    const pagosRef = query(collection(db, 'pagos'), where('status', '==', 'espera'));
    const unsubscribe = onSnapshot(pagosRef, async (snapshot) => {
      const pagosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch company names for each payment
      const pagosConNombre = await Promise.all(pagosData.map(async (pago) => {
        try {
          const empresaDoc = await getDoc(doc(db, 'empresa', pago.empresaId));
          return { ...pago, empresaNombre: empresaDoc.exists() ? empresaDoc.data().negocio : 'Empresa desconocida' };
        } catch (error) {
          return { ...pago, empresaNombre: 'Error al cargar nombre' };
        }
      }));
      
      setPagosPendientes(pagosConNombre);
    }, (error) => {
      logError(error, { accion: 'escucharPagos', componente: 'AdminDashboard' });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'estadisticas') {
      cargarEstadisticas();
    }
    if (activeTab === 'promociones') {
      cargarTodasPromociones();
    }
  }, [activeTab]);

  const cargarEstadisticas = async () => {
    try {
      const [ticketsSnap, empresasSnap, promosSnap] = await Promise.all([
        getDocs(collection(db, 'tickets')),
        getDocs(collection(db, 'empresa')),
        getDocs(collection(db, 'promociones'))
      ]);
      setStats({
        totalTickets: ticketsSnap.size,
        totalEmpresas: empresasSnap.size,
        totalPromos: promosSnap.size
      });
    } catch (error) {
      logError(error, { accion: 'cargarEstadisticas', componente: 'AdminDashboard' });
    }
  };

  const cargarTodasPromociones = async () => {
    try {
      const q = query(collection(db, 'promociones'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setTodasPromociones(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      logError(error, { accion: 'cargarTodasPromociones', componente: 'AdminDashboard' });
    }
  };

  const cargarSolicitudes = async () => {
    try {
      // Buscar empresas en estado 'pendiente' en la colección empresa
      const q = query(
        collection(db, 'empresa'),
        where('estado', '==', 'pendiente')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSolicitudes(data);
    } catch (error) {
      logError(error, { accion: 'cargarSolicitudes', componente: 'AdminDashboard' });
    }
    setLoading(false);
  };

  const cargarEmpresasAprobadas = async () => {
    try {
      const q = query(
        collection(db, 'empresa'),
        where('estado', '==', 'aprobado')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpresasAprobadas(data);
    } catch (error) {
      logError(error, { accion: 'cargarEmpresasAprobadas', componente: 'AdminDashboard' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const aprobarSolicitud = async (empresaId) => {
    try {
      await updateDoc(doc(db, 'empresa', empresaId), {
        estado: 'aprobado'
      });
      const empresaAprobada = solicitudes.find(s => s.id === empresaId);
      setSolicitudes(solicitudes.filter(s => s.id !== empresaId));
      if (empresaAprobada) {
        setEmpresasAprobadas(prev => [...prev, { ...empresaAprobada, estado: 'aprobado' }]);
      }
    } catch (error) {
      logError(error, { accion: 'aprobarSolicitud', empresaId, componente: 'AdminDashboard' });
    }
  };

  const eliminarEmpresa = async (empresaId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta empresa? Se borrarán sus datos permanentemente.')) return;
    try {
      await deleteDoc(doc(db, 'empresa', empresaId));
      setEmpresasAprobadas(empresasAprobadas.filter(e => e.id !== empresaId));
      alert('Empresa eliminada correctamente');
    } catch (error) {
      logError(error, { accion: 'eliminarEmpresa', empresaId, componente: 'AdminDashboard' });
      alert('Error al eliminar la empresa');
    }
  };

  const eliminarPromocionAdmin = async (promocionId) => {
    if (!window.confirm('¿Deseas eliminar esta promoción permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'promociones', promocionId));
      setTodasPromociones(todasPromociones.filter(p => p.id !== promocionId));
      alert('Promoción eliminada');
    } catch (error) {
      logError(error, { accion: 'eliminarPromocionAdmin', promocionId, componente: 'AdminDashboard' });
      alert('Error al eliminar la promoción');
    }
  };

  const handleApprovePago = async (pago) => {
    try {
      // 1. Actualizar el estado del pago
      await updateDoc(doc(db, 'pagos', pago.id), { status: 'aprobado' });

      // 2. Crear la suscripción para la empresa
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // 30 días de duración

      await addDoc(collection(db, 'suscripciones'), {
        empresaId: pago.empresaId,
        plan: pago.planId,
        estado: 'activa',
        precio: pago.monto,
        duracion: 30,
        fechaInicio: new Date(),
        fechaVencimiento: fechaVencimiento,
        metodoPago: 'transferencia',
        renovacionAutomatica: true,
        createdAt: new Date(),
      });

      alert('Pago aprobado y suscripción activada');
    } catch (error) {
      logError(error, { accion: 'aprobarPago', pagoId: pago.id, componente: 'AdminDashboard' });
      alert('Error al aprobar el pago');
    }
  };

  const rechazarSolicitud = async (empresaId, motivo) => {
    try {
      await updateDoc(doc(db, 'empresa', empresaId), {
        estado: 'rechazado',
        motivoRechazo: motivo
      });
      setSolicitudes(solicitudes.filter(s => s.id !== empresaId));
    } catch (error) {
      logError(error, { accion: 'rechazarSolicitud', empresaId, componente: 'AdminDashboard' });
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administrador</h1>
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'solicitudes' ? 'active' : ''}`}
          onClick={() => setActiveTab('solicitudes')}
        >
          📋 Solicitudes Pendientes ({solicitudes.length})
        </button>
          <button 
            className={`tab ${activeTab === 'empresas' ? 'active' : ''}`}
            onClick={() => setActiveTab('empresas')}
          >
            🏢 Empresas Aprobadas
          </button>
          <button 
            className={`tab ${activeTab === 'suscripciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('suscripciones')}
          >
            💳 Suscripciones ({pagosPendientes.length})
          </button>
          <button 
            className={`tab ${activeTab === 'promociones' ? 'active' : ''}`}
            onClick={() => setActiveTab('promociones')}
          >
            📢 Promociones
          </button>
          <button 
            className={`tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
            onClick={() => setActiveTab('estadisticas')}
          >
            📊 Estadísticas
          </button>
      </div>

      <div className="admin-content">
        {activeTab === 'solicitudes' && (
          <div className="solicitudes-section">
            <h2>Solicitudes Pendientes de Aprobación</h2>
            
            {loading ? (
              <p>Cargando...</p>
            ) : solicitudes.length === 0 ? (
              <p className="info-texto">No hay solicitudes pendientes</p>
            ) : (
              <div className="solicitudes-list">
                {solicitudes.map(solicitud => (
                  <div key={solicitud.id} className="solicitud-card">
                    <div className="solicitud-info">
                      <h3>{solicitud.negocio}</h3>
                      <p><strong>Propietario:</strong> {solicitud.nombre}</p>
                      <p><strong>Email:</strong> {solicitud.email}</p>
                      <p><strong>Teléfono:</strong> {solicitud.telefono || 'No proporcionado'}</p>
                      <p><strong>Categoría:</strong> {solicitud.categoria}</p>
                      <p><strong>Dirección:</strong> {solicitud.direccion}</p>
                      <p><strong>RUC:</strong> {solicitud.ruc}</p>
                      <p><strong>Fecha de registro:</strong> {new Date(solicitud.createdAt.toDate()).toLocaleDateString()}</p>
                    </div>
                    <div className="solicitud-actions">
                      <button 
                        onClick={() => aprobarSolicitud(solicitud.id)}
                        className="btn-approve"
                      >
                        ✅ Aprobar
                      </button>
                      <button 
                        onClick={() => {
                          const motivo = prompt('¿Cuál es el motivo del rechazo?');
                          if (motivo) rechazarSolicitud(solicitud.id, motivo);
                        }}
                        className="btn-reject"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'empresas' && (
          <div className="empresas-section">
            <h2>Empresas Aprobadas</h2>
            {empresasAprobadas.length === 0 ? (
              <p className="info-texto">No hay empresas aprobadas por el momento.</p>
            ) : (
              <div className="solicitudes-list">
                {empresasAprobadas.map(empresa => (
                  <div key={empresa.id} className="solicitud-card" style={{ borderLeftColor: '#4CAF50' }}>
                    <div className="solicitud-info">
                      <h3>{empresa.negocio}</h3>
                      <p><strong>Propietario:</strong> {empresa.nombre}</p>
                      <p><strong>Email:</strong> {empresa.email}</p>
                      <p><strong>Teléfono:</strong> {empresa.telefono || 'No proporcionado'}</p>
                      <p><strong>Categoría:</strong> {empresa.categoria}</p>
                      <p><strong>Dirección:</strong> {empresa.direccion}</p>
                      <p><strong>RUC:</strong> {empresa.ruc}</p>
                      <p><strong>Aprobado desde:</strong> {empresa.createdAt ? new Date(empresa.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="solicitud-actions">
                      <Link 
                        to={`/empresa/${empresa.id}`}
                        className="btn-approve"
                        style={{ textDecoration: 'none', textAlign: 'center', backgroundColor: '#2196F3' }}
                      >
                        🔎 Perfil
                      </Link>
                      <button 
                        onClick={() => eliminarEmpresa(empresa.id)}
                        className="btn-reject"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'promociones' && (
          <div className="promociones-admin-section">
            <h2>Gestión Global de Promociones</h2>
            {todasPromociones.length === 0 ? (
              <p className="info-texto">No hay promociones activas.</p>
            ) : (
              <div className="solicitudes-list">
                {todasPromociones.map(promo => (
                  <div key={promo.id} className="solicitud-card">
                    <div className="solicitud-info">
                      <h3>{promo.titulo}</h3>
                      <p><strong>Empresa:</strong> {promo.empresaNombre}</p>
                      <p><strong>Descuento:</strong> {promo.descuento}%</p>
                      <p><strong>Creada:</strong> {promo.createdAt ? new Date(promo.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="solicitud-actions">
                      <Link 
                        to={`/empresa/${promo.empresaId}`}
                        className="btn-approve"
                        style={{ textDecoration: 'none', textAlign: 'center', backgroundColor: '#2196F3' }}
                      >
                        🏢 Empresa
                      </Link>
                      <button 
                        onClick={() => eliminarPromocionAdmin(promo.id)}
                        className="btn-reject"
                      >
                        🗑️ Borrar Promoción
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suscripciones' && (
          <div className="pagos-section">
            <h2>Gestión de Suscripciones y Pagos</h2>
            <p className="info-sub">Revisa los comprobantes de transferencia y aprueba las suscripciones.</p>
            
            {pagosPendientes.length === 0 ? (
              <p className="info-texto">No hay pagos pendientes de revisión en este momento.</p>
            ) : (
              <div className="pagos-list">
                {pagosPendientes.map(pago => (
                  <div key={pago.id} className="pago-card" style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '8px', 
                    padding: '1.5rem', 
                    marginBottom: '1rem',
                    backgroundColor: '#f9f9f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0' }}>{pago.empresaNombre}</h3>
                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>ID: {pago.empresaId}</p>
                      </div>
                      <span style={{ 
                        backgroundColor: '#fff3e0', 
                        color: '#ef6c00', 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>Pendiente</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                      <div>
                        <p><strong>Plan solicitado:</strong> {pago.planId}</p>
                        <p><strong>Monto a validar:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>${pago.monto}</span></p>
                        <p><strong>Fecha:</strong> {pago.createdAt?.toDate?.() ? new Date(pago.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ marginBottom: '5px' }}><strong>Comprobante:</strong></p>
                        <a href={pago.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={pago.receiptUrl} 
                            alt="Comprobante" 
                            style={{ 
                              maxWidth: '150px', 
                              borderRadius: '4px', 
                              border: '1px solid #ccc',
                              cursor: 'zoom-in',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} 
                          />
                        </a>
                      </div>
                    </div>

                    <div className="pago-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button 
                        onClick={() => handleApprovePago(pago)} 
                        className="btn-approve"
                        style={{ flex: '1', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        ✅ Aprobar y Activar Suscripción
                      </button>
                      <button 
                        onClick={async () => {
                          const motivo = prompt('Motivo del rechazo:');
                          if (motivo) {
                            await updateDoc(doc(db, 'pagos', pago.id), { status: 'rechazado', motivo });
                          }
                        }} 
                        className="btn-reject"
                        style={{ padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'estadisticas' && (
          <div className="estadisticas-section">
            <h2>Estadísticas del Sistema</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div className="stat-card" style={{ padding: '20px', background: '#e3f2fd', borderRadius: '12px', textAlign: 'center' }}>
                <h3>🎟️ Tickets Generados</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{stats.totalTickets}</p>
              </div>
              <div className="stat-card" style={{ padding: '20px', background: '#e8f5e9', borderRadius: '12px', textAlign: 'center' }}>
                <h3>🏢 Empresas Totales</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>{stats.totalEmpresas}</p>
              </div>
              <div className="stat-card" style={{ padding: '20px', background: '#fff3e0', borderRadius: '12px', textAlign: 'center' }}>
                <h3>📢 Promos Activas</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>{stats.totalPromos}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
