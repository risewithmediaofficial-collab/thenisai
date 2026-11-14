export default function StatsBanner() {
  const stats = [
    { value: '100%', label: 'Pure Cow Milk', icon: '🥛' },
    { value: '4 HRS', label: 'Brass Uruli Simmer', icon: '🔥' },
    { value: '50,000+', label: 'Highway Commuters', icon: '🚗' },
    { value: '20 YRS', label: 'Legacy Since 2006', icon: '👑' },
  ];

  return (
    <section className="thenisai-section" style={{ marginTop: '40px', marginBottom: '10px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        background: '#FAF7F2',
        border: '1px solid #EFE8DE',
        borderRadius: '20px',
        padding: '24px 32px',
      }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '28px', lineHeight: 1 }}>{s.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <span style={{
                display: 'block',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 900,
                fontSize: '22px',
                color: '#1C0F08',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}>
                {s.value}
              </span>
              <span style={{
                display: 'block',
                fontFamily: "'Lato', sans-serif",
                fontWeight: 700,
                fontSize: '11px',
                color: '#7A695B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: '3px',
              }}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
