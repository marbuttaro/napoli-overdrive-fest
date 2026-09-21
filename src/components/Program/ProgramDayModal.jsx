import { useEffect, useRef } from 'react';
import styles from './ProgramDayModal.module.css';
import bgImage from '../../assets/images/calendario-sfondo.webp';

const ProgramDayModal = ({ day, onClose }) => {
  const closeBtnRef = useRef(null);

  // Blocca lo scroll della pagina e chiude con Esc mentre il popup è aperto.
  useEffect(() => {
    if (!day) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [day, onClose]);

  if (!day) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-day-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.hero} style={{ backgroundImage: `url(${bgImage})` }}>
          <button
            type="button"
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Chiudi"
            className={styles.close}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <p className={styles.eyebrowLight}>Calendar &mdash; 2&ndash;4 Ottobre 2026</p>
          <h2 id="program-day-title" className={styles.dateHeading}>
            {day.dateNum} <span className={styles.dateHeadingAccent}>Ottobre</span>
          </h2>

          <div className={styles.weekdayRow}>
            <span className={styles.weekdayPill}>{day.weekday}</span>
            <span className={styles.entry}>{day.entry}</span>
          </div>
        </div>

        <ul className={styles.schedule}>
          {day.schedule.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={`${item.time}-${index}`} className={styles.scheduleRow}>
              <span className={styles.time}>{item.time}</span>
              <span className={styles.eventText}>
                <span className={styles.eventTitle}>{item.title}</span>
                {item.subtitle && <span className={styles.eventSubtitle}>{item.subtitle}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProgramDayModal;
