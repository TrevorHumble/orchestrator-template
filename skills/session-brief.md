---
name: session-brief
description: >
  Renders a paste-able session brief for one epic-issue track on demand, straight from the live
  board — no stored roadmap file. Use when asked to "start a session", "give me the brief for
  track X", "/session <track>", or "what's next to build in <track>" — invoked as `/session <track>`.
---

# `/session <track>`

Generates a paste-able brief for one epic-issue session group ("track", `` e.g. `BACKEND`, `UI` ``)
by reading the live board. There is **no stored copy** of this brief — it is rendered fresh from
GitHub every time.

## Procedure

0. **Freshness check:** run `powershell -File tools/check-freshness.ps1` before anything else. It
   is read-only (`git fetch` + an ahead/behind count) and exits non-zero when the local checkout
   is behind `origin/main` — if it reports drift, `git pull` before proceeding. Build sessions
   merge on GitHub from isolated worktrees, so a primary checkout never updates itself; a brief
   (or a review) started from a stale checkout is pointed at code that no longer exists.

   Fresh code does not imply fresh installed dependencies — a native or binary dependency in
   particular can silently keep running a stale build on a dev machine while CI tests the bumped
   version. If this project tracks installed-dependency drift with its own check, run it here and
   reconcile (typically `npm ci`) before trusting `npm test` results from this checkout.

1. **Read the epic:** `gh issue view <FILL: epic issue number>` — find the named track's section, its `Files:` line,
   its relation tag (`depends on <track>` / `parallel-safe with <track>` / `parallel after
<root>`), and its issue checklist in listed order. This order **is** the build order.
2. **Read each issue on the track:** `gh issue view <n>` for every issue listed under that track,
   in the order the epic lists them. Pull each issue's `Depends on` and `Touches` fields and its
   milestone.
3. **Render the brief** (stdout, paste-able) with these parts:
   - **Build order** — the track's issues, in the order step 1 found them.
   - **Touches** — each issue's `Touches` paths, so shared-file collisions across the track are
     visible before work starts.
   - **Depends on** — each issue's `Depends on` field, so cross-issue ordering inside the track is
     explicit, not assumed.
   - **parallel-safe** — the track's relation tag from the epic. Two tracks are `parallel-safe`
     only when their `Files:` sets are disjoint AND neither depends on the other; state this
     rule plainly so the reader can re-derive it, not just repeat the epic's tag.
   - **Merge policy** — do not restate it. Point to it:
     See: `DESIGN.md` for the merge policy, and `CLAUDE.md` for the pipeline gate order (issue
     review → implement → PR review → commit/PR).

## Why board-derived, not stored

A committed brief/roadmap file is a second copy of state the board already holds, and it goes
stale or gets wiped by an unrelated git operation. This skill keeps the copy-paste convenience
without keeping the file: it reads `gh issue view <epic>` and each issue on demand, so there is
**no stored copy** to drift from the board. If a rendered brief and the board ever disagree, the
board wins.

## Out of scope

Launching the session directly (running the build agent against the rendered brief) is a separate
concern — this skill only produces the brief text.
