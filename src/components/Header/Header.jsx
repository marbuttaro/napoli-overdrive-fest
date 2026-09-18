import { useState } from 'react';
import logoRed from '../../assets/logos/logo-red.svg';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#sponsor', label: 'Sponsor' },
  { href: '#programma', label: 'Programma' },
  { href: '#contatti', label: 'Contatti' },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="#home" className={styles.brand} onClick={closeMenu} aria-label="Overdrive Fest — Home">
          <img src={logoRed} alt="Overdrive Fest" className={styles.brandMark} />
        </a>

        <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ''}`}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className={styles.toggle}
          aria-label={isOpen ? 'Chiudi il menu' : 'Apri il menu'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
};

export default Header;
