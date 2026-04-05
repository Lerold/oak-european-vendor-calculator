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

export default function EmbedCalculator() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      // No slug = main Oaklease calculator embed
      setLoading(false);
      return;
    }
    api.get(`/vendor/${slug}`).then(({ data }) => {
      setVendor(data.vendor);
      setLoading(false);
    }).catch(() => {
      setError('Calculator not found');
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>;
  if (error) return <p style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>{error}</p>;

  return (
    <div className="embed-content">
      {vendor && (
        <VendorHeader
          name={vendor.name}
          logoUrl={vendor.logoUrl}
          welcomeText={vendor.welcomeText}
        />
      )}
      <CalculatorForm
        vendorSlug={slug}
        equipmentTypes={vendor?.equipmentTypes || undefined}
      />
    </div>
  );
}
