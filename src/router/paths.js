export const PATHS = {
  // Públicas
  home: '/',
  locales: '/locales',
  mapa: '/mapa',
  login: '/login',
  registro: '/registro',
  empresaPublica: '/empresa/:empresaId',

  // Cliente
  cliente: {
    dashboard: '/cliente/dashboard',
    perfil: '/cliente/perfil',
    favoritos: '/cliente/favoritos',
    tickets: '/cliente/tickets',
    detalleTicket: '/cliente/tickets/:ticketId',
  },

  // Empresa
  empresa: {
    dashboard: '/empresa/dashboard',
    perfil: '/empresa/perfil',
    gestionarPromociones: '/empresa/gestionar-promociones',
    crearPromocion: '/empresa/gestionar-promociones/crear',
    editarPromocion: '/empresa/gestionar-promociones/:promocionId/editar',
    canjearTickets: '/empresa/canjear-tickets',
    suscripcion: '/empresa/suscripcion',
    detalleTicket: '/empresa/tickets/:ticketId',
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    empresas: '/admin/empresas',
    detalleEmpresa: '/admin/empresas/:empresaId',
    usuarios: '/admin/usuarios',
    detalleUsuario: '/admin/usuarios/:usuarioId',
    promociones: '/admin/promociones',
    reportes: '/admin/reportes',
  },
};

// Funciones para rutas dinámicas
export const getEmpresaPath = (id) => `/empresa/${id}`;
export const getEditarPromocionPath = (id) => `/empresa/gestionar-promociones/${id}/editar`;
export const getTicketClientePath = (id) => `/cliente/tickets/${id}`;
export const getTicketEmpresaPath = (id) => `/empresa/tickets/${id}`;
export const getDetalleEmpresaAdminPath = (id) => `/admin/empresas/${id}`;
export const getDetalleUsuarioAdminPath = (id) => `/admin/usuarios/${id}`;