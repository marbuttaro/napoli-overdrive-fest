import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// In produzione le funzioni in /api girano su Vercel; in sviluppo le serve questo
// middleware, così `npm run dev` funziona anche per la dashboard /admin senza `vercel dev`.
const API_ROUTES = {
  '/api/logos': './api/logos.js',
  '/api/admin/login': './api/admin/login.js',
  '/api/admin/logout': './api/admin/logout.js',
  '/api/admin/logos': './api/admin/logos.js',
}

function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const route = API_ROUTES[req.url.split('?')[0]]
        if (!route) return next()
        try {
          const { default: handler } = await server.ssrLoadModule(route)
          await handler(req, res)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Rende disponibili alle funzioni /api in sviluppo le variabili di .env
  // (ADMIN_*, BLOB_READ_WRITE_TOKEN), che non hanno il prefisso VITE_. Mai nei test:
  // devono girare isolati, senza credenziali né token reali.
  if (mode !== 'test') {
    Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ''), ...process.env })
  }

  return {
    plugins: [react(), devApi()],
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
        },
      },
    },
    test: {
      include: ['tests/**/*.test.{js,jsx}'],
      environment: 'node',
      restoreMocks: true,
      unstubEnvs: true,
    },
  }
})
