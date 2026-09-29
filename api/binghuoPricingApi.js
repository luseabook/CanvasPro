import { request } from './apiBase.js';
import { getProviderConfig } from './configApi.js';
import { resolveExecutionModelToken } from './adapters/ModelApiManifestNormalizer.js';
let credential = '',
  scope = 0x0;
const catalogs = new Map(),
  TTL = 0x1e * 0x3c * 0x3e8;
export function resolveBinghuoPricingContext(_0x375ee1, _0x232a06, _0x370c64, _0x3eb781 = getProviderConfig) {
  const _0xa59733 = _0x3eb781('binghuo'),
    _0x312aeb = String(_0xa59733['apiKey'] || '')['trim']();
  credential !== _0x312aeb && ((credential = _0x312aeb), scope++, catalogs['clear']());
  const _0x26a35a = _0xa59733['apiUrl']['replace'](/\/+$/, '')['replace'](/\/v1$/, ''),
    _0x431e12 = { ..._0x375ee1, ..._0x370c64, generationParams: _0x370c64 },
    _0x26f66c = resolveExecutionModelToken(_0x232a06['executionManifest'], _0x431e12),
    _0x204dcf = _0x26a35a + '|' + scope;
  return {
    provider: 'binghuo',
    baseUrl: _0x26a35a,
    apiKey: _0x312aeb,
    model: _0x26f66c,
    catalogKey: _0x204dcf,
    kind: _0x232a06['modelManifest']['kind'],
    label: _0x232a06['modelManifest']['displayName'],
    params: _0x431e12,
    persist: ![],
    key: 'binghuo|' + _0x204dcf + '|' + _0x26f66c,
  };
}
export function parseBinghuoPriceCatalog(_0x42421a) {
  if (
    _0x42421a?.['ok'] !== !![] ||
    typeof _0x42421a['catalog_version'] !== 'string' ||
    !_0x42421a['catalog_version']['trim']() ||
    !Array['isArray'](_0x42421a['models']) ||
    _0x42421a['count'] !== _0x42421a['models']['length'] ||
    _0x42421a['models']['length'] > 0x7d0
  )
    throw new Error('BH 价格目录格式无效');
  const _0x36eec2 = [];
  for (const _0xcc73dc of _0x42421a['models']) {
    if (!_0xcc73dc || typeof _0xcc73dc !== 'object') throw new Error('BH 价格目录格式无效');
    if (!('variants' in _0xcc73dc)) {
      _0x36eec2['push'](_0xcc73dc);
      continue;
    }
    const { variants: _0x1c0e61, family: _0x5232fa, ..._0x2ca6d3 } = _0xcc73dc;
    if (
      !Array['isArray'](_0x1c0e61) ||
      !_0x1c0e61['length'] ||
      _0x1c0e61['length'] > 0x7d0 ||
      typeof _0x5232fa !== 'string' ||
      !_0x5232fa['trim']() ||
      _0x2ca6d3['billing'] !== 'per_second' ||
      'price' in _0x2ca6d3 ||
      'id' in _0x2ca6d3
    )
      throw new Error('BH 分组价格格式无效');
    for (const _0x5a2cab of _0x1c0e61) {
      if (
        !_0x5a2cab ||
        typeof _0x5a2cab['resolution'] !== 'string' ||
        !_0x5a2cab['resolution'] ||
        ['price', 'billing', 'unit', 'kind', 'category', 'variants', 'family']['some'](
          (_0x226096) => _0x226096 in _0x5a2cab,
        )
      )
        throw new Error('BH 分组价格格式无效');
      const { per_second: _0x61ec14, resolution: _0x3e3509, ..._0x17a5aa } = _0x5a2cab;
      _0x36eec2['push']({
        ..._0x2ca6d3,
        ..._0x17a5aa,
        price: { per_second: _0x61ec14 },
        resolutions: [_0x3e3509],
      });
    }
  }
  if (_0x36eec2['length'] > 0x7d0) throw new Error('BH\x20价格目录过大');
  const _0x307bdb = new Set();
  for (const _0x5b4b7f of _0x36eec2) {
    if (
      typeof _0x5b4b7f['id'] !== 'string' ||
      !_0x5b4b7f['id']['trim']() ||
      _0x5b4b7f['id'] !== _0x5b4b7f['id']['trim']() ||
      _0x307bdb['has'](_0x5b4b7f['id'])
    )
      throw new Error('BH 价格目录型号无效或重复');
    _0x307bdb['add'](_0x5b4b7f['id']);
  }
  return _0x36eec2;
}
export function selectBinghuoPrice(_0x6b791a, _0x44a2f3) {
  const _0x7a6aa3 = _0x6b791a['find']((_0x2bf48c) => _0x2bf48c['id'] === _0x44a2f3['model']);
  if (
    !_0x7a6aa3 ||
    !['active', 'new']['includes'](_0x7a6aa3['status']) ||
    _0x7a6aa3['unit'] !== 'CNY' ||
    (_0x7a6aa3['kind'] && _0x7a6aa3['kind'] !== _0x44a2f3['kind']) ||
    (_0x7a6aa3['category'] && _0x7a6aa3['category'] !== _0x44a2f3['kind']) ||
    Object['keys'](_0x7a6aa3)['some'](
      (_0x2ed249) =>
        !['price', 'billing']['includes'](_0x2ed249) &&
        /price|billing|multiplier|surcharge|tier/i['test'](_0x2ed249),
    )
  )
    throw new Error('BH\x20当前型号价格暂不可用');
  const _0x4282ac = _0x7a6aa3['price'],
    _0x55fca8 = _0x4282ac && typeof _0x4282ac === 'object' ? Object['keys'](_0x4282ac) : [],
    _0x27a998 =
      _0x55fca8['length'] === 0x1 && _0x55fca8[0x0] === 'amount'
        ? _0x4282ac['amount']
        : _0x55fca8['length'] === 0x1 &&
            _0x55fca8[0x0] === 'per_second' &&
            _0x7a6aa3['billing'] === 'per_second'
          ? _0x4282ac['per_second']
          : null,
    _0x1e982c = _0x44a2f3['kind'] === 'image' ? ['per_call', 'per_image'] : ['per_call', 'per_second'];
  if (
    !_0x1e982c['includes'](_0x7a6aa3['billing']) ||
    typeof _0x27a998 !== 'number' ||
    !Number['isFinite'](_0x27a998) ||
    _0x27a998 < 0x0 ||
    _0x27a998 > 0xf4240
  )
    throw new Error('BH\x20计费规则暂不支持');
  return { amount: _0x27a998, billing: _0x7a6aa3['billing'], currency: 'CNY' };
}
export async function fetchBinghuoPricing(_0x257657) {
  if (!_0x257657['apiKey']) throw new Error('BH 调用凭据暂不可用');
  const _0x3f2a65 = _0x257657['catalogKey'];
  let _0x3da047 = catalogs['get'](_0x3f2a65);
  if (!_0x3da047 || Date['now']() - _0x3da047['at'] >= TTL) {
    const _0x680ebf = _0x257657['baseUrl'] + '/v1/models/catalog',
      _0xdfb128 = request(
        '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x680ebf),
        {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + _0x257657['apiKey'] },
        },
        0x2ee0,
      )['then']((_0x5f5823) => {
        if (!_0x5f5823['success']) throw new Error('BH 价格查询失败');
        return parseBinghuoPriceCatalog(_0x5f5823['data']);
      });
    ((_0x3da047 = { at: Date['now'](), promise: _0xdfb128 }),
      catalogs['set'](_0x3f2a65, _0x3da047),
      _0xdfb128['catch'](() => {
        if (catalogs['get'](_0x3f2a65) === _0x3da047) _0x3da047['at'] = Date['now']() - TTL + 0xea60;
      }));
  }
  return selectBinghuoPrice(await _0x3da047['promise'], _0x257657);
}
