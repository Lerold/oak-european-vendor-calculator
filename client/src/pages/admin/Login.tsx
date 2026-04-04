import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
import api from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if setup is needed
    api.get('/auth/setup-status').then(({ data }) => {
      if (data.needsSetup) {
        navigate('/admin/setup', { replace: true });
      }
      setChecking(false);
    }).catch(() => {
      setChecking(false);
    });
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Get authentication options
      const { data: authData } = await api.post('/auth/login-options');

      // Step 2: Authenticate via browser WebAuthn API
      const authResp = await startAuthentication({ optionsJSON: authData.options });

      // Step 3: Verify with server
      const { data: verifyData } = await api.post('/auth/login', {
        challengeId: authData.challengeId,
        response: authResp,
      });

      if (verifyData.verified) {
        navigate('/admin');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Checking setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/logo.png" alt="Oaklease" className="auth-logo" />
        <h1>Admin Login</h1>
        <p className="auth-subtitle">
          Sign in with your passkey to access the admin panel.
        </p>

        {error && <p className="auth-error">{error}</p>}

        <button
          onClick={handleLogin}
          className="btn btn-primary auth-btn"
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Sign in with Passkey'}
        </button>

        <p className="auth-hint">
          Use your device's biometric or security key to authenticate.
        </p>
      </div>
    </div>
  );
}
