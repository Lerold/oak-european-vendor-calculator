import { useEffect, useState } from 'react';
import { Plus, Trash2, Link, Copy } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../../services/api';

interface User {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
}

interface InviteRecord {
  id: string;
  display_name: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  created_by_username: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [inviteHours, setInviteHours] = useState('48');
  const [inviteUrl, setInviteUrl] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const [usersRes, invitesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/invites'),
      ]);
      setUsers(usersRes.data.users);
      setInvites(invitesRes.data.invites);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setAdding(true);
    setError('');
    try {
      const { data: regData } = await api.post('/auth/register-options', {
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
      });
      const attResp = await startRegistration(regData.options);
      await api.post('/auth/register', {
        challengeId: regData.challengeId,
        response: attResp,
      });
      setShowAdd(false);
      setUsername('');
      setDisplayName('');
      await load();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to add user');
      } else {
        setError('Failed to add user');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviteUrl('');
    try {
      const { data } = await api.post('/admin/invites', {
        displayName: inviteDisplayName.trim() || undefined,
        expiresInHours: inviteHours,
      });
      setInviteUrl(data.inviteUrl);
      await load();
    } catch {
      setError('Failed to create invite');
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await api.delete(`/admin/invites/${id}`);
      await load();
    } catch {
      setError('Failed to delete invite');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Deactivate ${user.username}?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      await load();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to deactivate');
      } else {
        setError('Failed to deactivate');
      }
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Admin Users</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setShowInvite(!showInvite); setShowAdd(false); }} className="btn btn-secondary">
            <Link size={16} /> Create Invite
          </button>
          <button onClick={() => { setShowAdd(!showAdd); setShowInvite(false); }} className="btn btn-primary">
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {showInvite && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 500 }}>
          <h3>Create Invite Link</h3>
          <p className="hint-text">
            Generate a one-time-use link. The recipient registers their own passkey on their device.
          </p>
          <form onSubmit={handleCreateInvite}>
            <div className="form-group">
              <label>Name (optional, shown to recipient)</label>
              <input
                value={inviteDisplayName}
                onChange={(e) => setInviteDisplayName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="form-group">
              <label>Expires in</label>
              <select value={inviteHours} onChange={(e) => setInviteHours(e.target.value)}>
                <option value="1">1 hour</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="168">7 days</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Generate Link</button>
          </form>

          {inviteUrl && (
            <div className="invite-url-box">
              <input value={inviteUrl} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
              <button
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
                className="btn btn-secondary"
                style={{ flexShrink: 0 }}
              >
                <Copy size={16} /> Copy
              </button>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 500 }}>
          <h3>Add User (this device)</h3>
          <p className="hint-text">
            The new user must be present to register their passkey on this device.
          </p>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="newadmin" required />
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="New Admin" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Registering...' : 'Register Passkey'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active invites */}
      {invites.filter((i) => !i.used_at && new Date(i.expires_at) > new Date()).length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Pending Invites</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>For</th><th>Created By</th><th>Expires</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {invites
                  .filter((i) => !i.used_at && new Date(i.expires_at) > new Date())
                  .map((i) => (
                    <tr key={i.id}>
                      <td>{i.display_name || 'Anyone'}</td>
                      <td>{i.created_by_username}</td>
                      <td>{new Date(i.expires_at).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleDeleteInvite(i.id)} className="icon-btn danger" title="Revoke">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Display Name</th>
              <th>Last Login</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.display_name}</td>
                <td>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                <td>
                  <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {u.is_active && (
                    <button onClick={() => handleDelete(u)} className="icon-btn danger" title="Deactivate">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
