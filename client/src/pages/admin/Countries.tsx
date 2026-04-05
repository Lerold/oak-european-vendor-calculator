import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../services/api';

interface Country {
  id: string;
  name: string;
  code: string;
  flag_emoji: string;
  currency_code: string;
  vat_rate: number;
  regulatory_info: string;
  lease_types: string[];
  min_amount: number;
  max_amount: number;
  available_terms: number[];
  deposit_enabled: boolean;
  deposit_months: number;
  calc_method: string;
  show_local_currency: boolean;
  is_active: boolean;
  sort_order: number;
}

const emptyCountry: Omit<Country, 'id'> = {
  name: '',
  code: '',
  flag_emoji: '',
  currency_code: 'EUR',
  vat_rate: 20,
  regulatory_info: '',
  lease_types: ['finance', 'operating'],
  min_amount: 3000,
  max_amount: 15000000,
  available_terms: [24, 36, 48, 60],
  deposit_enabled: true,
  deposit_months: 1,
  calc_method: 'pmt',
  show_local_currency: true,
  is_active: true,
  sort_order: 0,
};

export default function Countries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState<Omit<Country, 'id'>>(emptyCountry);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCountries = async () => {
    try {
      const { data } = await api.get('/admin/countries');
      setCountries(data.countries);
    } catch {
      setError('Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCountries(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCountry);
    setShowForm(true);
    setError('');
  };

  const openEdit = (country: Country) => {
    setEditing(country);
    setForm({
      name: country.name,
      code: country.code,
      flag_emoji: country.flag_emoji || '',
      currency_code: country.currency_code,
      vat_rate: Number(country.vat_rate),
      regulatory_info: country.regulatory_info || '',
      lease_types: country.lease_types || ['finance', 'operating'],
      min_amount: Number(country.min_amount),
      max_amount: Number(country.max_amount),
      available_terms: country.available_terms || [24, 36, 48, 60],
      deposit_enabled: country.deposit_enabled,
      deposit_months: country.deposit_months,
      calc_method: country.calc_method,
      show_local_currency: country.show_local_currency,
      is_active: country.is_active,
      sort_order: country.sort_order,
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        vat_rate: Number(form.vat_rate),
        min_amount: Number(form.min_amount),
        max_amount: Number(form.max_amount),
        deposit_months: Number(form.deposit_months),
        sort_order: Number(form.sort_order),
      };

      if (editing) {
        await api.put(`/admin/countries/${editing.id}`, payload);
      } else {
        await api.post('/admin/countries', payload);
      }
      setShowForm(false);
      await loadCountries();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (country: Country) => {
    if (!confirm(`Delete ${country.name}? This will also remove all associated interest rates.`)) return;
    try {
      await api.delete(`/admin/countries/${country.id}`);
      await loadCountries();
    } catch {
      setError('Delete failed');
    }
  };

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTerm = (term: number) => {
    setForm((prev) => ({
      ...prev,
      available_terms: prev.available_terms.includes(term)
        ? prev.available_terms.filter((t) => t !== term)
        : [...prev.available_terms, term].sort((a, b) => a - b),
    }));
  };

  if (loading) return <div className="admin-page"><p>Loading countries...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Countries</h1>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} /> Add Country
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Country' : 'Add Country'}</h2>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Country Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Germany"
                    required
                  />
                </div>
                <div className="form-group" style={{ maxWidth: 120 }}>
                  <label>Code (ISO)</label>
                  <input
                    value={form.code}
                    onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                    placeholder="DE"
                    maxLength={3}
                    required
                  />
                </div>
                <div className="form-group" style={{ maxWidth: 80 }}>
                  <label>Flag</label>
                  <input
                    value={form.flag_emoji}
                    onChange={(e) => updateField('flag_emoji', e.target.value)}
                    placeholder="🇩🇪"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Currency</label>
                  <input
                    value={form.currency_code}
                    onChange={(e) => updateField('currency_code', e.target.value.toUpperCase())}
                    placeholder="EUR"
                    maxLength={3}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>VAT Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.vat_rate}
                    onChange={(e) => updateField('vat_rate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Calc Method</label>
                  <select
                    value={form.calc_method}
                    onChange={(e) => updateField('calc_method', e.target.value)}
                  >
                    <option value="pmt">PMT (Annuity)</option>
                    <option value="flat">Flat Rate</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Amount</label>
                  <input
                    type="number"
                    value={form.min_amount}
                    onChange={(e) => updateField('min_amount', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Max Amount</label>
                  <input
                    type="number"
                    value={form.max_amount}
                    onChange={(e) => updateField('max_amount', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => updateField('sort_order', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Available Terms (months)</label>
                <div className="checkbox-group">
                  {[12, 24, 36, 48, 60, 72, 84].map((term) => (
                    <label key={term} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.available_terms.includes(term)}
                        onChange={() => toggleTerm(term)}
                      />
                      {term}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.deposit_enabled}
                    onChange={(e) => updateField('deposit_enabled', e.target.checked)}
                  />
                  Deposit Enabled
                </label>
                {form.deposit_enabled && (
                  <div className="form-group" style={{ maxWidth: 160 }}>
                    <label>Deposit Months</label>
                    <input
                      type="number"
                      value={form.deposit_months}
                      onChange={(e) => updateField('deposit_months', e.target.value)}
                      min={0}
                    />
                  </div>
                )}
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.show_local_currency}
                    onChange={(e) => updateField('show_local_currency', e.target.checked)}
                  />
                  Show Local Currency
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateField('is_active', e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <div className="form-group">
                <label>Regulatory Info (Markdown)</label>
                <textarea
                  value={form.regulatory_info}
                  onChange={(e) => updateField('regulatory_info', e.target.value)}
                  rows={3}
                  placeholder="Any regulatory notes for this country..."
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {countries.length === 0 ? (
        <div className="empty-state">
          <p>No countries configured yet. Add your first country to get started.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Code</th>
                <th>Currency</th>
                <th>VAT</th>
                <th>Method</th>
                <th>Terms</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.id}>
                  <td>{c.flag_emoji} {c.name}</td>
                  <td>{c.code}</td>
                  <td>{c.currency_code}</td>
                  <td>{Number(c.vat_rate)}%</td>
                  <td>{c.calc_method.toUpperCase()}</td>
                  <td>{(c.available_terms || []).join(', ')}</td>
                  <td>
                    <span className={`status-badge ${c.is_active ? 'active' : 'inactive'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => openEdit(c)} className="icon-btn" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(c)} className="icon-btn danger" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
