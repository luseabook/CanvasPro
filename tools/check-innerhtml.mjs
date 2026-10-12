// innerHTML convergence guard.
//
// The review counted 411 unguarded `innerHTML` writes under src/. Rewriting all of
// them safely is per-site review work, so this gate freezes the count: new writes fail
// CI, existing writes can only go down. When a batch has been reviewed, lower the
// baseline in tools/innerhtml-baseline.json.
//
// Usage: node tools/check-innerhtml.mjs [--write]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASELINE = path.join(ROOT, 'tools', 'innerhtml-baseline.json');
const SKIP_DIRS = new Set(['node_modules', 'test-artifacts', 'vendor', 'styles']);

function countInnerHtml(root) {
  let total = 0;
  const perFile = {};
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (!SKIP_DIRS.has(item.name)) walk(full);
      } else if (/\.js$/i.test(item.name) && !/\.test\.js$/i.test(item.name)) {
        const text = fs.readFileSync(full, 'utf8');
        const hits = (text.match(/\.innerHTML\s*=/g) || []).length;
        if (hits) {
          perFile[path.relative(ROOT, full).split(path.sep).join('/')] = hits;
          total += hits;
        }
      }
    }
  };
  walk(root);
  return { total, perFile };
}

const current = countInnerHtml(path.join(ROOT, 'src'));

if (process.argv.includes('--write')) {
  fs.writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n');
  console.log(`wrote baseline: ${current.total} innerHTML writes under src/`);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
if (current.total > baseline.total) {
  const added = Object.entries(current.perFile).filter(([file, n]) => n > (baseline.perFile[file] || 0));
  console.error(`innerHTML grew: ${baseline.total} -> ${current.total}`);
  for (const [file, n] of added) console.error(`  ${file}: ${baseline.perFile[file] || 0} -> ${n}`);
  console.error('\nConvert to textContent / an escaping builder, or refresh: node tools/check-innerhtml.mjs --write');
  process.exit(1);
}
console.log(
  `innerHTML OK: ${current.total} writes (baseline ${baseline.total}` +
    (current.total < baseline.total ? `, ${baseline.total - current.total} fewer` : '') +
    ')'
);
