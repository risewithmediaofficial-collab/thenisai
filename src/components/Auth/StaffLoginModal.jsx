import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './StaffLoginModal.css';

export default function StaffLoginModal({ initialRole = 'admin', onSuccess, onCancel }) {
  const { login, error: authError } = useAuth();
  const { navigateTo } = useCart();

  const [selectedRole, setSelectedRole] = useState(
    initialRole === 'cashier' ? 'cashier' : initialRole === 'tester' ? 'tester' : 'admin'
  );
  const [username, setUsername] = useState(
    initialRole === 'cashier' ? 'cashier' : initialRole === 'tester' ? 'tester' : 'admin'
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const role = initialRole === 'cashier' ? 'cashier' : initialRole === 'tester' ? 'tester' : 'admin';
    setSelectedRole(role);
    setUsername(role === 'tester' ? 'tester' : role);
    setPassword(role === 'tester' ? 'test123' : '');
  }, [initialRole]);

  const selectRolePreset = (role) => {
    setSelectedRole(role);
    setLocalError('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('');
    } else if (role === 'cashier') {
      setUsername('cashier');
      setPassword('');
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
        } else if (res.user?.role === 'tester') {
          // Tester/Sandbox: goes to admin view (with sandbox banner)
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
    <div className="neu-auth-overlay" data-lenis-prevent="true">
      {/* Top Left Back Arrow Button */}
      <button
        type="button"
        className="neu-back-btn"
        onClick={handleCancel}
        aria-label="Back to Storefront"
        title="Back to Storefront"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>

      {/* Concentric Outer Ambient Ring */}
      <div className="neu-outer-ring">
        {/* Main Neumorphic Circular Disc */}
        <div className="neu-circle-card" data-lenis-prevent="true">
          {/* Header Title */}
          <div className="neu-header">
            <h1 className="neu-title">Sign In</h1>
            <p className="neu-subtitle">Staff terminal access</p>
          </div>

          {/* Quick Role Toggle Pills */}
          <div className="neu-role-toggle">
            <button
              type="button"
              className={`neu-role-btn ${selectedRole === 'admin' ? 'active' : ''}`}
              onClick={() => selectRolePreset('admin')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin
            </button>
            <button
              type="button"
              className={`neu-role-btn ${selectedRole === 'cashier' ? 'active' : ''}`}
              onClick={() => selectRolePreset('cashier')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
                <path d="M16 8h-8" />
                <path d="M16 12h-8" />
                <path d="M10 16h-2" />
              </svg>
              Cashier
            </button>
            {/* Tester/Sandbox pill */}
            <button
              type="button"
              className={`neu-role-btn neu-role-btn-tester ${selectedRole === 'tester' ? 'active' : ''}`}
              onClick={() => selectRolePreset('tester')}
              title="Sandbox test mode — no real data affected"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                <path d="M10 2v7.31a2 2 0 0 1-.37 1.16L4.14 18.5A2 2 0 0 0 5.8 21.5h12.4a2 2 0 0 0 1.66-3l-5.49-8.03A2 2 0 0 1 14 9.31V2" />
                <line x1="8.5" y1="2" x2="15.5" y2="2" />
              </svg>
              Tester
            </button>
          </div>

          {/* Sandbox info badge shown when tester is selected */}
          {selectedRole === 'tester' && (
            <p className="neu-sandbox-note">
              Sandbox mode — bills &amp; inventory actions are simulated in-memory only. No real data is affected.
            </p>
          )}

          {/* Login Form with Debossed Inset Inputs */}
          <form onSubmit={handleSubmit} className="neu-form">
            {/* Username */}
            <div className="neu-input-wrap">
              <span className="neu-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={selectedRole === 'admin' ? 'admin' : selectedRole === 'tester' ? 'tester' : 'cashier'}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (localError) setLocalError('');
                }}
                className="neu-input"
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div className="neu-input-wrap">
              <span className="neu-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError('');
                }}
                className="neu-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="neu-eye-btn"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="neu-error-msg">
                {displayError}
              </div>
            )}

            {/* Raised Neumorphic Submit Button */}
            <button
              type="submit"
              className={`neu-submit-btn ${
                selectedRole === 'cashier' ? 'neu-submit-cashier' :
                selectedRole === 'tester' ? 'neu-submit-tester' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'ENTERING...' : selectedRole === 'tester' ? 'ENTER SANDBOX' : 'SIGN IN'}
            </button>
          </form>

          {/* Footer */}
          <div className="neu-footer">
            <span className="neu-footer-text">
              Sample logins: <strong>admin</strong> / <strong>admin123</strong> · <strong>cashier</strong> / <strong>cashier123</strong>
              {' · '}<strong>tester</strong> / <strong>test123</strong>
            </span>
            <button
              type="button"
              className="neu-footer-link"
              onClick={handleCancel}
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
