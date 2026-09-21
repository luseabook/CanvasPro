import {
  resolveStoryboardCellAssetSrc,
  resolveStoryboardCellPreviewSrc,
} from '../../core/storyboardCellUtils.js';
import { localPathToUrl, normalizeLocalPath } from '../../utils/localMediaPath.js';
import { IMAGE_RATIO_OPTIONS, parseRatioLabel } from '../../../api/imageRatioPolicy.js';
import { AI_GENERATION_NODE_SHORT_SIDE } from '../../services/mediaSizingPolicy.js';
export const COLLAGE_NODE_TYPE = 'collage';
export const COLLAGE_SCHEMA_VERSION = 'collage.v1';
export const COLLAGE_COLLAPSED_SHORT_SIDE = 0x12c;
export const COLLAGE_SLOT_SHORT_SIDE = AI_GENERATION_NODE_SHORT_SIDE;
export const COLLAGE_EXPANDED_SHORT_SIDE = COLLAGE_SLOT_SHORT_SIDE * 2;
export const COLLAGE_DEFAULT_SIZE = Object.freeze({
  width: COLLAGE_EXPANDED_SHORT_SIDE,
  height: COLLAGE_EXPANDED_SHORT_SIDE,
});
export const COLLAGE_INITIAL_ASPECT_RATIO = '1:1';
export const COLLAGE_INITIAL_LAYOUT_PRESET_ID = 'puzzle-2-rows';
export const COLLAGE_EXPORT_RESOLUTIONS = Object.freeze([
  { label: '1K', longSide: 0x400 },
  { label: '2K', longSide: 0x800 },
  { label: '4K', longSide: 0x1000 },
]);
const COLLAGE_ASPECT_RATIO_LABELS = Object.freeze([
    '1:1',
    '16:9',
    '9:16',
    '3:4',
    '4:3',
    '3:2',
    '2:3',
    '5:4',
    '4:5',
    '21:9',
  ]),
  imageRatioOptionsByLabel = new Map(IMAGE_RATIO_OPTIONS.map((_0x3ea7ae) => [_0x3ea7ae.label, _0x3ea7ae]));
function createCollageAspectRatioOption(_0x407b74) {
  const _0x14174c = imageRatioOptionsByLabel.get(_0x407b74),
    _0x5b1552 = parseRatioLabel(_0x14174c?.label || _0x407b74);
  if (!_0x5b1552) return null;
  return Object.freeze({ label: _0x5b1552.label, value: _0x5b1552.label, w: _0x5b1552.w, h: _0x5b1552.h });
}
export const COLLAGE_ASPECT_RATIO_OPTIONS = Object.freeze(
  COLLAGE_ASPECT_RATIO_LABELS.map(createCollageAspectRatioOption).filter(Boolean),
);
export const COLLAGE_BACKGROUND_TRANSPARENT = 'transparent';
export const COLLAGE_BACKGROUND_DEFAULT = COLLAGE_BACKGROUND_TRANSPARENT;
export const COLLAGE_BACKGROUND_OPTIONS = Object.freeze([
  { id: 'transparent', label: '透明', value: COLLAGE_BACKGROUND_TRANSPARENT },
  { id: 'white', label: '白色', value: 'var(--white)' },
  { id: 'black', label: '黑色', value: 'var(--black)' },
  { id: 'indigo', label: '靛蓝', value: 'var(--indigo)' },
  { id: 'green', label: '绿色', value: 'var(--green)' },
  { id: 'gold', label: '金色', value: 'var(--gold)' },
  { id: 'red', label: '红色', value: 'var(--red)' },
  { id: 'purple', label: '紫色', value: 'var(--purple)' },
  { id: 'pink', label: '粉色', value: 'var(--group-pink)' },
  { id: 'slate', label: '灰蓝', value: 'var(--group-slate)' },
  { id: 'cyan', label: '青色', value: 'var(--cyan)' },
]);
export const COLLAGE_LAYOUT_STYLE_DEFAULTS = Object.freeze({ outerPadding: 20, gap: 10, cornerRadius: 0 });
export const COLLAGE_IMAGE_SCALE_DEFAULT = 1;
export const COLLAGE_IMAGE_SCALE_MIN = 1;
export const COLLAGE_IMAGE_SCALE_MAX = 4;
const COLLAGE_DIVIDER_MIN_SIZE = 4,
  COLLAGE_DIVIDER_MAX_MIN_SIZE = 24,
  COLLAGE_DIVIDER_MIN_SIZE_RATIO = 0.02,
  slot = (_0x24c07d, _0x3c37cb, _0x40516c, _0x5990a3) => ({
    x: _0x24c07d,
    y: _0x3c37cb,
    width: _0x40516c,
    height: _0x5990a3,
  });
export const COLLAGE_LAYOUT_PRESETS = Object.freeze([
  { id: 'freeform', label: '自由', slotCount: 0 },
  {
    id: 'puzzle-2-rows',
    label: '上下',
    slotCount: 2,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x3e8, 0x1f4), slot(0, 0x1f4, 0x3e8, 0x1f4)],
  },
  {
    id: 'puzzle-2-cols',
    label: '左右',
    slotCount: 2,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x1f4, 0x3e8), slot(0x1f4, 0, 0x1f4, 0x3e8)],
  },
  {
    id: 'puzzle-3-rows',
    label: '三横',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x3e8, 333.333), slot(0, 333.333, 0x3e8, 333.334), slot(0, 666.667, 0x3e8, 333.333)],
  },
  {
    id: 'puzzle-3-cols',
    label: '三竖',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 333.333, 0x3e8), slot(333.333, 0, 333.334, 0x3e8), slot(666.667, 0, 333.333, 0x3e8)],
  },
  {
    id: 'puzzle-3-top-wide',
    label: '上1下2',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x3e8, 0x1f4), slot(0, 0x1f4, 0x1f4, 0x1f4), slot(0x1f4, 0x1f4, 0x1f4, 0x1f4)],
  },
  {
    id: 'puzzle-3-bottom-wide',
    label: '上2下1',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x1f4, 0x1f4), slot(0x1f4, 0, 0x1f4, 0x1f4), slot(0, 0x1f4, 0x3e8, 0x1f4)],
  },
  {
    id: 'puzzle-3-left-tall',
    label: '左1右2',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x1f4, 0x3e8), slot(0x1f4, 0, 0x1f4, 0x1f4), slot(0x1f4, 0x1f4, 0x1f4, 0x1f4)],
  },
  {
    id: 'puzzle-3-right-tall',
    label: '左2右1',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x1f4, 0x1f4), slot(0, 0x1f4, 0x1f4, 0x1f4), slot(0x1f4, 0, 0x1f4, 0x3e8)],
  },
  {
    id: 'puzzle-3-hero-top',
    label: '大上',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x3e8, 0x280), slot(0, 0x280, 0x168, 0x168), slot(0x168, 0x280, 0x280, 0x168)],
  },
  {
    id: 'puzzle-3-hero-left',
    label: '大左',
    slotCount: 3,
    width: 0x3e8,
    height: 0x3e8,
    slots: [slot(0, 0, 0x280, 0x3e8), slot(0x280, 0, 0x168, 0x1f4), slot(0x280, 0x1f4, 0x168, 0x1f4)],
  },
  {
    id: 'puzzle-4-even',
    label: '四宫格',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 0x1f4, 0x1f4),
      slot(0x1f4, 0, 0x1f4, 0x1f4),
      slot(0, 0x1f4, 0x1f4, 0x1f4),
      slot(0x1f4, 0x1f4, 0x1f4, 0x1f4),
    ],
  },
  {
    id: 'puzzle-4-rows',
    label: '四横',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 0x3e8, 250),
      slot(0, 250, 0x3e8, 250),
      slot(0, 0x1f4, 0x3e8, 250),
      slot(0, 0x2ee, 0x3e8, 250),
    ],
  },
  {
    id: 'puzzle-4-cols',
    label: '四竖',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 250, 0x3e8),
      slot(250, 0, 250, 0x3e8),
      slot(0x1f4, 0, 250, 0x3e8),
      slot(0x2ee, 0, 250, 0x3e8),
    ],
  },
  {
    id: 'puzzle-4-top-wide',
    label: '上1下3',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 0x3e8, 0x1f4),
      slot(0, 0x1f4, 333.333, 0x1f4),
      slot(333.333, 0x1f4, 333.334, 0x1f4),
      slot(666.667, 0x1f4, 333.333, 0x1f4),
    ],
  },
  {
    id: 'puzzle-4-bottom-wide',
    label: '上3下1',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 333.333, 0x1f4),
      slot(333.333, 0, 333.334, 0x1f4),
      slot(666.667, 0, 333.333, 0x1f4),
      slot(0, 0x1f4, 0x3e8, 0x1f4),
    ],
  },
  {
    id: 'puzzle-4-left-wide',
    label: '左1右3',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 0x1f4, 0x3e8),
      slot(0x1f4, 0, 0x1f4, 333.333),
      slot(0x1f4, 333.333, 0x1f4, 333.334),
      slot(0x1f4, 666.667, 0x1f4, 333.333),
    ],
  },
  {
    id: 'puzzle-4-right-wide',
    label: '左3右1',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 0x1f4, 333.333),
      slot(0, 333.333, 0x1f4, 333.334),
      slot(0, 666.667, 0x1f4, 333.333),
      slot(0x1f4, 0, 0x1f4, 0x3e8),
    ],
  },
  {
    id: 'puzzle-4-bands',
    label: '横向组合',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 0x3e8, 0x12c),
      slot(0, 0x12c, 0x1f4, 0x190),
      slot(0x1f4, 0x12c, 0x1f4, 0x190),
      slot(0, 0x2bc, 0x3e8, 0x12c),
    ],
  },
  {
    id: 'puzzle-4-hero-top',
    label: '大上',
    slotCount: 4,
    width: 0x3e8,
    height: 0x3e8,
    slots: [
      slot(0, 0, 0x3e8, 0x258),
      slot(0, 0x258, 333.333, 0x190),
      slot(333.333, 0x258, 333.334, 0x190),
      slot(666.667, 0x258, 333.333, 0x190),
    ],
  },
]);
export const COLLAGE_TEMPLATE_GROUPS = Object.freeze(
  [2, 3, 4].map((_0xfb2ea5) => ({
    slotCount: _0xfb2ea5,
    label: String(_0xfb2ea5),
    presets: COLLAGE_LAYOUT_PRESETS.filter((_0xdfb36d) => _0xdfb36d.slotCount === _0xfb2ea5),
  })),
);
function trimString(_0x58add9) {
  return typeof _0x58add9 === 'string' ? _0x58add9.trim() : '';
}
function toPositiveNumber(_0x5b9419, _0x2f0b66 = 0) {
  const _0x44a022 = Number(_0x5b9419);
  return Number.isFinite(_0x44a022) && _0x44a022 > 0 ? _0x44a022 : _0x2f0b66;
}
function roundDimension(_0x334177, _0x291b4d = 1) {
  return Math.max(1, Math.round(toPositiveNumber(_0x334177, _0x291b4d)));
}
export function resolveCollageSizeByShortSide({
  width: _0x2d746c,
  height: _0x30e207,
  shortSide: shortSide = COLLAGE_EXPANDED_SHORT_SIDE,
} = {}) {
  const _0x291a38 = roundDimension(shortSide, COLLAGE_EXPANDED_SHORT_SIDE),
    _0x51b92b = toPositiveNumber(_0x2d746c, 0),
    _0x3f9930 = toPositiveNumber(_0x30e207, 0);
  if (!(_0x51b92b > 0 && _0x3f9930 > 0)) return { width: _0x291a38, height: _0x291a38 };
  const _0x3657fc = _0x51b92b / _0x3f9930;
  if (!Number.isFinite(_0x3657fc) || _0x3657fc <= 0) return { width: _0x291a38, height: _0x291a38 };
  if (_0x3657fc >= 1) return { width: roundDimension(_0x291a38 * _0x3657fc, _0x291a38), height: _0x291a38 };
  return { width: _0x291a38, height: roundDimension(_0x291a38 / _0x3657fc, _0x291a38) };
}
export function resolveCollagePresetSizeBySlotShortSide(
  _0x19440e,
  { aspectRatio: aspectRatio = '', slotShortSide: slotShortSide = COLLAGE_SLOT_SHORT_SIDE } = {},
) {
  const _0x3255d3 = _0x19440e && typeof _0x19440e === 'object' ? _0x19440e : {},
    _0x3b8747 = toPositiveNumber(_0x3255d3.width, COLLAGE_DEFAULT_SIZE.width),
    _0x4aa0bf = toPositiveNumber(_0x3255d3.height, COLLAGE_DEFAULT_SIZE.height),
    _0x2c0f5c = getCollageAspectRatioOption(aspectRatio),
    _0x3d35c4 = _0x2c0f5c?.w || _0x3b8747,
    _0x185963 = _0x2c0f5c?.h || _0x4aa0bf,
    _0x4399b7 = _0x185963 / _0x3d35c4,
    _0x25287e = roundDimension(slotShortSide, COLLAGE_SLOT_SHORT_SIDE),
    _0x4af39c = Array.isArray(_0x3255d3.slots) ? _0x3255d3.slots : [];
  let _0x5bca3c = Infinity;
  for (const _0x4aea47 of _0x4af39c) {
    const _0xdf8e12 = toPositiveNumber(_0x4aea47?.width, 0) / _0x3b8747,
      _0xc7e7b2 = (toPositiveNumber(_0x4aea47?.height, 0) / _0x4aa0bf) * _0x4399b7,
      _0x18aa88 = Math.min(_0xdf8e12, _0xc7e7b2);
    Number.isFinite(_0x18aa88) && _0x18aa88 > 0 && (_0x5bca3c = Math.min(_0x5bca3c, _0x18aa88));
  }
  (!Number.isFinite(_0x5bca3c) || _0x5bca3c <= 0) && (_0x5bca3c = Math.min(1, _0x4399b7));
  const _0x5881ce = _0x25287e / _0x5bca3c,
    _0x114077 = _0x5881ce * _0x4399b7;
  return {
    width: roundDimension(_0x5881ce, COLLAGE_DEFAULT_SIZE.width),
    height: roundDimension(_0x114077, COLLAGE_DEFAULT_SIZE.height),
  };
}
function normalizeMediaUrl(_0x4867a8) {
  const _0x413816 = trimString(_0x4867a8);
  if (!_0x413816) return '';
  if (/^(https?:|blob:|data:)/i.test(_0x413816)) return _0x413816;
  const _0x38c42a = localPathToUrl(_0x413816);
  return _0x38c42a || '';
}
function pickMediaUrl(..._0x69fa8d) {
  for (const _0x91968e of _0x69fa8d) {
    const _0x139764 = normalizeMediaUrl(_0x91968e);
    if (_0x139764) return _0x139764;
  }
  return '';
}
function pickLocalPath(..._0x3073f6) {
  for (const _0x38ea49 of _0x3073f6) {
    const _0x2e9032 = normalizeLocalPath(_0x38ea49);
    if (_0x2e9032) return _0x2e9032;
  }
  return '';
}
export function resolveCollageItemPreviewUrl(_0x3cca7e) {
  return pickMediaUrl(
    _0x3cca7e?.url,
    _0x3cca7e?.localPath,
    _0x3cca7e?.thumbLocalPath,
    _0x3cca7e?.sourceUrl,
    _0x3cca7e?.sourceLocalPath,
  );
}
export function resolveCollageItemSourceImage(_0x1f2622) {
  const _0x59cb5b = pickLocalPath(_0x1f2622?.sourceLocalPath),
    _0x5bdf42 = normalizeMediaUrl(_0x1f2622?.sourceUrl),
    _0x2b2de5 = toPositiveNumber(_0x1f2622?.sourceWidth, 0),
    _0x1abd92 = toPositiveNumber(_0x1f2622?.sourceHeight, 0),
    _0x404910 = toPositiveNumber(_0x1f2622?.imageWidth, 0),
    _0x51c41e = toPositiveNumber(_0x1f2622?.imageHeight, 0),
    _0x3e51b0 = _0x2b2de5 || _0x404910,
    _0x11b7e7 = _0x1abd92 || _0x51c41e,
    _0x2d3422 = _0x3e51b0 > 0 && _0x11b7e7 > 0,
    _0xdac0c4 = !!(_0x59cb5b || _0x5bdf42);
  if (_0xdac0c4)
    return {
      src: _0x5bdf42 || normalizeMediaUrl(_0x59cb5b),
      localPath: _0x59cb5b || pickLocalPath(_0x5bdf42),
      width: _0x3e51b0 || toPositiveNumber(_0x1f2622?.width, 0),
      height: _0x11b7e7 || toPositiveNumber(_0x1f2622?.height, 0),
      hasIntrinsicSize: _0x2d3422,
      isOriginalSource: true,
    };
  const _0x1ee396 = pickLocalPath(_0x1f2622?.localPath, _0x1f2622?.url, _0x1f2622?.thumbLocalPath);
  return {
    src: pickMediaUrl(_0x1f2622?.url, _0x1f2622?.localPath, _0x1f2622?.thumbLocalPath),
    localPath: _0x1ee396,
    width: _0x404910 || toPositiveNumber(_0x1f2622?.width, 0),
    height: _0x51c41e || toPositiveNumber(_0x1f2622?.height, 0),
    hasIntrinsicSize: _0x404910 > 0 && _0x51c41e > 0,
    isOriginalSource: false,
  };
}
function pickMainImageItem(_0x27a15, _0x19aead) {
  if (!Array.isArray(_0x27a15) || _0x27a15.length === 0) return null;
  const _0x5431b3 = Number(_0x19aead),
    _0x42fa88 = Number.isFinite(_0x5431b3) ? Math.max(0, Math.trunc(_0x5431b3)) : 0;
  return _0x27a15[_0x42fa88] || _0x27a15[0] || null;
}
export function getCollageLayoutPreset(_0x45d2ab) {
  const _0x513fef = trimString(_0x45d2ab) || 'freeform';
  return COLLAGE_LAYOUT_PRESETS.find((_0x445b7c) => _0x445b7c.id === _0x513fef) || COLLAGE_LAYOUT_PRESETS[0];
}
export function getCollageExportResolution(_0xe1683b) {
  const _0x775e87 = roundDimension(_0xe1683b, 0x800);
  return (
    COLLAGE_EXPORT_RESOLUTIONS.find((_0x220fbd) => _0x220fbd.longSide === _0x775e87) ||
    COLLAGE_EXPORT_RESOLUTIONS[1]
  );
}
export function getCollageAspectRatioOption(_0x5e1f55) {
  const _0x413ca7 = parseRatioLabel(_0x5e1f55);
  if (!_0x413ca7) return null;
  return COLLAGE_ASPECT_RATIO_OPTIONS.find((_0x553e7b) => _0x553e7b.label === _0x413ca7.label) || null;
}
export function getCollageBackgroundOption(_0x15ca4f) {
  const _0x3ef256 = trimString(_0x15ca4f),
    _0x2ae42b = _0x3ef256 || COLLAGE_BACKGROUND_DEFAULT;
  return (
    COLLAGE_BACKGROUND_OPTIONS.find(
      (_0x3592c8) => _0x3592c8.id === _0x2ae42b || _0x3592c8.value === _0x2ae42b,
    ) || COLLAGE_BACKGROUND_OPTIONS.find((_0x55eb14) => _0x55eb14.value === COLLAGE_BACKGROUND_DEFAULT)
  );
}
export function normalizeCollageBackgroundColor(_0x11ab16) {
  return getCollageBackgroundOption(_0x11ab16).value;
}
export function isCollageBackgroundTransparent(_0x144238) {
  return getCollageBackgroundOption(_0x144238).id === 'transparent';
}
export function normalizeCollageStyleValue(_0x2a3dc1, _0x185540 = 0) {
  const _0x5f29e0 = Number(_0x2a3dc1);
  if (!Number.isFinite(_0x5f29e0)) return _0x185540;
  return Math.min(100, Math.max(0, Math.round(_0x5f29e0)));
}
export function normalizeCollageImageScale(_0x54e708, _0x5cd942 = COLLAGE_IMAGE_SCALE_DEFAULT) {
  const _0x317f41 = Number(_0x54e708),
    _0x22d34d = Number.isFinite(Number(_0x5cd942)) ? Number(_0x5cd942) : COLLAGE_IMAGE_SCALE_DEFAULT,
    _0x41959d = Number.isFinite(_0x317f41) ? _0x317f41 : _0x22d34d,
    _0x5a0899 = Math.min(COLLAGE_IMAGE_SCALE_MAX, Math.max(COLLAGE_IMAGE_SCALE_MIN, _0x41959d));
  return Math.round(_0x5a0899 * 100) / 100;
}
export function getCollageLayoutStyle(_0x1b8449) {
  return {
    outerPadding: normalizeCollageStyleValue(
      _0x1b8449?.outerPadding,
      COLLAGE_LAYOUT_STYLE_DEFAULTS.outerPadding,
    ),
    gap: normalizeCollageStyleValue(_0x1b8449?.gap, COLLAGE_LAYOUT_STYLE_DEFAULTS.gap),
    cornerRadius: normalizeCollageStyleValue(
      _0x1b8449?.cornerRadius,
      COLLAGE_LAYOUT_STYLE_DEFAULTS.cornerRadius,
    ),
  };
}
export function isCollageItemEmpty(_0x3a5c9b) {
  return !(
    trimString(_0x3a5c9b?.url) ||
    trimString(_0x3a5c9b?.localPath) ||
    trimString(_0x3a5c9b?.thumbLocalPath) ||
    trimString(_0x3a5c9b?.sourceUrl) ||
    trimString(_0x3a5c9b?.sourceLocalPath)
  );
}
export function normalizeEmptyCollageItem(_0x542df0 = {}, _0x41808f = 0) {
  return {
    id: trimString(_0x542df0?.id) || 'collage-slot-' + _0x41808f,
    slotIndex: Number.isFinite(Number(_0x542df0?.slotIndex)) ? Number(_0x542df0.slotIndex) : _0x41808f,
    isEmpty: true,
    x: Number(_0x542df0?.x) || 0,
    y: Number(_0x542df0?.y) || 0,
    width: toPositiveNumber(_0x542df0?.width, 1),
    height: toPositiveNumber(_0x542df0?.height, 1),
    fit: trimString(_0x542df0?.fit) || 'cover',
    focusX: 0.5,
    focusY: 0.5,
    imageScale: COLLAGE_IMAGE_SCALE_DEFAULT,
    sourceNodeId: '',
    url: '',
    localPath: '',
    thumbLocalPath: '',
    sourceLocalPath: '',
    sourceUrl: '',
    sourceDisplayWidth: null,
    sourceDisplayHeight: null,
    label: '',
  };
}
function resolveSlotInset(_0x26bdb6, _0x46c5d3) {
  const _0x58447d = Math.min(
    normalizeCollageStyleValue(_0x46c5d3, 0),
    Math.max(0, _0x26bdb6.width * 0.45),
    Math.max(0, _0x26bdb6.height * 0.45),
  );
  return _0x58447d / 2;
}
export function resolveCollageItemFrames(_0x18e2ec) {
  const _0x116801 = toPositiveNumber(_0x18e2ec?.width, COLLAGE_DEFAULT_SIZE.width),
    _0x5275fc = toPositiveNumber(_0x18e2ec?.height, COLLAGE_DEFAULT_SIZE.height),
    { outerPadding: _0x53ca1e, gap: _0x2e5699, cornerRadius: _0x3dadd7 } = getCollageLayoutStyle(_0x18e2ec),
    _0x4b9d34 = Math.min(_0x53ca1e, Math.max(0, _0x116801 * 0.45), Math.max(0, _0x5275fc * 0.45)),
    _0x7929d2 = Math.max(1, _0x116801 - _0x4b9d34 * 2),
    _0x3ce9ae = Math.max(1, _0x5275fc - _0x4b9d34 * 2),
    _0x127e18 = _0x7929d2 / _0x116801,
    _0x854b2b = _0x3ce9ae / _0x5275fc,
    _0x56cc4b = Array.isArray(_0x18e2ec?.items) ? _0x18e2ec.items : [];
  return _0x56cc4b.map((_0x436fd3, _0x19304e) => {
    const _0x64959d = {
        x: _0x4b9d34 + (Number(_0x436fd3?.x) || 0) * _0x127e18,
        y: _0x4b9d34 + (Number(_0x436fd3?.y) || 0) * _0x854b2b,
        width: toPositiveNumber(_0x436fd3?.width, 1) * _0x127e18,
        height: toPositiveNumber(_0x436fd3?.height, 1) * _0x854b2b,
      },
      _0x2b22d7 = resolveSlotInset(_0x64959d, _0x2e5699),
      _0x5f44f4 = {
        x: _0x64959d.x + _0x2b22d7,
        y: _0x64959d.y + _0x2b22d7,
        width: Math.max(1, _0x64959d.width - _0x2b22d7 * 2),
        height: Math.max(1, _0x64959d.height - _0x2b22d7 * 2),
      };
    return {
      item: _0x436fd3,
      index: _0x19304e,
      frame: _0x5f44f4,
      style: { outerPadding: _0x4b9d34, gap: _0x2e5699, cornerRadius: _0x3dadd7 },
      isEmpty: isCollageItemEmpty(_0x436fd3),
    };
  });
}
export function getCollageItemIndexAtWorldPoint(_0x92ef74, _0x302e87, _0x534f95) {
  if (!_0x92ef74 || _0x92ef74.type !== COLLAGE_NODE_TYPE) return -1;
  const _0x511188 = Number(_0x302e87) - (Number(_0x92ef74.x) || 0),
    _0x1c0932 = Number(_0x534f95) - (Number(_0x92ef74.y) || 0);
  if (!Number.isFinite(_0x511188) || !Number.isFinite(_0x1c0932)) return -1;
  const _0x4c6472 = resolveCollageItemFrames(_0x92ef74);
  for (let _0x103ccf = _0x4c6472.length - 1; _0x103ccf >= 0; _0x103ccf -= 1) {
    const { frame: _0x4b2f55 } = _0x4c6472[_0x103ccf];
    if (
      _0x511188 >= _0x4b2f55.x &&
      _0x511188 <= _0x4b2f55.x + _0x4b2f55.width &&
      _0x1c0932 >= _0x4b2f55.y &&
      _0x1c0932 <= _0x4b2f55.y + _0x4b2f55.height
    )
      return _0x4c6472[_0x103ccf].index;
  }
  return -1;
}
function getCollageSlotGeometry(_0x51fd6e, _0x510801) {
  const _0x573e01 = getRawCollageItemFrame(_0x51fd6e);
  return {
    slotIndex: _0x510801,
    x: _0x573e01.x,
    y: _0x573e01.y,
    width: _0x573e01.width,
    height: _0x573e01.height,
    freeformX: Number.isFinite(Number(_0x51fd6e?.freeformX)) ? Number(_0x51fd6e.freeformX) : _0x573e01.x,
    freeformY: Number.isFinite(Number(_0x51fd6e?.freeformY)) ? Number(_0x51fd6e.freeformY) : _0x573e01.y,
    freeformWidth: toPositiveNumber(_0x51fd6e?.freeformWidth, _0x573e01.width),
    freeformHeight: toPositiveNumber(_0x51fd6e?.freeformHeight, _0x573e01.height),
  };
}
function createEmptyCollageSlotFromGeometry(_0x286c28, _0x2ecd58) {
  return {
    ...normalizeEmptyCollageItem({ ..._0x286c28, id: 'collage-slot-' + _0x2ecd58 }, _0x2ecd58),
    freeformX: _0x286c28.freeformX,
    freeformY: _0x286c28.freeformY,
    freeformWidth: _0x286c28.freeformWidth,
    freeformHeight: _0x286c28.freeformHeight,
  };
}
function placeCollageItemIntoSlot(_0x370129, _0x34a33e, _0x1c8636) {
  return {
    ..._0x370129,
    slotIndex: _0x1c8636,
    isEmpty: false,
    x: _0x34a33e.x,
    y: _0x34a33e.y,
    width: _0x34a33e.width,
    height: _0x34a33e.height,
    freeformX: _0x34a33e.freeformX,
    freeformY: _0x34a33e.freeformY,
    freeformWidth: _0x34a33e.freeformWidth,
    freeformHeight: _0x34a33e.freeformHeight,
  };
}
export function buildCollageItemSwapPatch(_0x39dcc7, _0x4bd30d, _0x1a8fa4) {
  const _0x2a6bc8 = (Array.isArray(_0x39dcc7?.items) ? _0x39dcc7.items : []).map((_0x20745c) => ({
      ..._0x20745c,
    })),
    _0x250238 = _0x2a6bc8[_0x4bd30d],
    _0x4bc1df = _0x2a6bc8[_0x1a8fa4];
  if (!_0x250238 || !_0x4bc1df || _0x4bd30d === _0x1a8fa4 || isCollageItemEmpty(_0x250238)) return null;
  const _0x3b4f00 = getCollageSlotGeometry(_0x250238, _0x4bd30d),
    _0x311054 = getCollageSlotGeometry(_0x4bc1df, _0x1a8fa4);
  return (
    (_0x2a6bc8[_0x1a8fa4] = placeCollageItemIntoSlot(_0x250238, _0x311054, _0x1a8fa4)),
    (_0x2a6bc8[_0x4bd30d] = isCollageItemEmpty(_0x4bc1df)
      ? createEmptyCollageSlotFromGeometry(_0x3b4f00, _0x4bd30d)
      : placeCollageItemIntoSlot(_0x4bc1df, _0x3b4f00, _0x4bd30d)),
    { items: _0x2a6bc8 }
  );
}
function roundCollageGeometryValue(_0x1d5229) {
  return Math.round((Number(_0x1d5229) || 0) * 100) / 100;
}
function getRawCollageItemFrame(_0x551b39) {
  return {
    x: Number(_0x551b39?.x) || 0,
    y: Number(_0x551b39?.y) || 0,
    width: toPositiveNumber(_0x551b39?.width, 1),
    height: toPositiveNumber(_0x551b39?.height, 1),
  };
}
function getCollageDividerMinSize(_0x30def3) {
  const _0x38e461 = toPositiveNumber(_0x30def3, 1);
  return Math.min(
    COLLAGE_DIVIDER_MAX_MIN_SIZE,
    Math.max(COLLAGE_DIVIDER_MIN_SIZE, _0x38e461 * COLLAGE_DIVIDER_MIN_SIZE_RATIO),
    _0x38e461 * 0.45,
  );
}
function collectCollageDividerBoundary(_0x40aa8b, _0x16a354, _0x4ed1f7, _0x2d9dac) {
  const _0x2155d4 = 0.5,
    _0x45ed2a = [],
    _0x5b7514 = [],
    _0x280d1b = [],
    _0x5841e3 = _0x16a354 === 'x',
    _0x251ab4 = _0x5841e3 ? 'y' : 'x',
    _0x1c4ffa = _0x5841e3 ? 'height' : 'width',
    _0xb93c84 = _0x5841e3 ? 'x' : 'y',
    _0x2beee1 = _0x5841e3 ? 'width' : 'height';
  if (_0x4ed1f7 <= _0x2155d4 || _0x4ed1f7 >= _0x2d9dac - _0x2155d4) return null;
  _0x40aa8b.forEach((_0x5d04c7, _0x31c1e3) => {
    const _0x53bd88 = getRawCollageItemFrame(_0x5d04c7),
      _0x5a9919 = _0x53bd88[_0xb93c84],
      _0x4dfc3d = _0x5a9919 + _0x53bd88[_0x2beee1];
    if (Math.abs(_0x4dfc3d - _0x4ed1f7) <= _0x2155d4) _0x45ed2a.push(_0x31c1e3);
    if (Math.abs(_0x5a9919 - _0x4ed1f7) <= _0x2155d4) _0x5b7514.push(_0x31c1e3);
  });
  if (_0x45ed2a.length === 0 || _0x5b7514.length === 0) return null;
  for (const _0x4f7140 of _0x45ed2a) {
    const _0x163c1c = getRawCollageItemFrame(_0x40aa8b[_0x4f7140]);
    for (const _0x1aa501 of _0x5b7514) {
      const _0x477528 = getRawCollageItemFrame(_0x40aa8b[_0x1aa501]),
        _0x3e7a62 = Math.max(_0x163c1c[_0x251ab4], _0x477528[_0x251ab4]),
        _0x2ba57a = Math.min(
          _0x163c1c[_0x251ab4] + _0x163c1c[_0x1c4ffa],
          _0x477528[_0x251ab4] + _0x477528[_0x1c4ffa],
        );
      _0x2ba57a - _0x3e7a62 > 1 && _0x280d1b.push({ start: _0x3e7a62, end: _0x2ba57a });
    }
  }
  if (_0x280d1b.length === 0) return null;
  const _0x5e07bb = Math.min(..._0x280d1b.map((_0x4c81ac) => _0x4c81ac.start)),
    _0x13c87d = Math.max(..._0x280d1b.map((_0x4bd670) => _0x4bd670.end)),
    _0x3ebd6d = roundCollageGeometryValue(_0x4ed1f7);
  return {
    id: _0x16a354 + '-' + _0x3ebd6d,
    axis: _0x16a354,
    position: _0x3ebd6d,
    spanStart: roundCollageGeometryValue(_0x5e07bb),
    spanEnd: roundCollageGeometryValue(_0x13c87d),
    beforeIndexes: Array.from(new Set(_0x45ed2a)),
    afterIndexes: Array.from(new Set(_0x5b7514)),
  };
}
function rawFrameRangesOverlap(_0x2bdb70, _0x1d4b47, _0x3fe10f, _0xf7f9a6) {
  const _0x2153b2 = Math.max(_0x2bdb70[_0x3fe10f], _0x1d4b47[_0x3fe10f]),
    _0x1b2a35 = Math.min(
      _0x2bdb70[_0x3fe10f] + _0x2bdb70[_0xf7f9a6],
      _0x1d4b47[_0x3fe10f] + _0x1d4b47[_0xf7f9a6],
    );
  return _0x1b2a35 - _0x2153b2 > 1;
}
function collectCollageAxisDividers(_0x430976, _0x26efb5, _0x44dfac) {
  const _0xd8825b = 0.5,
    _0x13168b = _0x26efb5 === 'x',
    _0x57b237 = _0x13168b ? 'x' : 'y',
    _0x2b9132 = _0x13168b ? 'width' : 'height',
    _0x5816bc = _0x13168b ? 'y' : 'x',
    _0x2ee314 = _0x13168b ? 'height' : 'width',
    _0x575ffd = new Map();
  return (
    _0x430976.forEach((_0x2c0bd2, _0x120e71) => {
      const _0x39a257 = getRawCollageItemFrame(_0x2c0bd2),
        _0x3eeaa0 = _0x39a257[_0x57b237];
      if (_0x3eeaa0 <= _0xd8825b || _0x3eeaa0 >= _0x44dfac - _0xd8825b) return;
      let _0x4c621e = -Infinity,
        _0x5d8d72 = [];
      _0x430976.forEach((_0x1ac7de, _0x1155d4) => {
        if (_0x1155d4 === _0x120e71) return;
        const _0x4c6947 = getRawCollageItemFrame(_0x1ac7de),
          _0x131ba5 = _0x4c6947[_0x57b237] + _0x4c6947[_0x2b9132];
        if (_0x131ba5 > _0x3eeaa0 + _0xd8825b) return;
        if (!rawFrameRangesOverlap(_0x4c6947, _0x39a257, _0x5816bc, _0x2ee314)) return;
        if (_0x131ba5 > _0x4c621e + _0xd8825b) ((_0x4c621e = _0x131ba5), (_0x5d8d72 = [_0x1155d4]));
        else Math.abs(_0x131ba5 - _0x4c621e) <= _0xd8825b && _0x5d8d72.push(_0x1155d4);
      });
      if (_0x5d8d72.length === 0) return;
      const _0x290982 = _0x26efb5 + '-' + roundCollageGeometryValue(_0x3eeaa0),
        _0x549c27 = _0x575ffd.get(_0x290982) || {
          id: _0x290982,
          axis: _0x26efb5,
          position: roundCollageGeometryValue(_0x3eeaa0),
          spanStart: Infinity,
          spanEnd: -Infinity,
          beforeIndexes: new Set(),
          afterIndexes: new Set(),
        };
      _0x549c27.afterIndexes.add(_0x120e71);
      for (const _0x1a3c59 of _0x5d8d72) {
        _0x549c27.beforeIndexes.add(_0x1a3c59);
        const _0x3df598 = getRawCollageItemFrame(_0x430976[_0x1a3c59]);
        ((_0x549c27.spanStart = Math.min(
          _0x549c27.spanStart,
          Math.max(_0x3df598[_0x5816bc], _0x39a257[_0x5816bc]),
        )),
          (_0x549c27.spanEnd = Math.max(
            _0x549c27.spanEnd,
            Math.min(
              _0x3df598[_0x5816bc] + _0x3df598[_0x2ee314],
              _0x39a257[_0x5816bc] + _0x39a257[_0x2ee314],
            ),
          )));
      }
      _0x575ffd.set(_0x290982, _0x549c27);
    }),
    Array.from(_0x575ffd.values())
      .filter((_0x154c1d) => _0x154c1d.spanEnd - _0x154c1d.spanStart > 1)
      .map((_0x535108) => ({
        ..._0x535108,
        spanStart: roundCollageGeometryValue(_0x535108.spanStart),
        spanEnd: roundCollageGeometryValue(_0x535108.spanEnd),
        beforeIndexes: Array.from(_0x535108.beforeIndexes),
        afterIndexes: Array.from(_0x535108.afterIndexes),
      }))
  );
}
export function resolveCollageEditableDividers(_0x293ab8) {
  const _0x1ad81e = toPositiveNumber(_0x293ab8?.width, COLLAGE_DEFAULT_SIZE.width),
    _0x226bcb = toPositiveNumber(_0x293ab8?.height, COLLAGE_DEFAULT_SIZE.height),
    _0x47b7e7 = Array.isArray(_0x293ab8?.items) ? _0x293ab8.items : [],
    _0x49b833 = [
      ...collectCollageAxisDividers(_0x47b7e7, 'x', _0x1ad81e),
      ...collectCollageAxisDividers(_0x47b7e7, 'y', _0x226bcb),
    ];
  return _0x49b833.sort((_0xd47545, _0x52ee38) =>
    _0xd47545.axis === _0x52ee38.axis
      ? _0xd47545.position - _0x52ee38.position
      : _0xd47545.axis.localeCompare(_0x52ee38.axis),
  );
}
export function buildCollageDividerDragPatch(_0x48bdc1, _0xaae403, _0x441cfe) {
  const _0x4be7f8 = _0xaae403?.axis === 'y' ? 'y' : 'x',
    _0x4a1c22 = _0x4be7f8 === 'x' ? 'width' : 'height',
    _0x516273 = _0x4be7f8 === 'x' ? 'x' : 'y',
    _0x3cab75 = toPositiveNumber(
      _0x4be7f8 === 'x' ? _0x48bdc1?.width : _0x48bdc1?.height,
      _0x4be7f8 === 'x' ? COLLAGE_DEFAULT_SIZE.width : COLLAGE_DEFAULT_SIZE.height,
    ),
    _0x2e4eef = (Array.isArray(_0x48bdc1?.items) ? _0x48bdc1.items : []).map((_0x5909a2) => ({
      ..._0x5909a2,
    })),
    _0x4b359f = Array.isArray(_0xaae403?.beforeIndexes) ? _0xaae403.beforeIndexes : [],
    _0x45625f = Array.isArray(_0xaae403?.afterIndexes) ? _0xaae403.afterIndexes : [];
  if (_0x4b359f.length === 0 || _0x45625f.length === 0) return { items: _0x2e4eef, delta: 0 };
  const _0x1bb788 = new Set(_0x4b359f),
    _0x543338 = new Set(_0x45625f),
    _0x3688d9 = new Set([..._0x1bb788, ..._0x543338]),
    _0x3f7a14 = Number(_0xaae403?.position) || 0,
    _0x2e1498 = getCollageDividerMinSize(_0x3cab75);
  let _0x45343a = -Infinity,
    _0x145b7b = Infinity;
  for (const _0x5586cd of _0x1bb788) {
    const _0x32cc4e = _0x2e4eef[_0x5586cd];
    if (!_0x32cc4e) continue;
    const _0x453b89 = getRawCollageItemFrame(_0x32cc4e);
    ((_0x45343a = Math.max(_0x45343a, _0x2e1498 - _0x453b89[_0x4a1c22])),
      (_0x145b7b = Math.min(_0x145b7b, _0x3cab75 - (_0x453b89[_0x516273] + _0x453b89[_0x4a1c22]))));
  }
  for (const _0x4b316b of _0x543338) {
    const _0x906747 = _0x2e4eef[_0x4b316b];
    if (!_0x906747) continue;
    const _0x4aa432 = getRawCollageItemFrame(_0x906747);
    ((_0x45343a = Math.max(_0x45343a, -_0x4aa432[_0x516273])),
      (_0x145b7b = Math.min(_0x145b7b, _0x4aa432[_0x4a1c22] - _0x2e1498)));
  }
  const _0x31fc7d = Math.min(_0x145b7b, Math.max(_0x45343a, Number(_0x441cfe) || 0));
  for (const _0x34e17b of _0x1bb788) {
    const _0x2f7b4a = _0x2e4eef[_0x34e17b];
    if (!_0x2f7b4a) continue;
    const _0x141f65 = getRawCollageItemFrame(_0x2f7b4a);
    _0x2e4eef[_0x34e17b] = {
      ..._0x2f7b4a,
      [_0x4a1c22]: roundCollageGeometryValue(_0x141f65[_0x4a1c22] + _0x31fc7d),
    };
  }
  for (const _0x253824 of _0x543338) {
    const _0x3b5880 = _0x2e4eef[_0x253824];
    if (!_0x3b5880) continue;
    const _0x561f2f = getRawCollageItemFrame(_0x3b5880);
    _0x2e4eef[_0x253824] = {
      ..._0x3b5880,
      [_0x516273]: roundCollageGeometryValue(_0x561f2f[_0x516273] + _0x31fc7d),
      [_0x4a1c22]: roundCollageGeometryValue(_0x561f2f[_0x4a1c22] - _0x31fc7d),
    };
  }
  return {
    items: _0x2e4eef,
    delta: roundCollageGeometryValue(_0x31fc7d),
    moveIndexes: Array.from(_0x3688d9),
  };
}
export function resolveCollageNodeImage(_0x374195) {
  if (!_0x374195 || typeof _0x374195 !== 'object') return { url: '', localPath: '', label: '' };
  const _0x36a1f4 = trimString(_0x374195.type);
  let _0x5c6441 = '',
    _0x474536 = '',
    _0x2502d1 = '',
    _0x31ac22 = '',
    _0x3ccb28 = '',
    _0x39a977 = 0,
    _0x167951 = 0,
    _0x46783f = 0,
    _0x467d97 = 0;
  if (_0x36a1f4 === 'source-image')
    ((_0x5c6441 = pickMediaUrl(
      _0x374195.displayLocalPath,
      _0x374195.localPath,
      _0x374195.originalLocalPath,
      _0x374195.src,
      _0x374195.sourceUrl,
      _0x374195.imageUrl,
      _0x374195.thumbLocalPath,
      _0x374195.thumbUrl,
    )),
      (_0x474536 = pickLocalPath(
        _0x374195.displayLocalPath,
        _0x374195.localPath,
        _0x374195.originalLocalPath,
        _0x374195.src,
        _0x374195.sourceUrl,
        _0x374195.imageUrl,
        _0x374195.thumbLocalPath,
        _0x374195.thumbUrl,
      )),
      (_0x2502d1 = pickLocalPath(_0x374195.thumbLocalPath, _0x374195.thumbUrl)),
      (_0x31ac22 = pickLocalPath(_0x374195.sourceLocalPath)),
      (_0x3ccb28 = normalizeMediaUrl(_0x374195.sourceUrl)),
      (_0x39a977 = toPositiveNumber(_0x374195.sourceWidth, 0)),
      (_0x167951 = toPositiveNumber(_0x374195.sourceHeight, 0)),
      (_0x46783f = toPositiveNumber(_0x374195.imageWidth, 0)),
      (_0x467d97 = toPositiveNumber(_0x374195.imageHeight, 0)));
  else {
    if (_0x36a1f4 === 'ai-image') {
      const _0x48f717 = pickMainImageItem(_0x374195.images, _0x374195.mainImageIndex);
      ((_0x5c6441 = pickMediaUrl(
        _0x48f717?.displayLocalPath,
        _0x48f717?.localPath,
        _0x48f717?.originalLocalPath,
        _0x48f717?.sourceUrl,
        _0x48f717?.imageUrl,
        _0x48f717?.url,
        _0x48f717?.thumbLocalPath,
        _0x48f717?.thumbUrl,
        _0x374195.displayLocalPath,
        _0x374195.localPath,
        _0x374195.originalLocalPath,
        _0x374195.sourceUrl,
        _0x374195.imageUrl,
        _0x374195.src,
        _0x374195.thumbLocalPath,
        _0x374195.thumbUrl,
      )),
        (_0x474536 = pickLocalPath(
          _0x48f717?.displayLocalPath,
          _0x48f717?.localPath,
          _0x48f717?.originalLocalPath,
          _0x48f717?.sourceUrl,
          _0x48f717?.imageUrl,
          _0x48f717?.url,
          _0x48f717?.thumbLocalPath,
          _0x48f717?.thumbUrl,
          _0x374195.displayLocalPath,
          _0x374195.localPath,
          _0x374195.originalLocalPath,
          _0x374195.sourceUrl,
          _0x374195.imageUrl,
          _0x374195.src,
          _0x374195.thumbLocalPath,
          _0x374195.thumbUrl,
        )),
        (_0x2502d1 = pickLocalPath(
          _0x48f717?.thumbLocalPath,
          _0x48f717?.thumbUrl,
          _0x374195.thumbLocalPath,
          _0x374195.thumbUrl,
        )),
        (_0x31ac22 = pickLocalPath(_0x48f717?.sourceLocalPath, _0x374195.sourceLocalPath)),
        (_0x3ccb28 = normalizeMediaUrl(_0x48f717?.sourceUrl || _0x374195.sourceUrl)),
        (_0x39a977 =
          toPositiveNumber(_0x48f717?.sourceWidth, 0) || toPositiveNumber(_0x374195.sourceWidth, 0)),
        (_0x167951 =
          toPositiveNumber(_0x48f717?.sourceHeight, 0) || toPositiveNumber(_0x374195.sourceHeight, 0)),
        (_0x46783f =
          toPositiveNumber(_0x48f717?.imageWidth || _0x48f717?.width, 0) ||
          toPositiveNumber(_0x374195.imageWidth || _0x374195.width, 0)),
        (_0x467d97 =
          toPositiveNumber(_0x48f717?.imageHeight || _0x48f717?.height, 0) ||
          toPositiveNumber(_0x374195.imageHeight || _0x374195.height, 0)));
    } else {
      if (_0x36a1f4 === 'storyboard') {
        const _0x469174 = Array.isArray(_0x374195.cells) ? _0x374195.cells : [],
          _0x3be98f = _0x469174.find(
            (_0x404fcf) =>
              resolveStoryboardCellAssetSrc(_0x404fcf) || resolveStoryboardCellPreviewSrc(_0x404fcf),
          ),
          _0x3f0e99 = resolveStoryboardCellAssetSrc(_0x3be98f) || resolveStoryboardCellPreviewSrc(_0x3be98f);
        ((_0x5c6441 = pickMediaUrl(
          _0x3f0e99,
          _0x374195.localPath,
          _0x374195.sourceUrl,
          _0x374195.imageUrl,
          _0x374195.src,
        )),
          (_0x474536 = pickLocalPath(
            _0x3be98f?.localPath,
            _0x3be98f?.displayLocalPath,
            _0x3be98f?.originalLocalPath,
            _0x3f0e99,
            _0x374195.localPath,
            _0x374195.sourceUrl,
            _0x374195.imageUrl,
            _0x374195.src,
          )),
          (_0x2502d1 = pickLocalPath(_0x3be98f?.thumbLocalPath, _0x374195.thumbLocalPath)),
          (_0x31ac22 = pickLocalPath(_0x3be98f?.sourceLocalPath, _0x374195.sourceLocalPath)),
          (_0x3ccb28 = normalizeMediaUrl(_0x3be98f?.sourceUrl || _0x374195.sourceUrl)),
          (_0x39a977 =
            toPositiveNumber(_0x3be98f?.sourceWidth, 0) || toPositiveNumber(_0x374195.sourceWidth, 0)),
          (_0x167951 =
            toPositiveNumber(_0x3be98f?.sourceHeight, 0) || toPositiveNumber(_0x374195.sourceHeight, 0)),
          (_0x46783f =
            toPositiveNumber(_0x3be98f?.imageWidth, 0) || toPositiveNumber(_0x374195.imageWidth, 0)),
          (_0x467d97 =
            toPositiveNumber(_0x3be98f?.imageHeight, 0) || toPositiveNumber(_0x374195.imageHeight, 0)));
      }
    }
  }
  return {
    url: _0x5c6441,
    localPath: _0x474536,
    thumbLocalPath: _0x2502d1,
    sourceLocalPath: _0x31ac22,
    sourceUrl: _0x3ccb28,
    sourceWidth: _0x39a977,
    sourceHeight: _0x167951,
    imageWidth: _0x46783f,
    imageHeight: _0x467d97,
    label: trimString(_0x374195.name) || trimString(_0x374195.fileName) || '',
  };
}
export function isCollageImageNode(_0x65d50) {
  return !!resolveCollageNodeImage(_0x65d50).url;
}
export function computeCollageBounds(_0x327370) {
  if (!Array.isArray(_0x327370) || _0x327370.length === 0) return null;
  let _0x4a8b1a = Infinity,
    _0x309376 = Infinity,
    _0x8adca1 = -Infinity,
    _0x99fc1d = -Infinity;
  for (const _0x3542d3 of _0x327370) {
    if (!_0x3542d3 || typeof _0x3542d3 !== 'object') continue;
    const _0xba097e = Number(_0x3542d3.x),
      _0x418f67 = Number(_0x3542d3.y),
      _0x518876 = toPositiveNumber(_0x3542d3.width, 0),
      _0x35b420 = toPositiveNumber(_0x3542d3.height, 0);
    if (!Number.isFinite(_0xba097e) || !Number.isFinite(_0x418f67) || _0x518876 <= 0 || _0x35b420 <= 0)
      continue;
    ((_0x4a8b1a = Math.min(_0x4a8b1a, _0xba097e)),
      (_0x309376 = Math.min(_0x309376, _0x418f67)),
      (_0x8adca1 = Math.max(_0x8adca1, _0xba097e + _0x518876)),
      (_0x99fc1d = Math.max(_0x99fc1d, _0x418f67 + _0x35b420)));
  }
  if (!Number.isFinite(_0x4a8b1a) || !Number.isFinite(_0x309376)) return null;
  return {
    x: _0x4a8b1a,
    y: _0x309376,
    width: Math.max(1, _0x8adca1 - _0x4a8b1a),
    height: Math.max(1, _0x99fc1d - _0x309376),
  };
}
export function buildCollageItemsFromNodes(_0x258208, _0xb7b3b1, _0x47448c = null) {
  const _0x186d57 = _0xb7b3b1 || computeCollageBounds(_0x258208);
  if (!_0x186d57) return [];
  const _0x2c1337 = toPositiveNumber(_0x47448c?.width, _0x186d57.width),
    _0x1c373a = toPositiveNumber(_0x47448c?.height, _0x186d57.height),
    _0x4ec6a4 = _0x2c1337 / _0x186d57.width,
    _0x1652c8 = _0x1c373a / _0x186d57.height;
  return (Array.isArray(_0x258208) ? _0x258208 : [])
    .map((_0x1c70dd, _0x2d5347) => {
      const _0x4e7e08 = resolveCollageNodeImage(_0x1c70dd);
      if (!_0x4e7e08.url) return null;
      const _0x4df60f = Number(_0x1c70dd.x) || 0,
        _0xfd8195 = Number(_0x1c70dd.y) || 0,
        _0x437534 = toPositiveNumber(_0x1c70dd.width, 1),
        _0x340cfe = toPositiveNumber(_0x1c70dd.height, 1),
        _0x11e5fb = {
          id: 'item-' + (trimString(_0x1c70dd.id) || _0x2d5347),
          sourceNodeId: trimString(_0x1c70dd.id),
          url: _0x4e7e08.url,
          localPath: _0x4e7e08.localPath,
          thumbLocalPath: _0x4e7e08.thumbLocalPath,
          sourceLocalPath: _0x4e7e08.sourceLocalPath,
          sourceUrl: _0x4e7e08.sourceUrl,
          sourceWidth: _0x4e7e08.sourceWidth || null,
          sourceHeight: _0x4e7e08.sourceHeight || null,
          imageWidth: _0x4e7e08.imageWidth || null,
          imageHeight: _0x4e7e08.imageHeight || null,
          sourceDisplayWidth: _0x437534,
          sourceDisplayHeight: _0x340cfe,
          label: _0x4e7e08.label,
          x: roundCollageGeometryValue((_0x4df60f - _0x186d57.x) * _0x4ec6a4),
          y: roundCollageGeometryValue((_0xfd8195 - _0x186d57.y) * _0x1652c8),
          width: roundCollageGeometryValue(_0x437534 * _0x4ec6a4),
          height: roundCollageGeometryValue(_0x340cfe * _0x1652c8),
          fit: 'cover',
          focusX: 0.5,
          focusY: 0.5,
        };
      return {
        ..._0x11e5fb,
        freeformX: _0x11e5fb.x,
        freeformY: _0x11e5fb.y,
        freeformWidth: _0x11e5fb.width,
        freeformHeight: _0x11e5fb.height,
      };
    })
    .filter(Boolean);
}
function createCollageBaseNodeData({
  id: _0x245b4a,
  x: x = 0,
  y: y = 0,
  width: width = COLLAGE_DEFAULT_SIZE.width,
  height: height = COLLAGE_DEFAULT_SIZE.height,
  name: name = '拼图',
} = {}) {
  return {
    id: _0x245b4a,
    type: COLLAGE_NODE_TYPE,
    schemaVersion: COLLAGE_SCHEMA_VERSION,
    name: name,
    x: x,
    y: y,
    width: roundDimension(width, COLLAGE_DEFAULT_SIZE.width),
    height: roundDimension(height, COLLAGE_DEFAULT_SIZE.height),
    aspectRatio: '',
    layoutPresetId: 'freeform',
    exportLongSide: 0x800,
    backgroundColor: COLLAGE_BACKGROUND_DEFAULT,
    outerPadding: COLLAGE_LAYOUT_STYLE_DEFAULTS.outerPadding,
    gap: COLLAGE_LAYOUT_STYLE_DEFAULTS.gap,
    cornerRadius: COLLAGE_LAYOUT_STYLE_DEFAULTS.cornerRadius,
    items: [],
  };
}
export function createEmptyCollageNodeData(_0x131279 = {}) {
  const _0x2057ac = {
    ...createCollageBaseNodeData(_0x131279),
    aspectRatio: COLLAGE_INITIAL_ASPECT_RATIO,
    layoutPresetId: COLLAGE_INITIAL_LAYOUT_PRESET_ID,
  };
  return { ..._0x2057ac, ...buildCollageLayoutPatch(_0x2057ac, COLLAGE_INITIAL_LAYOUT_PRESET_ID) };
}
export function buildCollageNodeDataFromSelection({
  id: _0x24fd18,
  nodes: _0x461aab,
  name: name = '拼图',
} = {}) {
  const _0x149611 = (Array.isArray(_0x461aab) ? _0x461aab : []).filter(isCollageImageNode),
    _0x4f65df = computeCollageBounds(_0x149611);
  if (!_0x4f65df) return null;
  return {
    ...createCollageBaseNodeData({
      id: _0x24fd18,
      name: name,
      x: _0x4f65df.x,
      y: _0x4f65df.y,
      width: _0x4f65df.width,
      height: _0x4f65df.height,
    }),
    aspectRatio: '',
    layoutPresetId: 'freeform',
    sourceBounds: { width: _0x4f65df.width, height: _0x4f65df.height },
    items: buildCollageItemsFromNodes(_0x149611, _0x4f65df),
  };
}
function cloneFreeformItem(_0x543020) {
  const _0x22a2fd = Number.isFinite(Number(_0x543020.freeformX))
      ? Number(_0x543020.freeformX)
      : Number(_0x543020.x) || 0,
    _0x5afb90 = Number.isFinite(Number(_0x543020.freeformY))
      ? Number(_0x543020.freeformY)
      : Number(_0x543020.y) || 0,
    _0x308136 = toPositiveNumber(_0x543020.freeformWidth, _0x543020.width || 1),
    _0x3cbe57 = toPositiveNumber(_0x543020.freeformHeight, _0x543020.height || 1);
  return {
    ..._0x543020,
    x: _0x22a2fd,
    y: _0x5afb90,
    width: _0x308136,
    height: _0x3cbe57,
    freeformX: _0x22a2fd,
    freeformY: _0x5afb90,
    freeformWidth: _0x308136,
    freeformHeight: _0x3cbe57,
  };
}
function getFreeformSize(_0x3531a6) {
  const _0x4cfbfe = toPositiveNumber(_0x3531a6?.sourceBounds?.width, 0),
    _0x4daf77 = toPositiveNumber(_0x3531a6?.sourceBounds?.height, 0);
  return {
    width: roundDimension(_0x4cfbfe || _0x3531a6?.width, COLLAGE_DEFAULT_SIZE.width),
    height: roundDimension(_0x4daf77 || _0x3531a6?.height, COLLAGE_DEFAULT_SIZE.height),
  };
}
function buildLayoutSlotItem({
  item: _0x3dcc07,
  preset: _0x16183f,
  slotIndex: _0x3bb3e7,
  slotBounds: _0x5b8eb9,
  scaleX: _0x5e7004,
  scaleY: _0x1253d2,
}) {
  const _0x29722f = _0x3dcc07 && !isCollageItemEmpty(_0x3dcc07);
  return {
    ...(_0x29722f ? _0x3dcc07 : {}),
    id: trimString(_0x3dcc07?.id) || _0x16183f.id + '-slot-' + _0x3bb3e7,
    sourceNodeId: trimString(_0x3dcc07?.sourceNodeId),
    url: trimString(_0x3dcc07?.url),
    localPath: trimString(_0x3dcc07?.localPath),
    label: trimString(_0x3dcc07?.label),
    fit: trimString(_0x3dcc07?.fit) || 'cover',
    focusX: Number.isFinite(Number(_0x3dcc07?.focusX)) ? Number(_0x3dcc07.focusX) : 0.5,
    focusY: Number.isFinite(Number(_0x3dcc07?.focusY)) ? Number(_0x3dcc07.focusY) : 0.5,
    imageScale: normalizeCollageImageScale(_0x3dcc07?.imageScale),
    slotIndex: _0x3bb3e7,
    isEmpty: !_0x29722f,
    x: _0x5b8eb9.x * _0x5e7004,
    y: _0x5b8eb9.y * _0x1253d2,
    width: _0x5b8eb9.width * _0x5e7004,
    height: _0x5b8eb9.height * _0x1253d2,
  };
}
function scaleCollageItemGeometry(_0x4d69fa, _0x4eacdd, _0x101f8d, _0x368891) {
  const _0xee65ea = {
    ..._0x4d69fa,
    x: (Number(_0x4d69fa?.x) || 0) * _0x4eacdd,
    y: (Number(_0x4d69fa?.y) || 0) * _0x101f8d,
    width: toPositiveNumber(_0x4d69fa?.width, 1) * _0x4eacdd,
    height: toPositiveNumber(_0x4d69fa?.height, 1) * _0x101f8d,
  };
  if (!_0x368891) return _0xee65ea;
  return {
    ..._0xee65ea,
    freeformX: (Number(_0x4d69fa?.freeformX) || 0) * _0x4eacdd,
    freeformY: (Number(_0x4d69fa?.freeformY) || 0) * _0x101f8d,
    freeformWidth: toPositiveNumber(_0x4d69fa?.freeformWidth, _0x4d69fa?.width || 1) * _0x4eacdd,
    freeformHeight: toPositiveNumber(_0x4d69fa?.freeformHeight, _0x4d69fa?.height || 1) * _0x101f8d,
  };
}
function getCollageCurrentSize(_0x1bb814) {
  return {
    width: roundDimension(_0x1bb814?.width, COLLAGE_DEFAULT_SIZE.width),
    height: roundDimension(_0x1bb814?.height, COLLAGE_DEFAULT_SIZE.height),
  };
}
function getCollageCurrentShortSide(_0x27c94b) {
  const _0x54c3d0 = getCollageCurrentSize(_0x27c94b);
  return Math.max(1, Math.min(_0x54c3d0.width, _0x54c3d0.height));
}
function buildCollageResizePatch(_0x4a0224, _0x225bd6, { includeFreeform: includeFreeform = false } = {}) {
  const _0x3e9e09 = getCollageCurrentSize(_0x4a0224),
    _0x5684c6 = {
      width: roundDimension(_0x225bd6?.width, _0x3e9e09.width),
      height: roundDimension(_0x225bd6?.height, _0x3e9e09.height),
    },
    _0x3c2afd = _0x5684c6.width / _0x3e9e09.width,
    _0xdac7ca = _0x5684c6.height / _0x3e9e09.height,
    _0x4a9ffe = Array.isArray(_0x4a0224?.items) ? _0x4a0224.items : [];
  return {
    width: _0x5684c6.width,
    height: _0x5684c6.height,
    items: _0x4a9ffe.map((_0x3ba51e) =>
      scaleCollageItemGeometry(_0x3ba51e, _0x3c2afd, _0xdac7ca, includeFreeform),
    ),
  };
}
export function buildCollageCollapsePatch(_0x39c9ac, _0x160c8d) {
  const _0xf92a8e = !!_0x160c8d,
    _0x42ea0b = getCollageCurrentSize(_0x39c9ac),
    _0x18a57d = getCollageLayoutPreset(_0x39c9ac?.layoutPresetId),
    _0x54dc32 = _0x18a57d.id === 'freeform';
  if (_0xf92a8e) {
    const _0x3e2274 = resolveCollageSizeByShortSide({
      width: _0x42ea0b.width,
      height: _0x42ea0b.height,
      shortSide: COLLAGE_COLLAPSED_SHORT_SIDE,
    });
    return {
      ...buildCollageResizePatch(_0x39c9ac, _0x3e2274, { includeFreeform: _0x54dc32 }),
      isCollapsed: true,
      isEditing: false,
      _originalWidth: _0x42ea0b.width,
      _originalHeight: _0x42ea0b.height,
    };
  }
  const _0x41631e =
      toPositiveNumber(_0x39c9ac?._originalWidth, 0) > 0 &&
      toPositiveNumber(_0x39c9ac?._originalHeight, 0) > 0,
    _0x45ef45 = {
      ...(_0x41631e
        ? {
            width: roundDimension(_0x39c9ac?._originalWidth, _0x42ea0b.width),
            height: roundDimension(_0x39c9ac?._originalHeight, _0x42ea0b.height),
          }
        : resolveCollageSizeByShortSide({
            width: _0x42ea0b.width,
            height: _0x42ea0b.height,
            shortSide: COLLAGE_EXPANDED_SHORT_SIDE,
          })),
    };
  return {
    ...buildCollageResizePatch(_0x39c9ac, _0x45ef45, { includeFreeform: _0x54dc32 }),
    isCollapsed: false,
  };
}
export function buildCollageAspectRatioPatch(_0x259a8d, _0xf17e29) {
  const _0x3eda45 = getCollageAspectRatioOption(_0xf17e29) || COLLAGE_ASPECT_RATIO_OPTIONS[0],
    _0x4f14cd = getCollageLayoutPreset(_0x259a8d?.layoutPresetId),
    _0x22dcc3 =
      _0x4f14cd.id === 'freeform' || !Array.isArray(_0x4f14cd.slots)
        ? resolveCollageSizeByShortSide({
            width: _0x3eda45.w,
            height: _0x3eda45.h,
            shortSide: getCollageCurrentShortSide(_0x259a8d),
          })
        : resolveCollagePresetSizeBySlotShortSide(_0x4f14cd, { aspectRatio: _0x3eda45.label });
  return {
    ...buildCollageResizePatch(_0x259a8d, _0x22dcc3, { includeFreeform: _0x4f14cd.id === 'freeform' }),
    aspectRatio: _0x3eda45.label,
  };
}
export function buildCollageLayoutPatch(_0x1fb4c9, _0xf2d19c) {
  const _0x4a946a = getCollageLayoutPreset(_0xf2d19c),
    _0x3837fc = Array.isArray(_0x1fb4c9?.items) ? _0x1fb4c9.items : [];
  if (_0x4a946a.id === 'freeform' || !Array.isArray(_0x4a946a.slots)) {
    const _0x1c766f = getFreeformSize(_0x1fb4c9);
    return {
      layoutPresetId: 'freeform',
      aspectRatio: '',
      width: _0x1c766f.width,
      height: _0x1c766f.height,
      items: _0x3837fc.map(cloneFreeformItem),
    };
  }
  const _0x26c9ed = toPositiveNumber(_0x4a946a.width, COLLAGE_DEFAULT_SIZE.width),
    _0x46bd45 = toPositiveNumber(_0x4a946a.height, COLLAGE_DEFAULT_SIZE.height),
    _0x18ce71 = getCollageAspectRatioOption(_0x1fb4c9?.aspectRatio),
    _0xedab07 = resolveCollagePresetSizeBySlotShortSide(_0x4a946a, { aspectRatio: _0x18ce71?.label || '' }),
    _0x59570d = _0xedab07.width,
    _0x2389f3 = _0xedab07.height,
    _0x5d2cc1 = _0x59570d / _0x26c9ed,
    _0x1831e0 = _0x2389f3 / _0x46bd45,
    _0x51c95a = _0x3837fc.filter((_0x101d74) => !isCollageItemEmpty(_0x101d74)),
    _0x21ae7e = _0x4a946a.slots.map((_0x5b43c1, _0x3afc4e) =>
      buildLayoutSlotItem({
        item: _0x51c95a[_0x3afc4e],
        preset: _0x4a946a,
        slotIndex: _0x3afc4e,
        slotBounds: _0x5b43c1,
        scaleX: _0x5d2cc1,
        scaleY: _0x1831e0,
      }),
    );
  return {
    layoutPresetId: _0x4a946a.id,
    aspectRatio: _0x18ce71?.label || '',
    width: _0x59570d,
    height: _0x2389f3,
    items: _0x21ae7e,
  };
}
export function resolveCollageExportSize(_0x59a305, _0x7a6631) {
  const _0x4ea140 = toPositiveNumber(_0x59a305?.width, COLLAGE_DEFAULT_SIZE.width),
    _0x3f1884 = toPositiveNumber(_0x59a305?.height, COLLAGE_DEFAULT_SIZE.height),
    _0x1c6ca3 = getCollageExportResolution(_0x7a6631).longSide,
    _0x1b5fe3 = _0x4ea140 / _0x3f1884;
  if (!Number.isFinite(_0x1b5fe3) || _0x1b5fe3 <= 0) return { width: _0x1c6ca3, height: _0x1c6ca3 };
  if (_0x1b5fe3 >= 1) return { width: _0x1c6ca3, height: roundDimension(_0x1c6ca3 / _0x1b5fe3, _0x1c6ca3) };
  return { width: roundDimension(_0x1c6ca3 * _0x1b5fe3, _0x1c6ca3), height: _0x1c6ca3 };
}
