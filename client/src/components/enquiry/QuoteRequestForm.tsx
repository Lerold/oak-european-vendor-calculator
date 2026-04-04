import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import api from '../../services/api';

interface Props {
  vendorSlug?: string;
  countryCode?: string;
  equipmentType?: string;
  equipmentValue?: number;
  termMonths?: number;
  monthlyPayment?: number;
}

export default function QuoteRequestForm({
  vendorSlug,
  countryCode,
  equipmentType,
  equipmentValue,
  termMonths,
  monthlyPayment,
}: Props) {
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprConsent) {
      setError('You must consent to data processing to submit an enquiry.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/enquiry', {
        vendorSlug,
        countryCode,
        contactName: contactName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        equipmentType,
        equipmentValue,
        termMonths,
        monthlyPayment,
        message: message.trim() || undefined,
        gdprConsent: true,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to submit enquiry');
      } else {
        setError('Failed to submit enquiry');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="quote-form card quote-success">
        <CheckCircle size={40} className="success-icon" />
        <h3>Thank You!</h3>
        <p>
          Your quote request has been submitted. Our team will be in touch
          within 1-2 business days.
        </p>
      </div>
    );
  }

  return (
    <div className="quote-form card">
      <h3>Request a Quote</h3>
      <p className="quote-subtitle">
        Interested in these figures? Submit your details and we'll provide a
        formal quotation.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contactName">Your Name</label>
            <input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              placeholder="John Smith"
            />
          </div>
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Acme Ltd"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="john@acme.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+44 7700 900000"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="message">Message (optional)</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Any additional details about your leasing requirements..."
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label consent-label">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => { setGdprConsent(e.target.checked); setError(''); }}
            />
            <span>
              I consent to Oaklease Ltd processing my personal data to respond
              to this enquiry. See our{' '}
              <a href="https://oaklease.co.uk/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>{' '}
              for details on how your data is handled.
            </span>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary calculator-submit"
          disabled={submitting}
        >
          <Send size={16} />
          {submitting ? 'Submitting...' : 'Request a Quote'}
        </button>
      </form>
    </div>
  );
}
