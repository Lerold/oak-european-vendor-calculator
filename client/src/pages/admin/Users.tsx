import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

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
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Deactivate ${user.username}? They will no longer be able to log in.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Admin Users</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary">
          <Plus size={16} /> Add User
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 500 }}>
          <h3>Add New Admin User</h3>
          <p className="hint-text">
            The new user must be present to register their passkey on this device.
          </p>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="newadmin"
                required
              />
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="New Admin"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Registering...' : 'Register Passkey'}
              </button>
            </div>
          </form>
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
