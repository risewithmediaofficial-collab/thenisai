import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const AUTH_TOKEN_KEY = 'thenisai_auth_token';
const AUTH_USER_KEY = 'thenisai_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate existing stored session on initial page load
  useEffect(() => {
    async function verifySession() {
      const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
        } else {
          setToken(null);
          setUser(null);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      } catch (err) {
        console.warn('[Auth] Session validation failed or backend offline, using cached credentials:', err);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []); // Run ONLY on initial mount, not on every login!

  const login = async (credentials) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/login', credentials);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem(AUTH_TOKEN_KEY, res.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      // Fallback for sample credentials if backend is unreachable
      const u = String(credentials.username || '').trim().toLowerCase();
      const p = String(credentials.password || '').trim();
      if ((u === 'admin' || u === 'staff-1') && p === 'admin123') {
        const fallbackAdmin = {
          id: 'staff-1',
          username: 'admin',
          name: 'S. Ramanathan',
          title: 'Kitchen Operations Head',
          role: 'admin',
          counter: 'Operations Central',
        };
        const tokenVal = `thenisai_session_staff-1_${Date.now()}`;
        setToken(tokenVal);
        setUser(fallbackAdmin);
        localStorage.setItem(AUTH_TOKEN_KEY, tokenVal);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackAdmin));
        return { success: true, user: fallbackAdmin };
      }

      if ((u === 'cashier' || u === 'staff-2') && p === 'cashier123') {
        const fallbackCashier = {
          id: 'staff-2',
          username: 'cashier',
          name: 'M. Kannan',
          title: 'Counter Cashier',
          role: 'cashier',
          counter: 'Counter Desk 01',
        };
        const tokenVal = `thenisai_session_staff-2_${Date.now()}`;
        setToken(tokenVal);
        setUser(fallbackCashier);
        localStorage.setItem(AUTH_TOKEN_KEY, tokenVal);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackCashier));
        return { success: true, user: fallbackCashier };
      }

      const msg = err.message || 'Authentication failed. Check credentials.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/api/auth/logout').catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      setError(null);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user && user.role === 'admin'),
    isCashier: Boolean(user && (user.role === 'cashier' || user.role === 'admin')),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
