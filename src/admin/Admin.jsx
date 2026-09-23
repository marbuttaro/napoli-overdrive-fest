import { useEffect, useRef, useState } from 'react';
import styles from './Admin.module.css';
import logoWhite from '../assets/logos/logo-white.svg';

// Deve restare allineato a LOGO_SLOTS / MAX_UPLOAD_BYTES in api/_lib/logos.js.
const MODULE_COUNT = 4;
const LOGOS_PER_MODULE = 4;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

async function request(url, options) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Errore ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

const LoginForm = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    try {
      await request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.get('username'), password: form.get('password') }),
      });
      onLogin();
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <img src={logoWhite} alt="Overdrive Fest" className={styles.loginLogo} />
        <h1 className={styles.loginTitle}>Area riservata</h1>

        <label className={styles.field}>
          <span>Username</span>
          <input name="username" autoComplete="username" required autoFocus />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button type="submit" className={styles.primaryButton} disabled={pending}>
          {pending ? 'Accesso…' : 'Accedi'}
        </button>
      </form>
    </main>
  );
};

const LogoSlot = ({ slot, url, busy, onUpload, onRemove }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    if (files?.[0]) onUpload(slot, files[0]);
  };

  return (
    <div className={styles.slot}>
      <button
        type="button"
        className={`${styles.preview} ${dragOver ? styles.previewDrag : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer.files);
        }}
        disabled={busy}
        aria-label={url ? `Sostituisci il logo ${slot}` : `Carica il logo ${slot}`}
      >
        <span className={styles.slotNumber}>{String(slot).padStart(2, '0')}</span>
        {url ? <img src={url} alt="" /> : <span className={styles.placeholder}>LOGO</span>}
        {busy && <span className={styles.busy}>Salvataggio…</span>}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div className={styles.slotActions}>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {url ? 'Sostituisci' : 'Carica'}
        </button>
        {url && (
          <button type="button" className={styles.removeButton} onClick={() => onRemove(slot)} disabled={busy}>
            Rimuovi
          </button>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ initialLogos, onLogout }) => {
  const [logos, setLogos] = useState(initialLogos);
  const [busySlots, setBusySlots] = useState(() => new Set());
  const [message, setMessage] = useState(null);

  const setBusy = (slot, busy) =>
    setBusySlots((current) => {
      const next = new Set(current);
      if (busy) next.add(slot);
      else next.delete(slot);
      return next;
    });

  const setLogo = (slot, url) =>
    setLogos((current) => current.map((value, index) => (index === slot - 1 ? url : value)));

  const run = async (slot, action, successText) => {
    setBusy(slot, true);
    setMessage(null);
    try {
      await action();
      setMessage({ type: 'success', text: successText });
    } catch (err) {
      if (err.status === 401) return onLogout();
      setMessage({ type: 'error', text: `Logo ${slot}: ${err.message}` });
    } finally {
      setBusy(slot, false);
    }
  };

  const handleUpload = (slot, file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Formato non supportato: usa PNG, JPEG o WebP.' });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage({ type: 'error', text: 'File troppo grande: massimo 4 MB.' });
      return;
    }
    run(
      slot,
      async () => {
        const { url } = await request(`/api/admin/logos?slot=${slot}`, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        setLogo(slot, url);
      },
      `Logo ${slot} aggiornato. Sarà visibile sul sito entro circa un minuto.`,
    );
  };

  const handleRemove = (slot) => {
    if (!window.confirm(`Rimuovere il logo ${slot}?`)) return;
    run(
      slot,
      async () => {
        await request(`/api/admin/logos?slot=${slot}`, { method: 'DELETE' });
        setLogo(slot, null);
      },
      `Logo ${slot} rimosso.`,
    );
  };

  const handleLogout = async () => {
    await request('/api/admin/logout', { method: 'POST' }).catch(() => {});
    onLogout();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img src={logoWhite} alt="Overdrive Fest" className={styles.headerLogo} />
        <div className={styles.headerActions}>
          <a href="/#sponsor" target="_blank" rel="noreferrer">Vedi il sito</a>
          <button type="button" onClick={handleLogout}>Esci</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Loghi Partner &amp; Sponsor</h1>
          <p>
            Clicca su una posizione o trascinaci un file per caricare il logo. Formati accettati: PNG,
            JPEG o WebP (max 4 MB) — viene convertito automaticamente in WebP. Per un risultato
            migliore usa loghi con sfondo trasparente.
          </p>
        </div>

        <p
          className={`${styles.message} ${message?.type === 'error' ? styles.messageError : ''}`}
          role="status"
          aria-live="polite"
        >
          {message?.text}
        </p>

        <div className={styles.modules}>
          {Array.from({ length: MODULE_COUNT }, (_, moduleIndex) => (
            <section key={moduleIndex} className={styles.module} aria-label={`Modulo ${moduleIndex + 1}`}>
              {Array.from({ length: LOGOS_PER_MODULE }, (__, logoIndex) => {
                const slot = moduleIndex * LOGOS_PER_MODULE + logoIndex + 1;
                return (
                  <LogoSlot
                    key={slot}
                    slot={slot}
                    url={logos[slot - 1]}
                    busy={busySlots.has(slot)}
                    onUpload={handleUpload}
                    onRemove={handleRemove}
                  />
                );
              })}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

const Admin = () => {
  // null = verifica in corso, false = da autenticare, array = loghi (autenticato)
  const [logos, setLogos] = useState(null);
  const [loadError, setLoadError] = useState('');

  const load = () =>
    request('/api/admin/logos')
      .then((data) => setLogos(data.logos))
      .catch((err) => {
        if (err.status === 401) setLogos(false);
        else setLoadError(err.message);
      });

  useEffect(() => {
    load();
  }, []);

  if (loadError) return <p className={styles.loading}>Errore: {loadError}</p>;
  if (logos === null) return <p className={styles.loading}>Caricamento…</p>;
  if (logos === false) return <LoginForm onLogin={load} />;
  return <Dashboard initialLogos={logos} onLogout={() => setLogos(false)} />;
};

export default Admin;
