import styles from './Statement.module.css';
import bannerImg from '../../assets/images/gallery/gallery-07.webp';

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
          <img
            src={bannerImg}
            alt="Backflip in moto tra i grattacieli del Centro Direzionale di Napoli"
            className={styles.image}
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
