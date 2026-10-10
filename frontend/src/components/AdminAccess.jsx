import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import './AdminAccess.css';

export default function AdminAccess({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
