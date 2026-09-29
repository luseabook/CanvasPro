import { getApiConfigSnapshot, getProviderConfig, saveApiConfigToServer } from '../../api/configApi.js';
import { testProviderConnection } from '../../api/providerConnectionTestApi.js';
import {
  mergeCurrentProviderConnectionResults,
  shouldPersistProviderConnectionResult,
} from './providerConnectionVerification.js';
const AUTO_VERIFICATION_REQUESTS = new Map();
function normalizeText(_0x1185ce) {
  return String(_0x1185ce || '')['trim']();
}
function getVerificationRequestKey(_0x592d14 = {}) {
  const _0x20bbda = normalizeText(_0x592d14['configProviderId'] || _0x592d14['providerId'])['toLowerCase'](),
    _0x3c1543 = normalizeText(_0x592d14['authorizationCapability'] || _0x592d14['connectionCapability']);
  return _0x3c1543 ? _0x20bbda + ':' + _0x3c1543 : _0x20bbda;
}
function getProviderTestOptions(_0x3a7155 = {}) {
  const _0x27289c = normalizeText(_0x3a7155['connectionCapability'])['toLowerCase']();
  if (
    normalizeText(_0x3a7155['configProviderId'] || _0x3a7155['providerId'])['toLowerCase']() === 'comfyui' &&
    ['local', 'cloud']['includes'](_0x27289c)
  )
    return { target: _0x27289c };
  const _0x546010 = normalizeText(_0x3a7155['authorizationCapability']);
  if (!_0x546010) return {};
  return { probeCapabilities: [_0x546010], requiredCapabilities: [_0x546010] };
}
export function getProviderConnectionFailureDetail(_0x1c2d09 = {}) {
  return normalizeText(
    _0x1c2d09['suggestion'] ||
      _0x1c2d09['summary'] ||
      _0x1c2d09['error'] ||
      _0x1c2d09['detail'] ||
      'API\x20连接验证未通过',
  );
}
export async function verifyProviderConnectionOnce(_0x495b05 = {}, _0x26a0e7 = {}) {
  const _0x3a0ace = _0x26a0e7['getProviderConfig'] || getProviderConfig,
    _0x264400 = _0x26a0e7['getApiConfigSnapshot'] || getApiConfigSnapshot,
    _0x6c4337 = _0x26a0e7['testProviderConnection'] || testProviderConnection,
    _0x3eb975 = _0x26a0e7['saveApiConfigToServer'] || saveApiConfigToServer,
    _0x4e5d61 = normalizeText(_0x495b05['configProviderId'] || _0x495b05['providerId'])['toLowerCase']();
  if (!_0x4e5d61) return { ok: ![], error: '无法确定需要验证的 API 服务' };
  const _0x118646 = _0x3a0ace(_0x4e5d61) || {},
    _0x5db9a6 = await _0x6c4337(_0x4e5d61, _0x118646, getProviderTestOptions(_0x495b05));
  if (!shouldPersistProviderConnectionResult(_0x4e5d61, _0x5db9a6)) return _0x5db9a6;
  const _0x5f38af = _0x264400(),
    _0x2c3dc2 = mergeCurrentProviderConnectionResults(
      _0x5f38af,
      { providers: { [_0x4e5d61]: _0x118646 } },
      [_0x4e5d61],
      new Map(),
      {
        connectionCapabilities: {
          [_0x4e5d61]: normalizeText(_0x495b05['connectionCapability'])['toLowerCase'](),
        },
        providerResults: { [_0x4e5d61]: _0x5db9a6 },
      },
    );
  if (_0x2c3dc2['staleProviderIds']['length'] > 0x0)
    return {
      ok: ![],
      stale: !![],
      label: _0x5db9a6?.['label'] || _0x4e5d61,
      error: '连接配置已变更，请重新验证',
    };
  return (await _0x3eb975(_0x2c3dc2['config']), _0x5db9a6);
}
export function autoVerifyProviderConnection(_0x38a05b = {}) {
  const _0x1de7a0 = getVerificationRequestKey(_0x38a05b);
  if (!_0x1de7a0) return Promise['resolve']({ ok: ![], error: '无法确定需要验证的 API 服务' });
  const _0x3596c7 = AUTO_VERIFICATION_REQUESTS['get'](_0x1de7a0);
  if (_0x3596c7) return _0x3596c7;
  const _0x58ed89 = verifyProviderConnectionOnce(_0x38a05b)['finally'](() => {
    AUTO_VERIFICATION_REQUESTS['get'](_0x1de7a0) === _0x58ed89 &&
      AUTO_VERIFICATION_REQUESTS['delete'](_0x1de7a0);
  });
  return (AUTO_VERIFICATION_REQUESTS['set'](_0x1de7a0, _0x58ed89), _0x58ed89);
}
