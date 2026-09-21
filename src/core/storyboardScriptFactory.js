import { t } from '../i18n/index.js';
export const STORYBOARD_SCRIPT_NODE_TYPE = 'storyboard-script';
export const STORYBOARD_SCRIPT_DEFAULT_NAME = '分镜脚本';
export const STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE = 'list';
export const STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE = 'image';
export const STORYBOARD_SCRIPT_TEXT_PROVIDER = 'volcengine';
export const STORYBOARD_SCRIPT_TEXT_MODEL = 'volcengine/doubao-seed-2-0-pro-260215';
export const STORYBOARD_SCRIPT_DEFAULT_SIZE = Object.freeze({ width: 0x400, height: 0x240 });
function storyboardScriptText(_0x137cfe, _0x653b0e = {}) {
  return t('storyboardScript.' + _0x137cfe, _0x653b0e);
}
export function getStoryboardScriptDefaultName() {
  return storyboardScriptText('defaultName');
}
const STORYBOARD_SCRIPT_COLUMN_LABELS = Object.freeze([
  '镜号',
  '时长',
  '景别',
  '场景',
  '画面描述',
  '角色',
  '角色描述',
  '角色动作',
  '情绪',
  '角色图',
  '参考',
  '图片提示词',
  '视频提示词',
  '对白',
  '音效',
]);
export const STORYBOARD_SCRIPT_COLUMNS = Object.freeze(
  STORYBOARD_SCRIPT_COLUMN_LABELS.map((_0x379d60) => Object.freeze({ key: _0x379d60, label: _0x379d60 })),
);
export const STORYBOARD_SCRIPT_TABLE_EXPORT_MIME = 'text/csv;charset=utf-8';
const STORYBOARD_SCRIPT_IMAGE_MODE_COLUMN_KEYS = new Set([
    '镜号',
    '时长',
    '景别',
    '场景',
    '画面描述',
    '角色描述',
    '角色动作',
    '情绪',
    '角色图',
    '参考',
    '图片提示词',
  ]),
  STORYBOARD_SCRIPT_VIDEO_MODE_COLUMN_KEYS = new Set([
    '镜号',
    '时长',
    '景别',
    '场景',
    '画面描述',
    '角色描述',
    '角色动作',
    '情绪',
    '角色图',
    '参考',
    '视频提示词',
    '对白',
    '音效',
  ]),
  STORYBOARD_SCRIPT_ALWAYS_VISIBLE_COLUMN_KEYS = new Set(['镜号']),
  STORYBOARD_SCRIPT_VIEW_MODES = new Set(['list', 'card']),
  STORYBOARD_SCRIPT_MEDIA_MODES = new Set(['image', 'video']),
  STORYBOARD_SCRIPT_SCHEMA_VERSION = 'storyboard-script.v1';
export function normalizeStoryboardScriptViewMode(_0x5716de) {
  const _0x5c983d = String(_0x5716de || '').trim();
  return STORYBOARD_SCRIPT_VIEW_MODES.has(_0x5c983d) ? _0x5c983d : STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE;
}
export function normalizeStoryboardScriptMediaMode(_0x4f1358) {
  const _0x386a58 = String(_0x4f1358 || '').trim();
  return STORYBOARD_SCRIPT_MEDIA_MODES.has(_0x386a58) ? _0x386a58 : STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE;
}
function getStoryboardScriptAllowedColumnKeys(_0x4a43d9) {
  return normalizeStoryboardScriptMediaMode(_0x4a43d9) === 'video'
    ? STORYBOARD_SCRIPT_VIDEO_MODE_COLUMN_KEYS
    : STORYBOARD_SCRIPT_IMAGE_MODE_COLUMN_KEYS;
}
function hasStoryboardScriptColumnValue(_0x225b1a, _0x14f8e3) {
  const _0x40b104 = String(_0x14f8e3 || '');
  return (Array.isArray(_0x225b1a) ? _0x225b1a : []).some((_0x23db5f) => {
    if (!_0x23db5f || typeof _0x23db5f !== 'object' || Array.isArray(_0x23db5f)) return false;
    return formatTableCellValue(_0x23db5f[_0x40b104]).trim().length > 0;
  });
}
export function getStoryboardScriptDisplayColumns({
  mediaMode: mediaMode = STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE,
  rows: rows = [],
} = {}) {
  const _0x524cb2 = getStoryboardScriptAllowedColumnKeys(mediaMode),
    _0x569373 = Array.isArray(rows) ? rows : normalizeStoryboardScriptRows(rows);
  return STORYBOARD_SCRIPT_COLUMNS.filter((_0x1d0a89) => {
    if (!_0x524cb2.has(_0x1d0a89.key)) return false;
    if (STORYBOARD_SCRIPT_ALWAYS_VISIBLE_COLUMN_KEYS.has(_0x1d0a89.key)) return true;
    return hasStoryboardScriptColumnValue(_0x569373, _0x1d0a89.key);
  });
}
export function normalizeStoryboardScriptSelectedRowIndexes(_0x463db5, _0xf726f1 = 0) {
  if (!Array.isArray(_0x463db5)) return [];
  const _0x1b0d13 = Number.isFinite(_0xf726f1) ? Math.max(0, Math.trunc(_0xf726f1)) : 0,
    _0xa02211 = new Set(),
    _0x16954f = [];
  return (
    _0x463db5.forEach((_0x150a31) => {
      const _0x4fad3e = Number(_0x150a31);
      if (!Number.isInteger(_0x4fad3e) || _0x4fad3e < 0 || _0x4fad3e >= _0x1b0d13) return;
      if (_0xa02211.has(_0x4fad3e)) return;
      (_0xa02211.add(_0x4fad3e), _0x16954f.push(_0x4fad3e));
    }),
    _0x16954f
  );
}
function parseJsonRows(_0x365255) {
  if (typeof _0x365255 !== 'string') return _0x365255;
  const _0x5005a5 = _0x365255.trim();
  if (!_0x5005a5) return [];
  try {
    return JSON.parse(_0x5005a5);
  } catch {
    return [];
  }
}
function parseJsonObject(_0x13f42f) {
  if (_0x13f42f && typeof _0x13f42f === 'object' && !Array.isArray(_0x13f42f)) return _0x13f42f;
  if (typeof _0x13f42f !== 'string') return null;
  const _0x1a1173 = _0x13f42f.trim();
  if (!_0x1a1173) return null;
  try {
    const _0x3e7d1f = JSON.parse(_0x1a1173);
    return _0x3e7d1f && typeof _0x3e7d1f === 'object' && !Array.isArray(_0x3e7d1f) ? _0x3e7d1f : null;
  } catch {
    return null;
  }
}
function pickRowsContainer(_0x3b62b2) {
  const _0x2fb13a = parseJsonRows(_0x3b62b2);
  if (Array.isArray(_0x2fb13a)) return _0x2fb13a;
  if (!_0x2fb13a || typeof _0x2fb13a !== 'object') return [];
  if (Array.isArray(_0x2fb13a.rows)) return _0x2fb13a.rows;
  if (Array.isArray(_0x2fb13a.shots)) return _0x2fb13a.shots;
  if (Array.isArray(_0x2fb13a.scenes)) return _0x2fb13a.scenes;
  if (Array.isArray(_0x2fb13a.items)) return _0x2fb13a.items;
  return [];
}
function normalizeFiniteNumber(_0x53a28d) {
  const _0x4a7adc = Number(_0x53a28d);
  return Number.isFinite(_0x4a7adc) ? _0x4a7adc : null;
}
function normalizePositiveDimension(_0x1e79f, _0x2fb23f) {
  const _0x14d22f = Number(_0x1e79f);
  return Number.isFinite(_0x14d22f) && _0x14d22f > 0 ? _0x14d22f : _0x2fb23f;
}
export function resolveStoryboardScriptResizeMinSize(_0x970a38 = {}) {
  return {
    width: normalizePositiveDimension(_0x970a38?.resizeMinWidth, STORYBOARD_SCRIPT_DEFAULT_SIZE.width),
    height: normalizePositiveDimension(_0x970a38?.resizeMinHeight, STORYBOARD_SCRIPT_DEFAULT_SIZE.height),
  };
}
function parseClockDurationSeconds(_0x426bf3) {
  const _0x4d8d30 = String(_0x426bf3 || '')
    .trim()
    .split(':');
  if (_0x4d8d30.length < 2 || _0x4d8d30.length > 3) return null;
  const _0x225c1e = _0x4d8d30.map((_0x128f57) => Number(_0x128f57));
  if (_0x225c1e.some((_0x193949) => !Number.isFinite(_0x193949) || _0x193949 < 0)) return null;
  if (_0x225c1e.length === 2) return _0x225c1e[0] * 60 + _0x225c1e[1];
  return _0x225c1e[0] * 0xe10 + _0x225c1e[1] * 60 + _0x225c1e[2];
}
function parseDurationSeconds(_0x29dc22) {
  const _0x3483fd = normalizeFiniteNumber(_0x29dc22);
  if (_0x3483fd != null) return _0x3483fd;
  const _0xdf4c39 = String(_0x29dc22 || '').trim();
  if (!_0xdf4c39) return null;
  const _0x40d0e4 = parseClockDurationSeconds(_0xdf4c39);
  if (_0x40d0e4 != null) return _0x40d0e4;
  const _0x43480b = [..._0xdf4c39.matchAll(/\d+(?:\.\d+)?/g)].map((_0x57fcdb) => Number(_0x57fcdb[0]));
  if (_0x43480b.length === 0) return null;
  const _0x4f66e2 = /[-~～—–至到]/.test(_0xdf4c39) && _0x43480b.length >= 2;
  if (_0x4f66e2) return (_0x43480b[0] + _0x43480b[1]) / 2;
  return _0x43480b[0];
}
function getRowsTotalDurationSeconds(_0x354170) {
  const _0x463ead = _0x354170.reduce((_0x1de20b, _0x2a13a5) => {
    const _0x4986a0 = parseDurationSeconds(
      _0x2a13a5?.['时长'] ?? _0x2a13a5?.duration ?? _0x2a13a5?.durationText,
    );
    return _0x4986a0 == null ? _0x1de20b : _0x1de20b + _0x4986a0;
  }, 0);
  return _0x463ead > 0 ? Number(_0x463ead.toFixed(3)) : null;
}
export function normalizeStoryboardScriptRows(_0x1f456f) {
  return pickRowsContainer(_0x1f456f)
    .filter((_0x564d27) => _0x564d27 && typeof _0x564d27 === 'object' && !Array.isArray(_0x564d27))
    .map((_0x27d8d3) => {
      const _0x2f42e7 =
        _0x27d8d3['场景'] ??
        _0x27d8d3['场景标签'] ??
        _0x27d8d3.sceneTags ??
        _0x27d8d3.scene ??
        _0x27d8d3.location;
      return _0x2f42e7 == null ? { ..._0x27d8d3 } : { ..._0x27d8d3, 场景: _0x2f42e7 };
    });
}
function formatTableCellValue(_0x540809) {
  if (_0x540809 == null) return '';
  if (typeof _0x540809 === 'string') return _0x540809;
  if (typeof _0x540809 === 'number' || typeof _0x540809 === 'boolean') return String(_0x540809);
  try {
    return JSON.stringify(_0x540809);
  } catch {
    return String(_0x540809);
  }
}
function escapeCsvCell(_0x4b3eb9) {
  const _0x31aa85 = formatTableCellValue(_0x4b3eb9).replace(/\r\n?/g, '\n');
  if (!/[",\n]/.test(_0x31aa85)) return _0x31aa85;
  return '"' + _0x31aa85.replace(/"/g, '""') + '"';
}
export function serializeStoryboardScriptRowsToCsv(_0x3fed71, _0x2f09f7 = STORYBOARD_SCRIPT_COLUMNS) {
  const _0x351647 = normalizeStoryboardScriptRows(_0x3fed71),
    _0x5d308b = Array.isArray(_0x2f09f7) && _0x2f09f7.length ? _0x2f09f7 : STORYBOARD_SCRIPT_COLUMNS,
    _0x1093fa = _0x5d308b.map((_0x77f358) => String(_0x77f358?.key || '')),
    _0xa52b8d = _0x5d308b.map((_0x2fd199) => _0x2fd199?.label || _0x2fd199?.key || ''),
    _0xf83730 = [
      _0xa52b8d.map(escapeCsvCell).join(','),
      ..._0x351647.map((_0x163f80) =>
        _0x1093fa.map((_0x356b4b) => escapeCsvCell(_0x163f80?.[_0x356b4b])).join(','),
      ),
    ];
  return '\ufeff' + _0xf83730.join('\r\n') + '\r\n';
}
export function buildCanonicalStoryboardScriptJson(_0x444eaa = {}) {
  const _0x3ad6b1 =
      _0x444eaa && typeof _0x444eaa === 'object' && !Array.isArray(_0x444eaa)
        ? _0x444eaa
        : { rows: _0x444eaa },
    _0x167e0c = parseJsonObject(_0x3ad6b1.rawJson),
    _0x4c3494 = Array.isArray(_0x3ad6b1.rows) ? _0x3ad6b1.rows : _0x167e0c ? _0x167e0c : _0x3ad6b1,
    _0x41dc24 = normalizeStoryboardScriptRows(_0x4c3494),
    _0x114b55 =
      _0x3ad6b1.detectedIntent && typeof _0x3ad6b1.detectedIntent === 'object'
        ? _0x3ad6b1.detectedIntent
        : _0x167e0c?.detectedIntent && typeof _0x167e0c.detectedIntent === 'object'
          ? _0x167e0c.detectedIntent
          : {},
    _0x22f97c = { ..._0x114b55, shotCount: _0x41dc24.length },
    _0x400f23 = getRowsTotalDurationSeconds(_0x41dc24);
  if (_0x400f23 != null) _0x22f97c.totalDurationSeconds = _0x400f23;
  else {
    const _0xc05187 = normalizeFiniteNumber(_0x114b55.totalDurationSeconds);
    if (_0xc05187 != null) _0x22f97c.totalDurationSeconds = _0xc05187;
  }
  const _0x50c318 =
      String(_0x3ad6b1.title || _0x167e0c?.title || '').trim() || getStoryboardScriptDefaultName(),
    _0x2b049b = {
      schemaVersion: STORYBOARD_SCRIPT_SCHEMA_VERSION,
      title: _0x50c318,
      detectedIntent: _0x22f97c,
      rows: _0x41dc24,
    },
    _0x5d95a6 = Array.isArray(_0x3ad6b1.warnings)
      ? _0x3ad6b1.warnings
      : Array.isArray(_0x167e0c?.warnings)
        ? _0x167e0c.warnings
        : [];
  if (_0x5d95a6.length > 0) _0x2b049b.warnings = [..._0x5d95a6];
  return _0x2b049b;
}
export function serializeCanonicalStoryboardScriptJson(_0x44e85a = {}) {
  return JSON.stringify(buildCanonicalStoryboardScriptJson(_0x44e85a), null, 2);
}
export function createDefaultStoryboardScriptState(_0x564cf6 = {}) {
  if (typeof _0x564cf6 === 'string') {
    const _0x21432c = normalizeStoryboardScriptRows(_0x564cf6),
      _0x3a4e02 = serializeCanonicalStoryboardScriptJson({ rawJson: _0x564cf6, rows: _0x21432c });
    return {
      version: 1,
      viewMode: STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE,
      mediaMode: STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE,
      rawJson: _0x564cf6,
      canonicalJson: _0x3a4e02,
      rows: _0x21432c,
      selectedRowIndexes: [],
      selectionMode: false,
    };
  }
  const _0x38c602 = _0x564cf6 && typeof _0x564cf6 === 'object' ? _0x564cf6 : {},
    _0x51e693 = typeof _0x38c602.rawJson === 'string' ? _0x38c602.rawJson : '',
    _0xd407d6 = Array.isArray(_0x38c602.rows) ? _0x38c602.rows : _0x51e693 ? _0x51e693 : [],
    _0x227c54 = normalizeStoryboardScriptRows(_0xd407d6),
    _0x3e1bb4 = buildCanonicalStoryboardScriptJson({ ..._0x38c602, rawJson: _0x51e693, rows: _0x227c54 });
  return {
    ..._0x38c602,
    version: 1,
    viewMode: normalizeStoryboardScriptViewMode(_0x38c602.viewMode),
    mediaMode: normalizeStoryboardScriptMediaMode(_0x38c602.mediaMode),
    rawJson: _0x51e693,
    canonicalJson: JSON.stringify(_0x3e1bb4, null, 2),
    rows: _0x227c54,
    title: _0x3e1bb4.title,
    detectedIntent: _0x3e1bb4.detectedIntent,
    selectedRowIndexes: normalizeStoryboardScriptSelectedRowIndexes(
      _0x38c602.selectedRowIndexes,
      _0x227c54.length,
    ),
    selectionMode: _0x38c602.selectionMode === true,
  };
}
export function createStoryboardScriptNodeData({
  id: _0x242214,
  x: x = 0,
  y: y = 0,
  width: width = STORYBOARD_SCRIPT_DEFAULT_SIZE.width,
  height: height = STORYBOARD_SCRIPT_DEFAULT_SIZE.height,
  name: name = getStoryboardScriptDefaultName(),
  storyboardScript: storyboardScript = {},
} = {}) {
  const _0x1a45e5 = normalizePositiveDimension(width, STORYBOARD_SCRIPT_DEFAULT_SIZE.width),
    _0x44f1ed = normalizePositiveDimension(height, STORYBOARD_SCRIPT_DEFAULT_SIZE.height);
  return {
    id: _0x242214,
    type: STORYBOARD_SCRIPT_NODE_TYPE,
    x: x,
    y: y,
    width: _0x1a45e5,
    height: _0x44f1ed,
    resizeMinWidth: _0x1a45e5,
    resizeMinHeight: _0x44f1ed,
    name: name,
    storyboardScript: createDefaultStoryboardScriptState(storyboardScript),
  };
}
