import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/logo.png" alt="Oaklease" className="header-logo-img" />
        </Link>
        <nav className="header-nav">
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
