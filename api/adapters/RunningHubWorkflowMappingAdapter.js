import { translateMinimaxH3EditorAssetMentions } from './minimaxH3Prompt.js';
function hasOwnManifestValue(value, item) {
  return Object['prototype']['hasOwnProperty']['call'](value || {}, item);
}
function isPresentManifestValue(list) {
  if (list === undefined || list === null) return false;
  if (typeof list === 'string') return list['trim']() !== '';
  if (Array['isArray'](list)) return list['length'] > 0;
  return true;
}
function getManifestPayloadPathValue(options = {}, key = '') {
  const enabled = String(key || '')['trim']();
  if (!enabled) return undefined;
  return enabled['split']('.')['reduce']((index, result) => {
    if (index === undefined || index === null) return undefined;
    return index[result];
  }, options);
}
function resolveManifestPayloadValue(
  data,
  target = [],
  source = undefined,
  { allowEmpty: allowEmpty = false } = {},
) {
  const list2 = Array['isArray'](target) ? target : [target];
  for (const next of list2['filter'](Boolean)) {
    const manifestPayloadPathValue = getManifestPayloadPathValue(data, next);
    if (allowEmpty && manifestPayloadPathValue !== undefined && manifestPayloadPathValue !== null)
      return manifestPayloadPathValue;
    if (isPresentManifestValue(manifestPayloadPathValue)) return manifestPayloadPathValue;
  }
  return source;
}
function normalizeManifestFieldList(current, entry = '') {
  const record = current?.['fields'] !== undefined ? current['fields'] : current?.['field'],
    list3 = Array['isArray'](record) ? record : [record || entry];
  return list3['map']((handle) => String(handle || '')['trim']())['filter'](Boolean);
}
function manifestValuesEqual(state, config) {
  if (typeof config === 'boolean') {
    const scope = String(state ?? '')
      ['trim']()
      ['toLowerCase']();
    return state === config || scope === String(config);
  }
  if (typeof config === 'number') return Number(state) === config;
  return String(state ?? '')['trim']() === String(config ?? '')['trim']();
}
function evaluateManifestWhenRule(enabled2, input) {
  if (!enabled2 || typeof enabled2 !== 'object') return true;
  const output = enabled2['field'] ? getManifestPayloadPathValue(input, enabled2['field']) : undefined,
    isPresentManifestValue2 = isPresentManifestValue(output);
  if (hasOwnManifestValue(enabled2, 'exists') && Boolean(enabled2['exists']) !== isPresentManifestValue2)
    return false;
  if (enabled2['truthy'] === true && !Boolean(output)) return false;
  if (enabled2['falsy'] === true && Boolean(output)) return false;
  if (hasOwnManifestValue(enabled2, 'equals') && !manifestValuesEqual(output, enabled2['equals'])) return false;
  if (hasOwnManifestValue(enabled2, 'notEquals') && manifestValuesEqual(output, enabled2['notEquals']))
    return false;
  if (
    Array['isArray'](enabled2['in']) &&
    !enabled2['in']['some']((value2) => manifestValuesEqual(output, value2))
  )
    return false;
  if (
    Array['isArray'](enabled2['notIn']) &&
    enabled2['notIn']['some']((value3) => manifestValuesEqual(output, value3))
  )
    return false;
  return true;
}
function shouldUseManifestNodeMapping(value4, value5) {
  const list4 = value4?.['when'];
  if (list4 === undefined || list4 === null) return true;
  if (Array['isArray'](list4)) return list4['every']((value6) => evaluateManifestWhenRule(value6, value5));
  return evaluateManifestWhenRule(list4, value5);
}
function applyManifestNodeValueMap(value7, map = {}) {
  const value8 = map['valueMap'] || map['values'] || {},
    value9 = String(value7 ?? '')['trim']();
  if (value9 && value8[value9] !== undefined) return value8[value9];
  const value10 = value9['toLowerCase']();
  if (value9 && value8[value10] !== undefined) return value8[value10];
  return value7;
}
function normalizeManifestTransformSpec(name) {
  if (!name) return { name: '' };
  if (typeof name === 'string') return { name: name };
  if (typeof name === 'object' && !Array['isArray'](name))
    return { ...name, name: String(name['name'] || '')['trim']() };
  return { name: '' };
}
function clampManifestNumber(value11, value12) {
  let value13 = value11;
  if (Number['isFinite'](Number(value12['min']))) value13 = Math['max'](Number(value12['min']), value13);
  if (Number['isFinite'](Number(value12['max']))) value13 = Math['min'](Number(value12['max']), value13);
  return value13;
}
function applyManifestNodeTransform(value14, value15 = {}, value16 = {}) {
  const error = normalizeManifestTransformSpec(value15['transform']),
    handler = value16[error['name']];
  if (typeof handler === 'function') return handler(value14, error, value15);
  switch (error['name']) {
    case '':
      return value14;
    case 'trim':
      return String(value14 ?? '')['trim']();
    case 'string':
      return String(value14 ?? '');
    case 'minimaxH3AssetMentions':
      return translateMinimaxH3EditorAssetMentions(value14);
    case 'boolean':
    case 'booleanString': {
      const value17 = String(value14 ?? '')
        ['trim']()
        ['toLowerCase']();
      return value14 === true ||
        value17 === 'true' ||
        value17 === '1' ||
        value17 === 'yes' ||
        value17 === 'on'
        ? 'true'
        : 'false';
    }
    case 'integer': {
      const value18 = Number(value14),
        value19 = Number(error['defaultValue'] ?? value15['defaultValue'] ?? 0),
        value20 = Number['isFinite'](value18)
          ? Math['trunc'](value18)
          : Number['isFinite'](value19)
            ? Math['trunc'](value19)
            : 0;
      return clampManifestNumber(value20, error);
    }
    case 'number': {
      const value21 = Number(value14),
        value22 = Number(error['defaultValue'] ?? value15['defaultValue'] ?? 0),
        value23 = Number['isFinite'](value21) ? value21 : Number['isFinite'](value22) ? value22 : 0;
      return clampManifestNumber(value23, error);
    }
    default:
      throw new Error('Unsupported RunningHub workflow transform: ' + error['name']);
  }
}
async function resolveRunningHubManifestNodeValue({
  item: item2,
  payload: payload2,
  finalPrompt: finalPrompt2,
  sourceResolvers: sourceResolvers = {},
}) {
  const value24 = String(item2?.['source'] || 'param')['trim']();
  if (value24 === 'constant')
    return hasOwnManifestValue(item2, 'value') ? item2['value'] : item2['defaultValue'];
  if (value24 === 'prompt') {
    const manifestPayloadValue = resolveManifestPayloadValue(payload2, normalizeManifestFieldList(item2), '');
    return isPresentManifestValue(manifestPayloadValue) ? manifestPayloadValue : finalPrompt2;
  }
  if (value24 === 'param') {
    const list5 = normalizeManifestFieldList(item2),
      manifestPayloadValue2 = resolveManifestPayloadValue(payload2, list5, undefined, {
        allowEmpty: item2?.['allowEmpty'] === true,
      });
    if (
      isPresentManifestValue(manifestPayloadValue2) ||
      (item2?.['allowEmpty'] === true &&
        manifestPayloadValue2 !== undefined &&
        manifestPayloadValue2 !== null)
    )
      return manifestPayloadValue2;
    const value25 = list5['filter']((enabled3) => !enabled3['startsWith']('generationParams.'))['map'](
      (value26) => 'generationParams.' + value26,
    );
    return resolveManifestPayloadValue(payload2, value25, undefined, {
      allowEmpty: item2?.['allowEmpty'] === true,
    });
  }
  const run = sourceResolvers[value24];
  if (typeof run === 'function') return run({ item: item2, payload: payload2, finalPrompt: finalPrompt2 });
  throw new Error('Unsupported RunningHub workflow mapping source: ' + value24);
}
export function pushRunningHubManifestNode(list6, fieldValue, value27, description = {}) {
  if (!fieldValue?.['nodeId'] || !fieldValue?.['fieldName']) return;
  list6['push']({
    nodeId: String(fieldValue['nodeId']),
    fieldName: String(description['fieldName'] || fieldValue['fieldName']),
    fieldValue:
      fieldValue['preserveValueType'] === true
        ? fieldValue['transform'] === 'boolean'
          ? String(value27) === 'true'
          : value27
        : String(value27),
    ...(fieldValue['description'] || description['description']
      ? { description: description['description'] || fieldValue['description'] }
      : {}),
  });
}
export function getRunningHubMappedValue(value28, value29, value30 = '') {
  const value31 = String(value28 ?? '')['trim'](),
    value32 = value29?.['valueMap'] || {};
  if (value31 && value32[value31] !== undefined) return value32[value31];
  if (value31 && value32[value31['toLowerCase']()] !== undefined) return value32[value31['toLowerCase']()];
  return value29?.['defaultValue'] ?? value30;
}
export async function buildRunningHubNodeInfoListFromManifest({
  mapping: mapping,
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  sourceResolvers: sourceResolvers = {},
  transforms: transforms = {},
}) {
  const list7 = Array['isArray'](mapping?.['nodeInfoList']) ? mapping['nodeInfoList'] : [];
  if (list7['length'] === 0) return mapping?.['allowEmptyNodeInfoList'] === true ? [] : null;
  const value33 = [];
  for (const item3 of list7) {
    if (!item3?.['nodeId'] || !item3?.['fieldName']) continue;
    if (!shouldUseManifestNodeMapping(item3, payload)) continue;
    const runningHubManifestNodeValue = await resolveRunningHubManifestNodeValue({
        item: item3,
        payload: payload,
        finalPrompt: finalPrompt,
        sourceResolvers: sourceResolvers,
      }),
      value34 = item3?.['allowEmpty'] === true,
      enabled4 = item3?.['includeEmpty'] === true || value34,
      hasOwnManifestValue2 = hasOwnManifestValue(item3, 'defaultValue');
    let manifestNodeValueMap = runningHubManifestNodeValue;
    !isPresentManifestValue(manifestNodeValueMap) &&
      hasOwnManifestValue2 &&
      !(value34 && manifestNodeValueMap !== undefined && manifestNodeValueMap !== null) &&
      (manifestNodeValueMap = item3['defaultValue']);
    if (!isPresentManifestValue(manifestNodeValueMap)) {
      if (enabled4) manifestNodeValueMap = '';
      else {
        if (item3['required'])
          throw new Error(
            item3['missingMessage'] ||
              'Missing RunningHub workflow node input: ' + item3['fieldName'],
          );
        else continue;
      }
    }
    ((manifestNodeValueMap = applyManifestNodeValueMap(manifestNodeValueMap, item3)),
      (manifestNodeValueMap = applyManifestNodeTransform(manifestNodeValueMap, item3, transforms)));
    if (!isPresentManifestValue(manifestNodeValueMap) && item3['required'] && !enabled4)
      throw new Error(
        item3['missingMessage'] || 'Missing RunningHub workflow node input: ' + item3['fieldName'],
      );
    if (!isPresentManifestValue(manifestNodeValueMap) && !enabled4) continue;
    pushRunningHubManifestNode(value33, item3, manifestNodeValueMap);
  }
  return value33;
}
