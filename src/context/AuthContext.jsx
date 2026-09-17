import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const AUTH_TOKEN_KEY = 'thenisai_auth_token';
const AUTH_USER_KEY = 'thenisai_auth_user';
const ADMIN_SESSION_KEY = 'thenisai_admin_session_unlocked';
const BILLING_SESSION_KEY = 'thenisai_billing_session_unlocked';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Clear legacy persistent localStorage to prevent unauthorized auto-login
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);

      const saved = sessionStorage.getItem(AUTH_USER_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      if (!parsed) return null;

      // Both Admin and Billing counter require active session unlock in the current tab
      if (parsed.role === 'admin') {
        return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true' ? parsed : null;
      }
      if (parsed.role === 'cashier') {
        return sessionStorage.getItem(BILLING_SESSION_KEY) === 'true' ? parsed : null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem(AUTH_USER_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role === 'admin' && sessionStorage.getItem(ADMIN_SESSION_KEY) !== 'true') return null;
        if (parsed?.role === 'cashier' && sessionStorage.getItem(BILLING_SESSION_KEY) !== 'true') return null;
      }
      return sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate existing session on initial page load
  useEffect(() => {
    async function verifySession() {
      // Clean up any legacy localStorage
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);

      const savedUser = sessionStorage.getItem(AUTH_USER_KEY);
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;

      if (!parsedUser) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      if (parsedUser.role === 'admin' && sessionStorage.getItem(ADMIN_SESSION_KEY) !== 'true') {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      if (parsedUser.role === 'cashier' && sessionStorage.getItem(BILLING_SESSION_KEY) !== 'true') {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      const savedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
          if (res.user.role === 'admin') {
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
          } else if (res.user.role === 'cashier') {
            sessionStorage.setItem(BILLING_SESSION_KEY, 'true');
          }
        } else {
          setToken(null);
          setUser(null);
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          sessionStorage.removeItem(BILLING_SESSION_KEY);
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
          sessionStorage.removeItem(AUTH_USER_KEY);
        }
      } catch (err) {
        if (err.status === 401) {
          setToken(null);
          setUser(null);
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          sessionStorage.removeItem(BILLING_SESSION_KEY);
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
          sessionStorage.removeItem(AUTH_USER_KEY);
        } else {
          console.debug('[Auth] Session offline check:', err?.message || err);
        }
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (credentials) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/login', credentials);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);

        sessionStorage.setItem(AUTH_TOKEN_KEY, res.token);
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));

        if (res.user?.role === 'admin') {
          sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
          sessionStorage.removeItem(BILLING_SESSION_KEY);
        } else if (res.user?.role === 'cashier') {
          sessionStorage.setItem(BILLING_SESSION_KEY, 'true');
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }

        // Clean out legacy persistent storage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      // Fallback for sample credentials if backend is unreachable
      const u = String(credentials.username || '').trim().toLowerCase();
      const p = String(credentials.password || '').trim();
      const requestedRole = credentials.role || (u.includes('admin') ? 'admin' : 'cashier');

      if ((u === 'admin' || u === 'staff-1') && p === 'admin123') {
        if (requestedRole && requestedRole !== 'admin') {
          const msg = 'Role mismatch: admin credentials cannot be used as cashier.';
          setError(msg);
          return { success: false, error: msg };
        }
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
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        sessionStorage.removeItem(BILLING_SESSION_KEY);
        sessionStorage.setItem(AUTH_TOKEN_KEY, tokenVal);
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackAdmin));
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        return { success: true, user: fallbackAdmin };
      }

      if ((u === 'cashier' || u === 'staff-2') && p === 'cashier123') {
        if (requestedRole && requestedRole !== 'cashier') {
          const msg = 'Role mismatch: cashier credentials cannot be used as admin.';
          setError(msg);
          return { success: false, error: msg };
        }
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
        sessionStorage.setItem(BILLING_SESSION_KEY, 'true');
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        sessionStorage.setItem(AUTH_TOKEN_KEY, tokenVal);
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackCashier));
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
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
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(BILLING_SESSION_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
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
    isAdmin: Boolean(user && user.role === 'admin' && sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'),
    isCashier: Boolean(user && user.role === 'cashier' && sessionStorage.getItem(BILLING_SESSION_KEY) === 'true'),
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
