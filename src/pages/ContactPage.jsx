import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function ContactPage() {
  const { navigateTo } = useCart();
  const [inquiryType, setInquiryType] = useState('wedding');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSubmitted(true);
  };

  const handleGoToMenu = () => {
    window.location.hash = '#menu';
    navigateTo('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMaps = () => {
    window.open('https://maps.google.com/?q=Thenisai+Palkova+and+Sweets+Krishnagiri', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-gray-900">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-b from-[#FFF9EE] to-[#FAF7F2] border-b border-amber-100/70 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#B32D00] mb-2 block">
            Store Location &amp; Contact
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
            Visit Thenisai Sweets at Krishnagiri
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
            Located directly on the Bangalore–Salem Highway (NH 44) opposite HP Petrol Bunk. Stop by for fresh hot Palkova, tea, or order bulk sweet boxes for your celebrations.
          </p>
        </div>
      </section>

      {/* 2. Main Grid: Store Details & Bulk Inquiry Form */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Boutique Information */}
            <div className="lg:col-span-5 space-y-5">
              {/* Address Card */}
              <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
                <span className="text-3xl block mb-3">📍</span>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-2">
                  Highway Boutique Address
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Thenisai Palkova &amp; Sweets, Nattamai Kottai,<br />
                  Opposite HP Petrol Bunk, Bangalore–Salem Highway (NH 44),<br />
                  Krishnagiri, Tamil Nadu &ndash; 635001.
                </p>
                <button
                  type="button"
                  onClick={handleMaps}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-semibold text-xs shadow-sm hover:shadow transition-all active:scale-95"
                >
                  <span>Open in Google Maps</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                </button>
              </div>

              {/* Timings Card */}
              <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
                <span className="text-3xl block mb-3">⏰</span>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-2">
                  Operating Timings
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Monday &ndash; Sunday: <strong className="text-gray-900">6:00 AM &ndash; 10:30 PM Daily</strong><br />
                  Fresh hot morning Palkova batches available starting 7:30 AM every morning.
                </p>
              </div>

              {/* Contact Card */}
              <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
                <span className="text-3xl block mb-3">📞</span>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-2">
                  Direct Contact &amp; WhatsApp
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Counter &amp; Order Desk: <strong className="text-gray-900">+91 93448 93547</strong>
                </p>
                <a
                  href="https://wa.me/919344893547?text=Hi%20Thenisai%20Sweets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:bg-emerald-800 transition-all active:scale-95"
                >
                  <span>Chat on WhatsApp</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Column: Bulk Inquiries & Gifting Form */}
            <div className="lg:col-span-7 bg-white border border-amber-100 rounded-2xl p-6 sm:p-8 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B32D00] block mb-2">
                Festive &amp; Corporate Desk
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 mb-2">
                Wedding &amp; Bulk Orders Inquiry
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Get direct boutique quotes for custom sweet boxes, wedding return gifts, and company festive hampers.
              </p>

              {submitted ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                  <span className="text-3xl block mb-2 text-emerald-600">✓</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Inquiry Received!
                  </h3>
                  <p className="text-sm text-gray-600 mb-5">
                    Our Krishnagiri boutique manager will call you within 2 hours with customized sweet box options and bulk pricing.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoToMenu}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-semibold text-xs shadow-sm"
                  >
                    Browse Sweets Menu ↗
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Inquiry Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['wedding', 'corporate', 'family'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setInquiryType(type)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center ${
                            inquiryType === type
                              ? 'border-[#D97706] bg-amber-50 text-[#B45309]'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Box Quantity
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 100 boxes"
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Specific Sweets or Customization Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="E.g., 500g boxes with Signature Palkova, Mysore Pak, and Kaju Katli for wedding on NH 44"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] outline-none resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Submit Bulk Inquiry</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
