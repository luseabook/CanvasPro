// Gate on tools/reachability.mjs: fail when a module becomes unreachable that was not
// in the committed baseline, or when a relative import no longer resolves. Removing
// orphans only improves the report and is allowed.
//
// Baseline refresh (after intentionally removing a module): node tools/reachability.mjs --write
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const baselinePath = path.join(ROOT, 'tools', 'reachability-baseline.json');
const output = execFileSync(process.execPath, [path.join(ROOT, 'tools', 'reachability.mjs'), '--json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const current = JSON.parse(output);
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const known = new Set(baseline.orphans);
const added = current.orphans.filter((file) => !known.has(file));

if (current.missing.length) {
  console.error('reachability: broken relative imports:\n  ' + current.missing.join('\n  '));
  process.exit(1);
}
if (added.length) {
  console.error(`reachability: ${added.length} newly unreachable module(s):\n  ` + added.join('\n  '));
  console.error('\nWire or delete them, then refresh: node tools/reachability.mjs --write');
  process.exit(1);
}
const resolved = baseline.orphans.length - current.orphans.length;
console.log(
  `reachability OK: scope ${current.scope}, reachable ${current.reachable}, orphans ${current.orphans.length}` +
    (resolved > 0 ? ` (${resolved} fewer than baseline)` : '')
);
