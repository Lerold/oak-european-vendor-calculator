import CalculatorForm from '../components/calculator/CalculatorForm';

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>European Equipment Leasing Calculator</h1>
        <p className="hero-subtitle">
          Estimate leasing costs for equipment across Europe. Get indicative
          monthly and quarterly payments instantly.
        </p>
      </section>

      <section className="calculator-section">
        <CalculatorForm />
      </section>
    </div>
  );
}
