import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const PerfilEmpresaPublica = () => {
  const { empresaId } = useParams();
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar información de la empresa
  useEffect(() => {
    if (!empresaId) return;

    const cargarEmpresa = async () => {
      try {
        const empresaRef = doc(db, 'empresas', empresaId);
        const snap = await getDoc(empresaRef);

        if (snap.exists()) {
          setEmpresa({ id: snap.id, ...snap.data() });
        } else {
          setError("Empresa no encontrada");
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar la empresa");
      } finally {
        setLoading(false);
      }
    };

    cargarEmpresa();
  }, [empresaId]);

  // Cargar promociones de la empresa
  useEffect(() => {
    if (!empresaId) return;

    const q = query(
      collection(db, 'promociones'),
      where('empresaId', '==', empresaId),
      where('activa', '==', true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setPromociones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [empresaId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-cyan-400">
        Cargando perfil de la empresa...
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-red-400">
        <p className="text-xl mb-4">{error || "Empresa no encontrada"}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-colors"
        >
          ← Volver
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-12">
      {/* Header */}
      <div className="bg-[#1e2937] border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold">{empresa.nombre || empresa.negocio || 'Empresa'}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Información de la Empresa */}
          <div className="lg:col-span-4">
            <div className="bg-[#1e2937] rounded-3xl p-8 border border-gray-700 text-center">
              <div className="w-40 h-40 mx-auto bg-gray-800 rounded-2xl overflow-hidden mb-6 border-4 border-gray-600">
                {empresa.logo ? (
                  <img 
                    src={empresa.logo} 
                    alt={empresa.nombre} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl">🏪</div>
                )}
              </div>

              <h2 className="text-3xl font-bold mb-4">
                {empresa.nombre || empresa.negocio}
              </h2>

              {empresa.direccion && <p className="text-gray-400 mb-2">📍 {empresa.direccion}</p>}
              {empresa.telefono && <p className="text-gray-400 mb-2">📞 {empresa.telefono}</p>}
              {empresa.horarios && <p className="text-gray-400">🕒 {empresa.horarios}</p>}

              {empresa.descripcion && (
                <p className="mt-8 text-gray-300 text-left leading-relaxed">
                  {empresa.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Promociones */}
          <div className="lg:col-span-8">
            <h3 className="text-2xl font-semibold mb-6">
              Promociones Activas <span className="text-cyan-400">({promociones.length})</span>
            </h3>

            {promociones.length === 0 ? (
              <div className="bg-[#1e2937] rounded-3xl p-16 text-center">
                <p className="text-gray-400 text-xl">
                  Esta empresa no tiene promociones activas en este momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promociones.map((promo) => (
                  <div key={promo.id} className="promo-card bg-[#1e2937] rounded-2xl p-6 border border-gray-700">
                    <h4 className="text-xl font-bold mb-3">{promo.titulo}</h4>
                    <p className="text-gray-400 mb-4 line-clamp-3">{promo.descripcion}</p>
                    
                    {promo.descuento && (
                      <div className="text-4xl font-bold text-cyan-400 mb-4">
                        -{promo.descuento}%
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Válido hasta: {promo.fechaFin?.toDate 
                        ? new Date(promo.fechaFin.toDate()).toLocaleDateString('es-ES') 
                        : 'Sin fecha'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilEmpresaPublica;