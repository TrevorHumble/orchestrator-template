# visual-surface.ps1 — the single definition of the "visual surface" glob set,
# plus a hash of the sorted content of every git-tracked file that matches it.
# Dot-source this file; do not run it directly.
#
# Mirrors the "views/CSS/asset/user-facing copy" row of
# standards/adversarial-review-protocol.md § "Which reviews does this change
# need?" — the same visual-change surface agents/orchestrator.md § "Visual-
# approval loop" triggers on. tests/visual-approval.test.js drift-guards this
# file's glob list against that row so the two definitions cannot silently
# diverge.
#
# Windows PowerShell 5.1-compatible: no ternary, no ??, no &&, no ||.

# FILL: the project view/CSS/asset directories, e.g. src/views, src/public.
# Directory-level entries are enough: git ls-files already lists every file
# under a directory pathspec recursively, so a directory pathspec matches the
# whole tree under it without a '**' glob.
$VISUAL_SURFACE_GLOBS = @('FILL: the project view/CSS/asset directories, e.g. src/views, src/public')

# Get-VisualSurfaceFiles — every git-TRACKED file under $VISUAL_SURFACE_GLOBS,
# sorted for a deterministic hash order. Tracked-only (via `git ls-files`) so
# an untracked scratch/editor-temp file can never perturb the freeze.
#
# Throws a terminating error, naming the glob set, when it matches ZERO
# git-tracked files. This is deliberate and load-bearing: an empty match set
# would make Get-VisualSurfaceHash hash the empty string on both the persist
# side and the check side, so an approval recorded against nothing would
# silently report every future edit as "unchanged" -- a gate that passes
# loudest when it is protecting nothing. The throw lives HERE, inside this
# function, so it fires for both callers (tools/persist-visual-approval.ps1
# and tools/check-visual-approval.ps1) regardless of whether an approval
# record already exists. Until $VISUAL_SURFACE_GLOBS above is filled in with
# real paths, every visual-approval tool throws on purpose.
function Get-VisualSurfaceFiles {
  param([Parameter(Mandatory = $true)][string]$RepoRoot)

  $prevLoc = Get-Location
  try {
    Set-Location $RepoRoot
    $tracked = @(& git ls-files -- $VISUAL_SURFACE_GLOBS)
  } finally {
    Set-Location $prevLoc
  }

  if (@($tracked).Count -eq 0) {
    throw ("Get-VisualSurfaceFiles: glob set matched zero git-tracked files: " +
      ($VISUAL_SURFACE_GLOBS -join ', ') +
      " -- fill in `$VISUAL_SURFACE_GLOBS in tools/visual-surface.ps1 with " +
      "this project's real view/CSS/asset directories before using the " +
      "visual-approval tools.")
  }

  return @($tracked | Sort-Object)
}

# Get-VisualSurfaceFileHashes — [pscustomobject]@{Path; Hash} for every file
# Get-VisualSurfaceFiles returns, SHA256 over each file's raw bytes. Returned
# sorted by Path (Get-VisualSurfaceFiles already sorts, but re-asserted here
# so this function's contract does not depend on the caller's).
function Get-VisualSurfaceFileHashes {
  param([Parameter(Mandatory = $true)][string]$RepoRoot)

  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $files = Get-VisualSurfaceFiles -RepoRoot $RepoRoot | Sort-Object
    $result = @()
    foreach ($f in $files) {
      $full = Join-Path $RepoRoot $f
      $bytes = [IO.File]::ReadAllBytes($full)
      $hashBytes = $sha.ComputeHash($bytes)
      $hex = ([BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
      $result += [pscustomobject]@{ Path = $f; Hash = $hex }
    }
    return $result
  } finally {
    $sha.Dispose()
  }
}

# Get-VisualSurfaceHash — one combined SHA256 token over the sorted
# {path,hash} pairs Get-VisualSurfaceFileHashes returns. Any content change,
# addition, removal, or rename inside the visual surface changes this token.
function Get-VisualSurfaceHash {
  param([Parameter(Mandatory = $true)][string]$RepoRoot)

  $pairs = Get-VisualSurfaceFileHashes -RepoRoot $RepoRoot
  $sb = New-Object System.Text.StringBuilder
  foreach ($p in $pairs) {
    [void]$sb.Append("$($p.Path)=$($p.Hash)`n")
  }

  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $combinedBytes = [Text.Encoding]::UTF8.GetBytes($sb.ToString())
    $hashBytes = $sha.ComputeHash($combinedBytes)
    return ([BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

# Get-VisualApprovalRecordPath — the one authoritative path to the
# visual-approval evidence record. Lives outside $VISUAL_SURFACE_GLOBS so
# writing the record can never itself perturb the hash it just recorded.
# tools/persist-visual-approval.ps1 (writer) and tools/check-visual-approval.ps1
# (reader) both call this instead of constructing the path locally, so
# relocating the record cannot silently desync writer and reader into "no
# recorded approval".
function Get-VisualApprovalRecordPath {
  param([Parameter(Mandatory = $true)][string]$RepoRoot)

  return Join-Path $RepoRoot (Join-Path '.review_state' (Join-Path 'visual-approval' 'approval.json'))
}
