import { useState } from 'react';

export default function SweetCircleSection() {
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContact('');
    }, 4000);
  };

  return (
    <section className="bg-white py-12 sm:py-16 font-sans border-b border-[#EAE2D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-[#FFF9EE] to-[#FAF2E3] border border-[#EAE2D5] rounded-3xl p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div>
            <span className="text-[#7B1812] uppercase font-bold text-xs sm:text-sm tracking-wider block mb-1">
              Get Batch Updates
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-[#1C130D] mb-2">
              Fresh Palkova Batch Alerts
            </h3>
            <p className="text-[#5C4A3E] text-xs sm:text-sm max-w-md m-0">
              Get notified when fresh morning hot palkova batches and festival sweet gift boxes are ready.
            </p>
          </div>

          {submitted ? (
            <span className="text-sm font-bold text-[#7B1812] bg-white px-4 py-2.5 rounded-full border border-[#EAE2D5]">
              ✓ Thank you! We will alert you about fresh batches on NH 44.
            </span>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              <input
                type="text"
                placeholder="Enter WhatsApp or email..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="px-4 py-3 rounded-full bg-white border border-[#EAE2D5] text-xs sm:text-sm text-[#1C130D] focus:outline-none focus:border-[#C59334] min-w-[220px] shadow-xs"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-[#7B1812] hover:bg-[#63120D] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 border-0 cursor-pointer text-center"
              >
                Get Updates ↗
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
