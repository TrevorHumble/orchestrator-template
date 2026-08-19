# DESIGN.md — Architecture decisions and rationale

Why the pipeline is built the way it is. Decisions and tradeoffs, not getting-started instructions
(those are in `README.md`/`PROJECT-SETUP.md`) and not agent rules (those are in `CLAUDE.md`).

This file records **Architecture Decision Records (ADRs)** — one section per decision, in the order
they were made, oldest first. Each ADR states what was decided, why, and what it trades away. An ADR
is never deleted when superseded; a later ADR says so and points back to it, so the history of
"why we changed our mind" stays legible.

**Format.** `## ADR: <title>`, then **Status:** (`accepted`, `superseded by <ADR>`,
`accepted, owner-authorized` for a change to governing machinery, or
`accepted, inherited from the template's origin project` for an ADR ported in wholesale from the
project this template was extracted from), then prose. Cite real evidence for any claim about how the
pipeline has behaved — a specific run, a specific failure — not a general assertion that something
"works well" or "is a best practice." That evidence rule binds every ADR written in this project going
forward; an inherited ADR's evidence lived in the origin project's own run history, which this
extraction does not carry forward, so the four inherited ADRs below argue from the origin project's
general experience rather than a citable run here — that is the inherited status, not a violation of
this rule.

Add new ADRs at the bottom, in the order they were made. Once a project has its own application
source tree (e.g. `src/`), its architecture ADRs (schema choices, framework choices, data-model
decisions) belong here too, alongside the pipeline ADRs below.

---

## ADR: One-round stop rule for review findings

**Status:** accepted, inherited from the template's origin project.

**Decision.** Round 1 of code review runs the PR reviewer and the design-philosophy reviewer
together. A minor or nit finding is fixed inline and ships with no re-review. A blocker or major
finding triggers exactly one re-check, scoped to the fix, with one fresh reviewer confirming the fix
— not a full re-review of the whole artifact again. There is no severity adjudicator, no
concede/contest fork, and no round-count soft cap.

**Why not review to convergence.** An earlier version of this pipeline let review continue for as
many rounds as a reviewer kept finding something. In practice this produced two failure modes: a
review round could introduce the next round's defect (a fix for finding A creates finding B, which a
fresh reviewer then finds, whose fix creates finding C), and there was no floor under how long a
segment could stay in review limbo — "one more round" is always locally justifiable, so nothing
stopped the loop from running indefinitely on marginal, non-blocking findings. The one-round rule
puts a hard bound on cost: at most one extra round, and only for findings serious enough to justify
it (blocker/major). A genuine impasse — two full re-review rounds on the same blocker/major finding
without reaching PASS — halts the segment rather than looping a third time; the work is not merged,
and it is logged for the owner or a fresh pass to pick up, rather than silently retried forever.

**What this trades away.** A minor finding that would have been caught by a second look never gets
that second look — it ships fixed-but-unverified. This is a deliberate bet: the cost of a marginal
finding slipping through once is smaller than the cost of every review becoming open-ended, and
severity labels already separate "must not ship" (blocker/major) from "nice, not required"
(minor/nit) — see `standards/adversarial-review-protocol.md` § "One-round stop rule" for the full
rule and § "Finding disposition" for how a finding is fixed, dropped, or deferred.

---

## ADR: No human in the merge loop for non-visual changes

**Status:** accepted, inherited from the template's origin project.

**Decision.** A non-visual change (a bug fix, a backend feature, an under-the-hood refactor) merges
once adversarial review has passed and CI is green — the owner does not read a diff and click
approve. Owner control over that class of change is upstream (which work gets specced, via issues)
and downstream (revert, via git history), not a pre-merge checkpoint.

**Why.** The whole point of an adversarial-review pipeline is that the review IS the quality gate —
a human "sanity check" on top of it either duplicates work the reviewers already did (if the human
actually reads the diff, which does not scale past a handful of PRs a day) or is theater (a rubber
stamp that adds latency without adding scrutiny). Every control a human merge-gate would provide —
"does this actually do what the issue asked," "is this well-built," "does it follow the standards" —
is already the adversarial reviewers' mandate, and unlike a single human skim, they run to a written,
checkable standard (`standards/adversarial-review-protocol.md`) every time. Putting a person back in
that loop does not add a control that is currently missing; it adds a queue.

**The deliberate exception.** Product taste — "does this look right," "is this the experience I
want" — is not something an adversarial reviewer can judge, because it has no ground truth to check
against; two different reasonable answers can both be defensible. That one category of judgment is
reserved for the owner, and it is not smuggled into the merge gate as a diff-reading step — it is
pulled forward into its own pre-implementation loop. See the visual-approval-loop ADR below.

**What this trades away.** The owner never sees a change before it is live, for the entire
non-visual class of work — a mis-specified issue that both the implementer and the reviewers missed
ships to production before anyone human notices. This is accepted because it is symmetric with any
software team that trusts its own review process, and because the downstream control (revert) is
real and cheap: `standards/adversarial-review-protocol.md` § "No human in the loop" states the
translation rule this ADR follows — turn every "owner reviews/approves" control into a deterministic
check or an independent adversary, and reserve human judgment for what a human can actually judge.

---

## ADR: Visual-approval loop — taste is settled live, before it is written down

**Status:** accepted, inherited from the template's origin project.

**Decision.** A change that touches the visual surface (`tools/visual-surface.ps1` — views,
templates, CSS, client JS, rendered assets, user-facing copy) runs a **phase 1** before an issue's
acceptance criteria are even written: the orchestrator boots the app on a seeded preview, hands the
owner a localhost link, and edits the real front end directly against it — nothing commits — while
the owner refreshes and says what to change, until they say **approved**. Only then is the approval
frozen (`tools/persist-visual-approval.ps1` hashes the visual surface), the now-settled look is
transcribed into acceptance criteria, and the change runs the normal issue-review /
implementation / adversarial-review pipeline like anything else. Full mechanics, including the "two
doors" rule for a phase-2 conflict with the approved look: `agents/orchestrator.md` §
"Visual-approval loop".

**Why taste cannot be specified up front.** Nobody can write "no clutter" as an acceptance criterion
and have it mean anything checkable — clutter is recognized by looking, not derived from a written
rule. An issue drafted before anyone has seen the screen either guesses at the look (and is usually
wrong, so the first implementation gets rejected and redone) or hedges with vague criteria a reviewer
cannot actually check ("the design should feel clean"). Settling the look first, live, against a real
running instance, replaces guessing with seeing: "arrows are clutter" takes five seconds to say and
two lines to fix, in a medium (a rendered page) where the owner's judgment is actually reliable.

**Why phase 1 is a fence, not just a fast path.** Before approval, only the visual surface may be
edited — no routes, no services, no tests, even though the preview needs data to render. Faked data
in the view is enough to settle a look; writing real production logic during phase 1 would mean
building something before its criteria exist, defeating the reason phase 1 runs first. The fence also
keeps phase 1 outside the review pipeline entirely: nothing commits, so there is nothing for a
reviewer to review yet, and no criteria exist yet for one to review against.

**Why this is an exception to "no human in the loop," alongside two narrower, recorded ones.** The
adjacent ADR above keeps the owner out of ordinary merge decisions because adversarial review is a
better and more scalable quality gate than a human diff-read. Taste is different in kind: it has no
ground truth an adversary can check against, so pulling it out of the reviewer's mandate and into an
explicit, bounded, pre-implementation loop is not a concession — it is putting the judgment where it
actually belongs, without reopening the door to a human reading diffs for everything else. It is the
only exception of that _kind_ — a pre-implementation loop that replaces review entirely — but it is
not the only recorded control that reserves a decision to the owner: `standards/issue-standards.md`
§ "Definition of Done ownership" requires owner approval before a `definition-of-done.md` change
merges, since that file is what every future PR review is judged against, and § "Acceptance-criteria
amendment" requires owner approval plus one reviewer before a mid-flight change to an issue's
criteria becomes the new contract. Both are narrower than the visual-approval loop — they gate one
specific document each, recorded and tamper-evident rather than tamper-proof on a solo-maintainer
repo — and neither reopens human diff-reading for ordinary merges.

**What this trades away.** A visual change has a slower path to first-issue-drafted than a
non-visual one — the owner has to be present, live, for phase 1. This is accepted because the
alternative (writing visual criteria blind and iterating through the full review pipeline each
correction) is slower in practice, not faster, and produces a worse result: a written spec for
something nobody has seen is a guess, and guesses about taste are usually wrong.

---

## ADR: Hook minimalism — one local hook, not a wall of them

**Status:** accepted, inherited from the template's origin project.

**Decision.** The only local git hook this pipeline installs is `.githooks/commit-msg`: it blocks a
commit that changes a non-`.md` file and names no GitHub issue (`(#N)`, a closing keyword, or an
`issue-N`-shaped branch). There is no pre-commit hook running lint or tests, no pre-push hook
re-running the suite, and no local hook trying to verify that a review actually happened.

**Why not enforce more locally.** A local hook only runs on a machine that has it installed and
armed (`core.hooksPath` pointed at `.githooks/`, done by `tools/setup-hooks.ps1`) and can always be
bypassed with `--no-verify`. Anything that must actually hold — lint passing, tests passing, a real
review having occurred — has to be enforced somewhere a bypass doesn't work: CI, which runs
regardless of what any individual machine or session did locally. Duplicating those checks into a
local hook adds latency and a second place for the rule to drift from the CI version, for a
guarantee CI already provides unconditionally. `commit-msg` survives that filter because it checks
something CI cannot cheaply reconstruct after the fact — which issue a change was for — and because
its failure mode (a commit with no issue reference) is cheap and fast to check with no I/O.

**Why the commit-msg hook itself does not try to verify review happened.** An earlier version of
this pipeline experimented with a hook that tried to mechanically confirm a review evidence artifact
existed before allowing a commit. That machinery became a maintenance burden in its own right — a
second system whose own bugs needed fixing — for a guarantee it could not actually deliver: a
recorded "review passed" artifact proves a review was recorded, not that reviewing occurred, or
occurred rigorously. The bypass caveat is stated in the hook's own header
(`.githooks/commit-msg`: "No review evidence is checked here... `--no-verify` bypasses it; CI is the
backstop.") rather than hidden, so a reader is never given false confidence about what the one local
gate actually holds.

**What this trades away.** A developer who forgets to run lint or tests locally finds out from CI,
not from a local hook — slower feedback, by one push-and-wait cycle, than a pre-commit hook would
give. This is accepted because CI feedback within a few minutes is cheap relative to the maintenance
cost and false confidence of a second, bypassable, locally-drifting copy of the same checks.

## When CI runs, and on whose hardware

**Decision.** The CI workflow runs on a push to the default branch, on every pull request, and on
every merge-queue entry, and no longer on a push to any other branch. Pull-request runs for one pull
request share a concurrency group keyed on the pull-request number, so a newer push cancels an older
run. Every other event folds a per-run unique value into the group key, so those runs sit alone.
Each job's runner label resolves from a `CI_RUNNER` repository variable with `ubuntu-latest` as the
literal fallback.

**Why the trigger narrowed.** The workflow previously fired on both `push` and `pull_request`, so a
branch that was pushed and then opened as a pull request ran the whole job set twice for one commit.
Public repositories get Actions minutes free, which hid the waste; a private one bills per
machine-minute, and the duplication doubled the bill on every change. The merge gate is unaffected:
`pull_request` still runs on every pull request, and branch protection still requires those checks.
What is genuinely given up is a run for a commit pushed to a branch with no pull request open yet.
That commit is checked as soon as the pull request exists.

**Why the concurrency key is the pull-request number rather than the branch name.** Two open pull
requests from different forks can carry the same head-branch name; `patch-1` is GitHub's own default
for an edit made in the web UI. Keying the group on the branch name would put those unrelated pull
requests in one group, and cancelling in progress would then cancel a stranger's required checks,
leaving that pull request unmergeable with no event left to re-trigger CI. The pull-request number
is unique per pull request and still equal across successive pushes to the same one, which is the
behavior the cancellation is for.

**Why non-pull-request runs each get their own group rather than an exemption from cancellation.**
Setting `cancel-in-progress` false for those events would leave them in one shared group, which
stops the cancelling but starts them queueing behind one another. Folding a per-run unique value
into the group key gives each run a group of its own, so it is neither cancelled nor serialized.

**What this trades away.** A downstream project that enables GitHub's merge queue still gets two
runs for a queued commit: one for the `merge_group` event, and one for the `push` after it
fast-forwards onto the default branch. That pair is accepted here. The template configures no merge
queue, and the second run is the record of what actually shipped.

**Why the runner is a variable rather than a hard-coded label.** A project that would rather spend
its own hardware than GitHub's minutes should not have to edit each job. GitHub does not expose the
`env` context to `runs-on`, so a repository variable with a literal fallback is the mechanism that
fits. The fallback matters more than the switch: an unconfigured downstream repository behaves
exactly as it did before. The security precondition is stated where the variable is set,
`PROJECT-SETUP.md` item 19, because a self-hosted runner on a public repository executes a fork's
pull request on the runner host.
