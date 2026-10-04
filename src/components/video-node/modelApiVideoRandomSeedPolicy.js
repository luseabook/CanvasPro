import { resolveRandomSeedModeFromParams } from '../shared/randomSeedPolicy.js';
function getPlainObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
export function buildSubmitRandomizedSeedPatch({
  modelManifest: modelManifest = null,
  nodeData: nodeData = {},
  payload: payload = {},
  random: random = Math['random'],
} = {}) {
  const list = Array['isArray'](modelManifest?.['uiSchema']?.['fields'])
      ? modelManifest['uiSchema']['fields']
      : [],
    list2 = list['filter']((item) => {
      const key = String(item?.['id'] || '')['trim']();
      return (
        item?.['randomizeOnSubmit'] === !![] && key && String(item?.['variant'] || '') === 'randomSeedRow'
      );
    });
  if (list2['length'] === 0x0) return null;
  let generationParams = {
      ...getPlainObject(nodeData?.['generationParams']),
      ...getPlainObject(payload?.['generationParams']),
    },
    requestParams = null,
    enabled = ![];
  list2['forEach']((index) => {
    const seedField = String(index?.['id'] || '')['trim'](),
      modeField = String(index?.['randomSeedModeField'] || '')['trim'](),
      defaultMode = String(index?.['randomSeedDefaultMode'] || 'fixed')['trim']() || 'fixed',
      { mode: mode, hasLegacyNumericSeed: hasLegacyNumericSeed } = resolveRandomSeedModeFromParams(
        generationParams,
        {
          seedField: seedField,
          modeField: modeField,
          defaultMode: defaultMode,
        },
      );
    if (mode !== 'random') {
      hasLegacyNumericSeed &&
        ((generationParams = { ...generationParams, [modeField]: 'fixed' }),
        (requestParams = { ...(requestParams || generationParams), [modeField]: 'fixed' }),
        (enabled = !![]));
      return;
    }
    const result = Number(index?.['randomSeedMin'] ?? index?.['min']),
      data = Number(index?.['randomSeedMax'] ?? index?.['max']),
      options = Number['isFinite'](result) ? Math['trunc'](result) : 0x0,
      target = Number['isFinite'](data) ? Math['trunc'](data) : 0x7fffffff,
      source = Math['min'](options, target),
      next = Math['max'](options, target),
      current = String(source + Math['floor'](random() * (next - source + 0x1)));
    ((generationParams = {
      ...generationParams,
      [seedField]: current,
      ...(modeField ? { [modeField]: 'random' } : {}),
    }),
      (requestParams = {
        ...(requestParams || generationParams),
        [seedField]: current,
        ...(modeField ? { [modeField]: 'fixed' } : {}),
      }),
      (enabled = !![]));
  });
  if (!enabled) return null;
  const entry = String(payload?.['model'] || nodeData?.['model'] || modelManifest?.['modelId'] || '')[
      'trim'
    ](),
    storePatch = { generationParams: generationParams };
  return (
    entry &&
      (storePatch['generationParamsByModel'] = {
        ...getPlainObject(nodeData?.['generationParamsByModel']),
        [entry]: generationParams,
      }),
    { requestParams: requestParams || generationParams, storePatch: storePatch }
  );
}
