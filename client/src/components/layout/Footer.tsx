import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="Oaklease" className="footer-logo" />
          <p className="footer-text">{t('footer.tagline')}</p>
        </div>
        <div className="footer-links">
          <a href="https://oaklease.co.uk" target="_blank" rel="noopener noreferrer" className="footer-link">
            oaklease.co.uk
          </a>
          <a href="/faq" className="footer-link">{t('nav.faq')}</a>
          <a href="https://oaklease.co.uk/privacy-policy" target="_blank" rel="noopener noreferrer" className="footer-link">
            {t('footer.privacy')}
          </a>
        </div>
        <p className="footer-copyright">{t('footer.copyright')} &middot; v1.0.0</p>
      </div>
    </footer>
  );
}
