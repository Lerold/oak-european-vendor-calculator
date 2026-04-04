import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import api from '../../services/api';
import CountrySelector from './CountrySelector';
import ResultsCard from './ResultsCard';
import QuoteRequestForm from '../enquiry/QuoteRequestForm';

interface Country {
  code: string;
  name: string;
  flag_emoji: string;
  currency_code: string;
  vat_rate: number;
  min_amount: number;
  max_amount: number;
  available_terms: number[];
  deposit_enabled: boolean;
  deposit_months: number;
  calc_method: string;
  show_local_currency: boolean;
}

interface CalcResponse {
  country: {
    name: string;
    code: string;
    currencyCode: string;
    vatRate: number;
    showLocalCurrency: boolean;
  };
  input: {
    equipmentValue: number;
    termMonths: number;
    depositMonths: number;
  };
  result: {
    depositAmount: number;
    principal: number;
    monthlyPaymentExclVat: number;
    monthlyPaymentInclVat: number;
    quarterlyPaymentExclVat: number;
    quarterlyPaymentInclVat: number;
    vatAmountMonthly: number;
    totalLeaseExclVat: number;
    totalLeaseInclVat: number;
    termMonths: number;
  };
}

interface Props {
  vendorSlug?: string;
  equipmentTypes?: string[];
  preloadedCountries?: Country[];
  defaultCountry?: string;
  ctaText?: string;
  accentColor?: string;
}

export default function CalculatorForm({ vendorSlug, equipmentTypes, preloadedCountries, defaultCountry, ctaText, accentColor }: Props) {
  const [countries, setCountries] = useState<Country[]>(preloadedCountries || []);
  const [loadingCountries, setLoadingCountries] = useState(!preloadedCountries);
  const [selectedCode, setSelectedCode] = useState(defaultCountry || '');
  const [amount, setAmount] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [depositMonths, setDepositMonths] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalcResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preloadedCountries) return;

    // For vendor mode, fetch from vendor endpoint; otherwise public countries
    const url = vendorSlug ? `/vendor/${vendorSlug}` : '/countries';
    api.get(url).then(({ data }) => {
      setCountries(vendorSlug ? data.countries : data.countries);
      setLoadingCountries(false);
    }).catch(() => {
      setError('Failed to load countries');
      setLoadingCountries(false);
    });
  }, [vendorSlug, preloadedCountries]);

  const selectedCountry = countries.find((c) => c.code === selectedCode);
  const availableTerms = selectedCountry?.available_terms || [];

  const handleCountryChange = (code: string) => {
    setSelectedCode(code);
    setTermMonths('');
    setDepositMonths('');
    setResult(null);
    setError('');
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode || !amount || !termMonths) return;

    setCalculating(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/calculate', {
        countryCode: selectedCode,
        amount: parseFloat(amount),
        termMonths: parseInt(termMonths, 10),
        ...(depositMonths !== '' ? { depositMonths: parseInt(depositMonths, 10) } : {}),
      });
      setResult(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Calculation failed');
      } else {
        setError('Calculation failed');
      }
    } finally {
      setCalculating(false);
    }
  };

  const formatRange = (min: number, max: number, currency: string) => {
    const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 });
    return `${fmt.format(min)} – ${fmt.format(max)}`;
  };

  return (
    <div className="calculator-container">
      <form onSubmit={handleCalculate} className="calculator-form card">
        <CountrySelector
          countries={countries}
          value={selectedCode}
          onChange={handleCountryChange}
          loading={loadingCountries}
        />

        {selectedCountry && (
          <>
            {equipmentTypes && equipmentTypes.length > 1 && (
              <div className="form-group">
                <label htmlFor="equipmentType">Equipment Type</label>
                <select
                  id="equipmentType"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                >
                  <option value="">Select type</option>
                  {equipmentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="amount">
                Equipment Value ({selectedCountry.currency_code})
              </label>
              <input
                id="amount"
                type="number"
                min={selectedCountry.min_amount}
                max={selectedCountry.max_amount}
                step="100"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setResult(null); }}
                placeholder={formatRange(
                  Number(selectedCountry.min_amount),
                  Number(selectedCountry.max_amount),
                  selectedCountry.currency_code
                )}
                required
              />
              <span className="input-hint">
                {formatRange(
                  Number(selectedCountry.min_amount),
                  Number(selectedCountry.max_amount),
                  selectedCountry.currency_code
                )}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="term">Lease Term</label>
              <select
                id="term"
                value={termMonths}
                onChange={(e) => { setTermMonths(e.target.value); setResult(null); }}
                required
              >
                <option value="">Select term</option>
                {availableTerms.map((t) => (
                  <option key={t} value={t}>{t} months ({t / 12} {t / 12 === 1 ? 'year' : 'years'})</option>
                ))}
              </select>
            </div>

            {selectedCountry.deposit_enabled && (
              <div className="form-group">
                <label htmlFor="deposit">Advance Payments (months)</label>
                <select
                  id="deposit"
                  value={depositMonths}
                  onChange={(e) => { setDepositMonths(e.target.value); setResult(null); }}
                >
                  <option value="">Default ({selectedCountry.deposit_months})</option>
                  {[0, 1, 2, 3].map((m) => (
                    <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary calculator-submit"
              disabled={calculating || !amount || !termMonths}
            >
              <Calculator size={18} />
              {calculating ? 'Calculating...' : 'Calculate'}
            </button>
          </>
        )}
      </form>

      {result && (
        <>
          <ResultsCard
            result={result.result}
            country={result.country}
            equipmentValue={result.input.equipmentValue}
          />
          <QuoteRequestForm
            vendorSlug={vendorSlug}
            countryCode={result.country.code}
            equipmentType={equipmentType || undefined}
            equipmentValue={result.input.equipmentValue}
            termMonths={result.input.termMonths}
            monthlyPayment={result.result.monthlyPaymentExclVat}
            ctaText={ctaText}
          />
        </>
      )}
    </div>
  );
}
