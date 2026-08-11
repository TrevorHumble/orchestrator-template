# setup.ps1 — one-time setup for a fresh clone of this template. Arms the
# commit-msg gate, then bootstraps the pipeline's GitHub labels. This is the
# first command PROJECT-SETUP.md tells a consumer to run, so hook arming and
# the final gate-status print must complete even when the GitHub CLI is not
# yet installed -- a missing `gh` is a warned, skipped step, not a reason to
# abort setup.
#
# Windows PowerShell 5.1-compatible: no ternary, no ??, no &&, no ||.

$toolsDir = Join-Path $PSScriptRoot 'tools'

# Arm core.hooksPath. Dot-sourced (not re-implemented here) so this file and
# tools/setup-hooks.ps1 cannot silently disagree about how hooks get armed --
# tools/setup-hooks.ps1 stays the single owner of that git config call.
. (Join-Path $toolsDir 'setup-hooks.ps1')

# Bootstrap the pipeline's labels. tools/bootstrap-labels.ps1 (via
# tools/gh.ps1's Get-GhPath) throws when no GitHub CLI resolves; caught here
# and downgraded to a warning so a consumer who has not installed `gh` yet
# still gets a working commit-msg hook out of this run.
try {
  & (Join-Path $toolsDir 'bootstrap-labels.ps1')
  if ($LASTEXITCODE -ne 0) {
    Write-Output 'WARN: tools/bootstrap-labels.ps1 reported a failure -- some labels may be missing. Re-run it once resolved: powershell -File tools/bootstrap-labels.ps1'
  }
} catch {
  Write-Output "WARN: gh not found -- labels not created; run tools/bootstrap-labels.ps1 after installing the GitHub CLI ($($_.Exception.Message))"
}

Write-Output ''
Write-Output 'setup.ps1 done. Next: read PROJECT-SETUP.md and fill in every `FILL:` marker it lists, then open issue #1.'
