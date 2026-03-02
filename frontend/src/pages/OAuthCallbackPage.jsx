import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';

/**
 * Zoho OAuth callback: ?code=xxx from Zoho redirect (http://localhost:5173/oauth/callback).
 * Sends code to backend to exchange for refresh_token and shows it.
 */
export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('exchanging'); // exchanging | success | error
  const [refreshToken, setRefreshToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setError('No code in URL. Complete Zoho login from the auth URL first.');
      return;
    }
    api('POST', '/zoho/exchange-code', { code })
      .then((data) => {
        setRefreshToken(data.refresh_token || '');
        setStatus('success');
      })
      .catch((err) => {
        setError(err.message || 'Exchange failed');
        setStatus('error');
      });
  }, [searchParams]);

  if (status === 'exchanging') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Exchanging code for refresh token…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: '2rem', maxWidth: 560, margin: '0 auto' }}>
        <h2>Zoho – Error</h2>
        <p style={{ color: '#b91c1c' }}>{error}</p>
        <p>Check backend .env: ZOHO_REDIRECT_URI must be exactly <code>http://localhost:5173/oauth/callback</code> (same as in Zoho Console).</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 560, margin: '0 auto' }}>
      <h2>Zoho Refresh Token</h2>
      <p>Add this to your backend <code>.env</code>:</p>
      <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 14 }}>
        ZOHO_REFRESH_TOKEN={refreshToken}
      </pre>
      <p>Then set <code>ZOHO_INTEGRATION_ENABLED=true</code> and restart the backend.</p>
    </div>
  );
}
