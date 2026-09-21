import { getModelProvider } from '../config/modelConfig.js';
import { normalizeProviderId, resolveModelExecution, resolveModelProvider } from '../manifests/index.js';
const RUNNINGHUB_TASK_PROVIDERS = new Set(['runninghub', 'runninghubwf']);
function addProviderId(_0x2d452e, _0x4a24fe) {
  const _0xa425f9 = normalizeProviderId(_0x4a24fe);
  if (_0xa425f9) _0x2d452e.add(_0xa425f9);
}
export function resolveImageTaskExecution(_0x405e62, _0x2d8cf8 = '') {
  const _0x4fd670 = normalizeProviderId(_0x2d8cf8);
  return resolveModelExecution(_0x405e62, { providerHint: _0x4fd670 }) || resolveModelExecution(_0x405e62);
}
export function getImageTaskProviderIds(_0x2517f2, _0x3e08b9 = '') {
  const _0x1c8c45 = new Set();
  (addProviderId(_0x1c8c45, _0x3e08b9),
    addProviderId(_0x1c8c45, resolveModelProvider(_0x2517f2, _0x3e08b9, { allowPrefixInference: false })));
  const _0x21f00e = resolveImageTaskExecution(_0x2517f2, _0x3e08b9);
  return (
    addProviderId(_0x1c8c45, _0x21f00e?.modelManifest?.provider),
    addProviderId(_0x1c8c45, _0x21f00e?.executionManifest?.provider),
    _0x1c8c45
  );
}
export function resolveImageTaskProvider(_0x2db834, _0x4362a1 = '', _0x3b97fe = 'grsai') {
  const _0x4b7b44 = normalizeProviderId(_0x4362a1);
  if (_0x4b7b44) return _0x4b7b44;
  const _0x3d98e3 = resolveModelProvider(_0x2db834, '', {
    allowProviderHint: false,
    allowPrefixInference: false,
  });
  if (_0x3d98e3) return _0x3d98e3;
  return (
    normalizeProviderId(getModelProvider(String(_0x2db834 || '').trim())) || normalizeProviderId(_0x3b97fe)
  );
}
export function isRunningHubImageTaskModel(_0x470855, _0x282ee4 = '') {
  const _0x51b174 = getImageTaskProviderIds(_0x470855, _0x282ee4);
  return [..._0x51b174].some((_0x74ea7) => RUNNINGHUB_TASK_PROVIDERS.has(_0x74ea7));
}
export function isDreaminaImageTaskModel(_0x4b9fc1, _0x3a2021 = '') {
  return getImageTaskProviderIds(_0x4b9fc1, _0x3a2021).has('dreamina');
}
export function isRunningHubModelApiImageTask(_0x3943cb, _0x35a4c0 = '') {
  const _0x43b872 = getImageTaskProviderIds(_0x3943cb, _0x35a4c0);
  if (!_0x43b872.has('runninghub')) return false;
  const _0xd4ce8 = resolveImageTaskExecution(_0x3943cb, _0x35a4c0);
  return (
    _0xd4ce8?.modelManifest?.adapterType === 'modelApi' &&
    _0xd4ce8?.executionManifest?.adapterType === 'modelApi'
  );
}
export function shouldUseRunningHubOpenapiQuery(_0xdc8b80, _0x52e746 = '') {
  if (!isRunningHubImageTaskModel(_0xdc8b80, _0x52e746)) return false;
  if (isRunningHubModelApiImageTask(_0xdc8b80, _0x52e746)) return true;
  const _0x139b6b = resolveImageTaskExecution(_0xdc8b80, _0x52e746)?.executionManifest;
  return _0x139b6b?.queryMode === 'openapi-v2-query' || _0x139b6b?.submitMode === 'openapi-v2-ai-app';
}
