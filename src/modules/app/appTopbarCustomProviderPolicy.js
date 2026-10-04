import { CUSTOM_PROVIDER_VIP_MODEL_ID, isModelAllowed } from '../subscriptionAccess.js';
export function isCustomProviderAccessAllowed(options = {}) {
  return isModelAllowed(CUSTOM_PROVIDER_VIP_MODEL_ID, options, 'aicanvas');
}
export function applyCustomProviderModelSelectionState(
  value,
  { modelKey: modelKey = '', detectedKind: detectedKind = 'unknown', selected: selected = ![] } = {},
) {
  const enabled = String(modelKey || '')['trim']();
  if (!enabled) return ![];
  if (selected) return (value['selectedModelKeys']['add'](enabled), ![]);
  value['selectedModelKeys']['delete'](enabled);
  const item =
    String(detectedKind || 'unknown')
      ['trim']()
      ['toLowerCase']() === 'unknown';
  return (item && value['assignedModelKinds']['delete'](enabled), item);
}
export function scrollCustomProviderModelListFromWheel(el, event = {}) {
  if (!el) return ![];
  const count = Number(event?.['deltaY']);
  if (!Number['isFinite'](count) || count === 0x0) return ![];
  const key = Math['max'](0x0, Number(el['clientHeight']) || 0x0),
    index = Math['max'](key, Number(el['scrollHeight']) || 0x0),
    result = Math['max'](0x0, index - key),
    data = Math['min'](result, Math['max'](0x0, Number(el['scrollTop']) || 0x0)),
    count2 = Number(event?.['deltaMode']) || 0x0,
    target = count2 === 0x1 ? 0x10 : count2 === 0x2 ? Math['max'](key, 0x1) : 0x1,
    source = Math['min'](result, Math['max'](0x0, data + count * target));
  if (source === data) return ![];
  return ((el['scrollTop'] = source), !![]);
}
export function handleCustomProviderResultWheel(event2, enabled2) {
  const el2 = event2?.['target']?.['closest']?.('[data-custom-provider-result]');
  if (!el2 || !enabled2?.['contains']?.(el2)) return ![];
  if (event2['target']?.['closest']?.('.custom-provider-model-options')) return ![];
  const next = el2['querySelector']?.('.custom-provider-model-options');
  if (!scrollCustomProviderModelListFromWheel(next, event2)) return ![];
  return (event2['preventDefault']?.(), !![]);
}
export function captureCustomProviderModelSelectionScroll(el3) {
  const current = el3?.['querySelector']?.('.custom-provider-model-options');
  return {
    resultScrollTop: Math['max'](0x0, Number(el3?.['scrollTop']) || 0x0),
    modelListScrollTop: Math['max'](0x0, Number(current?.['scrollTop']) || 0x0),
  };
}
export function restoreCustomProviderModelSelectionScroll(el4, entry = {}) {
  if (!el4) return ![];
  const enabled3 = el4['querySelector']?.('.custom-provider-model-options');
  return (
    (el4['scrollTop'] = Math['max'](0x0, Number(entry['resultScrollTop']) || 0x0)),
    enabled3 && (enabled3['scrollTop'] = Math['max'](0x0, Number(entry['modelListScrollTop']) || 0x0)),
    !!enabled3
  );
}
const CUSTOM_PROVIDER_EDITOR_STABLE_HEIGHT_PROPERTY = '--custom-provider-editor-stable-height';
export function stabilizeCustomProviderEditorListHeight(el5) {
  if (!el5) return 0x0;
  const record = Number(el5['getBoundingClientRect']?.()['height']),
    payload = Number['isFinite'](record)
      ? Math['max'](0x0, record)
      : Math['max'](0x0, Number(el5['offsetHeight']) || 0x0),
    handle = Math['max'](0x0, Number(el5['dataset']?.['customProviderStableHeight']) || 0x0),
    enabled4 = Math['ceil'](Math['max'](payload, handle));
  if (!enabled4) return 0x0;
  return (
    el5['dataset'] && (el5['dataset']['customProviderStableHeight'] = String(enabled4)),
    el5['style']?.['setProperty']?.(CUSTOM_PROVIDER_EDITOR_STABLE_HEIGHT_PROPERTY, enabled4 + 'px'),
    enabled4
  );
}
function getCustomProviderManifestUpstreamModelId(options2 = {}) {
  const state = options2?.['extensions']?.['customProvider'] || {},
    config = String(options2?.['modelId'] || '')['trim']();
  return String(state['upstreamModelId'] || options2['displayName'] || config['split']('/')['pop']() || '')[
    'trim'
  ]();
}
function getCustomProviderModelCapabilityStatus(options3 = {}) {
  return String(
    options3?.['capabilityStatus'] ||
      options3?.['extensions']?.['customProvider']?.['capability']?.['status'] ||
      'unverified',
  )
    ['trim']()
    ['toLowerCase']();
}
export function isCustomProviderModelCapabilityRecognized(options4 = {}) {
  return ['documented', 'verified']['includes'](getCustomProviderModelCapabilityStatus(options4));
}
export function getCustomProviderModelsNeedingVerification(list = []) {
  return (Array['isArray'](list) ? list : [])['filter'](
    (scope) => !isCustomProviderModelCapabilityRecognized(scope),
  );
}
export function getCustomProviderModelsBlockingSave(list2 = []) {
  const list3 = Array['isArray'](list2) ? list2 : [];
  if (list3['length'] > 0x0 && list3['every']((input) => input?.['kind'] === 'text')) return [];
  return getCustomProviderModelsNeedingVerification(list3);
}
export function getCustomProviderSaveStatus(list4 = []) {
  const count3 = Array['isArray'](list4) ? list4 : [],
    key2 = getCustomProviderModelsNeedingVerification(count3)['length'];
  return {
    key: key2 > 0x0 ? 'savedWithUnverified' : 'saved',
    count: count3['length'],
    unverified: key2,
  };
}
export function getCustomProviderModelActionState({
  hasDiscovery: hasDiscovery = ![],
  hasSavedBundle: hasSavedBundle = ![],
  isAddingModels: isAddingModels = ![],
  selectedCount: selectedCount = 0x0,
  unverifiedCount: unverifiedCount = selectedCount,
  busy: busy = ![],
} = {}) {
  return {
    saveHidden: !hasDiscovery,
    saveDisabled: busy || selectedCount <= 0x0 || unverifiedCount > 0x0,
    verifyHidden: !hasDiscovery && !hasSavedBundle,
    verifyDisabled: busy || selectedCount <= 0x0,
    actionsHidden: !hasDiscovery && !hasSavedBundle,
    saveLabelKey: 'saveModels',
  };
}
export function mergeCustomProviderDiscoveryCapabilities(args = {}, output = {}, value2 = !![]) {
  const map = new Map(
      (Array['isArray'](output?.['models']) ? output['models'] : [])
        ['map']((value3) => {
          const value4 = value3?.['extensions']?.['customProvider']?.['capability'] || {},
            isCustomProviderModelCapabilityRecognized2 = isCustomProviderModelCapabilityRecognized(value3);
          return [
            getCustomProviderManifestUpstreamModelId(value3),
            {
              ...(value2 ? { isSaved: !![] } : {}),
              ...(isCustomProviderModelCapabilityRecognized2
                ? {
                    capabilitySource: String(value4['source'] || 'stored-bundle')['trim'](),
                    capabilityStatus: getCustomProviderModelCapabilityStatus(value3),
                  }
                : {}),
            },
          ];
        })
        ['filter'](([value5]) => value5),
    ),
    models = (value6) =>
      (Array['isArray'](value6) ? value6 : [])['map']((args2) => {
        const args3 = map['get'](String(args2?.['upstreamModelId'] || '')['trim']());
        return args3 ? { ...args2, ...args3 } : args2;
      });
  return {
    ...args,
    models: models(args?.['models']),
    unknown: models(args?.['unknown']),
  };
}
export function mergeCustomProviderRecognizedProfiles(args4 = {}, value7 = {}) {
  const run = (value8, args5) => {
      const args6 =
          value8?.['extensions'] && typeof value8['extensions'] === 'object' ? value8['extensions'] : {},
        args7 = args5?.['extensions'] && typeof args5['extensions'] === 'object' ? args5['extensions'] : {},
        args8 =
          args6['customProvider'] && typeof args6['customProvider'] === 'object'
            ? args6['customProvider']
            : {},
        capability =
          args7['customProvider'] && typeof args7['customProvider'] === 'object'
            ? args7['customProvider']
            : {},
        extensions = {
          ...args6,
          ...args7,
          customProvider: {
            ...capability,
            ...args8,
            capability: capability['capability'] || args8['capability'],
          },
        };
      return (
        ['textMenu', 'imageMenu', 'videoMenu', 'audioMenu']['forEach']((value9) => {
          const args9 = args6[value9];
          if (!args9 || typeof args9 !== 'object') return;
          const value10 = args7[value9];
          extensions[value9] = {
            ...(value10 && typeof value10 === 'object' ? value10 : {}),
            ...args9,
          };
        }),
        { ...args5, extensions: extensions }
      );
    },
    map2 = new Map(
      (Array['isArray'](value7?.['models']) ? value7['models'] : [])
        ['filter'](isCustomProviderModelCapabilityRecognized)
        ['map']((value11) => [getCustomProviderManifestUpstreamModelId(value11), value11])
        ['filter'](([value12]) => value12),
    ),
    map3 = new Map(
      (Array['isArray'](value7?.['executions']) ? value7['executions'] : [])
        ['map']((value13) => [String(value13?.['id'] || '')['trim'](), value13])
        ['filter'](([value14]) => value14),
    ),
    map4 = new Map(
      (Array['isArray'](args4?.['executions']) ? args4['executions'] : [])
        ['map']((value15) => [String(value15?.['id'] || '')['trim'](), value15])
        ['filter'](([value16]) => value16),
    ),
    map5 = new Set(),
    models2 = (Array['isArray'](args4?.['models']) ? args4['models'] : [])['map']((value17) => {
      const enabled5 = map2['get'](getCustomProviderManifestUpstreamModelId(value17));
      if (!enabled5 || enabled5['kind'] !== value17['kind']) return value17;
      return (map5['add'](String(enabled5['executionId'] || '')['trim']()), run(value17, enabled5));
    }),
    map6 = new Set(),
    executions = models2['flatMap']((value18) => {
      const enabled6 = String(value18?.['executionId'] || '')['trim']();
      if (!enabled6 || map6['has'](enabled6)) return [];
      map6['add'](enabled6);
      const value19 = map5['has'](enabled6)
        ? map3['get'](enabled6) || map4['get'](enabled6)
        : map4['get'](enabled6) || map3['get'](enabled6);
      return value19 ? [value19] : [];
    });
  return { ...args4, models: models2, executions: executions };
}
export function resolveCustomProviderDocumentationFailureKey(options5 = {}) {
  const list5 = (Array['isArray'](options5?.['agentModelResults']) ? options5['agentModelResults'] : [])[
    'map'
  ]((response) =>
    String(response?.['status'] || '')
      ['trim']()
      ['toLowerCase'](),
  );
  if (list5['includes']('inaccessible')) return 'documentationAgentInaccessible';
  if (list5['includes']('unsupported_lifecycle')) return 'documentationAsyncLifecycleUnsupported';
  if (list5['includes']('not_found')) return 'documentationSelectedModelNotFound';
  return 'documentationNoMatchingProfile';
}
export function getRememberedCustomProviderConfigs(options6 = {}) {
  return Object['entries'](options6 && typeof options6 === 'object' ? options6 : {})
    ['filter'](([value20, enabled7]) => {
      if (!String(value20 || '')['startsWith']('custom_')) return ![];
      if (!enabled7 || typeof enabled7 !== 'object' || Array['isArray'](enabled7)) return ![];
      return !!(String(enabled7['apiUrl'] || '')['trim']() && String(enabled7['apiKey'] || '')['trim']());
    })
    ['map'](([value21, value22]) => ({
      providerId: String(value21)['trim'](),
      baseUrl: String(value22['apiUrl'] || '')['trim'](),
      apiKey: String(value22['apiKey'] || '')['trim'](),
      name: String(value22['label'] || value21)['trim'](),
      documentationUrl: String(value22['documentationUrl'] || '')['trim'](),
    }));
}
