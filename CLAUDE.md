# CLAUDE.md — Operating rules for this repo

Behavioral rules for any AI agent working in this repository. This file is the repo's own operating
contract.

## North Star

Every change serves the goals in [`docs/north-star.md`](docs/north-star.md). Orient your work to
them; if a change moves none of them, question whether it belongs in this build.

`<FILL: a one-screen summary of docs/north-star.md — the shift being designed for, the end user, and
the goals — kept in sync with that file. Until this is filled in, there is no North Star to orient
work against; do not skip it.>`

## How work flows: the orchestrator pipeline

All changes go through an enforced pipeline. Do not commit code straight to the default branch and
do not skip steps.

1. **Issue** — file the work as a GitHub issue meeting `standards/issue-standards.md` (user story,
   Given/When/Then acceptance criteria, implementation plan, dependency map).
2. **Adversarial review of the issue** — an independent reviewer attacks the issue against the
   standard before any code is written. See `standards/adversarial-review-protocol.md`.
3. **Implement** — an implementer agent writes the change to satisfy the issue's acceptance
   criteria.
4. **Adversarial review of the PR** — a PR reviewer plus the design-philosophy reviewer attack the
   implementation against the issue and the standards; a blocker/major finding takes one re-check,
   scoped to the fix.
5. **Commit / PR** — only after review passes. Push the branch, open a pull request (`gh pr
create`), watch CI to green, then merge. Non-visual changes merge once adversarial review has
   passed and CI is green. **Visual / product-direction changes** are different in shape, not just
   gated later: the owner settles the look **live**, first — a seeded local preview link, the
   orchestrator edits the real front end directly against it while nothing commits, and only once
   the owner says approved does `tools/persist-visual-approval.ps1` freeze the pixels and the normal
   pipeline (criteria, issue review, implementation, PR review) run on the transcribed result — see
   `agents/orchestrator.md` § "Visual-approval loop". `.githooks/commit-msg` (a code commit must name
   a GitHub issue) is the only local hook; CI is the rest of the gate.

**Wave boundary — owner-invoked review, not a gate.** After a wave's planned batch of issues merges,
the owner may run `/post-wave-review` — a cross-PR regression, seam, and docs-vs-code drift check
plus a lived-data drill. This is **owner-invoked**: it never runs automatically and is never a
precondition for starting the next wave. Full mechanics: `standards/adversarial-review-protocol.md`
§ "Wave governance"; orchestrator-side nudge: `agents/orchestrator.md` § "Wave boundary".

Standards live in `standards/`. Agent definitions live in `agents/`. Both are the source of truth;
point to them rather than restating them.

## Model policy

Every spawned agent sets its `model` explicitly. Never rely on a default that may escalate silently.

| Role         | Model                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Orchestrator | Opus                                                                    |
| Implementer  | Sonnet                                                                  |
| Reviewers    | Opus by default, a different model from the implementer — see exception |

Reviewers run on a different model than the implementer, on every issue by default, so they do not
inherit the implementer's correlated blind spots. A reviewer must never review its own output.

**The one exception is the `sonnet-only` tier.** An issue the issue reviewer (`reviewer-issue`)
awarded `AWARD sonnet-only` — per `standards/issue-standards.md` § "Sonnet tier eligibility" — runs
its implementer and reviewers both on Sonnet; the orchestrator itself still runs Opus. This is a
judgment call the issue reviewer makes once, at issue-review time, reading the issue's own touched
paths — not a run-tier classifier script, and not a standing carve-out for any issue that merely
looks routine. Every issue without that award keeps the default Opus-reviewer bar in the table
above. Full mechanics, including the coverage-first instruction appended to sonnet-tier reviewer
spawns and manual mid-run escalation: `agents/orchestrator.md` § "Model policy".

**Phase-1 visual edits are one carve-out.** During the live-preview loop (`agents/orchestrator.md` §
"Visual-approval loop"), the orchestrator (Opus) edits the visual surface (`tools/visual-surface.ps1`)
directly instead of spawning the Sonnet implementer for each owner-requested tweak — the implementer
has no memory of the phase-1 conversation, so it cannot know what the owner already rejected two
refreshes ago, and spawning it per five-second edit would re-litigate settled taste calls for no
benefit. This holds only while nothing commits. The **phase-2 tree** — once the owner has approved,
the pixels are frozen, and the criteria are transcribed — is not exempted: it goes through the normal
implementer-then-reviewer bar in the table above, unchanged.

## Adversarial review, in brief

- Assume total failure. Every artifact enters review as broken until proven otherwise.
- Every finding cites real evidence (`file:line`, command output, issue/PR number). Every
  best-practice claim cites a current dated source.
- The spawner gives the goal, not the implementation. No positive framing, no planted suspicions,
  full scope.
- Final verdict is a single `PASS`/`FAIL` token with a numbered defect list. A PASS with open
  blockers or majors is not a PASS.
- **Issues and plans: 1 Opus reviewer** (`reviewer-issue`). Never a panel of issue-reviewers.
- **Code review, round 1: the PR reviewer plus the design-philosophy reviewer always gate, both
  must PASS — plus the architecture lens when the change adds a new component or makes a
  significant structural change.**
- **One-round stop rule:** minor and nit findings are fixed inline and shipped with no re-review;
  only a blocker or major finding triggers a re-check, scoped to that fix, with one fresh reviewer.
  No severity adjudicator, no reviewer panels.
- The security lens (`agents/reviewer-security.md`) is advisory — a finding from it is fixed,
  dropped, or deferred like any other finding.
- The architecture lens (`agents/reviewer-architecture.md`) is a gating reviewer: the orchestrator
  spawns it automatically at PR-review time whenever a change adds a new component or makes a
  significant structural change, and its blocker/major findings take the one-round stop rule — the
  same cadence as the design-philosophy gate. It remains additionally invocable on request for other
  cases; a finding raised that way is advisory.

Full protocol, including the review-dispatch checklist ("Which reviews does this change need?"), the
advisory-lens lifecycle, and finding disposition: `standards/adversarial-review-protocol.md`.

## Documentation split

Keep these separate (per `standards/documentation-standards.md`):

| File        | Contains                                               |
| ----------- | ------------------------------------------------------ |
| `README.md` | Getting started and reference for humans.              |
| `CLAUDE.md` | Behavioral rules for the agent operating in this repo. |
| `DESIGN.md` | Architecture decisions, rationale, tradeoffs.          |

Do not mix them. No FINAL / LAST / TRULY_FINAL in filenames or headers. No AI-slop filler —
the banned word list lives in one place, `standards/documentation-standards.md` § "Anti-AI-slop";
this file does not keep its own copy.

## Repo conventions

- **GitHub is the single source of truth** for tasks (issues) and docs. Status is canonical on the
  board.
- **GitHub CLI** is resolved lazily via `tools/gh.ps1`'s `Get-GhPath` — do not hard-code a path to
  `gh` anywhere.
- **PowerShell tooling.** Every tool in `tools/` and the `commit-msg` hook run under PowerShell —
  `powershell` on Windows, PowerShell 7 as `pwsh` on macOS/Linux. See `PROJECT-SETUP.md` for the
  one-time setup this requires.
- **Secrets and runtime state are gitignored:** `<FILL: this project's runtime-state directories,
e.g. data/, uploads/>` and `.env`. Never commit them.
- **Config is central.** Once this project has a config module, read paths and ports from it — do
  not hard-code a path or port elsewhere.
- **One working tree = one driver.** Any file-mutating agent or concurrent session operates in its
  own git worktree, created via `tools/new-agent-worktree.ps1 -Branch <name>` — never share the
  primary checkout with another running session. This is what stops concurrent sessions from
  stashing, reverting, or switch-branch-under-ing each other's uncommitted work.

## Dependency updates (Dependabot)

Dependabot PRs are classified into two tiers by `tools/classify-dep-pr.ps1`:

- **auto** — may merge on green CI with no separate review. Applies to: all GitHub Actions bumps;
  all npm dev-dependency bumps (any semver — a dev bump cannot break the running app, and CI catches
  a broken build); npm prod minor/patch bumps to non-critical packages.
- **review** — held for a tracked decision before merge. Applies to: any npm prod major bump; any
  bump (even patch or minor) to a critical prod dependency.

**Critical production dependencies** (a bad bump breaks a core user-facing path):
`<FILL: list this project's critical prod dependencies here, mirrored in
tools/classify-dep-pr-core.ps1's $CriticalProdDeps and in .github/dependabot.yml's exclude-patterns.
Empty until filled in.>`

**A dependency that ships a native binary needs an on-host smoke test before merge.** If any
critical dependency ships a prebuilt binary for its platform (a compiled addon, not pure
JavaScript), a `review`-tier bump to it should pass an on-host `npm ci` followed by a require/import
smoke check on the actual deployment OS before merge — not just green CI, since CI may run on a
different OS than production and cannot reproduce an OS-specific native-binary failure.

The authoritative tier logic lives in `tools/classify-dep-pr-core.ps1` (invoked via
`tools/classify-dep-pr.ps1`); the summary here is a human-readable restatement. The
critical-dependency list above is a hand-kept mirror of `tools/classify-dep-pr-core.ps1`'s
`$CriticalProdDeps` — no test drift-guards the two against each other, so a project filling this in
must update both by hand; see `PROJECT-SETUP.md` § "Fill in the blanks" item 4.

Run the classifier against a PR's metadata to determine its tier:

```powershell
powershell -File tools/classify-dep-pr.ps1 -Ecosystem npm -DepName <name> -SemverBump minor -DepType prod
```

Output is the single token `auto` or `review`, exit 0.

## Issue lifecycle marker

New issues are born carrying the `needs-issue-review` label (applied at `gh issue create` time). The
label is cleared after a PASS on the issue review, via `gh issue edit <N> --remove-label
needs-issue-review`.
