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
                <h3>Contáctanos</h3>
                <a href="https://www.google.com/maps/place/Parque+Cientifico+UTPL/data=!4m2!3m1!1s0x0:0xf57adb9efbda3dfb?sa=X&ved=1t:2428&ictx=111">Parque Científico UTPL, Loja, Ecuador</a>
                <br>
                </br>
                <a href="tel:+593 95 865 7984">+593 95 865 7984</a>
                <br></br><a href="mailto:info@isbensolutions.com">info@isbensolutions.com</a>

            </div>
            <div className="footer-section-redes">
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