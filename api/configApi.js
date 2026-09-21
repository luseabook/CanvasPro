import {
  DEFAULT_APIMART_ROUTE_ID,
  PROVIDERS_META,
  getApimartApiUrlForRoute,
  resolveApimartRouteByApiUrl,
} from '../src/modules/providers.js';
import { get, post } from './apiBase.js';
let apiConfig = null;
const SECURE_PROVIDER_FIELDS = ['apiKey', 'modelApiKey'],
  LEGACY_GRSAI_KEY_FIELDS = ['apiKey', 'apiKeyInput'],
  DEFAULT_SECURE_PROVIDER_IDS = Object.freeze([
    ...new Set([
      ...Object.keys(PROVIDERS_META || {}),
      'grsai',
      'openai',
      'ppio',
      'apimart',
      'agnes',
      'runninghub',
      'aicanvas',
    ]),
  ]);
export function clearApiConfig() {
  apiConfig = null;
}
function isPlainObject(_0x17bf7f) {
  return !!_0x17bf7f && typeof _0x17bf7f === 'object' && !Array.isArray(_0x17bf7f);
}
function cloneConfig(_0x2f26bd) {
  return isPlainObject(_0x2f26bd) ? JSON.parse(JSON.stringify(_0x2f26bd)) : {};
}
function normalizeProviderId(_0x4ef7b0) {
  return String(_0x4ef7b0 || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, '');
}
function buildProviderSecureKey(_0x889418, _0x4c4650) {
  const _0x4f5396 = normalizeProviderId(_0x889418),
    _0x2b48b5 = String(_0x4c4650 || '').trim();
  if (!_0x4f5396 || !SECURE_PROVIDER_FIELDS.includes(_0x2b48b5)) return '';
  return 'apiConfig.providers.' + _0x4f5396 + '.' + _0x2b48b5;
}
function getSecureSettingsApi() {
  const _0x17c84f = globalThis?.window?.electronAPI?.secureSettings;
  if (
    _0x17c84f &&
    typeof _0x17c84f.get === 'function' &&
    typeof _0x17c84f.set === 'function' &&
    typeof _0x17c84f.delete === 'function'
  )
    return _0x17c84f;
  return null;
}
function collectProviderIds(_0x59beb5 = {}) {
  const _0x168840 = new Set(DEFAULT_SECURE_PROVIDER_IDS);
  return (
    isPlainObject(_0x59beb5.providers) &&
      Object.keys(_0x59beb5.providers).forEach((_0x5a1b93) => {
        const _0x588a1f = normalizeProviderId(_0x5a1b93);
        if (_0x588a1f) _0x168840.add(_0x588a1f);
      }),
    [..._0x168840]
  );
}
function collectSecureKeys(_0x5b3f1a = {}) {
  const _0x4a8c65 = [];
  return (
    collectProviderIds(_0x5b3f1a).forEach((_0x2fabb3) => {
      SECURE_PROVIDER_FIELDS.forEach((_0x507799) => {
        const _0x231b35 = buildProviderSecureKey(_0x2fabb3, _0x507799);
        if (_0x231b35) _0x4a8c65.push(_0x231b35);
      });
    }),
    _0x4a8c65
  );
}
function stripSensitiveConfigValues(_0x21d6ce = {}) {
  const _0x488e45 = cloneConfig(_0x21d6ce);
  return (
    isPlainObject(_0x488e45.providers) &&
      Object.values(_0x488e45.providers).forEach((_0x160e1b) => {
        if (!isPlainObject(_0x160e1b)) return;
        SECURE_PROVIDER_FIELDS.forEach((_0x1da53e) => {
          delete _0x160e1b[_0x1da53e];
        });
      }),
    LEGACY_GRSAI_KEY_FIELDS.forEach((_0xa9d8ad) => {
      delete _0x488e45[_0xa9d8ad];
    }),
    _0x488e45
  );
}
function extractPlaintextSecureValues(_0x473e44 = {}) {
  const _0x1d2b03 = new Map(),
    _0x30e68e = isPlainObject(_0x473e44.providers) ? _0x473e44.providers : {};
  Object.entries(_0x30e68e).forEach(([_0x16fb01, _0x4b2bdd]) => {
    if (!isPlainObject(_0x4b2bdd)) return;
    SECURE_PROVIDER_FIELDS.forEach((_0x30516d) => {
      if (!Object.prototype.hasOwnProperty.call(_0x4b2bdd, _0x30516d)) return;
      const _0x24944b = buildProviderSecureKey(_0x16fb01, _0x30516d);
      if (!_0x24944b) return;
      _0x1d2b03.set(_0x24944b, String(_0x4b2bdd[_0x30516d] || ''));
    });
  });
  const _0x4acd77 = !!String(_0x30e68e?.grsai?.apiKey || '').trim();
  if (!_0x4acd77)
    for (const _0xfbe067 of LEGACY_GRSAI_KEY_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(_0x473e44, _0xfbe067)) continue;
      const _0x5db8bb = String(_0x473e44[_0xfbe067] || '');
      if (_0x5db8bb) _0x1d2b03.set(buildProviderSecureKey('grsai', 'apiKey'), _0x5db8bb);
    }
  return _0x1d2b03;
}
function mergeSecureValuesIntoConfig(_0x3a3d1c = {}, _0x3ef374 = {}) {
  const _0x806f5e = stripSensitiveConfigValues(_0x3a3d1c);
  return (
    Object.entries(_0x3ef374 || {}).forEach(([_0x35fe42, _0x136498]) => {
      const _0xef7874 = String(_0x35fe42 || '').match(
        /^apiConfig\.providers\.([A-Za-z0-9_-]+)\.(apiKey|modelApiKey)$/,
      );
      if (!_0xef7874) return;
      const _0x5de805 = _0xef7874[1],
        _0x3f28a0 = _0xef7874[2],
        _0x2b4614 = String(_0x136498 || '');
      if (!_0x2b4614) return;
      if (!isPlainObject(_0x806f5e.providers)) _0x806f5e.providers = {};
      if (!isPlainObject(_0x806f5e.providers[_0x5de805])) _0x806f5e.providers[_0x5de805] = {};
      _0x806f5e.providers[_0x5de805][_0x3f28a0] = _0x2b4614;
    }),
    _0x806f5e
  );
}
async function readSecureValues(_0x4101d1 = {}) {
  const _0x36a678 = getSecureSettingsApi();
  if (!_0x36a678) return { available: false, values: {} };
  try {
    const _0x51ddd4 = await _0x36a678.get({ keys: collectSecureKeys(_0x4101d1) });
    if (!_0x51ddd4?.available) return { available: false, values: {} };
    return { available: true, values: isPlainObject(_0x51ddd4.values) ? _0x51ddd4.values : {} };
  } catch {
    return { available: false, values: {} };
  }
}
async function writeSecureValues(_0x5249db) {
  const _0x29cbc0 = getSecureSettingsApi();
  if (!_0x29cbc0 || !(_0x5249db instanceof Map)) return { available: false, changed: false };
  const _0x20b48a = await _0x29cbc0.get({ keys: [] }).catch(() => null);
  if (!_0x20b48a?.available) return { available: false, changed: false };
  let _0x34a9f0 = false,
    _0x349fbb = false;
  for (const [_0x547583, _0x45ab60] of _0x5249db.entries()) {
    if (!_0x547583) continue;
    const _0x5e7a5c = String(_0x45ab60 || '');
    if (_0x5e7a5c) {
      const _0xb33efb = await _0x29cbc0.set({ key: _0x547583, value: _0x5e7a5c });
      if (_0xb33efb?.ok) _0x34a9f0 = true;
      else _0x349fbb = true;
    } else {
      const _0x36cfaf = await _0x29cbc0.delete({ key: _0x547583 });
      if (_0x36cfaf?.ok) _0x34a9f0 = true;
      else _0x349fbb = true;
    }
  }
  return { available: true, changed: _0x34a9f0, failed: _0x349fbb };
}
async function hydrateConfigFromSecureStorage(_0x511038 = {}) {
  const _0x462e37 = extractPlaintextSecureValues(_0x511038),
    { available: _0x276c00, values: _0x2fee0e } = await readSecureValues(_0x511038);
  if (!_0x276c00) return _0x511038;
  let _0x2bebd4 = { ..._0x2fee0e };
  if (_0x462e37.size > 0) {
    const _0x30130c = await writeSecureValues(_0x462e37);
    if (_0x30130c.available && !_0x30130c.failed) {
      _0x462e37.forEach((_0x5ac52a, _0x512094) => {
        if (String(_0x5ac52a || '')) _0x2bebd4[_0x512094] = String(_0x5ac52a || '');
        else delete _0x2bebd4[_0x512094];
      });
      const _0x1b9bfd = stripSensitiveConfigValues(_0x511038);
      await post('/api/config', _0x1b9bfd).catch(() => null);
    }
  }
  return mergeSecureValuesIntoConfig(_0x511038, _0x2bebd4);
}
function _syncLegacyWindowApiKeys(_0x5396d0) {
  if (typeof window === 'undefined') return;
  const _0x2d15e6 = _0x5396d0?.providers || {},
    _0x5151ce = _0x5396d0?.apiKey || '';
  ((window._appApiKey = _0x2d15e6.grsai?.apiKey || _0x5151ce || ''),
    (window._runningHubApiKey = _0x2d15e6.runninghub?.apiKey || ''),
    (window._runningHubModelApiKey = _0x2d15e6.runninghub?.modelApiKey || ''));
}
export async function fetchApiConfigFromServer() {
  const _0x2d4e46 = await get('/api/config');
  if (!_0x2d4e46.success) throw new Error(_0x2d4e46.error || '获取配置失败');
  return (
    (apiConfig = await hydrateConfigFromSecureStorage(_0x2d4e46.data || {})),
    _syncLegacyWindowApiKeys(apiConfig),
    apiConfig
  );
}
export async function saveApiConfigToServer(_0x3411d3) {
  const _0x1845a6 = extractPlaintextSecureValues(_0x3411d3 || {}),
    _0x3a6e68 = await writeSecureValues(_0x1845a6),
    _0x349486 =
      _0x3a6e68.available && !_0x3a6e68.failed
        ? stripSensitiveConfigValues(_0x3411d3 || {})
        : _0x3411d3 || {},
    _0xe975da = await post('/api/config', _0x349486);
  if (!_0xe975da.success) throw new Error(_0xe975da.error || '保存配置失败');
  return (
    clearApiConfig(),
    _syncLegacyWindowApiKeys({ providers: _0x3411d3?.providers || {} }),
    _0xe975da.data
  );
}
export async function ensureConfig() {
  if (apiConfig) return;
  await fetchApiConfigFromServer();
}
export function getProviderConfig(_0xe44d70) {
  const _0x3fc845 = PROVIDERS_META[_0xe44d70],
    _0x2d8ddf = _0x3fc845?.defaultUrl || 'https://grsai.dakka.com.cn',
    _0x27604f = apiConfig?.providers?.[_0xe44d70];
  if (_0x27604f?.apiUrl || _0x27604f?.apiKey || _0x27604f?.modelApiKey || _0x27604f?.routeId) {
    if (_0xe44d70 === 'apimart') {
      const _0x5d2f29 = (
          _0x27604f.apiUrl ||
          getApimartApiUrlForRoute(_0x27604f.routeId) ||
          _0x2d8ddf
        ).replace(/\/+$/, ''),
        _0x3135f9 = resolveApimartRouteByApiUrl(_0x5d2f29);
      return {
        apiUrl: _0x5d2f29,
        apiKey: _0x27604f.apiKey || '',
        modelApiKey: _0x27604f.modelApiKey || '',
        routeId: _0x3135f9?.id || _0x27604f.routeId || DEFAULT_APIMART_ROUTE_ID,
      };
    }
    return {
      apiUrl: (_0x27604f.apiUrl || _0x2d8ddf).replace(/\/+$/, ''),
      apiKey: _0x27604f.apiKey || '',
      modelApiKey: _0x27604f.modelApiKey || '',
    };
  }
  if (_0xe44d70 === 'runninghubwf') {
    const _0x21b1fd = apiConfig?.providers?.runninghub;
    if (_0x21b1fd?.apiUrl || _0x21b1fd?.apiKey || _0x21b1fd?.modelApiKey)
      return {
        apiUrl: (_0x21b1fd.apiUrl || _0x2d8ddf).replace(/\/+$/, ''),
        apiKey: _0x21b1fd.apiKey || '',
        modelApiKey: '',
      };
  }
  if (_0xe44d70 === 'grsai')
    return {
      apiUrl: (apiConfig?.apiUrlInput || apiConfig?.apiUrl || _0x2d8ddf).replace(/\/+$/, ''),
      apiKey: apiConfig?.apiKeyInput || apiConfig?.apiKey || '',
      modelApiKey: '',
    };
  if (_0xe44d70 === 'apimart')
    return { apiUrl: _0x2d8ddf, apiKey: '', modelApiKey: '', routeId: DEFAULT_APIMART_ROUTE_ID };
  return { apiUrl: _0x2d8ddf, apiKey: '', modelApiKey: '' };
}
