// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Admin from '../../src/admin/Admin.jsx';

// Finto backend: instrada le fetch del componente verso handler per metodo+percorso
// e registra le chiamate, così i test verificano anche cosa viene inviato al server.
let routes;
let calls;

const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(data) });

beforeEach(() => {
  calls = [];
  routes = {};
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const method = options.method || 'GET';
      const [path, query] = url.split('?');
      calls.push({ method, path, query, options });
      const handler = routes[`${method} ${path}`];
      return handler ? handler({ query, options }) : reply(404, { error: 'not found' });
    }),
  );
});

afterEach(cleanup);

const emptyLogos = () => Array(16).fill(null);
const loggedIn = (logos = emptyLogos(), environment = 'production') => {
  routes['GET /api/admin/logos'] = () => reply(200, { logos, environment });
};
const file = (name, type, size = 10) => new File([new Uint8Array(size)], name, { type });
const slotInput = (slot) => document.querySelectorAll('input[type="file"]')[slot - 1];

describe('accesso', () => {
  it('senza sessione mostra il form di login', async () => {
    routes['GET /api/admin/logos'] = () => reply(401, { error: 'Non autorizzato' });
    render(<Admin />);
    expect(await screen.findByRole('button', { name: 'Accedi' })).toBeTruthy();
  });

  it('con credenziali errate mostra l\'errore e riabilita il pulsante', async () => {
    const user = userEvent.setup();
    routes['GET /api/admin/logos'] = () => reply(401, {});
    routes['POST /api/admin/login'] = () => reply(401, { error: 'Credenziali non valide' });
    render(<Admin />);

    await user.type(await screen.findByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Accedi' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Credenziali non valide');
    expect(screen.getByRole('button', { name: 'Accedi' }).disabled).toBe(false);
  });

  it('con credenziali corrette invia username/password e apre la dashboard', async () => {
    const user = userEvent.setup();
    let authenticated = false;
    routes['GET /api/admin/logos'] = () =>
      authenticated ? reply(200, { logos: emptyLogos(), environment: 'production' }) : reply(401, {});
    routes['POST /api/admin/login'] = () => {
      authenticated = true;
      return reply(200, { ok: true });
    };
    render(<Admin />);

    await user.type(await screen.findByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'pass');
    await user.click(screen.getByRole('button', { name: 'Accedi' }));

    expect(await screen.findByRole('heading', { name: /Loghi Partner/ })).toBeTruthy();
    const loginCall = calls.find((c) => c.path === '/api/admin/login');
    expect(JSON.parse(loginCall.options.body)).toEqual({ username: 'admin', password: 'pass' });
  });

  it('se il server non risponde correttamente mostra l\'errore', async () => {
    routes['GET /api/admin/logos'] = () => reply(503, { error: 'Archivio loghi non configurato' });
    render(<Admin />);
    expect(await screen.findByText(/Archivio loghi non configurato/)).toBeTruthy();
  });

  it('"Esci" chiama il logout e torna al login', async () => {
    const user = userEvent.setup();
    loggedIn();
    routes['POST /api/admin/logout'] = () => reply(200, { ok: true });
    render(<Admin />);

    await user.click(await screen.findByRole('button', { name: 'Esci' }));
    expect(await screen.findByRole('button', { name: 'Accedi' })).toBeTruthy();
    expect(calls.some((c) => c.method === 'POST' && c.path === '/api/admin/logout')).toBe(true);
  });
});

describe('dashboard', () => {
  it('mostra 16 posizioni in 4 moduli, con i loghi esistenti', async () => {
    const logos = emptyLogos();
    logos[2] = 'https://blob.test/logo3.webp';
    loggedIn(logos);
    render(<Admin />);

    const modules = await screen.findAllByRole('region', { name: /Modulo/ });
    expect(modules).toHaveLength(4);
    modules.forEach((module) => expect(within(module).getAllByRole('button', { name: /logo \d+$/ })).toHaveLength(4));
    expect(screen.getByRole('button', { name: 'Sostituisci il logo 3' }).querySelector('img').src).toBe(logos[2]);
    expect(screen.getAllByRole('button', { name: 'Rimuovi' })).toHaveLength(1);
  });

  it('in produzione non mostra l\'avviso di ambiente di prova', async () => {
    loggedIn();
    render(<Admin />);
    await screen.findByRole('heading', { name: /Loghi Partner/ });
    expect(screen.queryByText(/Ambiente di prova/)).toBeNull();
  });

  it('in preview avvisa che le modifiche non vanno sul sito pubblico', async () => {
    loggedIn(emptyLogos(), 'preview');
    render(<Admin />);
    expect(await screen.findByText(/Ambiente di prova \(preview\)/)).toBeTruthy();
  });

  it('carica un file nella posizione giusta e mostra l\'anteprima', async () => {
    const user = userEvent.setup();
    loggedIn();
    routes['PUT /api/admin/logos'] = () => reply(200, { url: 'https://blob.test/new.webp' });
    render(<Admin />);
    await screen.findByRole('heading', { name: /Loghi Partner/ });

    const png = file('logo.png', 'image/png');
    await user.upload(slotInput(7), png);

    const img = await waitFor(() => {
      const found = screen.getByRole('button', { name: 'Sostituisci il logo 7' }).querySelector('img');
      expect(found).not.toBeNull();
      return found;
    });
    expect(img.src).toBe('https://blob.test/new.webp');
    expect(screen.getByRole('status').textContent).toMatch(/Logo 7 aggiornato/);

    const put = calls.find((c) => c.method === 'PUT');
    expect(put.query).toBe('slot=7');
    expect(put.options.headers['Content-Type']).toBe('image/png');
    expect(put.options.body).toBe(png);
  });

  it.each([
    ['un formato non supportato', file('logo.gif', 'image/gif'), /Formato non supportato/],
    ['un file oltre 4 MB', file('big.png', 'image/png', 4 * 1024 * 1024 + 1), /File troppo grande/],
  ])('blocca %s senza contattare il server', async (_, badFile, message) => {
    loggedIn();
    render(<Admin />);
    await screen.findByRole('heading', { name: /Loghi Partner/ });

    // applyAccept: false simula un file scelto aggirando il filtro del selettore (es. drag & drop).
    await userEvent.setup({ applyAccept: false }).upload(slotInput(1), badFile);

    expect(screen.getByRole('status').textContent).toMatch(message);
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('mostra l\'errore del server se il caricamento fallisce', async () => {
    const user = userEvent.setup();
    loggedIn();
    routes['PUT /api/admin/logos'] = () => reply(415, { error: 'Formato non supportato o file danneggiato' });
    render(<Admin />);
    await screen.findByRole('heading', { name: /Loghi Partner/ });

    await user.upload(slotInput(2), file('logo.png', 'image/png'));
    expect((await screen.findByText(/Logo 2: Formato non supportato/)).className).toMatch(/messageError/);
    expect(screen.getByRole('button', { name: 'Carica il logo 2' })).toBeTruthy();
  });

  it('se la sessione è scaduta durante un caricamento torna al login', async () => {
    const user = userEvent.setup();
    loggedIn();
    routes['PUT /api/admin/logos'] = () => reply(401, { error: 'Non autorizzato' });
    render(<Admin />);
    await screen.findByRole('heading', { name: /Loghi Partner/ });

    await user.upload(slotInput(1), file('logo.png', 'image/png'));
    expect(await screen.findByRole('button', { name: 'Accedi' })).toBeTruthy();
  });

  it('accetta un file trascinato sulla posizione', async () => {
    loggedIn();
    routes['PUT /api/admin/logos'] = () => reply(200, { url: 'https://blob.test/dropped.webp' });
    render(<Admin />);
    const target = await screen.findByRole('button', { name: 'Carica il logo 4' });

    const dropped = file('logo.webp', 'image/webp');
    fireEvent.drop(target, { dataTransfer: { files: [dropped] } });

    await screen.findByRole('button', { name: 'Sostituisci il logo 4' });
    expect(calls.find((c) => c.method === 'PUT').query).toBe('slot=4');
  });

  it('rimuove un logo solo dopo la conferma', async () => {
    const user = userEvent.setup();
    const logos = emptyLogos();
    logos[9] = 'https://blob.test/logo10.webp';
    loggedIn(logos);
    routes['DELETE /api/admin/logos'] = () => reply(200, { ok: true });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<Admin />);

    await user.click(await screen.findByRole('button', { name: 'Rimuovi' }));
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Rimuovi' }));
    await screen.findByRole('button', { name: 'Carica il logo 10' });
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(calls.find((c) => c.method === 'DELETE').query).toBe('slot=10');
    expect(screen.getByRole('status').textContent).toMatch(/Logo 10 rimosso/);
  });
});
