import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './StaffLoginModal.css';

export default function StaffLoginModal({ initialRole = 'admin', onSuccess, onCancel }) {
  const { login, error: authError } = useAuth();
  const { navigateTo } = useCart();

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [username, setUsername] = useState(initialRole === 'admin' ? 'admin' : 'cashier');
  const [password, setPassword] = useState(initialRole === 'admin' ? 'admin123' : 'cashier123');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setSelectedRole(initialRole);
    if (initialRole === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('cashier');
      setPassword('cashier123');
    }
  }, [initialRole]);

  const selectRolePreset = (role) => {
    setSelectedRole(role);
    setLocalError('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('cashier');
      setPassword('cashier123');
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
          navigateTo(initialRole === 'cashier' ? 'billing' : 'admin');
        } else if (res.user?.role === 'cashier') {
          navigateTo('billing');
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
      window.location.hash = '';
      window.history.pushState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displayError = localError || authError;

  return (
    <div className="neu-auth-overlay" data-lenis-prevent="true">
      {/* Top Left Back Arrow */}
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
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
          </div>

          {/* Login Form with Debossed Inset Inputs */}
          <form onSubmit={handleSubmit} className="neu-form">
            {/* Input 1: Username */}
            <div className="neu-input-wrap">
              <span className="neu-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Username or Staff ID"
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

            {/* Input 2: Password */}
            <div className="neu-input-wrap">
              <span className="neu-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </span>
              <input
                type="password"
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
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="neu-error-msg">
                {displayError}
              </div>
            )}

            {/* Raised Neumorphic Action Button */}
            <button
              type="submit"
              className="neu-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          {/* Bottom Link */}
          <div className="neu-footer">
            <span className="neu-footer-text">
              Demo sample logins: <strong>admin</strong> / <strong>admin123</strong> · <strong>cashier</strong> / <strong>cashier123</strong>
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
