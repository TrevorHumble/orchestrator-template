// tests/ci-workflow.test.js
// Vitest tests for .github/workflows/ci.yml's trigger, concurrency, and
// runner-indirection shape (issue #4: CI billed every change twice and had
// no self-hosted-runner switch). package.json ships no YAML parser among its
// devDependencies, so these assertions read the workflow as raw text rather
// than parsing it. Same approach as tests/apply-branch-protection.test.js
// and tests/classify-dep-pr.test.js for their own PowerShell source.
'use strict';

const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '..', '.github', 'workflows', 'ci.yml');
// Normalized to LF throughout: the workflow file is checked in with CRLF,
// and every pattern below matches against bare \n.
const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8').replace(/\r\n/g, '\n');

// Isolate the `on:` trigger block so a `push:` under some unrelated key
// (there is none today, but the isolation keeps the test honest) can't
// produce a false pass.
function triggerBlock(text) {
  // Runs from `on:` up to the next top-level (unindented) key.
  const match = text.match(/\non:\n([\s\S]*?)\n(?=\S)/);
  if (!match) {
    throw new Error('could not find an `on:` trigger block in ci.yml');
  }
  return match[1];
}

describe('ci.yml trigger set', () => {
  const on = triggerBlock(workflow);

  it('restricts push to the default branch only', () => {
    // A bare `push:` with no `branches:`/`branches-ignore:` filter runs on
    // every branch. That is the exact defect AC1 closes, so assert the
    // filter names main specifically rather than merely existing.
    expect(on).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
  });

  it('does not reintroduce an unrestricted push (no branches-ignore filter)', () => {
    // branches-ignore permits every branch except the named pattern, which
    // is the shape that caused the double-run in the first place.
    expect(on).not.toMatch(/branches-ignore/);
  });

  it('still triggers on pull_request', () => {
    expect(on).toMatch(/\n\s*pull_request:/);
  });

  it('still triggers on merge_group', () => {
    expect(on).toMatch(/\n\s*merge_group:/);
  });
});

describe('ci.yml concurrency block', () => {
  it('declares a concurrency block', () => {
    expect(workflow).toMatch(/\nconcurrency:\n/);
  });

  it('cancels in-progress runs within a group', () => {
    expect(workflow).toMatch(/cancel-in-progress:\s*true/);
  });

  it('groups pull_request runs by PR number so a second push cancels the first (AC2)', () => {
    // Why the number and not the branch name: DESIGN.md, "When CI runs, and
    // on whose hardware".
    expect(workflow).toMatch(
      /github\.event_name == 'pull_request' && github\.event\.pull_request\.number/
    );
  });

  it('folds a per-run unique value into non-pull_request groups so default-branch and merge-queue runs never share a group (AC4, AC5)', () => {
    // Without this fallback those runs share one group and either cancel or
    // queue behind each other.
    expect(workflow).toMatch(/github\.event\.pull_request\.number \|\| github\.run_id/);
  });
});

describe('ci.yml runner indirection', () => {
  it('resolves runs-on from the CI_RUNNER repository variable with an ubuntu-latest fallback', () => {
    const matches =
      workflow.match(/runs-on:\s*\$\{\{\s*vars\.CI_RUNNER\s*\|\|\s*'ubuntu-latest'\s*\}\}/g) || [];
    expect(matches.length).toBeGreaterThan(0);
  });

  it('does not re-pin a literal runner label in place of the variable indirection', () => {
    // A bare `runs-on: ubuntu-latest` (no vars.CI_RUNNER fallback wrapper) is
    // exactly the regression AC3/AC8 guard against. Every runs-on line must
    // go through the variable.
    const runsOnLines = workflow.match(/^\s*runs-on:.*$/gm) || [];
    expect(runsOnLines.length).toBeGreaterThan(0);
    for (const line of runsOnLines) {
      expect(line).toMatch(/vars\.CI_RUNNER/);
    }
  });
});
