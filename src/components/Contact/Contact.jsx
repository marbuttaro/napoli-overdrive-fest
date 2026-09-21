import styles from './Contact.module.css';

const MAP_QUERY = 'Centro Direzionale di Napoli, Napoli';
const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;

const Contact = () => {
  return (
    <section id="contatti" className={`section ${styles.section}`}>
      <div className={`module-grid ${styles.grid}`}>
        <div className={styles.head}>
          <p className="eyebrow">Dove trovarci</p>
          <h2 className="section-title">Contatti &amp; Mappa</h2>
        </div>

        {/* Su desktop infoGroup impila i 4 blocchi come un'unica colonna (come prima).
            Su mobile si dissolve (display: contents) e ognuno diventa un modulo
            indipendente della griglia 2x2: Location/Contatti in alto, Date/Social
            in basso — vedi grid-column/grid-row nella media query. */}
        <div className={styles.infoGroup}>
          <div className={styles.locationCell}>
            <h3 className={styles.infoTitle}>Location</h3>
            <p className={styles.infoText}>
              Centro Direzionale di Napoli
              <br />
              Napoli, Italia
            </p>
          </div>

          <div className={styles.dateCell}>
            <h3 className={styles.infoTitle}>Date</h3>
            <p className={styles.infoText}>2&ndash;4 Ottobre 2026</p>
          </div>

          <div className={styles.contattiCell}>
            <h3 className={styles.infoTitle}>Contatti</h3>
            <p className={styles.infoText}>
              <a href="mailto:info@napoliOverdriveFest.it">info@napoliOverdriveFest.it</a>
            </p>
          </div>

          <div className={`${styles.social} ${styles.socialCell}`}>
            <a
              href="https://www.instagram.com/napolioverdrivefestival/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={styles.socialLink}
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/p/Napoli-Overdrive-Festival-61578426957738/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={styles.socialLink}
            >
              Facebook
            </a>
          </div>
        </div>

        <div className={styles.mapFrame}>
          <iframe
            title="Mappa - Centro Direzionale di Napoli"
            src={MAP_SRC}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className={styles.bottomSpacer} aria-hidden="true" />
      </div>
    </section>
  );
};

export default Contact;
