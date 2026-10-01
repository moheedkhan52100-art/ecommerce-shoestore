import { Link } from "react-router-dom";

function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="footer-links-grid">
        <section>
          <h3>SHOP</h3>
          <Link to="/shop">Men&apos;s Shoes</Link>
          <Link to="/shop">Women&apos;s Shoes</Link>
          <Link to="/shop">Kids&apos; Shoes</Link>
          <Link to="/shop">Brands</Link>
          <Link to="/shop">Shoes Sale</Link>
          <Link to="/shop">Accessories</Link>
          <Link to="/shop">Bags</Link>
        </section>
        <section>
          <h3>COMPANY</h3>
          <Link to="/">About Khan Shoes</Link>
          <Link to="/support">Careers</Link>
          <Link to="/support">FAQs</Link>
          <Link to="/support">Store Locator</Link>
          <Link to="/support">Loyalty Program</Link>
          <Link to="/support">Contact Us</Link>
        </section>
        <section>
          <h3>MORE INFO</h3>
          <Link to="/support">Secure Shopping</Link>
          <Link to="/support">Shipping &amp; Return Policy</Link>
          <Link to="/support">Product Claim Policy</Link>
          <Link to="/support">Terms &amp; Conditions</Link>
          <Link to="/support">Privacy Policy</Link>
          <Link to="/support">Sitemap</Link>
          <Link to="/support">Blogs</Link>
        </section>
        <section>
          <h3>PARTNERS</h3>
          <a href="https://www.mochishoes.com/" target="_blank" rel="noreferrer">Mochi Shoes</a>
          <a href="https://www.walkwayshoes.com/" target="_blank" rel="noreferrer">Walkway Shoes</a>
          <a href="https://fitflop.com/" target="_blank" rel="noreferrer">FitFlop</a>
          <a href="https://www.fila.com/" target="_blank" rel="noreferrer">Fila India</a>
          <a href="https://www.clarks.in/" target="_blank" rel="noreferrer">Clarks India</a>
        </section>
      </div>

      <div className="footer-bottom">
        <section>
          <h3>PAYMENT METHOD</h3>
          <div className="payment-partners" aria-label="Payment method">
            <span>Cash on delivery</span>
          </div>
        </section>
        <section className="footer-socials">
          <h3>FOLLOW US</h3>
          <div>
            <a href="https://facebook.com" aria-label="Facebook">f</a>
            <a href="https://instagram.com" aria-label="Instagram">◎</a>
            <a href="https://twitter.com" aria-label="Twitter">♥</a>
            <a href="https://youtube.com" aria-label="YouTube">▶</a>
          </div>
        </section>
        <div className="footer-contact">
          <a href="tel:+919876543210">Phone: +91 98765 43210</a>
          <span>GSTIN: 27AABCU9603R1ZM</span>
        </div>
      </div>
    </footer>
  );
}

export default StoreFooter;