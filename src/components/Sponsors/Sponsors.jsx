import styles from './Sponsors.module.css';
import distintivoFosSud from '../../assets/images/partner-logos/distintivo-fos-sud.png';
import comuneNapoli from '../../assets/images/partner-logos/comune-napoli.png';
import poliziaDiStato from '../../assets/images/partner-logos/polizia-di-stato.png';
import regioneCampania from '../../assets/images/partner-logos/regione-campania.png';

const MODULE_COUNT = 4;
const LOGOS_PER_MODULE = 4;

const PARTNER_LOGOS = [
  { src: distintivoFosSud, alt: 'Comando Territoriale Sud - Esercito Italiano' },
  { src: comuneNapoli, alt: 'Comune di Napoli' },
  { src: poliziaDiStato, alt: 'Polizia di Stato' },
  { src: regioneCampania, alt: 'Regione Campania' },
];

const LogoGroup = () => (
  <div className={styles.group} aria-hidden="true">
    {PARTNER_LOGOS.map((logo) => (
      <div key={logo.alt} className={styles.logoCard}>
        <img src={logo.src} alt="" loading="lazy" />
      </div>
    ))}
  </div>
);

const Sponsors = () => {
  return (
    <section id="sponsor" className={`section ${styles.section}`}>
      <p className={styles.srOnly}>
        Loghi dei partner del festival: {PARTNER_LOGOS.map((logo) => logo.alt).join(', ')}.
      </p>

      <div className={`module-grid ${styles.grid}`}>
        <div className={styles.headingBlock}>
          <h2 className={`section-title ${styles.title}`}>Partner &amp; Sponsor</h2>
        </div>

        <div className={styles.marqueeBlock}>
          <div className={styles.marqueeFrame}>
            <div className={styles.track}>
              <LogoGroup />
              <LogoGroup />
            </div>
          </div>
        </div>

        {Array.from({ length: MODULE_COUNT }).map((_, moduleIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={moduleIndex} className={styles.module}>
            {Array.from({ length: LOGOS_PER_MODULE }).map((__, logoIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={logoIndex} className={styles.card}>
                <span>LOGO</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Sponsors;
