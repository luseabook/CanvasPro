import { buildGenerationFailurePatch, buildGenerationSuccessPatch } from './generationTaskLifecycle.js';
function asObject(_0x4e9c32) {
  return _0x4e9c32 && typeof _0x4e9c32 === 'object' && !Array.isArray(_0x4e9c32) ? _0x4e9c32 : null;
}
export function firstNonEmptyString(..._0x32158a) {
  for (const _0x5c6140 of _0x32158a) {
    const _0x2589b1 = String(_0x5c6140 || '').trim();
    if (_0x2589b1) return _0x2589b1;
  }
  return '';
}
export function resolveGenerationResultSelection(_0x43a687 = [], _0xaf63d1 = 0) {
  const _0xe0b48c = Number(_0xaf63d1),
    _0x21147c = Number.isFinite(_0xe0b48c) ? Math.trunc(_0xe0b48c) : 0;
  return {
    items: _0x43a687,
    activeIndex: Math.max(0, Math.min(_0x43a687.length - 1, _0x21147c)),
  };
}
export function normalizeGenerationResultItems(
  _0x5253d2,
  { collectionField: collectionField = '', singleItemFields: singleItemFields = [] } = {},
) {
  if (_0x5253d2?.outputType && Array.isArray(_0x5253d2.items)) return _0x5253d2.items;
  if (collectionField && Array.isArray(_0x5253d2?.[collectionField])) return _0x5253d2[collectionField];
  if (Array.isArray(_0x5253d2)) return _0x5253d2;
  const _0x1db08d = asObject(_0x5253d2);
  if (!_0x1db08d) return [];
  if (firstNonEmptyString(_0x1db08d.error)) return [_0x1db08d];
  for (const _0x23428d of singleItemFields) {
    if (firstNonEmptyString(_0x1db08d[_0x23428d])) return [_0x1db08d];
  }
  return [];
}
export function getFirstGenerationResultError(
  _0x3fe2b6,
  { collectionField: collectionField = '', singleItemFields: singleItemFields = [] } = {},
) {
  const _0x535bdd = normalizeGenerationResultItems(_0x3fe2b6, {
      collectionField: collectionField,
      singleItemFields: singleItemFields,
    }),
    _0x6fa2ad = _0x535bdd.find((_0x263368) => firstNonEmptyString(_0x263368?.error));
  return firstNonEmptyString(_0x6fa2ad?.error);
}
export function buildGenerationCollectionResultPatch(
  _0x364f08,
  {
    collectionField: _0x30276b,
    mainIndexField: _0x3e64d9,
    expandedField: expandedField = '',
    startedAt: startedAt = 0,
    duration: duration = null,
    normalizeItem: normalizeItem = (_0x3f5c3b) => _0x3f5c3b,
    buildFirstItemPatch: buildFirstItemPatch = () => ({}),
    selectMainIndex: selectMainIndex = null,
    extraPatch: extraPatch = {},
    singleItemFields: singleItemFields = [],
  } = {},
) {
  if (!_0x30276b || !_0x3e64d9)
    throw new Error('[generationResultRenderer] collection and main index fields are required');
  const _0x51281a = normalizeGenerationResultItems(_0x364f08, {
      collectionField: _0x30276b,
      singleItemFields: singleItemFields,
    }),
    _0x35d636 = _0x51281a.map((_0x181f85) => normalizeItem(_0x181f85));
  if (_0x35d636.length === 0) return null;
  const _0x259e4c = typeof selectMainIndex === 'function' ? Number(selectMainIndex(_0x35d636)) : 0,
    _0x44daba =
      Number.isFinite(_0x259e4c) && _0x259e4c >= 0
        ? Math.min(_0x35d636.length - 1, Math.trunc(_0x259e4c))
        : 0,
    _0x557b85 = _0x35d636[_0x44daba] || {},
    _0x21cdbf = firstNonEmptyString(_0x557b85.error),
    _0x49a287 = _0x21cdbf
      ? buildGenerationFailurePatch({ error: _0x21cdbf, startedAt: startedAt, duration: duration })
      : buildGenerationSuccessPatch({ startedAt: startedAt, duration: duration }),
    _0x48d5a8 = typeof extraPatch === 'function' ? extraPatch(_0x557b85, _0x35d636) : extraPatch;
  return {
    [_0x30276b]: _0x35d636,
    [_0x3e64d9]: _0x44daba,
    ...(expandedField ? { [expandedField]: false } : {}),
    ..._0x49a287,
    ...buildFirstItemPatch(_0x557b85, _0x35d636),
    ...(_0x48d5a8 && typeof _0x48d5a8 === 'object' ? _0x48d5a8 : {}),
  };
}
export function buildGenerationSingleResultPatch(
  _0x100418,
  {
    collectionField: collectionField = '',
    startedAt: startedAt = 0,
    duration: duration = null,
    normalizeItem: normalizeItem = (_0x49f2ac) => _0x49f2ac,
    buildItemPatch: buildItemPatch = () => ({}),
    extraPatch: extraPatch = {},
    singleItemFields: singleItemFields = [],
  } = {},
) {
  const _0x2e1791 = normalizeGenerationResultItems(_0x100418, {
    collectionField: collectionField,
    singleItemFields: singleItemFields,
  });
  if (_0x2e1791.length === 0) return null;
  const _0x271f99 = normalizeItem(_0x2e1791[0]),
    _0x4e6616 = firstNonEmptyString(_0x271f99?.error),
    _0x3a013a = _0x4e6616
      ? buildGenerationFailurePatch({ error: _0x4e6616, startedAt: startedAt, duration: duration })
      : buildGenerationSuccessPatch({ startedAt: startedAt, duration: duration }),
    _0x5f4a32 = typeof extraPatch === 'function' ? extraPatch(_0x271f99) : extraPatch;
  return {
    ..._0x3a013a,
    ...buildItemPatch(_0x271f99),
    ...(_0x5f4a32 && typeof _0x5f4a32 === 'object' ? _0x5f4a32 : {}),
  };
}
