import { clearSessionCookie } from '../_lib/auth.js';
import { methodNotAllowed, sendJson } from '../_lib/http.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie(req) });
}
