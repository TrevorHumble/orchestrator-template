---
name: update-claude-md
description: >-
  What to refresh in CLAUDE.md after project state changes. Triggers: "after
  creating an issue", "after committing to main", "update the project doc",
  "record this in CLAUDE.md", any task that adds or changes an agent, skill,
  standard, or convention.
---

# update-claude-md

CLAUDE.md is the orchestrator's operating doc. It carries the project's
conventions — not a task list, and not an agent/skill/standard roster: the
`agents/`, `skills/`, and `standards/` directory listings are the sole source
for what exists in each, so there is nothing to mirror here. **Issue status
lives on the GitHub board, not in CLAUDE.md**; the board is the single source
of truth for state, so there is no issue table to maintain here either.

## What to refresh

After an issue is committed to `main`, check whether the change altered anything
CLAUDE.md describes, and bring it current in the same pass:

- **Conventions / policy** — if it changed a convention, a model-policy rule, a
  pipeline step, or an authoritative-source pointer, edit that line so the doc
  matches how the system now behaves.

Touch nothing that did not change. Keep every entry terse — no prose summaries.
Match the surrounding format.

## Where

The repo-root `CLAUDE.md` — the project-level operating doc. Do **not** touch the
global user config at `~/.claude/CLAUDE.md`.

## When NOT to update

- Draft issues not yet created, or commits not yet on `main` — state changes only.
- A change that touches no convention or policy line — CLAUDE.md carries neither
  a task list nor an agent/skill/standard roster (see above), so a change to one
  of those alone is not, by itself, a reason to edit this file. Inventing an
  entry for a change that touched neither degrades the doc as much as leaving a
  real convention/policy change unrecorded.
