import { CUSTOM_PROVIDER_VIP_MODEL_ID, isModelAllowed } from '../subscriptionAccess.js';
export function isCustomProviderAccessAllowed(_0xc12545 = {}) {
  return isModelAllowed(CUSTOM_PROVIDER_VIP_MODEL_ID, _0xc12545, 'aicanvas');
}
export function applyCustomProviderModelSelectionState(
  _0x1543e4,
  { modelKey: modelKey = '', detectedKind: detectedKind = 'unknown', selected: selected = ![] } = {},
) {
  const _0x14cb05 = String(modelKey || '')['trim']();
  if (!_0x14cb05) return ![];
  if (selected) return (_0x1543e4['selectedModelKeys']['add'](_0x14cb05), ![]);
  _0x1543e4['selectedModelKeys']['delete'](_0x14cb05);
  const _0x57f60b =
    String(detectedKind || 'unknown')
      ['trim']()
      ['toLowerCase']() === 'unknown';
  return (_0x57f60b && _0x1543e4['assignedModelKinds']['delete'](_0x14cb05), _0x57f60b);
}
export function scrollCustomProviderModelListFromWheel(_0x54d03a, _0x226941 = {}) {
  if (!_0x54d03a) return ![];
  const _0x484f8a = Number(_0x226941?.['deltaY']);
  if (!Number['isFinite'](_0x484f8a) || _0x484f8a === 0x0) return ![];
  const _0x212f85 = Math['max'](0x0, Number(_0x54d03a['clientHeight']) || 0x0),
    _0x5f5da3 = Math['max'](_0x212f85, Number(_0x54d03a['scrollHeight']) || 0x0),
    _0x32d06a = Math['max'](0x0, _0x5f5da3 - _0x212f85),
    _0x4a0487 = Math['min'](_0x32d06a, Math['max'](0x0, Number(_0x54d03a['scrollTop']) || 0x0)),
    _0x842eba = Number(_0x226941?.['deltaMode']) || 0x0,
    _0x1a7255 = _0x842eba === 0x1 ? 0x10 : _0x842eba === 0x2 ? Math['max'](_0x212f85, 0x1) : 0x1,
    _0x4af714 = Math['min'](_0x32d06a, Math['max'](0x0, _0x4a0487 + _0x484f8a * _0x1a7255));
  if (_0x4af714 === _0x4a0487) return ![];
  return ((_0x54d03a['scrollTop'] = _0x4af714), !![]);
}
export function handleCustomProviderResultWheel(_0x4b2045, _0x1cb4e1) {
  const _0x1ff415 = _0x4b2045?.['target']?.['closest']?.('[data-custom-provider-result]');
  if (!_0x1ff415 || !_0x1cb4e1?.['contains']?.(_0x1ff415)) return ![];
  if (_0x4b2045['target']?.['closest']?.('.custom-provider-model-options')) return ![];
  const _0x406f79 = _0x1ff415['querySelector']?.('.custom-provider-model-options');
  if (!scrollCustomProviderModelListFromWheel(_0x406f79, _0x4b2045)) return ![];
  return (_0x4b2045['preventDefault']?.(), !![]);
}
export function captureCustomProviderModelSelectionScroll(_0x44f6b8) {
  const _0x2931b5 = _0x44f6b8?.['querySelector']?.('.custom-provider-model-options');
  return {
    resultScrollTop: Math['max'](0x0, Number(_0x44f6b8?.['scrollTop']) || 0x0),
    modelListScrollTop: Math['max'](0x0, Number(_0x2931b5?.['scrollTop']) || 0x0),
  };
}
export function restoreCustomProviderModelSelectionScroll(_0x5c04bf, _0x5248e5 = {}) {
  if (!_0x5c04bf) return ![];
  const _0x546fdc = _0x5c04bf['querySelector']?.('.custom-provider-model-options');
  return (
    (_0x5c04bf['scrollTop'] = Math['max'](0x0, Number(_0x5248e5['resultScrollTop']) || 0x0)),
    _0x546fdc && (_0x546fdc['scrollTop'] = Math['max'](0x0, Number(_0x5248e5['modelListScrollTop']) || 0x0)),
    !!_0x546fdc
  );
}
const CUSTOM_PROVIDER_EDITOR_STABLE_HEIGHT_PROPERTY = '--custom-provider-editor-stable-height';
export function stabilizeCustomProviderEditorListHeight(_0xc50bb8) {
  if (!_0xc50bb8) return 0x0;
  const _0x2f80d8 = Number(_0xc50bb8['getBoundingClientRect']?.()['height']),
    _0x5cfa79 = Number['isFinite'](_0x2f80d8)
      ? Math['max'](0x0, _0x2f80d8)
      : Math['max'](0x0, Number(_0xc50bb8['offsetHeight']) || 0x0),
    _0x33b059 = Math['max'](0x0, Number(_0xc50bb8['dataset']?.['customProviderStableHeight']) || 0x0),
    _0x528945 = Math['ceil'](Math['max'](_0x5cfa79, _0x33b059));
  if (!_0x528945) return 0x0;
  return (
    _0xc50bb8['dataset'] && (_0xc50bb8['dataset']['customProviderStableHeight'] = String(_0x528945)),
    _0xc50bb8['style']?.['setProperty']?.(CUSTOM_PROVIDER_EDITOR_STABLE_HEIGHT_PROPERTY, _0x528945 + 'px'),
    _0x528945
  );
}
function getCustomProviderManifestUpstreamModelId(_0x16e1e2 = {}) {
  const _0x2bd2cd = _0x16e1e2?.['extensions']?.['customProvider'] || {},
    _0x3e09f6 = String(_0x16e1e2?.['modelId'] || '')['trim']();
  return String(
    _0x2bd2cd['upstreamModelId'] || _0x16e1e2['displayName'] || _0x3e09f6['split']('/')['pop']() || '',
  )['trim']();
}
function getCustomProviderModelCapabilityStatus(_0x69024b = {}) {
  return String(
    _0x69024b?.['capabilityStatus'] ||
      _0x69024b?.['extensions']?.['customProvider']?.['capability']?.['status'] ||
      'unverified',
  )
    ['trim']()
    ['toLowerCase']();
}
export function isCustomProviderModelCapabilityRecognized(_0x11b4e4 = {}) {
  return ['documented', 'verified']['includes'](getCustomProviderModelCapabilityStatus(_0x11b4e4));
}
export function getCustomProviderModelsNeedingVerification(_0x37d269 = []) {
  return (Array['isArray'](_0x37d269) ? _0x37d269 : [])['filter'](
    (_0x3f2df2) => !isCustomProviderModelCapabilityRecognized(_0x3f2df2),
  );
}
export function getCustomProviderModelsBlockingSave(_0x147c8e = []) {
  const _0x4a4a02 = Array['isArray'](_0x147c8e) ? _0x147c8e : [];
  if (_0x4a4a02['length'] > 0x0 && _0x4a4a02['every']((_0x3df2fe) => _0x3df2fe?.['kind'] === 'text'))
    return [];
  return getCustomProviderModelsNeedingVerification(_0x4a4a02);
}
export function getCustomProviderSaveStatus(_0x4f5ea7 = []) {
  const _0x347ea5 = Array['isArray'](_0x4f5ea7) ? _0x4f5ea7 : [],
    _0x4f9307 = getCustomProviderModelsNeedingVerification(_0x347ea5)['length'];
  return {
    key: _0x4f9307 > 0x0 ? 'savedWithUnverified' : 'saved',
    count: _0x347ea5['length'],
    unverified: _0x4f9307,
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
export function mergeCustomProviderDiscoveryCapabilities(_0x876d15 = {}, _0x12f9ab = {}, _0x3cbe06 = !![]) {
  const _0x36a559 = new Map(
      (Array['isArray'](_0x12f9ab?.['models']) ? _0x12f9ab['models'] : [])
        ['map']((_0xdcad1b) => {
          const _0x532ffe = _0xdcad1b?.['extensions']?.['customProvider']?.['capability'] || {},
            _0x441606 = isCustomProviderModelCapabilityRecognized(_0xdcad1b);
          return [
            getCustomProviderManifestUpstreamModelId(_0xdcad1b),
            {
              ...(_0x3cbe06 ? { isSaved: !![] } : {}),
              ...(_0x441606
                ? {
                    capabilitySource: String(_0x532ffe['source'] || 'stored-bundle')['trim'](),
                    capabilityStatus: getCustomProviderModelCapabilityStatus(_0xdcad1b),
                  }
                : {}),
            },
          ];
        })
        ['filter'](([_0x119932]) => _0x119932),
    ),
    _0x174eb6 = (_0x1a072e) =>
      (Array['isArray'](_0x1a072e) ? _0x1a072e : [])['map']((_0x8f33c7) => {
        const _0x1df221 = _0x36a559['get'](String(_0x8f33c7?.['upstreamModelId'] || '')['trim']());
        return _0x1df221 ? { ..._0x8f33c7, ..._0x1df221 } : _0x8f33c7;
      });
  return {
    ..._0x876d15,
    models: _0x174eb6(_0x876d15?.['models']),
    unknown: _0x174eb6(_0x876d15?.['unknown']),
  };
}
export function mergeCustomProviderRecognizedProfiles(_0x1eae54 = {}, _0x3f3a39 = {}) {
  const _0x13e212 = (_0x162364, _0x56530b) => {
      const _0x92520e =
          _0x162364?.['extensions'] && typeof _0x162364['extensions'] === 'object'
            ? _0x162364['extensions']
            : {},
        _0x476743 =
          _0x56530b?.['extensions'] && typeof _0x56530b['extensions'] === 'object'
            ? _0x56530b['extensions']
            : {},
        _0x2bf537 =
          _0x92520e['customProvider'] && typeof _0x92520e['customProvider'] === 'object'
            ? _0x92520e['customProvider']
            : {},
        _0x15eb22 =
          _0x476743['customProvider'] && typeof _0x476743['customProvider'] === 'object'
            ? _0x476743['customProvider']
            : {},
        _0xd1f7d8 = {
          ..._0x92520e,
          ..._0x476743,
          customProvider: {
            ..._0x15eb22,
            ..._0x2bf537,
            capability: _0x15eb22['capability'] || _0x2bf537['capability'],
          },
        };
      return (
        ['textMenu', 'imageMenu', 'videoMenu', 'audioMenu']['forEach']((_0x580455) => {
          const _0x8e9c2f = _0x92520e[_0x580455];
          if (!_0x8e9c2f || typeof _0x8e9c2f !== 'object') return;
          const _0x103f5b = _0x476743[_0x580455];
          _0xd1f7d8[_0x580455] = {
            ...(_0x103f5b && typeof _0x103f5b === 'object' ? _0x103f5b : {}),
            ..._0x8e9c2f,
          };
        }),
        { ..._0x56530b, extensions: _0xd1f7d8 }
      );
    },
    _0x304493 = new Map(
      (Array['isArray'](_0x3f3a39?.['models']) ? _0x3f3a39['models'] : [])
        ['filter'](isCustomProviderModelCapabilityRecognized)
        ['map']((_0x1073c0) => [getCustomProviderManifestUpstreamModelId(_0x1073c0), _0x1073c0])
        ['filter'](([_0x3d4f42]) => _0x3d4f42),
    ),
    _0x508b76 = new Map(
      (Array['isArray'](_0x3f3a39?.['executions']) ? _0x3f3a39['executions'] : [])
        ['map']((_0xb20a7) => [String(_0xb20a7?.['id'] || '')['trim'](), _0xb20a7])
        ['filter'](([_0x5612c6]) => _0x5612c6),
    ),
    _0x29173f = new Map(
      (Array['isArray'](_0x1eae54?.['executions']) ? _0x1eae54['executions'] : [])
        ['map']((_0x4fa531) => [String(_0x4fa531?.['id'] || '')['trim'](), _0x4fa531])
        ['filter'](([_0x25fa91]) => _0x25fa91),
    ),
    _0x4116d9 = new Set(),
    _0x2a6e06 = (Array['isArray'](_0x1eae54?.['models']) ? _0x1eae54['models'] : [])['map']((_0x5306b4) => {
      const _0x391ac6 = _0x304493['get'](getCustomProviderManifestUpstreamModelId(_0x5306b4));
      if (!_0x391ac6 || _0x391ac6['kind'] !== _0x5306b4['kind']) return _0x5306b4;
      return (
        _0x4116d9['add'](String(_0x391ac6['executionId'] || '')['trim']()),
        _0x13e212(_0x5306b4, _0x391ac6)
      );
    }),
    _0xb08396 = new Set(),
    _0x44d6d0 = _0x2a6e06['flatMap']((_0x37e110) => {
      const _0x46a503 = String(_0x37e110?.['executionId'] || '')['trim']();
      if (!_0x46a503 || _0xb08396['has'](_0x46a503)) return [];
      _0xb08396['add'](_0x46a503);
      const _0x9d5e5c = _0x4116d9['has'](_0x46a503)
        ? _0x508b76['get'](_0x46a503) || _0x29173f['get'](_0x46a503)
        : _0x29173f['get'](_0x46a503) || _0x508b76['get'](_0x46a503);
      return _0x9d5e5c ? [_0x9d5e5c] : [];
    });
  return { ..._0x1eae54, models: _0x2a6e06, executions: _0x44d6d0 };
}
export function resolveCustomProviderDocumentationFailureKey(_0x4a046d = {}) {
  const _0x34ef1b = (
    Array['isArray'](_0x4a046d?.['agentModelResults']) ? _0x4a046d['agentModelResults'] : []
  )['map']((_0x2f7c64) =>
    String(_0x2f7c64?.['status'] || '')
      ['trim']()
      ['toLowerCase'](),
  );
  if (_0x34ef1b['includes']('inaccessible')) return 'documentationAgentInaccessible';
  if (_0x34ef1b['includes']('unsupported_lifecycle')) return 'documentationAsyncLifecycleUnsupported';
  if (_0x34ef1b['includes']('not_found')) return 'documentationSelectedModelNotFound';
  return 'documentationNoMatchingProfile';
}
export function getRememberedCustomProviderConfigs(_0x4dc5c = {}) {
  return Object['entries'](_0x4dc5c && typeof _0x4dc5c === 'object' ? _0x4dc5c : {})
    ['filter'](([_0x580907, _0x1ba6fd]) => {
      if (!String(_0x580907 || '')['startsWith']('custom_')) return ![];
      if (!_0x1ba6fd || typeof _0x1ba6fd !== 'object' || Array['isArray'](_0x1ba6fd)) return ![];
      return !!(String(_0x1ba6fd['apiUrl'] || '')['trim']() && String(_0x1ba6fd['apiKey'] || '')['trim']());
    })
    ['map'](([_0x24bc44, _0x4f5d2d]) => ({
      providerId: String(_0x24bc44)['trim'](),
      baseUrl: String(_0x4f5d2d['apiUrl'] || '')['trim'](),
      apiKey: String(_0x4f5d2d['apiKey'] || '')['trim'](),
      name: String(_0x4f5d2d['label'] || _0x24bc44)['trim'](),
      documentationUrl: String(_0x4f5d2d['documentationUrl'] || '')['trim'](),
    }));
}
