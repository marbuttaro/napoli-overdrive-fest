// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Sponsors from '../../src/components/Sponsors/Sponsors.jsx';
import { MINOR_PARTNERS } from '../../src/components/Sponsors/minorPartners.js';

afterEach(cleanup);

const SPONSORS_IN_ORDER = [
  'Stellantis &You Sales & Services',
  'Del Priore',
  'Business Car Seller',
  'Afrodite Events',
  'Villa Alma Plena',
  'Tangenziale di Napoli',
  'Tecnam Flight Academy',
  'Radio Marte',
  'Sì Comunicazione',
  'Sport Media House',
  'Whitechillout',
  'Guidare Sicuri - Scuola di pilotaggio',
];

// I 4 moduli del muro, ognuno con i suoi 4 posti (logo o vuoto) nell'ordine del DOM.
const wallModules = (container) =>
  [...container.querySelectorAll('div')]
    .map((div) => [...div.children])
    .filter((slots) => slots.length === 4 && slots.every((slot) => /card/.test(slot.className)));
const isEmpty = (slot) => !slot.querySelector('img');

describe('Sponsors', () => {
  it('mostra i 12 loghi sponsor del muro', () => {
    render(<Sponsors />);
    SPONSORS_IN_ORDER.forEach((name) => expect(screen.getByAltText(name)).toBeTruthy());
  });

  it('ha 16 posti: 12 loghi e 4 vuoti, senza segnaposto "LOGO"', () => {
    const { container } = render(<Sponsors />);
    const slots = wallModules(container).flat();
    expect(slots).toHaveLength(16);
    expect(slots.filter(isEmpty)).toHaveLength(4);
    expect(screen.queryAllByText('LOGO')).toHaveLength(0);
  });

  it('lascia vuoti il primo e l\'ultimo posto di ogni riga', () => {
    const { container } = render(<Sponsors />);
    const modules = wallModules(container);
    // Posti del modulo: [alto-sx, alto-dx, basso-sx, basso-dx].
    const firstColumn = [modules[0][0], modules[0][2]];
    const lastColumn = [modules[3][1], modules[3][3]];
    [...firstColumn, ...lastColumn].forEach((slot) => expect(isEmpty(slot)).toBe(true));
  });

  it('su mobile i loghi seguono l\'ordine di lettura del muro', () => {
    render(<Sponsors />);
    SPONSORS_IN_ORDER.forEach((name, index) => {
      const card = screen.getByAltText(name).closest('[style]');
      expect(card.style.getPropertyValue('--mobile-order')).toBe(String(index));
    });
  });

  it('mostra tutti i 41 partner minori, ognuno con il suo file e senza doppioni', () => {
    render(<Sponsors />);
    expect(MINOR_PARTNERS).toHaveLength(41);
    MINOR_PARTNERS.forEach((partner) => expect(partner.src).toBeTruthy());
    const names = MINOR_PARTNERS.map((partner) => partner.alt);
    expect(new Set(names).size).toBe(names.length);
    names.forEach((name) => expect(screen.getByAltText(name)).toBeTruthy());
    // Nessun partner minore ripete un logo già nel muro sponsor.
    SPONSORS_IN_ORDER.forEach((name) => expect(screen.getAllByAltText(name)).toHaveLength(1));
  });

  it('i partner minori stanno in moduli da 8 posti (2 colonne x 4 righe), con il primo e l\'ultimo posto di ogni riga vuoti', () => {
    const { container } = render(<Sponsors />);
    const minorModules = [...container.querySelectorAll('div')]
      .map((div) => [...div.children])
      .filter((slots) => slots.length === 8 && slots.every((slot) => /card/.test(slot.className)));
    // 41 loghi / 6 per riga = 7 righe, completate a 8 = 2 righe di moduli da 4 = 8 moduli.
    expect(minorModules).toHaveLength(8);
    expect(minorModules.flat().filter((slot) => !isEmpty(slot))).toHaveLength(41);
    // Posti del modulo: coppie (sx, dx) riga per riga; i moduli 0/4 sono a sinistra, 3/7 a destra.
    [0, 4].forEach((left) => [0, 2, 4, 6].forEach((i) => expect(isEmpty(minorModules[left][i])).toBe(true)));
    [3, 7].forEach((right) => [1, 3, 5, 7].forEach((i) => expect(isEmpty(minorModules[right][i])).toBe(true)));
  });

  it('non richiede più i loghi alla dashboard', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<Sponsors />);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText('Partner & Sponsor')).toBeTruthy();
  });

  it('il marquee dei partner segue l\'ordine di importanza', () => {
    render(<Sponsors />);
    expect(
      screen.getByText(/Loghi dei partner del festival: ANM.*Regione Campania.*Comune di Napoli.*Esercito.*Polizia di Stato.*Federico II/),
    ).toBeTruthy();
  });
});
