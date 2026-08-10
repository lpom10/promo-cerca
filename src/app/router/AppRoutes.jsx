import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PATHS } from '../../router/paths';
import { Spinner } from '../../shared/ui';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import PublicLayout from '../../shared/layout/PublicLayout';
import ProtectedLayout from '../../shared/layout/ProtectedLayout';
import { lazyLoadComponent } from '../../shared/utils/lazyLoad';

const HomePage = lazyLoadComponent(() => import('../../modules/public/pages/HomePage.jsx'), 'HomePage');
const LocalesPage = lazyLoadComponent(() => import('../../modules/public/pages/LocalesPage.jsx'), 'LocalesPage');
const MapaPage = lazyLoadComponent(() => import('../../modules/public/pages/MapaPage.jsx'), 'MapaPage');
const PerfilEmpresaPublica = lazyLoadComponent(() => import('../../modules/public/pages/PerfilEmpresaPublicaPage.jsx'), 'PerfilEmpresaPublica');
const LoginPage = lazyLoadComponent(() => import('../../modules/auth/pages/LoginPage.jsx'), 'LoginPage');
const RegistroPage = lazyLoadComponent(() => import('../../modules/auth/pages/RegistroPage.jsx'), 'RegistroPage');
const ClienteDashboard = lazyLoadComponent(() => import('../../modules/cliente/pages/ClienteDashboard.jsx'), 'ClienteDashboard');
const PerfilClientePage = lazyLoadComponent(() => import('../../modules/cliente/pages/PerfilClientePage.jsx'), 'PerfilClientePage');
const EmpresaDashboardPage = lazyLoadComponent(() => import('../../modules/empresa/pages/EmpresaDashboardPage.jsx'), 'EmpresaDashboardPage');
const PerfilEmpresa = lazyLoadComponent(() => import('../../modules/empresa/components/PerfilEmpresa/PerfilEmpresa.jsx'), 'PerfilEmpresa');
const GestorPromocionesPage = lazyLoadComponent(() => import('../../modules/empresa/pages/GestorPromocionesPage.jsx'), 'GestorPromocionesPage');
const CanjeTicketsPage = lazyLoadComponent(() => import('../../modules/empresa/pages/CanjeTicketsPage.jsx'), 'CanjeTicketsPage');
const AdminDashboardPage = lazyLoadComponent(() => import('../../modules/admin/pages/AdminDashboardPage.jsx'), 'AdminDashboardPage');

const withSuspense = (element) => (
  <Suspense fallback={<Spinner fullScreen />}>{element}</Suspense>
);

const AppRoutes = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path={PATHS.home} element={withSuspense(<HomePage />)} />
      <Route path={PATHS.locales} element={withSuspense(<LocalesPage />)} />
      <Route path={PATHS.mapa} element={withSuspense(<MapaPage />)} />
      <Route path={PATHS.login} element={withSuspense(<LoginPage />)} />
      <Route path={PATHS.registro} element={withSuspense(<RegistroPage />)} />
      <Route path={PATHS.empresaPublica} element={withSuspense(<PerfilEmpresaPublica />)} />
    </Route>

    <Route element={<ProtectedLayout />}>
      <Route element={<ProtectedRoute />}>
        <Route path={PATHS.cliente.perfil} element={withSuspense(<PerfilClientePage />)} />
        <Route path={PATHS.cliente.dashboard} element={withSuspense(<ClienteDashboard />)} />

        <Route element={<RoleGuard allowedRoles={['empresa']} />}>
          <Route path={PATHS.empresa.dashboard} element={withSuspense(<EmpresaDashboardPage />)} />
          <Route path={PATHS.empresa.perfil} element={withSuspense(<PerfilEmpresa />)} />
          <Route path={PATHS.empresa.gestionarPromociones} element={withSuspense(<GestorPromocionesPage />)} />
          <Route path={PATHS.empresa.canjearTickets} element={withSuspense(<CanjeTicketsPage />)} />
        </Route>

        <Route element={<RoleGuard allowedRoles={['admin']} />}>
          <Route path={PATHS.admin.dashboard} element={withSuspense(<AdminDashboardPage />)} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to={PATHS.home} replace />} />
  </Routes>
);

export default AppRoutes;
