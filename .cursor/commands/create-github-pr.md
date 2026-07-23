# Create GitHub PR from branch commits

Analyze commits and diffs on the current branch, draft a PR title and description, push if needed, and open a pull request with `gh`. **Cleanup mode** syncs the integration branch after a merged PR.

**Branch strategy:** `master` is the default integration/release branch until a `dev` workflow is introduced.

## Mode — read trailing user text

| Trailing text | Mode |
|---|---|
| Empty | **Create** — analyze, push if needed, open PR **into `master`** |
| `cleanup` or `post-merge` | **Cleanup** — sync **`master`**, switch to it, delete merged feature branch |
| `draft only`, `preview`, or `dry run` | **Draft only** — show proposed title/body; do not push or create PR |
| `draft pr` or `as draft` | **Create draft PR** — same as Create but `gh pr create --draft` |
| Contains `base:` or `into:` (e.g. `base: develop`) | Override base branch |
| Contains `title:` | Use as title hint or override |
| Describes scope | Narrow summary to that scope; still list all commits in appendix if present |

**Default base branch:** `master`.

If trailing text is **cleanup** / **post-merge**, skip Create — run **Cleanup mode** only.

### Uncommitted changes (Create modes) — commit + PR immediately

When creating a PR and the working tree has changes:

1. **Do not ask** whether to commit only, commit + PR, or cancel.
2. Create a feature branch if currently on `master` (descriptive `feat/` / `fix/` / `chore/` name from the diff).
3. Stage relevant files (exclude `.env*`, secrets, credentials, `.dev.vars` with secrets).
4. Commit with a concise message matching repo style (HEREDOC; follow user committing-changes rules).
5. Continue: push + open PR.

**Draft only** still does not commit or push.

### Typical invocations

```
/create-github-pr
/create-github-pr draft only
/create-github-pr as draft
/create-github-pr cleanup
/create-github-pr post-merge
/create-github-pr cleanup: keep branch
/create-github-pr title: Phase 1 scaffolding and Cloudflare adapter
/create-github-pr base: develop
```

---

## Cleanup mode (after PR merged)

| Invocation | Sync target |
|---|---|
| `/create-github-pr cleanup` | `master` |

**Default:** delete merged local + remote feature branch. Use **keep branch** or **no delete** to skip.

### C1 — Pre-check

```bash
git status
git branch --show-current
git remote -v
```

Remember previous branch name when not already on `master`.

| Situation | Action |
|---|---|
| Uncommitted changes | **Stop** — ask user to commit, stash, or discard |
| Already on `master` | Skip checkout; still fetch + pull; skip branch delete |
| On a feature branch | Remember name for delete in C3 |

### C2 — Sync

```bash
git fetch origin
git checkout master
git pull origin master
```

Requires network / git_write. Never force-pull or `reset --hard` unless the user explicitly requests it.

### C3 — Remove merged feature branch (default)

**Skip** when trailing text includes **keep branch** or **no delete**.

Confirm merge first:

```bash
git branch --merged master
gh pr list --state merged --head <branch> --json number,title,mergedAt,baseRefName
```

| Target | Command |
|---|---|
| Local (merged) | `git branch -d <branch>` |
| Local (not merged) | Do **not** delete; warn |
| Remote (merged) | `git push origin --delete <branch>` |

Do not delete `master`.

### C4 — Report

```markdown
## Post-merge cleanup

**Base branch:** `master` (up to date with `origin/master`)
**Previous branch:** `feat/…`
**Switched to:** `master`
**Local branch deleted:** yes / no / skipped
**Remote branch deleted:** yes / no / skipped / already gone
```

---

## Step 0 — `gh` pre-check (Create modes; skip for Draft only and Cleanup)

```bash
command -v gh && gh auth status
```

| Result | Action |
|---|---|
| `gh` missing / not authed | After push, print web compare URL + `brew install gh` / `gh auth login`; do not fail the flow |
| OK | Proceed with `gh pr create` |

Web fallback: `https://github.com/<owner>/<repo>/compare/<base>...<branch>`

---

## Step 1 — Gather git context (parallel)

```bash
git status
git branch -vv
git remote -v
git log --oneline -15
git fetch origin master 2>/dev/null || true
git log origin/master..HEAD --oneline
git diff origin/master...HEAD --stat
git diff origin/master...HEAD
```

Analyze **ALL** commits since diverging from base — not only the latest.

---

## Step 2 — Draft PR title

- One line, ≤ 72 characters when possible
- Imperative mood — "Add …", "Fix …", "Update …"
- Lead with user-facing or architectural outcome, not file names

---

## Step 3 — Draft PR description

```markdown
## Summary

<2–4 sentences: what and why>

## Changes

- …

## Commits

| SHA | Message |
|-----|---------|
| `abc1234` | … |

## Test plan

- [ ] `pnpm lint && pnpm build`
- [ ] Manual: …

## Notes / follow-ups

<env vars, migrations, deferred work — or "None.">
```

Do not include secrets or `.env` contents.

---

## Step 4 — Branch, commit (if dirty), push

1. If on `master` for a feature flow: create `feat/` / `fix/` / `chore/` branch from the diff.
2. Commit uncommitted product changes (HEREDOC). Never stage `.env*`, credential files.
3. Push:

```bash
git push -u origin HEAD
```

Never force-push to `master`.

---

## Step 5 — Create PR

```bash
gh pr create --base master --title "…" --body "$(cat <<'EOF'
## Summary
…
EOF
)"
```

Add `--draft` when mode is **Create draft PR**. If a PR already exists, report URL via `gh pr view`.

---

## Step 6 — Report

Report URL (or draft / web fallback) with title, base, and commit count.

## Do not

- Ask commit-only vs commit+PR when Create has uncommitted product changes — **commit + PR immediately**
- Open a feature PR from `master` into `master` without a feature branch first
- Use `--fill` blindly
- Run `git config` changes
- In Cleanup: `reset --hard` or `branch -D` without confirming merge
- In Draft only: commit, push, or create a PR
