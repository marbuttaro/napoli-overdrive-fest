import { methodNotAllowed, sendJson } from './_lib/http.js';
import { getLogos } from './_lib/logos.js';

// Pubblico: i loghi del muro Partner & Sponsor, letti dal sito.
export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    // Breve cache in CDN: una modifica dalla dashboard compare sul sito entro ~1 minuto.
    sendJson(res, 200, { logos: await getLogos() }, {
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    });
  } catch (error) {
    console.error('[api/logos]', error);
    sendJson(res, 500, { error: 'Impossibile leggere i loghi' });
  }
}
