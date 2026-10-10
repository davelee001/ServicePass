import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import './AdminAccess.css';

export default function AdminAccess({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/auth/admin/session').then(response => { if (active) setUser(response.data.user); })
      .catch(failure => { if (active && failure.response?.status !== 401 && failure.response?.status !== 403) setError('Unable to reach the server. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    const expired = () => { setUser(null); queryClient.clear(); };
    window.addEventListener('admin-session-expired', expired);
    return () => { active = false; window.removeEventListener('admin-session-expired', expired); };
  }, [queryClient]);

  const login = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await api.post('/auth/admin/login', { username, password });
      queryClient.clear(); setPassword(''); setUser(response.data.user);
    } catch (failure) { setError(failure.response?.data?.error || 'Unable to log in. Please try again.'); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    setBusy(true); setError('');
    try { await api.post('/auth/admin/logout'); setUser(null); queryClient.clear(); }
    catch (failure) {
      if ([401, 403].includes(failure.response?.status)) { setUser(null); queryClient.clear(); }
      else setError('Unable to sign out. Please try again.');
    }
    finally { setBusy(false); }
  };

  if (loading) return <p role="status">Checking admin session...</p>;
  if (user?.role === 'admin') return <>
    <div className="admin-session-bar"><span>Signed in as {user.username || 'Administrator'}</span><button onClick={logout} disabled={busy}>Sign out</button></div>
    {error && <p role="alert">{error}</p>}
    {children}
  </>;
  return <section className="admin-login-card">
    <h1>Admin login</h1>
    <p>Sign in to access the admin dashboard.</p>
    <form onSubmit={login}>
      <label htmlFor="admin-username">Username</label>
      <input id="admin-username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required />
      <label htmlFor="admin-password">Password</label>
      <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
  </section>;
}
