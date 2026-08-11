# PROJECT-SETUP.md

**As the owner of a repo just created from this template, I need one place that tells me what to run
once, what to fill in before the pipeline can run against real work, and what this extraction
deliberately left out**, so I don't discover any of the three by hitting a wall mid-build.

---

## One-time setup

Node 20+, git, and PowerShell (`powershell` on Windows, or PowerShell 7 as `pwsh` on macOS/Linux).
Every tool in `tools/` and the `commit-msg` hook run under PowerShell; without it the hook fails
closed and blocks every code commit.

1. Run `setup.ps1`. It arms the commit-msg hook (`core.hooksPath` → `.githooks`), creates the
   pipeline's GitHub labels (`tools/bootstrap-labels.ps1`), and prints gate status. If no GitHub CLI
   is found, label creation is skipped with a warning — install the CLI and re-run
   `tools/bootstrap-labels.ps1` afterward.
2. On macOS/Linux, change the three `"shell": "powershell"` values in `.claude/settings.json` to
   `"pwsh"` — this file deliberately has no `FILL:` marker of its own (it belongs here, in one-time
   setup, not in the checklist below) so a fresh Windows clone works with no edits at all, but the
   `SessionStart` hook that self-arms `core.hooksPath` cannot launch off Windows without this change.
3. On a **private** repo, drop `'Analyze (javascript)'` from `$requiredChecks` in
   `tools/apply-branch-protection.ps1` unless code scanning is enabled — `enforce_admins = $true`
   means a required check that never reports blocks every merge, including yours.
4. Run `tools/apply-branch-protection.ps1`. It requires a pull request, the checks named in
   `$requiredChecks`, and admin enforcement on `main`.

---

## Fill in the blanks

Every path below has at least one literal `FILL:` marker in the tree, checked mechanically by
`git grep --untracked -n 'FILL:' -- ':!PROJECT-SETUP.md'`. Work the list in order — later items
build on earlier ones (the North Star settles what everything else is judged against; the preview
command and visual surface are read by several other files that just need to agree with the value
you pick).

1. **North Star — `docs/north-star.md`, `CLAUDE.md`.** Fill in `docs/north-star.md`'s shift, end
   user, goals, and scope, then write the matching one-screen summary into `CLAUDE.md`'s North Star
   block. Nothing else in the pipeline has a goal to check work against until these are done.
2. **Preview-server command — `package.json`, `agents/orchestrator.md`, `.claude/commands/build.md`,
   `WHAT-IT-CHECKS.md`.** Set `package.json`'s `preview` script to the real command that boots this
   project on a scratch, seeded database and prints a `http://localhost:<port>` line — this is the
   single source of truth the visual-approval loop's phase 1 runs. The other three files quote the
   same value in prose (`` `<FILL: the project's preview-server command, e.g. npm run preview>` ``);
   update each to match once the real command exists.
3. **Visual surface — `tools/visual-surface.ps1`.** Set `$VISUAL_SURFACE_GLOBS` to this project's
   view/template/CSS/client-JS/asset directories. Until this is filled in, every visual-approval tool
   throws a terminating error naming the empty glob set instead of silently reporting "unchanged" —
   that's deliberate (see the file's own comment), not a bug to work around by leaving it blank.
4. **Critical production dependencies — `tools/classify-dep-pr-core.ps1`, `CLAUDE.md`,
   `.github/dependabot.yml`, `tests/classify-dep-pr.test.js`.** `tools/classify-dep-pr-core.ps1`'s
   `$CriticalProdDeps` is the single source of truth (currently `@()`); once it names real
   dependencies, mirror the same names into `CLAUDE.md`'s "Critical production dependencies" list and
   `.github/dependabot.yml`'s `prod-deps` group (re-add an `exclude-patterns` key naming them, removed
   for now since the list is empty). `tests/classify-dep-pr.test.js`'s `FILL:` is a code comment
   pointing at the same list — no edit needed there; its kept test cases are already independent of
   the list's contents.
5. **Doc-currency trigger surface — `agents/orchestrator.md`.** Its one `FILL:` marker (§ "Doc-currency
   step") names this project's core data/routing/service-layer source paths — the surface that, when
   touched by a diff, spawns the `doc-currency` step to check `DESIGN.md`/`README.md` against the change.
6. **Sonnet-tier eligibility gates — `standards/issue-standards.md`.** Gate (a) names any
   specially-gated or frozen surface this project defines in `CLAUDE.md` (if none, say so explicitly
   — do not leave the marker unresolved). Gate (b) names this project's critical-path list (auth,
   payment, data-destructive routes, or whatever applies here).
7. **Review-dispatch table and wave lived-data drill — `standards/adversarial-review-protocol.md`.**
   Name this project's visual/user-facing surface (should match item 3 above) and its core
   business-logic module in the § "Which reviews does this change need?" table, and name a concrete
   lived-data drill (boot a prior dataset, restore a backup, verify a key count) in § "Wave
   governance".
8. **Domain-model doc — `standards/documentation-standards.md`.** Name this project's domain-model
   glossary doc in the documentation-split table, if it has one — or state plainly that it doesn't yet.
9. **Session-brief epic pointer — `skills/session-brief.md`.** Name the GitHub issue number this
   project uses as its epic/roadmap issue, once one exists.
10. **Post-wave-review context — `.claude/commands/post-wave-review.md`.** Fill in the project
    description, two or three concrete cross-feature seams to check at a wave boundary, and the path
    to this project's load/performance baseline doc, once one exists.
11. **ESLint Node/browser split — `eslint.config.js`.** Once this project has application source code
    (e.g. `src/`), name the glob for its server-side (Node/CommonJS) files so the config's
    environment split matches the real tree.
12. **Vitest coverage config — `vitest.config.mjs`.** Once this project has instrumentable source,
    add a `coverage.include` and, if wanted, `coverage.thresholds` — the template ships neither, since
    there is nothing to instrument yet.
13. **Branch-protection strict mode — `tools/apply-branch-protection.ps1`.** Optional: the `FILL:`
    comment marks where to flip `strict` to `$true` (require branches up to date before merging) if
    this project wants that stricter semantics. The tool works correctly as shipped (`strict = $false`)
    with no edit required.
14. **LICENSE.** Fill in the copyright year and holder.
15. **`setup.ps1`.** No edit needed — its own `FILL:` is a reminder message pointing back at this
    checklist, not a blank of its own.
16. **`tests/visual-approval.test.js`.** No edit needed — both `FILL:` occurrences assert against
    `tools/visual-surface.ps1`'s own placeholder string (item 3 above); once that file is filled in,
    this test still passes because it is testing the throw-on-empty-glob behavior, not the specific
    placeholder text.
17. **In-license check — `standards/issue-standards.md` § "In-license check".** Name this project's
    out-of-scope dependency classes (an external/paid API, a non-Anthropic model key, a hosted
    third-party service — or state plainly that none are out of scope and any hosted service is
    allowed). Until this is filled in, an issue reviewer has a blocking rule with nothing configured
    to bound it.
18. **Runtime-state directories — `CLAUDE.md`, `.gitignore`.** `CLAUDE.md` § "Repo conventions" names
    this project's runtime-state directories (database, uploads, generated exports, local secrets)
    with a `FILL:` marker; the value must name the same directories `.gitignore` actually ignores
    (`data/` is the template's own placeholder pattern there) — the two must agree, since one is the
    stated rule and the other is the mechanism that enforces it.

---

## Deliberately omitted

This extraction drops the following from the origin project. Each is either wired to application code
this template does not ship, or specific to the origin project's own history. A path resolving to
nothing in this list, and not resolving on disk either, is a real gap — everything else is accounted
for here.

- **Deploy tooling** — `tools/deploy.sh`, `tools/check-deps-parity.ps1`, `.claude/commands/deploy.md`,
  `.github/workflows/deploy.yml` — the template ships no target host or hosting convention to deploy
  to, or to check dependency parity against.
- **`.claude/launch.json`** — local dev-server launch config wired to the origin app's own preview
  server; nothing to launch without application source code.
- **Mutation testing** — `.github/workflows/mutation.yml`, `stryker.conf.json` — dropped along with
  the source it mutated; there is no code for Stryker to plant bugs into yet.
- **`scripts/smoke.js`, `scripts/preview.js`** — smoke and preview scripts wired to the origin app's
  own server; the template ships no application source directory to smoke-test or preview against.
- **`config.js`** — the origin app's central config module; nothing to configure without application
  code.
- **`PLAN.md`, `CONTEXT.md`** — the origin project's own planning notes and domain-vocabulary
  glossary; project-specific by nature.
- **`docs/live-log.md`** — retargeted, not dropped: the autonomous timed run's per-increment ledger
  now writes to `BUILDLOG.md` instead (see that file's header for the line form).
- **`docs/architecture.md`, `docs/RESUME-STATE.md`, `docs/security/`, `docs/dependency-upgrade.md`,
  `docs/roadmap.md`, `docs/loadtest.md`, `docs/test-quality.md`** — origin-project docs recording a
  decision, plan, or dataset specific to an app that doesn't exist in this template.
- **`PLAN/`, `.stryker-tmp/`, `reports/`, `docs/design-system/Examples/`** — generated or scratch
  directories produced by the origin project's own tooling.
- **`docker-compose.override.yml`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`** —
  containerization for the origin app's own deployment; the template ships no `Dockerfile` to compose
  or override.
- **`.env.example`** — no environment variables to document without application code.
- **`skills-lock.json`** — an origin-project-specific lockfile for a skill inventory that doesn't
  apply here.
