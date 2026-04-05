import { useTranslation } from 'react-i18next';
import CalculatorForm from '../components/calculator/CalculatorForm';

export default function Home() {
  const { t } = useTranslation();

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
