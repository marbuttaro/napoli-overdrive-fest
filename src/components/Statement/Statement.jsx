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

  // Autoplay muto su mobile è fragile per più motivi insieme:
  // 1) Safari su iOS a volte ignora l'autoplay se non vede l'attributo "muted"
  //    già impostato al parsing (React talvolta lo applica come proprietà DOM
  //    dopo, non come attributo HTML) — impostarlo via ref lo rende affidabile.
  // 2) Il primo play() può arrivare prima che il video abbia dati sufficienti
  //    su una rete mobile reale (mai un problema in locale/dev, dove è istantaneo):
  //    riproviamo quindi anche su loadedmetadata/canplay.
  // 3) Alcuni contesti (risparmio energetico, dati, ecc.) bloccano comunque
  //    l'autoplay puro: al primo tocco/click sulla pagina riproviamo un'ultima
  //    volta, dentro un gesture handler che i browser mobili accettano sempre.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    video.muted = true;

    // Riparte sempre dall'inizio: sia al primo caricamento sia se la pagina
    // viene ripristinata dalla cache di navigazione del browser (bfcache, es.
    // tasto "indietro"), dove il video può restare fermo a metà invece di
    // ricominciare come dopo un refresh vero e proprio.
    const restart = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    const tryPlay = () => {
      if (video.paused) video.play().catch(() => {});
    };

    const onPageShow = (event) => {
      if (event.persisted) restart();
    };

    restart();
    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    document.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('pageshow', onPageShow);

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
      document.removeEventListener('touchstart', tryPlay);
      document.removeEventListener('click', tryPlay);
      window.removeEventListener('pageshow', onPageShow);
    };
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
