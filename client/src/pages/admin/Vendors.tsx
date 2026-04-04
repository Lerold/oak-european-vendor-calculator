import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
import api from '../../services/api';

interface Vendor {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  welcome_text: string | null;
  contact_email: string | null;
  oaklease_email: string;
  equipment_types: string[] | null;
  allowed_countries: string[] | null;
  is_active: boolean;
}

interface Country {
  id: string;
  name: string;
  code: string;
  flag_emoji: string;
}

const emptyVendor = {
  name: '',
  slug: '',
  welcome_text: '',
  contact_email: '',
  oaklease_email: 'enquiries@oaklease.co.uk',
  equipment_types_str: '',
  allowed_countries: [] as string[],
  is_active: true,
};

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyVendor);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [v, c] = await Promise.all([
        api.get('/admin/vendors'),
        api.get('/admin/countries'),
      ]);
      setVendors(v.data.vendors);
      setCountries(c.data.countries);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyVendor);
    setShowForm(true);
    setError('');
  };

  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({
      name: v.name,
      slug: v.slug,
      welcome_text: v.welcome_text || '',
      contact_email: v.contact_email || '',
      oaklease_email: v.oaklease_email,
      equipment_types_str: (v.equipment_types || []).join(', '),
      allowed_countries: v.allowed_countries || [],
      is_active: v.is_active,
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const equipmentTypes = form.equipment_types_str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      slug: form.slug,
      welcome_text: form.welcome_text || undefined,
      contact_email: form.contact_email || '',
      oaklease_email: form.oaklease_email,
      equipment_types: equipmentTypes.length > 0 ? equipmentTypes : undefined,
      allowed_countries: form.allowed_countries.length > 0 ? form.allowed_countries : undefined,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await api.put(`/admin/vendors/${editing.id}`, payload);
      } else {
        await api.post('/admin/vendors', payload);
      }
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Save failed');
      } else {
        setError('Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (vendorId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await api.post(`/admin/vendors/${vendorId}/logo`, formData);
      await load();
    } catch {
      setError('Logo upload failed');
    }
  };

  const handleDelete = async (v: Vendor) => {
    if (!confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/vendors/${v.id}`);
      await load();
    } catch {
      setError('Delete failed');
    }
  };

  const toggleCountry = (id: string) => {
    setForm((prev) => ({
      ...prev,
      allowed_countries: prev.allowed_countries.includes(id)
        ? prev.allowed_countries.filter((c) => c !== id)
        : [...prev.allowed_countries, id],
    }));
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Vendors</h1>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button onClick={() => setShowForm(false)} className="modal-close"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Vendor Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>URL Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="my-vendor"
                    required
                  />
                  <span className="input-hint">euro.oaklease.co.uk/{form.slug || 'slug'}</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vendor Contact Email</label>
                  <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="sales@vendor.com" />
                </div>
                <div className="form-group">
                  <label>Oaklease Email</label>
                  <input type="email" value={form.oaklease_email} onChange={(e) => setForm({ ...form, oaklease_email: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Equipment Types (comma-separated)</label>
                <input value={form.equipment_types_str} onChange={(e) => setForm({ ...form, equipment_types_str: e.target.value })} placeholder="CNC Machines, Lathes, Milling" />
              </div>

              <div className="form-group">
                <label>Welcome Text</label>
                <textarea value={form.welcome_text} onChange={(e) => setForm({ ...form, welcome_text: e.target.value })} rows={2} placeholder="Welcome message shown on vendor calculator..." />
              </div>

              <div className="form-group">
                <label>Allowed Countries</label>
                <div className="checkbox-group">
                  {countries.filter((c) => c.is_active !== false).map((c) => (
                    <label key={c.id} className="checkbox-label">
                      <input type="checkbox" checked={form.allowed_countries.includes(c.id)} onChange={() => toggleCountry(c.id)} />
                      {c.flag_emoji} {c.name}
                    </label>
                  ))}
                </div>
                <span className="input-hint">Leave empty to show all countries</span>
              </div>

              <label className="checkbox-label">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>

              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="empty-state"><p>No vendors configured yet.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Email</th>
                <th>Equipment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td>
                    {v.logo_url ? (
                      <img src={v.logo_url} alt="" style={{ height: 28, width: 'auto' }} />
                    ) : (
                      <label className="icon-btn" title="Upload logo" style={{ cursor: 'pointer' }}>
                        <Upload size={14} />
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={(e) => { if (e.target.files?.[0]) handleLogoUpload(v.id, e.target.files[0]); }} />
                      </label>
                    )}
                  </td>
                  <td>{v.name}</td>
                  <td><code>/{v.slug}</code></td>
                  <td>{v.contact_email || '—'}</td>
                  <td>{(v.equipment_types || []).join(', ') || '—'}</td>
                  <td><span className={`status-badge ${v.is_active ? 'active' : 'inactive'}`}>{v.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => openEdit(v)} className="icon-btn" title="Edit"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(v)} className="icon-btn danger" title="Delete"><Trash2 size={16} /></button>
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
