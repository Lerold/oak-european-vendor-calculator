import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CalculatorForm from '../components/calculator/CalculatorForm';

export default function Home() {
  const { t } = useTranslation();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    api.get('/auth/me').then(() => {
      setAuthenticated(true);
    }).catch(() => {
      setAuthenticated(false);
    });
  }, []);

  if (authenticated === null) return null;

  // Not logged in — landing page with admin login link
  if (!authenticated) {
    return (
      <div className="home-page">
        <section className="hero">
          <h1>{t('hero.title')}</h1>
          <p className="hero-subtitle">{t('hero.subtitle')}</p>
        </section>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/admin/login" className="btn btn-primary">
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  // Logged in — full calculator
  return (
    <div className="home-page">
      <section className="hero">
        <h1>{t('hero.title')}</h1>
        <p className="hero-subtitle">{t('hero.subtitle')}</p>
      </section>
      <section className="calculator-section">
        <CalculatorForm />
      </section>
    </div>
  );
}
