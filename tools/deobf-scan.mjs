// Candidate finder for de-obfuscation batches.
//
//   node tools/deobf-scan.mjs [--min-bytes 1200] [--all]
//
// Lists non-test modules that still carry `_0x` identifiers, have a sibling
// `*.test.js`, and are imported by nothing else in the source tree. Zero-consumer
// files are the safest first targets: renaming them cannot affect other modules,
// so only their own tests have to hold.
//
// "Zero consumers" means the file's basename appears in no other source file. It
// is a heuristic: verify the winner by hand before renaming it, in case a barrel
// or manifest references it indirectly.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const SCAN_DIRS = ['src', 'electron', 'api'];
const ROOT_CONSUMERS = ['index.html', 'main.js', 'server.py', 'playwright.config.js'];
const SKIP = /^(node_modules|dist[^/]*|deobfuscated|\.git|\.kilo|playwright-report|test-results|build|\.workbuddy)(\/|$)/;
const OBFUSCATED = /_0x[0-9a-f]{4,}/;
// Text files that may reference a module. Consumers are searched across the
// whole repository, not just the source directories: a module can be pulled in
// from tools/, e2e/ or a root level script too.
const CONSUMER_EXTENSIONS = /\.(js|cjs|mjs|json|html|py|ps1|nsh|yml|yaml)$/;

const args = process.argv.slice(2);
const minBytes = Number(args[args.indexOf('--min-bytes') + 1]) || 1200;
const showAll = args.includes('--all');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (SKIP.test(rel)) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

const files = [];
walk(root, files);

const sources = new Map();
for (const rel of files) {
  if (CONSUMER_EXTENSIONS.test(rel)) sources.set(rel, fs.readFileSync(path.join(root, rel), 'utf8'));
}
const consumerCorpus = [...sources.entries()].filter(([rel]) => !rel.startsWith('docs/'));

const rows = [];
for (const rel of files) {
  if (rel.endsWith('.test.js') || rel.endsWith('.spec.js')) continue;
  if (!SCAN_DIRS.some(dir => rel.startsWith(dir + '/'))) continue;
  const source = sources.get(rel);
  if (!source || !OBFUSCATED.test(source)) continue;
  const testRel = rel.replace(/\.js$/, '.test.js');
  const testSource = sources.get(testRel);
  if (!testSource) continue;

  const basename = path.basename(rel, '.js');
  let consumers = 0;
  for (const [other, text] of consumerCorpus) {
    if (other === rel || other === testRel) continue;
    if (text.includes(basename)) consumers += 1;
  }

  const obfuscated = new Set(source.match(/_0x[0-9a-f]{4,}/g) || []);
  const bytes = Buffer.byteLength(source);
  if (!showAll) {
    if (consumers !== 0) continue;
    if (bytes < minBytes) continue;
  }
  rows.push({
    rel,
    consumers,
    lines: source.split('\n').length,
    bytes,
    names: obfuscated.size,
    testLines: testSource.split('\n').length,
    assertions: (testSource.match(/assert\./g) || []).length,
  });
}

rows.sort((a, b) => (a.consumers - b.consumers) || (b.names - a.names) || (a.bytes - b.bytes));

console.log('消费方  行数   字节   混淆名  测试行  断言  文件');
for (const row of rows.slice(0, 40)) {
  console.log(
    String(row.consumers).padStart(6) +
      String(row.lines).padStart(6) +
      String(row.bytes).padStart(8) +
      String(row.names).padStart(7) +
      String(row.testLines).padStart(8) +
      String(row.assertions).padStart(6) + '  ' + row.rel,
  );
}
console.log('\n候选总数: ' + rows.length + (showAll ? '（含非零消费方）' : '（零消费方）'));
console.log('提示：零消费方是启发式判定，落地前请手工复核该文件确实无人引用。');
