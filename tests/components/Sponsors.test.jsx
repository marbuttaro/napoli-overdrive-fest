// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Sponsors from '../../src/components/Sponsors/Sponsors.jsx';

afterEach(cleanup);

const mockFetch = (implementation) => vi.stubGlobal('fetch', vi.fn(implementation));
const jsonResponse = (data, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(data) });
const wallImages = (container) => [...container.querySelectorAll('img[alt="Logo partner"]')];

describe('Sponsors', () => {
  it('mostra 16 segnaposto finché i loghi non sono caricati', () => {
    mockFetch(() => new Promise(() => {}));
    render(<Sponsors showWall />);
    expect(screen.getAllByText('LOGO')).toHaveLength(16);
  });

  it('richiede i loghi a /api/logos', () => {
    mockFetch(() => jsonResponse({ logos: [] }));
    render(<Sponsors showWall />);
    expect(fetch).toHaveBeenCalledWith('/api/logos', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('mette ogni logo nella sua posizione e lascia il segnaposto dove manca', async () => {
    const logos = Array(16).fill(null);
    // Posizioni non simmetriche: un errore righe/colonne le sposterebbe.
    logos[1] = 'https://blob.test/a.webp';
    logos[6] = 'https://blob.test/b.webp';
    logos[14] = 'https://blob.test/c.webp';
    mockFetch(() => jsonResponse({ logos }));

    const { container } = render(<Sponsors showWall />);
    await waitFor(() => expect(wallImages(container)).toHaveLength(3));
    expect(screen.getAllByText('LOGO')).toHaveLength(13);

    // Ordine nel DOM = ordine delle posizioni (modulo per modulo, 4 loghi ciascuno).
    const cards = [...container.querySelectorAll('img[alt="Logo partner"], span')].filter(
      (el) => el.tagName === 'IMG' || el.textContent === 'LOGO',
    );
    expect(cards).toHaveLength(16);
    cards.forEach((card, index) => {
      if (logos[index]) expect(card.getAttribute('src')).toBe(logos[index]);
      else expect(card.textContent).toBe('LOGO');
    });
  });

  it.each([
    ['la rete fallisce', () => Promise.reject(new TypeError('offline'))],
    ['l\'API risponde con errore', () => jsonResponse({ error: 'x' }, false)],
    ['la risposta non ha il formato atteso', () => jsonResponse({ logos: 'nope' })],
  ])('se %s restano i segnaposto', async (_, implementation) => {
    mockFetch(implementation);
    const { container } = render(<Sponsors showWall />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getAllByText('LOGO')).toHaveLength(16);
    expect(wallImages(container)).toHaveLength(0);
  });

  it('annulla la richiesta quando il componente viene smontato', () => {
    let signal;
    mockFetch((_, options) => {
      signal = options.signal;
      return new Promise(() => {});
    });
    const { unmount } = render(<Sponsors showWall />);
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it('di default il muro è nascosto e non richiede i loghi', () => {
    mockFetch(() => jsonResponse({ logos: [] }));
    render(<Sponsors />);
    expect(screen.queryAllByText('LOGO')).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText('Partner & Sponsor')).toBeTruthy();
  });

  it('il marquee dei partner resta invariato', () => {
    mockFetch(() => new Promise(() => {}));
    render(<Sponsors />);
    expect(screen.getByText(/Loghi dei partner del festival: .*Comune di Napoli/)).toBeTruthy();
  });
});
