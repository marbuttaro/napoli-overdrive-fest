import styles from './BackToTop.module.css';

// Solo mobile (vedi CSS): "Torna su" spostato qui, subito dopo Contatti/Mappa
// e prima del footer con logo e copyright. Su desktop resta dentro al footer
// (vedi Footer.jsx), questo componente è nascosto.
const BackToTop = () => (
  <div className={styles.wrap}>
    <a href="#home" className={styles.top}>
      Torna su ↑
    </a>
  </div>
);

export default BackToTop;
