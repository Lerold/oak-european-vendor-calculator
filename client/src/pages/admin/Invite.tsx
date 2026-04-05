import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../../services/api';

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [valid, setValid] = useState<boolean | null>(null);
  const [suggestedName, setSuggestedName] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get(`/auth/invite/${token}`).then(({ data }) => {
      setValid(true);
      if (data.displayName) {
        setSuggestedName(data.displayName);
        setDisplayName(data.displayName);
      }
    }).catch(() => {
      setValid(false);
    });
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Get registration options via invite
      const { data: regData } = await api.post('/auth/register-with-invite', {
        token,
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
      });

      // Step 2: Create passkey
      const attResp = await startRegistration(regData.options);

      // Step 3: Verify
      const { data: verifyData } = await api.post('/auth/register', {
        challengeId: regData.challengeId,
        response: attResp,
      });

      if (verifyData.verified) {
        navigate('/admin');
      } else {
        setError('Registration failed');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className="auth-page">
        <div className="auth-card"><p>Validating invite...</p></div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src="/logo.png" alt="Oaklease" className="auth-logo" />
          <h1>Invalid Invite</h1>
          <p className="auth-subtitle">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/logo.png" alt="Oaklease" className="auth-logo" />
        <h1>Join Admin Panel</h1>
        <p className="auth-subtitle">
          You've been invited to join the Oaklease admin panel.
          {suggestedName && ` Welcome, ${suggestedName}.`}
        </p>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              autoFocus
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Registering passkey...' : 'Register with Passkey'}
          </button>
        </form>

        <p className="auth-hint">
          You'll be prompted to create a passkey using your device's biometric or security key.
        </p>
      </div>
    </div>
  );
}
