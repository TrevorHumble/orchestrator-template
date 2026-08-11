# setup-hooks: activate the repo's committed git hooks. core.hooksPath is local
# config (not carried by a clone), so this must run once per working copy. A
# fresh clone runs it before its first commit (setup.ps1 dot-sources this file
# rather than re-implementing the git config call).
$top = (& git rev-parse --show-toplevel 2>$null)
if (-not $top) { Write-Error 'setup-hooks: not inside a git repo'; exit 1 }
& git config core.hooksPath .githooks
Write-Output "core.hooksPath -> .githooks (commit-msg issue-reference hook active)"
