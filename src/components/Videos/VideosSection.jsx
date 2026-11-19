import { useState } from 'react';

/**
 * 9:16 Vertical Video Showcase Section (Reels / Shorts Format)
 * -------------------------------------------------------------
 * To add your vertical videos, simply add items to the VIDEOS array below:
 *
 * Example item format:
 * {
 *   id: 1,
 *   title: 'Traditional Palkova Craft',
 *   desc: 'Fresh cow milk simmering in heavy brass urulis',
 *   url: 'https://www.youtube.com/embed/YOUR_SHORTS_ID', // Or local file: '/videos/palkova-reel.mp4'
 *   thumbnail: '/images/products/sweets_platter_hero.jpg', // Optional preview image
 *   duration: '0:45'
 * }
 */
export const VIDEOS = [
  // Keeping empty as requested. Add your 9:16 vertical video links or uploaded paths here!
];

export default function VideosSection() {
  const [activeVideo, setActiveVideo] = useState(null);

  const isYouTube = (url) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('embed')) return url;
    if (url.includes('shorts/')) {
      const id = url.split('shorts/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&loop=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    return url;
  };

  return (
    <section id="videos-section" className="bg-[#FAF7F2] py-12 sm:py-16 border-b border-[#EAE2D5] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Minimal Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-[#7B1812] uppercase font-bold text-xs sm:text-sm tracking-wider block mb-2">
            Watch Our Kitchen
          </span>
          <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl text-[#1C130D] tracking-tight mb-3">
            How We Make Our Sweets
          </h2>
          <p className="text-[#5C4A3E] text-xs sm:text-sm md:text-base text-center max-w-lg mx-auto">
            See how our pure cow milk palkova and fresh ghee sweets are made daily at Krishnagiri.
          </p>
        </div>

        {/* 9:16 Vertical Video Grid or Empty Slots */}
        {VIDEOS.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {VIDEOS.map((video) => (
              <div
                key={video.id}
                className="aspect-[9/16] w-full max-w-[260px] mx-auto rounded-3xl overflow-hidden relative shadow-lg cursor-pointer group bg-black"
                onClick={() => setActiveVideo(video)}
              >
                <img
                  src={video.thumbnail || '/images/products/sweets_platter_hero.jpg'}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-4">
                  <div className="w-12 h-2.5 bg-black/40 rounded-full mx-auto" />
                  <div className="w-12 h-12 rounded-full bg-white/90 text-[#7B1812] flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>

                  <div className="text-white">
                    {video.duration && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-md inline-block mb-1">{video.duration}</span>
                    )}
                    <h3 className="font-bold text-sm leading-snug">{video.title}</h3>
                    {video.desc && <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{video.desc}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean 9:16 Vertical Reel Slots Ready for User Links */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[1, 2, 3].map((slot) => (
              <div
                key={slot}
                className="aspect-[9/16] w-full max-w-[240px] mx-auto rounded-3xl bg-white border-2 border-dashed border-[#C59334]/40 flex flex-col items-center justify-between p-5 text-center shadow-xs hover:border-[#C59334] transition-all"
              >
                <div className="w-12 h-2 bg-gray-200 rounded-full" />
                <div className="flex flex-col items-center my-auto">
                  <div className="w-12 h-12 rounded-full bg-[#FAF4E8] text-[#C59334] flex items-center justify-center mb-3 shadow-xs">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF4E8] text-[#A97922] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    9:16 Reel {slot}
                  </span>
                  <h4 className="font-bold text-sm text-[#1C130D] mb-1">Video Slot {slot}</h4>
                  <p className="text-xs text-gray-500 max-w-[150px] leading-relaxed">
                    Provide 9:16 video link or upload reel file.
                  </p>
                </div>
                <div className="w-16 h-1 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9:16 Vertical Video Lightbox Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[1000000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-sm aspect-[9/16] bg-black rounded-3xl overflow-hidden relative shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors border-0 cursor-pointer text-sm"
              onClick={() => setActiveVideo(null)}
              aria-label="Close video player"
            >
              ✕
            </button>

            <div className="w-full h-full flex items-center justify-center">
              {isYouTube(activeVideo.url) ? (
                <iframe
                  src={getEmbedUrl(activeVideo.url)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={activeVideo.url}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
              <h3 className="font-bold text-sm leading-snug">{activeVideo.title}</h3>
              {activeVideo.desc && <p className="text-xs text-white/80 line-clamp-2 mt-0.5">{activeVideo.desc}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
