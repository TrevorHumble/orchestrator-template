# assert-worktree: fail-closed check that the current session is running inside a
# linked git worktree, not the shared primary checkout. Two file-mutating sessions
# sharing one working directory can stash, revert, or switch-branch under each
# other's uncommitted work. tools/new-agent-worktree.ps1 is the fix, but nothing in
# the pipeline asserted it was actually used; this script is that assertion. Pure
# check, no side effects -- mirrors the shape of tools/check-freshness.ps1.
#
# `git rev-parse --absolute-git-dir` returns a forward-slash path that ends in
# `/.git` in the primary checkout and contains `/worktrees/<name>` in a linked
# worktree (e.g. primary -> C:/your-repo/.git;
# linked -> C:/your-repo/.git/worktrees/<name>).
$gitDir = "$(& git rev-parse --absolute-git-dir 2>$null)".Trim()

if (-not $gitDir) {
  [Console]::Error.WriteLine('assert-worktree: not inside a git repo. Run: powershell -File tools/new-agent-worktree.ps1 -Branch <name>')
  exit 1
}

if ($gitDir -notmatch '/worktrees/') {
  [Console]::Error.WriteLine("assert-worktree: running in the primary checkout ($gitDir), not an isolated worktree. Create one and continue there: powershell -File tools/new-agent-worktree.ps1 -Branch <name>")
  exit 1
}

exit 0
