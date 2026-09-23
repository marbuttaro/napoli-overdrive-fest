import { requireAuth } from '../_lib/auth.js';
import { getQuery, methodNotAllowed, readBody, sendJson } from '../_lib/http.js';
import { deleteLogo, getLogos, MAX_UPLOAD_BYTES, parseSlot, saveLogo } from '../_lib/logos.js';

const NO_STORE = { 'Cache-Control': 'no-store' };

// GET                 → stato della sessione e loghi attuali (senza cache)
// PUT    ?slot=1..16  → body: immagine PNG/JPEG/WebP, salvata come WebP
// DELETE ?slot=1..16  → svuota la posizione
export default async function handler(req, res) {
  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
    return methodNotAllowed(res, ['GET', 'PUT', 'DELETE']);
  }
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      return sendJson(res, 200, { logos: await getLogos() }, NO_STORE);
    }

    const slot = parseSlot(getQuery(req).get('slot'));
    if (slot === null) return sendJson(res, 400, { error: 'Posizione non valida' });

    if (req.method === 'PUT') {
      const body = await readBody(req, MAX_UPLOAD_BYTES);
      if (!body.length) return sendJson(res, 400, { error: 'Nessun file ricevuto' });
      return sendJson(res, 200, { url: await saveLogo(slot, body) }, NO_STORE);
    }

    await deleteLogo(slot);
    sendJson(res, 200, { ok: true }, NO_STORE);
  } catch (error) {
    if (error.status) return sendJson(res, error.status, { error: error.message });
    console.error('[api/admin/logos]', error);
    sendJson(res, 500, { error: 'Operazione non riuscita' });
  }
}
