import { del, list, put } from '@vercel/blob';
import sharp from 'sharp';

// Il "muro" di loghi della sezione Partner & Sponsor: 4 moduli x 4 loghi.
export const LOGO_SLOTS = 16;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // sotto il limite di 4.5 MB delle funzioni Vercel

const PREFIX = 'partner-logos/';
const ACCEPTED_FORMATS = new Set(['png', 'jpeg', 'webp']);
// Le card sono al massimo ~310px (1/8 di 2480px): 640px copre gli schermi retina.
const MAX_DIMENSION = 640;

// Ogni caricamento genera un URL nuovo (suffisso casuale), quindi le cache di CDN e
// browser non mostrano mai un logo vecchio; il file precedente viene poi eliminato.
const slotPath = (slot) => `${PREFIX}slot-${String(slot).padStart(2, '0')}.webp`;
const SLOT_PATTERN = /^partner-logos\/slot-(\d{2})/;

export function parseSlot(value) {
  const slot = Number(value);
  return Number.isInteger(slot) && slot >= 1 && slot <= LOGO_SLOTS ? slot : null;
}

async function listSlotBlobs() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const error = new Error('Archivio loghi non configurato (BLOB_READ_WRITE_TOKEN mancante)');
    error.status = 503;
    throw error;
  }

  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return blobs
    .map((blob) => ({ ...blob, slot: parseSlot(SLOT_PATTERN.exec(blob.pathname)?.[1]) }))
    .filter((blob) => blob.slot !== null);
}

// Array di LOGO_SLOTS elementi: l'URL del logo di ogni posizione, o null se vuota.
export async function getLogos() {
  const logos = Array(LOGO_SLOTS).fill(null);
  const newest = Array(LOGO_SLOTS).fill(0);
  for (const blob of await listSlotBlobs()) {
    const time = new Date(blob.uploadedAt).getTime();
    if (time >= newest[blob.slot - 1]) {
      newest[blob.slot - 1] = time;
      logos[blob.slot - 1] = blob.url;
    }
  }
  return logos;
}

// Converte PNG/JPEG/WebP in WebP (trasparenza preservata) e lo salva nella posizione.
export async function saveLogo(slot, input) {
  let image;
  try {
    image = sharp(input, { limitInputPixels: 50_000_000 });
    const { format } = await image.metadata();
    if (!ACCEPTED_FORMATS.has(format)) throw new Error();
  } catch {
    const error = new Error('Formato non supportato: usa PNG, JPEG o WebP');
    error.status = 415;
    throw error;
  }

  const webp = await image
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 5 })
    .toBuffer();

  const previous = (await listSlotBlobs()).filter((blob) => blob.slot === slot);
  const blob = await put(slotPath(slot), webp, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'image/webp',
  });
  if (previous.length) await del(previous.map((b) => b.url));
  return blob.url;
}

export async function deleteLogo(slot) {
  const blobs = (await listSlotBlobs()).filter((blob) => blob.slot === slot);
  if (blobs.length) await del(blobs.map((b) => b.url));
}
