function hasOwnManifestValue(value, item) {
  return Object['prototype']['hasOwnProperty']['call'](value || {}, item);
}
function isPresentManifestValue(list) {
  if (list === undefined || list === null) return ![];
  if (typeof list === 'string') return list['trim']() !== '';
  if (Array['isArray'](list)) return list['length'] > 0;
  return !![];
}
export function getComfyUiPayloadPathValue(options = {}, key = '') {
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
  { allowEmpty: allowEmpty = ![] } = {},
) {
  const list2 = Array['isArray'](target) ? target : [target];
  for (const next of list2['filter'](Boolean)) {
    const comfyUiPayloadPathValue = getComfyUiPayloadPathValue(data, next);
    if (allowEmpty && comfyUiPayloadPathValue !== undefined && comfyUiPayloadPathValue !== null)
      return comfyUiPayloadPathValue;
    if (isPresentManifestValue(comfyUiPayloadPathValue)) return comfyUiPayloadPathValue;
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
  if (!enabled2 || typeof enabled2 !== 'object') return !![];
  const output = enabled2['field'] ? getComfyUiPayloadPathValue(input, enabled2['field']) : undefined,
    isPresentManifestValue2 = isPresentManifestValue(output);
  if (hasOwnManifestValue(enabled2, 'exists') && Boolean(enabled2['exists']) !== isPresentManifestValue2)
    return ![];
  if (enabled2['truthy'] === !![] && !Boolean(output)) return ![];
  if (enabled2['falsy'] === !![] && Boolean(output)) return ![];
  if (hasOwnManifestValue(enabled2, 'equals') && !manifestValuesEqual(output, enabled2['equals'])) return ![];
  if (hasOwnManifestValue(enabled2, 'notEquals') && manifestValuesEqual(output, enabled2['notEquals']))
    return ![];
  if (
    Array['isArray'](enabled2['in']) &&
    !enabled2['in']['some']((value2) => manifestValuesEqual(output, value2))
  )
    return ![];
  if (
    Array['isArray'](enabled2['notIn']) &&
    enabled2['notIn']['some']((value3) => manifestValuesEqual(output, value3))
  )
    return ![];
  return !![];
}
function shouldUseManifestInputMapping(value4, value5) {
  const list4 = value4?.['when'];
  if (list4 === undefined || list4 === null) return !![];
  if (Array['isArray'](list4)) return list4['every']((value6) => evaluateManifestWhenRule(value6, value5));
  return evaluateManifestWhenRule(list4, value5);
}
function applyManifestInputValueMap(value7, map = {}) {
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
function applyManifestInputTransform(value14, value15 = {}, value16 = {}) {
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
    case 'boolean':
      return (
        value14 === !![] ||
        ['true', '1', 'yes', 'on']['includes'](
          String(value14 ?? '')
            ['trim']()
            ['toLowerCase'](),
        )
      );
    case 'booleanString':
      return value14 === !![] ||
        ['true', '1', 'yes', 'on']['includes'](
          String(value14 ?? '')
            ['trim']()
            ['toLowerCase'](),
        )
        ? 'true'
        : 'false';
    case 'integer': {
      const value17 = Number(value14),
        value18 = Number(error['defaultValue'] ?? value15['defaultValue'] ?? 0),
        value19 = Number['isFinite'](value17)
          ? Math['trunc'](value17)
          : Number['isFinite'](value18)
            ? Math['trunc'](value18)
            : 0;
      return clampManifestNumber(value19, error);
    }
    case 'number': {
      const value20 = Number(value14),
        value21 = Number(error['defaultValue'] ?? value15['defaultValue'] ?? 0),
        value22 = Number['isFinite'](value20) ? value20 : Number['isFinite'](value21) ? value21 : 0;
      return clampManifestNumber(value22, error);
    }
    default:
      throw new Error('Unsupported ComfyUI workflow transform: ' + error['name']);
  }
}
async function resolveComfyUiManifestInputValue({
  item: item2,
  payload: payload2,
  finalPrompt: finalPrompt2,
  sourceResolvers: sourceResolvers = {},
}) {
  const value23 = String(item2?.['source'] || 'param')['trim']();
  if (value23 === 'constant')
    return hasOwnManifestValue(item2, 'value') ? item2['value'] : item2['defaultValue'];
  if (value23 === 'prompt') {
    const manifestPayloadValue = resolveManifestPayloadValue(
      payload2,
      normalizeManifestFieldList(item2),
      '',
      {
        allowEmpty: item2?.['allowEmpty'] === !![],
      },
    );
    return isPresentManifestValue(manifestPayloadValue) || item2?.['allowEmpty'] === !![]
      ? manifestPayloadValue
      : finalPrompt2;
  }
  if (value23 === 'param') {
    const list5 = normalizeManifestFieldList(item2),
      manifestPayloadValue2 = resolveManifestPayloadValue(payload2, list5, undefined, {
        allowEmpty: item2?.['allowEmpty'] === !![],
      });
    if (isPresentManifestValue(manifestPayloadValue2) || item2?.['allowEmpty'] === !![])
      return manifestPayloadValue2;
    const value24 = list5['filter']((enabled3) => !enabled3['startsWith']('generationParams.'))['map'](
      (value25) => 'generationParams.' + value25,
    );
    return resolveManifestPayloadValue(payload2, value24, undefined, {
      allowEmpty: item2?.['allowEmpty'] === !![],
    });
  }
  const run = sourceResolvers[value23];
  if (typeof run === 'function') return run({ item: item2, payload: payload2, finalPrompt: finalPrompt2 });
  throw new Error('Unsupported ComfyUI workflow mapping source: ' + value23);
}
function cloneWorkflowGraph(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object' || Array['isArray'](enabled4))
    throw new Error('ComfyUI workflow mapping missing workflow graph');
  return JSON['parse'](JSON['stringify'](enabled4));
}
function setComfyUiNodeInput(value26, value27, value28) {
  const enabled5 = String(value27?.['nodeId'] || '')['trim'](),
    enabled6 = String(value27?.['inputName'] || value27?.['fieldName'] || '')['trim']();
  if (!enabled5 || !enabled6) return ![];
  const enabled7 = value26[enabled5];
  if (!enabled7 || typeof enabled7 !== 'object' || Array['isArray'](enabled7)) {
    if (value27?.['required'])
      throw new Error(value27['missingMessage'] || 'Missing ComfyUI workflow node: ' + enabled5);
    return ![];
  }
  return (
    (!enabled7['inputs'] || typeof enabled7['inputs'] !== 'object' || Array['isArray'](enabled7['inputs'])) &&
      (enabled7['inputs'] = {}),
    (enabled7['inputs'][enabled6] = value28),
    !![]
  );
}
export async function buildComfyUiPromptFromManifest({
  mapping: mapping,
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  sourceResolvers: sourceResolvers = {},
  transforms: transforms = {},
} = {}) {
  const cloneWorkflowGraph2 = cloneWorkflowGraph(mapping?.['workflow'] || mapping?.['prompt']),
    value29 = Array['isArray'](mapping?.['inputs'])
      ? mapping['inputs']
      : Array['isArray'](mapping?.['nodeInputs'])
        ? mapping['nodeInputs']
        : [];
  for (const item3 of value29) {
    if (!item3?.['nodeId'] || !(item3?.['inputName'] || item3?.['fieldName'])) continue;
    if (!shouldUseManifestInputMapping(item3, payload)) continue;
    const comfyUiManifestInputValue = await resolveComfyUiManifestInputValue({
        item: item3,
        payload: payload,
        finalPrompt: finalPrompt,
        sourceResolvers: sourceResolvers,
      }),
      value30 = item3?.['allowEmpty'] === !![],
      enabled8 = item3?.['includeEmpty'] === !![] || value30,
      hasOwnManifestValue2 = hasOwnManifestValue(item3, 'defaultValue');
    let manifestInputValueMap = comfyUiManifestInputValue;
    !isPresentManifestValue(manifestInputValueMap) &&
      hasOwnManifestValue2 &&
      !(value30 && manifestInputValueMap !== undefined && manifestInputValueMap !== null) &&
      (manifestInputValueMap = item3['defaultValue']);
    if (!isPresentManifestValue(manifestInputValueMap)) {
      if (enabled8) manifestInputValueMap = '';
      else {
        if (item3['required'])
          throw new Error(
            item3['missingMessage'] ||
              'Missing ComfyUI workflow input: ' +
                item3['nodeId'] +
                '.' +
                (item3['inputName'] || item3['fieldName']),
          );
        else continue;
      }
    }
    ((manifestInputValueMap = applyManifestInputValueMap(manifestInputValueMap, item3)),
      (manifestInputValueMap = applyManifestInputTransform(manifestInputValueMap, item3, transforms)));
    if (!isPresentManifestValue(manifestInputValueMap) && item3['required'] && !enabled8)
      throw new Error(
        item3['missingMessage'] ||
          'Missing ComfyUI workflow input: ' +
            item3['nodeId'] +
            '.' +
            (item3['inputName'] || item3['fieldName']),
      );
    if (!isPresentManifestValue(manifestInputValueMap) && !enabled8) continue;
    setComfyUiNodeInput(cloneWorkflowGraph2, item3, manifestInputValueMap);
  }
  return cloneWorkflowGraph2;
}
