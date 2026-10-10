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

