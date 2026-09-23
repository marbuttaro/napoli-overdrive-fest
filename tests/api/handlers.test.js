import { createServer } from 'node:http';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as blob from '../helpers/blob-mock.js';
import * as images from '../helpers/images.js';
import publicLogos from '../../api/logos.js';
import login from '../../api/admin/login.js';
import logout from '../../api/admin/logout.js';
import adminLogos from '../../api/admin/logos.js';

vi.mock('@vercel/blob', () => import('../helpers/blob-mock.js'));

// Stesso instradamento di Vercel (e del middleware di sviluppo in vite.config.js).
const routes = {
  '/api/logos': publicLogos,
  '/api/admin/login': login,
  '/api/admin/logout': logout,
  '/api/admin/logos': adminLogos,
};

let server;
let base;

beforeAll(async () => {
  server = createServer((req, res) => routes[req.url.split('?')[0]](req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

beforeEach(() => {
  blob.resetStore();
  vi.stubEnv('ADMIN_USERNAME', 'admin');
  vi.stubEnv('ADMIN_PASSWORD', 'secret-pass');
  vi.stubEnv('ADMIN_SESSION_SECRET', 'session-secret');
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const call = (path, options = {}) => fetch(`${base}${path}`, options);

const postLogin = (username, password) =>
  call('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

async function loginCookie() {
  const response = await postLogin('admin', 'secret-pass');
  expect(response.status).toBe(200);
  return response.headers.get('set-cookie').split(';')[0];
}

const upload = (cookie, slot, body, type = 'image/png') =>
  call(`/api/admin/logos?slot=${slot}`, { method: 'PUT', headers: { cookie, 'Content-Type': type }, body });

describe('POST /api/admin/login', () => {
  it('con le credenziali corrette imposta il cookie di sessione', async () => {
    const response = await postLogin('admin', 'secret-pass');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('set-cookie')).toMatch(/^overdrive_admin=[^;]+\..+HttpOnly/);
  });

  it('con credenziali errate risponde 401 dopo un ritardo e senza cookie', async () => {
    const started = Date.now();
    const response = await postLogin('admin', 'nope');
    expect(response.status).toBe(401);
    expect(Date.now() - started).toBeGreaterThanOrEqual(700);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('tollera body mancante o non JSON', async () => {
    const empty = await call('/api/admin/login', { method: 'POST' });
    const broken = await call('/api/admin/login', { method: 'POST', body: '{not json' });
    expect([empty.status, broken.status]).toEqual([401, 401]);
  });

  it('se le variabili ADMIN_* mancano risponde 500 con un messaggio esplicito', async () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', '');
    const response = await postLogin('admin', 'secret-pass');
    expect(response.status).toBe(500);
    expect((await response.json()).error).toMatch(/non configurata/);
  });

  it('accetta solo POST', async () => {
    const response = await call('/api/admin/login');
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });
});

describe('POST /api/admin/logout', () => {
  it('cancella il cookie', async () => {
    const response = await call('/api/admin/logout', { method: 'POST' });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toMatch(/^overdrive_admin=;.*Max-Age=0/);
  });

  it('accetta solo POST', async () => {
    expect((await call('/api/admin/logout')).status).toBe(405);
  });
});

describe('/api/admin/logos', () => {
  it.each(['GET', 'PUT', 'DELETE'])('%s senza sessione risponde 401', async (method) => {
    const response = await call('/api/admin/logos?slot=1', { method });
    expect(response.status).toBe(401);
    expect(blob.store.size).toBe(0);
  });

  it('rifiuta un cookie contraffatto', async () => {
    const response = await call('/api/admin/logos', { headers: { cookie: 'overdrive_admin=eyJleHAiOjk5OTk5OTk5OTl9.x' } });
    expect(response.status).toBe(401);
  });

  it('GET restituisce loghi e ambiente, senza cache', async () => {
    const cookie = await loginCookie();
    const response = await call('/api/admin/logos', { headers: { cookie } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ logos: Array(16).fill(null), environment: 'production' });
  });

  it('PUT carica, converte e rende il logo visibile sia in admin sia sul sito', async () => {
    const cookie = await loginCookie();
    const response = await upload(cookie, 5, await images.pngWithAlpha());
    expect(response.status).toBe(200);
    const { url } = await response.json();
    expect((await sharp(blob.store.get(url).body).metadata()).format).toBe('webp');

    const admin = await (await call('/api/admin/logos', { headers: { cookie } })).json();
    const site = await (await call('/api/logos')).json();
    expect(admin.logos[4]).toBe(url);
    expect(site.logos[4]).toBe(url);
  });

  it('PUT accetta anche JPEG e WebP', async () => {
    const cookie = await loginCookie();
    expect((await upload(cookie, 1, await images.jpeg(), 'image/jpeg')).status).toBe(200);
    expect((await upload(cookie, 2, await images.webp(), 'image/webp')).status).toBe(200);
  });

  it('PUT sostituisce il logo precedente', async () => {
    const cookie = await loginCookie();
    const first = (await (await upload(cookie, 8, await images.pngWithAlpha())).json()).url;
    const second = (await (await upload(cookie, 8, await images.jpeg(), 'image/jpeg')).json()).url;
    expect(blob.store.has(first)).toBe(false);
    expect((await (await call('/api/logos')).json()).logos[7]).toBe(second);
  });

  it.each(['0', '17', 'abc', ''])('PUT con slot "%s" risponde 400', async (slot) => {
    const cookie = await loginCookie();
    expect((await upload(cookie, slot, await images.webp())).status).toBe(400);
  });

  it('PUT senza body risponde 400', async () => {
    const cookie = await loginCookie();
    const response = await call('/api/admin/logos?slot=1', { method: 'PUT', headers: { cookie } });
    expect(response.status).toBe(400);
  });

  it('PUT oltre 4 MB risponde 413', async () => {
    const cookie = await loginCookie();
    const response = await upload(cookie, 1, Buffer.alloc(4 * 1024 * 1024 + 1));
    expect(response.status).toBe(413);
    expect(blob.store.size).toBe(0);
  });

  it('PUT con un file non immagine risponde 415', async () => {
    const cookie = await loginCookie();
    const response = await upload(cookie, 1, images.svg(), 'image/svg+xml');
    expect(response.status).toBe(415);
    expect((await response.json()).error).toMatch(/PNG, JPEG o WebP/);
  });

  it('DELETE svuota la posizione', async () => {
    const cookie = await loginCookie();
    await upload(cookie, 3, await images.webp());
    const response = await call('/api/admin/logos?slot=3', { method: 'DELETE', headers: { cookie } });
    expect(response.status).toBe(200);
    expect((await (await call('/api/logos')).json()).logos[2]).toBeNull();
  });

  it('DELETE con slot non valido risponde 400', async () => {
    const cookie = await loginCookie();
    expect((await call('/api/admin/logos?slot=99', { method: 'DELETE', headers: { cookie } })).status).toBe(400);
  });

  it('metodi non previsti rispondono 405', async () => {
    const response = await call('/api/admin/logos', { method: 'POST' });
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET, PUT, DELETE');
  });

  it('senza store Blob configurato risponde 503 con un messaggio esplicito', async () => {
    const cookie = await loginCookie();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    const response = await call('/api/admin/logos', { headers: { cookie } });
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/BLOB_READ_WRITE_TOKEN/);
  });

  it('un errore imprevisto dello store risponde 500 senza dettagli interni', async () => {
    const cookie = await loginCookie();
    blob.failNextList(new Error('boom: internal detail'));
    const response = await call('/api/admin/logos', { headers: { cookie } });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('internal detail');
  });
});

describe('GET /api/logos (pubblico)', () => {
  it('restituisce 16 posizioni con cache CDN breve', async () => {
    const response = await call('/api/logos');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=60');
    expect((await response.json()).logos).toHaveLength(16);
  });

  it('non espone l\'ambiente né altri dati', async () => {
    expect(Object.keys(await (await call('/api/logos')).json())).toEqual(['logos']);
  });

  it('in caso di errore risponde 500', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    expect((await call('/api/logos')).status).toBe(500);
  });

  it('accetta solo GET', async () => {
    expect((await call('/api/logos', { method: 'POST' })).status).toBe(405);
  });
});
