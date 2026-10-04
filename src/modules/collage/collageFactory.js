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
  imageRatioOptionsByLabel = new Map(IMAGE_RATIO_OPTIONS.map((item) => [item.label, item]));
function createCollageAspectRatioOption(value) {
  const key = imageRatioOptionsByLabel.get(value),
    label = parseRatioLabel(key?.label || value);
  if (!label) return null;
  return Object.freeze({ label: label.label, value: label.label, w: label.w, h: label.h });
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
  slot = (x2, y2, width2, height2) => ({
    x: x2,
    y: y2,
    width: width2,
    height: height2,
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
  [2, 3, 4].map((slotCount) => ({
    slotCount: slotCount,
    label: String(slotCount),
    presets: COLLAGE_LAYOUT_PRESETS.filter((item2) => item2.slotCount === slotCount),
  })),
);
function trimString(index) {
  return typeof index === 'string' ? index.trim() : '';
}
function toPositiveNumber(result, data = 0) {
  const count = Number(result);
  return Number.isFinite(count) && count > 0 ? count : data;
}
function roundDimension(options, target = 1) {
  return Math.max(1, Math.round(toPositiveNumber(options, target)));
}
export function resolveCollageSizeByShortSide({
  width: width3,
  height: height3,
  shortSide: shortSide = COLLAGE_EXPANDED_SHORT_SIDE,
} = {}) {
  const width4 = roundDimension(shortSide, COLLAGE_EXPANDED_SHORT_SIDE),
    toPositiveNumber2 = toPositiveNumber(width3, 0),
    toPositiveNumber3 = toPositiveNumber(height3, 0);
  if (!(toPositiveNumber2 > 0 && toPositiveNumber3 > 0)) return { width: width4, height: width4 };
  const count2 = toPositiveNumber2 / toPositiveNumber3;
  if (!Number.isFinite(count2) || count2 <= 0) return { width: width4, height: width4 };
  if (count2 >= 1) return { width: roundDimension(width4 * count2, width4), height: width4 };
  return { width: width4, height: roundDimension(width4 / count2, width4) };
}
export function resolveCollagePresetSizeBySlotShortSide(
  source,
  { aspectRatio: aspectRatio = '', slotShortSide: slotShortSide = COLLAGE_SLOT_SHORT_SIDE } = {},
) {
  const box = source && typeof source === 'object' ? source : {},
    toPositiveNumber4 = toPositiveNumber(box.width, COLLAGE_DEFAULT_SIZE.width),
    toPositiveNumber5 = toPositiveNumber(box.height, COLLAGE_DEFAULT_SIZE.height),
    collageAspectRatioOption = getCollageAspectRatioOption(aspectRatio),
    next = collageAspectRatioOption?.w || toPositiveNumber4,
    current = collageAspectRatioOption?.h || toPositiveNumber5,
    entry = current / next,
    roundDimension2 = roundDimension(slotShortSide, COLLAGE_SLOT_SHORT_SIDE),
    record = Array.isArray(box.slots) ? box.slots : [];
  let count3 = Infinity;
  for (const box2 of record) {
    const toPositiveNumber6 = toPositiveNumber(box2?.width, 0) / toPositiveNumber4,
      payload = (toPositiveNumber(box2?.height, 0) / toPositiveNumber5) * entry,
      count4 = Math.min(toPositiveNumber6, payload);
    Number.isFinite(count4) && count4 > 0 && (count3 = Math.min(count3, count4));
  }
  (!Number.isFinite(count3) || count3 <= 0) && (count3 = Math.min(1, entry));
  const handle = roundDimension2 / count3,
    state = handle * entry;
  return {
    width: roundDimension(handle, COLLAGE_DEFAULT_SIZE.width),
    height: roundDimension(state, COLLAGE_DEFAULT_SIZE.height),
  };
}
function normalizeMediaUrl(config) {
  const trimString2 = trimString(config);
  if (!trimString2) return '';
  if (/^(https?:|blob:|data:)/i.test(trimString2)) return trimString2;
  const url = localPathToUrl(trimString2);
  return url || '';
}
function pickMediaUrl(...args) {
  for (const scope of args) {
    const mediaUrl = normalizeMediaUrl(scope);
    if (mediaUrl) return mediaUrl;
  }
  return '';
}
function pickLocalPath(...args2) {
  for (const input of args2) {
    const localPath = normalizeLocalPath(input);
    if (localPath) return localPath;
  }
  return '';
}
export function resolveCollageItemPreviewUrl(response) {
  return pickMediaUrl(
    response?.url,
    response?.localPath,
    response?.thumbLocalPath,
    response?.sourceUrl,
    response?.sourceLocalPath,
  );
}
export function resolveCollageItemSourceImage(box3) {
  const localPath2 = pickLocalPath(box3?.sourceLocalPath),
    src = normalizeMediaUrl(box3?.sourceUrl),
    toPositiveNumber7 = toPositiveNumber(box3?.sourceWidth, 0),
    toPositiveNumber8 = toPositiveNumber(box3?.sourceHeight, 0),
    width5 = toPositiveNumber(box3?.imageWidth, 0),
    height4 = toPositiveNumber(box3?.imageHeight, 0),
    width6 = toPositiveNumber7 || width5,
    height5 = toPositiveNumber8 || height4,
    hasIntrinsicSize = width6 > 0 && height5 > 0,
    output = !!(localPath2 || src);
  if (output)
    return {
      src: src || normalizeMediaUrl(localPath2),
      localPath: localPath2 || pickLocalPath(src),
      width: width6 || toPositiveNumber(box3?.width, 0),
      height: height5 || toPositiveNumber(box3?.height, 0),
      hasIntrinsicSize: hasIntrinsicSize,
      isOriginalSource: true,
    };
  const localPath3 = pickLocalPath(box3?.localPath, box3?.url, box3?.thumbLocalPath);
  return {
    src: pickMediaUrl(box3?.url, box3?.localPath, box3?.thumbLocalPath),
    localPath: localPath3,
    width: width5 || toPositiveNumber(box3?.width, 0),
    height: height4 || toPositiveNumber(box3?.height, 0),
    hasIntrinsicSize: width5 > 0 && height4 > 0,
    isOriginalSource: false,
  };
}
function pickMainImageItem(list, value2) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const value3 = Number(value2),
    value4 = Number.isFinite(value3) ? Math.max(0, Math.trunc(value3)) : 0;
  return list[value4] || list[0] || null;
}
export function getCollageLayoutPreset(value5) {
  const trimString3 = trimString(value5) || 'freeform';
  return COLLAGE_LAYOUT_PRESETS.find((item3) => item3.id === trimString3) || COLLAGE_LAYOUT_PRESETS[0];
}
export function getCollageExportResolution(value6) {
  const roundDimension3 = roundDimension(value6, 0x800);
  return (
    COLLAGE_EXPORT_RESOLUTIONS.find((item4) => item4.longSide === roundDimension3) ||
    COLLAGE_EXPORT_RESOLUTIONS[1]
  );
}
export function getCollageAspectRatioOption(value7) {
  const ratioLabel = parseRatioLabel(value7);
  if (!ratioLabel) return null;
  return COLLAGE_ASPECT_RATIO_OPTIONS.find((item5) => item5.label === ratioLabel.label) || null;
}
export function getCollageBackgroundOption(value8) {
  const trimString4 = trimString(value8),
    value9 = trimString4 || COLLAGE_BACKGROUND_DEFAULT;
  return (
    COLLAGE_BACKGROUND_OPTIONS.find((el) => el.id === value9 || el.value === value9) ||
    COLLAGE_BACKGROUND_OPTIONS.find((el2) => el2.value === COLLAGE_BACKGROUND_DEFAULT)
  );
}
export function normalizeCollageBackgroundColor(value10) {
  return getCollageBackgroundOption(value10).value;
}
export function isCollageBackgroundTransparent(value11) {
  return getCollageBackgroundOption(value11).id === 'transparent';
}
export function normalizeCollageStyleValue(value12, value13 = 0) {
  const value14 = Number(value12);
  if (!Number.isFinite(value14)) return value13;
  return Math.min(100, Math.max(0, Math.round(value14)));
}
export function normalizeCollageImageScale(value15, value16 = COLLAGE_IMAGE_SCALE_DEFAULT) {
  const value17 = Number(value15),
    value18 = Number.isFinite(Number(value16)) ? Number(value16) : COLLAGE_IMAGE_SCALE_DEFAULT,
    value19 = Number.isFinite(value17) ? value17 : value18,
    value20 = Math.min(COLLAGE_IMAGE_SCALE_MAX, Math.max(COLLAGE_IMAGE_SCALE_MIN, value19));
  return Math.round(value20 * 100) / 100;
}
export function getCollageLayoutStyle(value21) {
  return {
    outerPadding: normalizeCollageStyleValue(
      value21?.outerPadding,
      COLLAGE_LAYOUT_STYLE_DEFAULTS.outerPadding,
    ),
    gap: normalizeCollageStyleValue(value21?.gap, COLLAGE_LAYOUT_STYLE_DEFAULTS.gap),
    cornerRadius: normalizeCollageStyleValue(
      value21?.cornerRadius,
      COLLAGE_LAYOUT_STYLE_DEFAULTS.cornerRadius,
    ),
  };
}
export function isCollageItemEmpty(response2) {
  return !(
    trimString(response2?.url) ||
    trimString(response2?.localPath) ||
    trimString(response2?.thumbLocalPath) ||
    trimString(response2?.sourceUrl) ||
    trimString(response2?.sourceLocalPath)
  );
}
export function normalizeEmptyCollageItem(box4 = {}, value22 = 0) {
  return {
    id: trimString(box4?.id) || 'collage-slot-' + value22,
    slotIndex: Number.isFinite(Number(box4?.slotIndex)) ? Number(box4.slotIndex) : value22,
    isEmpty: true,
    x: Number(box4?.x) || 0,
    y: Number(box4?.y) || 0,
    width: toPositiveNumber(box4?.width, 1),
    height: toPositiveNumber(box4?.height, 1),
    fit: trimString(box4?.fit) || 'cover',
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
function resolveSlotInset(box5, value23) {
  const value24 = Math.min(
    normalizeCollageStyleValue(value23, 0),
    Math.max(0, box5.width * 0.45),
    Math.max(0, box5.height * 0.45),
  );
  return value24 / 2;
}
export function resolveCollageItemFrames(box6) {
  const toPositiveNumber9 = toPositiveNumber(box6?.width, COLLAGE_DEFAULT_SIZE.width),
    toPositiveNumber10 = toPositiveNumber(box6?.height, COLLAGE_DEFAULT_SIZE.height),
    { outerPadding: outerPadding, gap: gap, cornerRadius: cornerRadius } = getCollageLayoutStyle(box6),
    x3 = Math.min(
      outerPadding,
      Math.max(0, toPositiveNumber9 * 0.45),
      Math.max(0, toPositiveNumber10 * 0.45),
    ),
    value25 = Math.max(1, toPositiveNumber9 - x3 * 2),
    value26 = Math.max(1, toPositiveNumber10 - x3 * 2),
    value27 = value25 / toPositiveNumber9,
    value28 = value26 / toPositiveNumber10,
    list2 = Array.isArray(box6?.items) ? box6.items : [];
  return list2.map((item6, index2) => {
    const x4 = {
        x: x3 + (Number(item6?.x) || 0) * value27,
        y: x3 + (Number(item6?.y) || 0) * value28,
        width: toPositiveNumber(item6?.width, 1) * value27,
        height: toPositiveNumber(item6?.height, 1) * value28,
      },
      slotInset = resolveSlotInset(x4, gap),
      frame = {
        x: x4.x + slotInset,
        y: x4.y + slotInset,
        width: Math.max(1, x4.width - slotInset * 2),
        height: Math.max(1, x4.height - slotInset * 2),
      };
    return {
      item: item6,
      index: index2,
      frame: frame,
      style: { outerPadding: x3, gap: gap, cornerRadius: cornerRadius },
      isEmpty: isCollageItemEmpty(item6),
    };
  });
}
export function getCollageItemIndexAtWorldPoint(box7, value29, value30) {
  if (!box7 || box7.type !== COLLAGE_NODE_TYPE) return -1;
  const value31 = Number(value29) - (Number(box7.x) || 0),
    value32 = Number(value30) - (Number(box7.y) || 0);
  if (!Number.isFinite(value31) || !Number.isFinite(value32)) return -1;
  const list3 = resolveCollageItemFrames(box7);
  for (let count5 = list3.length - 1; count5 >= 0; count5 -= 1) {
    const { frame: frame2 } = list3[count5];
    if (
      value31 >= frame2.x &&
      value31 <= frame2.x + frame2.width &&
      value32 >= frame2.y &&
      value32 <= frame2.y + frame2.height
    )
      return list3[count5].index;
  }
  return -1;
}
function getCollageSlotGeometry(value33, slotIndex) {
  const x5 = getRawCollageItemFrame(value33);
  return {
    slotIndex: slotIndex,
    x: x5.x,
    y: x5.y,
    width: x5.width,
    height: x5.height,
    freeformX: Number.isFinite(Number(value33?.freeformX)) ? Number(value33.freeformX) : x5.x,
    freeformY: Number.isFinite(Number(value33?.freeformY)) ? Number(value33.freeformY) : x5.y,
    freeformWidth: toPositiveNumber(value33?.freeformWidth, x5.width),
    freeformHeight: toPositiveNumber(value33?.freeformHeight, x5.height),
  };
}
function createEmptyCollageSlotFromGeometry(freeformX, value34) {
  return {
    ...normalizeEmptyCollageItem({ ...freeformX, id: 'collage-slot-' + value34 }, value34),
    freeformX: freeformX.freeformX,
    freeformY: freeformX.freeformY,
    freeformWidth: freeformX.freeformWidth,
    freeformHeight: freeformX.freeformHeight,
  };
}
function placeCollageItemIntoSlot(args3, x6, slotIndex2) {
  return {
    ...args3,
    slotIndex: slotIndex2,
    isEmpty: false,
    x: x6.x,
    y: x6.y,
    width: x6.width,
    height: x6.height,
    freeformX: x6.freeformX,
    freeformY: x6.freeformY,
    freeformWidth: x6.freeformWidth,
    freeformHeight: x6.freeformHeight,
  };
}
export function buildCollageItemSwapPatch(value35, value36, value37) {
  const items = (Array.isArray(value35?.items) ? value35.items : []).map((args4) => ({
      ...args4,
    })),
    enabled = items[value36],
    enabled2 = items[value37];
  if (!enabled || !enabled2 || value36 === value37 || isCollageItemEmpty(enabled)) return null;
  const collageSlotGeometry = getCollageSlotGeometry(enabled, value36),
    collageSlotGeometry2 = getCollageSlotGeometry(enabled2, value37);
  return (
    (items[value37] = placeCollageItemIntoSlot(enabled, collageSlotGeometry2, value37)),
    (items[value36] = isCollageItemEmpty(enabled2)
      ? createEmptyCollageSlotFromGeometry(collageSlotGeometry, value36)
      : placeCollageItemIntoSlot(enabled2, collageSlotGeometry, value36)),
    { items: items }
  );
}
function roundCollageGeometryValue(value38) {
  return Math.round((Number(value38) || 0) * 100) / 100;
}
function getRawCollageItemFrame(box8) {
  return {
    x: Number(box8?.x) || 0,
    y: Number(box8?.y) || 0,
    width: toPositiveNumber(box8?.width, 1),
    height: toPositiveNumber(box8?.height, 1),
  };
}
function getCollageDividerMinSize(value39) {
  const toPositiveNumber11 = toPositiveNumber(value39, 1);
  return Math.min(
    COLLAGE_DIVIDER_MAX_MIN_SIZE,
    Math.max(COLLAGE_DIVIDER_MIN_SIZE, toPositiveNumber11 * COLLAGE_DIVIDER_MIN_SIZE_RATIO),
    toPositiveNumber11 * 0.45,
  );
}
function collectCollageDividerBoundary(list4, id2, value40, value41) {
  const value42 = 0.5,
    list5 = [],
    list6 = [],
    list7 = [],
    value43 = id2 === 'x',
    value44 = value43 ? 'y' : 'x',
    value45 = value43 ? 'height' : 'width',
    value46 = value43 ? 'x' : 'y',
    value47 = value43 ? 'width' : 'height';
  if (value40 <= value42 || value40 >= value41 - value42) return null;
  list4.forEach((item7, value48) => {
    const rawCollageItemFrame = getRawCollageItemFrame(item7),
      value49 = rawCollageItemFrame[value46],
      value50 = value49 + rawCollageItemFrame[value47];
    if (Math.abs(value50 - value40) <= value42) list5.push(value48);
    if (Math.abs(value49 - value40) <= value42) list6.push(value48);
  });
  if (list5.length === 0 || list6.length === 0) return null;
  for (const value51 of list5) {
    const rawCollageItemFrame2 = getRawCollageItemFrame(list4[value51]);
    for (const value52 of list6) {
      const rawCollageItemFrame3 = getRawCollageItemFrame(list4[value52]),
        start = Math.max(rawCollageItemFrame2[value44], rawCollageItemFrame3[value44]),
        end = Math.min(
          rawCollageItemFrame2[value44] + rawCollageItemFrame2[value45],
          rawCollageItemFrame3[value44] + rawCollageItemFrame3[value45],
        );
      end - start > 1 && list7.push({ start: start, end: end });
    }
  }
  if (list7.length === 0) return null;
  const value53 = Math.min(...list7.map((item8) => item8.start)),
    value54 = Math.max(...list7.map((item9) => item9.end)),
    position2 = roundCollageGeometryValue(value40);
  return {
    id: id2 + '-' + position2,
    axis: id2,
    position: position2,
    spanStart: roundCollageGeometryValue(value53),
    spanEnd: roundCollageGeometryValue(value54),
    beforeIndexes: Array.from(new Set(list5)),
    afterIndexes: Array.from(new Set(list6)),
  };
}
function rawFrameRangesOverlap(value55, value56, value57, value58) {
  const count6 = Math.max(value55[value57], value56[value57]),
    value59 = Math.min(value55[value57] + value55[value58], value56[value57] + value56[value58]);
  return value59 - count6 > 1;
}
function collectCollageAxisDividers(list8, axis2, value60) {
  const value61 = 0.5,
    value62 = axis2 === 'x',
    value63 = value62 ? 'x' : 'y',
    value64 = value62 ? 'width' : 'height',
    value65 = value62 ? 'y' : 'x',
    value66 = value62 ? 'height' : 'width',
    map = new Map();
  return (
    list8.forEach((item10, value67) => {
      const rawCollageItemFrame4 = getRawCollageItemFrame(item10),
        value68 = rawCollageItemFrame4[value63];
      if (value68 <= value61 || value68 >= value60 - value61) return;
      let value69 = -Infinity,
        list9 = [];
      list8.forEach((item11, value70) => {
        if (value70 === value67) return;
        const rawCollageItemFrame5 = getRawCollageItemFrame(item11),
          value71 = rawCollageItemFrame5[value63] + rawCollageItemFrame5[value64];
        if (value71 > value68 + value61) return;
        if (!rawFrameRangesOverlap(rawCollageItemFrame5, rawCollageItemFrame4, value65, value66)) return;
        if (value71 > value69 + value61) ((value69 = value71), (list9 = [value70]));
        else Math.abs(value71 - value69) <= value61 && list9.push(value70);
      });
      if (list9.length === 0) return;
      const id3 = axis2 + '-' + roundCollageGeometryValue(value68),
        value72 = map.get(id3) || {
          id: id3,
          axis: axis2,
          position: roundCollageGeometryValue(value68),
          spanStart: Infinity,
          spanEnd: -Infinity,
          beforeIndexes: new Set(),
          afterIndexes: new Set(),
        };
      value72.afterIndexes.add(value67);
      for (const value73 of list9) {
        value72.beforeIndexes.add(value73);
        const rawCollageItemFrame6 = getRawCollageItemFrame(list8[value73]);
        ((value72.spanStart = Math.min(
          value72.spanStart,
          Math.max(rawCollageItemFrame6[value65], rawCollageItemFrame4[value65]),
        )),
          (value72.spanEnd = Math.max(
            value72.spanEnd,
            Math.min(
              rawCollageItemFrame6[value65] + rawCollageItemFrame6[value66],
              rawCollageItemFrame4[value65] + rawCollageItemFrame4[value66],
            ),
          )));
      }
      map.set(id3, value72);
    }),
    Array.from(map.values())
      .filter((item12) => item12.spanEnd - item12.spanStart > 1)
      .map((args5) => ({
        ...args5,
        spanStart: roundCollageGeometryValue(args5.spanStart),
        spanEnd: roundCollageGeometryValue(args5.spanEnd),
        beforeIndexes: Array.from(args5.beforeIndexes),
        afterIndexes: Array.from(args5.afterIndexes),
      }))
  );
}
export function resolveCollageEditableDividers(box9) {
  const toPositiveNumber12 = toPositiveNumber(box9?.width, COLLAGE_DEFAULT_SIZE.width),
    toPositiveNumber13 = toPositiveNumber(box9?.height, COLLAGE_DEFAULT_SIZE.height),
    value74 = Array.isArray(box9?.items) ? box9.items : [],
    list10 = [
      ...collectCollageAxisDividers(value74, 'x', toPositiveNumber12),
      ...collectCollageAxisDividers(value74, 'y', toPositiveNumber13),
    ];
  return list10.sort((item13, value75) =>
    item13.axis === value75.axis
      ? item13.position - value75.position
      : item13.axis.localeCompare(value75.axis),
  );
}
export function buildCollageDividerDragPatch(box10, value76, value77) {
  const value78 = value76?.axis === 'y' ? 'y' : 'x',
    value79 = value78 === 'x' ? 'width' : 'height',
    value80 = value78 === 'x' ? 'x' : 'y',
    toPositiveNumber14 = toPositiveNumber(
      value78 === 'x' ? box10?.width : box10?.height,
      value78 === 'x' ? COLLAGE_DEFAULT_SIZE.width : COLLAGE_DEFAULT_SIZE.height,
    ),
    items2 = (Array.isArray(box10?.items) ? box10.items : []).map((args6) => ({
      ...args6,
    })),
    list11 = Array.isArray(value76?.beforeIndexes) ? value76.beforeIndexes : [],
    list12 = Array.isArray(value76?.afterIndexes) ? value76.afterIndexes : [];
  if (list11.length === 0 || list12.length === 0) return { items: items2, delta: 0 };
  const args7 = new Set(list11),
    args8 = new Set(list12),
    value81 = new Set([...args7, ...args8]),
    value82 = Number(value76?.position) || 0,
    collageDividerMinSize = getCollageDividerMinSize(toPositiveNumber14);
  let value83 = -Infinity,
    value84 = Infinity;
  for (const value85 of args7) {
    const enabled3 = items2[value85];
    if (!enabled3) continue;
    const rawCollageItemFrame7 = getRawCollageItemFrame(enabled3);
    ((value83 = Math.max(value83, collageDividerMinSize - rawCollageItemFrame7[value79])),
      (value84 = Math.min(
        value84,
        toPositiveNumber14 - (rawCollageItemFrame7[value80] + rawCollageItemFrame7[value79]),
      )));
  }
  for (const value86 of args8) {
    const enabled4 = items2[value86];
    if (!enabled4) continue;
    const rawCollageItemFrame8 = getRawCollageItemFrame(enabled4);
    ((value83 = Math.max(value83, -rawCollageItemFrame8[value80])),
      (value84 = Math.min(value84, rawCollageItemFrame8[value79] - collageDividerMinSize)));
  }
  const value87 = Math.min(value84, Math.max(value83, Number(value77) || 0));
  for (const value88 of args7) {
    const args9 = items2[value88];
    if (!args9) continue;
    const rawCollageItemFrame9 = getRawCollageItemFrame(args9);
    items2[value88] = {
      ...args9,
      [value79]: roundCollageGeometryValue(rawCollageItemFrame9[value79] + value87),
    };
  }
  for (const value89 of args8) {
    const args10 = items2[value89];
    if (!args10) continue;
    const rawCollageItemFrame10 = getRawCollageItemFrame(args10);
    items2[value89] = {
      ...args10,
      [value80]: roundCollageGeometryValue(rawCollageItemFrame10[value80] + value87),
      [value79]: roundCollageGeometryValue(rawCollageItemFrame10[value79] - value87),
    };
  }
  return {
    items: items2,
    delta: roundCollageGeometryValue(value87),
    moveIndexes: Array.from(value81),
  };
}
export function resolveCollageNodeImage(box11) {
  if (!box11 || typeof box11 !== 'object') return { url: '', localPath: '', label: '' };
  const trimString5 = trimString(box11.type);
  let url2 = '',
    localPath4 = '',
    thumbLocalPath = '',
    sourceLocalPath = '',
    sourceUrl = '',
    sourceWidth = 0,
    sourceHeight = 0,
    imageWidth = 0,
    imageHeight = 0;
  if (trimString5 === 'source-image')
    ((url2 = pickMediaUrl(
      box11.displayLocalPath,
      box11.localPath,
      box11.originalLocalPath,
      box11.src,
      box11.sourceUrl,
      box11.imageUrl,
      box11.thumbLocalPath,
      box11.thumbUrl,
    )),
      (localPath4 = pickLocalPath(
        box11.displayLocalPath,
        box11.localPath,
        box11.originalLocalPath,
        box11.src,
        box11.sourceUrl,
        box11.imageUrl,
        box11.thumbLocalPath,
        box11.thumbUrl,
      )),
      (thumbLocalPath = pickLocalPath(box11.thumbLocalPath, box11.thumbUrl)),
      (sourceLocalPath = pickLocalPath(box11.sourceLocalPath)),
      (sourceUrl = normalizeMediaUrl(box11.sourceUrl)),
      (sourceWidth = toPositiveNumber(box11.sourceWidth, 0)),
      (sourceHeight = toPositiveNumber(box11.sourceHeight, 0)),
      (imageWidth = toPositiveNumber(box11.imageWidth, 0)),
      (imageHeight = toPositiveNumber(box11.imageHeight, 0)));
  else {
    if (trimString5 === 'ai-image') {
      const box12 = pickMainImageItem(box11.images, box11.mainImageIndex);
      ((url2 = pickMediaUrl(
        box12?.displayLocalPath,
        box12?.localPath,
        box12?.originalLocalPath,
        box12?.sourceUrl,
        box12?.imageUrl,
        box12?.url,
        box12?.thumbLocalPath,
        box12?.thumbUrl,
        box11.displayLocalPath,
        box11.localPath,
        box11.originalLocalPath,
        box11.sourceUrl,
        box11.imageUrl,
        box11.src,
        box11.thumbLocalPath,
        box11.thumbUrl,
      )),
        (localPath4 = pickLocalPath(
          box12?.displayLocalPath,
          box12?.localPath,
          box12?.originalLocalPath,
          box12?.sourceUrl,
          box12?.imageUrl,
          box12?.url,
          box12?.thumbLocalPath,
          box12?.thumbUrl,
          box11.displayLocalPath,
          box11.localPath,
          box11.originalLocalPath,
          box11.sourceUrl,
          box11.imageUrl,
          box11.src,
          box11.thumbLocalPath,
          box11.thumbUrl,
        )),
        (thumbLocalPath = pickLocalPath(
          box12?.thumbLocalPath,
          box12?.thumbUrl,
          box11.thumbLocalPath,
          box11.thumbUrl,
        )),
        (sourceLocalPath = pickLocalPath(box12?.sourceLocalPath, box11.sourceLocalPath)),
        (sourceUrl = normalizeMediaUrl(box12?.sourceUrl || box11.sourceUrl)),
        (sourceWidth = toPositiveNumber(box12?.sourceWidth, 0) || toPositiveNumber(box11.sourceWidth, 0)),
        (sourceHeight = toPositiveNumber(box12?.sourceHeight, 0) || toPositiveNumber(box11.sourceHeight, 0)),
        (imageWidth =
          toPositiveNumber(box12?.imageWidth || box12?.width, 0) ||
          toPositiveNumber(box11.imageWidth || box11.width, 0)),
        (imageHeight =
          toPositiveNumber(box12?.imageHeight || box12?.height, 0) ||
          toPositiveNumber(box11.imageHeight || box11.height, 0)));
    } else {
      if (trimString5 === 'storyboard') {
        const list13 = Array.isArray(box11.cells) ? box11.cells : [],
          value90 = list13.find(
            (item14) => resolveStoryboardCellAssetSrc(item14) || resolveStoryboardCellPreviewSrc(item14),
          ),
          storyboardCellAssetSrc =
            resolveStoryboardCellAssetSrc(value90) || resolveStoryboardCellPreviewSrc(value90);
        ((url2 = pickMediaUrl(
          storyboardCellAssetSrc,
          box11.localPath,
          box11.sourceUrl,
          box11.imageUrl,
          box11.src,
        )),
          (localPath4 = pickLocalPath(
            value90?.localPath,
            value90?.displayLocalPath,
            value90?.originalLocalPath,
            storyboardCellAssetSrc,
            box11.localPath,
            box11.sourceUrl,
            box11.imageUrl,
            box11.src,
          )),
          (thumbLocalPath = pickLocalPath(value90?.thumbLocalPath, box11.thumbLocalPath)),
          (sourceLocalPath = pickLocalPath(value90?.sourceLocalPath, box11.sourceLocalPath)),
          (sourceUrl = normalizeMediaUrl(value90?.sourceUrl || box11.sourceUrl)),
          (sourceWidth = toPositiveNumber(value90?.sourceWidth, 0) || toPositiveNumber(box11.sourceWidth, 0)),
          (sourceHeight =
            toPositiveNumber(value90?.sourceHeight, 0) || toPositiveNumber(box11.sourceHeight, 0)),
          (imageWidth = toPositiveNumber(value90?.imageWidth, 0) || toPositiveNumber(box11.imageWidth, 0)),
          (imageHeight =
            toPositiveNumber(value90?.imageHeight, 0) || toPositiveNumber(box11.imageHeight, 0)));
      }
    }
  }
  return {
    url: url2,
    localPath: localPath4,
    thumbLocalPath: thumbLocalPath,
    sourceLocalPath: sourceLocalPath,
    sourceUrl: sourceUrl,
    sourceWidth: sourceWidth,
    sourceHeight: sourceHeight,
    imageWidth: imageWidth,
    imageHeight: imageHeight,
    label: trimString(box11.name) || trimString(box11.fileName) || '',
  };
}
export function isCollageImageNode(value91) {
  return !!resolveCollageNodeImage(value91).url;
}
export function computeCollageBounds(list14) {
  if (!Array.isArray(list14) || list14.length === 0) return null;
  let x7 = Infinity,
    y3 = Infinity,
    value92 = -Infinity,
    value93 = -Infinity;
  for (const box13 of list14) {
    if (!box13 || typeof box13 !== 'object') continue;
    const value94 = Number(box13.x),
      value95 = Number(box13.y),
      toPositiveNumber15 = toPositiveNumber(box13.width, 0),
      toPositiveNumber16 = toPositiveNumber(box13.height, 0);
    if (
      !Number.isFinite(value94) ||
      !Number.isFinite(value95) ||
      toPositiveNumber15 <= 0 ||
      toPositiveNumber16 <= 0
    )
      continue;
    ((x7 = Math.min(x7, value94)),
      (y3 = Math.min(y3, value95)),
      (value92 = Math.max(value92, value94 + toPositiveNumber15)),
      (value93 = Math.max(value93, value95 + toPositiveNumber16)));
  }
  if (!Number.isFinite(x7) || !Number.isFinite(y3)) return null;
  return {
    x: x7,
    y: y3,
    width: Math.max(1, value92 - x7),
    height: Math.max(1, value93 - y3),
  };
}
export function buildCollageItemsFromNodes(value96, value97, box14 = null) {
  const box15 = value97 || computeCollageBounds(value96);
  if (!box15) return [];
  const toPositiveNumber17 = toPositiveNumber(box14?.width, box15.width),
    toPositiveNumber18 = toPositiveNumber(box14?.height, box15.height),
    value98 = toPositiveNumber17 / box15.width,
    value99 = toPositiveNumber18 / box15.height;
  return (Array.isArray(value96) ? value96 : [])
    .map((box16, value100) => {
      const url3 = resolveCollageNodeImage(box16);
      if (!url3.url) return null;
      const value101 = Number(box16.x) || 0,
        value102 = Number(box16.y) || 0,
        sourceDisplayWidth = toPositiveNumber(box16.width, 1),
        sourceDisplayHeight = toPositiveNumber(box16.height, 1),
        freeformX2 = {
          id: 'item-' + (trimString(box16.id) || value100),
          sourceNodeId: trimString(box16.id),
          url: url3.url,
          localPath: url3.localPath,
          thumbLocalPath: url3.thumbLocalPath,
          sourceLocalPath: url3.sourceLocalPath,
          sourceUrl: url3.sourceUrl,
          sourceWidth: url3.sourceWidth || null,
          sourceHeight: url3.sourceHeight || null,
          imageWidth: url3.imageWidth || null,
          imageHeight: url3.imageHeight || null,
          sourceDisplayWidth: sourceDisplayWidth,
          sourceDisplayHeight: sourceDisplayHeight,
          label: url3.label,
          x: roundCollageGeometryValue((value101 - box15.x) * value98),
          y: roundCollageGeometryValue((value102 - box15.y) * value99),
          width: roundCollageGeometryValue(sourceDisplayWidth * value98),
          height: roundCollageGeometryValue(sourceDisplayHeight * value99),
          fit: 'cover',
          focusX: 0.5,
          focusY: 0.5,
        };
      return {
        ...freeformX2,
        freeformX: freeformX2.x,
        freeformY: freeformX2.y,
        freeformWidth: freeformX2.width,
        freeformHeight: freeformX2.height,
      };
    })
    .filter(Boolean);
}
function createCollageBaseNodeData({
  id: id4,
  x: x = 0,
  y: y = 0,
  width: width = COLLAGE_DEFAULT_SIZE.width,
  height: height = COLLAGE_DEFAULT_SIZE.height,
  name: name = '拼图',
} = {}) {
  return {
    id: id4,
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
export function createEmptyCollageNodeData(options2 = {}) {
  const args11 = {
    ...createCollageBaseNodeData(options2),
    aspectRatio: COLLAGE_INITIAL_ASPECT_RATIO,
    layoutPresetId: COLLAGE_INITIAL_LAYOUT_PRESET_ID,
  };
  return { ...args11, ...buildCollageLayoutPatch(args11, COLLAGE_INITIAL_LAYOUT_PRESET_ID) };
}
export function buildCollageNodeDataFromSelection({ id: id5, nodes: nodes, name: name = '拼图' } = {}) {
  const value103 = (Array.isArray(nodes) ? nodes : []).filter(isCollageImageNode),
    x8 = computeCollageBounds(value103);
  if (!x8) return null;
  return {
    ...createCollageBaseNodeData({
      id: id5,
      name: name,
      x: x8.x,
      y: x8.y,
      width: x8.width,
      height: x8.height,
    }),
    aspectRatio: '',
    layoutPresetId: 'freeform',
    sourceBounds: { width: x8.width, height: x8.height },
    items: buildCollageItemsFromNodes(value103, x8),
  };
}
function cloneFreeformItem(box17) {
  const x9 = Number.isFinite(Number(box17.freeformX)) ? Number(box17.freeformX) : Number(box17.x) || 0,
    y4 = Number.isFinite(Number(box17.freeformY)) ? Number(box17.freeformY) : Number(box17.y) || 0,
    width7 = toPositiveNumber(box17.freeformWidth, box17.width || 1),
    height6 = toPositiveNumber(box17.freeformHeight, box17.height || 1);
  return {
    ...box17,
    x: x9,
    y: y4,
    width: width7,
    height: height6,
    freeformX: x9,
    freeformY: y4,
    freeformWidth: width7,
    freeformHeight: height6,
  };
}
function getFreeformSize(box18) {
  const toPositiveNumber19 = toPositiveNumber(box18?.sourceBounds?.width, 0),
    toPositiveNumber20 = toPositiveNumber(box18?.sourceBounds?.height, 0);
  return {
    width: roundDimension(toPositiveNumber19 || box18?.width, COLLAGE_DEFAULT_SIZE.width),
    height: roundDimension(toPositiveNumber20 || box18?.height, COLLAGE_DEFAULT_SIZE.height),
  };
}
function buildLayoutSlotItem({
  item: item15,
  preset: preset,
  slotIndex: slotIndex3,
  slotBounds: slotBounds,
  scaleX: scaleX,
  scaleY: scaleY,
}) {
  const enabled5 = item15 && !isCollageItemEmpty(item15);
  return {
    ...(enabled5 ? item15 : {}),
    id: trimString(item15?.id) || preset.id + '-slot-' + slotIndex3,
    sourceNodeId: trimString(item15?.sourceNodeId),
    url: trimString(item15?.url),
    localPath: trimString(item15?.localPath),
    label: trimString(item15?.label),
    fit: trimString(item15?.fit) || 'cover',
    focusX: Number.isFinite(Number(item15?.focusX)) ? Number(item15.focusX) : 0.5,
    focusY: Number.isFinite(Number(item15?.focusY)) ? Number(item15.focusY) : 0.5,
    imageScale: normalizeCollageImageScale(item15?.imageScale),
    slotIndex: slotIndex3,
    isEmpty: !enabled5,
    x: slotBounds.x * scaleX,
    y: slotBounds.y * scaleY,
    width: slotBounds.width * scaleX,
    height: slotBounds.height * scaleY,
  };
}
function scaleCollageItemGeometry(box19, value104, value105, enabled6) {
  const args12 = {
    ...box19,
    x: (Number(box19?.x) || 0) * value104,
    y: (Number(box19?.y) || 0) * value105,
    width: toPositiveNumber(box19?.width, 1) * value104,
    height: toPositiveNumber(box19?.height, 1) * value105,
  };
  if (!enabled6) return args12;
  return {
    ...args12,
    freeformX: (Number(box19?.freeformX) || 0) * value104,
    freeformY: (Number(box19?.freeformY) || 0) * value105,
    freeformWidth: toPositiveNumber(box19?.freeformWidth, box19?.width || 1) * value104,
    freeformHeight: toPositiveNumber(box19?.freeformHeight, box19?.height || 1) * value105,
  };
}
function getCollageCurrentSize(box20) {
  return {
    width: roundDimension(box20?.width, COLLAGE_DEFAULT_SIZE.width),
    height: roundDimension(box20?.height, COLLAGE_DEFAULT_SIZE.height),
  };
}
function getCollageCurrentShortSide(value106) {
  const box21 = getCollageCurrentSize(value106);
  return Math.max(1, Math.min(box21.width, box21.height));
}
function buildCollageResizePatch(value107, box22, { includeFreeform: includeFreeform = false } = {}) {
  const box23 = getCollageCurrentSize(value107),
    width8 = {
      width: roundDimension(box22?.width, box23.width),
      height: roundDimension(box22?.height, box23.height),
    },
    value108 = width8.width / box23.width,
    value109 = width8.height / box23.height,
    items3 = Array.isArray(value107?.items) ? value107.items : [];
  return {
    width: width8.width,
    height: width8.height,
    items: items3.map((item16) => scaleCollageItemGeometry(item16, value108, value109, includeFreeform)),
  };
}
export function buildCollageCollapsePatch(value110, enabled7) {
  const value111 = !!enabled7,
    width9 = getCollageCurrentSize(value110),
    collageLayoutPreset = getCollageLayoutPreset(value110?.layoutPresetId),
    includeFreeform2 = collageLayoutPreset.id === 'freeform';
  if (value111) {
    const collageSizeByShortSide = resolveCollageSizeByShortSide({
      width: width9.width,
      height: width9.height,
      shortSide: COLLAGE_COLLAPSED_SHORT_SIDE,
    });
    return {
      ...buildCollageResizePatch(value110, collageSizeByShortSide, { includeFreeform: includeFreeform2 }),
      isCollapsed: true,
      isEditing: false,
      _originalWidth: width9.width,
      _originalHeight: width9.height,
    };
  }
  const toPositiveNumber21 =
      toPositiveNumber(value110?._originalWidth, 0) > 0 && toPositiveNumber(value110?._originalHeight, 0) > 0,
    value112 = {
      ...(toPositiveNumber21
        ? {
            width: roundDimension(value110?._originalWidth, width9.width),
            height: roundDimension(value110?._originalHeight, width9.height),
          }
        : resolveCollageSizeByShortSide({
            width: width9.width,
            height: width9.height,
            shortSide: COLLAGE_EXPANDED_SHORT_SIDE,
          })),
    };
  return {
    ...buildCollageResizePatch(value110, value112, { includeFreeform: includeFreeform2 }),
    isCollapsed: false,
  };
}
export function buildCollageAspectRatioPatch(value113, value114) {
  const width10 = getCollageAspectRatioOption(value114) || COLLAGE_ASPECT_RATIO_OPTIONS[0],
    includeFreeform3 = getCollageLayoutPreset(value113?.layoutPresetId),
    value115 =
      includeFreeform3.id === 'freeform' || !Array.isArray(includeFreeform3.slots)
        ? resolveCollageSizeByShortSide({
            width: width10.w,
            height: width10.h,
            shortSide: getCollageCurrentShortSide(value113),
          })
        : resolveCollagePresetSizeBySlotShortSide(includeFreeform3, { aspectRatio: width10.label });
  return {
    ...buildCollageResizePatch(value113, value115, { includeFreeform: includeFreeform3.id === 'freeform' }),
    aspectRatio: width10.label,
  };
}
export function buildCollageLayoutPatch(value116, value117) {
  const preset2 = getCollageLayoutPreset(value117),
    items4 = Array.isArray(value116?.items) ? value116.items : [];
  if (preset2.id === 'freeform' || !Array.isArray(preset2.slots)) {
    const width11 = getFreeformSize(value116);
    return {
      layoutPresetId: 'freeform',
      aspectRatio: '',
      width: width11.width,
      height: width11.height,
      items: items4.map(cloneFreeformItem),
    };
  }
  const toPositiveNumber22 = toPositiveNumber(preset2.width, COLLAGE_DEFAULT_SIZE.width),
    toPositiveNumber23 = toPositiveNumber(preset2.height, COLLAGE_DEFAULT_SIZE.height),
    aspectRatio2 = getCollageAspectRatioOption(value116?.aspectRatio),
    box24 = resolveCollagePresetSizeBySlotShortSide(preset2, { aspectRatio: aspectRatio2?.label || '' }),
    width12 = box24.width,
    height7 = box24.height,
    scaleX2 = width12 / toPositiveNumber22,
    scaleY2 = height7 / toPositiveNumber23,
    item17 = items4.filter((item18) => !isCollageItemEmpty(item18)),
    items5 = preset2.slots.map((slotBounds2, slotIndex4) =>
      buildLayoutSlotItem({
        item: item17[slotIndex4],
        preset: preset2,
        slotIndex: slotIndex4,
        slotBounds: slotBounds2,
        scaleX: scaleX2,
        scaleY: scaleY2,
      }),
    );
  return {
    layoutPresetId: preset2.id,
    aspectRatio: aspectRatio2?.label || '',
    width: width12,
    height: height7,
    items: items5,
  };
}
export function resolveCollageExportSize(box25, value118) {
  const toPositiveNumber24 = toPositiveNumber(box25?.width, COLLAGE_DEFAULT_SIZE.width),
    toPositiveNumber25 = toPositiveNumber(box25?.height, COLLAGE_DEFAULT_SIZE.height),
    width13 = getCollageExportResolution(value118).longSide,
    count7 = toPositiveNumber24 / toPositiveNumber25;
  if (!Number.isFinite(count7) || count7 <= 0) return { width: width13, height: width13 };
  if (count7 >= 1) return { width: width13, height: roundDimension(width13 / count7, width13) };
  return { width: roundDimension(width13 * count7, width13), height: width13 };
}
