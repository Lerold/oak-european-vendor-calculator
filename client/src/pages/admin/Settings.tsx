import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Key, Pencil } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../../services/api';

interface Passkey {
  id: string;
  name: string;
  created_at: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Passkeys
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [maxPasskeys, setMaxPasskeys] = useState(5);
  const [addingKey, setAddingKey] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const loadSettings = () => {
    api.get('/admin/settings').then(({ data }) => {
      setSettings(data.settings);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load settings');
      setLoading(false);
    });
  };

  const loadPasskeys = () => {
    api.get('/auth/passkeys').then(({ data }) => {
      setPasskeys(data.passkeys);
      setMaxPasskeys(data.max);
    }).catch(() => {});
  };

  useEffect(() => { loadSettings(); loadPasskeys(); }, []);

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
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPasskey = async () => {
    setAddingKey(true);
    setError('');
    try {
      const { data: regData } = await api.post('/auth/add-passkey-options');
      const attResp = await startRegistration(regData.options);
      await api.post('/auth/add-passkey', {
        challengeId: regData.challengeId,
        response: attResp,
      });
      loadPasskeys();
      setSuccess('Passkey added');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to add passkey');
      } else {
        setError('Failed to add passkey');
      }
    } finally {
      setAddingKey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Remove this passkey?')) return;
    try {
      await api.delete(`/auth/passkeys/${id}`);
      loadPasskeys();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to remove passkey');
      } else {
        setError('Failed to remove passkey');
      }
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      await api.put(`/auth/passkeys/${id}`, { name: renameValue.trim() });
      setRenamingId(null);
      loadPasskeys();
    } catch {
      setError('Failed to rename');
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

        <button onClick={handleSave} className="btn btn-primary" disabled={saving} style={{ marginTop: '1rem' }}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Your Passkeys</h2>
      <p className="hint-text">
        Register up to {maxPasskeys} passkeys for your account (e.g. primary device + backup key).
      </p>

      <div className="card" style={{ maxWidth: 600, marginTop: '0.5rem' }}>
        {passkeys.length === 0 ? (
          <p className="hint-text">No passkeys registered.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Added</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {passkeys.map((pk) => (
                <tr key={pk.id}>
                  <td>
                    {renamingId === pk.id ? (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(pk.id); }}
                          style={{ width: 150 }}
                          autoFocus
                        />
                        <button onClick={() => handleRename(pk.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }}>OK</button>
                      </div>
                    ) : (
                      <span><Key size={14} style={{ marginRight: 4 }} />{pk.name}</span>
                    )}
                  </td>
                  <td>{new Date(pk.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => { setRenamingId(pk.id); setRenameValue(pk.name); }} className="icon-btn" title="Rename">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeletePasskey(pk.id)} className="icon-btn danger" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {passkeys.length < maxPasskeys && (
          <button onClick={handleAddPasskey} className="btn btn-secondary" disabled={addingKey} style={{ marginTop: '1rem' }}>
            <Plus size={16} />
            {addingKey ? 'Registering...' : 'Add Passkey'}
          </button>
        )}
      </div>
    </div>
  );
}
