#!/usr/bin/env node
// CanvasPro 变更跟踪（零依赖，Node >= 18）。说明见 docs/TRACKING.md 的「变更记录」一节。
//
// 用法：
//   node tools/tracking/track.mjs [--by <来源>] [--note "<说明>"]  比对快照，有变化就追加一条记录
//   node tools/tracking/track.mjs --watch                          后台监视：改动静默一段时间后自动记录
//   node tools/tracking/track.mjs --status                         查看快照、最近记录和监视进程状态
//   node tools/tracking/track.mjs --dry-run                        只显示差异，不写入任何文件
//
// 来源（--by）：session-start = 新对话开工时补记会话外改动；agent = AI 登记自己的改动；
//               watch = 自动监视；manual = 有人手动运行（默认）。
// 记录写在 docs/tracking/changes/<年-月>.md（只追加）；快照和锁放在 docs/tracking/state/（本地，不进 git）。
// 纳入范围：git 会跟踪的文件，即已跟踪文件加上未被 .gitignore 忽略的新文件；另外排除下面 CONFIG 里的目录。

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE_DIR = path.join(ROOT, 'docs', 'tracking', 'state');
const CHANGES_DIR = path.join(ROOT, 'docs', 'tracking', 'changes');
const SNAPSHOT = path.join(STATE_DIR, 'snapshot.json');
const LOCK = path.join(STATE_DIR, 'check.lock');
const WATCH_PID = path.join(STATE_DIR, 'watch.pid');
const WATCH_LOG = path.join(STATE_DIR, 'watch.log');

const CONFIG = {
  // 始终排除（相对仓库根目录，正斜杠，以 / 结尾表示目录）
  excludePrefixes: [
    '.git/', 'node_modules/', 'venv/', '.venv/', 'user/', 'user-data/', 'output/', 'data/',
    'deobfuscated/', 'logs/', 'dist/', 'release/', '.tmp/',
    'docs/tracking/state/', 'docs/tracking/changes/',
  ],
  excludeSegments: ['__pycache__', 'node_modules', '.pytest_cache'],
  // 改动这些文件时，记录里会打 ⚠ 标记
  protected: ['api/freeImageHostApi.js'],
  hashMaxBytes: 16 * 1024 * 1024,
  lineCountMaxBytes: 2 * 1024 * 1024,
  textExt: new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.py', '.css', '.html', '.htm', '.txt',
    '.yml', '.yaml', '.ps1', '.bat', '.cmd', '.sh', '.toml', '.xml', '.svg', '.csv', '.ini', '.cfg', '.sql']),
  watchQuietMs: Number(process.env.TRACK_QUIET_MS) || 90_000, // 改动静默这么久后记录
  watchMaxWaitMs: Number(process.env.TRACK_MAX_WAIT_MS) || 600_000, // 持续改动时最长这么久必记一次
  watchSafetyMs: 30 * 60 * 1000, // 监视期间每 30 分钟兜底检查一次
  listFileMax: 60, // 每类文件最多列出多少个
  partMaxBytes: Number(process.env.TRACK_PART_MAX_BYTES) || 400 * 1024, // 单个记录文件超过这个大小就分卷，保证 MCP 能读
};

const LABELS = {
  init: '基线',
  'session-start': '会话开工补记（会话外改动）',
  agent: '智能体',
  watch: '自动监视',
  'watch-start': '自动监视启动补记',
  manual: '手动运行',
};

const DEFAULT_NOTES = {
  'session-start': '上次记录之后、本次对话开始之前发生的改动（来源不明，多为用户手动修改）。',
  'watch-start': '监视启动时补记：上次记录之后、监视未运行期间发生的改动。',
  watch: '自动记录，未附说明。',
};

const rel = (p) => p.replace(/\\/g, '/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n, w = 2) => String(n).padStart(w, '0');

function now() {
  const d = new Date();
  return {
    month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
    text: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  };
}

function isExcluded(p) {
  const r = rel(p).replace(/^\.\//, '');
  if (!r) return true;
  for (const pre of CONFIG.excludePrefixes) {
    if (r === pre.slice(0, -1) || r.startsWith(pre)) return true;
  }
  const segs = r.split('/');
  return segs.some((s) => CONFIG.excludeSegments.includes(s));
}

function walk(dir, base = '', out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const r = base ? `${base}/${e.name}` : e.name;
    if (isExcluded(r) || isExcluded(`${r}/`)) continue;
    if (e.isDirectory()) walk(path.join(dir, e.name), r, out);
    else if (e.isFile()) out.push(r);
  }
  return out;
}

function listFiles() {
  let files = null;
  try {
    const out = execFileSync('git', ['-c', 'core.quotepath=off', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      { cwd: ROOT, maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    files = out.toString('utf8').split('\0').filter(Boolean);
  } catch {
    files = walk(ROOT); // 没有 git 时退回目录遍历
  }
  return [...new Set(files.map(rel))].filter((f) => !isExcluded(f)).sort();
}

function countLines(buf) {
  if (buf.length === 0) return 0;
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === 10) n++;
  return buf[buf.length - 1] === 10 ? n : n + 1;
}

function scan(prevFiles) {
  const cur = {};
  for (const f of listFiles()) {
    let st;
    try { st = fs.statSync(path.join(ROOT, f)); } catch { continue; } // 已跟踪但被删除的文件
    if (!st.isFile()) continue;
    const m = Math.round(st.mtimeMs);
    const p = prevFiles[f];
    if (p && p.s === st.size && p.m === m) { cur[f] = p; continue; }
    const e = { s: st.size, m, h: null, l: null };
    if (st.size <= CONFIG.hashMaxBytes) {
      try {
        const buf = fs.readFileSync(path.join(ROOT, f));
        e.h = crypto.createHash('sha256').update(buf).digest('hex');
        if (st.size <= CONFIG.lineCountMaxBytes && CONFIG.textExt.has(path.extname(f).toLowerCase())) e.l = countLines(buf);
      } catch { /* 读失败时只比大小和时间 */ }
    }
    cur[f] = e;
  }
  return cur;
}

function isChanged(p, c) {
  if (p.h && c.h) return p.h !== c.h;
  return p.s !== c.s || p.m !== c.m;
}

function diff(prev, cur) {
  const added = []; const modified = []; const deleted = [];
  for (const f of Object.keys(cur)) {
    if (!prev[f]) added.push(f);
    else if (isChanged(prev[f], cur[f])) modified.push(f);
  }
  for (const f of Object.keys(prev)) if (!cur[f]) deleted.push(f);
  return { added: added.sort(), modified: modified.sort(), deleted: deleted.sort() };
}

function readState() {
  try { return JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')); } catch { return null; }
}

function writeState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const gi = path.join(STATE_DIR, '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, '# 本目录是变更跟踪的本地状态（快照、锁、日志），不进 git\n*\n');
  const tmp = `${SNAPSHOT}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, SNAPSHOT);
}

// 记录文件名：<年-月>.md 为第 1 卷，<年-月>-p<N>.md 为第 N 卷
function parsePart(name) {
  const m = /^(\d{4}-\d{2})(?:-p(\d+))?\.md$/.exec(name);
  return m ? { name, month: m[1], n: m[2] ? Number(m[2]) : 1 } : null;
}

function changeFiles() {
  let names = [];
  try { names = fs.readdirSync(CHANGES_DIR); } catch { return []; }
  return names.map(parsePart).filter(Boolean)
    .sort((a, b) => (a.month === b.month ? a.n - b.n : a.month < b.month ? -1 : 1))
    .map((p) => p.name);
}

function targetPart(month) {
  const parts = changeFiles().map(parsePart).filter((p) => p.month === month);
  let n = parts.length ? Math.max(...parts.map((p) => p.n)) : 1;
  const nameOf = (k) => (k === 1 ? `${month}.md` : `${month}-p${k}.md`);
  const full = path.join(CHANGES_DIR, nameOf(n));
  if (fs.existsSync(full) && fs.statSync(full).size > CONFIG.partMaxBytes) n += 1;
  return { n, name: nameOf(n), prev: n > 1 ? nameOf(n - 1) : '' };
}

function maxRecordedId() {
  let max = 0;
  for (const f of changeFiles()) {
    const text = fs.readFileSync(path.join(CHANGES_DIR, f), 'utf8');
    for (const m of text.matchAll(/^## #(\d+)/gm)) max = Math.max(max, Number(m[1]));
  }
  return max;
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function describe(kind, f, prev, cur) {
  const c = cur[f]; const p = prev[f];
  if (kind === 'added') return c.l != null ? `\`${f}\`（${c.l} 行）` : `\`${f}\`（${fmtBytes(c.s)}）`;
  if (kind === 'deleted') return p.l != null ? `\`${f}\`（原 ${p.l} 行）` : `\`${f}\`（原 ${fmtBytes(p.s)}）`;
  if (p.l != null && c.l != null) {
    const d = c.l - p.l;
    return `\`${f}\`（${p.l}→${c.l} 行，${d >= 0 ? '+' : ''}${d}）`;
  }
  return `\`${f}\`（${fmtBytes(p.s)}→${fmtBytes(c.s)}）`;
}

function section(title, kind, list, prev, cur) {
  if (!list.length) return [];
  const lines = [`- ${title}（${list.length}）：`];
  for (const f of list.slice(0, CONFIG.listFileMax)) lines.push(`  - ${describe(kind, f, prev, cur)}`);
  if (list.length > CONFIG.listFileMax) lines.push(`  - ……另有 ${list.length - CONFIG.listFileMax} 个`);
  return lines;
}

function appendRecord(lines, month) {
  fs.mkdirSync(CHANGES_DIR, { recursive: true });
  const part = targetPart(month);
  const file = path.join(CHANGES_DIR, part.name);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, [
      part.n > 1 ? `# 变更记录 · ${month}（第 ${part.n} 卷，上一卷 \`${part.prev}\`）` : `# 变更记录 · ${month}`,
      '',
      '> 由 `tools/tracking/track.mjs` 自动追加，最新的在文件末尾。请勿修改或删除已有条目。',
      '> 来源：会话开工补记＝新对话开始时补记的会话外改动（多为用户手动修改）；智能体＝AI 在对话中登记；自动监视＝VS Code/Qoder 打开本仓库时的后台监视；手动运行＝有人直接运行脚本。',
      '> 行数变化只比较前后行数，不是逐行 diff；要看具体内容请用 git diff 或对应专题文档。',
    ].join('\n') + '\n\n');
  }
  fs.appendFileSync(file, `${lines.join('\n')}\n\n`);
  return rel(path.relative(ROOT, file));
}

async function withLock(fn) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const fd = fs.openSync(LOCK, 'wx');
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try {
        if (Date.now() - fs.statSync(LOCK).mtimeMs > 120_000) { fs.unlinkSync(LOCK); continue; }
      } catch { continue; }
      if (Date.now() > deadline) throw new Error('另一个记录进程正在运行（docs/tracking/state/check.lock），请稍后重试');
      await sleep(300);
    }
  }
  try { return await fn(); } finally { try { fs.unlinkSync(LOCK); } catch { /* 已被清理 */ } }
}

async function runCheck({ by = 'manual', note = '', dryRun = false, quiet = false } = {}) {
  const say = (s) => { if (!quiet) console.log(s); };
  const work = async () => {
    const state = readState();
    const t = now();
    const label = LABELS[by] || by;
    if (!state) {
      const cur = scan({});
      const count = Object.keys(cur).length;
      if (dryRun) { say(`（试运行）尚无快照，将建立基线：${count} 个文件`); return; }
      const hadHistory = changeFiles().length > 0;
      const id = maxRecordedId() + 1;
      const lines = [
        `## #${pad(id, 4)} · ${t.text} · ${hadHistory ? '重建基线' : '基线'}`,
        `- 来源：${label}`,
        `- 说明：${note || (hadHistory ? '快照丢失，重新建立基线；上一条记录到现在之间的改动无法逐个列出。' : '建立变更跟踪基线。')}`,
        `- 纳入范围：${count} 个文件（git 跟踪的文件加上未被忽略的新文件，排除运行数据目录）`,
      ];
      const where = appendRecord(lines, t.month);
      writeState({ version: 1, createdAt: t.text, updatedAt: t.text, lastId: id, files: cur });
      say(`已建立基线 #${pad(id, 4)}：${count} 个文件 → ${where}`);
      return;
    }
    const prev = state.files || {};
    const cur = scan(prev);
    const d = diff(prev, cur);
    const total = d.added.length + d.modified.length + d.deleted.length;
    if (dryRun) {
      say(`（试运行）新增 ${d.added.length} · 修改 ${d.modified.length} · 删除 ${d.deleted.length}`);
      for (const [k, list] of Object.entries(d)) for (const f of list.slice(0, 200)) say(`  ${k === 'added' ? '+' : k === 'deleted' ? '-' : '~'} ${f}`);
      return;
    }
    const lastId = Math.max(Number(state.lastId) || 0, maxRecordedId());
    if (total === 0) {
      if (note) {
        const id = lastId + 1;
        const where = appendRecord([
          `## #${pad(id, 4)} · ${t.text} · ${label}（说明）`,
          `- 说明：${note}`,
          `- 文件：自上一条记录（#${pad(lastId, 4)}）以来没有新的文件变化；相关改动已在此前的记录里。`,
        ], t.month);
        writeState({ ...state, updatedAt: t.text, lastId: id, files: cur });
        say(`已记录说明 #${pad(id, 4)} → ${where}`);
      } else {
        writeState({ ...state, files: cur }); // 只刷新修改时间缓存
        say('无变化，未写记录。');
      }
      return;
    }
    const id = lastId + 1;
    const lines = [
      `## #${pad(id, 4)} · ${t.text} · ${label}`,
      `- 说明：${note || DEFAULT_NOTES[by] || '（未填写说明）'}`,
      `- 统计：新增 ${d.added.length} · 修改 ${d.modified.length} · 删除 ${d.deleted.length}`,
      ...section('新增', 'added', d.added, prev, cur),
      ...section('修改', 'modified', d.modified, prev, cur),
      ...section('删除', 'deleted', d.deleted, prev, cur),
    ];
    const hit = CONFIG.protected.filter((f) => d.added.includes(f) || d.modified.includes(f) || d.deleted.includes(f));
    if (hit.length) lines.push(`- ⚠ 受保护文件被改动：${hit.map((f) => `\`${f}\``).join('、')}，请立即核对是否授权`);
    const where = appendRecord(lines, t.month);
    writeState({ ...state, updatedAt: t.text, lastId: id, files: cur });
    say(`已记录 #${pad(id, 4)}（${label}）：新增 ${d.added.length} · 修改 ${d.modified.length} · 删除 ${d.deleted.length} → ${where}`);
  };
  if (dryRun) return work();
  return withLock(work);
}

function isAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

// 监视进程每分钟刷新 pid 文件；超过 3 分钟没刷新就视为失效（防止 Windows 复用进程号造成误判）
function runningWatcherPid() {
  try {
    const pid = Number(fs.readFileSync(WATCH_PID, 'utf8'));
    const fresh = Date.now() - fs.statSync(WATCH_PID).mtimeMs < 180_000;
    return pid && fresh && isAlive(pid) ? pid : 0;
  } catch { return 0; }
}

function log(msg) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    if (fs.existsSync(WATCH_LOG) && fs.statSync(WATCH_LOG).size > 256 * 1024) {
      const keep = fs.readFileSync(WATCH_LOG, 'utf8').slice(-64 * 1024);
      fs.writeFileSync(WATCH_LOG, keep);
    }
    fs.appendFileSync(WATCH_LOG, `${now().text} [${process.pid}] ${msg}\n`);
  } catch { /* 日志失败不影响监视 */ }
}

async function watch() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const other = runningWatcherPid();
  if (other && other !== process.pid) {
    console.log(`变更跟踪监视已在运行（pid ${other}），本进程退出。`);
    return;
  }
  fs.writeFileSync(WATCH_PID, String(process.pid));
  setInterval(() => {
    try {
      if (Number(fs.readFileSync(WATCH_PID, 'utf8')) !== process.pid) fs.writeFileSync(WATCH_PID, String(process.pid));
      const t = new Date(); fs.utimesSync(WATCH_PID, t, t);
    } catch { try { fs.writeFileSync(WATCH_PID, String(process.pid)); } catch { /* 忽略 */ } }
  }, 60_000);
  const cleanup = () => {
    try { if (Number(fs.readFileSync(WATCH_PID, 'utf8')) === process.pid) fs.unlinkSync(WATCH_PID); } catch { /* 忽略 */ }
  };
  process.on('exit', cleanup);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    try { process.on(sig, () => process.exit(0)); } catch { /* 平台不支持该信号 */ }
  }
  log(`监视启动：${ROOT}`);
  console.log(`CanvasPro 变更跟踪监视已启动（pid ${process.pid}）。改动静默 ${Math.round(CONFIG.watchQuietMs / 1000)} 秒后自动记录到 docs/tracking/changes/。`);
  const check = async (by) => {
    try { await runCheck({ by, quiet: true }); } catch (e) { log(`记录失败：${e.message}`); }
  };
  await check('watch-start');

  let timer = null; let first = 0;
  const schedule = () => {
    const t = Date.now();
    if (!first) first = t;
    clearTimeout(timer);
    const wait = Math.max(0, Math.min(CONFIG.watchQuietMs, first + CONFIG.watchMaxWaitMs - t));
    timer = setTimeout(() => { first = 0; check('watch'); }, wait);
  };
  const start = () => {
    try {
      const w = fs.watch(ROOT, { recursive: true }, (_evt, name) => {
        if (name && isExcluded(String(name))) return;
        schedule();
      });
      w.on('error', (e) => {
        log(`监视出错，5 秒后重启：${e.message}`);
        try { w.close(); } catch { /* 忽略 */ }
        setTimeout(start, 5000);
      });
    } catch (e) {
      log(`无法启动监视，30 秒后重试：${e.message}`);
      setTimeout(start, 30_000);
    }
  };
  start();
  setInterval(() => check('watch'), CONFIG.watchSafetyMs);
}

function status() {
  const state = readState();
  console.log(state
    ? `快照：${Object.keys(state.files || {}).length} 个文件，更新于 ${state.updatedAt}，最近记录编号 #${pad(state.lastId || 0, 4)}`
    : '快照：尚未建立（下次运行时会自动建立基线）');
  const files = changeFiles();
  if (files.length) {
    const last = files[files.length - 1];
    const heads = [...fs.readFileSync(path.join(CHANGES_DIR, last), 'utf8').matchAll(/^## (#\d+.*)$/gm)].map((m) => m[1]);
    console.log(`最近记录：${heads.slice(-3).join(' | ') || '（无）'}（docs/tracking/changes/${last}）`);
  } else {
    console.log('最近记录：（尚无）');
  }
  const pid = runningWatcherPid();
  console.log(pid ? `自动监视：运行中（pid ${pid}）` : '自动监视：未运行（VS Code/Qoder 打开本仓库时会自动启动；也可运行 --watch）');
}

function parseArgs(argv) {
  const o = { by: 'manual', note: '', mode: 'check', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--by') o.by = argv[++i] || 'manual';
    else if (a === '--note') o.note = (argv[++i] || '').trim();
    else if (a === '--watch') o.mode = 'watch';
    else if (a === '--status') o.mode = 'status';
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '--init') o.by = 'init';
    else if (a === '-h' || a === '--help') o.mode = 'help';
    else throw new Error(`未知参数：${a}（用 --help 查看用法）`);
  }
  return o;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.mode === 'help') {
    const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n');
    console.log(src.slice(1, 14).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return;
  }
  if (o.mode === 'status') return status();
  if (o.mode === 'watch') return watch();
  return runCheck({ by: o.by, note: o.note, dryRun: o.dryRun });
}

main().catch((e) => {
  console.error(`变更跟踪出错：${e.message}`);
  process.exitCode = 1;
});
