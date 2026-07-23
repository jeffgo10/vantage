# Update ls-foundry packages (+ optional integration plan)

Bump Vantage’s engine packages published from [ls-foundry](https://github.com/jeffgo10/ls-foundry) and integrate any API or type changes in this repo.

Follow `.cursor/rules/vantage-viewer.mdc`, `.cursor/rules/vantage-project.mdc`, and `.cursor/rules/vantage-ls-foundry-boundary.mdc`.

**Do not edit, commit, or publish ls-foundry from this session.** If a needed API is missing upstream, give the user a paste-ready brief for an ls-foundry agent (template in `vantage-ls-foundry-boundary.mdc`), then bump here after publish.

## Mode — read trailing user text

The user may append instructions after invoking this command (e.g. `/update-ls-foundry-packages plan: …`).

| Trailing text | Mode |
|---|---|
| Empty, or "update only" / "bump only" | **Update** — bump packages and integrate breaking changes |
| Contains "plan", feature ideas, bullet list, or "I want to…" | **Plan + Update** — plan first, then bump and outline integration work |
| Starts with "plan only" | **Plan only** — no package bump; produce an integration plan the user can approve first |

If ambiguous, ask one short clarifying question, then proceed.

---

## Plan mode (when requested)

Before or instead of bumping, produce a concise integration plan:

1. **Restate features** the user wants in Vantage (editor, public viewer, hotspot UX).
2. **Map to ls-foundry** — which package(s) must change upstream vs what can be wired here only:
   - `@jeffgo10/panorama-viewer` — Pannellum React wrapper, hotspot markers, editor primitives (planned)
   - `@jeffgo10/helpers` — only if shared DOM/gesture utilities are needed
3. **List touch points** in this repo (files/components likely to change).
4. **Order work** — foundry package → publish → bump here → replace local wrapper → editor/public viewer → docs/rules.
5. **Flag risks** — Next.js SSR (`"use client"` / `dynamic`), CSS class ownership, CDN vs bundled pannellum assets.

Output format:

```markdown
## Integration plan — <short title>

### Features requested
- …

### Upstream (ls-foundry) vs this repo
| Change | Where |
|---|---|

### Files to touch
- …

### Steps
1. …

### Open questions
- …
```

Stop after the plan if mode is **Plan only**. Otherwise continue to Update mode.

---

## Update mode

### 1. Pre-flight

- Confirm `.npmrc` exists with `@jeffgo10:registry=https://npm.pkg.github.com` and `GITHUB_TOKEN` (see `.npmrc.example`). If missing, tell the user to copy and set the token — do not guess credentials.
- Record **current** versions from root `package.json` for any `@jeffgo10/*` deps.
- If `@jeffgo10/panorama-viewer` is not yet a dependency, stop after reporting that the package is unpublished — do not invent a version. Offer a paste-ready ls-foundry brief instead.

### 2. Check ls-foundry (optional, if `~/projects/ls-foundry` exists)

Read upstream `package.json` versions and recent changes in:
- `packages/panorama-viewer/` (when it exists)
- any other `@jeffgo10/*` package Vantage imports

Note new exports, props, or breaking type changes. **Read only** — do not edit ls-foundry.

### 3. Bump packages

Run from repo root (adjust package names to what Vantage actually depends on):

```bash
pnpm up @jeffgo10/panorama-viewer
pnpm install
```

If a specific version was requested in trailing text, use `pnpm up @jeffgo10/…@<version>` instead of latest.

**Exact pins** in `package.json` (no `^`) do not auto-jump minor versions — if `pnpm up` reports "Already up to date" but ls-foundry has a newer publish, bump explicitly (e.g. `@jeffgo10/panorama-viewer@0.2.0`).

### 4. Verify

```bash
pnpm lint
pnpm build
```

Fix type errors and integration gaps. Key surfaces (evolve as wiring lands):

| Area | Files |
|---|---|
| Viewer wrapper / re-export | `src/components/viewer/` |
| Tour editor | `src/app/properties/[id]/edit/` |
| Public viewer | `src/app/t/[slug]/` |
| Hotspot styles | `src/app/globals.css` |
| Rules pins | `.cursor/rules/vantage-viewer.mdc`, `vantage-ls-foundry-boundary.mdc` |

Remove duplicate local Pannellum logic once the package covers it.

### 5. Report

Summarize for the user:

- Old → new version for each `@jeffgo10/*` package
- Breaking changes found and fixes applied (or remaining TODOs)
- If Plan mode was used: which planned features are done vs still pending
- Suggest manual smoke test: `pnpm db:start && pnpm dev` → open `/t/demo` and editor preview

### 6. Knowledge sync (if non-trivial changes)

If versions or APIs changed materially, update `.cursor/rules/vantage-viewer.mdc` and pin table in `vantage-ls-foundry-boundary.mdc`. Optionally `/sync-obsidian-vantage`.
