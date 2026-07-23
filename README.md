# RoamVantage

PWA for real estate **360° virtual tours**. Agents upload equirectangular panoramas, place navigation hotspots between rooms, and share a public link buyers can open on any device.

Phase 0 (discovery) is complete in Obsidian. This repo is the **Phase 1 foundation scaffold**.

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

Open [http://localhost:3000](http://localhost:3000). Studio UI: [http://127.0.0.1:54323](http://127.0.0.1:54323).

| Script | Purpose |
|---|---|
| `pnpm db:start` | Start local Postgres, Auth, Storage, Studio |
| `pnpm db:stop` | Stop local stack |
| `pnpm db:status` | URLs + anon/service keys |
| `pnpm db:reset` | Re-run migrations + seed |

### Useful routes (scaffolded)

| Route | Purpose |
|---|---|
| `/` | Marketing shell |
| `/login`, `/signup` | Auth placeholders |
| `/dashboard` | Agent property list |
| `/properties/new` | Create property form |
| `/properties/[id]/edit` | Tour editor + Pannellum |
| `/t/[slug]` | Public viewer (try `/t/demo`) |
| `/api/health` | Health check |

### Cloudflare preview / deploy

```bash
# Create R2 bucket once (requires wrangler login)
pnpm exec wrangler r2 bucket create roamvantage-panoramas

pnpm preview   # build + local Workers runtime
pnpm deploy    # build + deploy to Cloudflare
```

### Database

**Local (default):** `pnpm db:start` applies migrations automatically. Keys via `pnpm db:status -o env`.

**Hosted:** create a Supabase project, `supabase link`, then `supabase db push`. Point `.env.local` at the cloud URL/keys when deploying.

Hyperdrive (Workers → Postgres pooling) is commented in `wrangler.jsonc` until you create a config.

## Phase 1 checklist (from roadmap)

- [x] Next.js App Router project + folder structure
- [x] `@opennextjs/cloudflare` + Wrangler config
- [x] ESLint / Prettier + `.env.example`
- [x] Domain types + Supabase migration (profiles, properties, scenes, hotspots + RLS)
- [x] PWA shell (manifest + service worker)
- [x] Placeholder screens: dashboard, editor, public viewer
- [ ] Wire Supabase Auth for real sign-up/login
- [ ] R2 upload pipeline + Sharp compression
- [ ] Billing scaffold (Stripe customer/subscription stubs)

## Pricing (locked)

- **Free** — 2 active properties, watermark, capped scenes
- **Pro** — $10/mo
- **Team** — $45/mo (up to 5 seats)

MVP ships Free-tier *features* without Free-tier *limits* (limits turn on in Phase 3 with billing).
