import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './StaffLoginModal.css';

export default function StaffLoginModal({ initialRole = 'admin', onSuccess, onCancel }) {
  const { login, error: authError } = useAuth();
  const { navigateTo } = useCart();

  const [selectedRole, setSelectedRole] = useState(
    initialRole === 'cashier' ? 'cashier' : initialRole === 'tester' ? 'tester' : (initialRole === 'company_manager' || initialRole === 'manager') ? 'company_manager' : 'admin'
  );
  const [username, setUsername] = useState(
    initialRole === 'cashier' ? 'cashier' : initialRole === 'tester' ? 'tester' : (initialRole === 'company_manager' || initialRole === 'manager') ? 'manager' : 'admin'
  );
  const [password, setPassword] = useState(
    initialRole === 'tester' ? 'test123' : (initialRole === 'company_manager' || initialRole === 'manager') ? 'manager123' : ''
  );
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const role = initialRole === 'cashier' ? 'cashier' : initialRole === 'tester' ? 'tester' : (initialRole === 'company_manager' || initialRole === 'manager') ? 'company_manager' : 'admin';
    setSelectedRole(role);
    setUsername(role === 'tester' ? 'tester' : role === 'company_manager' ? 'manager' : role);
    setPassword(role === 'tester' ? 'test123' : role === 'company_manager' ? 'manager123' : '');
  }, [initialRole]);

  const selectRolePreset = (role) => {
    setSelectedRole(role);
    setLocalError('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'cashier') {
      setUsername('cashier');
      setPassword('cashier123');
    } else if (role === 'company_manager' || role === 'manager') {
      setUsername('manager');
      setPassword('manager123');
    } else if (role === 'tester') {
      setUsername('tester');
      setPassword('test123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter username and password');
      return;
    }

    setIsSubmitting(true);
    setLocalError('');

    const res = await login({
      role: selectedRole,
      username: username.trim(),
      password: password.trim(),
    });

    setIsSubmitting(false);

    if (res.success) {
      if (onSuccess) {
        onSuccess(res.user);
      } else {
        if (res.user?.role === 'admin') {
          const h = window.location.hash.toLowerCase();
          if (h.startsWith('#admin/')) {
            const sub = h.replace('#admin/', '').split('?')[0];
            navigateTo('admin', sub);
          } else {
            navigateTo('admin');
          }
        } else if (res.user?.role === 'cashier') {
          const h = window.location.hash.toLowerCase();
          if (h.startsWith('#billing/')) {
            const sub = h.replace('#billing/', '').split('?')[0];
            navigateTo('billing', sub);
          } else {
            navigateTo('billing', 'register');
          }
        } else if (res.user?.role === 'company_manager' || res.user?.role === 'manager') {
          navigateTo('manager');
        } else if (res.user?.role === 'tester') {
          navigateTo('admin');
        }
      }
    } else {
      setLocalError(res.error || 'Invalid username or password');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigateTo('storefront');
    }
  };

  const displayError = localError || authError;

  return (
    <div className="minimal-auth-overlay" data-lenis-prevent="true">
      {/* Top Bar with Return to Storefront */}
      <div className="minimal-top-bar">
        <button
          type="button"
          className="minimal-back-btn"
          onClick={handleCancel}
          aria-label="Return to Storefront"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Return to Storefront</span>
        </button>
      </div>

      {/* Main Minimalist Light Card */}
      <div className="minimal-auth-card" data-lenis-prevent="true">
        {/* Brand Header */}
        <div className="minimal-brand-header">
          <div className="minimal-brand-badge">
            <span className="minimal-brand-icon">✨</span>
          </div>
          <h1 className="minimal-brand-title">Thenisai Staff Portal</h1>
          <p className="minimal-brand-subtitle">
            Sign in to access your designated terminal &amp; controls
          </p>
        </div>

        {/* Minimalist Segmented Role Switcher */}
        <div className="minimal-role-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === 'admin'}
            className={`minimal-role-tab ${selectedRole === 'admin' ? 'active' : ''}`}
            onClick={() => selectRolePreset('admin')}
          >
            <span className="role-icon">🛡️</span>
            <span>Admin</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === 'cashier'}
            className={`minimal-role-tab ${selectedRole === 'cashier' ? 'active' : ''}`}
            onClick={() => selectRolePreset('cashier')}
          >
            <span className="role-icon">🧾</span>
            <span>Cashier</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === 'company_manager'}
            className={`minimal-role-tab ${selectedRole === 'company_manager' ? 'active' : ''}`}
            onClick={() => selectRolePreset('company_manager')}
            title="Stock Inward & Inventory Manager"
          >
            <span className="role-icon">🏢</span>
            <span>Manager</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedRole === 'tester'}
            className={`minimal-role-tab ${selectedRole === 'tester' ? 'active' : ''}`}
            onClick={() => selectRolePreset('tester')}
            title="Sandbox Demo Mode"
          >
            <span className="role-icon">🧪</span>
            <span>Tester</span>
          </button>
        </div>

        {/* Role Helper Banner */}
        {selectedRole === 'company_manager' && (
          <div className="minimal-role-banner manager-banner">
            <strong>Company Manager:</strong> Direct access to Shop Stored Stock, Company Inwards &amp; Daily Movement Logs.
          </div>
        )}
        {selectedRole === 'cashier' && (
          <div className="minimal-role-banner cashier-banner">
            <strong>POS Billing Counter:</strong> Fast retail billing, thermal receipt printing &amp; counter sales.
          </div>
        )}
        {selectedRole === 'admin' && (
          <div className="minimal-role-banner admin-banner">
            <strong>Store Administrator:</strong> Full control over pricing, inventory, master catalogue &amp; staff.
          </div>
        )}
        {selectedRole === 'tester' && (
          <div className="minimal-role-banner tester-banner">
            <strong>Sandbox Test Mode:</strong> In-memory simulation. Safe to test all features without modifying real records.
          </div>
        )}

        {/* Clean Minimalist Form */}
        <form onSubmit={handleSubmit} className="minimal-login-form">
          {/* Username Field */}
          <div className="minimal-field-group">
            <label className="minimal-label" htmlFor="staff-username">
              Username
            </label>
            <div className="minimal-input-container">
              <span className="minimal-input-adornment">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="staff-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (localError) setLocalError('');
                }}
                placeholder={selectedRole === 'company_manager' ? 'manager' : selectedRole}
                className="minimal-input"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="minimal-field-group">
            <div className="minimal-label-row">
              <label className="minimal-label" htmlFor="staff-password">
                Password
              </label>
            </div>
            <div className="minimal-input-container">
              <span className="minimal-input-adornment">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError('');
                }}
                placeholder="Enter password"
                className="minimal-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="minimal-password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="minimal-error-alert" role="alert">
              <span className="error-icon">⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="minimal-submit-btn"
          >
            {isSubmitting ? (
              <span className="minimal-btn-loading">
                <span className="minimal-spinner" />
                Signing In...
              </span>
            ) : (
              <span>Sign In to Terminal</span>
            )}
          </button>
        </form>

        {/* Quick Autofill Helper Chips */}
        <div className="minimal-autofill-section">
          <span className="autofill-label">Quick Logins:</span>
          <div className="autofill-chips">
            <button
              type="button"
              className="autofill-chip"
              onClick={() => selectRolePreset('admin')}
              title="Autofill Admin credentials"
            >
              admin
            </button>
            <button
              type="button"
              className="autofill-chip"
              onClick={() => selectRolePreset('cashier')}
              title="Autofill Cashier credentials"
            >
              cashier
            </button>
            <button
              type="button"
              className="autofill-chip"
              onClick={() => selectRolePreset('company_manager')}
              title="Autofill Company Manager credentials"
            >
              manager
            </button>
            <button
              type="button"
              className="autofill-chip"
              onClick={() => selectRolePreset('tester')}
              title="Autofill Sandbox Tester credentials"
            >
              tester
            </button>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="minimal-card-footer">
          <span>Thenisai POS &amp; Inventory Suite • v2.6</span>
        </div>
      </div>
    </div>
  );
}
