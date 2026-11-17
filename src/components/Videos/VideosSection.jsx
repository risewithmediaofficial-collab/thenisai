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
    <section id="videos-section" className="ks-section ks-section--soft">
      <div className="ks-container">
        {/* Minimal Section Header */}
        <div className="ks-section-header">
          <span className="ks-section-header__sub">
            Thenisai in Motion
          </span>
          <h2 className="ks-section-header__title">
            Kitchen Craft &amp; Highway Stories
          </h2>
          <p style={{
            maxWidth: '540px',
            margin: '10px auto 0',
            fontSize: '14.5px',
            color: 'var(--ks-muted)',
            lineHeight: 1.6,
          }}>
            Short-form 9:16 video reels showing our daily sweet making, live counters, and highway boutique.
          </p>
        </div>

        {/* 9:16 Vertical Video Grid or Empty Slots */}
        {VIDEOS.length > 0 ? (
          <div className="ks-videos-grid-916">
            {VIDEOS.map((video) => (
              <div
                key={video.id}
                className="ks-video-card-916"
                onClick={() => setActiveVideo(video)}
              >
                <img
                  src={video.thumbnail || '/images/products/sweets_platter_hero.jpg'}
                  alt={video.title}
                  className="ks-video-card-916__thumb"
                />

                <div className="ks-video-card-916__overlay">
                  <div className="ks-video-card-916__play-btn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>

                  <div className="ks-video-card-916__meta">
                    {video.duration && (
                      <span className="ks-video-card-916__duration">{video.duration}</span>
                    )}
                    <h3 className="ks-video-card-916__title">{video.title}</h3>
                    {video.desc && <p className="ks-video-card-916__desc">{video.desc}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean 9:16 Vertical Reel Slots Ready for User Links */
          <div className="ks-videos-empty-grid-916">
            {[1, 2, 3].map((slot) => (
              <div key={slot} className="ks-video-empty-slot-916">
                <div className="ks-video-empty-slot-916__phone-notch" />
                <div className="ks-video-empty-slot-916__icon-wrap">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span className="ks-video-empty-slot-916__badge">9:16 Reel {slot}</span>
                <h4 className="ks-video-empty-slot-916__title">Video Slot {slot}</h4>
                <p className="ks-video-empty-slot-916__text">
                  Provide your 9:16 video link or upload reel file.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 9:16 Vertical Video Lightbox Modal */}
      {activeVideo && (
        <div
          className="ks-video-modal-overlay"
          onClick={() => setActiveVideo(null)}
        >
          <div className="ks-video-modal-916" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ks-video-modal__close"
              onClick={() => setActiveVideo(null)}
              aria-label="Close video player"
            >
              ✕
            </button>

            <div className="ks-video-modal-916__media">
              {isYouTube(activeVideo.url) ? (
                <iframe
                  src={getEmbedUrl(activeVideo.url)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="ks-video-modal-916__iframe"
                />
              ) : (
                <video
                  src={activeVideo.url}
                  controls
                  autoPlay
                  className="ks-video-modal-916__video"
                />
              )}
            </div>

            <div className="ks-video-modal-916__footer">
              <h3>{activeVideo.title}</h3>
              {activeVideo.desc && <p>{activeVideo.desc}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
