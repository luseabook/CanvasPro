export const MAX_MULTI_RESULT_BACKPLATES = 3;
export const MULTI_RESULT_STACK_PREVIEW_CLASS = 'is-multi-result-stack';
export const MULTI_RESULT_STACK_EXPANDED_CLASS = 'is-multi-result-stack-expanded';
export const MULTI_RESULT_STACK_WRAP_CLASS = 'multi-stack-wrap';
export const MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS = 'is-expanded';
export const MULTI_RESULT_BACKPLATES_CLASS = 'multi-stack-backplates';
export const MULTI_RESULT_BACKPLATE_CLASS = 'multi-stack-backplate';
function toFiniteCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}
export function getMultiResultBackplateCount(item) {
  const toFiniteCount2 = toFiniteCount(item);
  return Math.min(Math.max(toFiniteCount2 - 1, 0), MAX_MULTI_RESULT_BACKPLATES);
}
function normalizeBackplateItem(key, index) {
  const imageIndex2 = Number.isFinite(Number(key?.imageIndex)) ? Math.floor(Number(key.imageIndex)) : index;
  return { imageIndex: imageIndex2 };
}
export function buildMultiResultBackplateItems({
  imageCount: imageCount = 0,
  mainIndex: mainIndex = 0,
} = {}) {
  const toFiniteCount3 = toFiniteCount(imageCount);
  if (toFiniteCount3 <= 1) return [];
  const result =
      Number.isFinite(Number(mainIndex)) && mainIndex >= 0 && mainIndex < toFiniteCount3
        ? Math.floor(Number(mainIndex))
        : 0,
    list = [];
  for (let imageIndex3 = 0; imageIndex3 < toFiniteCount3; imageIndex3 += 1) {
    if (imageIndex3 === result) continue;
    list.push({ imageIndex: imageIndex3 });
    if (list.length >= MAX_MULTI_RESULT_BACKPLATES) break;
  }
  return list;
}
export function getMultiResultBackplateKey(list2 = []) {
  return (Array.isArray(list2) ? list2 : [])
    .map((item2, data) => {
      const backplateItem = normalizeBackplateItem(item2, data);
      return '' + backplateItem.imageIndex;
    })
    .join(',');
}
export function shouldRefreshMultiResultStackDom({
  imageCount: imageCount = 0,
  previewEl: previewEl = null,
  containerEl: containerEl = null,
  stackWrap: stackWrap = null,
  backdropWrap: backdropWrap = null,
} = {}) {
  const multiResultBackplateCount = getMultiResultBackplateCount(imageCount);
  if (multiResultBackplateCount <= 0) return false;
  if (!containerEl || !stackWrap || stackWrap.parentNode !== containerEl) return true;
  if (!backdropWrap || backdropWrap.parentNode !== stackWrap) return true;
  if ((Number(backdropWrap.children?.length) || 0) !== multiResultBackplateCount) return true;
  return !previewEl?.classList?.contains(MULTI_RESULT_STACK_PREVIEW_CLASS);
}
export function createMultiResultBackplates(el, options, target = {}) {
  if (!el?.createElement) return null;
  const list3 = Array.isArray(target.items) ? target.items : null,
    list4 = list3
      ? list3
          .slice(0, MAX_MULTI_RESULT_BACKPLATES)
          .map((item3, source) => normalizeBackplateItem(item3, source))
      : Array.from({ length: getMultiResultBackplateCount(options) }, (next, current) =>
          normalizeBackplateItem({}, current + 1),
        );
  if (list4.length <= 0) return null;
  const el2 = el.createElement('div');
  ((el2.className = MULTI_RESULT_BACKPLATES_CLASS), el2.setAttribute('aria-hidden', 'true'));
  for (let entry = 0; entry < list4.length; entry += 1) {
    const record = list4[entry],
      el3 = el.createElement('div');
    ((el3.className = MULTI_RESULT_BACKPLATE_CLASS),
      (el3.dataset.stackIndex = String(entry + 1)),
      (el3.dataset.imageIndex = String(record.imageIndex)),
      el2.appendChild(el3));
  }
  return el2;
}
export function syncMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
  isActive: isActive = false,
  isExpanded: isExpanded = false,
} = {}) {
  const payload = !!isActive,
    handle = payload && !!isExpanded;
  (previewEl?.classList?.toggle(MULTI_RESULT_STACK_PREVIEW_CLASS, payload),
    previewEl?.classList?.toggle(MULTI_RESULT_STACK_EXPANDED_CLASS, handle),
    stackWrap?.classList?.toggle(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS, handle));
}
export function clearMultiResultStackClasses({
  previewEl: previewEl = null,
  stackWrap: stackWrap = null,
} = {}) {
  (previewEl?.classList?.remove(MULTI_RESULT_STACK_PREVIEW_CLASS, MULTI_RESULT_STACK_EXPANDED_CLASS),
    stackWrap?.classList?.remove(MULTI_RESULT_STACK_WRAP_EXPANDED_CLASS));
}

export const MAX_MULTI_RESULT_VISIBLE_ITEMS = 16;

const EXPANDED_GRID_NODE_ROW = 2,
  EXPANDED_GRID_4X4_NODE_ROW = 3,
  FOUR_IMAGE_GRID_SLOT_ORDER = Object.freeze([
    Object.freeze({ r: 1, c: 1 }),
    Object.freeze({ r: 0, c: 0 }),
    Object.freeze({ r: 0, c: 1 }),
  ]),
  EXPANDED_GRID_SLOT_ORDER = Object.freeze([
    Object.freeze({ r: 2, c: 1 }),
    Object.freeze({ r: 2, c: 2 }),
    Object.freeze({ r: 1, c: 0 }),
    Object.freeze({ r: 1, c: 1 }),
    Object.freeze({ r: 1, c: 2 }),
    Object.freeze({ r: 0, c: 0 }),
    Object.freeze({ r: 0, c: 1 }),
    Object.freeze({ r: 0, c: 2 }),
    Object.freeze({ r: 2, c: 3 }),
    Object.freeze({ r: 1, c: 3 }),
    Object.freeze({ r: 0, c: 3 }),
  ]),
  EXPANDED_GRID_4X4_SLOT_ORDER = Object.freeze([
    Object.freeze({ r: 3, c: 1 }),
    Object.freeze({ r: 3, c: 2 }),
    Object.freeze({ r: 3, c: 3 }),
    Object.freeze({ r: 2, c: 0 }),
    Object.freeze({ r: 2, c: 1 }),
    Object.freeze({ r: 2, c: 2 }),
    Object.freeze({ r: 2, c: 3 }),
    Object.freeze({ r: 1, c: 0 }),
    Object.freeze({ r: 1, c: 1 }),
    Object.freeze({ r: 1, c: 2 }),
    Object.freeze({ r: 1, c: 3 }),
    Object.freeze({ r: 0, c: 0 }),
    Object.freeze({ r: 0, c: 1 }),
    Object.freeze({ r: 0, c: 2 }),
    Object.freeze({ r: 0, c: 3 }),
  ]);

function normalizeMainIndex(count2, state) {
  return Number.isFinite(Number(count2)) && count2 >= 0 && count2 < state
    ? Math.floor(Number(count2))
    : 0;
}

function getExpandedGridLayout(count3) {
  if (count3 === 4) return { nodeRow: 1, slotOrder: FOUR_IMAGE_GRID_SLOT_ORDER };
  if (count3 > MAX_MULTI_RESULT_VISIBLE_ITEMS - 4)
    return { nodeRow: EXPANDED_GRID_4X4_NODE_ROW, slotOrder: EXPANDED_GRID_4X4_SLOT_ORDER };
  return { nodeRow: EXPANDED_GRID_NODE_ROW, slotOrder: EXPANDED_GRID_SLOT_ORDER };
}

export function buildMultiResultExpandedSlotMap({
  imageCount: imageCount = 0,
  mainIndex: mainIndex = 0,
  previewWidth: previewWidth = 0,
  previewHeight: previewHeight = 0,
  gap: gap = 0,
} = {}) {
  const toFiniteCount4 = toFiniteCount(imageCount),
    mainIndex2 = normalizeMainIndex(mainIndex, toFiniteCount4),
    config = new Map();
  if (toFiniteCount4 <= 1) return config;
  const scope = Math.max(1, Number(previewWidth) || 1),
    input = Math.max(1, Number(previewHeight) || 1),
    output = Math.max(0, Number(gap) || 0),
    { nodeRow: nodeRow, slotOrder: slotOrder } = getExpandedGridLayout(toFiniteCount4);
  let value2 = 0;
  for (let value3 = 0; value3 < toFiniteCount4; value3 += 1) {
    if (value3 === mainIndex2) continue;
    const enabled = slotOrder[value2];
    if (!enabled) break;
    (config.set(value3, {
      order: value2,
      top: (enabled.r - nodeRow) * (input + output),
      left: enabled.c * (scope + output),
    }),
      (value2 += 1));
  }
  return config;
}

export function buildMultiResultCollapsedFrame(value4 = 1) {
  const value5 = Math.min(
      MAX_MULTI_RESULT_BACKPLATES,
      Math.max(1, Math.floor(Number(value4) || 1)),
    ),
    value6 = value5 - 1;
  return {
    x: Math.min(10 + value6 * 7, 66),
    y: Math.min(value6 * 3, 24),
    rotate: Math.min(4 + value6 * 2.2, 18),
    scale: Math.max(0.99 - value6 * 0.016, 0.86),
    opacity: Math.max(0.58 - value6 * 0.055, 0.18),
  };
}

export function shouldEnableMultiResultLayerDragOut({
  isImagesExpanded: isImagesExpanded = false,
  imageCount: imageCount = 0,
  imageIndex: imageIndex = -1,
  mainImageIndex: mainImageIndex = 0,
} = {}) {
  const toFiniteCount5 = toFiniteCount(imageCount);
  if (!isImagesExpanded || toFiniteCount5 <= 1) return false;
  const mainIndex3 = normalizeMainIndex(mainImageIndex, toFiniteCount5),
    count4 = Number.isFinite(Number(imageIndex)) ? Math.floor(Number(imageIndex)) : -1;
  return count4 >= 0 && count4 < toFiniteCount5 && count4 !== mainIndex3;
}

export function resolveMultiResultMainSwap({
  imageCount: imageCount = 0,
  previousMainIndex: previousMainIndex = 0,
  nextMainIndex: nextMainIndex = 0,
} = {}) {
  const toFiniteCount6 = toFiniteCount(imageCount);
  if (toFiniteCount6 <= 1) return null;
  const mainIndex4 = normalizeMainIndex(previousMainIndex, toFiniteCount6),
    mainIndex5 = normalizeMainIndex(nextMainIndex, toFiniteCount6);
  if (mainIndex4 === mainIndex5) return null;
  return { consumedImageIndex: mainIndex5, replacementImageIndex: mainIndex4 };
}

export function getMultiResultBackplateIdentityKey(list5 = []) {
  return (Array.isArray(list5) ? list5 : [])
    .map((value7, value8) => normalizeBackplateItem(value7, value8).imageIndex)
    .filter((value9) => Number.isFinite(value9))
    .sort((value10, value11) => value10 - value11)
    .map((value12) => '' + value12)
    .join(',');
}

export function getMultiResultBackplateDomIdentityKey(value13 = null) {
  const list6 = Array.from(value13?.children || []);
  return getMultiResultBackplateIdentityKey(
    list6.map((value14) => ({ imageIndex: Number(value14?.dataset?.imageIndex) })),
  );
}
