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
function normalizeFixedSlotId(_0x4be3ab) {
  const _0x4e8468 = String(_0x4be3ab || '').trim();
  if (_0x4e8468 === 'maskVideo') return 'videoMask';
  return _0x4e8468;
}
export function normalizeFixedInputExclusiveGroups(_0x565eb5 = [], _0x59b470 = null) {
  const _0x3755bc =
    Array.isArray(_0x59b470) && _0x59b470.length
      ? new Set(_0x59b470.map((_0x5b3ca2) => normalizeFixedSlotId(_0x5b3ca2)))
      : null;
  return (Array.isArray(_0x565eb5) ? _0x565eb5 : [])
    .map((_0x1eb2c3, _0x3be0a4) => {
      const _0x476a31 = Array.isArray(_0x1eb2c3?.slots)
          ? _0x1eb2c3.slots
          : Array.isArray(_0x1eb2c3)
            ? _0x1eb2c3
            : [],
        _0x973cef = Array.from(
          new Set(
            _0x476a31
              .map((_0x1b5d8a) => normalizeFixedSlotId(_0x1b5d8a))
              .filter((_0x5f0431) => _0x5f0431 && (!_0x3755bc || _0x3755bc.has(_0x5f0431))),
          ),
        );
      if (_0x973cef.length < 2) return null;
      return {
        id: String(_0x1eb2c3?.id || 'exclusive:' + _0x3be0a4).trim() || 'exclusive:' + _0x3be0a4,
        slots: _0x973cef,
        min: Number.isFinite(Number(_0x1eb2c3?.min)) ? Number(_0x1eb2c3.min) : 0,
        max: Number.isFinite(Number(_0x1eb2c3?.max)) ? Number(_0x1eb2c3.max) : 1,
        required: _0x1eb2c3?.required === true,
      };
    })
    .filter(Boolean);
}
export function getExclusiveSlotsForFixedSlot(_0x192640 = [], _0x49a4e4 = '') {
  const _0x2a96db = normalizeFixedSlotId(_0x49a4e4);
  if (!_0x2a96db) return [];
  const _0x225014 = normalizeFixedInputExclusiveGroups(_0x192640),
    _0x44679e = _0x225014.find((_0x54fed8) => _0x54fed8.slots.includes(_0x2a96db));
  return _0x44679e ? _0x44679e.slots.slice() : [_0x2a96db];
}
function resolveManifestForFixedInputNode(_0x574297 = {}) {
  const _0x1d53db = [_0x574297?.audioWorkflowKey, _0x574297?.workflowKey, _0x574297?.model]
    .map((_0x36d922) => String(_0x36d922 || '').trim())
    .filter(Boolean);
  for (const _0x4f3b7b of _0x1d53db) {
    const _0x3738f4 =
      getModelManifest(_0x4f3b7b) ||
      resolveModelExecution(_0x4f3b7b, { providerHint: _0x574297?.provider })?.modelManifest ||
      resolveModelExecution(_0x4f3b7b)?.modelManifest;
    if (_0x3738f4) return _0x3738f4;
  }
  return null;
}
function getNodeFieldValue(_0x59816d = {}, _0x19592c = '') {
  const _0x218cba = String(_0x19592c || '').trim();
  if (!_0x218cba) return undefined;
  const _0x3f2db9 =
    _0x59816d?.generationParams && typeof _0x59816d.generationParams === 'object'
      ? _0x59816d.generationParams
      : {};
  if (Object.prototype.hasOwnProperty.call(_0x3f2db9, _0x218cba)) return _0x3f2db9[_0x218cba];
  if (Object.prototype.hasOwnProperty.call(_0x59816d || {}, _0x218cba)) return _0x59816d[_0x218cba];
  const _0x208bef = _0x218cba.split('.').filter(Boolean);
  if (_0x208bef.length <= 1) return undefined;
  let _0xfb050c = _0x59816d;
  for (const _0x403cbb of _0x208bef) {
    if (!_0xfb050c || typeof _0xfb050c !== 'object') return undefined;
    _0xfb050c = _0xfb050c[_0x403cbb];
  }
  return _0xfb050c;
}
function fixedSlotConditionMatches(_0x24c115, _0x1c173b = {}) {
  if (Array.isArray(_0x24c115))
    return _0x24c115.some((_0x597fb9) => fixedSlotConditionMatches(_0x597fb9, _0x1c173b));
  if (!_0x24c115 || typeof _0x24c115 !== 'object') return false;
  if (Array.isArray(_0x24c115.any))
    return _0x24c115.any.some((_0x2e1a6f) => fixedSlotConditionMatches(_0x2e1a6f, _0x1c173b));
  if (Array.isArray(_0x24c115.all))
    return _0x24c115.all.every((_0x2c4b5f) => fixedSlotConditionMatches(_0x2c4b5f, _0x1c173b));
  const _0x290130 = String(_0x24c115.field || '').trim();
  if (!_0x290130) return false;
  const _0xaac8ab = getNodeFieldValue(_0x1c173b, _0x290130),
    _0x3e9ea8 = Array.isArray(_0x24c115.values)
      ? _0x24c115.values
      : Object.prototype.hasOwnProperty.call(_0x24c115, 'value')
        ? [_0x24c115.value]
        : [];
  if (_0x3e9ea8.length === 0) return Boolean(_0xaac8ab);
  return _0x3e9ea8.some(
    (_0x40fa68) => _0xaac8ab === _0x40fa68 || String(_0xaac8ab ?? '') === String(_0x40fa68 ?? ''),
  );
}
function shouldHideFixedSlotForNode(
  _0x6856a,
  _0x352984 = {},
  _0x543e5a = null,
  { useRhVisibilityFlags: useRhVisibilityFlags = false } = {},
) {
  if (useRhVisibilityFlags && _0x352984?.rhSpecialMode === 'cameraMove')
    return _0x6856a === 'firstFrame' || _0x6856a === 'videoMask';
  if (useRhVisibilityFlags && _0x352984?.rhSubtractSubject === true)
    return _0x6856a === 'firstFrame' || _0x6856a === 'videoMask';
  if (_0x543e5a?.showWhen && !fixedSlotConditionMatches(_0x543e5a.showWhen, _0x352984)) return true;
  if (_0x543e5a?.hideWhen && fixedSlotConditionMatches(_0x543e5a.hideWhen, _0x352984)) return true;
  return false;
}
export function getFixedInputSlotConfigFromManifest(_0x56011b = {}, { manifest: manifest = null } = {}) {
  const _0x2e1038 = manifest || resolveManifestForFixedInputNode(_0x56011b),
    _0x456076 = _0x2e1038?.inputSlots?.fixedSlots;
  if (!Array.isArray(_0x456076) || _0x456076.length === 0) return null;
  const _0x301210 = {},
    _0x50d602 = {},
    _0x1cb0f2 = {},
    _0x2d52e7 = [];
  let _0x554bc8 = false;
  const _0x2531eb = new Set(
      _0x456076.map((_0x4530a8) => normalizeFixedSlotId(_0x4530a8?.id)).filter(Boolean),
    ),
    _0x269b70 = _0x2531eb.has('sourceVideo') && _0x2531eb.has('refImage') && _0x2531eb.has('videoMask');
  _0x456076.forEach((_0x191dbd, _0x2b5163) => {
    const _0x3288ff = normalizeFixedSlotId(_0x191dbd?.id),
      _0x13eb8e = String(_0x191dbd?.kind || '').trim();
    if (!_0x3288ff || !FIXED_ASSET_INPUT_KINDS.has(_0x13eb8e)) return;
    if (_0x191dbd?.showWhen || _0x191dbd?.hideWhen) _0x554bc8 = true;
    if (!Array.isArray(_0x301210[_0x13eb8e])) _0x301210[_0x13eb8e] = [];
    (_0x301210[_0x13eb8e].push(_0x3288ff), (_0x50d602[_0x3288ff] = _0x13eb8e));
    const _0x17389e = Number(_0x191dbd?.displayOrder);
    ((_0x1cb0f2[_0x3288ff] = {
      ..._0x191dbd,
      id: _0x3288ff,
      kind: _0x13eb8e,
      displayOrder: Number.isFinite(_0x17389e) ? _0x17389e : _0x2b5163,
    }),
      !shouldHideFixedSlotForNode(_0x3288ff, _0x56011b, _0x191dbd, { useRhVisibilityFlags: _0x269b70 }) &&
        _0x2d52e7.push(_0x3288ff));
  });
  if (_0x2d52e7.length === 0) return null;
  const _0x86e3c2 = (_0x272125, _0x30b308) =>
    Number(_0x1cb0f2[_0x272125]?.displayOrder ?? 0) - Number(_0x1cb0f2[_0x30b308]?.displayOrder ?? 0);
  (_0x2d52e7.sort(_0x86e3c2),
    Object.keys(_0x301210).forEach((_0x1ecf13) => {
      _0x301210[_0x1ecf13].sort(_0x86e3c2);
    }));
  const _0x80fd2d = normalizeFixedInputExclusiveGroups(_0x2e1038?.inputSlots?.exclusiveGroups, _0x2d52e7);
  return {
    manifest: _0x2e1038,
    fixedSlots: Object.values(_0x1cb0f2),
    slotById: _0x1cb0f2,
    slotKindById: _0x50d602,
    slotOrderByType: _0x301210,
    visibleSlots: _0x2d52e7,
    visibilityLayoutKey: _0x554bc8 ? _0x2d52e7.join('|') : '',
    exclusiveGroups: _0x80fd2d,
  };
}
function getSlotsFromOrder(_0x324318 = {}) {
  return Array.from(
    new Set(
      Object.values(_0x324318)
        .flat()
        .map((_0x1768b7) => String(_0x1768b7 || ''))
        .filter(Boolean),
    ),
  );
}
function normalizeOccupiedSlots(_0xdfb0cf = null) {
  const _0x2ecc52 = (_0x2485b5 = []) =>
    new Set(_0x2485b5.map((_0x59426d) => normalizeFixedSlotId(_0x59426d)).filter(Boolean));
  if (_0xdfb0cf instanceof Set) return _0x2ecc52(Array.from(_0xdfb0cf));
  if (Array.isArray(_0xdfb0cf)) return _0x2ecc52(_0xdfb0cf);
  if (_0xdfb0cf && typeof _0xdfb0cf === 'object')
    return _0x2ecc52(
      Object.entries(_0xdfb0cf)
        .filter(([, _0x42e4c6]) => !!_0x42e4c6)
        .map(([_0x558306]) => _0x558306),
    );
  return new Set();
}
export function createFixedSlotOccupancyTracker({
  exclusiveGroups: exclusiveGroups = [],
  occupiedSlots: occupiedSlots = null,
} = {}) {
  const _0x25ea3d = new Set(normalizeOccupiedSlots(occupiedSlots)),
    _0x48a017 = normalizeFixedInputExclusiveGroups(exclusiveGroups),
    _0x32a14f = new Map();
  _0x48a017.forEach((_0x2b96e7) => {
    _0x2b96e7.slots.forEach((_0x3d0177) => {
      _0x32a14f.set(_0x3d0177, _0x2b96e7);
    });
  });
  const _0x1c9c79 = new Set();
  return (
    _0x25ea3d.forEach((_0x20a341) => {
      const _0x33512d = _0x32a14f.get(_0x20a341);
      if (_0x33512d) _0x1c9c79.add(_0x33512d.id);
    }),
    {
      isSlotAvailable(_0x5d8cbb) {
        const _0x46531b = normalizeFixedSlotId(_0x5d8cbb);
        if (!_0x46531b || _0x25ea3d.has(_0x46531b)) return false;
        const _0x3d2bcd = _0x32a14f.get(_0x46531b);
        return !_0x3d2bcd || !_0x1c9c79.has(_0x3d2bcd.id);
      },
      occupySlot(_0x2ed68e) {
        const _0xa6be1 = normalizeFixedSlotId(_0x2ed68e);
        if (!_0xa6be1) return;
        _0x25ea3d.add(_0xa6be1);
        const _0x25539b = _0x32a14f.get(_0xa6be1);
        if (_0x25539b) _0x1c9c79.add(_0x25539b.id);
      },
      getExclusiveSlots(_0x2c8974) {
        const _0x494c31 = normalizeFixedSlotId(_0x2c8974),
          _0x1b1a67 = _0x32a14f.get(_0x494c31);
        return _0x1b1a67 ? _0x1b1a67.slots.slice() : _0x494c31 ? [_0x494c31] : [];
      },
    }
  );
}
function getFixedInputSlotKind(_0x4af9d2 = {}, _0x2d77a9 = '') {
  const _0x4f2eca = normalizeFixedSlotId(_0x2d77a9);
  if (!_0x4f2eca) return '';
  const _0x10b890 = String(_0x4af9d2?.slotKindById?.[_0x4f2eca] || '').trim();
  if (_0x10b890) return _0x10b890;
  const _0x3d92b9 =
    _0x4af9d2?.slotOrderByType && typeof _0x4af9d2.slotOrderByType === 'object'
      ? _0x4af9d2.slotOrderByType
      : {};
  for (const [_0x4f77b8, _0x224f6d] of Object.entries(_0x3d92b9)) {
    if ((Array.isArray(_0x224f6d) ? _0x224f6d : []).includes(_0x4f2eca))
      return String(_0x4f77b8 || '').trim();
  }
  return '';
}
function isKnownFixedInputSlot(_0x1f7010 = {}, _0x13b877 = '') {
  const _0x537c16 = normalizeFixedSlotId(_0x13b877);
  if (!_0x537c16) return false;
  if (_0x1f7010?.slotById?.[_0x537c16]) return true;
  return !!getFixedInputSlotKind(_0x1f7010, _0x537c16);
}
function sourceHasMaskImage(_0x3547af = null) {
  const _0x1474d4 =
    _0x3547af?.nodeData && typeof _0x3547af.nodeData === 'object' ? _0x3547af.nodeData : _0x3547af;
  return !!String(
    _0x1474d4?.mask ||
      _0x1474d4?.maskImageDataUrl ||
      _0x1474d4?.maskImageUrl ||
      _0x1474d4?.maskUrl ||
      _0x1474d4?.maskLocalPath ||
      '',
  ).trim();
}
export function fixedInputSlotAcceptsSource(_0x6bbbce = {}, _0x2a0405 = '', _0x21d715 = null) {
  const _0x420988 = normalizeFixedSlotId(_0x2a0405);
  if (!_0x420988) return false;
  const _0x1f4fba = _0x6bbbce?.slotById?.[_0x420988] || {};
  if (_0x1f4fba?.requiresMask === true) return _0x21d715 ? sourceHasMaskImage(_0x21d715) : false;
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
  const _0x34667e = fixedInputConfig || {},
    _0x548876 = String(kind || '').trim(),
    _0x4ffe04 = sourceNode || source || null;
  if (!_0x548876 || _0x548876 === 'text') return { slot: '', reason: 'unsupported' };
  const _0x3df648 = new Set(
    Array.isArray(_0x34667e.visibleSlots) && _0x34667e.visibleSlots.length
      ? _0x34667e.visibleSlots.map((_0x22d007) => normalizeFixedSlotId(_0x22d007)).filter(Boolean)
      : getSlotsFromOrder(_0x34667e.slotOrderByType).map((_0x54d717) => normalizeFixedSlotId(_0x54d717)),
  );
  if (_0x3df648.size === 0) return { slot: '', reason: 'noVisibleSlots' };
  const _0x2c1103 = createFixedSlotOccupancyTracker({
      exclusiveGroups: _0x34667e.exclusiveGroups,
      occupiedSlots: occupiedSlots,
    }),
    _0x21a036 = normalizeFixedSlotId(refSlot);
  if (_0x21a036 && _0x3df648.has(_0x21a036)) {
    const _0x18437b = getFixedInputSlotKind(_0x34667e, _0x21a036);
    if (_0x18437b !== _0x548876) return { slot: '', reason: 'kindMismatch', explicitSlot: _0x21a036 };
    if (!fixedInputSlotAcceptsSource(_0x34667e, _0x21a036, _0x4ffe04))
      return { slot: '', reason: 'slotConstraint', explicitSlot: _0x21a036 };
    if (!_0x2c1103.isSlotAvailable(_0x21a036))
      return { slot: '', reason: 'occupied', explicitSlot: _0x21a036 };
    return { slot: _0x21a036, reason: 'explicit', explicitSlot: _0x21a036 };
  }
  if (_0x21a036 && isKnownFixedInputSlot(_0x34667e, _0x21a036))
    return { slot: '', reason: 'hidden', explicitSlot: _0x21a036, hidden: true, knownSlot: true };
  const _0x4d8d36 = Array.isArray(_0x34667e.slotOrderByType?.[_0x548876])
      ? _0x34667e.slotOrderByType[_0x548876].map((_0x446808) => normalizeFixedSlotId(_0x446808))
      : [],
    _0x56b776 =
      _0x4d8d36.find(
        (_0xec5503) =>
          _0x3df648.has(_0xec5503) &&
          _0x2c1103.isSlotAvailable(_0xec5503) &&
          fixedInputSlotAcceptsSource(_0x34667e, _0xec5503, _0x4ffe04),
      ) || '';
  return {
    slot: _0x56b776,
    reason: _0x56b776 ? (_0x21a036 ? 'stale' : 'auto') : 'overflow',
    explicitSlot: _0x21a036,
  };
}
export function buildFixedInputAssetSlotMapFromRefs(
  _0x444f01 = [],
  {
    slotOrderByType: slotOrderByType = {},
    visibleSlots: visibleSlots = null,
    occupiedSlots: occupiedSlots = null,
    exclusiveGroups: exclusiveGroups = [],
    slotById: slotById = {},
  } = {},
) {
  const _0x528394 = new Set(
      Array.isArray(visibleSlots) && visibleSlots.length
        ? visibleSlots.map(String)
        : getSlotsFromOrder(slotOrderByType),
    ),
    _0x4928e0 = normalizeOccupiedSlots(occupiedSlots),
    _0x43c87a = {};
  return (
    _0x528394.forEach((_0xab19f6) => {
      _0x43c87a[_0xab19f6] = null;
    }),
    (Array.isArray(_0x444f01) ? _0x444f01 : []).forEach((_0x3e62ea) => {
      const _0x95525e = String(_0x3e62ea?.type || '').trim(),
        _0x9e7000 = new Set(_0x4928e0);
      Object.entries(_0x43c87a).forEach(([_0x354d16, _0x59988e]) => {
        if (_0x59988e) _0x9e7000.add(_0x354d16);
      });
      const _0x254883 = resolveFixedInputSlotForRef({
          fixedInputConfig: {
            slotOrderByType: slotOrderByType,
            visibleSlots: Array.from(_0x528394),
            exclusiveGroups: exclusiveGroups,
            slotById: slotById,
          },
          refSlot: _0x3e62ea?.refSlot,
          kind: _0x95525e,
          occupiedSlots: _0x9e7000,
          sourceNode: _0x3e62ea?.nodeData || _0x3e62ea,
        }),
        _0x36d8a0 = _0x254883.slot;
      if (!_0x36d8a0) return;
      _0x43c87a[_0x36d8a0] = { ..._0x3e62ea, refSlot: _0x36d8a0, virtual: true };
    }),
    _0x43c87a
  );
}
export function buildFixedInputAssetSlotMap(
  _0x2f667e = null,
  {
    slotOrderByType: slotOrderByType = {},
    visibleSlots: visibleSlots = null,
    occupiedSlots: occupiedSlots = null,
    exclusiveGroups: exclusiveGroups = [],
    slotById: slotById = {},
    nodeData: nodeData = null,
  } = {},
) {
  const _0x12fe40 = getAssetInputRefsFromPromptAndNode(_0x2f667e, {
    nodeData: nodeData,
    allowedTypes: Object.keys(slotOrderByType),
  });
  return buildFixedInputAssetSlotMapFromRefs(_0x12fe40, {
    slotOrderByType: slotOrderByType,
    visibleSlots: visibleSlots,
    occupiedSlots: occupiedSlots,
    exclusiveGroups: exclusiveGroups,
    slotById: slotById,
  });
}
export function buildRhV54AssetSlotMapFromRefs(
  _0x3c2171 = [],
  { hideExtraSlots: hideExtraSlots = false, occupiedSlots: occupiedSlots = null } = {},
) {
  return buildFixedInputAssetSlotMapFromRefs(_0x3c2171, {
    slotOrderByType: RH_V54_ASSET_SLOT_ORDER,
    visibleSlots: getRhV54VisibleSlots({ hideExtraSlots: hideExtraSlots }),
    occupiedSlots: occupiedSlots,
  });
}
export function buildRhV54AssetSlotMap(
  _0x170706 = null,
  {
    hideExtraSlots: hideExtraSlots = false,
    occupiedSlots: occupiedSlots = null,
    nodeData: nodeData = null,
  } = {},
) {
  return buildFixedInputAssetSlotMap(_0x170706, {
    slotOrderByType: RH_V54_ASSET_SLOT_ORDER,
    visibleSlots: getRhV54VisibleSlots({ hideExtraSlots: hideExtraSlots }),
    occupiedSlots: occupiedSlots,
    nodeData: nodeData,
  });
}
export function buildRhBasicAssetSlotMap(_0x146133 = null, _0x3a3c65 = {}) {
  return buildFixedInputAssetSlotMap(_0x146133, {
    slotOrderByType: RH_BASIC_ASSET_SLOT_ORDER,
    visibleSlots: ['sourceVideo', 'refImage'],
    occupiedSlots: _0x3a3c65.occupiedSlots,
    nodeData: _0x3a3c65.nodeData,
  });
}
export function buildRhLtxAssetSlotMap(_0x3a152e = null, _0x47188e = {}) {
  return buildFixedInputAssetSlotMap(_0x3a152e, {
    slotOrderByType: RH_LTX_ASSET_SLOT_ORDER,
    visibleSlots: ['refImage', 'audio'],
    occupiedSlots: _0x47188e.occupiedSlots,
    nodeData: _0x47188e.nodeData,
  });
}
export function buildRhLipSyncAssetSlotMap(_0x2fb567 = null, _0x2b1f17 = {}) {
  return buildFixedInputAssetSlotMap(_0x2fb567, {
    slotOrderByType: RH_LIPSYNC_ASSET_SLOT_ORDER,
    visibleSlots: ['sourceVideo', 'refImage', 'audio'],
    occupiedSlots: _0x2b1f17.occupiedSlots,
    exclusiveGroups: RH_LIPSYNC_VISUAL_EXCLUSIVE_GROUPS,
    nodeData: _0x2b1f17.nodeData,
  });
}
