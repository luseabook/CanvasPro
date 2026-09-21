import yazl from 'yazl';
import {
  appendFileSync,
  closeSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const DESKTOP_LOG_NAME = 'desktop.log.jsonl',
  DIAGNOSTIC_README_NAME = 'README.txt',
  DIAGNOSTIC_METADATA_NAME = 'metadata.json',
  AI_DIAGNOSTICS_REPORT_NAME = 'ai-diagnostics-report.json',
  DEFAULT_MAX_LOG_BYTES = 5 * 0x400 * 0x400,
  DEFAULT_SERVER_TAIL_BYTES = 0x400 * 0x400,
  DEFAULT_DESKTOP_TAIL_BYTES = 2 * 0x400 * 0x400,
  MAX_STRING_LENGTH = 0x7d0,
  MAX_STACK_LENGTH = 0x2710,
  MAX_ARRAY_ITEMS = 30,
  MAX_OBJECT_KEYS = 80,
  MAX_DEPTH = 5,
  REDACTED = '[REDACTED]',
  SENSITIVE_KEY_RE =
    /(?:api[-_ ]?key|token|authorization|password|passwd|pwd|cdkey|secret|cookie|session|bearer|access[-_ ]?key|refresh[-_ ]?key)/i,
  SAFE_DIAGNOSTIC_KEYS = new Set([
    'dragFpsSessions',
    'panFpsSessions',
    'zoomFpsSessions',
    'resizeFpsSessions',
  ]);
function normalizeOneLine(_0x3b0c7e, _0x2d44fc = '') {
  return String(_0x3b0c7e ?? _0x2d44fc)
    .replace(/\s+/g, ' ')
    .trim();
}
function truncateString(_0x11835d, _0x4a5489 = MAX_STRING_LENGTH) {
  const _0x3b593b = String(_0x11835d ?? '');
  if (_0x3b593b.length <= _0x4a5489) return _0x3b593b;
  return _0x3b593b.slice(0, _0x4a5489) + '... [truncated ' + (_0x3b593b.length - _0x4a5489) + ' chars]';
}
function sanitizeError(_0x52e7d9) {
  return {
    name: truncateString(_0x52e7d9?.name || 'Error', 160),
    message: truncateString(_0x52e7d9?.message || String(_0x52e7d9 || ''), MAX_STRING_LENGTH),
    stack: truncateString(_0x52e7d9?.stack || '', MAX_STACK_LENGTH),
  };
}
export function sanitizeDiagnosticValue(_0x5d919e, _0x5790cd = {}) {
  const _0x401146 = Number(_0x5790cd.depth || 0) || 0,
    _0x200039 = String(_0x5790cd.key || '');
  if (!SAFE_DIAGNOSTIC_KEYS.has(_0x200039) && SENSITIVE_KEY_RE.test(_0x200039)) return REDACTED;
  if (_0x5d919e instanceof Error) return sanitizeError(_0x5d919e);
  if (_0x5d919e == null) return _0x5d919e;
  const _0x4fde0f = typeof _0x5d919e;
  if (_0x4fde0f === 'string') return truncateString(_0x5d919e);
  if (_0x4fde0f === 'number' || _0x4fde0f === 'boolean') return _0x5d919e;
  if (_0x4fde0f === 'bigint') return String(_0x5d919e);
  if (_0x4fde0f === 'function') return '[Function]';
  if (_0x4fde0f !== 'object') return truncateString(String(_0x5d919e));
  if (_0x401146 >= MAX_DEPTH) return '[MaxDepth]';
  if (Array.isArray(_0x5d919e)) {
    const _0x5f4cf4 = _0x5d919e
      .slice(0, MAX_ARRAY_ITEMS)
      .map((_0x24520d) => sanitizeDiagnosticValue(_0x24520d, { depth: _0x401146 + 1 }));
    return (
      _0x5d919e.length > MAX_ARRAY_ITEMS &&
        _0x5f4cf4.push('[truncated ' + (_0x5d919e.length - MAX_ARRAY_ITEMS) + ' items]'),
      _0x5f4cf4
    );
  }
  const _0x3e3d43 = {},
    _0x30bc35 = Object.entries(_0x5d919e).slice(0, MAX_OBJECT_KEYS);
  for (const [_0x2cdd69, _0x5398dc] of _0x30bc35) {
    _0x3e3d43[_0x2cdd69] = sanitizeDiagnosticValue(_0x5398dc, { key: _0x2cdd69, depth: _0x401146 + 1 });
  }
  const _0x23820c = Object.keys(_0x5d919e).length - _0x30bc35.length;
  if (_0x23820c > 0) _0x3e3d43.__truncatedKeys = _0x23820c;
  return _0x3e3d43;
}
export function buildDiagnosticLogEntry(_0x211fae = {}, _0x31e1de = new Date()) {
  const _0x3f711b = normalizeOneLine(_0x211fae.source, 'unknown') || 'unknown',
    _0x127aa0 = normalizeOneLine(_0x211fae.type, 'event') || 'event',
    _0x241f4d = normalizeOneLine(_0x211fae.level, 'info').toLowerCase(),
    _0x36ff63 = ['debug', 'info', 'warn', 'error'].includes(_0x241f4d) ? _0x241f4d : 'info',
    _0x1ba8d9 = _0x211fae.error instanceof Error ? _0x211fae.error : null;
  return {
    ts: _0x31e1de.toISOString(),
    type: truncateString(_0x127aa0, 120),
    level: _0x36ff63,
    source: truncateString(_0x3f711b, 120),
    message: truncateString(
      _0x211fae.message || _0x1ba8d9?.message || _0x211fae.error || _0x127aa0,
      MAX_STRING_LENGTH,
    ),
    context: sanitizeDiagnosticValue(_0x211fae.context || {}),
    stack: truncateString(_0x211fae.stack || _0x1ba8d9?.stack || '', MAX_STACK_LENGTH),
  };
}
function ensureDir(_0x58f84d) {
  return (mkdirSync(_0x58f84d, { recursive: true }), _0x58f84d);
}
function safeUnlink(_0x29b239) {
  try {
    if (existsSync(_0x29b239)) unlinkSync(_0x29b239);
  } catch {}
}
function rotateLogIfNeeded(_0x56933d, _0x197dcb) {
  try {
    if (!existsSync(_0x56933d)) return;
    const _0x12c454 = statSync(_0x56933d).size;
    if (_0x12c454 < _0x197dcb) return;
    const _0x345497 = _0x56933d + '.1';
    (safeUnlink(_0x345497), renameSync(_0x56933d, _0x345497));
  } catch {}
}
function readTailBuffer(_0x59c186, _0x4d4baa) {
  try {
    if (!_0x59c186 || !existsSync(_0x59c186)) return Buffer.alloc(0);
    const _0xf94437 = statSync(_0x59c186);
    if (!_0xf94437.isFile() || _0xf94437.size <= 0) return Buffer.alloc(0);
    const _0x17ed1c = Math.min(_0xf94437.size, _0x4d4baa),
      _0x5f5c71 = Math.max(0, _0xf94437.size - _0x17ed1c),
      _0x448a13 = Buffer.alloc(_0x17ed1c),
      _0x2c94d7 = openSync(_0x59c186, 'r');
    try {
      readSync(_0x2c94d7, _0x448a13, 0, _0x17ed1c, _0x5f5c71);
    } finally {
      closeSync(_0x2c94d7);
    }
    return _0x448a13;
  } catch {
    return Buffer.alloc(0);
  }
}
function writeZip(_0x4ecb4f, _0x758904) {
  return new Promise((_0x5a13c2, _0x2aa662) => {
    const _0x23d747 = createWriteStream(_0x758904);
    (_0x23d747.once('close', _0x5a13c2),
      _0x23d747.once('error', _0x2aa662),
      _0x4ecb4f.outputStream.once('error', _0x2aa662),
      _0x4ecb4f.outputStream.pipe(_0x23d747),
      _0x4ecb4f.end());
  });
}
function resolveDownloadsDir(_0x1762ce, _0x67fa21) {
  try {
    const _0x270a82 = _0x1762ce?.getPath?.('downloads');
    if (_0x270a82) return ensureDir(_0x270a82);
  } catch {}
  return ensureDir(_0x67fa21);
}
function timestampForFilename(_0x2035f8 = new Date()) {
  const _0x898d51 = (_0x3d16e0) => String(_0x3d16e0).padStart(2, '0');
  return [
    _0x2035f8.getFullYear(),
    _0x898d51(_0x2035f8.getMonth() + 1),
    _0x898d51(_0x2035f8.getDate()),
    '-',
    _0x898d51(_0x2035f8.getHours()),
    _0x898d51(_0x2035f8.getMinutes()),
    _0x898d51(_0x2035f8.getSeconds()),
  ].join('');
}
function buildReadme() {
  return [
    'AI CanvasPro 诊断包',
    '',
    '请将整个 ZIP 文件发送给开发者用于排查问题。',
    '本诊断包只包含运行日志和环境摘要，不包含项目文件、画布内容、素材、API Key 或授权码。',
    '',
  ].join('\n');
}
export function createDiagnosticsManager(_0x51729c = {}) {
  const _0x4e22b6 = ensureDir(_0x51729c.logDir),
    _0x210c48 = ensureDir(_0x51729c.diagnosticsDir || path.join(_0x4e22b6, 'diagnostics')),
    _0x5eaf6b = _0x51729c.desktopLogPath || path.join(_0x4e22b6, DESKTOP_LOG_NAME),
    _0x5085e5 = _0x51729c.serverLogPath || '',
    _0x1735a3 = Number(_0x51729c.maxLogBytes || DEFAULT_MAX_LOG_BYTES) || DEFAULT_MAX_LOG_BYTES,
    _0x4ae02b = _0x51729c.app || null,
    _0x325cb0 = typeof _0x51729c.getMetadata === 'function' ? _0x51729c.getMetadata : () => ({});
  function _0x15a32b(_0x56136d = {}) {
    try {
      (ensureDir(_0x4e22b6), rotateLogIfNeeded(_0x5eaf6b, _0x1735a3));
      const _0x4abd65 = buildDiagnosticLogEntry(_0x56136d);
      return (appendFileSync(_0x5eaf6b, JSON.stringify(_0x4abd65) + '\n', 'utf8'), { ok: true });
    } catch (_0x3849c2) {
      return { ok: false, error: String(_0x3849c2?.message || _0x3849c2) };
    }
  }
  async function _0x34cd01(_0x54afdf = {}) {
    const _0x2eeb24 = new Date(),
      _0x25e502 = 'AI-CanvasPro-Diagnostics-' + timestampForFilename(_0x2eeb24) + '.zip',
      _0x205df8 = resolveDownloadsDir(_0x4ae02b, _0x210c48),
      _0x5ab4d0 = path.join(_0x205df8, _0x25e502),
      _0x222fbc = await Promise.resolve(_0x325cb0()),
      _0x2a3e67 = sanitizeDiagnosticValue({
        generatedAt: _0x2eeb24.toISOString(),
        host: { platform: process.platform, arch: process.arch, osRelease: os.release() },
        ...(_0x222fbc || {}),
      }),
      _0x14f5c2 = new yazl['ZipFile']();
    _0x14f5c2.addBuffer(
      Buffer.from(JSON.stringify(_0x2a3e67, null, 2) + '\n', 'utf8'),
      DIAGNOSTIC_METADATA_NAME,
    );
    if (_0x54afdf?.aiAnalysisReport && typeof _0x54afdf.aiAnalysisReport === 'object') {
      const _0xfba782 = sanitizeDiagnosticValue(_0x54afdf.aiAnalysisReport);
      _0x14f5c2.addBuffer(
        Buffer.from(JSON.stringify(_0xfba782, null, 2) + '\n', 'utf8'),
        AI_DIAGNOSTICS_REPORT_NAME,
      );
    }
    const _0x3762cd = readTailBuffer(_0x5eaf6b, DEFAULT_DESKTOP_TAIL_BYTES);
    _0x14f5c2.addBuffer(_0x3762cd.length ? _0x3762cd : Buffer.from('', 'utf8'), DESKTOP_LOG_NAME);
    const _0x24386b = readTailBuffer(_0x5085e5, DEFAULT_SERVER_TAIL_BYTES);
    (_0x14f5c2.addBuffer(_0x24386b.length ? _0x24386b : Buffer.from('', 'utf8'), 'server.log'),
      _0x14f5c2.addBuffer(Buffer.from(buildReadme(), 'utf8'), DIAGNOSTIC_README_NAME));
    try {
      return (
        await writeZip(_0x14f5c2, _0x5ab4d0),
        _0x15a32b({
          type: 'diagnostics.package_created',
          level: 'info',
          source: 'main',
          message: 'Diagnostics package created',
          context: { outputPath: _0x5ab4d0 },
        }),
        { ok: true, path: _0x5ab4d0, filename: _0x25e502 }
      );
    } catch (_0x59f4b4) {
      _0x15a32b({
        type: 'diagnostics.package_failed',
        level: 'error',
        source: 'main',
        message: 'Diagnostics package failed',
        error: _0x59f4b4,
      });
      throw _0x59f4b4;
    }
  }
  function _0x180cf7() {
    (ensureDir(_0x4e22b6), !existsSync(_0x5eaf6b) && writeFileSync(_0x5eaf6b, '', 'utf8'));
  }
  return {
    logDir: _0x4e22b6,
    diagnosticsDir: _0x210c48,
    desktopLogPath: _0x5eaf6b,
    serverLogPath: _0x5085e5,
    ensureInitialFiles: _0x180cf7,
    logEvent: _0x15a32b,
    createPackage: _0x34cd01,
  };
}
