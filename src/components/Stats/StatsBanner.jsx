export default function StatsBanner() {
  const stats = [
    { value: '500+', label: 'Daily Fresh Batches' },
    { value: '50,000+', label: 'Happy Customers' },
    { value: '100%', label: 'Authentic Pure Milk Recipes' },
    { value: '20+', label: 'Years of Tradition (Est. 2006)' },
  ];

  return (
    <section className="stardust-stats">
      <div className="stardust-container">
        <div className="stardust-stats__grid font-lato">
          {stats.map((s) => (
            <div key={s.label} className="stardust-stats__item">
              <span className="stardust-stats__value font-garamond">{s.value}</span>
              <span className="stardust-stats__label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

