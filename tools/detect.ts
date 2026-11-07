import fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { resolveSafePath } from './lib/paths.js';
import type { DetectOutput, Change } from './lib/types.js';

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function extractProperties(schema: any): Record<string, any> {
  if (!schema) return {};
  if (schema.type === 'object' && schema.properties) {
    return schema.properties;
  }
  if (schema.type === 'array' && schema.items) {
    return extractProperties(schema.items);
  }
  return {};
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    fail('Usage: npx tsx tools/detect.ts <old.yaml> <new.yaml>');
  }

  const oldPath = resolveSafePath(args[0]);
  const newPath = resolveSafePath(args[1]);

  if (!fs.existsSync(oldPath)) fail(`Old spec not found: ${oldPath}`);
  if (!fs.existsSync(newPath)) fail(`New spec not found: ${newPath}`);

  let v1: any;
  let v2: any;
  try {
    v1 = parseYaml(fs.readFileSync(oldPath, 'utf8'));
    v2 = parseYaml(fs.readFileSync(newPath, 'utf8'));
  } catch (err: any) {
    fail(`Failed to parse YAML: ${err.message}`);
  }

  const changes: Change[] = [];
  let changeCount = 1;

  const v1Paths = v1.paths || {};
  const v2Paths = v2.paths || {};

  // Check all paths in v1
  for (const [pathStr, pathItem1] of Object.entries(v1Paths) as [string, any][]) {
    const pathItem2 = v2Paths[pathStr] || {};
    const methods = ['get', 'post', 'put', 'patch', 'delete'];

    for (const method of methods) {
      const op1 = pathItem1[method];
      if (!op1) continue;
      const op2 = pathItem2[method];
      const methodUpper = method.toUpperCase();

      if (!op2) {
        changes.push({
          id: `c${changeCount++}`,
          severity: 'BREAKING',
          kind: 'endpoint_removed',
          method: methodUpper,
          path: pathStr,
          location: `endpoint`,
          field: pathStr,
          detail: `Endpoint ${methodUpper} ${pathStr} removed`,
        });
        continue;
      }

      // 1. Check Request Body changes (e.g. required field added)
      const reqContent1 = op1.requestBody?.content?.['application/json']?.schema;
      const reqContent2 = op2.requestBody?.content?.['application/json']?.schema;

      if (reqContent2) {
        const req1Required = new Set<string>(reqContent1?.required || []);
        const req2Required = new Set<string>(reqContent2?.required || []);

        for (const reqField of req2Required) {
          if (!req1Required.has(reqField)) {
            changes.push({
              id: `c${changeCount++}`,
              severity: 'BREAKING',
              kind: 'required_added',
              method: methodUpper,
              path: pathStr,
              location: `request.${reqField}`,
              field: reqField,
              detail: `Field ${reqField} is now required`,
            });
          }
        }
      }

      // 2. Check Response changes (e.g. field removed or renamed, optional added)
      const res1Content =
        op1.responses?.['200']?.content?.['application/json']?.schema ||
        op1.responses?.['201']?.content?.['application/json']?.schema;
      const res2Content =
        op2.responses?.['200']?.content?.['application/json']?.schema ||
        op2.responses?.['201']?.content?.['application/json']?.schema;

      if (res1Content && res2Content) {
        const isArray1 = res1Content.type === 'object' && res1Content.properties?.items?.type === 'array';
        const isArray2 = res2Content.type === 'object' && res2Content.properties?.items?.type === 'array';

        const props1 = isArray1
          ? res1Content.properties.items.items?.properties || {}
          : res1Content.properties || {};
        const props2 = isArray2
          ? res2Content.properties.items.items?.properties || {}
          : res2Content.properties || {};

        const locPrefix = isArray1 ? 'response.items[].' : 'response.';

        // Detect removed response fields (BREAKING)
        const removedFields: string[] = [];
        for (const [propName] of Object.entries(props1)) {
          if (!props2[propName]) {
            removedFields.push(propName);
            changes.push({
              id: `c${changeCount++}`,
              severity: 'BREAKING',
              kind: 'field_removed',
              method: methodUpper,
              path: pathStr,
              location: `${locPrefix}${propName}`,
              field: propName,
              detail: `Field ${propName} removed from response`,
            });
          }
        }

        // Detect added response fields (SAFE)
        for (const [propName] of Object.entries(props2)) {
          if (!props1[propName]) {
            // If this object already had a field removed (rename scenario like qty -> quantity),
            // the breaking change is already captured above. Do not report the replacement as safe addition.
            if (removedFields.length > 0) {
              continue;
            }
            changes.push({
              id: `c${changeCount++}`,
              severity: 'SAFE',
              kind: 'optional_field_added',
              method: methodUpper,
              path: pathStr,
              location: `${locPrefix}${propName}`,
              field: propName,
              detail: `Optional field ${propName} added`,
            });
          }
        }
      }
    }
  }

  const output: DetectOutput = {
    engine: 'driftmap',
    changes,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

main();
