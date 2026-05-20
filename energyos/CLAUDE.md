# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EnergyOS is an energy management platform for medical clinics. It connects to GTB (Building Technical Management) servers via a proxy backend, uses Groq AI (Llama-3.1-8b) for automated energy optimization, and Supabase for auth and data storage.

## Commands

### Development

```bash
# Backend (runs on http://localhost:3001)
cd energyos/server && npm install && npm run dev

# Frontend (runs on http://localhost:5173)
cd energyos/client && npm install && npm run dev
```

### Frontend only

```bash
cd energyos/client
npm run dev        # start Vite dev server
npm run build      # production build → dist/
npm run lint       # ESLint
npm run preview    # preview production build
```

### Backend only

```bash
cd energyos/server
npm start          # node index.js (no hot reload)
```

### Environment setup

```bash
# Copy from root energyos/ directory (not client/ or server/)
cp energyos/.env.example energyos/.env
```

The `.env` file lives at the root `energyos/` level. The Vite config sets `envDir: '../'` so client picks up `VITE_*` vars from there. The server loads it explicitly with `dotenv({ path: '../.env' })`.

## Architecture

### Two-service layout

```
energyos/
├── client/   # React 19 SPA (Vite + Tailwind + Zustand)
├── server/   # Express 5 API proxy
└── .env      # Shared env file for both
```

### Authentication flow

There is no JWT or session. Access is code-based:
1. User enters an access code on `/onboarding`
2. `POST /api/auth/validate-code` checks `access_codes` table in Supabase
3. On success, `mode` is set to `'authenticated'` (or `'demo'`) in Zustand and persisted to `localStorage`
4. `AuthGuard` in `App.jsx` gates all `/dashboard/*` routes by checking `mode !== null`
5. Admin routes (`/admin`) bypass the mode check; they use `x-admin-secret` header validated by `server/middleware/auth.js`

Entering `ADMIN_SECRET` directly as a code also grants admin access (bypass in `routes/auth.js:14`).

### GTB proxy pattern

The client never calls the GTB/Node-RED simulator directly (CORS). All GTB calls go through the Express server at `/api/gtb/*`, which proxies them with Axios. The GTB base URL is stored in Zustand (`gtbEndpoint`) and passed as a `?url=` query param or in the request body.

GTB endpoints proxied: `/ping`, `/devices`, `/zones`, `/live`, `/alerts`, `/alerts/:id/acknowledge`, `/config` (GET + POST), `/control`.

If no GTB URL is provided to `/api/gtb/control`, the server returns a mock success — this is the intentional demo/simulation fallback.

### Groq AI integration

Two AI functions in `client/src/lib/groq.js`:
- `autoConfigFromDevices(deviceList, monthlyData)` — generates eco schedules, délestage priority, IPE thresholds, and alert settings
- `generateClinicalReport(zones, liveData, alerts)` — generates a French-language clinical energy audit report

The Groq SDK runs **directly in the browser** (`dangerouslyAllowBrowser: true`). The `VITE_GROQ_API_KEY` is exposed client-side. There is also a server-side Groq route at `/api/groq` for server-side usage.

### Zustand store (`client/src/store/index.js`)

Central state: `mode`, `accessCode`, `gtbEndpoint`, `zones`, `alerts`, `liveData`, `groqConfig`, `schedules`, `theme`.

On app mount (`App.jsx`), Zustand is rehydrated from `localStorage` keys: `energyos_mode`, `energyos_accessCode`, `energyos_gtbEndpoint`. The app waits for this hydration before rendering routes.

### Demo mode

When `mode === 'demo'`, the app uses fixture data from `client/src/lib/demoData.js` (DEMO_ZONES, MONTHLY_DATA with real Tunisian clinic baseline figures). The floating `SimulationControls` component lets users simulate peak load, faults, and resets for demo/presentation purposes.

### Database (Supabase PostgreSQL)

Migrations are in `database/` and must be run manually in the Supabase SQL editor. Tables: `clinics`, `access_requests`, `access_codes`, `zones`, `devices`, `energy_metrics`, `alerts_log`, `ai_optimizations`.

RLS policy summary:
- `access_requests`: anonymous INSERT only; service_role full access
- `access_codes`: anonymous + authenticated SELECT; service_role full access
- All other tables: service_role only

The client uses the anon key (`VITE_SUPABASE_ANON_KEY`). The server uses the service role key (`SUPABASE_SERVICE_KEY`) via `server/lib/supabaseAdmin.js`.

## Design system

Dark theme is primary. Colors are defined in `tailwind.config.js` and enforced throughout:
- Background: `#0A0D14`
- Cards: `#111827` with `border-white/5`
- Cyan (`#00D4FF`): power/energy
- Green (`#22C55E`): OK/optimized
- Amber (`#F59E0B`): warning/eco schedules
- Red (`#EF4444`): critical/load shedding

Fonts: Space Grotesk (headings), DM Sans (body), JetBrains Mono (numeric readings).

## Deployment

- **Frontend**: Netlify. Build base is `energyos/client`, publishes `dist/`. SPA redirect configured in `netlify.toml`.
- **Backend**: Render (or any Node host). Set all env vars from `.env.example` in the hosting dashboard.
