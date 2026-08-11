// tests/visual-approval.test.js
// Vitest tests for the visual-approval freeze: tools/visual-surface.ps1,
// tools/persist-visual-approval.ps1, tools/check-visual-approval.ps1.
// Windows PowerShell 5.1 is the launcher on win32; pwsh on other platforms --
// same launcher-detection pattern as tests/classify-dep-pr.test.js.
//
// The template ships tools/visual-surface.ps1's $VISUAL_SURFACE_GLOBS behind
// a FILL: placeholder that matches zero git-tracked files on purpose (see
// that file's header) -- Get-VisualSurfaceFiles throws a terminating error
// naming the glob set rather than silently hashing the empty string. That
// means most of this suite cannot exercise the real persist/check lifecycle
// against this repo's own tree: every behavioral case below except the
// record-missing case and the empty-glob case builds a disposable fixture
// git repo, copies the three visual-approval tools into it, and rewrites the
// fixture copy's glob line to point at the fixture's own tracked directory.
'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PS = process.platform === 'win32' ? 'powershell' : 'pwsh';

let launcherMissing = false;
try {
  execFileSync(PS, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'exit 0']);
} catch (e) {
  if (e.code === 'ENOENT') {
    launcherMissing = true;
  }
}

const REPO_ROOT = path.join(__dirname, '..');
const VISUAL_SURFACE_SCRIPT = path.join(REPO_ROOT, 'tools', 'visual-surface.ps1');
const CHECK_SCRIPT = path.join(REPO_ROOT, 'tools', 'check-visual-approval.ps1');

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}:\n${r.stderr}`);
  }
  return r.stdout;
}

function writeFile(dir, rel, content) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function runPs(scriptPath, args, cwd) {
  return spawnSync(
    PS,
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath].concat(args || []),
    { cwd: cwd || REPO_ROOT, encoding: 'utf8' }
  );
}

// APPROVAL_PATH is derived by calling tools/visual-surface.ps1's own
// Get-VisualApprovalRecordPath function rather than re-typing the literal
// here a second time -- that function is the single owner of the record
// path. Safe to call even though $VISUAL_SURFACE_GLOBS throws on this repo:
// the throw lives inside Get-VisualSurfaceFiles, never on dot-source or on
// Get-VisualApprovalRecordPath.
const APPROVAL_PATH = launcherMissing
  ? path.join(REPO_ROOT, '.review_state', 'visual-approval', 'approval.json')
  : (() => {
      const res = spawnSync(
        PS,
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          `. '${VISUAL_SURFACE_SCRIPT}'; Get-VisualApprovalRecordPath -RepoRoot '${REPO_ROOT}'`,
        ],
        { cwd: REPO_ROOT, encoding: 'utf8' }
      );
      return res.stdout.trim();
    })();

// Builds a disposable git repo carrying its own copies of the three
// visual-approval tools, with $VISUAL_SURFACE_GLOBS rewritten to match a
// 'views' directory inside the fixture -- so persist/check can run their
// real lifecycle without ever touching this repo's own throwing globs.
function makeFixtureRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-approval-fixture-'));
  git(dir, ['init', '-q']);
  git(dir, ['config', 'user.name', 'test']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  writeFile(dir, 'views/index.html', '<p>hello</p>\n');
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'seed']);

  const fixtureToolsDir = path.join(dir, 'tools');
  fs.mkdirSync(fixtureToolsDir, { recursive: true });
  for (const name of [
    'visual-surface.ps1',
    'persist-visual-approval.ps1',
    'check-visual-approval.ps1',
  ]) {
    fs.copyFileSync(path.join(REPO_ROOT, 'tools', name), path.join(fixtureToolsDir, name));
  }

  const surfacePath = path.join(fixtureToolsDir, 'visual-surface.ps1');
  const src = fs.readFileSync(surfacePath, 'utf8');
  const rewritten = src.replace(
    /\$VISUAL_SURFACE_GLOBS\s*=\s*@\([^)]*\)/,
    "$VISUAL_SURFACE_GLOBS = @('views')"
  );
  if (rewritten === src) {
    throw new Error(
      'fixture setup: failed to rewrite $VISUAL_SURFACE_GLOBS in the fixture copy of visual-surface.ps1'
    );
  }
  fs.writeFileSync(surfacePath, rewritten);

  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'add visual-approval tools']);

  return {
    dir,
    persistScript: path.join(fixtureToolsDir, 'persist-visual-approval.ps1'),
    checkScript: path.join(fixtureToolsDir, 'check-visual-approval.ps1'),
  };
}

const maybeDescribe = launcherMissing
  ? describe.skip.bind(describe, `${PS} not found — skipping visual-approval tests`)
  : describe;

maybeDescribe('check-visual-approval against this repo (no fixture needed)', () => {
  let savedApprovalBytes = null;
  let hadApprovalFile = false;

  beforeEach(() => {
    // This suite writes real evidence into the (gitignored) .review_state/
    // tree of THIS worktree -- save/restore whatever was there before so a
    // real in-flight approval in this worktree is never clobbered.
    hadApprovalFile = fs.existsSync(APPROVAL_PATH);
    if (hadApprovalFile) {
      savedApprovalBytes = fs.readFileSync(APPROVAL_PATH);
    }
  });

  afterEach(() => {
    if (hadApprovalFile) {
      fs.mkdirSync(path.dirname(APPROVAL_PATH), { recursive: true });
      fs.writeFileSync(APPROVAL_PATH, savedApprovalBytes);
    } else if (fs.existsSync(APPROVAL_PATH)) {
      fs.rmSync(APPROVAL_PATH);
    }
  });

  it('exits non-zero when no approval has been recorded', () => {
    if (fs.existsSync(APPROVAL_PATH)) fs.rmSync(APPROVAL_PATH);
    const res = runPs(CHECK_SCRIPT);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('no recorded approval');
  });

  // Criterion: a checkout carrying a recorded approval whose
  // $VISUAL_SURFACE_GLOBS matches zero git-tracked files must exit non-zero
  // and NAME the glob set, rather than reporting the surface unchanged. A
  // record is written directly here (not via persist-visual-approval.ps1,
  // which would itself throw on this same empty-glob set before ever
  // writing) so check-visual-approval.ps1 is the thing that reaches the
  // throwing helper.
  it('throws naming the glob set when $VISUAL_SURFACE_GLOBS matches zero git-tracked files', () => {
    fs.mkdirSync(path.dirname(APPROVAL_PATH), { recursive: true });
    fs.writeFileSync(
      APPROVAL_PATH,
      JSON.stringify({
        schema: 'va1',
        surface_hash: 'placeholder',
        approver: 'test-suite',
        ts: new Date().toISOString(),
        files: {},
      })
    );

    const res = runPs(CHECK_SCRIPT);
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('matched zero git-tracked files');
    expect(res.stderr).toContain('FILL:');
  });
});

maybeDescribe('visual-approval lifecycle (fixture repo)', () => {
  let fixture;

  beforeEach(() => {
    fixture = makeFixtureRepo();
  });

  afterEach(() => {
    fs.rmSync(fixture.dir, { recursive: true, force: true });
  });

  it('persist then check: exits 0 when nothing has changed since approval', () => {
    const persistRes = runPs(fixture.persistScript, ['-Approver', 'test-suite'], fixture.dir);
    expect(persistRes.status).toBe(0);

    const checkRes = runPs(fixture.checkScript, [], fixture.dir);
    expect(checkRes.status).toBe(0);
    expect(checkRes.stdout).toContain('OK');
  });

  it('the approval record lives outside the hashed visual surface', () => {
    const persistRes = runPs(fixture.persistScript, ['-Approver', 'test-suite'], fixture.dir);
    expect(persistRes.status).toBe(0);

    const recordPath = path.join(fixture.dir, '.review_state', 'visual-approval', 'approval.json');
    expect(fs.existsSync(recordPath)).toBe(true);

    const relRecordPath = path.relative(fixture.dir, recordPath).split(path.sep).join('/');
    expect(relRecordPath.startsWith('views/')).toBe(false);
    expect(relRecordPath.startsWith('.review_state/')).toBe(true);
  });

  it('names the added file and exits non-zero after a new file lands in the visual surface', () => {
    const persistRes = runPs(fixture.persistScript, ['-Approver', 'test-suite'], fixture.dir);
    expect(persistRes.status).toBe(0);

    // check-visual-approval.ps1 reads via `git ls-files`, which lists the
    // index -- staging (git add) is enough, a commit is not required.
    writeFile(fixture.dir, 'views/probe.html', '<p>probe</p>\n');
    git(fixture.dir, ['add', 'views/probe.html']);

    const checkRes = runPs(fixture.checkScript, [], fixture.dir);
    expect(checkRes.status).not.toBe(0);
    expect(checkRes.stderr).toContain('added: views/probe.html');

    // Recovery: once the added file is recorded as approved too, the check
    // passes again against the same lineage.
    const repersistRes = runPs(fixture.persistScript, ['-Approver', 'test-suite'], fixture.dir);
    expect(repersistRes.status).toBe(0);
    const recheckRes = runPs(fixture.checkScript, [], fixture.dir);
    expect(recheckRes.status).toBe(0);
  });
});
