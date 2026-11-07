import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

console.log('==> Resetting Change Desk demo state...');

for (const f of ['changes.json', 'findings.json', 'cost.json']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
  }
}

try {
  execSync('git checkout HEAD -- demo/', { cwd: root, stdio: 'ignore' });
  execSync('git clean -fd demo/', { cwd: root, stdio: 'ignore' });
} catch {
  // Ignore if not a git repo or no changes
}

console.log('==> Change Desk demo state reset successfully.');
