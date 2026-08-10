import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PATHS } from '../../../router/paths';
import { getDashboardPathByRole } from '../../../router/dashboardPaths';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, userType, userStatus } = useAuth();

  const dashboardPath =
    userType === 'empresa' && userStatus !== 'aprobado'
      ? PATHS.empresa.perfil
      : getDashboardPathByRole(userType) || PATHS.home;

  return (
    <nav className={styles.navbar}>
      <Link to={PATHS.home} className={styles.titulo}>
        Promo Cerca
      </Link>

      <div className={styles.links}>
        <NavLink to={PATHS.home}>Inicio</NavLink>
        <NavLink to={PATHS.locales}>Locales</NavLink>
        <NavLink to={PATHS.mapa}>Mapa</NavLink>
      </div>

      <div className={styles.auth}>
        {user ? (
          <>
            <NavLink to={dashboardPath}>Perfil</NavLink>
            {userType === 'empresa' && (
              <>
                <NavLink to={PATHS.empresa.canjearTickets}>Canjear Tickets</NavLink>
                <NavLink to={PATHS.empresa.gestionarPromociones}>Gestionar Promociones</NavLink>
              </>
            )}
          </>
        ) : (
          <>
            <NavLink to={PATHS.login}>Iniciar Sesión</NavLink>
            <NavLink to={PATHS.registro}>Registrarse</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;