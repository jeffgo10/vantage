# Sync Obsidian RoamVantage notes (+ optional Cursor rules)

Document recent changes in the Obsidian **RoamVantage** vault via MCP, and optionally refresh `.cursor/rules/` when agent guidance should match.

Follow `.cursor/rules/roamvantage-knowledge-sync.mdc`.

## Mode — read trailing user text

| Trailing text | Mode |
|---|---|
| Empty, or "obsidian only" | **Obsidian** — update vault notes only |
| Contains "rules", "cursor rules", or "both" | **Obsidian + Rules** — vault first, then sync `.cursor/rules/*.mdc` |
| Starts with "rules only" | **Rules only** — skip Obsidian; update Cursor rules from repo/docs |
| Describes specific topic (e.g. "auth fix", "R2 upload") | Scope sync to that topic only |

If ambiguous, default to **Obsidian + Rules**.

---

## Step 0 — MCP pre-check (required before any Obsidian write)

1. Discover Obsidian tool schemas before calling.
2. **Probe:** `obsidian_list_files_in_dir` with `{ "dirpath": "RoamVantage" }`.
3. **If probe fails** — stop Obsidian work; report why; still run **Rules only** if requested. Do not call append/patch tools.

---

## Step 1 — Discover what changed

Gather context from (priority order):

1. **Trailing user text**
2. **Git** — `git status`, `git diff`, `git log -5 --oneline`
3. **Conversation** — resolved bugs, features, infra fixes this session
4. **Repo docs** — `README.md`, `supabase/migrations/`, `wrangler.jsonc`

Skip trivial changes (typos, formatting-only).

---

## Step 2 — Choose Obsidian targets

| Change type | Target note | Action |
|---|---|---|
| Phase / roadmap checkbox | `RoamVantage/Roadmap.md` | Patch relevant phase section |
| Stack / hosting decision | `RoamVantage/Tech Stack.md` | Patch or append |
| Schema / entity change | `RoamVantage/Data Model.md` | Patch |
| Viewer / editor UX | `RoamVantage/Wireframes.md` | Patch |
| Pricing / tiers | `RoamVantage/Pricing.md` | Patch |
| Resolved bug / gotcha | `RoamVantage/Notes — <short title>.md` | Create or update |

**Always read before write.** Keep new Notes under ~60 lines.

### Noteworthy note template

```markdown
# Notes — <Topic>

**When:** <month year>
**Context:** <one line — e.g. Phase 1 OpenNext + R2>

## Symptom / goal
…

## Cause
…

## Fix
…

## Files touched
- `path/to/file.ts`

## Related
- [[Roadmap]]
- Repo: `README.md`
```

---

## Step 3 — Update Cursor rules (when mode includes Rules)

- Update `roamvantage-project.mdc` for cross-cutting facts
- Add/update topic rules (`roamvantage-auth.mdc`, `roamvantage-r2.mdc`, `roamvantage-viewer.mdc`, …)
- One concern per file; under ~80 lines
- Do not duplicate long Obsidian prose into rules — summarize actionable constraints

---

## Step 4 — Report

```markdown
## Sync complete

**Mode:** Obsidian / Rules / both
**Obsidian:** updated `RoamVantage/…` (or skipped: <reason>)
**Rules:** updated `.cursor/rules/…` (or none)
**Skipped:** <trivial items>
```

### Typical invocations

```
/sync-obsidian-roamvantage
/sync-obsidian-roamvantage obsidian only
/sync-obsidian-roamvantage rules only
/sync-obsidian-roamvantage both: wired Supabase auth cookies
/sync-obsidian-roamvantage R2 upload pipeline notes
```
