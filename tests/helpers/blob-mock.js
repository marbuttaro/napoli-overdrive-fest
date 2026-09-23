// Finto @vercel/blob in memoria, con la stessa semantica usata da api/_lib/logos.js:
// suffisso casuale sul pathname, list per prefisso (paginata), del per URL.
export const store = new Map();
let counter = 0;
let clock = Date.parse('2026-01-01T00:00:00Z');

let nextListError = null;

export function resetStore() {
  store.clear();
  counter = 0;
  nextListError = null;
}

// Fa fallire la prossima chiamata a list(), per simulare un errore del servizio.
export function failNextList(error) {
  nextListError = error;
}

export async function put(pathname, body, options) {
  counter += 1;
  clock += 1000;
  const suffixed = options.addRandomSuffix ? pathname.replace(/\.webp$/, `-rnd${counter}.webp`) : pathname;
  const blob = {
    pathname: suffixed,
    url: `https://blob.test/${suffixed}`,
    uploadedAt: new Date(clock),
    size: body.length,
    body,
    options,
  };
  store.set(blob.url, blob);
  return blob;
}

// Pagine da 2 elementi, per esercitare la paginazione con cursore.
export async function list({ prefix = '', cursor } = {}) {
  if (nextListError) {
    const error = nextListError;
    nextListError = null;
    throw error;
  }
  const all = [...store.values()].filter((blob) => blob.pathname.startsWith(prefix));
  const start = cursor ? Number(cursor) : 0;
  const blobs = all.slice(start, start + 2);
  const hasMore = start + 2 < all.length;
  return { blobs, hasMore, cursor: hasMore ? String(start + 2) : undefined };
}

export async function del(urls) {
  for (const url of [].concat(urls)) store.delete(url);
}

// Inserisce direttamente un blob, per simulare stati già presenti nello store.
export function seed(pathname, uploadedAt) {
  const blob = { pathname, url: `https://blob.test/${pathname}`, uploadedAt: new Date(uploadedAt), size: 1 };
  store.set(blob.url, blob);
  return blob;
}
