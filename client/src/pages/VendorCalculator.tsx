import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import VendorHeader from '../components/vendor/VendorHeader';
import CalculatorForm from '../components/calculator/CalculatorForm';

interface VendorData {
  name: string;
  slug: string;
  logoUrl: string | null;
  welcomeText: string | null;
  equipmentTypes: string[] | null;
}

export default function VendorCalculator() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get(`/vendor/${slug}`).then(({ data }) => {
      setVendor(data.vendor);
      setLoading(false);
    }).catch(() => {
      setError('Vendor not found');
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="home-page">
        <div className="hero"><p>Loading...</p></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="home-page">
        <div className="hero">
          <h1>Not Found</h1>
          <p>This vendor calculator could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <VendorHeader
        name={vendor.name}
        logoUrl={vendor.logoUrl}
        welcomeText={vendor.welcomeText}
      />

      <section className="calculator-section">
        <CalculatorForm
          vendorSlug={slug}
          equipmentTypes={vendor.equipmentTypes || undefined}
        />
      </section>
    </div>
  );
}
