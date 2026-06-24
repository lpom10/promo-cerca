import { Outlet } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Footer from './Footer/Footer';

const ProtectedLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <Footer />
  </>
);

export default ProtectedLayout;
