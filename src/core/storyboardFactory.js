import {
  detachStoryboardCellSourceContext,
  isStoryboardCellEmpty,
  resolveStoryboardCellSourceIndex,
} from './storyboardCellUtils.js';
const STORYBOARD_STANDARD_ASPECTS = Object.freeze([
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '1:1', value: 1 },
]);
function _trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function _asPositiveNumber(item) {
  const count = Number(item);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function _getSafeGridCount(key) {
  return Math.max(1, Math.round(_asPositiveNumber(key)) || 0);
}
function _normalizeLocalPath(index) {
  const _trimString2 = _trimString(index);
  if (!_trimString2) return '';
  return _trimString2.startsWith('/') ? _trimString2 : '/' + _trimString2;
}
function _findStoryboardSourceContext(list = []) {
  if (!Array.isArray(list)) return {};
  for (const storyboardSourceWidth of list) {
    if (!storyboardSourceWidth || typeof storyboardSourceWidth !== 'object') continue;
    const storyboardSourceLocalPath = _trimString(storyboardSourceWidth.sourceLocalPath),
      _trimString3 = _trimString(storyboardSourceWidth.sourceUrl);
    if (!storyboardSourceLocalPath && !_trimString3) continue;
    return {
      storyboardSourceLocalPath: storyboardSourceLocalPath || null,
      storyboardSourceUrl: storyboardSourceLocalPath ? '' : _trimString3,
      storyboardSourceWidth: storyboardSourceWidth.sourceWidth || null,
      storyboardSourceHeight: storyboardSourceWidth.sourceHeight || null,
    };
  }
  return {};
}
function _normalizeStoryboardPieceCell(extracted, result) {
  if (!extracted || typeof extracted !== 'object') return extracted;
  if (isStoryboardCellEmpty(extracted)) return { ...extracted };
  return {
    ...detachStoryboardCellSourceContext(extracted, {
      locked: true,
      extracted: extracted.storyboardExtractedCell === true,
    }),
    storyboardPiece: true,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(extracted, result),
    isEmpty: false,
  };
}
function _parseAspectLabel(data) {
  const options = String(data || '')
      .trim()
      .match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/),
    width2 = _asPositiveNumber(options?.[1]),
    height2 = _asPositiveNumber(options?.[2]);
  if (width2 > 0 && height2 > 0) return { width: width2, height: height2 };
  return { width: 1, height: 1 };
}
export function resolveNearestStoryboardAspect(target, source) {
  const _asPositiveNumber2 = _asPositiveNumber(target),
    _asPositiveNumber3 = _asPositiveNumber(source);
  if (!(_asPositiveNumber2 > 0 && _asPositiveNumber3 > 0)) return '1:1';
  const next = _asPositiveNumber2 / _asPositiveNumber3;
  let el = STORYBOARD_STANDARD_ASPECTS[0],
    current = Math.abs(next - el.value);
  for (let entry = 1; entry < STORYBOARD_STANDARD_ASPECTS.length; entry++) {
    const el2 = STORYBOARD_STANDARD_ASPECTS[entry],
      record = Math.abs(next - el2.value);
    record < current && ((current = record), (el = el2));
  }
  return el.label;
}
export function resolveStoryboardSourceImageRef(enabled) {
  if (!enabled || typeof enabled !== 'object') return '';
  const _trimString4 =
    _trimString(enabled.sourceUrl) || _trimString(enabled.imageUrl) || _trimString(enabled.src);
  if (_trimString4) return _trimString4;
  return _normalizeLocalPath(enabled.localPath);
}
export function buildQuickCreateStoryboardCells({ cols: cols2, rows: rows2, imageRef: imageRef }) {
  const length = _getSafeGridCount(cols2) * _getSafeGridCount(rows2),
    url = _trimString(imageRef);
  return Array.from({ length: length }, (payload, count2) => {
    if (count2 === 0 && url) return { url: url };
    return { url: '', isEmpty: true };
  });
}
export function computeQuickCreateStoryboardSize({
  sourceWidth: sourceWidth,
  sourceHeight: sourceHeight,
  baseShortSide: baseShortSide,
}) {
  const _asPositiveNumber4 = _asPositiveNumber(sourceWidth),
    _asPositiveNumber5 = _asPositiveNumber(sourceHeight),
    width3 = Math.max(1, Math.round(_asPositiveNumber(baseShortSide) || 1));
  if (!(_asPositiveNumber4 > 0 && _asPositiveNumber5 > 0)) return { width: width3, height: width3 };
  const count3 = _asPositiveNumber4 / _asPositiveNumber5;
  if (count3 >= 1) return { width: Math.round(width3 * count3), height: width3 };
  return { width: width3, height: Math.round(width3 / count3) };
}
export function computePreparedStoryboardSize({
  aspectLabel: aspectLabel,
  cols: cols3,
  rows: rows3,
  sourceWidth: sourceWidth2,
  sourceHeight: sourceHeight2,
  minCellShortSide: minCellShortSide = 0x12c,
}) {
  const { width: width4, height: height3 } = _parseAspectLabel(aspectLabel),
    _getSafeGridCount2 = _getSafeGridCount(cols3),
    _getSafeGridCount3 = _getSafeGridCount(rows3),
    _asPositiveNumber6 = _asPositiveNumber(sourceWidth2) / _asPositiveNumber(sourceHeight2),
    count4 =
      Number.isFinite(_asPositiveNumber6) && _asPositiveNumber6 > 0
        ? _asPositiveNumber6 * (_getSafeGridCount3 / _getSafeGridCount2)
        : width4 / height3,
    handle = Math.max(1, Math.round(_asPositiveNumber(minCellShortSide) || 0x12c));
  let state = handle,
    config = handle;
  return (
    count4 >= 1
      ? ((config = handle), (state = config * count4))
      : ((state = handle), (config = state / count4)),
    { width: Math.round(state * _getSafeGridCount2), height: Math.round(config * _getSafeGridCount3) }
  );
}
export function buildStoryboardNodePayload({
  id: id,
  name: name2,
  x: x2,
  y: y2,
  cols: cols4,
  rows: rows4,
  width: width5,
  height: height4,
  aspectRatio: aspectRatio2,
  cells: cells,
  isEditing: isEditing = false,
  storyboardSourceLocalPath: storyboardSourceLocalPath2,
  storyboardSourceUrl: storyboardSourceUrl,
  storyboardSourceWidth: storyboardSourceWidth2,
  storyboardSourceHeight: storyboardSourceHeight,
}) {
  const args = {
    ..._findStoryboardSourceContext(cells),
    ...Object.fromEntries(
      Object.entries({
        storyboardSourceLocalPath: storyboardSourceLocalPath2 || undefined,
        storyboardSourceUrl: storyboardSourceUrl || undefined,
        storyboardSourceWidth: storyboardSourceWidth2 || undefined,
        storyboardSourceHeight: storyboardSourceHeight || undefined,
      }).filter(([, scope]) => scope !== undefined),
    ),
  };
  return {
    id: id,
    type: 'storyboard',
    name: name2,
    x: x2,
    y: y2,
    width: width5,
    height: height4,
    cells: Array.isArray(cells)
      ? cells.map((item2, input) => _normalizeStoryboardPieceCell(item2, input))
      : [],
    cols: cols4,
    rows: rows4,
    aspectRatio: aspectRatio2,
    isEditing: isEditing,
    ...args,
  };
}
export const STORYBOARD_EMPTY_GRID_DEFAULTS = Object.freeze({ cols: 3, rows: 3, aspectRatio: '1:1' });

export function createEmptyStoryboardNodeData({
  id: id2,
  name: name = '宫格图',
  x: x = 0,
  y: y = 0,
  width: width = 900,
  height: height = 900,
  cols: cols = STORYBOARD_EMPTY_GRID_DEFAULTS.cols,
  rows: rows = STORYBOARD_EMPTY_GRID_DEFAULTS.rows,
  aspectRatio: aspectRatio = STORYBOARD_EMPTY_GRID_DEFAULTS.aspectRatio,
  isEditing: isEditing = false,
} = {}) {
  return buildStoryboardNodePayload({
    id: id2,
    name: name,
    x: x,
    y: y,
    width: width,
    height: height,
    cols: cols,
    rows: rows,
    aspectRatio: aspectRatio,
    isEditing: isEditing,
    cells: buildQuickCreateStoryboardCells({ cols: cols, rows: rows, imageRef: '' }),
  });
}
