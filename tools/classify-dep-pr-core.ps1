# tools/classify-dep-pr-core.ps1 — shared tier-classification logic for
# Dependabot-shaped dependency bumps. Dot-source this file; do not run it
# directly (mirrors the -core.ps1 convention of tools/issue-core.ps1).
#
# Single source of truth for the auto/review precedence rules, reused by:
#   - tools/classify-dep-pr.ps1 (thin CLI: classifies one real Dependabot PR)
# See CLAUDE.md § "Dependency updates (Dependabot)" and DESIGN.md for the policy.
#
# Windows PowerShell 5.1-compatible: no ternary, no ??, no &&, no ||.

# Critical production dependencies — a bad bump breaks a core user-facing path.
# Single source of truth for this list: do not duplicate it elsewhere. Once
# filled in, mirror it in CLAUDE.md and re-add matching entries to
# .github/dependabot.yml's `prod-deps` group `exclude-patterns` (removed here
# until this list is non-empty; both are drift-guarded by
# tests/classify-dep-pr.test.js).
# FILL: list this project's critical prod dependencies here, e.g.
# @('example-orm', 'example-image-lib').
$CriticalProdDeps = @()

# Get-DepPrTier — classifies a single dependency bump into 'auto' or 'review'.
# Precedence (evaluated top-down, first match wins):
#   1. github-actions bumps -> auto
#   2. dev-dependency bumps -> auto (CI catches a broken build)
#   3. critical prod dep (any semver) -> review
#   4. prod major bump -> review
#   5. everything else -> auto
function Get-DepPrTier {
  param(
    [Parameter(Mandatory = $true)][ValidateSet('github-actions', 'npm')][string]$Ecosystem,
    [Parameter(Mandatory = $true)][string]$DepName,
    [Parameter(Mandatory = $true)][ValidateSet('patch', 'minor', 'major')][string]$SemverBump,
    [Parameter(Mandatory = $true)][ValidateSet('prod', 'dev')][string]$DepType
  )

  if ($Ecosystem -eq 'github-actions') {
    return 'auto'
  }
  if ($DepType -eq 'dev') {
    return 'auto'
  }
  if ($CriticalProdDeps -contains $DepName) {
    return 'review'
  }
  if ($SemverBump -eq 'major') {
    return 'review'
  }
  return 'auto'
}
