import yazl from 'yazl';
import { randomUUID } from 'node:crypto';
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
import { mergeDiagnosticEvidence, summarizeBackendLog } from './diagnosticsEvidence.js';
import { serializeDiagnosticError } from '../src/utils/diagnosticError.js';
import { recordDiagnosticsLaunchVersion } from './diagnosticsLaunchVersion.js';
const DESKTOP_LOG_NAME = 'desktop.log.jsonl',
  ROTATED_DESKTOP_LOG_NAME = DESKTOP_LOG_NAME + '.1',
  INCIDENT_LOG_NAME = 'incidents.log.jsonl',
  INCIDENT_LOG_BYTES = 0x2 * 0x400 * 0x400,
  DIAGNOSTIC_README_NAME = 'README.txt',
  DIAGNOSTIC_METADATA_NAME = 'metadata.json',
  AI_DIAGNOSTICS_REPORT_NAME = 'ai-diagnostics-report.json',
  DIAGNOSTIC_PACKAGE_MANIFEST_NAME = 'package-manifest.json',
  DIAGNOSTIC_ERROR_SUMMARY_NAME = 'error-summary.json',
  DEFAULT_MAX_LOG_BYTES = 0x5 * 0x400 * 0x400,
  DEFAULT_SERVER_TAIL_BYTES = 0x400 * 0x400,
  DEFAULT_DESKTOP_TAIL_BYTES = 0x2 * 0x400 * 0x400,
  DEFAULT_ROTATED_DESKTOP_TAIL_BYTES = 0x2 * 0x400 * 0x400,
  MAX_RECENT_PROBLEMS = 0x1e,
  MAX_STRING_LENGTH = 0x7d0,
  MAX_STACK_LENGTH = 0x2710,
  MAX_ARRAY_ITEMS = 0x1e,
  MAX_OBJECT_KEYS = 0x50,
  MAX_DEPTH = 0x5,
  REDACTED = '[REDACTED]',
  SENSITIVE_KEY_RE =
    /(?:api[-_ ]?key|token|authorization|password|passwd|pwd|cdkey|secret|cookie|session|bearer|access[-_ ]?key|refresh[-_ ]?key)/i,
  PRIVATE_CONTENT_KEY_RE =
    /^(?:prompt|negativePrompt|inputText|sourceText|projectJson|canvasJson|requestBody|responseBody|rawRequest|rawResponse)$/i,
  SAFE_DIAGNOSTIC_KEYS = new Set([
    'dragFpsSessions',
    'panFpsSessions',
    'zoomFpsSessions',
    'resizeFpsSessions',
    'launchSessionId',
    'launchSessionIds',
  ]),
  SENSITIVE_TEXT_NAME = String[
    'raw'
  ]`(?:api[-_ ]?key|token|authorization|password|passwd|pwd|cdkey|secret|cookie|bearer|access[-_ ]?key|refresh[-_ ]?key|prompt|negativePrompt|inputText|sourceText|projectJson|canvasJson|requestBody|responseBody|rawRequest|rawResponse)`,
  PRIVATE_CONTENT_TEXT_NAME = String[
    'raw'
  ]`(?:prompt|negativePrompt|inputText|sourceText|projectJson|canvasJson|requestBody|responseBody|rawRequest|rawResponse)`,
  PRIVATE_CONTENT_ASSIGNMENT_RE = new RegExp(
    String['raw']`((?:["']?${PRIVATE_CONTENT_TEXT_NAME}["']?)\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\r\n]*)`,
    'gi',
  ),
  SENSITIVE_ASSIGNMENT_RE = new RegExp(
    String['raw']`((?:["']?${SENSITIVE_TEXT_NAME}["']?)\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;\]}]+)`,
    'gi',
  ),
  SENSITIVE_QUERY_RE = new RegExp(String['raw']`([?&]${SENSITIVE_TEXT_NAME}=)[^&#\s]*`, 'gi'),
  BEARER_VALUE_RE = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  COMMON_SECRET_VALUE_RE = /\b(?:sk|rk|pk)-[A-Za-z0-9_-]{8,}\b/gi;
function normalizeOneLine(_0x472fa2, _0x503c46 = '') {
  return String(_0x472fa2 ?? _0x503c46)
    ['replace'](/\s+/g, '\x20')
    ['trim']();
}
function truncateString(_0x1db625, _0x3476f7 = MAX_STRING_LENGTH) {
  const _0x5d5879 = String(_0x1db625 ?? '');
  if (_0x5d5879['length'] <= _0x3476f7) return _0x5d5879;
  return (
    _0x5d5879['slice'](0x0, _0x3476f7) + '... [truncated ' + (_0x5d5879['length'] - _0x3476f7) + ' chars]'
  );
}
function escapeRegExp(_0x410f08) {
  return String(_0x410f08 || '')['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function redactSensitiveText(_0x310e2b) {
  let _0x3ba6ba = String(_0x310e2b ?? '');
  _0x3ba6ba = _0x3ba6ba['replace'](PRIVATE_CONTENT_ASSIGNMENT_RE, '$1' + REDACTED)
    ['replace'](BEARER_VALUE_RE, 'Bearer ' + REDACTED)
    ['replace'](SENSITIVE_QUERY_RE, '$1' + REDACTED)
    ['replace'](SENSITIVE_ASSIGNMENT_RE, '$1' + REDACTED)
    ['replace'](COMMON_SECRET_VALUE_RE, REDACTED);
  const _0xf85e29 = String(os['homedir']?.() || '')['trim']();
  if (_0xf85e29) {
    const _0x468478 = new Set([_0xf85e29, _0xf85e29['replace'](/\\/g, '/')]);
    for (const _0x2ac6a8 of _0x468478) {
      if (!_0x2ac6a8) continue;
      _0x3ba6ba = _0x3ba6ba['replace'](new RegExp(escapeRegExp(_0x2ac6a8), 'gi'), '%USERPROFILE%');
    }
  }
  return _0x3ba6ba;
}
function sanitizeDiagnosticText(_0x4a4ce0, _0x2ca626 = MAX_STRING_LENGTH) {
  return truncateString(redactSensitiveText(_0x4a4ce0), _0x2ca626);
}
function isSensitiveDiagnosticKey(_0x207a0c) {
  const _0x1f646b = String(_0x207a0c || '');
  if (SAFE_DIAGNOSTIC_KEYS['has'](_0x1f646b)) return ![];
  return SENSITIVE_KEY_RE['test'](_0x1f646b) || PRIVATE_CONTENT_KEY_RE['test'](_0x1f646b);
}
export function sanitizeDiagnosticValue(_0x1d5a09, _0x1023b = {}) {
  const _0x10cdb6 = Number(_0x1023b['depth'] || 0x0) || 0x0,
    _0x2f4fef = Math['min'](0xc, Math['max'](MAX_DEPTH, Number(_0x1023b['maxDepth']) || MAX_DEPTH)),
    _0x13ad13 = String(_0x1023b['key'] || '');
  if (isSensitiveDiagnosticKey(_0x13ad13)) return REDACTED;
  if (_0x1d5a09 == null) return _0x1d5a09;
  const _0x302952 = typeof _0x1d5a09;
  if (_0x302952 === 'string')
    return sanitizeDiagnosticText(_0x1d5a09, _0x13ad13 === 'stack' ? MAX_STACK_LENGTH : MAX_STRING_LENGTH);
  if (_0x302952 === 'number' || _0x302952 === 'boolean') return _0x1d5a09;
  if (_0x302952 === 'bigint') return String(_0x1d5a09);
  if (_0x302952 === 'function') return '[Function]';
  if (_0x302952 !== 'object') return sanitizeDiagnosticText(String(_0x1d5a09));
  if (_0x10cdb6 >= _0x2f4fef) return '[MaxDepth]';
  if (_0x1d5a09 instanceof Error)
    return sanitizeDiagnosticValue(serializeDiagnosticError(_0x1d5a09), {
      depth: _0x10cdb6,
      maxDepth: _0x2f4fef,
    });
  if (Array['isArray'](_0x1d5a09)) {
    const _0x13a177 = _0x1d5a09['slice'](0x0, MAX_ARRAY_ITEMS)['map']((_0x24b00d) =>
      sanitizeDiagnosticValue(_0x24b00d, { depth: _0x10cdb6 + 0x1, maxDepth: _0x2f4fef }),
    );
    return (
      _0x1d5a09['length'] > MAX_ARRAY_ITEMS &&
        _0x13a177['push']('[truncated\x20' + (_0x1d5a09['length'] - MAX_ARRAY_ITEMS) + ' items]'),
      _0x13a177
    );
  }
  const _0x47a6fa = {},
    _0x40f316 = Object['entries'](_0x1d5a09)['slice'](0x0, MAX_OBJECT_KEYS);
  for (const [_0x3795ca, _0x4e130b] of _0x40f316) {
    _0x47a6fa[_0x3795ca] = sanitizeDiagnosticValue(_0x4e130b, {
      key: _0x3795ca,
      depth: _0x10cdb6 + 0x1,
      maxDepth: _0x2f4fef,
    });
  }
  const _0x1cc379 = Object['keys'](_0x1d5a09)['length'] - _0x40f316['length'];
  if (_0x1cc379 > 0x0) _0x47a6fa['__truncatedKeys'] = _0x1cc379;
  return _0x47a6fa;
}
export function buildDiagnosticLogEntry(_0x2068f8 = {}, _0x12566a = new Date(), _0x5a8503 = {}) {
  const _0x54b356 = normalizeOneLine(_0x2068f8['source'], 'unknown') || 'unknown',
    _0x39d0fc = normalizeOneLine(_0x2068f8['type'], 'event') || 'event',
    _0x2c2694 = normalizeOneLine(_0x2068f8['level'], 'info')['toLowerCase'](),
    _0x57deb4 = ['debug', 'info', 'warn', 'error']['includes'](_0x2c2694) ? _0x2c2694 : 'info',
    _0x19dd5a = _0x2068f8['error'] instanceof Error ? _0x2068f8['error'] : null,
    _0x1c654b = _0x2068f8['context'] || {},
    _0x348ccf =
      _0x19dd5a && typeof _0x1c654b === 'object' && !Array['isArray'](_0x1c654b)
        ? { ..._0x1c654b, error: _0x19dd5a }
        : _0x1c654b,
    _0x484838 = normalizeOneLine(_0x5a8503['launchSessionId'] || _0x2068f8['launchSessionId']),
    _0x99c543 = Number(_0x5a8503['eventSeq'] || _0x2068f8['eventSeq'] || 0x0) || 0x0;
  return {
    ts: _0x12566a['toISOString'](),
    ...(_0x484838 ? { launchSessionId: truncateString(_0x484838, 0x78) } : {}),
    ...(_0x99c543 > 0x0 ? { eventSeq: _0x99c543 } : {}),
    type: truncateString(_0x39d0fc, 0x78),
    level: _0x57deb4,
    source: truncateString(_0x54b356, 0x78),
    message: sanitizeDiagnosticText(
      _0x2068f8['message'] || _0x19dd5a?.['message'] || _0x2068f8['error'] || _0x39d0fc,
      MAX_STRING_LENGTH,
    ),
    context: sanitizeDiagnosticValue(_0x348ccf),
    stack: sanitizeDiagnosticText(_0x2068f8['stack'] || _0x19dd5a?.['stack'] || '', MAX_STACK_LENGTH),
  };
}
function ensureDir(_0x310f4a) {
  return (mkdirSync(_0x310f4a, { recursive: !![] }), _0x310f4a);
}
function safeUnlink(_0x2628b6) {
  try {
    if (existsSync(_0x2628b6)) unlinkSync(_0x2628b6);
  } catch {}
}
function rotateLogIfNeeded(_0x138659, _0x35a3f8) {
  try {
    if (!existsSync(_0x138659)) return;
    const _0x735c80 = statSync(_0x138659)['size'];
    if (_0x735c80 < _0x35a3f8) return;
    const _0x21085e = _0x138659 + '.1';
    (safeUnlink(_0x21085e), renameSync(_0x138659, _0x21085e));
  } catch {}
}
function readTailSnapshot(_0x3a9adb, _0x353631) {
  try {
    if (!_0x3a9adb || !existsSync(_0x3a9adb))
      return {
        buffer: Buffer['alloc'](0x0),
        exists: ![],
        sourceBytes: 0x0,
        includedBytes: 0x0,
        truncated: ![],
      };
    const _0x2dda23 = statSync(_0x3a9adb);
    if (!_0x2dda23['isFile']() || _0x2dda23['size'] <= 0x0)
      return {
        buffer: Buffer['alloc'](0x0),
        exists: _0x2dda23['isFile'](),
        sourceBytes: Math['max'](0x0, Number(_0x2dda23['size'] || 0x0)),
        includedBytes: 0x0,
        truncated: ![],
      };
    const _0x198606 = Math['min'](_0x2dda23['size'], _0x353631),
      _0x48c824 = Math['max'](0x0, _0x2dda23['size'] - _0x198606),
      _0x3fc199 = Buffer['alloc'](_0x198606),
      _0x1ffbb5 = openSync(_0x3a9adb, 'r');
    try {
      readSync(_0x1ffbb5, _0x3fc199, 0x0, _0x198606, _0x48c824);
    } finally {
      closeSync(_0x1ffbb5);
    }
    return {
      buffer: _0x3fc199,
      exists: !![],
      sourceBytes: _0x2dda23['size'],
      includedBytes: _0x3fc199['length'],
      truncated: _0x2dda23['size'] > _0x3fc199['length'],
    };
  } catch {
    return {
      buffer: Buffer['alloc'](0x0),
      exists: ![],
      sourceBytes: 0x0,
      includedBytes: 0x0,
      truncated: ![],
      readFailed: !![],
    };
  }
}
function parseJsonlEntries(_0xce4e2d = []) {
  const _0x5ed928 = [];
  for (const _0x25070c of _0xce4e2d) {
    const _0x441de7 = Buffer['isBuffer'](_0x25070c) ? _0x25070c['toString']('utf8')['split'](/\r?\n/) : [];
    for (const _0x4b2e25 of _0x441de7) {
      if (!_0x4b2e25['trim']()) continue;
      try {
        const _0x37ff5a = JSON['parse'](_0x4b2e25);
        if (_0x37ff5a && typeof _0x37ff5a === 'object') _0x5ed928['push'](_0x37ff5a);
      } catch {}
    }
  }
  return _0x5ed928['sort']((_0x4a3ea1, _0x489fba) =>
    String(_0x4a3ea1?.['ts'] || '')['localeCompare'](String(_0x489fba?.['ts'] || '')),
  );
}
function sanitizeStructuredLogBuffer(_0x4c0cc2) {
  if (!Buffer['isBuffer'](_0x4c0cc2) || _0x4c0cc2['length'] === 0x0) return Buffer['alloc'](0x0);
  const _0x2b0676 = [];
  for (const _0x5d9296 of _0x4c0cc2['toString']('utf8')['split'](/\r?\n/)) {
    if (!_0x5d9296['trim']()) continue;
    try {
      const _0xc7ecfb = JSON['parse'](_0x5d9296);
      _0x2b0676['push'](JSON['stringify'](sanitizeDiagnosticValue(_0xc7ecfb, { maxDepth: 0xc })));
    } catch {}
  }
  return Buffer['from'](_0x2b0676['length'] ? _0x2b0676['join']('\x0a') + '\x0a' : '', 'utf8');
}
function incrementCounter(_0x2dc6d5, _0x1e0892) {
  const _0x25c61c = normalizeOneLine(_0x1e0892, 'unknown') || 'unknown';
  _0x2dc6d5[_0x25c61c] = (_0x2dc6d5[_0x25c61c] || 0x0) + 0x1;
}
function sortCounter(_0x538314, _0x42fb6e = 0x32) {
  return Object['fromEntries'](
    Object['entries'](_0x538314)
      ['sort'](
        (_0x51314e, _0x37b9ce) =>
          _0x37b9ce[0x1] - _0x51314e[0x1] || _0x51314e[0x0]['localeCompare'](_0x37b9ce[0x0]),
      )
      ['slice'](0x0, _0x42fb6e),
  );
}
function buildErrorSummary(_0x4b3e42 = [], _0x23721c = {}) {
  const _0x24befa = {},
    _0x14201f = {},
    _0x2e600a = {},
    _0x4ac05d = new Set(),
    _0x5b06fb = new Map(),
    _0x1df2b4 = [];
  for (const _0x1cd6d0 of _0x4b3e42) {
    (incrementCounter(_0x24befa, _0x1cd6d0?.['level'] || 'info'),
      incrementCounter(_0x14201f, _0x1cd6d0?.['source'] || 'unknown'));
    if (_0x1cd6d0?.['launchSessionId']) {
      const _0x1feead = String(_0x1cd6d0['launchSessionId']);
      _0x4ac05d['add'](_0x1feead);
      const _0x4ec2b1 = _0x5b06fb['get'](_0x1feead) || {
        launchSessionId: _0x1feead,
        firstEventAt: _0x1cd6d0?.['ts'] || '',
        lastEventAt: _0x1cd6d0?.['ts'] || '',
        eventCount: 0x0,
        problemCount: 0x0,
        startedAt: '',
        endedAt: '',
      };
      ((_0x4ec2b1['lastEventAt'] = _0x1cd6d0?.['ts'] || _0x4ec2b1['lastEventAt']),
        (_0x4ec2b1['eventCount'] += 0x1));
      if (_0x1cd6d0?.['level'] === 'error' || _0x1cd6d0?.['level'] === 'warn')
        _0x4ec2b1['problemCount'] += 0x1;
      if (_0x1cd6d0?.['type'] === 'app.session_started') _0x4ec2b1['startedAt'] = _0x1cd6d0?.['ts'] || '';
      if (_0x1cd6d0?.['type'] === 'app.session_ended') _0x4ec2b1['endedAt'] = _0x1cd6d0?.['ts'] || '';
      _0x5b06fb['set'](_0x1feead, _0x4ec2b1);
    }
    if (_0x1cd6d0?.['level'] !== 'error' && _0x1cd6d0?.['level'] !== 'warn') continue;
    (incrementCounter(_0x2e600a, _0x1cd6d0?.['type'] || 'unknown'),
      _0x1df2b4['push']({
        ts: _0x1cd6d0?.['ts'] || '',
        launchSessionId: _0x1cd6d0?.['launchSessionId'] || '',
        eventSeq: Number(_0x1cd6d0?.['eventSeq'] || 0x0) || 0x0,
        type: _0x1cd6d0?.['type'] || 'unknown',
        level: _0x1cd6d0?.['level'] || 'warn',
        source: _0x1cd6d0?.['source'] || 'unknown',
        message: _0x1cd6d0?.['message'] || '',
        context: _0x1cd6d0?.['context'] || {},
        stack: sanitizeDiagnosticText(_0x1cd6d0?.['stack'] || '', 0xfa0),
      }));
  }
  return sanitizeDiagnosticValue(
    {
      schemaVersion: 0x2,
      generatedAt: _0x23721c['generatedAt'] || new Date()['toISOString'](),
      launchSessionId: _0x23721c['launchSessionId'] || '',
      eventCount: _0x4b3e42['length'],
      problemCount: _0x1df2b4['length'],
      timeRange: { first: _0x4b3e42[0x0]?.['ts'] || '', last: _0x4b3e42['at'](-0x1)?.['ts'] || '' },
      launchSessionIds: Array['from'](_0x4ac05d)['slice'](-0x14),
      launches: Array['from'](_0x5b06fb['values']())
        ['slice'](-0x14)
        ['map']((_0x56017a) => ({ ..._0x56017a, normalEndRecorded: Boolean(_0x56017a['endedAt']) })),
      levelCounts: sortCounter(_0x24befa),
      sourceCounts: sortCounter(_0x14201f),
      problemTypeCounts: sortCounter(_0x2e600a),
      recentProblems: _0x1df2b4['slice'](-MAX_RECENT_PROBLEMS),
      backend: summarizeBackendLog(_0x23721c['backendLog'] || ''),
      notes: [
        'Structured counts include retained incident evidence, deduplicated by launchSessionId and eventSeq.',
        'Backend text matches are listed separately and are not included in structured problemCount.',
        'Use launchSessionId, eventSeq, taskId and nodeId to correlate related events when available.',
        'A missing normal end is not proof of a crash: the launch may still be running or logs may be truncated.',
      ],
    },
    { maxDepth: 0xc },
  );
}
function sanitizeServerLogBuffer(_0x49e8b9) {
  if (!Buffer['isBuffer'](_0x49e8b9) || _0x49e8b9['length'] === 0x0) return Buffer['alloc'](0x0);
  return Buffer['from'](redactSensitiveText(_0x49e8b9['toString']('utf8')), 'utf8');
}
function describePackageFile(_0x43b11a, _0x34850a, _0x4351a1 = {}) {
  return {
    name: _0x43b11a,
    kind: _0x4351a1['kind'] || 'log',
    included: _0x4351a1['included'] !== ![],
    sourceBytes: Number(_0x34850a?.['sourceBytes'] || 0x0),
    includedBytes: Number(_0x4351a1['includedBytes'] ?? _0x34850a?.['includedBytes'] ?? 0x0),
    truncated: _0x34850a?.['truncated'] === !![],
    readFailed: _0x34850a?.['readFailed'] === !![],
    redacted: _0x4351a1['redacted'] === !![],
  };
}
function writeZip(_0xfab251, _0x18ea54) {
  return new Promise((_0x6ec09c, _0x101026) => {
    const _0x58b161 = createWriteStream(_0x18ea54);
    (_0x58b161['once']('close', _0x6ec09c),
      _0x58b161['once']('error', _0x101026),
      _0xfab251['outputStream']['once']('error', _0x101026),
      _0xfab251['outputStream']['pipe'](_0x58b161),
      _0xfab251['end']());
  });
}
function resolveDownloadsDir(_0x1b8cf1, _0x8b343f) {
  try {
    const _0x2e0e26 = _0x1b8cf1?.['getPath']?.('downloads');
    if (_0x2e0e26) return ensureDir(_0x2e0e26);
  } catch {}
  return ensureDir(_0x8b343f);
}
function timestampForFilename(_0xd9fc3e = new Date()) {
  const _0x1d03d1 = (_0x1912dc) => String(_0x1912dc)['padStart'](0x2, '0');
  return [
    _0xd9fc3e['getFullYear'](),
    _0x1d03d1(_0xd9fc3e['getMonth']() + 0x1),
    _0x1d03d1(_0xd9fc3e['getDate']()),
    '-',
    _0x1d03d1(_0xd9fc3e['getHours']()),
    _0x1d03d1(_0xd9fc3e['getMinutes']()),
    _0x1d03d1(_0xd9fc3e['getSeconds']()),
  ]['join']('');
}
function buildReadme() {
  return [
    'SHUO\x20Canvas\x20诊断包',
    '',
    '请将整个 ZIP 文件发送给开发者用于排查问题。',
    '本诊断包包含运行日志、错误摘要、环境摘要和生成瞬间的脱敏状态快照。',
    '不包含项目文件、画布正文、素材、提示词、API Key 或授权码。',
    'package-manifest.json 会说明日志时间范围、截断和脱敏状态。',
    '',
  ]['join']('\x0a');
}
export function createDiagnosticsManager(_0x5b58a7 = {}) {
  const _0x373c22 = ensureDir(_0x5b58a7['logDir']),
    _0x524fc1 = ensureDir(_0x5b58a7['diagnosticsDir'] || path['join'](_0x373c22, 'diagnostics')),
    _0x33f38f = _0x5b58a7['desktopLogPath'] || path['join'](_0x373c22, DESKTOP_LOG_NAME),
    _0x683f71 = path['join'](_0x373c22, INCIDENT_LOG_NAME),
    _0x5cd820 = _0x5b58a7['serverLogPath'] || '',
    _0x9daff0 = Number(_0x5b58a7['maxLogBytes'] || DEFAULT_MAX_LOG_BYTES) || DEFAULT_MAX_LOG_BYTES,
    _0x30f6f2 = normalizeOneLine(_0x5b58a7['launchSessionId'] || randomUUID()),
    _0x16f636 = _0x5b58a7['app'] || null,
    _0x300474 = typeof _0x5b58a7['getMetadata'] === 'function' ? _0x5b58a7['getMetadata'] : () => ({});
  let _0x24e3fc = 0x0,
    _0x130815 = ![],
    _0x3119f6 = ![],
    _0x2b3a83 = null;
  const _0x1f3d68 = [];
  function _0x1c4638(_0x3fdeda = {}) {
    try {
      (ensureDir(_0x373c22), rotateLogIfNeeded(_0x33f38f, _0x9daff0), (_0x24e3fc += 0x1));
      const _0xfd5c34 = buildDiagnosticLogEntry(_0x3fdeda, new Date(), {
        launchSessionId: _0x30f6f2,
        eventSeq: _0x24e3fc,
      });
      _0x2b3a83 &&
        ['app.startup_failed', 'chrome_shell.startup_failed', 'renderer.chrome_shell_startup_failed'][
          'includes'
        ](_0xfd5c34['type']) &&
        (_0xfd5c34['context'] = { ..._0xfd5c34['context'], launchVersion: _0x2b3a83 });
      appendFileSync(_0x33f38f, JSON['stringify'](_0xfd5c34) + '\x0a', 'utf8');
      if (_0xfd5c34['level'] === 'warn' || _0xfd5c34['level'] === 'error')
        try {
          (rotateLogIfNeeded(_0x683f71, INCIDENT_LOG_BYTES),
            appendFileSync(
              _0x683f71,
              JSON['stringify']({ event: _0xfd5c34, precedingEvents: _0x1f3d68 }) + '\x0a',
              'utf8',
            ));
        } catch {}
      _0x1f3d68['push'](_0xfd5c34);
      if (_0x1f3d68['length'] > 0x8) _0x1f3d68['shift']();
      return { ok: !![] };
    } catch (_0x12e6d4) {
      return { ok: ![], error: String(_0x12e6d4?.['message'] || _0x12e6d4) };
    }
  }
  function _0x46662c(_0x5d97c1 = new Date()) {
    const _0x36b9c9 = 'AI-CanvasPro-Diagnostics-' + timestampForFilename(_0x5d97c1) + '.zip';
    return path['join'](resolveDownloadsDir(_0x16f636, _0x524fc1), _0x36b9c9);
  }
  async function _0x1e85ba(_0x23200d = {}) {
    const _0x1f9eea = new Date();
    _0x1c4638({
      type: 'diagnostics.package_collecting',
      level: 'info',
      source: 'main',
      message: 'Diagnostics package collection started',
    });
    const _0x5a62ce = String(_0x23200d?.['outputPath'] || '')['trim']();
    if (_0x5a62ce && !path['isAbsolute'](_0x5a62ce))
      throw new Error('Diagnostics output path must be absolute');
    const _0x400e0d = _0x5a62ce ? path['resolve'](_0x5a62ce) : _0x46662c(_0x1f9eea);
    ensureDir(path['dirname'](_0x400e0d));
    const _0x5b4b23 = path['basename'](_0x400e0d),
      _0x3f530e = await Promise['resolve'](_0x300474()),
      _0x16e1a6 = sanitizeDiagnosticValue({
        generatedAt: _0x1f9eea['toISOString'](),
        host: { platform: process['platform'], arch: process['arch'], osRelease: os['release']() },
        diagnostics: { schemaVersion: 0x2, launchSessionId: _0x30f6f2, launchVersion: _0x2b3a83 },
        ...(_0x3f530e || {}),
      }),
      _0x9eeb7c = _0x33f38f + '.1',
      _0x1dccd0 = readTailSnapshot(_0x9eeb7c, DEFAULT_ROTATED_DESKTOP_TAIL_BYTES),
      _0x14321f = readTailSnapshot(_0x33f38f, DEFAULT_DESKTOP_TAIL_BYTES),
      _0x403727 = readTailSnapshot(_0x5cd820, DEFAULT_SERVER_TAIL_BYTES),
      _0x59bbfb = sanitizeStructuredLogBuffer(_0x1dccd0['buffer']),
      _0x211512 = sanitizeStructuredLogBuffer(_0x14321f['buffer']),
      _0x3a95e9 = sanitizeServerLogBuffer(_0x403727['buffer']),
      _0x4b565f = [INCIDENT_LOG_NAME, INCIDENT_LOG_NAME + '.1']['map']((_0x2b617c) => {
        const _0x4e50c3 = readTailSnapshot(path['join'](_0x373c22, _0x2b617c), INCIDENT_LOG_BYTES);
        return {
          name: _0x2b617c,
          snapshot: _0x4e50c3,
          buffer: sanitizeStructuredLogBuffer(_0x4e50c3['buffer']),
        };
      }),
      _0xab2713 = mergeDiagnosticEvidence(
        parseJsonlEntries([_0x59bbfb, _0x211512]),
        parseJsonlEntries(_0x4b565f['map']((_0x36e046) => _0x36e046['buffer'])),
      ),
      _0x5142e8 = buildErrorSummary(_0xab2713, {
        generatedAt: _0x1f9eea['toISOString'](),
        launchSessionId: _0x30f6f2,
        backendLog: _0x3a95e9['toString']('utf8'),
      }),
      _0x7eb24e =
        _0x23200d?.['aiAnalysisReport'] && typeof _0x23200d['aiAnalysisReport'] === 'object'
          ? sanitizeDiagnosticValue(_0x23200d['aiAnalysisReport'], { maxDepth: 0xc })
          : null,
      _0x22be56 = Buffer['from'](JSON['stringify'](_0x16e1a6, null, 0x2) + '\x0a', 'utf8'),
      _0x22fae2 = Buffer['from'](JSON['stringify'](_0x5142e8, null, 0x2) + '\x0a', 'utf8'),
      _0x591d06 = _0x7eb24e ? Buffer['from'](JSON['stringify'](_0x7eb24e, null, 0x2) + '\x0a', 'utf8') : null,
      _0x1f2b65 = Buffer['from'](buildReadme(), 'utf8'),
      _0x48d3cf = [
        describePackageFile(DIAGNOSTIC_METADATA_NAME, null, {
          kind: 'environment',
          includedBytes: _0x22be56['length'],
        }),
        describePackageFile(DIAGNOSTIC_ERROR_SUMMARY_NAME, null, {
          kind: 'summary',
          includedBytes: _0x22fae2['length'],
        }),
        describePackageFile(DESKTOP_LOG_NAME, _0x14321f, {
          kind: 'structured-log',
          includedBytes: _0x211512['length'],
          redacted: !![],
        }),
        describePackageFile(ROTATED_DESKTOP_LOG_NAME, _0x1dccd0, {
          kind: 'structured-log-archive',
          included: _0x1dccd0['exists'],
          includedBytes: _0x59bbfb['length'],
          redacted: !![],
        }),
        describePackageFile('server.log', _0x403727, {
          kind: 'backend-log',
          includedBytes: _0x3a95e9['length'],
          redacted: !![],
        }),
        describePackageFile(DIAGNOSTIC_README_NAME, null, {
          kind: 'instructions',
          includedBytes: _0x1f2b65['length'],
        }),
      ];
    for (const _0x433d63 of _0x4b565f) {
      _0x48d3cf['push'](
        describePackageFile(_0x433d63['name'], _0x433d63['snapshot'], {
          kind: 'incident-evidence',
          included: _0x433d63['snapshot']['exists'],
          includedBytes: _0x433d63['buffer']['length'],
          redacted: !![],
        }),
      );
    }
    _0x591d06 &&
      _0x48d3cf['splice'](
        0x1,
        0x0,
        describePackageFile(AI_DIAGNOSTICS_REPORT_NAME, null, {
          kind: 'runtime-snapshot',
          includedBytes: _0x591d06['length'],
        }),
      );
    const _0x53c557 = sanitizeDiagnosticValue({
        schemaVersion: 0x1,
        generatedAt: _0x1f9eea['toISOString'](),
        launchSessionId: _0x30f6f2,
        limits: {
          desktopTailBytes: DEFAULT_DESKTOP_TAIL_BYTES,
          rotatedDesktopTailBytes: DEFAULT_ROTATED_DESKTOP_TAIL_BYTES,
          serverTailBytes: DEFAULT_SERVER_TAIL_BYTES,
          recentProblems: MAX_RECENT_PROBLEMS,
          incidentTailBytesPerFile: INCIDENT_LOG_BYTES,
          precedingEventsPerIncident: 0x8,
        },
        structuredLogRange: _0x5142e8['timeRange'],
        files: _0x48d3cf,
        privacy: {
          structuredLogsRedacted: !![],
          backendLogRedactedDuringPackaging: !![],
          projectFilesIncluded: ![],
          assetFilesIncluded: ![],
          promptsIncluded: ![],
        },
      }),
      _0x4be43e = new yazl['ZipFile']();
    (_0x4be43e['addBuffer'](_0x22be56, DIAGNOSTIC_METADATA_NAME),
      _0x4be43e['addBuffer'](
        Buffer['from'](JSON['stringify'](_0x53c557, null, 0x2) + '\x0a', 'utf8'),
        DIAGNOSTIC_PACKAGE_MANIFEST_NAME,
      ),
      _0x4be43e['addBuffer'](_0x22fae2, DIAGNOSTIC_ERROR_SUMMARY_NAME));
    if (_0x591d06) _0x4be43e['addBuffer'](_0x591d06, AI_DIAGNOSTICS_REPORT_NAME);
    _0x4be43e['addBuffer'](_0x211512, DESKTOP_LOG_NAME);
    _0x1dccd0['exists'] && _0x4be43e['addBuffer'](_0x59bbfb, ROTATED_DESKTOP_LOG_NAME);
    _0x4be43e['addBuffer'](_0x3a95e9, 'server.log');
    for (const _0xf14461 of _0x4b565f) {
      if (_0xf14461['snapshot']['exists']) _0x4be43e['addBuffer'](_0xf14461['buffer'], _0xf14461['name']);
    }
    _0x4be43e['addBuffer'](_0x1f2b65, DIAGNOSTIC_README_NAME);
    try {
      return (
        await writeZip(_0x4be43e, _0x400e0d),
        _0x1c4638({
          type: 'diagnostics.package_created',
          level: 'info',
          source: 'main',
          message: 'Diagnostics package created',
          context: { filename: _0x5b4b23, outputDirectory: _0x5a62ce ? 'user-selected' : 'downloads' },
        }),
        { ok: !![], path: _0x400e0d, filename: _0x5b4b23 }
      );
    } catch (_0x5470c6) {
      _0x1c4638({
        type: 'diagnostics.package_failed',
        level: 'error',
        source: 'main',
        message: 'Diagnostics package failed',
        error: _0x5470c6,
      });
      throw _0x5470c6;
    }
  }
  function _0x38afe4() {
    (ensureDir(_0x373c22),
      !existsSync(_0x33f38f) && writeFileSync(_0x33f38f, '', 'utf8'),
      !_0x130815 &&
        ((_0x130815 = !![]),
        (_0x2b3a83 = recordDiagnosticsLaunchVersion({ logDir: _0x373c22, app: _0x16f636 })),
        _0x1c4638({
          type: 'app.session_started',
          level: 'info',
          source: 'main',
          message: 'Desktop application session started',
          context: {
            pid: process['pid'],
            packaged: _0x16f636?.['isPackaged'] === !![],
            launchVersion: _0x2b3a83,
          },
        }),
        typeof _0x16f636?.['once'] === 'function' &&
          _0x16f636['once']('before-quit', () => {
            if (_0x3119f6) return;
            ((_0x3119f6 = !![]),
              _0x1c4638({
                type: 'app.session_ended',
                level: 'info',
                source: 'main',
                message: 'Desktop application session ended',
              }));
          })));
  }
  return {
    launchSessionId: _0x30f6f2,
    logDir: _0x373c22,
    diagnosticsDir: _0x524fc1,
    desktopLogPath: _0x33f38f,
    serverLogPath: _0x5cd820,
    ensureInitialFiles: _0x38afe4,
    logEvent: _0x1c4638,
    getSuggestedPackagePath: _0x46662c,
    createPackage: _0x1e85ba,
  };
}
