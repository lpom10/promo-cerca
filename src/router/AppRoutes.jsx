import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';
import AuthGuard from './guards/AuthGuard';
import RoleGuard from './guards/RoleGuard';
import StatusGuard from './guards/StatusGuard';
import { Spinner } from '../shared/ui';
import PublicLayout from '../shared/layout/PublicLayout';
import ProtectedLayout from '../shared/layout/ProtectedLayout';

const HomePage             = React.lazy(() => import('../modules/public/pages/HomePage.jsx'));
const LocalesPage          = React.lazy(() => import('../modules/public/pages/LocalesPage.jsx'));
const MapaPage             = React.lazy(() => import('../modules/public/pages/MapaPage.jsx'));
const PerfilEmpresaPublica = React.lazy(() => import('../modules/public/pages/PerfilEmpresaPublicaPage'));
const LoginPage            = React.lazy(() => import('../modules/auth/pages/LoginPage.jsx'));
const RegistroPage         = React.lazy(() => import('../modules/auth/pages/RegistroPage.jsx'));
const ClienteDashboard     = React.lazy(() => import('../modules/cliente/pages/ClienteDashboard.jsx'));
const PerfilClientePage    = React.lazy(() => import('../modules/cliente/pages/PerfilClientePage.jsx'));
const EmpresaDashboardPage   = React.lazy(() => import('../modules/empresa/pages/EmpresaDashboardPage.jsx'));
const GestorPromocionesPage  = React.lazy(() => import('../modules/empresa/pages/GestorPromocionesPage.jsx'));
const CanjeTicketsPage       = React.lazy(() => import('../modules/empresa/pages/CanjeTicketsPage.jsx'));
const AdminDashboardPage   = React.lazy(() => import('../modules/admin/pages/AdminDashboardPage.jsx'));

const lazy = (el) => <Suspense fallback={<Spinner fullScreen />}>{el}</Suspense>;

const AppRoutes = () => (
  <Routes>
    {/* ── Públicas (Navbar + Footer via PublicLayout) ───────────────────── */}
    <Route element={<PublicLayout />}>
      <Route path={PATHS.home}          element={lazy(<HomePage />)} />
      <Route path={PATHS.locales}       element={lazy(<LocalesPage />)} />
      <Route path={PATHS.mapa}          element={lazy(<MapaPage />)} />
      <Route path={PATHS.login}         element={lazy(<LoginPage />)} />
      <Route path={PATHS.registro}      element={lazy(<RegistroPage />)} />
      <Route path={PATHS.empresaPublica} element={lazy(<PerfilEmpresaPublica />)} />

      {/* Perfil cliente con Navbar */}
      <Route path={PATHS.cliente.perfil}
        element={<AuthGuard><RoleGuard allowedRoles={['cliente']}>{lazy(<PerfilClientePage />)}</RoleGuard></AuthGuard>}
      />
    </Route>

    {/* ── Rutas protegidas con Navbar ───────────────────────────────── */}
    <Route element={<ProtectedLayout />}>
      {/* Cliente */}
      <Route path={PATHS.cliente.dashboard}
        element={<AuthGuard><RoleGuard allowedRoles={['cliente']}>{lazy(<ClienteDashboard />)}</RoleGuard></AuthGuard>}
      />
      <Route path={PATHS.cliente.perfil}
        element={<AuthGuard><RoleGuard allowedRoles={['cliente']}>{lazy(<PerfilClientePage />)}</RoleGuard></AuthGuard>}
      />

      {/* Empresa */}
      <Route path={PATHS.empresa.dashboard}
        element={<AuthGuard><RoleGuard allowedRoles={['empresa']}><StatusGuard requiredStatus="aprobado">{lazy(<EmpresaDashboardPage />)}</StatusGuard></RoleGuard></AuthGuard>}
      />
      <Route path={PATHS.empresa.gestionarPromociones}
        element={<AuthGuard><RoleGuard allowedRoles={['empresa']}><StatusGuard requiredStatus="aprobado">{lazy(<GestorPromocionesPage />)}</StatusGuard></RoleGuard></AuthGuard>}
      />
      <Route path={PATHS.empresa.canjearTickets}
        element={<AuthGuard><RoleGuard allowedRoles={['empresa']}><StatusGuard requiredStatus="aprobado">{lazy(<CanjeTicketsPage />)}</StatusGuard></RoleGuard></AuthGuard>}
      />

      {/* Admin */}
      <Route path={PATHS.admin.dashboard}
        element={<AuthGuard><RoleGuard allowedRoles={['admin']}>{lazy(<AdminDashboardPage />)}</RoleGuard></AuthGuard>}
      />
    </Route>

    <Route path="*" element={<Navigate to={PATHS.home} replace />} />
  </Routes>
);

export default AppRoutes;