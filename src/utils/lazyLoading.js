/**
 * Configuración de Code Splitting y Lazy Loading
 * Importa componentes de forma lazy para mejorar performance
 */

import { lazy, Suspense } from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    fontSize: '16px',
    color: '#999',
  }}>
    <div>Cargando...</div>
  </div>
);

/**
 * Componentes con lazy loading
 */
export const ClienteDashboardLazy = lazy(() =>
  import('./components/ClienteDashboard').then(m => ({ default: m.default }))
);

export const EmpresaDashboardLazy = lazy(() =>
  import('./components/EmpresaDashboard').then(m => ({ default: m.default }))
);

export const AdminDashboardLazy = lazy(() =>
  import('./components/AdminDashboard').then(m => ({ default: m.default }))
);

export const GestorPromocionesLazy = lazy(() =>
  import('./components/GestorPromociones').then(m => ({ default: m.default }))
);

export const PerfilEmpresaPublicaLazy = lazy(() =>
  import('./components/PerfilEmpresaPublica').then(m => ({ default: m.default }))
);

/**
 * Envuelve componentes lazy con Suspense
 */
export const withLazyLoading = (Component, fallback = <LoadingFallback />) => {
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};
