// CSS double-track guard.
//
// The review flagged `style.css` (single 26k-line file) coexisting with `styles/*.css`.
// Convention: new component styles go under `styles/`; `style.css` is being drained and
// may only shrink. This gate fails if `style.css` grows past the frozen budget.
//
// Usage: node tools/check-css-budget.mjs [--write]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BUDGET = path.join(ROOT, 'tools', 'css-budget.json');
const target = path.join(ROOT, 'style.css');
const lines = fs.readFileSync(target, 'utf8').split('\n').length;

if (process.argv.includes('--write')) {
  fs.writeFileSync(BUDGET, JSON.stringify({ styleCssLines: lines }, null, 2) + '\n');
  console.log(`wrote budget: style.css = ${lines} lines`);
  process.exit(0);
}

const budget = JSON.parse(fs.readFileSync(BUDGET, 'utf8')).styleCssLines;
if (lines > budget) {
  console.error(`style.css grew: ${budget} -> ${lines}`);
  console.error('Put new styles in styles/<component>.css (and link it), or refresh: node tools/check-css-budget.mjs --write');
  process.exit(1);
}
console.log(`CSS budget OK: style.css ${lines} lines (budget ${budget}${lines < budget ? ', shrinking' : ''})`);
