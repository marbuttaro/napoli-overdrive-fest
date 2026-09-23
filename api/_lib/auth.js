import { createHmac, timingSafeEqual } from 'node:crypto';
import { sendJson } from './http.js';

// Credenziali fisse lette da .env (in locale) o dalle Environment Variables di Vercel.
const COOKIE_NAME = 'overdrive_admin';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getConfig() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) return null;
  return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, secret: ADMIN_SESSION_SECRET };
}

// Confronto a tempo costante: l'HMAC porta entrambi i valori alla stessa lunghezza.
function safeEqual(a, b) {
  const key = 'compare';
  const ha = createHmac('sha256', key).update(String(a)).digest();
  const hb = createHmac('sha256', key).update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function isSecureRequest(req) {
  const proto = req.headers['x-forwarded-proto'];
  if (proto) return proto.split(',')[0].trim() === 'https';
  return Boolean(req.socket?.encrypted);
}

function buildCookie(req, value, maxAge) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function readCookie(req) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return rest.join('=');
  }
  return null;
}

export function checkCredentials(username, password) {
  const config = getConfig();
  if (!config) return false;
  // Nessun cortocircuito: entrambi i confronti vengono sempre eseguiti.
  const userOk = safeEqual(username, config.username);
  const passOk = safeEqual(password, config.password);
  return userOk && passOk;
}

export function createSessionCookie(req) {
  const { secret } = getConfig();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString('base64url');
  return buildCookie(req, `${payload}.${sign(payload, secret)}`, SESSION_TTL_SECONDS);
}

export function clearSessionCookie(req) {
  return buildCookie(req, '', 0);
}

export function isAuthenticated(req) {
  const config = getConfig();
  const token = readCookie(req);
  if (!config || !token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload, config.secret))) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function isConfigured() {
  return getConfig() !== null;
}

// Restituisce true se la richiesta può proseguire, altrimenti ha già risposto con 401.
export function requireAuth(req, res) {
  if (isAuthenticated(req)) return true;
  sendJson(res, 401, { error: 'Non autorizzato' });
  return false;
}
