import { PATHS } from './paths';

export const getDashboardPathByRole = (userType) => {
  switch (userType) {
    case 'admin':
      return PATHS.admin.dashboard;
    case 'empresa':
      return PATHS.empresa.dashboard;
    case 'cliente':
      return PATHS.cliente.dashboard;
    default:
      return null;
  }
};
