// Helper minimi per le funzioni in /api: usano solo l'API standard di Node (req/res),
// così gli stessi handler girano sia su Vercel sia nel middleware di sviluppo di Vite.

export function sendJson(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(data));
}

export function methodNotAllowed(res, allowed) {
  sendJson(res, 405, { error: 'Metodo non consentito' }, { Allow: allowed.join(', ') });
}

export function getQuery(req) {
  return new URL(req.url, 'http://localhost').searchParams;
}

// Legge il body grezzo interrompendo la lettura oltre `limit` byte.
export async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('File troppo grande');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req) {
  try {
    return JSON.parse((await readBody(req, 16 * 1024)).toString('utf8') || '{}');
  } catch {
    return {};
  }
}
