import { getAssetInputRefsFromPromptAndNode } from './nodePromptShared.js';
import { getModelManifest, resolveModelExecution } from '../manifests/index.js';
const FIXED_ASSET_INPUT_KINDS = new Set(['image', 'video', 'audio']);
export const RH_V54_ASSET_SLOT_ORDER = Object.freeze({
  video: Object.freeze(['sourceVideo', 'videoMask']),
  image: Object.freeze(['refImage', 'firstFrame']),
});
export const RH_BASIC_ASSET_SLOT_ORDER = Object.freeze({
  video: Object.freeze(['sourceVideo']),
  image: Object.freeze(['refImage']),
});
export const RH_LTX_ASSET_SLOT_ORDER = Object.freeze({
  image: Object.freeze(['refImage']),
  audio: Object.freeze(['audio']),
});
export const RH_LIPSYNC_ASSET_SLOT_ORDER = Object.freeze({
  video: Object.freeze(['sourceVideo']),
  image: Object.freeze(['refImage']),
  audio: Object.freeze(['audio']),
});
export const RH_LIPSYNC_VISUAL_EXCLUSIVE_GROUPS = Object.freeze([
  Object.freeze({
    id: 'lipsyncVisualInput',
    slots: Object.freeze(['sourceVideo', 'refImage']),
    min: 1,
    max: 1,
  }),
]);
export function getRhV54VisibleSlots({ hideExtraSlots: hideExtraSlots = false } = {}) {
  return hideExtraSlots
    ? ['sourceVideo', 'refImage']
    : ['sourceVideo', 'refImage', 'firstFrame', 'videoMask'];
}
function normalizeFixedSlotId(value) {
  const item = String(value || '').trim();
  if (item === 'maskVideo') return 'videoMask';
  return item;
}
export function normalizeFixedInputExclusiveGroups(list = [], list2 = null) {
  const map =
    Array.isArray(list2) && list2.length ? new Set(list2.map((item2) => normalizeFixedSlotId(item2))) : null;
  return (Array.isArray(list) ? list : [])
    .map((required, key) => {
      const list3 = Array.isArray(required?.slots) ? required.slots : Array.isArray(required) ? required : [],
        slots = Array.from(
          new Set(
            list3
              .map((item3) => normalizeFixedSlotId(item3))
              .filter((item4) => item4 && (!map || map.has(item4))),
          ),
        );
      if (slots.length < 2) return null;
      return {
        id: String(required?.id || 'exclusive:' + key).trim() || 'exclusive:' + key,
        slots: slots,
        min: Number.isFinite(Number(required?.min)) ? Number(required.min) : 0,
        max: Number.isFinite(Number(required?.max)) ? Number(required.max) : 1,
        required: required?.required === true,
      };
    })
    .filter(Boolean);
}
export function getExclusiveSlotsForFixedSlot(list4 = [], index = '') {
  const fixedSlotId = normalizeFixedSlotId(index);
  if (!fixedSlotId) return [];
  const list5 = normalizeFixedInputExclusiveGroups(list4),
    result = list5.find((item5) => item5.slots.includes(fixedSlotId));
  return result ? result.slots.slice() : [fixedSlotId];
}
function resolveManifestForFixedInputNode(providerHint = {}) {
  const data = [providerHint?.audioWorkflowKey, providerHint?.workflowKey, providerHint?.model]
    .map((item6) => String(item6 || '').trim())
    .filter(Boolean);
  for (const options of data) {
    const modelManifest =
      getModelManifest(options) ||
      resolveModelExecution(options, { providerHint: providerHint?.provider })?.modelManifest ||
      resolveModelExecution(options)?.modelManifest;
    if (modelManifest) return modelManifest;
  }
  return null;
}
function getNodeFieldValue(options2 = {}, target = '') {
  const enabled = String(target || '').trim();
  if (!enabled) return undefined;
  const next =
    options2?.generationParams && typeof options2.generationParams === 'object'
      ? options2.generationParams
      : {};
  if (Object.prototype.hasOwnProperty.call(next, enabled)) return next[enabled];
  if (Object.prototype.hasOwnProperty.call(options2 || {}, enabled)) return options2[enabled];
  const list6 = enabled.split('.').filter(Boolean);
  if (list6.length <= 1) return undefined;
  let enabled2 = options2;
  for (const current of list6) {
    if (!enabled2 || typeof enabled2 !== 'object') return undefined;
    enabled2 = enabled2[current];
  }
  return enabled2;
}
function fixedSlotConditionMatches(el, entry = {}) {
  if (Array.isArray(el)) return el.some((item7) => fixedSlotConditionMatches(item7, entry));
  if (!el || typeof el !== 'object') return false;
  if (Array.isArray(el.any)) return el.any.some((item8) => fixedSlotConditionMatches(item8, entry));
  if (Array.isArray(el.all)) return el.all.every((item9) => fixedSlotConditionMatches(item9, entry));
  const enabled3 = String(el.field || '').trim();
  if (!enabled3) return false;
  const nodeFieldValue = getNodeFieldValue(entry, enabled3),
    list7 = Array.isArray(el.values)
      ? el.values
      : Object.prototype.hasOwnProperty.call(el, 'value')
        ? [el.value]
        : [];
  if (list7.length === 0) return Boolean(nodeFieldValue);
  return list7.some(
    (item10) => nodeFieldValue === item10 || String(nodeFieldValue ?? '') === String(item10 ?? ''),
  );
}
function shouldHideFixedSlotForNode(
  record,
  payload = {},
  handle = null,
  { useRhVisibilityFlags: useRhVisibilityFlags = false } = {},
) {
  if (useRhVisibilityFlags && payload?.rhSpecialMode === 'cameraMove')
    return record === 'firstFrame' || record === 'videoMask';
  if (useRhVisibilityFlags && payload?.rhSubtractSubject === true)
    return record === 'firstFrame' || record === 'videoMask';
  if (handle?.showWhen && !fixedSlotConditionMatches(handle.showWhen, payload)) return true;
  if (handle?.hideWhen && fixedSlotConditionMatches(handle.hideWhen, payload)) return true;
  return false;
}
export function getFixedInputSlotConfigFromManifest(options3 = {}, { manifest: manifest = null } = {}) {
  const manifest2 = manifest || resolveManifestForFixedInputNode(options3),
    list8 = manifest2?.inputSlots?.fixedSlots;
  if (!Array.isArray(list8) || list8.length === 0) return null;
  const slotOrderByType2 = {},
    slotKindById = {},
    slotById2 = {},
    visibleSlots2 = [];
  let visibilityLayoutKey = false;
  const map2 = new Set(list8.map((item11) => normalizeFixedSlotId(item11?.id)).filter(Boolean)),
    useRhVisibilityFlags2 = map2.has('sourceVideo') && map2.has('refImage') && map2.has('videoMask');
  list8.forEach((args, state) => {
    const id = normalizeFixedSlotId(args?.id),
      kind2 = String(args?.kind || '').trim();
    if (!id || !FIXED_ASSET_INPUT_KINDS.has(kind2)) return;
    if (args?.showWhen || args?.hideWhen) visibilityLayoutKey = true;
    if (!Array.isArray(slotOrderByType2[kind2])) slotOrderByType2[kind2] = [];
    (slotOrderByType2[kind2].push(id), (slotKindById[id] = kind2));
    const config = Number(args?.displayOrder);
    ((slotById2[id] = {
      ...args,
      id: id,
      kind: kind2,
      displayOrder: Number.isFinite(config) ? config : state,
    }),
      !shouldHideFixedSlotForNode(id, options3, args, { useRhVisibilityFlags: useRhVisibilityFlags2 }) &&
        visibleSlots2.push(id));
  });
  if (visibleSlots2.length === 0) return null;
  const item12 = (scope, input) =>
    Number(slotById2[scope]?.displayOrder ?? 0) - Number(slotById2[input]?.displayOrder ?? 0);
  (visibleSlots2.sort(item12),
    Object.keys(slotOrderByType2).forEach((item13) => {
      slotOrderByType2[item13].sort(item12);
    }));
  const exclusiveGroups2 = normalizeFixedInputExclusiveGroups(
    manifest2?.inputSlots?.exclusiveGroups,
    visibleSlots2,
  );
  return {
    manifest: manifest2,
    fixedSlots: Object.values(slotById2),
    slotById: slotById2,
    slotKindById: slotKindById,
    slotOrderByType: slotOrderByType2,
    visibleSlots: visibleSlots2,
    visibilityLayoutKey: visibilityLayoutKey ? visibleSlots2.join('|') : '',
    exclusiveGroups: exclusiveGroups2,
  };
}
function getSlotsFromOrder(options4 = {}) {
  return Array.from(
    new Set(
      Object.values(options4)
        .flat()
        .map((item14) => String(item14 || ''))
        .filter(Boolean),
    ),
  );
}
function normalizeOccupiedSlots(value2 = null) {
  const run = (list9 = []) => new Set(list9.map((item15) => normalizeFixedSlotId(item15)).filter(Boolean));
  if (value2 instanceof Set) return run(Array.from(value2));
  if (Array.isArray(value2)) return run(value2);
  if (value2 && typeof value2 === 'object')
    return run(
      Object.entries(value2)
        .filter(([, enabled4]) => !!enabled4)
        .map(([output]) => output),
    );
  return new Set();
}
export function createFixedSlotOccupancyTracker({
  exclusiveGroups: exclusiveGroups = [],
  occupiedSlots: occupiedSlots = null,
} = {}) {
  const list10 = new Set(normalizeOccupiedSlots(occupiedSlots)),
    list11 = normalizeFixedInputExclusiveGroups(exclusiveGroups),
    map3 = new Map();
  list11.forEach((item16) => {
    item16.slots.forEach((item17) => {
      map3.set(item17, item16);
    });
  });
  const map4 = new Set();
  return (
    list10.forEach((item18) => {
      const value3 = map3.get(item18);
      if (value3) map4.add(value3.id);
    }),
    {
      isSlotAvailable(value4) {
        const fixedSlotId2 = normalizeFixedSlotId(value4);
        if (!fixedSlotId2 || list10.has(fixedSlotId2)) return false;
        const enabled5 = map3.get(fixedSlotId2);
        return !enabled5 || !map4.has(enabled5.id);
      },
      occupySlot(value5) {
        const fixedSlotId3 = normalizeFixedSlotId(value5);
        if (!fixedSlotId3) return;
        list10.add(fixedSlotId3);
        const value6 = map3.get(fixedSlotId3);
        if (value6) map4.add(value6.id);
      },
      getExclusiveSlots(value7) {
        const fixedSlotId4 = normalizeFixedSlotId(value7),
          value8 = map3.get(fixedSlotId4);
        return value8 ? value8.slots.slice() : fixedSlotId4 ? [fixedSlotId4] : [];
      },
    }
  );
}
function getFixedInputSlotKind(options5 = {}, value9 = '') {
  const fixedSlotId5 = normalizeFixedSlotId(value9);
  if (!fixedSlotId5) return '';
  const value10 = String(options5?.slotKindById?.[fixedSlotId5] || '').trim();
  if (value10) return value10;
  const value11 =
    options5?.slotOrderByType && typeof options5.slotOrderByType === 'object' ? options5.slotOrderByType : {};
  for (const [value12, value13] of Object.entries(value11)) {
    if ((Array.isArray(value13) ? value13 : []).includes(fixedSlotId5)) return String(value12 || '').trim();
  }
  return '';
}
function isKnownFixedInputSlot(options6 = {}, value14 = '') {
  const fixedSlotId6 = normalizeFixedSlotId(value14);
  if (!fixedSlotId6) return false;
  if (options6?.slotById?.[fixedSlotId6]) return true;
  return !!getFixedInputSlotKind(options6, fixedSlotId6);
}
function sourceHasMaskImage(value15 = null) {
  const value16 = value15?.nodeData && typeof value15.nodeData === 'object' ? value15.nodeData : value15;
  return !!String(
    value16?.mask ||
      value16?.maskImageDataUrl ||
      value16?.maskImageUrl ||
      value16?.maskUrl ||
      value16?.maskLocalPath ||
      '',
  ).trim();
}
export function fixedInputSlotAcceptsSource(options7 = {}, value17 = '', value18 = null) {
  const fixedSlotId7 = normalizeFixedSlotId(value17);
  if (!fixedSlotId7) return false;
  const value19 = options7?.slotById?.[fixedSlotId7] || {};
  if (value19?.requiresMask === true) return value18 ? sourceHasMaskImage(value18) : false;
  return true;
}
export function resolveFixedInputSlotForRef({
  fixedInputConfig: fixedInputConfig = null,
  refSlot: refSlot = '',
  kind: kind = '',
  occupiedSlots: occupiedSlots = null,
  sourceNode: sourceNode = null,
  source: source = null,
} = {}) {
  const exclusiveGroups3 = fixedInputConfig || {},
    enabled6 = String(kind || '').trim(),
    value20 = sourceNode || source || null;
  if (!enabled6 || enabled6 === 'text') return { slot: '', reason: 'unsupported' };
  const map5 = new Set(
    Array.isArray(exclusiveGroups3.visibleSlots) && exclusiveGroups3.visibleSlots.length
      ? exclusiveGroups3.visibleSlots.map((item19) => normalizeFixedSlotId(item19)).filter(Boolean)
      : getSlotsFromOrder(exclusiveGroups3.slotOrderByType).map((item20) => normalizeFixedSlotId(item20)),
  );
  if (map5.size === 0) return { slot: '', reason: 'noVisibleSlots' };
  const fixedSlotOccupancyTracker = createFixedSlotOccupancyTracker({
      exclusiveGroups: exclusiveGroups3.exclusiveGroups,
      occupiedSlots: occupiedSlots,
    }),
    explicitSlot = normalizeFixedSlotId(refSlot);
  if (explicitSlot && map5.has(explicitSlot)) {
    const fixedInputSlotKind = getFixedInputSlotKind(exclusiveGroups3, explicitSlot);
    if (fixedInputSlotKind !== enabled6)
      return { slot: '', reason: 'kindMismatch', explicitSlot: explicitSlot };
    if (!fixedInputSlotAcceptsSource(exclusiveGroups3, explicitSlot, value20))
      return { slot: '', reason: 'slotConstraint', explicitSlot: explicitSlot };
    if (!fixedSlotOccupancyTracker.isSlotAvailable(explicitSlot))
      return { slot: '', reason: 'occupied', explicitSlot: explicitSlot };
    return { slot: explicitSlot, reason: 'explicit', explicitSlot: explicitSlot };
  }
  if (explicitSlot && isKnownFixedInputSlot(exclusiveGroups3, explicitSlot))
    return { slot: '', reason: 'hidden', explicitSlot: explicitSlot, hidden: true, knownSlot: true };
  const list12 = Array.isArray(exclusiveGroups3.slotOrderByType?.[enabled6])
      ? exclusiveGroups3.slotOrderByType[enabled6].map((item21) => normalizeFixedSlotId(item21))
      : [],
    slot =
      list12.find(
        (item22) =>
          map5.has(item22) &&
          fixedSlotOccupancyTracker.isSlotAvailable(item22) &&
          fixedInputSlotAcceptsSource(exclusiveGroups3, item22, value20),
      ) || '';
  return {
    slot: slot,
    reason: slot ? (explicitSlot ? 'stale' : 'auto') : 'overflow',
    explicitSlot: explicitSlot,
  };
}
export function buildFixedInputAssetSlotMapFromRefs(
  list13 = [],
  {
    slotOrderByType: slotOrderByType = {},
    visibleSlots: visibleSlots = null,
    occupiedSlots: occupiedSlots = null,
    exclusiveGroups: exclusiveGroups = [],
    slotById: slotById = {},
  } = {},
) {
  const list14 = new Set(
      Array.isArray(visibleSlots) && visibleSlots.length
        ? visibleSlots.map(String)
        : getSlotsFromOrder(slotOrderByType),
    ),
    occupiedSlots2 = normalizeOccupiedSlots(occupiedSlots),
    value21 = {};
  return (
    list14.forEach((item23) => {
      value21[item23] = null;
    }),
    (Array.isArray(list13) ? list13 : []).forEach((refSlot2) => {
      const kind3 = String(refSlot2?.type || '').trim(),
        occupiedSlots3 = new Set(occupiedSlots2);
      Object.entries(value21).forEach(([value22, value23]) => {
        if (value23) occupiedSlots3.add(value22);
      });
      const fixedInputSlotForRef = resolveFixedInputSlotForRef({
          fixedInputConfig: {
            slotOrderByType: slotOrderByType,
            visibleSlots: Array.from(list14),
            exclusiveGroups: exclusiveGroups,
            slotById: slotById,
          },
          refSlot: refSlot2?.refSlot,
          kind: kind3,
          occupiedSlots: occupiedSlots3,
          sourceNode: refSlot2?.nodeData || refSlot2,
        }),
        refSlot3 = fixedInputSlotForRef.slot;
      if (!refSlot3) return;
      value21[refSlot3] = { ...refSlot2, refSlot: refSlot3, virtual: true };
    }),
    value21
  );
}
export function buildFixedInputAssetSlotMap(
  value24 = null,
  {
    slotOrderByType: slotOrderByType = {},
    visibleSlots: visibleSlots = null,
    occupiedSlots: occupiedSlots = null,
    exclusiveGroups: exclusiveGroups = [],
    slotById: slotById = {},
    nodeData: nodeData = null,
  } = {},
) {
  const assetInputRefsFromPromptAndNode = getAssetInputRefsFromPromptAndNode(value24, {
    nodeData: nodeData,
    allowedTypes: Object.keys(slotOrderByType),
  });
  return buildFixedInputAssetSlotMapFromRefs(assetInputRefsFromPromptAndNode, {
    slotOrderByType: slotOrderByType,
    visibleSlots: visibleSlots,
    occupiedSlots: occupiedSlots,
    exclusiveGroups: exclusiveGroups,
    slotById: slotById,
  });
}
export function buildRhV54AssetSlotMapFromRefs(
  list15 = [],
  { hideExtraSlots: hideExtraSlots = false, occupiedSlots: occupiedSlots = null } = {},
) {
  return buildFixedInputAssetSlotMapFromRefs(list15, {
    slotOrderByType: RH_V54_ASSET_SLOT_ORDER,
    visibleSlots: getRhV54VisibleSlots({ hideExtraSlots: hideExtraSlots }),
    occupiedSlots: occupiedSlots,
  });
}
export function buildRhV54AssetSlotMap(
  value25 = null,
  {
    hideExtraSlots: hideExtraSlots = false,
    occupiedSlots: occupiedSlots = null,
    nodeData: nodeData = null,
  } = {},
) {
  return buildFixedInputAssetSlotMap(value25, {
    slotOrderByType: RH_V54_ASSET_SLOT_ORDER,
    visibleSlots: getRhV54VisibleSlots({ hideExtraSlots: hideExtraSlots }),
    occupiedSlots: occupiedSlots,
    nodeData: nodeData,
  });
}
export function buildRhBasicAssetSlotMap(value26 = null, occupiedSlots4 = {}) {
  return buildFixedInputAssetSlotMap(value26, {
    slotOrderByType: RH_BASIC_ASSET_SLOT_ORDER,
    visibleSlots: ['sourceVideo', 'refImage'],
    occupiedSlots: occupiedSlots4.occupiedSlots,
    nodeData: occupiedSlots4.nodeData,
  });
}
export function buildRhLtxAssetSlotMap(value27 = null, occupiedSlots5 = {}) {
  return buildFixedInputAssetSlotMap(value27, {
    slotOrderByType: RH_LTX_ASSET_SLOT_ORDER,
    visibleSlots: ['refImage', 'audio'],
    occupiedSlots: occupiedSlots5.occupiedSlots,
    nodeData: occupiedSlots5.nodeData,
  });
}
export function buildRhLipSyncAssetSlotMap(value28 = null, occupiedSlots6 = {}) {
  return buildFixedInputAssetSlotMap(value28, {
    slotOrderByType: RH_LIPSYNC_ASSET_SLOT_ORDER,
    visibleSlots: ['sourceVideo', 'refImage', 'audio'],
    occupiedSlots: occupiedSlots6.occupiedSlots,
    exclusiveGroups: RH_LIPSYNC_VISUAL_EXCLUSIVE_GROUPS,
    nodeData: occupiedSlots6.nodeData,
  });
}
function getConditionFieldIds(list16, value29 = new Set()) {
  if (Array['isArray'](list16))
    return (list16['forEach']((value30) => getConditionFieldIds(value30, value29)), value29);
  if (!list16 || typeof list16 !== 'object') return value29;
  Array['isArray'](list16['any']) &&
    list16['any']['forEach']((value31) => getConditionFieldIds(value31, value29));
  Array['isArray'](list16['all']) &&
    list16['all']['forEach']((value32) => getConditionFieldIds(value32, value29));
  const value33 = String(list16['field'] || '')['trim']();
  if (value33) value29['add'](value33);
  return value29;
}

function getHiddenFixedSlotReasonFields(
  value34,
  value35 = {},
  value36 = null,
  { useRhVisibilityFlags: useRhVisibilityFlags = ![] } = {},
) {
  const value37 = new Set();
  return (
    useRhVisibilityFlags &&
      value35?.['rhSpecialMode'] === 'cameraMove' &&
      (value34 === 'firstFrame' || value34 === 'videoMask') &&
      value37['add']('rhSpecialMode'),
    useRhVisibilityFlags &&
      value35?.['rhSubtractSubject'] === !![] &&
      (value34 === 'firstFrame' || value34 === 'videoMask') &&
      value37['add']('rhSubtractSubject'),
    value36?.['showWhen'] &&
      !fixedSlotConditionMatches(value36['showWhen'], value35) &&
      getConditionFieldIds(value36['showWhen'], value37),
    value36?.['hideWhen'] &&
      fixedSlotConditionMatches(value36['hideWhen'], value35) &&
      getConditionFieldIds(value36['hideWhen'], value37),
    Array['from'](value37)
  );
}

export function shouldHideFixedInputSlots(value38 = null, value39 = {}) {
  if (value38?.['inputSurfaceHidden'] === !![]) return !![];
  const value40 = value38?.['manifest'] || value38,
    value41 = value40?.['extensions']?.['videoInputSurface'];
  if (value41?.['hideFixedInputSlots'] === !![]) return !![];
  return fixedSlotConditionMatches(value41?.['hideFixedInputSlotsWhen'], value39);
}
