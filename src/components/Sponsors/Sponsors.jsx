import styles from './Sponsors.module.css';
import { MINOR_PARTNERS } from './minorPartners.js';
import distintivoFosSud from '../../assets/images/partner-logos/distintivo-fos-sud.png';
import comuneNapoli from '../../assets/images/partner-logos/comune-napoli.png';
import poliziaDiStato from '../../assets/images/partner-logos/polizia-di-stato.png';
import regioneCampania from '../../assets/images/partner-logos/regione-campania.png';
import anm from '../../assets/images/partner-logos/anm.webp';
import federicoII from '../../assets/images/partner-logos/federico-ii.webp';
import stellantis from '../../assets/images/sponsor-logos/stellantis.webp';
import delPriore from '../../assets/images/sponsor-logos/del-priore.webp';
import businessCarSeller from '../../assets/images/sponsor-logos/business-car-seller.webp';
import afrodite from '../../assets/images/sponsor-logos/afrodite.webp';
import villaAlmaPlena from '../../assets/images/sponsor-logos/villa-alma-plena.webp';
import tangenziale from '../../assets/images/sponsor-logos/tangenziale.webp';
import tecnam from '../../assets/images/sponsor-logos/tecnam-flight-academy.webp';
import radioMarte from '../../assets/images/sponsor-logos/radio-marte.webp';
import siComunicazione from '../../assets/images/sponsor-logos/si-comunicazione.webp';
import smh from '../../assets/images/sponsor-logos/smh.webp';
import whitechillout from '../../assets/images/sponsor-logos/whitechillout.webp';
import guidareSicuri from '../../assets/images/sponsor-logos/guidare-sicuri.webp';

const MODULE_COUNT = 4;

// Muro degli sponsor come appare su desktop: 2 righe da 8 posti (4 moduli 2x2 affiancati).
// null = posto vuoto; il primo e l'ultimo di ogni riga restano liberi.
const WALL_ROWS = [
  [
    null,
    { src: stellantis, alt: 'Stellantis &You Sales & Services' },
    { src: delPriore, alt: 'Del Priore' },
    { src: businessCarSeller, alt: 'Business Car Seller' },
    { src: afrodite, alt: 'Afrodite Events' },
    { src: villaAlmaPlena, alt: 'Villa Alma Plena' },
    { src: tangenziale, alt: 'Tangenziale di Napoli' },
    null,
  ],
  [
    null,
    { src: tecnam, alt: 'Tecnam Flight Academy' },
    { src: radioMarte, alt: 'Radio Marte' },
    { src: siComunicazione, alt: 'Sì Comunicazione' },
    { src: smh, alt: 'Sport Media House' },
    { src: whitechillout, alt: 'Whitechillout' },
    { src: guidareSicuri, alt: 'Guidare Sicuri - Scuola di pilotaggio' },
    null,
  ],
];

// Posizione di lettura (riga per riga) di ogni logo: su mobile i moduli si
// sciolgono e i loghi vanno messi in quest'ordine, senza i posti vuoti.
const readingOrder = new Map(WALL_ROWS.flat().filter(Boolean).map((logo, index) => [logo, index]));

// I 4 posti di ogni modulo: due in alto (riga 1) e due in basso (riga 2).
const moduleSlots = (moduleIndex) => [
  WALL_ROWS[0][moduleIndex * 2],
  WALL_ROWS[0][moduleIndex * 2 + 1],
  WALL_ROWS[1][moduleIndex * 2],
  WALL_ROWS[1][moduleIndex * 2 + 1],
];

// Fascia dei partner minori, sotto il muro: ogni quarto di modulo è diviso a metà in
// orizzontale (due posti larghi e bassi uno sopra l'altro), quindi 8 posti per riga;
// il primo e l'ultimo restano vuoti come nel muro.
const MINOR_SLOTS_PER_ROW = 8;
const MINOR_SIDE_GAP = 1;
const MINOR_PER_ROW = MINOR_SLOTS_PER_ROW - MINOR_SIDE_GAP * 2;
const MINOR_ROWS_PER_MODULE = 4;

const minorRows = [];
for (let start = 0; start < MINOR_PARTNERS.length; start += MINOR_PER_ROW) {
  const logos = MINOR_PARTNERS.slice(start, start + MINOR_PER_ROW);
  const row = Array(MINOR_SLOTS_PER_ROW).fill(null);
  // Un'ultima riga incompleta resta centrata.
  const offset = MINOR_SIDE_GAP + Math.floor((MINOR_PER_ROW - logos.length) / 2);
  logos.forEach((logo, index) => { row[offset + index] = logo; });
  minorRows.push(row);
}
// Quattro righe di partner minori = una riga di moduli: si completa con righe vuote.
while (minorRows.length % MINOR_ROWS_PER_MODULE) {
  minorRows.push(Array(MINOR_SLOTS_PER_ROW).fill(null));
}

// Moduli della fascia: 4 per riga di moduli, ognuno con 4 righe da 2 posti.
const minorModules = [];
for (let first = 0; first < minorRows.length; first += MINOR_ROWS_PER_MODULE) {
  for (let moduleIndex = 0; moduleIndex < MODULE_COUNT; moduleIndex += 1) {
    minorModules.push(
      minorRows
        .slice(first, first + MINOR_ROWS_PER_MODULE)
        .flatMap((row) => [row[moduleIndex * 2], row[moduleIndex * 2 + 1]]),
    );
  }
}

const renderSlot = ({ logo, order, slotKey }) => (logo ? (
  <div key={logo.alt} className={`${styles.card} ${styles.cardLogo}`} style={{ '--mobile-order': order }}>
    <span className={styles.plate}>
      <img src={logo.src} alt={logo.alt} loading="lazy" />
    </span>
  </div>
) : (
  <div key={slotKey} className={`${styles.card} ${styles.cardEmpty}`} aria-hidden="true" />
));

// Marquee dei partner, in ordine di importanza: ANM, istituzioni, forze dell'ordine, università.
const PARTNER_LOGOS = [
  { src: anm, alt: 'ANM - Azienda Napoletana Mobilità' },
  { src: regioneCampania, alt: 'Regione Campania' },
  { src: comuneNapoli, alt: 'Comune di Napoli' },
  { src: distintivoFosSud, alt: 'Comando Territoriale Sud - Esercito Italiano' },
  { src: poliziaDiStato, alt: 'Polizia di Stato' },
  { src: federicoII, alt: 'Università degli Studi di Napoli Federico II' },
];

const LogoGroup = () => (
  <div className={styles.group} aria-hidden="true">
    {PARTNER_LOGOS.map((logo) => (
      <div key={logo.alt} className={styles.logoCard}>
        <img src={logo.src} alt="" loading="lazy" />
      </div>
    ))}
  </div>
);

const Sponsors = () => {
  return (
    <section id="sponsor" className={`section ${styles.section}`}>
      <p className={styles.srOnly}>
        Loghi dei partner del festival: {PARTNER_LOGOS.map((logo) => logo.alt).join(', ')}.
      </p>

      <div className={`module-grid ${styles.grid}`}>
        <div className={styles.headingBlock}>
          <h2 className={`section-title ${styles.title}`}>Partner &amp; Sponsor</h2>
        </div>

        <div className={styles.marqueeBlock}>
          <div className={styles.marqueeFrame}>
            <div className={styles.track}>
              <LogoGroup />
              <LogoGroup />
            </div>
          </div>
        </div>

        {Array.from({ length: MODULE_COUNT }).map((_, moduleIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={moduleIndex} className={styles.module}>
            {moduleSlots(moduleIndex).map((logo, slotIndex) => renderSlot({
              logo,
              order: readingOrder.get(logo),
              slotKey: slotIndex,
            }))}
          </div>
        ))}

        <div className={styles.minorWall} style={{ '--minor-module-rows': minorRows.length / MINOR_ROWS_PER_MODULE }}>
          {minorModules.map((slots, moduleIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={moduleIndex} className={styles.minorModule}>
              {slots.map((logo, slotIndex) => renderSlot({
                logo,
                order: MINOR_PARTNERS.indexOf(logo),
                slotKey: slotIndex,
              }))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Sponsors;
