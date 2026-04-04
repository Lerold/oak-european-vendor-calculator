import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api from '../../services/api';

interface Country {
  id: string;
  name: string;
  code: string;
  flag_emoji: string;
  available_terms: number[];
}

interface Rate {
  id: string;
  country_id: string;
  term_months: number;
  rate: number;
  is_active: boolean;
}

export default function Rates() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [rates, setRates] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/admin/countries').then(({ data }) => {
      const active = data.countries.filter((c: Country) => c.is_active);
      setCountries(active);
      if (active.length > 0) setSelectedCountry(active[0].id);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load countries');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedCountry) return;
    setError('');
    setSuccess('');

    api.get(`/admin/rates?country_id=${selectedCountry}`).then(({ data }) => {
      const rateMap: Record<number, string> = {};
      data.rates.forEach((r: Rate) => {
        rateMap[r.term_months] = String(r.rate);
      });
      setRates(rateMap);
    }).catch(() => {
      setError('Failed to load rates');
    });
  }, [selectedCountry]);

  const country = countries.find((c) => c.id === selectedCountry);
  const terms = country?.available_terms || [24, 36, 48, 60];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const rateEntries = terms
      .filter((t) => rates[t] !== undefined && rates[t] !== '')
      .map((t) => ({
        term_months: t,
        rate: parseFloat(rates[t]),
        is_active: true,
      }));

    try {
      await api.put('/admin/rates/bulk', {
        country_id: selectedCountry,
        rates: rateEntries,
      });
      setSuccess('Rates saved successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Interest Rates</h1>
      </div>

      {countries.length === 0 ? (
        <div className="empty-state">
          <p>Add countries first before configuring rates.</p>
        </div>
      ) : (
        <>
          <div className="form-group" style={{ maxWidth: 320 }}>
            <label>Select Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag_emoji} {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="card" style={{ maxWidth: 500, marginTop: '1rem' }}>
            <h3>Rates for {country?.flag_emoji} {country?.name}</h3>
            <p className="hint-text">
              Enter annual interest rate (%) for each term length.
              These rates are never shown to end users.
            </p>

            <div className="rates-grid">
              {terms.map((term) => (
                <div key={term} className="form-group">
                  <label>{term} months</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    placeholder="e.g. 5.500"
                    value={rates[term] || ''}
                    onChange={(e) =>
                      setRates((prev) => ({ ...prev, [term]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>

            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <button
              onClick={handleSave}
              className="btn btn-primary"
              disabled={saving}
              style={{ marginTop: '1rem' }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Rates'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
