import logoWhite from '../../assets/logos/logo-white.svg';
import styles from './Footer.module.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <a href="#home" className={styles.brand}>
          <img src={logoWhite} alt="Overdrive Fest" className={styles.mark} />
        </a>

        <p className={styles.copy}>
          &copy; {year} Overdrive Fest &mdash; Napoli, 2&ndash;4 Ottobre 2026
        </p>

        <a href="#home" className={styles.top}>
          Torna su ↑
        </a>
      </div>
    </footer>
  );
};

export default Footer;
