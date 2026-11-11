import { useCallback, useEffect, useMemo, useState } from 'react';

import * as authApi from '../api/auth.js';
import { setAuthFailureHandler } from '../api/client.js';
import { AuthContext } from './authContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [bootstrapError, setBootstrapError] = useState(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setAuthFailureHandler(clearAuth);

    return () => setAuthFailureHandler(null);
  }, [clearAuth]);

  useEffect(() => {
    let active = true;

    authApi
      .getMe()
      .then((data) => {
        if (!active) {
          return;
        }

        setUser(data.user);
        setStatus('authenticated');
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error.code === 'UNAUTHENTICATED' || error.code === 'TOKEN_EXPIRED') {
          setUser(null);
          setStatus('anonymous');
          return;
        }

        setBootstrapError(error);
        setUser(null);
        setStatus('anonymous');
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setBootstrapError(null);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setBootstrapError(null);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      setUser(data.user);
      setStatus('authenticated');
      return data.user;
    } catch (error) {
      clearAuth();
      throw error;
    }
  }, [clearAuth]);

  const updateProfile = useCallback(async (payload) => {
    const data = await authApi.updateMe(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const changePassword = useCallback(async (payload) => {
    await authApi.changePassword(payload);
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      status,
      bootstrapError,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      refresh,
      updateProfile,
      changePassword
    }),
    [
      user,
      status,
      bootstrapError,
      login,
      register,
      logout,
      refresh,
      updateProfile,
      changePassword
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
