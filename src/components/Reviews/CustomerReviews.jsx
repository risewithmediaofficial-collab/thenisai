const REVIEWS = [
  {
    id: 1,
    name: 'Anitha & Karthik',
    role: 'Bangalore Commuters',
    quote: 'The Palkova tasted just like what my grandmother made in heavy brass urulis. Pure nostalgia in every single bite.',
    stars: 5,
  },
  {
    id: 2,
    name: 'Suresh Kumar',
    role: 'Highway Traveller',
    quote: 'Mandatory pitstop on our Bangalore–Salem highway trip. Fresh hot Palkova and Ghee Mysore Pak are simply unbeatable.',
    stars: 5,
  },
  {
    id: 3,
    name: 'Priya Ramesh',
    role: 'Wedding Gift Order',
    quote: 'Ordered 150 festive assorted sweet boxes for our family wedding. Outstanding pure ghee aroma and great packing.',
    stars: 5,
  },
];

export default function CustomerReviews() {
  return (
    <section className="bg-[#FAF7F2] py-12 sm:py-16 border-b border-[#EAE2D5] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-[#7B1812] uppercase font-bold text-xs sm:text-sm tracking-wider block mb-2">
            Customer Reviews
          </span>
          <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl text-[#1C130D] tracking-tight">
            What Customers Say About Thenisai
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((rev) => (
            <div key={rev.id} className="bg-white rounded-2xl border border-[#EAE2D5] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="text-[#C59334] text-base mb-3 tracking-wider">
                  {'★'.repeat(rev.stars)}
                </div>
                <p className="text-[#2C2018] text-sm sm:text-base leading-relaxed italic mb-6">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#FAF4E8] text-[#7B1812] font-bold flex items-center justify-center text-sm border border-[#EAE2D5] flex-shrink-0">
                  {rev.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1C130D] leading-none mb-1">{rev.name}</h4>
                  <span className="text-xs text-gray-500">{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
