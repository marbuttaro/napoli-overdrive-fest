import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkCredentials,
  clearSessionCookie,
  createSessionCookie,
  isAuthenticated,
  isConfigured,
} from '../../api/_lib/auth.js';

const SECRET = 'test-secret';
const request = (headers = {}) => ({ headers, socket: {} });
const cookieValue = (setCookie) => setCookie.split(';')[0];
const sign = (payload, secret = SECRET) => createHmac('sha256', secret).update(payload).digest('base64url');
const token = (data, secret) => {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `overdrive_admin=${payload}.${sign(payload, secret)}`;
};

beforeEach(() => {
  vi.stubEnv('ADMIN_USERNAME', 'admin');
  vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
  vi.stubEnv('ADMIN_SESSION_SECRET', SECRET);
});

describe('checkCredentials', () => {
  it('accetta solo username e password corretti', () => {
    expect(checkCredentials('admin', 'correct horse')).toBe(true);
    expect(checkCredentials('admin', 'wrong')).toBe(false);
    expect(checkCredentials('someone', 'correct horse')).toBe(false);
    expect(checkCredentials('', '')).toBe(false);
    expect(checkCredentials('admin', 'correct horse ')).toBe(false);
  });

  it('non accetta tipi diversi da stringhe che coincidono per coercizione', () => {
    expect(checkCredentials(undefined, undefined)).toBe(false);
    expect(checkCredentials({}, [])).toBe(false);
  });

  it('rifiuta tutto se le variabili non sono configurate', () => {
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(isConfigured()).toBe(false);
    expect(checkCredentials('admin', '')).toBe(false);
  });
});

describe('sessione', () => {
  it('il cookie creato al login autentica le richieste successive', () => {
    const setCookie = createSessionCookie(request());
    expect(isAuthenticated(request({ cookie: cookieValue(setCookie) }))).toBe(true);
  });

  it('imposta un cookie HttpOnly, SameSite=Strict, limitato a /api/admin, di 8 ore', () => {
    const setCookie = createSessionCookie(request());
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Path=/api/admin');
    expect(setCookie).toContain('Max-Age=28800');
  });

  it('aggiunge Secure solo su HTTPS', () => {
    expect(createSessionCookie(request({ 'x-forwarded-proto': 'https' }))).toContain('Secure');
    expect(createSessionCookie(request({ 'x-forwarded-proto': 'http' }))).not.toContain('Secure');
    expect(createSessionCookie(request())).not.toContain('Secure');
  });

  it('trova il cookie anche tra altri cookie', () => {
    const cookie = `foo=bar; ${cookieValue(createSessionCookie(request()))}; other=1`;
    expect(isAuthenticated(request({ cookie }))).toBe(true);
  });

  it('rifiuta richieste senza cookie', () => {
    expect(isAuthenticated(request())).toBe(false);
    expect(isAuthenticated(request({ cookie: 'foo=bar' }))).toBe(false);
  });

  it('rifiuta una firma manomessa o fatta con un altro segreto', () => {
    const future = { exp: Math.floor(Date.now() / 1000) + 3600 };
    expect(isAuthenticated(request({ cookie: token(future, 'other-secret') }))).toBe(false);
    const [payload] = cookieValue(createSessionCookie(request())).split('=')[1].split('.');
    expect(isAuthenticated(request({ cookie: `overdrive_admin=${payload}.forged` }))).toBe(false);
    expect(isAuthenticated(request({ cookie: 'overdrive_admin=garbage' }))).toBe(false);
  });

  it('rifiuta una sessione scaduta', () => {
    expect(isAuthenticated(request({ cookie: token({ exp: Math.floor(Date.now() / 1000) - 1 }) }))).toBe(false);
  });

  it('rifiuta payload firmati ma malformati', () => {
    expect(isAuthenticated(request({ cookie: token({}) }))).toBe(false);
    expect(isAuthenticated(request({ cookie: token({ exp: '9999999999' }) }))).toBe(false);
  });

  it('cambiando ADMIN_SESSION_SECRET le sessioni esistenti decadono', () => {
    const cookie = cookieValue(createSessionCookie(request()));
    vi.stubEnv('ADMIN_SESSION_SECRET', 'rotated');
    expect(isAuthenticated(request({ cookie }))).toBe(false);
  });

  it('il cookie di logout è vuoto e scade subito', () => {
    const setCookie = clearSessionCookie(request());
    expect(cookieValue(setCookie)).toBe('overdrive_admin=');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('nessuna sessione è valida se la dashboard non è configurata', () => {
    const cookie = cookieValue(createSessionCookie(request()));
    vi.stubEnv('ADMIN_SESSION_SECRET', '');
    expect(isAuthenticated(request({ cookie }))).toBe(false);
  });
});
