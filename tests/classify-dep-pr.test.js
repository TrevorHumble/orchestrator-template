// tests/classify-dep-pr.test.js
// Vitest tests for classify-dep-pr.ps1: the auto/review tier precedence rules
// (github-actions bumps are always auto; dev-dependency bumps are always
// auto; a critical prod dependency is held even on a small bump; a
// non-critical prod major bump is held; everything else is auto).
// Windows PowerShell 5.1 is the launcher on win32; pwsh on other platforms.
'use strict';

const { execFileSync, spawnSync } = require('child_process');
const path = require('path');

const PS = process.platform === 'win32' ? 'powershell' : 'pwsh';

// One-time guard: if the launcher doesn't exist, skip all tests.
let launcherMissing = false;
try {
  execFileSync(PS, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'exit 0']);
} catch (e) {
  if (e.code === 'ENOENT') {
    launcherMissing = true;
  }
}

const SCRIPT = path.join(__dirname, '..', 'tools', 'classify-dep-pr.ps1');

function run(ecosystem, depName, semverBump, depType) {
  return spawnSync(
    PS,
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      SCRIPT,
      '-Ecosystem',
      ecosystem,
      '-DepName',
      depName,
      '-SemverBump',
      semverBump,
      '-DepType',
      depType,
    ],
    { encoding: 'utf8' }
  );
}

const maybeDescribe = launcherMissing
  ? describe.skip.bind(describe, `${PS} not found — skipping classify-dep-pr tests`)
  : describe;

// tools/classify-dep-pr-core.ps1 ships $CriticalProdDeps as an empty array (a
// FILL: marker for the consuming project to name its own critical prod
// dependencies). Every case below asserts a tier that holds regardless of
// that list's contents, so this suite is green on the template as shipped
// and stays correct once a project fills the list in.
maybeDescribe('classify-dep-pr', () => {
  it('github-actions / actions/checkout / major / prod -> auto, exit 0', () => {
    const r = run('github-actions', 'actions/checkout', 'major', 'prod');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('auto');
  });

  it('npm / eslint / major / dev -> auto, exit 0', () => {
    const r = run('npm', 'eslint', 'major', 'dev');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('auto');
  });

  // The empty-critical-list default: a non-critical prod patch bump is safe
  // to auto-merge.
  it('npm / lodash / patch / prod -> auto, exit 0', () => {
    const r = run('npm', 'lodash', 'patch', 'prod');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('auto');
  });

  // Mutation-coverage: a non-critical prod MAJOR bump is held on its own,
  // independent of $CriticalProdDeps -- isolates the major-bump branch (a
  // critical-list hit would short-circuit before ever reaching it).
  it('npm / express / major / prod -> review, exit 0', () => {
    const r = run('npm', 'express', 'major', 'prod');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('review');
  });

  // Mutation-coverage: dev precedence beats the critical-prod-dep check -- a
  // mutant that reordered "critical check before dev check" would pass every
  // other case here but fail this one.
  it('npm / globals / minor / dev -> auto, exit 0', () => {
    const r = run('npm', 'globals', 'minor', 'dev');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('auto');
  });
});
