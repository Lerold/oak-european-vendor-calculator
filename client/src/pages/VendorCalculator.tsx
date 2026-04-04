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
  accentColor: string | null;
  ctaText: string | null;
  bannerUrl: string | null;
  defaultCountry: string | null;
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

  // Apply vendor accent color as CSS custom property
  const vendorStyle = vendor.accentColor
    ? { '--color-green': vendor.accentColor, '--color-green-hover': vendor.accentColor } as React.CSSProperties
    : undefined;

  return (
    <div className="home-page" style={vendorStyle}>
      <VendorHeader
        name={vendor.name}
        logoUrl={vendor.logoUrl}
        bannerUrl={vendor.bannerUrl}
        welcomeText={vendor.welcomeText}
      />

      <section className="calculator-section">
        <CalculatorForm
          vendorSlug={slug}
          equipmentTypes={vendor.equipmentTypes || undefined}
          defaultCountry={vendor.defaultCountry || undefined}
          ctaText={vendor.ctaText || undefined}
          accentColor={vendor.accentColor || undefined}
        />
      </section>
    </div>
  );
}
