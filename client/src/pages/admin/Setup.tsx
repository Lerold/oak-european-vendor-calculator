import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import api from '../../services/api';

export default function Setup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Get registration options
      const { data: regData } = await api.post('/auth/register-options', {
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
      });

      // Step 2: Create passkey via browser WebAuthn API
      const attResp = await startRegistration(regData.options);

      // Step 3: Verify with server
      const { data: verifyData } = await api.post('/auth/register', {
        challengeId: regData.challengeId,
        response: attResp,
      });

      if (verifyData.verified) {
        navigate('/admin');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/logo.png" alt="Oaklease" className="auth-logo" />
        <h1>Admin Setup</h1>
        <p className="auth-subtitle">
          Create your administrator account to get started.
        </p>

        <form onSubmit={handleSetup} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="displayName">Display Name (optional)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Admin User"
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Registering passkey...' : 'Create Account with Passkey'}
          </button>
        </form>

        <p className="auth-hint">
          You will be prompted to create a passkey using your device's biometric
          or security key.
        </p>
      </div>
    </div>
  );
}
