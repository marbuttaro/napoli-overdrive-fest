import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as blob from '../helpers/blob-mock.js';
import * as images from '../helpers/images.js';
import { blobPrefix, deleteLogo, getLogos, LOGO_SLOTS, parseSlot, saveLogo } from '../../api/_lib/logos.js';

vi.mock('@vercel/blob', () => import('../helpers/blob-mock.js'));

beforeEach(() => {
  blob.resetStore();
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
  vi.stubEnv('VERCEL_ENV', 'production');
});

const storedFor = (slot) =>
  [...blob.store.values()].filter((b) => b.pathname.includes(`slot-${String(slot).padStart(2, '0')}`));

describe('parseSlot', () => {
  it('accetta solo interi da 1 a 16', () => {
    expect(parseSlot('1')).toBe(1);
    expect(parseSlot('16')).toBe(16);
    expect(parseSlot(7)).toBe(7);
    for (const invalid of ['0', '17', '-1', '1.5', 'abc', '', null, undefined]) {
      expect(parseSlot(invalid)).toBeNull();
    }
  });
});

describe('blobPrefix', () => {
  it('la produzione usa la cartella pubblica, gli altri ambienti una propria', () => {
    expect(blobPrefix()).toBe('partner-logos/');
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(blobPrefix()).toBe('preview/partner-logos/');
    vi.stubEnv('VERCEL_ENV', '');
    expect(blobPrefix()).toBe('development/partner-logos/');
  });
});

describe('getLogos', () => {
  it('restituisce 16 posizioni vuote con lo store vuoto', async () => {
    const logos = await getLogos();
    expect(logos).toHaveLength(LOGO_SLOTS);
    expect(logos.every((logo) => logo === null)).toBe(true);
  });

  it('associa ogni blob alla sua posizione, attraversando tutte le pagine', async () => {
    blob.seed('partner-logos/slot-01-a.webp', '2026-01-01');
    blob.seed('partner-logos/slot-05-b.webp', '2026-01-01');
    blob.seed('partner-logos/slot-16-c.webp', '2026-01-01');
    const logos = await getLogos();
    expect(logos[0]).toBe('https://blob.test/partner-logos/slot-01-a.webp');
    expect(logos[4]).toBe('https://blob.test/partner-logos/slot-05-b.webp');
    expect(logos[15]).toBe('https://blob.test/partner-logos/slot-16-c.webp');
    expect(logos.filter(Boolean)).toHaveLength(3);
  });

  it('se una posizione ha più file sceglie il più recente', async () => {
    blob.seed('partner-logos/slot-02-old.webp', '2026-01-01');
    blob.seed('partner-logos/slot-02-new.webp', '2026-02-01');
    blob.seed('partner-logos/slot-02-older.webp', '2025-12-01');
    expect((await getLogos())[1]).toBe('https://blob.test/partner-logos/slot-02-new.webp');
  });

  it('ignora file estranei, posizioni fuori intervallo e cartelle di altri ambienti', async () => {
    blob.seed('partner-logos/readme.txt', '2026-01-01');
    blob.seed('partner-logos/slot-17-x.webp', '2026-01-01');
    blob.seed('partner-logos/slot-00-x.webp', '2026-01-01');
    blob.seed('preview/partner-logos/slot-01-x.webp', '2026-01-01');
    blob.seed('other/slot-01-x.webp', '2026-01-01');
    expect((await getLogos()).every((logo) => logo === null)).toBe(true);
  });

  it('in preview legge solo la cartella di preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    blob.seed('partner-logos/slot-01-prod.webp', '2026-01-01');
    blob.seed('preview/partner-logos/slot-03-prev.webp', '2026-01-01');
    const logos = await getLogos();
    expect(logos[0]).toBeNull();
    expect(logos[2]).toBe('https://blob.test/preview/partner-logos/slot-03-prev.webp');
  });

  it('senza token Blob fallisce con 503 e un messaggio chiaro', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    await expect(getLogos()).rejects.toMatchObject({ status: 503, message: expect.stringMatching(/BLOB_READ_WRITE_TOKEN/) });
  });
});

describe('saveLogo', () => {
  it('converte un PNG in WebP mantenendo la trasparenza', async () => {
    const url = await saveLogo(3, await images.pngWithAlpha(800, 400));
    const saved = blob.store.get(url);
    const meta = await sharp(saved.body).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.hasAlpha).toBe(true);
    expect([meta.width, meta.height]).toEqual([640, 320]);
    expect(saved.pathname).toMatch(/^partner-logos\/slot-03-.+\.webp$/);
    expect(saved.options).toMatchObject({ access: 'public', addRandomSuffix: true, contentType: 'image/webp' });
  });

  it('ridimensiona un JPEG grande entro 640px mantenendo le proporzioni', async () => {
    const url = await saveLogo(1, await images.jpeg(1000, 2000));
    const meta = await sharp(blob.store.get(url).body).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['webp', 320, 640]);
  });

  it('non ingrandisce immagini piccole e accetta WebP', async () => {
    const url = await saveLogo(1, await images.webp(300, 200));
    const meta = await sharp(blob.store.get(url).body).metadata();
    expect([meta.width, meta.height]).toEqual([300, 200]);
  });

  it('sostituendo un logo elimina il file precedente e lascia intatte le altre posizioni', async () => {
    const other = await saveLogo(9, await images.webp());
    const first = await saveLogo(4, await images.pngWithAlpha());
    const second = await saveLogo(4, await images.jpeg());
    expect(first).not.toBe(second);
    expect(storedFor(4).map((b) => b.url)).toEqual([second]);
    expect(blob.store.has(other)).toBe(true);
    const logos = await getLogos();
    expect(logos[3]).toBe(second);
    expect(logos[8]).toBe(other);
  });

  it.each([
    ['SVG', images.svg],
    ['GIF', images.gif],
    ['testo', async () => Buffer.from('not an image')],
    ['PNG troncato', images.truncatedPng],
  ])('rifiuta %s con 415 senza scrivere nello store', async (_, make) => {
    await expect(saveLogo(1, await make())).rejects.toMatchObject({ status: 415 });
    expect(blob.store.size).toBe(0);
  });

  it('in preview scrive nella cartella di preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const url = await saveLogo(2, await images.webp());
    expect(blob.store.get(url).pathname).toMatch(/^preview\/partner-logos\/slot-02-/);
  });
});

describe('deleteLogo', () => {
  it('svuota la posizione, compresi eventuali duplicati, senza toccare le altre', async () => {
    blob.seed('partner-logos/slot-06-a.webp', '2026-01-01');
    blob.seed('partner-logos/slot-06-b.webp', '2026-01-02');
    blob.seed('partner-logos/slot-07-c.webp', '2026-01-01');
    await deleteLogo(6);
    expect(storedFor(6)).toHaveLength(0);
    expect(storedFor(7)).toHaveLength(1);
  });

  it('su una posizione già vuota non fa nulla', async () => {
    await expect(deleteLogo(12)).resolves.toBeUndefined();
  });
});
