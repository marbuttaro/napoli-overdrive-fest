import styles from './Program.module.css';
import helmetsImg from '../../assets/images/helmets.webp';

const DAYS = [
  { date: '2 Ottobre', label: 'Apertura & Esposizioni' },
  { date: '3 Ottobre', label: 'Show & Competizioni' },
  { date: '4 Ottobre', label: 'Gran Finale' },
];

const Program = () => {
  return (
    <section id="programma" className={`section ${styles.section}`}>
      <div className={`module-grid ${styles.grid}`}>
        <div className={styles.card}>
          <div className={styles.textCell}>
            <p className="eyebrow">Non perderti nulla</p>
            <h2 className="section-title">Il programma</h2>
            <p className={styles.text}>
              Tre giorni di motori, show ed adrenalina nel cuore di Napoli. Scarica il
              programma completo con orari, aree espositive e ospiti di ogni giornata.
            </p>

            <a href="/programma.pdf" download className={`btn btn-primary ${styles.cta}`}>
              Scarica il programma (PDF)
            </a>
          </div>

          <div className={styles.datesCell}>
            <ul className={styles.days}>
              {DAYS.map((day) => (
                <li key={day.date} className={styles.day}>
                  <span className={styles.dayDate}>{day.date}</span>
                  <span className={styles.dayLabel}>{day.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.photoPanel}>
            <img src={helmetsImg} alt="" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Program;
