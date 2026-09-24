import { useEffect, useState } from 'react';
import styles from './Sponsors.module.css';
import distintivoFosSud from '../../assets/images/partner-logos/distintivo-fos-sud.png';
import comuneNapoli from '../../assets/images/partner-logos/comune-napoli.png';
import poliziaDiStato from '../../assets/images/partner-logos/polizia-di-stato.png';
import regioneCampania from '../../assets/images/partner-logos/regione-campania.png';

const MODULE_COUNT = 4;
const LOGOS_PER_MODULE = 4;

// Muro dei loghi sponsor nascosto finché non arrivano i loghi definitivi:
// rimettere a true per mostrarlo di nuovo.
const SHOW_SPONSOR_WALL = false;

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

// Loghi del muro caricati dalla dashboard /admin (vedi api/logos.js): un URL per
// posizione, oppure null dove non c'è ancora un logo e resta il segnaposto.
const useWallLogos = (enabled) => {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    fetch('/api/logos', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (Array.isArray(data?.logos)) setLogos(data.logos);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [enabled]);

  return logos;
};

const Sponsors = ({ showWall = SHOW_SPONSOR_WALL }) => {
  const wallLogos = useWallLogos(showWall);

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

        {showWall && Array.from({ length: MODULE_COUNT }).map((_, moduleIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={moduleIndex} className={styles.module}>
            {Array.from({ length: LOGOS_PER_MODULE }).map((__, logoIndex) => {
              const src = wallLogos[moduleIndex * LOGOS_PER_MODULE + logoIndex];
              return (
                // eslint-disable-next-line react/no-array-index-key
                <div key={logoIndex} className={styles.card}>
                  {src ? <img src={src} alt="Logo partner" loading="lazy" /> : <span>LOGO</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Sponsors;
