import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/logo.png" alt="Oaklease" className="header-logo-img" />
        </Link>
        <nav className="header-nav">
          <Link to="/" className="header-link">{t('nav.calculator')}</Link>
          <Link to="/faq" className="header-link">{t('nav.faq')}</Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
