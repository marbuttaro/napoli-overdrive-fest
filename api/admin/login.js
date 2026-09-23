import { checkCredentials, createSessionCookie, isConfigured } from '../_lib/auth.js';
import { methodNotAllowed, readJson, sendJson } from '../_lib/http.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!isConfigured()) return sendJson(res, 500, { error: 'Dashboard non configurata (variabili ADMIN_* mancanti)' });

  const { username = '', password = '' } = await readJson(req);
  if (!checkCredentials(username, password)) {
    // Rallenta i tentativi a forza bruta.
    await wait(800);
    return sendJson(res, 401, { error: 'Credenziali non valide' });
  }

  sendJson(res, 200, { ok: true }, { 'Set-Cookie': createSessionCookie(req) });
}
