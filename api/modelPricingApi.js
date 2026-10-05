import { request } from './apiBase.js';
import { resolveModelExecution } from '../src/manifests/modelRegistry.js';
import { resolveExecutionModelToken } from './adapters/ModelApiManifestNormalizer.js';
import { getProviderConfig } from './configApi.js';
import { resolveRunningHubPricingContext, fetchRunningHubPricing } from './runningHubPricingApi.js';
import { resolveBinghuoPricingContext, fetchBinghuoPricing } from './binghuoPricingApi.js';
export const MODEL_PRICE_TTL = 30 * 60 * 1000;
const STORAGE_KEY = 'aicanvas.model-pricing.v1',
  MAX_ENTRIES = 160;
export function resolveModelPricingContext(args = {}) {
  const modelExecution = resolveModelExecution(args['audioWorkflowKey'] || args['model'] || args['modelId'], {
      provider: args['provider'],
    }),
    enabled = modelExecution?.['modelManifest'],
    value = modelExecution?.['executionManifest'];
  if (!enabled || value?.['adapterType'] !== 'modelApi') return null;
  const args2 = {};
  for (const item of enabled['uiSchema']?.['fields'] || []) {
    args2[item['id']] = args['generationParams']?.[item['id']] ?? args[item['id']] ?? item['defaultValue'];
  }
  Object['assign'](args2, args['generationParams'] || {});
  if (value['provider'] === 'runninghub') return resolveRunningHubPricingContext(args, modelExecution, args2);
  if (value['provider'] === 'binghuo') return resolveBinghuoPricingContext(args, modelExecution, args2);
  if (value['provider'] !== 'apimart') return null;
  const key = { ...args, ...args2, generationParams: args2 },
    executionModelToken = resolveExecutionModelToken(value, key),
    providerConfig = getProviderConfig(value['provider'])
      ['apiUrl']['replace'](/\/+$/, '')
      ['replace'](/\/v1$/, '');
  return {
    provider: value['provider'],
    baseUrl: providerConfig,
    model: executionModelToken,
    kind: enabled['kind'],
    label: enabled['displayName'],
    params: key,
    key: value['provider'] + '|' + providerConfig + '|' + executionModelToken,
  };
}
export async function fetchModelPricing(index) {
  if (index['provider'] === 'runninghub') return fetchRunningHubPricing(index);
  if (index['provider'] === 'binghuo') return fetchBinghuoPricing(index);
  const result = index['baseUrl'] + '/api/pricing/model?model=' + encodeURIComponent(index['model']),
    response = await request(
      '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(result),
      { method: 'GET' },
      12000,
    );
  if (!response['success'] || response['data']?.['success'] !== true || !response['data']?.['data'])
    throw new Error('价格暂不可用');
  return response['data']['data'];
}
export function createModelPricingCache({
  fetchPrice: fetchPrice = fetchModelPricing,
  now: now = Date['now'],
  storage: storage = () => globalThis['localStorage'],
} = {}) {
  const map = new Map(),
    map2 = new Map(),
    data = new Map();
  let options = false;
  const run = () => {
      if (options) return;
      options = true;
      try {
        const target = JSON['parse'](storage()?.['getItem'](STORAGE_KEY) || '[]');
        for (const [source, next] of target['slice'](-MAX_ENTRIES)) {
          if (
            typeof source === 'string' &&
            next?.['data'] &&
            Number['isFinite'](next['fetchedAt']) &&
            next['fetchedAt'] <= now() &&
            now() - next['fetchedAt'] < 7 * 86400000
          )
            map['set'](source, next);
        }
      } catch {}
    },
    handler = (current) => {
      return (run(), map['get'](current['key']) || null);
    },
    handler2 = (enabled2) =>
      !enabled2 ||
      now() - enabled2['fetchedAt'] >= MODEL_PRICE_TTL ||
      (Number(enabled2['data']?.['pricing']?.['time_pricing']?.['next_switch_at']) * 1000 >
        enabled2['fetchedAt'] &&
        now() >= Number(enabled2['data']['pricing']['time_pricing']['next_switch_at']) * 1000),
    entry = (event) => {
      const record = handler(event);
      if (!handler2(record)) return Promise['resolve'](record);
      if (map2['has'](event['key'])) return map2['get'](event['key']);
      const payload = data['get'](event['key']);
      if (payload && now() - payload['at'] < 60000)
        return record ? Promise['resolve'](record) : Promise['reject'](payload['error']);
      const handle = Promise['resolve']()
        ['then'](() => fetchPrice(event))
        ['then']((state) => {
          const config = { data: state, fetchedAt: now(), persist: event['persist'] !== false };
          (map['delete'](event['key']), map['set'](event['key'], config));
          while (map['size'] > MAX_ENTRIES) map['delete'](map['keys']()['next']()['value']);
          data['delete'](event['key']);
          try {
            storage()?.['setItem'](
              STORAGE_KEY,
              JSON['stringify']([...map]['filter'](([, scope]) => scope['persist'] !== false)),
            );
          } catch {}
          return config;
        })
        ['catch']((input) => {
          data['set'](event['key'], { at: now(), error: input });
          throw input;
        })
        ['finally'](() => map2['delete'](event['key']));
      return (map2['set'](event['key'], handle), handle);
    };
  return { peek: handler, ensure: entry, stale: handler2 };
}
export const modelPricingCache = createModelPricingCache();
