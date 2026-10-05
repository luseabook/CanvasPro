import { request } from './apiBase.js';
import { getProviderConfig } from './configApi.js';
import { buildRunningHubPriceRequest } from './adapters/runningHubPriceRequest.js';
import { buildRunningHubCatalogRequest } from './adapters/RunningHubAudioModelApiAdapter.js';
import { buildRunningHubAudioBody } from './adapters/runningHubAudioBody.js';
import { sanitizeModelUiSchemaParams } from '../src/manifests/index.js';
import {
  resolveRunningHubModelApiProfileId,
  getRunningHubProviderProfileId,
  resolveRunningHubModelApiBaseUrl,
} from '../src/modules/runningHubProviderProfiles.js';
const credentials = new Map();
let nextScope = 0;
export function resolveRunningHubPricingContext(value, item, args, handler = getProviderConfig) {
  const { modelManifest: modelManifest, executionManifest: executionManifest } = item;
  if (
    modelManifest['kind'] === 'text' ||
    executionManifest['extensions']?.['resolverOwnsInputs'] ||
    executionManifest['extensions']?.['inputResolutionMode'] === 'resolverOwned'
  )
    return null;
  args = sanitizeModelUiSchemaParams(modelManifest['modelId'], args, { includeDefaults: !![] });
  const runningHubModelApiProfileId = resolveRunningHubModelApiProfileId(
      modelManifest['modelId'],
      getRunningHubProviderProfileId(value),
    ),
    key = handler(runningHubModelApiProfileId),
    index = String(key['modelApiKey'] || key['apiKey'] || '')['trim']();
  if (credentials['get'](runningHubModelApiProfileId)?.['apiKey'] !== index)
    credentials['set'](runningHubModelApiProfileId, { apiKey: index, scope: ++nextScope });
  const runningHubModelApiBaseUrl = resolveRunningHubModelApiBaseUrl(runningHubModelApiProfileId),
    result = {
      ...args,
      model: modelManifest['modelId'],
      provider: modelManifest['provider'],
      providerProfileId: runningHubModelApiProfileId,
      generationParams: args,
      prompt: String(value['prompt'] || ''),
    };
  return {
    provider: modelManifest['provider'],
    baseUrl: runningHubModelApiBaseUrl,
    model: modelManifest['modelId'],
    kind: modelManifest['kind'],
    label: modelManifest['displayName'],
    params: result,
    resolved: item,
    apiKey: index,
    persist: ![],
    debounceMs: 350,
    key:
      'runninghub|' +
      runningHubModelApiBaseUrl +
      '|' +
      credentials['get'](runningHubModelApiProfileId)['scope'] +
      '|' +
      JSON['stringify'](result),
  };
}
export async function fetchRunningHubPricing(enabled) {
  if (!enabled['apiKey']) throw new Error('请配置当前线路的 RunningHub 模型 API Key');
  const data = enabled['params'],
    options = enabled['resolved']['executionManifest'],
    target = {
      getProviderConfig: () => ({
        apiUrl: enabled['baseUrl'],
        modelApiKey: enabled['apiKey'],
        apiKey: enabled['apiKey'],
      }),
    },
    enabled2 =
      options['extensions']?.['modelType'] && enabled['kind'] === 'audio'
        ? {
            body: {
              apiUrl: enabled['baseUrl'] + '/openapi/v2/' + options['model'],
              ...buildRunningHubAudioBody({
                modelType: options['extensions']['modelType'],
                prompt: data['prompt'],
                params: sanitizeModelUiSchemaParams(enabled['model'], data['generationParams'], {
                  includeDefaults: !![],
                }),
              }),
            },
          }
        : options['extensions']?.['audioModelApi']
          ? await buildRunningHubCatalogRequest(data, data['prompt'], enabled['resolved'], target)
          : await buildRunningHubPriceRequest(enabled);
  if (!enabled2 || enabled2['meta']?.['preparations']?.['length']) throw new Error('参考价暂不可用');
  const { apiUrl: apiUrl, apiKey: apiKey, ...args2 } = enabled2['body'],
    uRL = new URL(apiUrl);
  if (
    uRL['origin'] !== new URL(enabled['baseUrl'])['origin'] ||
    !uRL['pathname']['startsWith']('/openapi/v2/')
  )
    throw new Error('参考价暂不可用');
  uRL['pathname'] = uRL['pathname']['replace']('/openapi/v2/', '/openapi/v2/price-preview/');
  const request2 = await request(
      '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(uRL['href']),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + enabled['apiKey'] },
        body: JSON['stringify'](args2),
      },
      12000,
    ),
    source = request2['data'];
  if (!request2['success'])
    throw new Error(
      '参考价请求失败' + (request2['status'] ? '（HTTP ' + request2['status'] + '）' : '，请检查网络连接'),
    );
  if (source?.['errorCode'] === '1014')
    throw new Error('当前线路的 Key 不支持模型 API，请在设置中配置企业级共享 Key');
  if (source?.['errorCode'])
    throw new Error(
      '厂商无法按当前参数报价（' +
        String(source['errorCode'])
          ['replace'](/[^\w-]/g, '')
          ['slice'](0, 30) +
        '）',
    );
  if (
    typeof source?.['estimatedPrice'] !== 'number' ||
    !Number['isFinite'](source['estimatedPrice']) ||
    source['estimatedPrice'] < 0 ||
    !/^[A-Z]{3}$/['test'](source['currency'] || '')
  )
    throw new Error('参考价暂不可用');
  return {
    estimatedPrice: source['estimatedPrice'],
    currency: source['currency'],
    isFreeThisCall: source['isFreeThisCall'] === !![],
    excludesReferenceUsage:
      enabled['hasReferences'] === !![] || (enabled['references'] || [])['length'] > 0,
    referenceBasis:
      enabled['kind'] === 'image' &&
      (enabled['hasReferences'] || (enabled['references'] || [])['length'] > 0)
        ? 'textToImage'
        : 'parameters',
  };
}
