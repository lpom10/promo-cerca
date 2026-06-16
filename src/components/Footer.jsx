import "../styles/Footer.css"

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
            <div className="footer-section">
                <img src="https://isbensolution.com/images/logo-isben/logo.png" alt="ISBEN SOLUTIONS" height="40"/>
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
                <h3>Redes Sociales</h3>
                <div class="social-icons">
                    <a href="https://www.facebook.com/profile.php?id=61572436337788" target="_blank"><i class="fab fa-facebook"></i></a>
                    <a href="https://www.instagram.com/isben_solution" target="_blank"><i class="fab fa-instagram"></i></a>
                    <a href="https://wa.link/yaa9h4" target="_blank"><i class="fab fa-whatsapp"></i></a>
                    <a href="https://www.youtube.com/@ISBENSolution" target="_blank"><i class="fab fa-youtube"></i></a>
                </div>
            </div>
            </div>

            <div className="footer-bottom">
                &copy; 2024 ISBEN SOLUTIONS. Todos los derechos reservados.
            </div>
        </footer>
    );
};

export default Footer;