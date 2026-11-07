#!/usr/bin/env bash
set -e

# Change Desk seed script - resets the repository to clean demo state
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "==> Resetting Change Desk demo state..."

# Clean up any generated artifact json files
rm -f changes.json findings.json cost.json

# Restore any modified files in demo/
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  git checkout HEAD -- demo/ 2>/dev/null || true
  git clean -fd demo/ 2>/dev/null || true
fi

echo "==> Change Desk demo state reset successfully."
