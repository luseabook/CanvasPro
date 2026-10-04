import { request } from './apiBase.js';
import { getProviderConfig } from './configApi.js';
import { resolveExecutionModelToken } from './adapters/ModelApiManifestNormalizer.js';
let credential = '',
  scope = 0x0;
const catalogs = new Map(),
  TTL = 0x1e * 0x3c * 0x3e8;
export function resolveBinghuoPricingContext(args, kind, generationParams, handler = getProviderConfig) {
  const value = handler('binghuo'),
    apiKey = String(value['apiKey'] || '')['trim']();
  credential !== apiKey && ((credential = apiKey), scope++, catalogs['clear']());
  const baseUrl = value['apiUrl']['replace'](/\/+$/, '')['replace'](/\/v1$/, ''),
    params = { ...args, ...generationParams, generationParams: generationParams },
    model = resolveExecutionModelToken(kind['executionManifest'], params),
    catalogKey = baseUrl + '|' + scope;
  return {
    provider: 'binghuo',
    baseUrl: baseUrl,
    apiKey: apiKey,
    model: model,
    catalogKey: catalogKey,
    kind: kind['modelManifest']['kind'],
    label: kind['modelManifest']['displayName'],
    params: params,
    persist: ![],
    key: 'binghuo|' + catalogKey + '|' + model,
  };
}
export function parseBinghuoPriceCatalog(response) {
  if (
    response?.['ok'] !== !![] ||
    typeof response['catalog_version'] !== 'string' ||
    !response['catalog_version']['trim']() ||
    !Array['isArray'](response['models']) ||
    response['count'] !== response['models']['length'] ||
    response['models']['length'] > 0x7d0
  )
    throw new Error('BH 价格目录格式无效');
  const list = [];
  for (const enabled of response['models']) {
    if (!enabled || typeof enabled !== 'object') throw new Error('BH 价格目录格式无效');
    if (!('variants' in enabled)) {
      list['push'](enabled);
      continue;
    }
    const { variants: variants, family: family, ...args2 } = enabled;
    if (
      !Array['isArray'](variants) ||
      !variants['length'] ||
      variants['length'] > 0x7d0 ||
      typeof family !== 'string' ||
      !family['trim']() ||
      args2['billing'] !== 'per_second' ||
      'price' in args2 ||
      'id' in args2
    )
      throw new Error('BH 分组价格格式无效');
    for (const enabled2 of variants) {
      if (
        !enabled2 ||
        typeof enabled2['resolution'] !== 'string' ||
        !enabled2['resolution'] ||
        ['price', 'billing', 'unit', 'kind', 'category', 'variants', 'family']['some'](
          (item) => item in enabled2,
        )
      )
        throw new Error('BH 分组价格格式无效');
      const { per_second: per_second, resolution: resolution, ...args3 } = enabled2;
      list['push']({
        ...args2,
        ...args3,
        price: { per_second: per_second },
        resolutions: [resolution],
      });
    }
  }
  if (list['length'] > 0x7d0) throw new Error('BH\x20价格目录过大');
  const map = new Set();
  for (const enabled3 of list) {
    if (
      typeof enabled3['id'] !== 'string' ||
      !enabled3['id']['trim']() ||
      enabled3['id'] !== enabled3['id']['trim']() ||
      map['has'](enabled3['id'])
    )
      throw new Error('BH 价格目录型号无效或重复');
    map['add'](enabled3['id']);
  }
  return list;
}
export function selectBinghuoPrice(list2, key) {
  const billing = list2['find']((index) => index['id'] === key['model']);
  if (
    !billing ||
    !['active', 'new']['includes'](billing['status']) ||
    billing['unit'] !== 'CNY' ||
    (billing['kind'] && billing['kind'] !== key['kind']) ||
    (billing['category'] && billing['category'] !== key['kind']) ||
    Object['keys'](billing)['some'](
      (result) =>
        !['price', 'billing']['includes'](result) &&
        /price|billing|multiplier|surcharge|tier/i['test'](result),
    )
  )
    throw new Error('BH\x20当前型号价格暂不可用');
  const data = billing['price'],
    list3 = data && typeof data === 'object' ? Object['keys'](data) : [],
    amount =
      list3['length'] === 0x1 && list3[0x0] === 'amount'
        ? data['amount']
        : list3['length'] === 0x1 && list3[0x0] === 'per_second' && billing['billing'] === 'per_second'
          ? data['per_second']
          : null,
    list4 = key['kind'] === 'image' ? ['per_call', 'per_image'] : ['per_call', 'per_second'];
  if (
    !list4['includes'](billing['billing']) ||
    typeof amount !== 'number' ||
    !Number['isFinite'](amount) ||
    amount < 0x0 ||
    amount > 0xf4240
  )
    throw new Error('BH\x20计费规则暂不支持');
  return { amount: amount, billing: billing['billing'], currency: 'CNY' };
}
export async function fetchBinghuoPricing(enabled4) {
  if (!enabled4['apiKey']) throw new Error('BH 调用凭据暂不可用');
  const options = enabled4['catalogKey'];
  let enabled5 = catalogs['get'](options);
  if (!enabled5 || Date['now']() - enabled5['at'] >= TTL) {
    const target = enabled4['baseUrl'] + '/v1/models/catalog',
      promise = request(
        '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(target),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + enabled4['apiKey'] },
        },
        0x2ee0,
      )['then']((response2) => {
        if (!response2['success']) throw new Error('BH 价格查询失败');
        return parseBinghuoPriceCatalog(response2['data']);
      });
    ((enabled5 = { at: Date['now'](), promise: promise }),
      catalogs['set'](options, enabled5),
      promise['catch'](() => {
        if (catalogs['get'](options) === enabled5) enabled5['at'] = Date['now']() - TTL + 0xea60;
      }));
  }
  return selectBinghuoPrice(await enabled5['promise'], enabled4);
}
