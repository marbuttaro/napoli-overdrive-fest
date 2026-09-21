import { useEffect, useRef } from 'react';
import styles from './Statement.module.css';
import bannerVideo from '../../assets/video/statement-loop.mp4';
import bannerPoster from '../../assets/images/statement-poster.webp';

const PHRASE = 'Energia, istinto, passione.';

const MarqueeGroup = () => (
  <div className={styles.group} aria-hidden="true">
    {Array.from({ length: 6 }).map((_, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <span key={index} className={styles.phrase}>
        {PHRASE}
      </span>
    ))}
  </div>
);

const Statement = () => {
  const videoRef = useRef(null);

  // Safari su iOS ignora l'autoplay se non vede l'attributo "muted" già impostato
  // al parsing dell'elemento: React a volte lo applica come proprietà DOM dopo,
  // non come attributo HTML, e l'autoplay viene bloccato in silenzio. Impostandolo
  // via ref (più un tentativo esplicito di play()) l'autoplay parte in modo affidabile.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <div className={styles.wrap}>
      <p className={styles.srOnly}>{PHRASE}</p>

      <div className="module-grid">
        <div className={styles.frame}>
          <video
            ref={videoRef}
            className={styles.image}
            src={bannerVideo}
            poster={bannerPoster}
            autoPlay
            loop
            muted
            defaultMuted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className={styles.overlay} aria-hidden="true" />
        </div>

        <div className={styles.marqueeFrame}>
          <div className={styles.track}>
            <MarqueeGroup />
            <MarqueeGroup />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statement;
