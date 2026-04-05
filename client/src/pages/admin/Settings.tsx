import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api from '../../services/api';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      setSettings(data.settings);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load settings');
      setLoading(false);
    });
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/admin/settings', settings);
      setSettings(data.settings);
      setSuccess('Settings saved');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  const settingsConfig = [
    { key: 'email_from', label: 'Email From Address', placeholder: 'enquiries@oaklease.co.uk' },
    { key: 'data_retention_days', label: 'Data Retention (days)', placeholder: '730' },
    { key: 'default_min_amount', label: 'Default Min Amount', placeholder: '3000' },
    { key: 'default_max_amount', label: 'Default Max Amount', placeholder: '15000000' },
    { key: 'google_analytics_id', label: 'Google Analytics ID (leave empty to disable)', placeholder: 'G-XXXXXXXXXX' },
  ];

  return (
    <div className="admin-page">
      <h1>Settings</h1>

      <div className="card" style={{ maxWidth: 600, marginTop: '1rem' }}>
        {settingsConfig.map(({ key, label, placeholder }) => (
          <div className="form-group" key={key}>
            <label>{label}</label>
            <input
              value={settings[key] || ''}
              onChange={(e) => updateSetting(key, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={saving}
          style={{ marginTop: '1rem' }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
