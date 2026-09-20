import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';

const ROLE_BADGES = {
  admin: { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'Store Admin' },
  cashier: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: 'Counter Cashier' },
};

const PROTECTED_IDS = new Set(['staff-1', 'staff-2']);

const emptyForm = { username: '', password: '', name: '', title: '', role: 'cashier', counter: '' };

export default function StaffManagement({ currentUser }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // In-Screen Collapsible Add / Edit Form state (No popup modal)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/staff');
      if (res.success) setStaffList(res.staff || []);
      else setError(res.message || 'Failed to load staff list.');
    } catch {
      setError('Could not reach backend server. Please verify connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const toggleAddStaff = () => {
    if (isAddStaffOpen && !editingStaff) {
      setIsAddStaffOpen(false);
      setFormError('');
      setFormSuccess('');
    } else {
      setEditingStaff(null);
      setForm(emptyForm);
      setFormError('');
      setFormSuccess('');
      setShowPassword(false);
      setIsAddStaffOpen(true);
    }
  };

  const startEdit = (staff) => {
    setEditingStaff(staff);
    setForm({
      username: staff.username,
      password: '',
      name: staff.name,
      title: staff.title || '',
      role: staff.role,
      counter: staff.counter || '',
    });
    setFormError('');
    setFormSuccess('');
    setShowPassword(false);
    setIsAddStaffOpen(true);
  };

  const closePanel = () => {
    setIsAddStaffOpen(false);
    setEditingStaff(null);
    setFormError('');
    setFormSuccess('');
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.name.trim()) { setFormError('Please enter full name of staff member.'); return; }
    if (!form.username.trim()) { setFormError('Please enter username / login ID.'); return; }
    if (!editingStaff && !form.password.trim()) { setFormError('Please enter a login password.'); return; }
    if (form.password && form.password.length < 4) { setFormError('Password must be at least 4 characters long.'); return; }
    if (!/^[a-z0-9_.-]+$/i.test(form.username)) { setFormError('Username can only contain letters, numbers, dot, underscore, and hyphen.'); return; }

    setSaving(true);
    setFormError('');
    setFormSuccess('');
    try {
      let res;
      if (!editingStaff) {
        res = await api.post('/api/staff', form);
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password; // keep existing password if blank
        res = await api.put(`/api/staff/${editingStaff.id}`, payload);
      }
      if (res.success) {
        setFormSuccess(res.message);
        showToast(res.message);
        setTimeout(() => {
          closePanel();
          fetchStaff();
        }, 500);
      } else {
        setFormError(res.message || 'Failed to save staff account.');
      }
    } catch (e) {
      setFormError(e?.message || 'Server error. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/api/staff/${deleteTarget.id}`);
      if (res.success) {
        showToast(res.message);
        setDeleteTarget(null);
        fetchStaff();
      } else {
        showToast(res.message || 'Failed to delete staff account.', 'error');
      }
    } catch {
      showToast('Server connection error.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const isProtected = (staff) => PROTECTED_IDS.has(staff.id);

  const adminCount = staffList.filter((s) => s.role === 'admin').length;
  const cashierCount = staffList.filter((s) => s.role === 'cashier').length;

  return (
    <section className="tab-content admin-staff-tab" style={{ position: 'relative' }}>
      {/* ── Toast Notification ─────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 28,
          zIndex: 99999,
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13.5px',
          fontWeight: 600,
          background: toast.type === 'error' ? '#991b1b' : '#15803d',
          color: '#ffffff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      {/* ── Header Strip ───────────────────────────────────────────── */}
      <div className="inventory-header-strip" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <span className="inventory-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#d4a843', letterSpacing: '0.08em' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            ROLE-BASED ACCESS CONTROL
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
            Staff &amp; Cashier Accounts
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Create and manage multi-cashier and admin login credentials with designated counter desks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={fetchStaff}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ↻ Refresh
          </button>

          {/* Toggle In-Screen Add Staff Panel (No Popup Modal!) */}
          <button
            type="button"
            onClick={toggleAddStaff}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: isAddStaffOpen && !editingStaff ? '1px solid #cbd5e1' : 'none',
              background: isAddStaffOpen && !editingStaff ? '#f1f5f9' : 'linear-gradient(135deg, #d4a843, #b8860b)',
              color: isAddStaffOpen && !editingStaff ? '#334155' : '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: isAddStaffOpen && !editingStaff ? 'none' : '0 2px 8px rgba(184,134,11,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {isAddStaffOpen && !editingStaff ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Close Add Form</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Staff Account</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── KPI Strip ─────────────────────────────────────────────────── */}
      <div className="inventory-kpis-grid" style={{ marginBottom: '20px' }}>
        <div className="inv-kpi-card total">
          <span className="kpi-label">Total Staff Accounts</span>
          <div className="kpi-val">{staffList.length}</div>
          <span className="kpi-sub">Registered login credentials</span>
        </div>
        <div className="inv-kpi-card ready">
          <span className="kpi-label">Counter Cashiers</span>
          <div className="kpi-val">{cashierCount}</div>
          <span className="kpi-sub">POS Counter billing access</span>
        </div>
        <div className="inv-kpi-card warning">
          <span className="kpi-label">Store Administrators</span>
          <div className="kpi-val">{adminCount}</div>
          <span className="kpi-sub">Full operations &amp; audit access</span>
        </div>
      </div>

      {/* ── In-Screen Collapsible Add / Edit Staff Master Panel (Matches Add Product UI) ── */}
      <AnimatePresence>
        {isAddStaffOpen && (
          <motion.div
            className="admin-add-product-inline-panel"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ marginBottom: '24px' }}
          >
            <div className="add-product-panel-header">
              <div className="panel-title-wrap">
                <div className="panel-badge-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="panel-main-title">
                    {editingStaff ? `Edit Staff Account — ${editingStaff.name}` : 'Add New Staff Account (In-Screen Master)'}
                  </h3>
                  <p className="panel-sub-text">
                    Enter staff credentials to immediately provision access for POS Billing or Store Administration
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="panel-close-btn"
                onClick={closePanel}
                title="Close form (Esc)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="panel-alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* Success Banner */}
            {formSuccess && (
              <div className="panel-alert-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="add-product-inline-form">
              <div className="form-grid-3col">
                {/* Full Name */}
                <div className="form-field-group">
                  <label htmlFor="staff-name">
                    Full Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="staff-name"
                    type="text"
                    placeholder="e.g., R. Murugan"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="panel-input"
                    autoFocus
                    required
                  />
                </div>

                {/* Username */}
                <div className="form-field-group">
                  <label htmlFor="staff-username">
                    Username / Login ID <span className="req-star">*</span>
                  </label>
                  <input
                    id="staff-username"
                    type="text"
                    placeholder="e.g., murugan01"
                    value={form.username}
                    disabled={editingStaff && isProtected(editingStaff)}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                    className="panel-input"
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-field-group">
                  <label htmlFor="staff-password">
                    {editingStaff ? 'New Password (leave blank to keep current)' : 'Login Password'} <span className="req-star">{!editingStaff ? '*' : ''}</span>
                  </label>
                  <div className="input-with-prefix" style={{ position: 'relative' }}>
                    <input
                      id="staff-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={editingStaff ? '•••••••• (unchanged)' : 'Min. 4 characters'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="panel-input"
                      style={{ paddingRight: 52, width: '100%' }}
                      required={!editingStaff}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#475569',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 8px',
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div className="form-field-group">
                  <label htmlFor="staff-role">
                    Assigned Role <span className="req-star">*</span>
                  </label>
                  <select
                    id="staff-role"
                    value={form.role}
                    disabled={editingStaff && editingStaff.id === 'staff-1'}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="panel-select"
                  >
                    <option value="cashier">Cashier — POS counter billing access</option>
                    <option value="admin">Administrator — Full store access &amp; audit</option>
                  </select>
                </div>

                {/* Job Title */}
                <div className="form-field-group">
                  <label htmlFor="staff-title">Job Title</label>
                  <input
                    id="staff-title"
                    type="text"
                    placeholder="e.g., Morning Shift Cashier"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="panel-input"
                  />
                </div>

                {/* Counter / Terminal */}
                <div className="form-field-group">
                  <label htmlFor="staff-counter">Assigned Counter / Terminal</label>
                  <input
                    id="staff-counter"
                    type="text"
                    placeholder="e.g., Counter Desk 02"
                    value={form.counter}
                    onChange={(e) => setForm((f) => ({ ...f, counter: e.target.value }))}
                    className="panel-input"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="panel-action-bar">
                <span className="hint-text">
                  Credentials are encrypted and immediately active for login upon saving.
                </span>
                <div className="action-btns-group">
                  <button
                    type="button"
                    className="panel-btn-cancel"
                    onClick={closePanel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="panel-btn-submit"
                    disabled={saving}
                    style={{
                      padding: '9px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: saving ? '#94a3b8' : 'linear-gradient(135deg, #d4a843, #b8860b)',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {saving ? 'Saving…' : editingStaff ? 'Save Changes' : 'Create Staff Account'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', marginBottom: 20, fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── Staff Table ───────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b', fontSize: '14px' }}>
          Loading staff accounts…
        </div>
      ) : (
        <div className="admin-table-wrapper" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <table className="admin-sales-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Staff Member</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Username / ID</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Counter / Terminal</th>
                <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13px' }}>
                    No staff accounts found. Click "Add New Staff Account" above to create one.
                  </td>
                </tr>
              )}
              {staffList.map((s) => {
                const badge = ROLE_BADGES[s.role] || ROLE_BADGES.cashier;
                const protected_ = isProtected(s);
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: 800,
                          color: badge.color,
                        }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '13.5px', color: '#0f172a' }}>
                            {s.name}
                          </strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {s.title || (s.role === 'admin' ? 'Store Administrator' : 'Counter Cashier')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}>
                        {badge.label}
                      </span>
                      {protected_ && (
                        <span style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginTop: 3 }}>
                          System Account
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        @{s.username}
                      </span>
                      <span style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8' }}>
                        ID: {s.id}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>
                        {s.counter || (s.role === 'admin' ? 'Operations Central' : 'Counter Desk 01')}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0f172a',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => !protected_ && setDeleteTarget(s)}
                          disabled={protected_}
                          title={protected_ ? 'Built-in accounts cannot be deleted' : `Delete ${s.name}`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid ' + (protected_ ? '#e2e8f0' : '#fecaca'),
                            background: protected_ ? '#f8fafc' : '#fee2e2',
                            color: protected_ ? '#94a3b8' : '#dc2626',
                            cursor: protected_ ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete Confirmation Dialog (Targeted prompt) ──────────────── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9001, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px' }}>
              ⚠️
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Delete Staff Account?</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 22px' }}>
              This will permanently remove <strong style={{ color: '#0f172a' }}>{deleteTarget.name}</strong> (@{deleteTarget.username}).<br />They will no longer be able to log in.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '13px' }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
