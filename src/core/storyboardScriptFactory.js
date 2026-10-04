import { t } from '../i18n/index.js';
export const STORYBOARD_SCRIPT_NODE_TYPE = 'storyboard-script';
export const STORYBOARD_SCRIPT_DEFAULT_NAME = '分镜脚本';
export const STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE = 'list';
export const STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE = 'image';
export const STORYBOARD_SCRIPT_TEXT_PROVIDER = 'volcengine';
export const STORYBOARD_SCRIPT_TEXT_MODEL = 'volcengine/doubao-seed-2-0-pro-260215';
export const STORYBOARD_SCRIPT_DEFAULT_SIZE = Object.freeze({ width: 0x400, height: 0x240 });
function storyboardScriptText(value, item = {}) {
  return t('storyboardScript.' + value, item);
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
  STORYBOARD_SCRIPT_COLUMN_LABELS.map((key) => Object.freeze({ key: key, label: key })),
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
export function normalizeStoryboardScriptViewMode(index) {
  const result = String(index || '').trim();
  return STORYBOARD_SCRIPT_VIEW_MODES.has(result) ? result : STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE;
}
export function normalizeStoryboardScriptMediaMode(data) {
  const options = String(data || '').trim();
  return STORYBOARD_SCRIPT_MEDIA_MODES.has(options) ? options : STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE;
}
function getStoryboardScriptAllowedColumnKeys(target) {
  return normalizeStoryboardScriptMediaMode(target) === 'video'
    ? STORYBOARD_SCRIPT_VIDEO_MODE_COLUMN_KEYS
    : STORYBOARD_SCRIPT_IMAGE_MODE_COLUMN_KEYS;
}
function hasStoryboardScriptColumnValue(source, next) {
  const current = String(next || '');
  return (Array.isArray(source) ? source : []).some((enabled) => {
    if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled)) return false;
    return formatTableCellValue(enabled[current]).trim().length > 0;
  });
}
export function getStoryboardScriptDisplayColumns({
  mediaMode: mediaMode = STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE,
  rows: rows = [],
} = {}) {
  const map = getStoryboardScriptAllowedColumnKeys(mediaMode),
    entry = Array.isArray(rows) ? rows : normalizeStoryboardScriptRows(rows);
  return STORYBOARD_SCRIPT_COLUMNS.filter((event) => {
    if (!map.has(event.key)) return false;
    if (STORYBOARD_SCRIPT_ALWAYS_VISIBLE_COLUMN_KEYS.has(event.key)) return true;
    return hasStoryboardScriptColumnValue(entry, event.key);
  });
}
export function normalizeStoryboardScriptSelectedRowIndexes(list, record = 0) {
  if (!Array.isArray(list)) return [];
  const payload = Number.isFinite(record) ? Math.max(0, Math.trunc(record)) : 0,
    map2 = new Set(),
    list2 = [];
  return (
    list.forEach((item2) => {
      const count = Number(item2);
      if (!Number.isInteger(count) || count < 0 || count >= payload) return;
      if (map2.has(count)) return;
      (map2.add(count), list2.push(count));
    }),
    list2
  );
}
function parseJsonRows(handle) {
  if (typeof handle !== 'string') return handle;
  const enabled2 = handle.trim();
  if (!enabled2) return [];
  try {
    return JSON.parse(enabled2);
  } catch {
    return [];
  }
}
function parseJsonObject(state) {
  if (state && typeof state === 'object' && !Array.isArray(state)) return state;
  if (typeof state !== 'string') return null;
  const enabled3 = state.trim();
  if (!enabled3) return null;
  try {
    const config = JSON.parse(enabled3);
    return config && typeof config === 'object' && !Array.isArray(config) ? config : null;
  } catch {
    return null;
  }
}
function pickRowsContainer(scope) {
  const jsonRows = parseJsonRows(scope);
  if (Array.isArray(jsonRows)) return jsonRows;
  if (!jsonRows || typeof jsonRows !== 'object') return [];
  if (Array.isArray(jsonRows.rows)) return jsonRows.rows;
  if (Array.isArray(jsonRows.shots)) return jsonRows.shots;
  if (Array.isArray(jsonRows.scenes)) return jsonRows.scenes;
  if (Array.isArray(jsonRows.items)) return jsonRows.items;
  return [];
}
function normalizeFiniteNumber(input) {
  const output = Number(input);
  return Number.isFinite(output) ? output : null;
}
function normalizePositiveDimension(value2, value3) {
  const count2 = Number(value2);
  return Number.isFinite(count2) && count2 > 0 ? count2 : value3;
}
export function resolveStoryboardScriptResizeMinSize(options2 = {}) {
  return {
    width: normalizePositiveDimension(options2?.resizeMinWidth, STORYBOARD_SCRIPT_DEFAULT_SIZE.width),
    height: normalizePositiveDimension(options2?.resizeMinHeight, STORYBOARD_SCRIPT_DEFAULT_SIZE.height),
  };
}
function parseClockDurationSeconds(value4) {
  const list3 = String(value4 || '')
    .trim()
    .split(':');
  if (list3.length < 2 || list3.length > 3) return null;
  const list4 = list3.map((item3) => Number(item3));
  if (list4.some((count3) => !Number.isFinite(count3) || count3 < 0)) return null;
  if (list4.length === 2) return list4[0] * 60 + list4[1];
  return list4[0] * 0xe10 + list4[1] * 60 + list4[2];
}
function parseDurationSeconds(value5) {
  const finiteNumber = normalizeFiniteNumber(value5);
  if (finiteNumber != null) return finiteNumber;
  const args = String(value5 || '').trim();
  if (!args) return null;
  const clockDurationSeconds = parseClockDurationSeconds(args);
  if (clockDurationSeconds != null) return clockDurationSeconds;
  const list5 = [...args.matchAll(/\d+(?:\.\d+)?/g)].map((item4) => Number(item4[0]));
  if (list5.length === 0) return null;
  const value6 = /[-~～—–至到]/.test(args) && list5.length >= 2;
  if (value6) return (list5[0] + list5[1]) / 2;
  return list5[0];
}
function getRowsTotalDurationSeconds(list6) {
  const count4 = list6.reduce((item5, value7) => {
    const durationSeconds = parseDurationSeconds(
      value7?.['时长'] ?? value7?.duration ?? value7?.durationText,
    );
    return durationSeconds == null ? item5 : item5 + durationSeconds;
  }, 0);
  return count4 > 0 ? Number(count4.toFixed(3)) : null;
}
export function normalizeStoryboardScriptRows(value8) {
  return pickRowsContainer(value8)
    .filter((item6) => item6 && typeof item6 === 'object' && !Array.isArray(item6))
    .map((args2) => {
      const value9 = args2['场景'] ?? args2['场景标签'] ?? args2.sceneTags ?? args2.scene ?? args2.location;
      return value9 == null ? { ...args2 } : { ...args2, 场景: value9 };
    });
}
function formatTableCellValue(value10) {
  if (value10 == null) return '';
  if (typeof value10 === 'string') return value10;
  if (typeof value10 === 'number' || typeof value10 === 'boolean') return String(value10);
  try {
    return JSON.stringify(value10);
  } catch {
    return String(value10);
  }
}
function escapeCsvCell(value11) {
  const formatTableCellValue2 = formatTableCellValue(value11).replace(/\r\n?/g, '\n');
  if (!/[",\n]/.test(formatTableCellValue2)) return formatTableCellValue2;
  return '"' + formatTableCellValue2.replace(/"/g, '""') + '"';
}
export function serializeStoryboardScriptRowsToCsv(value12, list7 = STORYBOARD_SCRIPT_COLUMNS) {
  const list8 = normalizeStoryboardScriptRows(value12),
    list9 = Array.isArray(list7) && list7.length ? list7 : STORYBOARD_SCRIPT_COLUMNS,
    list10 = list9.map((event2) => String(event2?.key || '')),
    list11 = list9.map((event3) => event3?.label || event3?.key || ''),
    list12 = [
      list11.map(escapeCsvCell).join(','),
      ...list8.map((item7) => list10.map((item8) => escapeCsvCell(item7?.[item8])).join(',')),
    ];
  return '\ufeff' + list12.join('\r\n') + '\r\n';
}
export function buildCanonicalStoryboardScriptJson(rows2 = {}) {
  const value13 = rows2 && typeof rows2 === 'object' && !Array.isArray(rows2) ? rows2 : { rows: rows2 },
    jsonObject = parseJsonObject(value13.rawJson),
    value14 = Array.isArray(value13.rows) ? value13.rows : jsonObject ? jsonObject : value13,
    shotCount = normalizeStoryboardScriptRows(value14),
    args3 =
      value13.detectedIntent && typeof value13.detectedIntent === 'object'
        ? value13.detectedIntent
        : jsonObject?.detectedIntent && typeof jsonObject.detectedIntent === 'object'
          ? jsonObject.detectedIntent
          : {},
    detectedIntent = { ...args3, shotCount: shotCount.length },
    rowsTotalDurationSeconds = getRowsTotalDurationSeconds(shotCount);
  if (rowsTotalDurationSeconds != null) detectedIntent.totalDurationSeconds = rowsTotalDurationSeconds;
  else {
    const finiteNumber2 = normalizeFiniteNumber(args3.totalDurationSeconds);
    if (finiteNumber2 != null) detectedIntent.totalDurationSeconds = finiteNumber2;
  }
  const title = String(value13.title || jsonObject?.title || '').trim() || getStoryboardScriptDefaultName(),
    value15 = {
      schemaVersion: STORYBOARD_SCRIPT_SCHEMA_VERSION,
      title: title,
      detectedIntent: detectedIntent,
      rows: shotCount,
    },
    list13 = Array.isArray(value13.warnings)
      ? value13.warnings
      : Array.isArray(jsonObject?.warnings)
        ? jsonObject.warnings
        : [];
  if (list13.length > 0) value15.warnings = [...list13];
  return value15;
}
export function serializeCanonicalStoryboardScriptJson(options3 = {}) {
  return JSON.stringify(buildCanonicalStoryboardScriptJson(options3), null, 2);
}
export function createDefaultStoryboardScriptState(rawJson = {}) {
  if (typeof rawJson === 'string') {
    const rows3 = normalizeStoryboardScriptRows(rawJson),
      canonicalJson = serializeCanonicalStoryboardScriptJson({ rawJson: rawJson, rows: rows3 });
    return {
      version: 1,
      viewMode: STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE,
      mediaMode: STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE,
      rawJson: rawJson,
      canonicalJson: canonicalJson,
      rows: rows3,
      selectedRowIndexes: [],
      selectionMode: false,
    };
  }
  const selectionMode = rawJson && typeof rawJson === 'object' ? rawJson : {},
    rawJson2 = typeof selectionMode.rawJson === 'string' ? selectionMode.rawJson : '',
    value16 = Array.isArray(selectionMode.rows) ? selectionMode.rows : rawJson2 ? rawJson2 : [],
    rows4 = normalizeStoryboardScriptRows(value16),
    title2 = buildCanonicalStoryboardScriptJson({ ...selectionMode, rawJson: rawJson2, rows: rows4 });
  return {
    ...selectionMode,
    version: 1,
    viewMode: normalizeStoryboardScriptViewMode(selectionMode.viewMode),
    mediaMode: normalizeStoryboardScriptMediaMode(selectionMode.mediaMode),
    rawJson: rawJson2,
    canonicalJson: JSON.stringify(title2, null, 2),
    rows: rows4,
    title: title2.title,
    detectedIntent: title2.detectedIntent,
    selectedRowIndexes: normalizeStoryboardScriptSelectedRowIndexes(
      selectionMode.selectedRowIndexes,
      rows4.length,
    ),
    selectionMode: selectionMode.selectionMode === true,
  };
}
export function createStoryboardScriptNodeData({
  id: id,
  x: x = 0,
  y: y = 0,
  width: width = STORYBOARD_SCRIPT_DEFAULT_SIZE.width,
  height: height = STORYBOARD_SCRIPT_DEFAULT_SIZE.height,
  name: name = getStoryboardScriptDefaultName(),
  storyboardScript: storyboardScript = {},
} = {}) {
  const width2 = normalizePositiveDimension(width, STORYBOARD_SCRIPT_DEFAULT_SIZE.width),
    height2 = normalizePositiveDimension(height, STORYBOARD_SCRIPT_DEFAULT_SIZE.height);
  return {
    id: id,
    type: STORYBOARD_SCRIPT_NODE_TYPE,
    x: x,
    y: y,
    width: width2,
    height: height2,
    resizeMinWidth: width2,
    resizeMinHeight: height2,
    name: name,
    storyboardScript: createDefaultStoryboardScriptState(storyboardScript),
  };
}
