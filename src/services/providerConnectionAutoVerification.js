import { getApiConfigSnapshot, getProviderConfig, saveApiConfigToServer } from '../../api/configApi.js';
import { testProviderConnection } from '../../api/providerConnectionTestApi.js';
import {
  mergeCurrentProviderConnectionResults,
  shouldPersistProviderConnectionResult,
} from './providerConnectionVerification.js';
const AUTO_VERIFICATION_REQUESTS = new Map();
function normalizeText(value) {
  return String(value || '')['trim']();
}
function getVerificationRequestKey(options = {}) {
  const text = normalizeText(options['configProviderId'] || options['providerId'])['toLowerCase'](),
    text2 = normalizeText(options['authorizationCapability'] || options['connectionCapability']);
  return text2 ? text + ':' + text2 : text;
}
function getProviderTestOptions(options2 = {}) {
  const target = normalizeText(options2['connectionCapability'])['toLowerCase']();
  if (
    normalizeText(options2['configProviderId'] || options2['providerId'])['toLowerCase']() === 'comfyui' &&
    ['local', 'cloud']['includes'](target)
  )
    return { target: target };
  const text3 = normalizeText(options2['authorizationCapability']);
  if (!text3) return {};
  return { probeCapabilities: [text3], requiredCapabilities: [text3] };
}
export function getProviderConnectionFailureDetail(options3 = {}) {
  return normalizeText(
    options3['suggestion'] ||
      options3['summary'] ||
      options3['error'] ||
      options3['detail'] ||
      'API\x20连接验证未通过',
  );
}
export async function verifyProviderConnectionOnce(options4 = {}, item = {}) {
  const run = item['getProviderConfig'] || getProviderConfig,
    handler = item['getApiConfigSnapshot'] || getApiConfigSnapshot,
    handler2 = item['testProviderConnection'] || testProviderConnection,
    handler3 = item['saveApiConfigToServer'] || saveApiConfigToServer,
    text4 = normalizeText(options4['configProviderId'] || options4['providerId'])['toLowerCase']();
  if (!text4) return { ok: ![], error: '无法确定需要验证的 API 服务' };
  const key = run(text4) || {},
    label = await handler2(text4, key, getProviderTestOptions(options4));
  if (!shouldPersistProviderConnectionResult(text4, label)) return label;
  const index = handler(),
    currentProviderConnectionResults = mergeCurrentProviderConnectionResults(
      index,
      { providers: { [text4]: key } },
      [text4],
      new Map(),
      {
        connectionCapabilities: {
          [text4]: normalizeText(options4['connectionCapability'])['toLowerCase'](),
        },
        providerResults: { [text4]: label },
      },
    );
  if (currentProviderConnectionResults['staleProviderIds']['length'] > 0x0)
    return {
      ok: ![],
      stale: !![],
      label: label?.['label'] || text4,
      error: '连接配置已变更，请重新验证',
    };
  return (await handler3(currentProviderConnectionResults['config']), label);
}
export function autoVerifyProviderConnection(options5 = {}) {
  const verificationRequestKey = getVerificationRequestKey(options5);
  if (!verificationRequestKey) return Promise['resolve']({ ok: ![], error: '无法确定需要验证的 API 服务' });
  const result = AUTO_VERIFICATION_REQUESTS['get'](verificationRequestKey);
  if (result) return result;
  const verifyProviderConnectionOnce2 = verifyProviderConnectionOnce(options5)['finally'](() => {
    AUTO_VERIFICATION_REQUESTS['get'](verificationRequestKey) === verifyProviderConnectionOnce2 &&
      AUTO_VERIFICATION_REQUESTS['delete'](verificationRequestKey);
  });
  return (
    AUTO_VERIFICATION_REQUESTS['set'](verificationRequestKey, verifyProviderConnectionOnce2),
    verifyProviderConnectionOnce2
  );
}
