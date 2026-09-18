import styles from './Sponsors.module.css';

const MODULE_COUNT = 4;
const LOGOS_PER_MODULE = 4;

const Sponsors = () => {
  return (
    <section id="sponsor" className={`section ${styles.section}`}>
      <div className={`module-grid ${styles.grid}`}>
        <div className={styles.head}>
          <p className="eyebrow">Al nostro fianco</p>
          <h2 className="section-title">Sponsor &amp; Partner</h2>
          <p className={styles.intro}>
            I loghi dei nostri sponsor e partner ufficiali saranno pubblicati qui a breve.
          </p>
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
