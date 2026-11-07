import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { resolveSafePath, REPO_ROOT, readTextSafe } from './lib/paths.js';
import type { DetectOutput, UsageScanOutput, ServiceMapConfig, Finding, ClearService } from './lib/types.js';

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function findSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      files.push(...findSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|js|tsx|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeRelativePath(absPath: string): string {
  const rel = path.relative(REPO_ROOT, absPath);
  return rel.replace(/\\/g, '/');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    fail('Usage: npx tsx tools/usage-scan.ts <changes.json> <service-map.yaml>');
  }

  const changesPath = resolveSafePath(args[0]);
  const serviceMapPath = resolveSafePath(args[1]);

  if (!fs.existsSync(changesPath)) fail(`Changes file not found: ${changesPath}`);
  if (!fs.existsSync(serviceMapPath)) fail(`Service map not found: ${serviceMapPath}`);

  let detectOutput: DetectOutput;
  let serviceMap: ServiceMapConfig;
  try {
    detectOutput = JSON.parse(readTextSafe(changesPath));
    serviceMap = parseYaml(readTextSafe(serviceMapPath));
  } catch (err: any) {
    fail(`Failed to parse inputs: ${err.message}`);
  }

  const breakingChanges = (detectOutput.changes || []).filter((c) => c.severity === 'BREAKING');
  const findings: Finding[] = [];
  const clear: ClearService[] = [];

  for (const change of breakingChanges) {
    const fieldRegex = new RegExp(`\\b${change.field}\\b`);

    for (const [serviceName, serviceConfig] of Object.entries(serviceMap.services || {})) {
      const svcDir = resolveSafePath(serviceConfig.path);
      const files = findSourceFiles(svcDir);
      let serviceHadFinding = false;

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i];
          // Skip comments
          const trimmed = lineText.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            continue;
          }

          if (fieldRegex.test(lineText)) {
            findings.push({
              changeId: change.id,
              service: serviceName,
              owner: serviceConfig.owner,
              file: normalizeRelativePath(filePath),
              line: i + 1,
              snippet: lineText.trim(),
            });
            serviceHadFinding = true;
          }
        }
      }

      if (!serviceHadFinding) {
        clear.push({
          changeId: change.id,
          service: serviceName,
          owner: serviceConfig.owner,
        });
      }
    }
  }

  const output: UsageScanOutput = {
    findings,
    clear,
  };

  const jsonStr = JSON.stringify(output, null, 2);

  const outIdx = args.indexOf('--out');
  if (outIdx !== -1 && args[outIdx + 1]) {
    const outPath = resolveSafePath(args[outIdx + 1]);
    fs.writeFileSync(outPath, jsonStr, 'utf8');
  }

  process.stdout.write(jsonStr + '\n');
}

main();
