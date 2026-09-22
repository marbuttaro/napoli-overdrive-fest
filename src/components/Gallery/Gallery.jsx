import styles from './Gallery.module.css';

import g1 from '../../assets/images/gallery/gallery-01.webp';
import g2 from '../../assets/images/gallery/gallery-02.webp';
import g3 from '../../assets/images/gallery/gallery-03.webp';
import g4 from '../../assets/images/gallery/gallery-04.webp';
import g5 from '../../assets/images/gallery/gallery-05.webp';
import g6 from '../../assets/images/gallery/gallery-06.webp';

// Posizioni sui moduli della griglia (grid-line CSS): scacchiera irregolare con almeno
// un modulo vuoto di distacco tra una foto e l'altra, sia in orizzontale che in verticale.
// Il primo modulo (col1/row1) è occupato dal titolo, non da una foto.
// "position" = object-position, scelto per tenere in inquadratura veicoli e persone
// dopo il crop (object-fit: cover) nel modulo quadrato/rettangolare assegnato.
const PHOTOS = [
  {
    src: g1,
    alt: 'Lamborghini Revuelto in esposizione al festival',
    col: '2 / 3',
    row: '2 / 3',
    position: '58% 55%',
  },
  {
    src: g5,
    alt: 'Moto e auto sportive in esposizione al Centro Direzionale',
    col: '3 / 5',
    row: '1 / 2',
    position: '50% 55%',
  },
  {
    src: g3,
    alt: 'Wheelie davanti al Centro Direzionale di Napoli',
    col: '3 / 4',
    row: '3 / 5',
    position: '68% 45%',
  },
  {
    src: g6,
    alt: 'Auto storiche in fila al raduno',
    col: '1 / 2',
    row: '3 / 4',
    position: '62% 55%',
  },
  {
    src: g4,
    alt: 'Pilota davanti al pubblico durante lo show',
    col: '2 / 3',
    row: '5 / 6',
    position: '25% 42%',
  },
  {
    src: g2,
    alt: 'Bandiera Overdrive Fest tra i grattacieli del Centro Direzionale',
    col: '4 / 5',
    row: '5 / 6',
    position: '50% 60%',
  },
];

const Gallery = () => {
  return (
    <section id="gallery" className={`section ${styles.section}`}>
      <div className={`module-grid ${styles.grid}`}>
        <div className={styles.head}>
          <p className="eyebrow">Edizione precedente</p>
          <h2 className="section-title">Gallery</h2>
          <p className={styles.intro}>
            Un assaggio dell&apos;energia di Napoli Overdrive Festival. Sfoglia la gallery per
            iniziare a scaldare i motori in vista della prossima edizione.
          </p>
        </div>

        {PHOTOS.map((photo) => (
          <figure
            key={photo.src}
            className={styles.item}
            style={{ gridColumn: photo.col, gridRow: photo.row }}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              style={{ objectPosition: photo.position }}
            />
          </figure>
        ))}
      </div>
    </section>
  );
};

export default Gallery;
