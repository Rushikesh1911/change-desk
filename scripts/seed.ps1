# Change Desk seed script (PowerShell) - resets demo state
$ErrorActionPreference = "SilentlyContinue"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host "==> Resetting Change Desk demo state..."

Remove-Item -Path "$RepoRoot\changes.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$RepoRoot\findings.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$RepoRoot\cost.json" -Force -ErrorAction SilentlyContinue

git checkout HEAD -- demo/ 2>$null
git clean -fd demo/ 2>$null

Write-Host "==> Change Desk demo state reset successfully."
