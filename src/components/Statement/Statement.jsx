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
  return (
    <div className={styles.wrap}>
      <p className={styles.srOnly}>{PHRASE}</p>

      <div className="module-grid">
        <div className={styles.frame}>
          <video
            className={styles.image}
            src={bannerVideo}
            poster={bannerPoster}
            autoPlay
            loop
            muted
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
