import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/logo.png" alt="Oaklease" className="header-logo-img" />
          <span className="header-title">European Leasing Calculator</span>
        </Link>
        <nav className="header-nav">
          <Link to="/" className="header-link">Calculator</Link>
          <Link to="/faq" className="header-link">FAQ</Link>
        </nav>
      </div>
    </header>
  );
}
