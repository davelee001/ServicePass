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
