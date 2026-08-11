# orchestrator-template

Clone-and-go AI agent governance: an issue-to-PR pipeline, an adversarial reviewer bar, and the
enforcement hooks, ready to use in a new project.

Node 20+, git, and PowerShell (`powershell` on Windows, or PowerShell 7 as `pwsh` on macOS/Linux) are
required — every tool in `tools/` and the `commit-msg` hook run under PowerShell; without it the hook
fails closed and blocks every code commit.

## What this is

A GitHub template repository carrying a working AI-agent development pipeline: file an issue,
have it adversarially reviewed before any code is written, implement it, have the implementation
adversarially reviewed against the issue, then merge on a green build. The reviewers are a different,
non-weaker AI model than whoever wrote the change, so they do not inherit its blind spots. The rules
governing all of this live in `CLAUDE.md`; the reasoning behind why the pipeline is shaped this way
lives in `DESIGN.md`.

This repo ships the pipeline itself — agents, standards, skills, tools, CI, and the doc stubs — and
no application code. `npm ci`, `npm test`, `npm run test:coverage`, `npm run lint`, and `npm run
format:check` all pass on a fresh clone before you add a single line of your own.

## Getting started

1. Create your own repository from this template (GitHub's "Use this template" button, or `gh repo
create <name> --template <this-repo> ...`).
2. Follow `PROJECT-SETUP.md` § "One-time setup" — arms the commit-msg hook, creates the pipeline's
   GitHub labels, and locks down branch protection on `main`.
3. Follow `PROJECT-SETUP.md` § "Fill in the blanks" — every placeholder marker in the tree needs a
   real answer for your project before the pipeline can run against real work. `docs/north-star.md`
   and `CLAUDE.md`'s North Star block come first: nothing else in the pipeline has a goal to check
   work against until those are filled in.
4. Open your first issue per `standards/issue-standards.md`, and run it through the pipeline
   described in `CLAUDE.md` § "How work flows".

## Reference

| File                    | What it's for                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `CLAUDE.md`             | The operating contract — rules every agent working in this repo follows.                                                       |
| `DESIGN.md`             | Architecture decisions and the rationale behind the pipeline's shape.                                                          |
| `PROJECT-SETUP.md`      | One-time setup, the placeholder checklist, and what this template deliberately left out.                                       |
| `definition-of-done.md` | The checklist a PR reviewer applies alongside an issue's acceptance criteria.                                                  |
| `WHAT-IT-CHECKS.md`     | Plain-language explanation of what a green build actually proves — and what it doesn't.                                        |
| `BUILDLOG.md`           | Reverse-chronological record of merged work.                                                                                   |
| `agents/`               | The orchestrator and every reviewer/implementer agent definition.                                                              |
| `standards/`            | The checkable standards every review is judged against.                                                                        |
| `skills/`               | Reusable procedures the agents invoke (issue creation, GitHub writes, and so on).                                              |
| `tools/`                | PowerShell scripts the pipeline runs (branch protection, dependency classification, visual-approval hashing, label bootstrap). |
