import { useState } from 'react';
import styles from './Program.module.css';
import helmetsImg from '../../assets/images/helmets.webp';
import { PROGRAM_DAYS } from './programDays';
import ProgramDayModal from './ProgramDayModal';

// Il PDF del programma non è ancora pronto: pulsante nascosto momentaneamente,
// da riattivare (rimettere a true) quando il file sarà disponibile.
const SHOW_DOWNLOAD_CTA = false;

const Program = () => {
  const [activeDay, setActiveDay] = useState(null);

  return (
    <section id="programma" className={`section ${styles.section}`}>
      <div className={`module-grid ${styles.grid}`}>
        <div className={styles.card}>
          <div className={styles.textCell}>
            <p className="eyebrow">Non perderti nulla</p>
            <h2 className={`section-title ${styles.title}`}>Il programma</h2>
            <p className={styles.text}>
              Tre giorni di motori, show ed adrenalina nel cuore di Napoli. Scarica il
              programma completo con orari, aree espositive e ospiti di ogni giornata.
            </p>

            {SHOW_DOWNLOAD_CTA && (
              <a href="/programma.pdf" download className={`btn btn-primary ${styles.cta}`}>
                Scarica il programma (PDF)
              </a>
            )}
          </div>

          <div className={styles.datesCell}>
            <ul className={styles.days}>
              {PROGRAM_DAYS.map((day) => (
                <li key={day.date}>
                  <button
                    type="button"
                    className={styles.day}
                    onClick={() => setActiveDay(day)}
                    aria-haspopup="dialog"
                  >
                    <span className={styles.dayWeekday}>{day.weekday}</span>
                    <span className={styles.dayDate}>{day.date}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.photoPanel}>
            <img src={helmetsImg} alt="" aria-hidden="true" />
          </div>
        </div>
      </div>

      <ProgramDayModal day={activeDay} onClose={() => setActiveDay(null)} />
    </section>
  );
};

export default Program;
