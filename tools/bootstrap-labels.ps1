# bootstrap-labels.ps1 — create the pipeline's GitHub labels in the current
# repo. A repository created from a GitHub template carries only GitHub's
# default label set, so the first `gh issue create --label needs-issue-review`
# (skills/github-write.md, agents/orchestrator.md) fails until these exist.
# Run once per repo (setup.ps1 runs it automatically); safe to re-run --
# `--force` makes every create idempotent (updates color/description on an
# existing label instead of erroring).
#
# Windows PowerShell 5.1-compatible: no ternary, no ??, no &&, no ||.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'gh.ps1')

$gh = Get-GhPath

# name | color (6-hex, no '#') | description
# The two tier labels (needs-issue-review, unverified-issue) are required
# because skills/github-write.md and agents/orchestrator.md both instruct
# agents to apply a tier label at issue-creation time.
$labels = @(
  @{ Name = 'needs-issue-review'; Color = 'fbca04'; Description = 'New issue awaiting adversarial issue review before implementation starts.' },
  @{ Name = 'unverified-issue'; Color = 'd93f0b'; Description = 'Opened outside the sanctioned issue flow -- missing needs-issue-review at creation.' },
  @{ Name = 'sonnet-only'; Color = '0e8a16'; Description = 'Issue reviewer awarded the Sonnet-tier exception: implementer and reviewers both run on Sonnet.' },
  @{ Name = 'spawned-in-run'; Color = 'c5def5'; Description = 'Issue filed by an agent mid-run rather than by the owner.' },
  @{ Name = 'ready'; Color = '0052cc'; Description = 'Issue reviewed and PASSed; ready to implement.' },
  @{ Name = 'backlog'; Color = 'bfd4f2'; Description = 'Not yet scheduled into a build.' },
  @{ Name = 'severity:blocker'; Color = 'b60205'; Description = 'Review finding that must block merge.' },
  @{ Name = 'severity:major'; Color = 'e99695'; Description = 'Review finding for crashes, data loss, or security -- see severity-label convention.' },
  @{ Name = 'severity:minor'; Color = 'fef2c0'; Description = 'Review finding fixed inline, no re-review required.' }
)

$failed = @()
foreach ($label in $labels) {
  & $gh label create $label.Name --color $label.Color --description $label.Description --force
  if ($LASTEXITCODE -ne 0) {
    $failed += $label.Name
  }
}

if ($failed.Count -gt 0) {
  [Console]::Error.WriteLine("bootstrap-labels: failed to create/update: $($failed -join ', ')")
  exit 1
}

Write-Output "bootstrap-labels: $($labels.Count) labels created/updated."
exit 0
