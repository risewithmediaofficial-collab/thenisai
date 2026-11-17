export default function StatsBanner() {
  const stats = [
    { value: '100%', label: 'Farm-Fresh Cow Milk', icon: '🥛' },
    { value: '4+ Hrs', label: 'Brass Uruli Simmer', icon: '🍲' },
    { value: '50,000+', label: 'Highway Commuters Served', icon: '🚗' },
    { value: '20 Yrs', label: 'Artisanal Legacy (Est. 2006)', icon: '👑' },
  ];

  return (
    <section style={{ background: '#FFFFFF', padding: '24px 0', borderBottom: '1px solid var(--ks-border)' }}>
      <div className="ks-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--ks-bg-soft)',
                borderRadius: 'var(--ks-radius-md)',
                border: '1px solid var(--ks-border-light)',
              }}
            >
              <span style={{ fontSize: '24px' }}>{s.icon}</span>
              <div>
                <strong style={{
                  display: 'block',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--ks-charcoal)',
                  lineHeight: 1.1,
                }}>
                  {s.value}
                </strong>
                <span style={{
                  display: 'block',
                  fontSize: '11px',
                  color: 'var(--ks-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  marginTop: '2px',
                }}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
