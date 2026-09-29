import { bindAIGenTextModelSelector } from '../../components/aigenText/modelSelector.js';
import { bindAIGenTextRuntimeParameterControls } from '../../components/aigenText/runtimeModelParameterControls.js';
import { buildModelGenerationParamsSelectionPatch } from '../modelGenerationParamMemory.js';
export function commitAgentModelSelection(_0x4ed514, _0x5c8b37 = {}) {
  const _0x42f50c = String(_0x5c8b37['model'] || _0x5c8b37['modelId'] || '')['trim'](),
    _0x40e046 = String(_0x5c8b37['provider'] || '')['trim']();
  if (!_0x42f50c) return null;
  const _0x2161d3 = String(_0x5c8b37['providerProfileId'] || '')['trim'](),
    _0x88490 =
      _0x5c8b37['providerProfileIdByModel'] && typeof _0x5c8b37['providerProfileIdByModel'] === 'object'
        ? _0x5c8b37['providerProfileIdByModel']
        : {},
    _0x38aa41 = _0x4ed514?.['getSettings']?.() || {},
    _0x12fc7f = {
      model: _0x42f50c,
      provider: _0x40e046,
      providerProfileId: _0x2161d3,
      providerProfileIdByModel: _0x88490,
      ...(typeof _0x4ed514?.['getSettings'] === 'function'
        ? buildModelGenerationParamsSelectionPatch(_0x38aa41, _0x42f50c)
        : {}),
    };
  return _0x4ed514?.['updateSettings']?.(_0x12fc7f) || { ..._0x38aa41, ..._0x12fc7f };
}
export function bindAgentModelControls(
  _0x40e600,
  {
    modelSettings: _0x5b34f6,
    initialSettings: initialSettings = {},
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  const _0x12f56a = () => _0x5b34f6?.['getSettings']?.() || initialSettings;
  let _0x1369de = null;
  const _0x10f19d = bindAIGenTextModelSelector(_0x40e600, {
    modelId: initialSettings['model'],
    provider: initialSettings['provider'],
    providerProfileId: initialSettings['providerProfileId'],
    providerProfileIdByModel: initialSettings['providerProfileIdByModel'],
    documentObject: documentObject,
    onChange: (_0x43060c) => {
      const _0x575522 = commitAgentModelSelection(_0x5b34f6, _0x43060c);
      return (_0x1369de?.['setModel']?.(_0x575522?.['model']), _0x575522);
    },
  });
  return (
    (_0x1369de = bindAIGenTextRuntimeParameterControls(_0x40e600, {
      modelId: initialSettings['model'],
      getState: _0x12f56a,
      onChange: (_0x1a7ba9) => _0x5b34f6?.['updateSettings']?.(_0x1a7ba9) || { ..._0x12f56a(), ..._0x1a7ba9 },
    })),
    {
      sync(_0x2519fd = _0x12f56a()) {
        (_0x10f19d?.['setSelection']?.({
          modelId: _0x2519fd['model'],
          provider: _0x2519fd['provider'],
          providerProfileId: _0x2519fd['providerProfileId'],
          providerProfileIdByModel: _0x2519fd['providerProfileIdByModel'],
        }),
          _0x1369de?.['sync']?.(_0x2519fd));
      },
      destroy() {
        (_0x10f19d?.['destroy']?.(), _0x1369de?.['destroy']?.());
      },
    }
  );
}
