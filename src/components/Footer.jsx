import "../styles/Footer.css"

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
            <div className="footer-section">
                <h2>ISBEN SOLUTIONS</h2>
                <p>
                    En ISBEN SOLUTION, nos dedicamos a ofrecer soluciones tecnológicas
                    innovadoras y personalizadas que impulsan el crecimiento de tu negocio.
                </p>


            </div>
            <div className="footer-section">
                <h3>Navegación</h3>

                <ul>
                    <li>Inicio</li>
                    <li>Promociones</li>
                    <li>Mapa</li>
                    <li>Contacto</li>
                </ul>
            </div>
            <div className="footer-section">
                <h3>Contáctanos</h3>
                <p>Parque Científico UTPL, Loja, Ecuador</p>
                <p>+593 95 865 7984</p>
                <p>info@isbensolutions.com</p>

            </div>
            <div className="footer-section">
                <h3>Síguenos en nuestras redes sociales</h3>
                <ul>
                    <li>Facebook</li>
                    <li>Instagram</li>
                    <li>Twitter</li>
                    <li>LinkedIn</li>
                </ul>
            </div>
            </div>

            <div className="footer-bottom">
                &copy; 2024 ISBEN SOLUTIONS. Todos los derechos reservados.
            </div>
        </footer>
    );
};

export default Footer;