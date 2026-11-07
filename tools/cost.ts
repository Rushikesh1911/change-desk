import fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { resolveSafePath, readTextSafe } from './lib/paths.js';
import type { UsageScanOutput, ServiceMapConfig, CostOutput, CostServiceResult } from './lib/types.js';

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    fail('Usage: npx tsx tools/cost.ts <findings.json> <service-map.yaml> [--hours 3]');
  }

  const findingsPath = resolveSafePath(args[0]);
  const serviceMapPath = resolveSafePath(args[1]);

  let hours = 3;
  const hoursIdx = args.indexOf('--hours');
  if (hoursIdx !== -1 && args[hoursIdx + 1]) {
    const parsed = Number(args[hoursIdx + 1]);
    if (!Number.isNaN(parsed) && parsed > 0) {
      hours = parsed;
    }
  }

  if (!fs.existsSync(findingsPath)) fail(`Findings file not found: ${findingsPath}`);
  if (!fs.existsSync(serviceMapPath)) fail(`Service map not found: ${serviceMapPath}`);

  let scanOutput: UsageScanOutput;
  let serviceMap: ServiceMapConfig;
  try {
    scanOutput = JSON.parse(readTextSafe(findingsPath));
    serviceMap = parseYaml(readTextSafe(serviceMapPath));
  } catch (err: any) {
    fail(`Failed to parse inputs: ${err.message}`);
  }

  const affectedServiceNames = Array.from(
    new Set(scanOutput.findings.map((f) => f.service))
  );

  const services: CostServiceResult[] = [];
  let totalLoss = 0;

  for (const svcName of affectedServiceNames) {
    const svcConfig = serviceMap.services?.[svcName];
    if (!svcConfig) continue;

    const perHour = svcConfig.revenue_per_hour || 0;
    const estimatedLoss = perHour * hours;
    totalLoss += estimatedLoss;

    services.push({
      service: svcName,
      owner: svcConfig.owner || 'unknown',
      criticality: svcConfig.criticality || 'medium',
      per_hour: perHour,
      estimated_loss: estimatedLoss,
    });
  }

  const output: CostOutput = {
    currency: serviceMap.currency || 'INR',
    assumed_outage_hours: hours,
    services,
    total_estimated_loss: totalLoss,
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
