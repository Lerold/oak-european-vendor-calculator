export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="Oaklease" className="footer-logo" />
          <p className="footer-text">
            Oaklease Ltd — European Equipment Leasing Solutions
          </p>
        </div>
        <div className="footer-links">
          <a
            href="https://oaklease.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            oaklease.co.uk
          </a>
          <a href="/faq" className="footer-link">FAQ</a>
          <a
            href="https://oaklease.co.uk/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Privacy Policy
          </a>
        </div>
        <p className="footer-copyright">&copy; Oaklease Ltd 2026</p>
      </div>
    </footer>
  );
}
