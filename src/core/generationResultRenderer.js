import { buildGenerationFailurePatch, buildGenerationSuccessPatch } from './generationTaskLifecycle.js';
function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
export function firstNonEmptyString(...args) {
  for (const item of args) {
    const key = String(item || '').trim();
    if (key) return key;
  }
  return '';
}
export function resolveGenerationResultSelection(items = [], index = 0) {
  const result = Number(index),
    data = Number.isFinite(result) ? Math.trunc(result) : 0;
  return {
    items: items,
    activeIndex: Math.max(0, Math.min(items.length - 1, data)),
  };
}
export function normalizeGenerationResultItems(
  options,
  { collectionField: collectionField = '', singleItemFields: singleItemFields = [] } = {},
) {
  if (options?.outputType && Array.isArray(options.items)) return options.items;
  if (collectionField && Array.isArray(options?.[collectionField])) return options[collectionField];
  if (Array.isArray(options)) return options;
  const asObject2 = asObject(options);
  if (!asObject2) return [];
  if (firstNonEmptyString(asObject2.error)) return [asObject2];
  for (const target of singleItemFields) {
    if (firstNonEmptyString(asObject2[target])) return [asObject2];
  }
  return [];
}
export function getFirstGenerationResultError(
  source,
  { collectionField: collectionField = '', singleItemFields: singleItemFields = [] } = {},
) {
  const list = normalizeGenerationResultItems(source, {
      collectionField: collectionField,
      singleItemFields: singleItemFields,
    }),
    next = list.find((item2) => firstNonEmptyString(item2?.error));
  return firstNonEmptyString(next?.error);
}
export function buildGenerationCollectionResultPatch(
  current,
  {
    collectionField: collectionField2,
    mainIndexField: mainIndexField,
    expandedField: expandedField = '',
    startedAt: startedAt = 0,
    duration: duration = null,
    normalizeItem: normalizeItem = (entry) => entry,
    buildFirstItemPatch: buildFirstItemPatch = () => ({}),
    selectMainIndex: selectMainIndex = null,
    extraPatch: extraPatch = {},
    singleItemFields: singleItemFields = [],
  } = {},
) {
  if (!collectionField2 || !mainIndexField)
    throw new Error('[generationResultRenderer] collection and main index fields are required');
  const list2 = normalizeGenerationResultItems(current, {
      collectionField: collectionField2,
      singleItemFields: singleItemFields,
    }),
    list3 = list2.map((item3) => normalizeItem(item3));
  if (list3.length === 0) return null;
  const count = typeof selectMainIndex === 'function' ? Number(selectMainIndex(list3)) : 0,
    record = Number.isFinite(count) && count >= 0 ? Math.min(list3.length - 1, Math.trunc(count)) : 0,
    payload = list3[record] || {},
    error = firstNonEmptyString(payload.error),
    args2 = error
      ? buildGenerationFailurePatch({ error: error, startedAt: startedAt, duration: duration })
      : buildGenerationSuccessPatch({ startedAt: startedAt, duration: duration }),
    handle = typeof extraPatch === 'function' ? extraPatch(payload, list3) : extraPatch;
  return {
    [collectionField2]: list3,
    [mainIndexField]: record,
    ...(expandedField ? { [expandedField]: false } : {}),
    ...args2,
    ...buildFirstItemPatch(payload, list3),
    ...(handle && typeof handle === 'object' ? handle : {}),
  };
}
export function buildGenerationSingleResultPatch(
  state,
  {
    collectionField: collectionField = '',
    startedAt: startedAt = 0,
    duration: duration = null,
    normalizeItem: normalizeItem = (config) => config,
    buildItemPatch: buildItemPatch = () => ({}),
    extraPatch: extraPatch = {},
    singleItemFields: singleItemFields = [],
  } = {},
) {
  const list4 = normalizeGenerationResultItems(state, {
    collectionField: collectionField,
    singleItemFields: singleItemFields,
  });
  if (list4.length === 0) return null;
  const item4 = normalizeItem(list4[0]),
    error2 = firstNonEmptyString(item4?.error),
    args3 = error2
      ? buildGenerationFailurePatch({ error: error2, startedAt: startedAt, duration: duration })
      : buildGenerationSuccessPatch({ startedAt: startedAt, duration: duration }),
    scope = typeof extraPatch === 'function' ? extraPatch(item4) : extraPatch;
  return {
    ...args3,
    ...buildItemPatch(item4),
    ...(scope && typeof scope === 'object' ? scope : {}),
  };
}
