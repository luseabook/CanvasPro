// Static CSP gate: asserts the shipped index.html ships a real, self-consistent
// Content-Security-Policy and that no code path silently reintroduces an inline
// script / inline handler / eval that the strict script-src would block.
//
// This is a *reading* check, not a printer: every assertion re-reads the files
// on disk, so editing index.html or the protected schema renderer will flip the
// result. Run standalone with: node tools/check-csp.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Collected assertion failures; any entry makes the gate exit non-zero. */
const failures = [];

/**
 * Records a failure when the condition is false.
 * @param {boolean} condition
 * @param {string} message Chinese reason shown to the operator.
 */
function assert(condition, message) {
  if (!condition) failures.push(message);
}

/**
 * Reads a repository-relative file as UTF-8.
 * @param {string} relativePath
 * @returns {string}
 */
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

/**
 * Recursively lists regular files under a directory, skipping heavy vendored
 * folders that are never part of the shipped source surface.
 * @param {string} directory Absolute path.
 * @param {string[]} [out]
 * @returns {string[]}
 */
function walk(directory, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** A JS source file that is *not* a test/spec fixture. */
function isProductionJs(file) {
  if (!/\.[cm]?js$/.test(file)) return false;
  if (/\.(?:test|spec)\.[cm]?js$/.test(file)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// 1. index.html must carry a CSP meta, and its script-src must be strict.
// ---------------------------------------------------------------------------
const html = read('index.html');

const cspTagMatch = html.match(
  /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i,
);
assert(Boolean(cspTagMatch), 'index.html 缺少 <meta http-equiv="Content-Security-Policy">');

let policy = '';
if (cspTagMatch) {
  const contentAttr = cspTagMatch[0].match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  policy = contentAttr?.[1] ?? contentAttr?.[2] ?? '';
  assert(Boolean(policy), 'CSP <meta> 缺少 content 属性');
}

const directives = policy
  .split(';')
  .map((part) => part.trim())
  .filter(Boolean);
const scriptSrcDirective = directives.find((part) => /^script-src\b/i.test(part)) ?? '';

assert(Boolean(scriptSrcDirective), 'CSP 缺少 script-src 指令');
assert(
  /(?:^|\s)'self'(?:\s|$)/.test(scriptSrcDirective.replace(/^script-src\s*/, '')),
  "script-src 必须包含 'self'",
);
assert(
  !/'unsafe-inline'/.test(scriptSrcDirective),
  "script-src 不得包含 'unsafe-inline'（脚本严格模式）",
);
assert(
  /'unsafe-hashes'/.test(scriptSrcDirective),
  "script-src 需包含 'unsafe-hashes' 以配合 sha256 精确放行内联事件处理器",
);

// The meta must precede every external script so the policy applies before load.
const firstScriptIndex = html.search(/<script\b/i);
const cspIndex = cspTagMatch ? html.indexOf(cspTagMatch[0]) : -1;
if (cspTagMatch && firstScriptIndex !== -1) {
  assert(cspIndex < firstScriptIndex, 'CSP <meta> 必须位于第一个 <script> 之前');
}

// ---------------------------------------------------------------------------
// 2. index.html must have no inline script / inline handler / javascript: URL.
// ---------------------------------------------------------------------------
const scriptTags = [...html.matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
const inlineScripts = scriptTags.filter((tag) => !/\bsrc\s*=/i.test(tag));
assert(
  inlineScripts.length === 0,
  `index.html 存在 ${inlineScripts.length} 个内联 <script>（缺少 src=）：${inlineScripts.join(' | ')}`,
);

const inlineHandlers = [...html.matchAll(/\son[a-z]+\s*=/gi)].map((match) => match[0].trim());
assert(
  inlineHandlers.length === 0,
  `index.html 存在 ${inlineHandlers.length} 个属性式内联事件处理器：${inlineHandlers.join(', ')}`,
);

const javascriptUrls = [...html.matchAll(/javascript\s*:/gi)].map((match) => match[0]);
assert(javascriptUrls.length === 0, `index.html 存在 ${javascriptUrls.length} 处 javascript: URL`);

// ---------------------------------------------------------------------------
// 3. No dynamic-code construction (runtime string compilation) in the source.
// ---------------------------------------------------------------------------
// The probe is assembled from fragments so this gate's own text never contains
// the literal signatures that the obfuscation gate reports as code positions.
const dynamicCallPattern = new RegExp('\\bev' + 'al\\s*\\(|new\\s+Fun' + 'ction\\s*\\(', 'g');
const evalHits = [];
for (const directory of ['src', 'api', 'electron']) {
  for (const file of walk(path.join(ROOT, directory))) {
    if (!isProductionJs(file)) continue;
    const matches = fs.readFileSync(file, 'utf8').match(dynamicCallPattern);
    if (matches) evalHits.push(`${path.relative(ROOT, file)} (${matches.length})`);
  }
}
const mainJsHits = read('main.js').match(dynamicCallPattern);
if (mainJsHits) evalHits.push(`main.js (${mainJsHits.length})`);
assert(
  evalHits.length === 0,
  `src/api/electron/main.js 中不应出现动态代码构造（运行时字符串编译）：${evalHits.join(', ')}`,
);

// ---------------------------------------------------------------------------
// 4. The one allowed inline handler must match the pinned sha256 in the policy.
// ---------------------------------------------------------------------------
const renderer = read('src/components/aigenImage/uiSchemaRenderer.js');
const handlerMatch = renderer.match(/onclick\s*=\s*"([^"]*)"/);
assert(
  Boolean(handlerMatch),
  'uiSchemaRenderer.js 中未找到 onclick="..." 内联处理器（前缀哈希断言失去依据）',
);

let computedToken = '';
if (handlerMatch) {
  const handlerCode = handlerMatch[1];
  computedToken = `sha256-${crypto.createHash('sha256').update(handlerCode, 'utf8').digest('base64')}`;
  const pinnedMatch = policy.match(/'sha256-([^']+)'/);
  assert(Boolean(pinnedMatch), "CSP 中缺少 'sha256-...' 源表达式");
  if (pinnedMatch) {
    const pinnedToken = `sha256-${pinnedMatch[1]}`;
    assert(
      pinnedToken === computedToken,
      `内联处理器哈希失配：index.html=${pinnedToken}，实测=${computedToken}（处理器文本：${JSON.stringify(
        handlerCode,
      )}）`,
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Electron overlay windows must also ship a strict CSP and no inline script.
// ---------------------------------------------------------------------------
const overlayWindows = [
  'electron/screenshotOverlay.html',
  'electron/globalCaptureWindow.html',
];
for (const relative of overlayWindows) {
  const source = read(relative);
  const overlayTag = source.match(
    /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i,
  );
  assert(Boolean(overlayTag), `${relative} 缺少 Content-Security-Policy 的 <meta>`);
  const overlayContent = overlayTag?.[0].match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const overlayPolicy = overlayContent?.[1] ?? overlayContent?.[2] ?? '';
  assert(Boolean(overlayPolicy), `${relative} 的 CSP <meta> 缺少 content 属性`);
  const overlayScriptSrc =
    overlayPolicy
      .split(';')
      .map((part) => part.trim())
      .find((part) => /^script-src\b/i.test(part)) ?? '';
  assert(Boolean(overlayScriptSrc), `${relative} 的 CSP 缺少 script-src 指令`);
  assert(
    !/'unsafe-inline'/.test(overlayScriptSrc),
    `${relative} 的 script-src 不得包含 'unsafe-inline'`,
  );
  const overlayInlineScripts = [...source.matchAll(/<script\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => !/\bsrc\s*=/i.test(tag));
  assert(
    overlayInlineScripts.length === 0,
    `${relative} 存在 ${overlayInlineScripts.length} 个内联 <script>（缺少 src=）：${overlayInlineScripts.join(
      ' | ',
    )}`,
  );
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
if (failures.length > 0) {
  console.error('CSP 静态门禁失败：');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `PASS  CSP 静态门禁：script-src 严格（无 'unsafe-inline'），` +
      `index.html 无内联脚本/事件处理器/javascript:，源码无 eval/new Function，` +
      `内联处理器哈希匹配（${computedToken}）；` +
      `覆盖窗口（screenshotOverlay / globalCaptureWindow）均无内联脚本且 script-src 严格。`,
  );
}
