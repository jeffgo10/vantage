---
name: handoff
description: Compact the current Cursor session into a handoff doc for the next agent (rules, skills, git, env).
argument-hint: "Next session focus (optional): e.g. finish auth, open PR, minimal"
disable-model-invocation: true
---

# Handoff — compact session for the next Cursor agent

Summarize the current chat into a **handoff document** a fresh Cursor agent can use to continue without re-discovering context. Save the file **outside the repo** (OS temp directory), not in the workspace.

## Mode — read trailing user text

| Trailing text | Mode |
|---|---|
| Empty | **Full handoff** — goal, progress, blockers, env, suggested next steps |
| Describes next focus | **Tailored** — same structure, prioritize that focus in Goal + Next steps |
| "minimal" or "short" | **Minimal** — Goal, Current state, Next 3 steps, Critical paths only |
| "with transcript" | **Full + transcript ref** — include agent transcript path if discoverable |

If ambiguous, default to **Full handoff**.

---

## Step 1 — Gather context (do not guess)

1. **User intent** — what they asked for; what changed mid-session.
2. **Trailing text** — next-session focus.
3. **Git** (when relevant):
   ```bash
   git branch --show-current
   git status --short
   git log -5 --oneline
   ```
4. **Changed files** — paths only; do not paste full diffs.
5. **Terminals** — ports / long-running commands if relevant (`pnpm dev` → `:3000`).
6. **Cursor artifacts** — rules, commands, MCP (Obsidian `RoamVantage/`).
7. **External refs** — PRs, Obsidian notes — path or URL only.

**Do not duplicate** PRDs, plans, ADRs, issues, commits, or diffs — **reference by path**.  
**Redact** secrets, tokens, `.env` values, PII.

---

## Step 2 — Write the handoff file

| OS | Directory |
|---|---|
| macOS / Linux | `$TMPDIR` or `/tmp` |
| Windows | `%TEMP%` |

**Filename:** `cursor-handoff-roamvantage-<YYYYMMDD-HHMM>.md`  
Tell the user the **full absolute path** when done.

### Template

```markdown
# Cursor handoff — <short title>

**Generated:** <ISO date/time>
**Repo:** <absolute workspace path>
**Branch:** <branch> (<clean | dirty>)
**Next session focus:** <from trailing text or "continue current task">

## Goal

<1–3 sentences>

## Current state

- …

## Key decisions & constraints

- …

## Files & artifacts (reference only)

| Path | Relevance |
|---|---|
| `path/to/file` | <one line> |

## Environment & dev notes

<Ports, env var *names* only, services>

## Blockers & open questions

- …

## Suggested next steps

1. …

## Cursor continuation guide

### Rules to read first

- `.cursor/rules/roamvantage-project.mdc` — overview
- …

### Suggested slash commands

- `/create-github-pr` — open PR into `master`
- `/sync-obsidian-roamvantage` — dual-write vault + rules
- `/update-ls-foundry-packages` — bump `@jeffgo10/*` after engine publish
- `/handoff` — another handoff

### MCP / tools

- Obsidian `RoamVantage/` via `user-MCP_DOCKER`

### Recommended Cursor mode

<Agent | Plan | Debug> — <why>
```

---

## Step 3 — RoamVantage defaults

| Topic | Read first |
|---|---|
| Project overview | `.cursor/rules/roamvantage-project.mdc`, `README.md` |
| Knowledge sync | `.cursor/rules/roamvantage-knowledge-sync.mdc` |
| Clean code / UI | `.cursor/rules/clean-code.mdc`, `.cursor/rules/UI-UX/` |
| ls-foundry boundary | `.cursor/rules/roamvantage-ls-foundry-boundary.mdc` |
| 360 viewer | `.cursor/rules/roamvantage-viewer.mdc` |
| Open PR | `/create-github-pr` |
| Obsidian | `/sync-obsidian-roamvantage` |
| Bump engine packages | `/update-ls-foundry-packages` |

---

## Step 4 — Quality bar

- [ ] Next agent can act in ≤2 minutes without re-reading the whole chat
- [ ] Every file mention is a **path**, not a pasted blob
- [ ] Next steps are actionable (verb + target)
- [ ] No secrets in the saved file
- [ ] User receives the **absolute path**

Do **not** commit the handoff file unless the user explicitly asks.
