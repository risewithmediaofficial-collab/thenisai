import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

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
    if (role === 'admin') { setUsername('admin'); setPassword('admin123'); }
    else if (role === 'cashier') { setUsername('cashier'); setPassword('cashier123'); }
    else if (role === 'company_manager' || role === 'manager') { setUsername('manager'); setPassword('manager123'); }
    else if (role === 'tester') { setUsername('tester'); setPassword('test123'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setLocalError('Please enter username and password'); return; }
    setIsSubmitting(true);
    setLocalError('');
    const res = await login({ role: selectedRole, username: username.trim(), password: password.trim() });
    setIsSubmitting(false);
    if (res.success) {
      if (onSuccess) {
        onSuccess(res.user);
      } else {
        if (res.user?.role === 'admin') {
          const h = window.location.hash.toLowerCase();
          if (h.startsWith('#admin/')) { navigateTo('admin', h.replace('#admin/', '').split('?')[0]); }
          else { navigateTo('admin'); }
        } else if (res.user?.role === 'cashier') {
          const h = window.location.hash.toLowerCase();
          if (h.startsWith('#billing/')) { navigateTo('billing', h.replace('#billing/', '').split('?')[0]); }
          else { navigateTo('billing', 'register'); }
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

  const handleCancel = () => { if (onCancel) onCancel(); else navigateTo('storefront'); };
  const displayError = localError || authError;

  /* ── Role tab styles ── */
  const roleTabBase = 'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-[11px] font-semibold text-slate-500 cursor-pointer border-none bg-transparent transition-all duration-150 min-w-0';
  const roleTabActive = 'bg-white text-slate-900 shadow font-bold';

  /* ── Role banner colours ── */
  const bannerColors = {
    company_manager: 'bg-yellow-50 border border-yellow-200 text-yellow-900',
    cashier:         'bg-green-50  border border-green-200  text-green-900',
    admin:           'bg-blue-50   border border-blue-200   text-blue-900',
    tester:          'bg-purple-50 border border-purple-200 text-purple-900',
  };
  const bannerText = {
    company_manager: <><strong>Company Manager:</strong> Direct access to Shop Stored Stock, Company Inwards &amp; Daily Movement Logs.</>,
    cashier:         <><strong>POS Billing Counter:</strong> Fast retail billing, thermal receipt printing &amp; counter sales.</>,
    admin:           <><strong>Store Administrator:</strong> Full control over pricing, inventory, master catalogue &amp; staff.</>,
    tester:          <><strong>Sandbox Test Mode:</strong> In-memory simulation. Safe to test all features without modifying real records.</>,
  };

  return (
    /* ── Full-screen overlay ── */
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center px-4 py-6 overflow-y-auto font-[Inter,system-ui,sans-serif]"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage:
          'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(217,119,6,0.08) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(59,130,246,0.04) 0%, transparent 50%)',
        animation: 'minimalFadeIn 0.25s ease-out',
      }}
      data-lenis-prevent="true"
    >
      <style>{`
        @keyframes minimalFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes minimalSpin   { to{transform:rotate(360deg)} }
        .staff-input:focus { outline:none; }
        .staff-input-wrap:focus-within { background:#fff !important; border-color:#d97706 !important; box-shadow:0 0 0 3px rgba(217,119,6,0.15) !important; }
        .staff-submit:hover:not(:disabled) { background:linear-gradient(135deg,#b45309 0%,#92400e 100%) !important; box-shadow:0 4px 16px rgba(217,119,6,0.38) !important; transform:translateY(-1px); }
        .staff-submit:active:not(:disabled){ transform:translateY(0); }
        .back-btn:hover { background:#f1f5f9; color:#0f172a; border-color:#cbd5e1; transform:translateX(-2px); }
        .autofill-chip-btn:hover { background:#e2e8f0; color:#0f172a; }
        .role-tab-btn:hover:not(.active-tab){ color:#1e293b; }
      `}</style>

      {/* ── Back button (top-left, static on mobile) ── */}
      <div className="w-full max-w-[440px] mb-3 sm:fixed sm:top-5 sm:left-6 sm:w-auto sm:mb-0" style={{ zIndex: 100000 }}>
        <button
          type="button"
          className="back-btn inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-[13px] font-semibold text-slate-500 cursor-pointer shadow-sm transition-all duration-150"
          onClick={handleCancel}
          aria-label="Return to Storefront"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Return to Storefront</span>
        </button>
      </div>

      {/* ── Main card ── */}
      <div
        className="w-full max-w-[440px] bg-white border border-slate-200 rounded-[20px] px-7 pt-8 pb-6 box-border relative my-auto"
        style={{ boxShadow: '0 10px 25px -5px rgba(15,23,42,0.04), 0 20px 48px -12px rgba(15,23,42,0.08)' }}
        data-lenis-prevent="true"
      >
        {/* Brand header */}
        <div className="text-center mb-[22px]">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] border border-yellow-300 mb-3"
            style={{ background: 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)', boxShadow: '0 4px 12px rgba(217,119,6,0.15)' }}
          >
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="font-[Outfit,Inter,system-ui] text-[22px] font-extrabold text-slate-900 m-0 tracking-[-0.02em]">
            Thenisai Staff Portal
          </h1>
          <p className="text-[13px] text-slate-500 mt-1.5 mb-0 font-normal">
            Sign in to access your designated terminal &amp; controls
          </p>
        </div>

        {/* Role segmented nav */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 mb-4">
          {[
            { id: 'admin',           icon: '🛡️', label: 'Admin' },
            { id: 'cashier',         icon: '🧾', label: 'Cashier' },
            { id: 'company_manager', icon: '🏢', label: 'Manager', title: 'Stock Inward & Inventory Manager' },
            { id: 'tester',          icon: '🧪', label: 'Tester',  title: 'Sandbox Demo Mode' },
          ].map(({ id, icon, label, title }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selectedRole === id}
              title={title}
              className={`${roleTabBase} role-tab-btn ${selectedRole === id ? roleTabActive + ' active-tab' : ''}`}
              onClick={() => selectRolePreset(id)}
            >
              <span className="text-sm">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Role banner */}
        {bannerText[selectedRole] && (
          <div className={`px-3.5 py-2.5 rounded-[10px] text-xs leading-[1.45] mb-[18px] ${bannerColors[selectedRole]}`}>
            {bannerText[selectedRole]}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500" htmlFor="staff-username">
              Username
            </label>
            <div className="staff-input-wrap flex items-center bg-slate-50 border-[1.5px] border-slate-300 rounded-[10px] px-3 pl-3.5 transition-all duration-150">
              <span className="text-slate-400 flex items-center mr-2.5 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="staff-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (localError) setLocalError(''); }}
                placeholder={selectedRole === 'company_manager' ? 'manager' : selectedRole}
                className="staff-input flex-1 h-11 bg-transparent border-none text-[14px] font-medium text-slate-900 min-w-0 placeholder:text-slate-400 placeholder:font-normal"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500" htmlFor="staff-password">
                Password
              </label>
            </div>
            <div className="staff-input-wrap flex items-center bg-slate-50 border-[1.5px] border-slate-300 rounded-[10px] px-3 pl-3.5 transition-all duration-150">
              <span className="text-slate-400 flex items-center mr-2.5 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (localError) setLocalError(''); }}
                placeholder="Enter password"
                className="staff-input flex-1 h-11 bg-transparent border-none text-[14px] font-medium text-slate-900 min-w-0 placeholder:text-slate-400 placeholder:font-normal"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="bg-transparent border-none text-slate-400 hover:text-slate-500 cursor-pointer p-1.5 flex items-center justify-center rounded-md transition-colors duration-150"
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {displayError && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium" role="alert">
              <span>⚠️</span><span>{displayError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="staff-submit w-full h-[46px] mt-1 rounded-[10px] border-none text-[14px] font-bold tracking-[0.02em] text-white cursor-pointer flex items-center justify-center transition-all duration-150 disabled:opacity-65 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#d97706 0%,#b45309 100%)', boxShadow: '0 3px 12px rgba(217,119,6,0.28)' }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border-2 border-white/35 border-t-white"
                  style={{ animation: 'minimalSpin 0.7s linear infinite' }}
                />
                Signing In...
              </span>
            ) : (
              <span>Sign In to Terminal</span>
            )}
          </button>
        </form>

        {/* Quick autofill chips */}
        <div className="mt-5 pt-[18px] border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.03em]">Quick Logins:</span>
          <div className="flex gap-1.5 flex-wrap">
            {['admin', 'cashier', 'manager', 'tester'].map((chip) => (
              <button
                key={chip}
                type="button"
                className="autofill-chip-btn bg-slate-100 border border-slate-200 text-slate-700 rounded-md px-2 py-0.5 text-[11px] font-semibold font-mono cursor-pointer transition-all duration-150"
                onClick={() => selectRolePreset(chip === 'manager' ? 'company_manager' : chip)}
                title={`Autofill ${chip} credentials`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[11px] text-slate-400">
          Thenisai POS &amp; Inventory Suite • v2.6
        </div>
      </div>
    </div>
  );
}
