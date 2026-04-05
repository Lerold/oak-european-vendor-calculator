import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../services/api';

interface Enquiry {
  id: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone: string | null;
  equipment_type: string | null;
  equipment_value: number | null;
  term_months: number | null;
  monthly_payment: number | null;
  message: string | null;
  country_name: string | null;
  country_code: string | null;
  vendor_name: string | null;
  status: string;
  created_at: string;
}

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/admin/enquiries?${params}`);
      setEnquiries(data.enquiries);
      setTotal(data.total);
    } catch {
      setError('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/enquiries/${id}/status`, { status });
      await load();
    } catch {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (enq: Enquiry) => {
    if (!confirm(`Delete enquiry from ${enq.contact_name}? This cannot be undone (GDPR erasure).`)) return;
    try {
      await api.delete(`/admin/enquiries/${enq.id}`);
      await load();
    } catch {
      setError('Failed to delete');
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Enquiries ({total})</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {enquiries.length === 0 ? (
        <div className="empty-state"><p>No enquiries yet.</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Contact</th>
                <th>Company</th>
                <th>Email</th>
                <th>Country</th>
                <th>Value</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq) => (
                <tr key={enq.id}>
                  <td>{new Date(enq.created_at).toLocaleDateString()}</td>
                  <td>{enq.contact_name}</td>
                  <td>{enq.company_name}</td>
                  <td><a href={`mailto:${enq.email}`}>{enq.email}</a></td>
                  <td>{enq.country_name || '—'}</td>
                  <td>{enq.equipment_value ? `€${Number(enq.equipment_value).toLocaleString()}` : '—'}</td>
                  <td>{enq.vendor_name || 'Direct'}</td>
                  <td>
                    <select
                      value={enq.status}
                      onChange={(e) => updateStatus(enq.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(enq)} className="icon-btn danger" title="Delete (GDPR erasure)">
                      <Trash2 size={16} />
                    </button>
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
