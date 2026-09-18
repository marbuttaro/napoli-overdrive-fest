import { lazy, Suspense } from 'react';
import { hyperspeedPresets } from '../Hyperspeed/HyperspeedPresets';
import logoFestival from '../../assets/logos/logo-festival.svg';
import styles from './Hero.module.css';

const Hyperspeed = lazy(() => import('../Hyperspeed/Hyperspeed'));

const Hero = () => {
  return (
    <section id="home" className={styles.hero}>
      <div className={styles.stage}>
        <Suspense fallback={null}>
          <Hyperspeed effectOptions={hyperspeedPresets.six} />
        </Suspense>
      </div>
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title}>
          <img src={logoFestival} alt="Overdrive Fest — Napoli" className={styles.logo} />
        </h1>

        <p className={styles.date}>Napoli &middot; 2&ndash;4 Ottobre 2026</p>

        <div className={styles.actions}>
          <a href="#programma" className="btn btn-primary">
            Scarica il programma
          </a>
          <a href="#gallery" className="btn btn-outline">
            Guarda la gallery
          </a>
        </div>
      </div>

      <a href="#gallery" className={styles.scrollHint} aria-label="Scorri per esplorare">
        <span />
      </a>
    </section>
  );
};

export default Hero;
