#!/usr/bin/env node
// Smoke test di un deploy (produzione, preview o `npm run dev`).
//
//   npm run smoke -- https://napoli-overdrive-fest.vercel.app
//   npm run smoke -- https://<preview>.vercel.app --write
//   npm run smoke -- http://localhost:5173 --write --no-browser
//
// Di default fa solo letture, login/logout e richieste che il server rifiuta prima di
// scrivere: è sicuro anche in produzione. --write aggiunge un ciclo reale di
// caricamento → sostituzione → rimozione su una posizione vuota, ed è rifiutato se il
// deploy dichiara di essere in produzione.
//
// Credenziali: ADMIN_USERNAME / ADMIN_PASSWORD dall'ambiente o da .env.
// Preview protette: VERCEL_AUTOMATION_BYPASS_SECRET (Protection Bypass for Automation).

import { existsSync } from 'node:fs';
import sharp from 'sharp';

const args = process.argv.slice(2);
const baseUrl = args.find((arg) => !arg.startsWith('--'))?.replace(/\/$/, '');
const writeMode = args.includes('--write');
const browserMode = !args.includes('--no-browser');

if (!baseUrl) {
  console.error('Uso: npm run smoke -- <url> [--write] [--no-browser]');
  process.exit(2);
}
if (existsSync('.env')) process.loadEnvFile('.env');

const { ADMIN_USERNAME, ADMIN_PASSWORD, VERCEL_AUTOMATION_BYPASS_SECRET: bypass } = process.env;
const isHttps = baseUrl.startsWith('https://');
const bypassHeaders = bypass ? { 'x-vercel-protection-bypass': bypass } : {};

let failures = 0;
async function check(name, fn) {
  try {
    const detail = await fn();
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
    return true;
  } catch (error) {
    failures += 1;
    console.log(`  ✗ ${name}\n      ${error.message}`);
    return false;
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const request = (path, { headers, ...options } = {}) =>
  fetch(`${baseUrl}${path}`, { redirect: 'manual', ...options, headers: { ...bypassHeaders, ...headers } });
const json = async (response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`risposta non JSON (HTTP ${response.status}): ${text.slice(0, 120)}`);
  }
};
const expectStatus = (response, status) =>
  assert(response.status === status, `atteso HTTP ${status}, ricevuto ${response.status}`);
const isLogoList = (logos) =>
  Array.isArray(logos) && logos.length === 16 && logos.every((l) => l === null || /^https:\/\//.test(l));

const login = (username, password) =>
  request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

console.log(`\nSmoke test: ${baseUrl}${writeMode ? ' (con scrittura)' : ''}\n`);

// --- Pagine ---------------------------------------------------------------------------
console.log('Pagine');
let homeHtml = '';
await check('home page', async () => {
  const response = await request('/');
  expectStatus(response, 200);
  homeHtml = await response.text();
  assert(homeHtml.includes('<div id="root">'), 'manca #root');
  assert(/Overdrive Fest/.test(homeHtml), 'titolo mancante');
});
await check('bundle JS della home', async () => {
  const src = homeHtml.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1];
  assert(src, 'script principale non trovato');
  const response = await request(src);
  expectStatus(response, 200);
  return src;
});
await check('pagina /admin/ (noindex)', async () => {
  const response = await request('/admin/');
  expectStatus(response, 200);
  const html = await response.text();
  assert(html.includes('noindex'), 'manca meta robots noindex');
});

// --- API pubblica ---------------------------------------------------------------------
console.log('API pubblica');
let publicLogos = [];
await check('GET /api/logos', async () => {
  const response = await request('/api/logos');
  expectStatus(response, 200);
  // In locale si vede s-maxage; su Vercel il CDN lo consuma e lo toglie dalla risposta,
  // e la cache si riconosce da x-vercel-cache (MISS/HIT/STALE).
  const vercelCache = response.headers.get('x-vercel-cache');
  assert(vercelCache || /s-maxage=/.test(response.headers.get('cache-control') || ''), 'risposta non cacheable dal CDN');
  const data = await json(response);
  assert(isLogoList(data.logos), `formato inatteso: ${JSON.stringify(data).slice(0, 120)}`);
  assert(Object.keys(data).length === 1, 'la risposta pubblica espone campi in più');
  publicLogos = data.logos;
  return `${publicLogos.filter(Boolean).length}/16 posizioni occupate${vercelCache ? `, cache CDN: ${vercelCache}` : ''}`;
});
for (const [index, url] of publicLogos.entries()) {
  if (!url) continue;
  await check(`logo ${index + 1} raggiungibile`, async () => {
    const response = await fetch(url, { method: 'HEAD' });
    expectStatus(response, 200);
    assert(response.headers.get('content-type') === 'image/webp', `content-type ${response.headers.get('content-type')}`);
  });
}

// --- Autenticazione -------------------------------------------------------------------
console.log('Autenticazione');
await check('API admin senza sessione → 401', async () => {
  for (const method of ['GET', 'PUT', 'DELETE']) {
    expectStatus(await request('/api/admin/logos?slot=1', { method }), 401);
  }
});
await check('login con password errata → 401', async () => {
  const response = await login(ADMIN_USERNAME || 'admin', `wrong-${Date.now()}`);
  expectStatus(response, 401);
  assert(!response.headers.get('set-cookie'), 'cookie impostato su login fallito');
});

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  failures += 1;
  console.log('  ✗ ADMIN_USERNAME / ADMIN_PASSWORD non impostati: impossibile proseguire');
  process.exit(1);
}

let cookie = '';
await check('login con le credenziali corrette', async () => {
  const response = await login(ADMIN_USERNAME, ADMIN_PASSWORD);
  expectStatus(response, 200);
  const setCookie = response.headers.get('set-cookie') || '';
  for (const flag of ['HttpOnly', 'SameSite=Strict', 'Path=/api/admin', ...(isHttps ? ['Secure'] : [])]) {
    assert(setCookie.includes(flag), `cookie senza ${flag}`);
  }
  cookie = setCookie.split(';')[0];
});

let environment = 'unknown';
let adminLogos = [];
const adminList = async () => {
  const response = await request('/api/admin/logos', { headers: { cookie } });
  expectStatus(response, 200);
  return json(response);
};
await check('GET /api/admin/logos con sessione', async () => {
  const data = await adminList();
  assert(isLogoList(data.logos), 'formato inatteso');
  environment = data.environment;
  adminLogos = data.logos;
  return `ambiente: ${environment}`;
});

// Richieste rifiutate prima di qualsiasi scrittura: sicure anche in produzione.
console.log('Validazione (nessuna scrittura)');
await check('PUT con posizione non valida → 400', async () => {
  const response = await request('/api/admin/logos?slot=99', { method: 'PUT', headers: { cookie }, body: 'x' });
  expectStatus(response, 400);
});
await check('PUT di un file non immagine → 415', async () => {
  const response = await request('/api/admin/logos?slot=1', {
    method: 'PUT',
    headers: { cookie, 'Content-Type': 'image/svg+xml' },
    body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
  });
  expectStatus(response, 415);
});
await check('le posizioni non sono cambiate', async () => {
  const { logos } = await adminList();
  assert(JSON.stringify(logos) === JSON.stringify(adminLogos), 'lo stato dei loghi è cambiato');
});

// --- Ciclo di scrittura (solo fuori produzione) ----------------------------------------
if (writeMode) {
  console.log('Scrittura');
  const slot = adminLogos.indexOf(null) + 1;
  if (environment === 'production') {
    failures += 1;
    console.log('  ✗ --write rifiutato: il deploy è in produzione (usa una preview o `npm run dev`)');
  } else if (slot === 0) {
    failures += 1;
    console.log('  ✗ --write: nessuna posizione vuota su cui provare');
  } else {
    const png = await sharp({ create: { width: 900, height: 300, channels: 4, background: { r: 255, g: 59, b: 47, alpha: 0.6 } } })
      .png()
      .toBuffer();
    const jpeg = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#1e1b18' } }).jpeg().toBuffer();
    const put = (body, type) =>
      request(`/api/admin/logos?slot=${slot}`, { method: 'PUT', headers: { cookie, 'Content-Type': type }, body });

    let firstUrl;
    await check(`caricamento PNG nella posizione ${slot}`, async () => {
      const response = await put(png, 'image/png');
      expectStatus(response, 200);
      firstUrl = (await json(response)).url;
      const image = await fetch(firstUrl);
      expectStatus(image, 200);
      const meta = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
      assert(meta.format === 'webp' && meta.width === 640 && meta.hasAlpha, `output ${meta.format} ${meta.width}px alpha=${meta.hasAlpha}`);
      assert((await adminList()).logos[slot - 1] === firstUrl, 'il logo non risulta nella posizione');
      return 'WebP 640px con trasparenza';
    });
    await check('sostituzione con JPEG', async () => {
      const response = await put(jpeg, 'image/jpeg');
      expectStatus(response, 200);
      const { url } = await json(response);
      assert(url !== firstUrl, 'URL invariato');
      assert((await adminList()).logos[slot - 1] === url, 'la posizione non punta al nuovo logo');
    });
    await check('rimozione', async () => {
      const response = await request(`/api/admin/logos?slot=${slot}`, { method: 'DELETE', headers: { cookie } });
      expectStatus(response, 200);
      assert((await adminList()).logos[slot - 1] === null, 'la posizione non è vuota');
    });
  }
}

await check('logout', async () => {
  const response = await request('/api/admin/logout', { method: 'POST', headers: { cookie } });
  expectStatus(response, 200);
  assert(/Max-Age=0/.test(response.headers.get('set-cookie') || ''), 'cookie non cancellato');
});

// --- Browser --------------------------------------------------------------------------
if (browserMode) {
  console.log('Browser');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  // Il bypass va impostato come cookie: un header aggiunto a ogni richiesta romperebbe
  // le richieste CORS verso font e CDN esterni.
  const bypassQuery = bypass ? `?x-vercel-protection-bypass=${bypass}&x-vercel-set-bypass-cookie=samesitenone` : '';

  const openPage = async (path) => {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().startsWith(baseUrl) && response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${baseUrl}${path}${bypassQuery}`, { waitUntil: 'load' });
    return { page, errors };
  };

  await check('home: sezione Sponsor con 16 posizioni, nessun errore JS', async () => {
    const { page, errors } = await openPage('/');
    await page.locator('#sponsor').scrollIntoViewIfNeeded();
    await page.waitForResponse((r) => r.url().includes('/api/logos')).catch(() => {});
    await page.waitForTimeout(500);
    const cards = await page.locator('#sponsor img[alt="Logo partner"], #sponsor span:text-is("LOGO")').count();
    assert(cards === 16, `${cards} posizioni invece di 16`);
    assert(errors.length === 0, errors.join('; '));
    await page.close();
  });

  await check('dashboard: login dal form e 16 posizioni', async () => {
    const { page, errors } = await openPage('/admin/');
    await page.getByLabel('Username').fill(ADMIN_USERNAME);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await page.getByRole('heading', { name: /Loghi Partner/ }).waitFor();
    const slots = await page.getByRole('button', { name: /(Carica|Sostituisci) il logo \d+$/ }).count();
    assert(slots === 16, `${slots} posizioni invece di 16`);

    if (writeMode && environment !== 'production') {
      const slot = (await adminList()).logos.indexOf(null) + 1;
      assert(slot > 0, 'nessuna posizione vuota');
      const png = await sharp({ create: { width: 200, height: 100, channels: 4, background: '#ff3b2f' } }).png().toBuffer();
      await page.locator('input[type="file"]').nth(slot - 1).setInputFiles({ name: 'smoke.png', mimeType: 'image/png', buffer: png });
      await page.getByRole('button', { name: `Sostituisci il logo ${slot}`, exact: true }).locator('img').waitFor();
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: `Sostituisci il logo ${slot}`, exact: true }).locator('..').getByRole('button', { name: 'Rimuovi' }).click();
      await page.getByRole('button', { name: `Carica il logo ${slot}`, exact: true }).waitFor();
    }

    await page.getByRole('button', { name: 'Esci' }).click();
    await page.getByRole('button', { name: 'Accedi' }).waitFor();
    assert(errors.length === 0, errors.join('; '));
    await page.close();
    return writeMode && environment !== 'production' ? 'incluso caricamento e rimozione dal browser' : '';
  });

  await browser.close();
}

console.log(failures ? `\n${failures} controlli falliti\n` : '\nTutti i controlli superati\n');
process.exit(failures ? 1 : 0);
