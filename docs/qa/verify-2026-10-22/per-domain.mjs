// QA 分域跑测辅助脚本（只读仓库 + 隔离沙箱，不改源码）
// 用法: node docs/qa/verify-2026-10-22/per-domain.mjs <domainDir> [nodeBinPath]
// 复用 tools/test-runtime.mjs 的环境构造，保证与全量跑测同一套隔离口径。
// 按 80 个文件一批调用 node --test（node 22 只接受文件路径，不做目录发现），累计 TAP 摘要数字。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, createTestEnvironment } from '../../../tools/test-runtime.mjs';

const domain = process.argv[2];
if (!domain) throw new Error('missing domain directory');
const nodeBin = process.argv[3] || process.execPath;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '__pycache__', '.git'].includes(entry.name)) continue;
      walk(full, out);
    } else if (/\.test\.js$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(path.resolve(ROOT, domain)).sort();
if (!files.length) {
  console.log(JSON.stringify({ domain, error: 'no test files found' }));
  process.exit(2);
}

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-domain-'));
const fixture = createTestEnvironment(18784);
const profile = path.join(sandbox, 'profile');
fs.renameSync(fixture.directory, profile);
const temp = path.join(sandbox, 'temp');
fs.mkdirSync(temp, { recursive: true });
const env = Object.fromEntries(
  Object.entries(fixture.env).map(([k, v]) => [k, typeof v === 'string' ? v.split(fixture.directory).join(profile) : v])
);
Object.assign(env, { TEMP: temp, TMP: temp, TMPDIR: temp, AIC_TEST_SANDBOX_ROOT: sandbox, NO_COLOR: '1', FORCE_COLOR: '0' });
const guard = path.join(ROOT, 'tools/offline-unit-guard.cjs');

const totals = { tests: 0, pass: 0, fail: 0, skipped: 0, cancelled: 0, todo: 0 };
const failures = [];
const failing = [];
const started = Date.now();
const chunks = [];
for (let i = 0; i < files.length; i += 80) chunks.push(files.slice(i, i + 80));

for (const [index, chunk] of chunks.entries()) {
  const out = path.join(sandbox, `out-${index}.tap`);
  const fd = fs.openSync(out, 'w');
  const result = spawnSync(
    nodeBin,
    ['--require', guard, '--test', '--test-reporter=tap', '--test-concurrency=2', '--test-timeout=30000', ...chunk],
    { cwd: ROOT, env, stdio: ['ignore', fd, fd], timeout: 900000, windowsHide: true }
  );
  fs.closeSync(fd);
  const text = fs.readFileSync(out, 'utf8');
  for (const key of Object.keys(totals)) {
    const m = [...text.matchAll(new RegExp('^# ' + key + ' (\\d+)', 'gm'))];
    totals[key] += Number(m.at(-1)?.[1] || 0);
  }
  const chunkFailures = [...text.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]);
  failures.push(...chunkFailures);
  // 失败批次里再定位到具体文件
  if (result.status !== 0) {
    for (const file of chunk) {
      const singleOut = path.join(sandbox, `single-${path.basename(file)}.tap`);
      const sfd = fs.openSync(singleOut, 'w');
      const single = spawnSync(nodeBin, ['--require', guard, '--test', '--test-reporter=tap', '--test-concurrency=1', '--test-timeout=30000', file], {
        cwd: ROOT,
        env,
        stdio: ['ignore', sfd, sfd],
        timeout: 300000,
        windowsHide: true,
      });
      fs.closeSync(sfd);
      if (single.status !== 0) failing.push(path.relative(ROOT, file).replace(/\\/g, '/'));
    }
  }
  fs.writeFileSync(
    path.join(ROOT, 'docs/qa/verify-2026-10-22/.domain-logs', `${domain.replace(/[\\/]/g, '_')}.tap`),
    `# domain=${domain} files=${files.length} chunks=${chunks.length}\n`
  );
}

const summary = {
  domain,
  files: files.length,
  elapsedMs: Date.now() - started,
  ...totals,
  failureCount: failures.length,
  failures: failures.slice(0, 30),
  failingFiles: failing,
};
console.log(JSON.stringify(summary, null, 2));
fixture.dispose?.();
fs.rmSync(sandbox, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
