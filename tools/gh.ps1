# gh.ps1 — resolve the GitHub CLI executable once, lazily. Dot-source this
# file; do not run it directly. Defines Get-GhPath but does not call it --
# resolution only happens when a caller invokes Get-GhPath, so a script that
# dot-sources this file (e.g. tools/apply-branch-protection.ps1) can still
# reach an offline-testable seam (like -EmitPayload) that exits before ever
# calling Get-GhPath, with no GitHub CLI required on that path.
#
# Windows PowerShell 5.1-compatible: no ternary, no ??, no &&, no ||.

# Get-GhPath — returns the path to a working `gh` executable:
#   1. `gh` if it resolves on PATH (covers Linux/macOS/CI and any Windows
#      install that put gh on PATH).
#   2. The default Windows install path, if that file exists (`gh`'s Windows
#      installer does not always add itself to PATH in every shell).
#   3. Otherwise throws, telling the caller to install the GitHub CLI --
#      callers on the network path have no fallback once this throws; there
#      is nothing left to try.
function Get-GhPath {
  $onPath = Get-Command 'gh' -ErrorAction SilentlyContinue
  if ($onPath) {
    return 'gh'
  }

  $winInstall = 'C:\Program Files\GitHub CLI\gh.exe'
  if (Test-Path $winInstall) {
    return $winInstall
  }

  throw 'Get-GhPath: GitHub CLI not found on PATH or at the default Windows install path. Install it: https://cli.github.com/'
}
