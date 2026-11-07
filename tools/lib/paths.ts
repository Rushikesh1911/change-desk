import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// tools/lib -> tools -> root
export const REPO_ROOT = process.env.CHANGE_DESK_ROOT
  ? path.resolve(process.env.CHANGE_DESK_ROOT)
  : path.resolve(__dirname, '../..');

export function resolveSafePath(userPath: string): string {
  if (path.isAbsolute(userPath)) {
    return userPath;
  }
  
  // Try relative to REPO_ROOT first
  const repoCandidate = path.resolve(REPO_ROOT, userPath);
  if (fs.existsSync(repoCandidate)) {
    return repoCandidate;
  }

  // Try relative to cwd
  const cwdCandidate = path.resolve(process.cwd(), userPath);
  if (fs.existsSync(cwdCandidate)) {
    return cwdCandidate;
  }

  // Fallback to repoCandidate
  return repoCandidate;
}

export function readTextSafe(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  let str = '';
  // Check for UTF-16 LE BOM (PowerShell redirection default)
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    str = buf.toString('utf16le');
  } else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    str = buf.swap16().toString('utf16le');
  } else {
    str = buf.toString('utf8');
  }
  return str.replace(/^\uFEFF/, '').trim();
}
