// Wiring plan for the 368 orphan modules.
//
// A module is an orphan when no entry point reaches it through relative imports.
// The 0.7.16 mirror still has the original import graph, so for each orphan we can
// ask: which mirror file imported it, and is that importer present in the repo and
// reachable? When the answer is yes, the wiring step is exactly "the repo copy of
// that consumer is an older generation and is missing this import" - a precise,
// checkable edit rather than a guess.
import fs from 'node:fs';
import path from 'node:path';

const MIRROR = 'C:/Users/luobote/.qoder/tmp/shuo-deobf';
const REPO = 'F:/CanvasPro';

const reach = JSON.parse(fs.readFileSync('C:/Users/luobote/.qoder/tmp/deobf-tools/b126/reach-orphans.json', 'utf8'));
const orphans = new Set(reach.orphans);

const SPECIFIER = /(?:from\s*|import\s*\(\s*|new\s+URL\s*\(\s*)['"]([^'"]+)['"]/g;

function listModules(root) {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (/^(node_modules|\.git|dist[^/]*|release|deobfuscated|\.kilo|vendor)(\/|$)/.test(rel)) continue;
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|mjs|cjs)$/.test(entry.name) && !/\.(test|spec)\.js$/.test(entry.name) && !/_test\.js$/.test(entry.name)) out.push(rel);
    }
  })(root);
  return out;
}

function resolveSpecifier(fromRel, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
  for (const candidate of [base, base + '.js', base + '/index.js']) {
    if (fs.existsSync(path.join(MIRROR, candidate))) return candidate;
  }
  return null;
}

const mirrorModules = listModules(MIRROR);
const mirrorImporters = new Map(); // orphan -> Set(importer)
for (const rel of mirrorModules) {
  const source = fs.readFileSync(path.join(MIRROR, rel), 'utf8');
  SPECIFIER.lastIndex = 0;
  let match;
  while ((match = SPECIFIER.exec(source))) {
    const target = resolveSpecifier(rel, match[1]);
    if (!target || !orphans.has(target)) continue;
    if (!mirrorImporters.has(target)) mirrorImporters.set(target, new Set());
    mirrorImporters.get(target).add(rel);
  }
}

const buckets = { reachableConsumer: [], orphanConsumerOnly: [], noConsumerInRepo: [], dead: [] };
const unblockCount = new Map(); // consumer -> how many orphans it would reach

for (const orphan of orphans) {
  const importers = mirrorImporters.get(orphan);
  if (!importers || importers.size === 0) {
    buckets.dead.push(orphan);
    continue;
  }
  const inRepo = [...importers].filter(rel => fs.existsSync(path.join(REPO, rel)));
  if (inRepo.length === 0) {
    buckets.noConsumerInRepo.push(orphan);
    continue;
  }
  const reachable = inRepo.filter(rel => !orphans.has(rel));
  if (reachable.length) {
    buckets.reachableConsumer.push({ orphan, consumers: reachable });
    for (const consumer of reachable) unblockCount.set(consumer, (unblockCount.get(consumer) ?? 0) + 1);
  } else {
    buckets.orphanConsumerOnly.push({ orphan, consumers: inRepo });
  }
}

console.log('孤立模块: ' + orphans.size);
console.log('  有可达消费方（可直接接线）: ' + buckets.reachableConsumer.length);
console.log('  只有孤立消费方（需先接通上游）: ' + buckets.orphanConsumerOnly.length);
console.log('  消费方在仓库中不存在: ' + buckets.noConsumerInRepo.length);
console.log('  0.7.16 里也无人 import（死件）: ' + buckets.dead.length);
console.log('');
console.log('按消费方排序（改一个文件能接通的孤立件数）:');
for (const [consumer, count] of [...unblockCount].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log('  ' + String(count).padStart(3) + '  ' + consumer);
}

fs.writeFileSync('C:/Users/luobote/.workbuddy/tmp/wiring-plan.json', JSON.stringify({
  reachableConsumer: buckets.reachableConsumer,
  orphanConsumerOnly: buckets.orphanConsumerOnly,
  noConsumerInRepo: buckets.noConsumerInRepo,
  dead: buckets.dead,
}, null, 1));
