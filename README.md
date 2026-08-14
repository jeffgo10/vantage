# RoamVantage

PWA for real estate **360° virtual tours**. Agents upload equirectangular panoramas, place navigation hotspots between rooms, and share a public link buyers can open on any device.

Phase 0 (discovery) is complete in Obsidian. **Phase 1 foundation is wired**: Auth, tour CRUD, R2 panorama upload, and public tours from the DB.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js (App Router) |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |
| Panoramas | Cloudflare R2 |
| DB / Auth | Supabase (Postgres + Auth) |
| Viewer | [Pannellum](https://pannellum.org/) via `@jeffgo10/panorama-viewer` ([ls-foundry](https://github.com/jeffgo10/ls-foundry)) |
| Payments | Stripe (Phase 3) |

GitHub Packages: copy `.npmrc.example` → `.npmrc` and set `GITHUB_TOKEN` (read:packages) before installing `@jeffgo10/*`.

## Quick start

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running (local Supabase).

```bash
pnpm install
pnpm db:start          # first run pulls images; applies supabase/migrations
cp .env.example .env.local
# Paste keys from: pnpm db:status -o env
pnpm dev
```

Open [http://localhost:3200](http://localhost:3200). Studio UI: [http://127.0.0.1:54323](http://127.0.0.1:54323).

Static fixture tour (no DB): [http://localhost:3200/t/demo](http://localhost:3200/t/demo).

| Script | Purpose |
|---|---|
| `pnpm db:start` | Start local Postgres, Auth, Storage, Studio |
| `pnpm db:stop` | Stop local stack |
| `pnpm db:status` | URLs + anon/service keys |
| `pnpm db:reset` | Re-run migrations + seed |

### Useful routes

| Route | Purpose |
|---|---|
| `/` | Marketing shell |
| `/login`, `/signup` | Email/password Auth |
| `/dashboard` | Agent views overview (mocked metrics) |
| `/tours` | Agent tour list |
| `/tours/new` | Create tour |
| `/tours/[id]/edit` | Tour editor + panorama upload |
| `/t/[slug]` | Public viewer (published tours) |
| `/t/demo` | Static fixture tour (no DB) |
| `/api/health` | Health check |
| `/api/uploads/panorama` | Authenticated R2 upload |
| `/api/media/[...key]` | Serve panorama bytes from R2 |

### Cloudflare preview / deploy

```bash
# Create R2 bucket once (requires wrangler login)
pnpm exec wrangler r2 bucket create roamvantage-panoramas

pnpm preview   # build + local Workers runtime
pnpm deploy    # build + deploy to Cloudflare
```

### Database

**Local (default):** `pnpm db:start` applies migrations automatically. Keys via `pnpm db:status -o env`.

**Hosted:** create a Supabase project, `supabase link`, then `supabase db push`. Point Workers / preview env at the cloud URL and keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

Hyperdrive (Workers → Postgres pooling) is optional for now — the app talks to Supabase over HTTPS (Auth + PostgREST), not a direct Postgres connection. Add a Hyperdrive binding in `wrangler.jsonc` only if you later query Postgres directly from the Worker.

## Phase 1 checklist (from roadmap)

- [x] Next.js App Router project + folder structure
- [x] `@opennextjs/cloudflare` + Wrangler config
- [x] ESLint / Prettier + `.env.example`
- [x] Domain types + Supabase migration (profiles, tours, scenes, hotspots + RLS)
- [x] PWA shell (manifest + service worker)
- [x] Placeholder screens: dashboard, editor, public viewer
- [x] Wire Supabase Auth for real sign-up/login
- [x] R2 upload pipeline (originals; Sharp/IMAGES compression deferred)
- [x] Billing scaffold (Stripe stubs in `src/lib/stripe.ts`)

## Pricing (locked)

- **Free** — 2 active tours, watermark, capped scenes
- **Pro** — $10/mo
- **Team** — $45/mo (up to 5 seats)

MVP ships Free-tier *features* without Free-tier *limits* (limits turn on in Phase 3 with billing).
