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
function _trimString(_0x5ca9dc) {
  return typeof _0x5ca9dc === 'string' ? _0x5ca9dc.trim() : '';
}
function _asPositiveNumber(_0x1d8d54) {
  const _0x2b37bd = Number(_0x1d8d54);
  return Number.isFinite(_0x2b37bd) && _0x2b37bd > 0 ? _0x2b37bd : 0;
}
function _getSafeGridCount(_0x3fcf3a) {
  return Math.max(1, Math.round(_asPositiveNumber(_0x3fcf3a)) || 0);
}
function _normalizeLocalPath(_0x11bb68) {
  const _0x35c00b = _trimString(_0x11bb68);
  if (!_0x35c00b) return '';
  return _0x35c00b.startsWith('/') ? _0x35c00b : '/' + _0x35c00b;
}
function _findStoryboardSourceContext(_0x5f498e = []) {
  if (!Array.isArray(_0x5f498e)) return {};
  for (const _0x52f635 of _0x5f498e) {
    if (!_0x52f635 || typeof _0x52f635 !== 'object') continue;
    const _0x38b6f5 = _trimString(_0x52f635.sourceLocalPath),
      _0x82a096 = _trimString(_0x52f635.sourceUrl);
    if (!_0x38b6f5 && !_0x82a096) continue;
    return {
      storyboardSourceLocalPath: _0x38b6f5 || null,
      storyboardSourceUrl: _0x38b6f5 ? '' : _0x82a096,
      storyboardSourceWidth: _0x52f635.sourceWidth || null,
      storyboardSourceHeight: _0x52f635.sourceHeight || null,
    };
  }
  return {};
}
function _normalizeStoryboardPieceCell(_0x5580b9, _0x24e9fd) {
  if (!_0x5580b9 || typeof _0x5580b9 !== 'object') return _0x5580b9;
  if (isStoryboardCellEmpty(_0x5580b9)) return { ..._0x5580b9 };
  return {
    ...detachStoryboardCellSourceContext(_0x5580b9, {
      locked: true,
      extracted: _0x5580b9.storyboardExtractedCell === true,
    }),
    storyboardPiece: true,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(_0x5580b9, _0x24e9fd),
    isEmpty: false,
  };
}
function _parseAspectLabel(_0x36172c) {
  const _0x4bccf0 = String(_0x36172c || '')
      .trim()
      .match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/),
    _0x4bd0e7 = _asPositiveNumber(_0x4bccf0?.[1]),
    _0xe61c90 = _asPositiveNumber(_0x4bccf0?.[2]);
  if (_0x4bd0e7 > 0 && _0xe61c90 > 0) return { width: _0x4bd0e7, height: _0xe61c90 };
  return { width: 1, height: 1 };
}
export function resolveNearestStoryboardAspect(_0x10cb52, _0x947050) {
  const _0x21513d = _asPositiveNumber(_0x10cb52),
    _0x10b522 = _asPositiveNumber(_0x947050);
  if (!(_0x21513d > 0 && _0x10b522 > 0)) return '1:1';
  const _0x37153b = _0x21513d / _0x10b522;
  let _0x178b2a = STORYBOARD_STANDARD_ASPECTS[0],
    _0x5dd475 = Math.abs(_0x37153b - _0x178b2a.value);
  for (let _0x1a30dc = 1; _0x1a30dc < STORYBOARD_STANDARD_ASPECTS.length; _0x1a30dc++) {
    const _0x2c2c52 = STORYBOARD_STANDARD_ASPECTS[_0x1a30dc],
      _0x2cc324 = Math.abs(_0x37153b - _0x2c2c52.value);
    _0x2cc324 < _0x5dd475 && ((_0x5dd475 = _0x2cc324), (_0x178b2a = _0x2c2c52));
  }
  return _0x178b2a.label;
}
export function resolveStoryboardSourceImageRef(_0xfb0df7) {
  if (!_0xfb0df7 || typeof _0xfb0df7 !== 'object') return '';
  const _0x491eef =
    _trimString(_0xfb0df7.sourceUrl) || _trimString(_0xfb0df7.imageUrl) || _trimString(_0xfb0df7.src);
  if (_0x491eef) return _0x491eef;
  return _normalizeLocalPath(_0xfb0df7.localPath);
}
export function buildQuickCreateStoryboardCells({ cols: _0x349f46, rows: _0x50457c, imageRef: _0x5cb4e3 }) {
  const _0x5c5ed6 = _getSafeGridCount(_0x349f46) * _getSafeGridCount(_0x50457c),
    _0x319716 = _trimString(_0x5cb4e3);
  return Array.from({ length: _0x5c5ed6 }, (_0x12cd4, _0x320d0a) => {
    if (_0x320d0a === 0 && _0x319716) return { url: _0x319716 };
    return { url: '', isEmpty: true };
  });
}
export function computeQuickCreateStoryboardSize({
  sourceWidth: _0xb1a477,
  sourceHeight: _0x4e58c0,
  baseShortSide: _0x8246ee,
}) {
  const _0x169b0e = _asPositiveNumber(_0xb1a477),
    _0x227a14 = _asPositiveNumber(_0x4e58c0),
    _0x1f6cdc = Math.max(1, Math.round(_asPositiveNumber(_0x8246ee) || 1));
  if (!(_0x169b0e > 0 && _0x227a14 > 0)) return { width: _0x1f6cdc, height: _0x1f6cdc };
  const _0x306faf = _0x169b0e / _0x227a14;
  if (_0x306faf >= 1) return { width: Math.round(_0x1f6cdc * _0x306faf), height: _0x1f6cdc };
  return { width: _0x1f6cdc, height: Math.round(_0x1f6cdc / _0x306faf) };
}
export function computePreparedStoryboardSize({
  aspectLabel: _0x64416a,
  cols: _0x217f74,
  rows: _0x9cf393,
  sourceWidth: _0x56bb93,
  sourceHeight: _0x5b1b03,
  minCellShortSide: minCellShortSide = 0x12c,
}) {
  const { width: _0x3ce898, height: _0x486fb9 } = _parseAspectLabel(_0x64416a),
    _0x572e70 = _getSafeGridCount(_0x217f74),
    _0x45bfd6 = _getSafeGridCount(_0x9cf393),
    _0x1cf11f = _asPositiveNumber(_0x56bb93) / _asPositiveNumber(_0x5b1b03),
    _0x4eb3dc =
      Number.isFinite(_0x1cf11f) && _0x1cf11f > 0
        ? _0x1cf11f * (_0x45bfd6 / _0x572e70)
        : _0x3ce898 / _0x486fb9,
    _0x165978 = Math.max(1, Math.round(_asPositiveNumber(minCellShortSide) || 0x12c));
  let _0x137dbb = _0x165978,
    _0x43ab67 = _0x165978;
  return (
    _0x4eb3dc >= 1
      ? ((_0x43ab67 = _0x165978), (_0x137dbb = _0x43ab67 * _0x4eb3dc))
      : ((_0x137dbb = _0x165978), (_0x43ab67 = _0x137dbb / _0x4eb3dc)),
    { width: Math.round(_0x137dbb * _0x572e70), height: Math.round(_0x43ab67 * _0x45bfd6) }
  );
}
export function buildStoryboardNodePayload({
  id: _0x5bb11d,
  name: _0x20c3a3,
  x: _0x418d55,
  y: _0x2b0b72,
  cols: _0x4013a4,
  rows: _0x28d0d6,
  width: _0x26360a,
  height: _0x9f7cce,
  aspectRatio: _0x549997,
  cells: _0x2dd07a,
  isEditing: isEditing = false,
  storyboardSourceLocalPath: _0x3f92b7,
  storyboardSourceUrl: _0x4bc1d5,
  storyboardSourceWidth: _0x4b6465,
  storyboardSourceHeight: _0x297c8d,
}) {
  const _0x50d94d = {
    ..._findStoryboardSourceContext(_0x2dd07a),
    ...Object.fromEntries(
      Object.entries({
        storyboardSourceLocalPath: _0x3f92b7 || undefined,
        storyboardSourceUrl: _0x4bc1d5 || undefined,
        storyboardSourceWidth: _0x4b6465 || undefined,
        storyboardSourceHeight: _0x297c8d || undefined,
      }).filter(([, _0x3195df]) => _0x3195df !== undefined),
    ),
  };
  return {
    id: _0x5bb11d,
    type: 'storyboard',
    name: _0x20c3a3,
    x: _0x418d55,
    y: _0x2b0b72,
    width: _0x26360a,
    height: _0x9f7cce,
    cells: Array.isArray(_0x2dd07a)
      ? _0x2dd07a.map((_0x176d37, _0x56f1cd) => _normalizeStoryboardPieceCell(_0x176d37, _0x56f1cd))
      : [],
    cols: _0x4013a4,
    rows: _0x28d0d6,
    aspectRatio: _0x549997,
    isEditing: isEditing,
    ..._0x50d94d,
  };
}
