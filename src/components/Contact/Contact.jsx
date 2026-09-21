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

        {/* Su mobile infoGroup si dissolve (display: contents): infoLeft e infoRight
            diventano due moduli affiancati invece di restare impilati in uno solo. */}
        <div className={styles.infoGroup}>
          <div className={styles.infoLeft}>
            <div>
              <h3 className={styles.infoTitle}>Location</h3>
              <p className={styles.infoText}>
                Centro Direzionale di Napoli
                <br />
                Napoli, Italia
              </p>
            </div>

            <div>
              <h3 className={styles.infoTitle}>Date</h3>
              <p className={styles.infoText}>2&ndash;4 Ottobre 2026</p>
            </div>
          </div>

          <div className={styles.infoRight}>
            <div>
              <h3 className={styles.infoTitle}>Contatti</h3>
              <p className={styles.infoText}>
                <a href="mailto:info@napoliOverdriveFest.it">info@napoliOverdriveFest.it</a>
              </p>
            </div>

            <div className={styles.social}>
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
