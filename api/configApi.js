import { PROVIDERS_META, resolveProviderApiRoute } from '../src/modules/providers.js';
import { getRunningHubWorkflowDefaultProfileId } from '../src/modules/runningHubProviderProfiles.js';
import { desktopBridge } from '../src/services/desktopBridge.js';
import { get, post } from './apiBase.js';
import { OBJECT_STORAGE_PROVIDER_IDS } from './objectStorageProfiles.js';
let apiConfig = null,
  lastPersistedApiConfig = null,
  apiConfigLoadPromise = null,
  apiConfigSaveQueue = Promise['resolve'](),
  apiConfigSavePendingCount = 0x0,
  apiConfigSaveRevision = 0x0;
export const API_CONFIG_CHANGED_EVENT = 'aicanvas:api-config-changed';
const SECURE_PROVIDER_FIELDS = ['apiKey', 'modelApiKey'],
  SECURE_OBJECT_STORAGE_FIELDS = ['accessKeyId', 'secretAccessKey', 'sessionToken'],
  LEGACY_GRSAI_KEY_FIELDS = ['apiKey', 'apiKeyInput'],
  DEFAULT_SECURE_PROVIDER_IDS = Object['freeze']([
    ...new Set([
      ...Object['keys'](PROVIDERS_META || {}),
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
  ((apiConfig = null),
    (lastPersistedApiConfig = null),
    (apiConfigLoadPromise = null),
    (apiConfigSaveRevision += 0x1));
}
export function isApiConfigLoaded() {
  return apiConfig !== null;
}
export function getApiConfigSnapshot() {
  return cloneConfig(apiConfig || {});
}
function notifyApiConfigChanged(_0x3f7a61 = 'updated') {
  const _0x498ec2 = globalThis['window'];
  if (!_0x498ec2 || typeof _0x498ec2['dispatchEvent'] !== 'function') return;
  const _0x1e684f = { reason: _0x3f7a61 },
    _0x17065d =
      typeof globalThis['CustomEvent'] === 'function'
        ? new globalThis['CustomEvent'](API_CONFIG_CHANGED_EVENT, { detail: _0x1e684f })
        : { type: API_CONFIG_CHANGED_EVENT, detail: _0x1e684f };
  _0x498ec2['dispatchEvent'](_0x17065d);
}
function isPlainObject(_0x2cda2c) {
  return !!_0x2cda2c && typeof _0x2cda2c === 'object' && !Array['isArray'](_0x2cda2c);
}
function cloneConfig(_0x45dda4) {
  return isPlainObject(_0x45dda4) ? JSON['parse'](JSON['stringify'](_0x45dda4)) : {};
}
function normalizeProviderId(_0x462516) {
  return String(_0x462516 || '')
    ['trim']()
    ['replace'](/[^A-Za-z0-9_-]/g, '');
}
function normalizeComfyUiBaseUrl(_0x4abfa5, _0x1c51a9 = '') {
  const _0x16b003 = String(_0x4abfa5 || _0x1c51a9 || '')['trim']();
  if (!_0x16b003) return '';
  const _0x19ba85 = /^[a-z][a-z0-9+.-]*:\/\//i['test'](_0x16b003);
  try {
    const _0x598842 = new URL(_0x19ba85 ? _0x16b003 : 'http://' + _0x16b003);
    return (
      (_0x598842['search'] = ''),
      (_0x598842['hash'] = ''),
      _0x598842['toString']()['replace'](/\/+$/, '')
    );
  } catch {
    const _0xbe881e = _0x16b003['replace'](/[?#].*$/, '')['replace'](/\/+$/, '');
    if (!_0xbe881e) return '';
    return _0x19ba85 ? _0xbe881e : 'http://' + _0xbe881e;
  }
}
function buildProviderSecureKey(_0x21ae26, _0x396e0b) {
  const _0x118ce8 = normalizeProviderId(_0x21ae26),
    _0x20afa5 = String(_0x396e0b || '')['trim']();
  if (!_0x118ce8 || !SECURE_PROVIDER_FIELDS['includes'](_0x20afa5)) return '';
  return 'apiConfig.providers.' + _0x118ce8 + '.' + _0x20afa5;
}
function buildObjectStorageSecureKey(_0xce6b36, _0x741727 = '') {
  const _0x23627a = String(_0xce6b36 || '')['trim']();
  if (!SECURE_OBJECT_STORAGE_FIELDS['includes'](_0x23627a)) return '';
  const _0x2f920b = normalizeProviderId(_0x741727);
  if (_0x2f920b) return 'apiConfig.objectStorage.profiles.' + _0x2f920b + '.' + _0x23627a;
  return 'apiConfig.objectStorage.' + _0x23627a;
}
function getSecureSettingsApi() {
  if (!desktopBridge['isElectron'] && !desktopBridge['isChromeShell']) return null;
  const _0x5ee63a = desktopBridge['secureSettings'];
  if (
    _0x5ee63a &&
    typeof _0x5ee63a['get'] === 'function' &&
    typeof _0x5ee63a['set'] === 'function' &&
    typeof _0x5ee63a['delete'] === 'function'
  )
    return _0x5ee63a;
  return null;
}
function collectProviderIds(_0x37d8bb = {}) {
  const _0xbf6c80 = new Set(DEFAULT_SECURE_PROVIDER_IDS);
  return (
    isPlainObject(_0x37d8bb['providers']) &&
      Object['keys'](_0x37d8bb['providers'])['forEach']((_0x31ee51) => {
        const _0x25530c = normalizeProviderId(_0x31ee51);
        if (_0x25530c) _0xbf6c80['add'](_0x25530c);
      }),
    [..._0xbf6c80]
  );
}
function collectSecureKeys(_0x1fea57 = {}) {
  const _0x19ac07 = [];
  (collectProviderIds(_0x1fea57)['forEach']((_0x2053e0) => {
    SECURE_PROVIDER_FIELDS['forEach']((_0x5b3754) => {
      const _0x3bd1d1 = buildProviderSecureKey(_0x2053e0, _0x5b3754);
      if (_0x3bd1d1) _0x19ac07['push'](_0x3bd1d1);
    });
  }),
    SECURE_OBJECT_STORAGE_FIELDS['forEach']((_0x1872cd) => {
      const _0x4656c7 = buildObjectStorageSecureKey(_0x1872cd);
      if (_0x4656c7) _0x19ac07['push'](_0x4656c7);
    }));
  const _0x539996 = new Set(OBJECT_STORAGE_PROVIDER_IDS);
  return (
    isPlainObject(_0x1fea57?.['objectStorage']?.['profiles']) &&
      Object['keys'](_0x1fea57['objectStorage']['profiles'])['forEach']((_0x1cf321) => {
        const _0x3455bd = normalizeProviderId(_0x1cf321);
        if (_0x3455bd) _0x539996['add'](_0x3455bd);
      }),
    _0x539996['forEach']((_0x1b1877) => {
      SECURE_OBJECT_STORAGE_FIELDS['forEach']((_0x3aa0fd) => {
        const _0x4f0b83 = buildObjectStorageSecureKey(_0x3aa0fd, _0x1b1877);
        if (_0x4f0b83) _0x19ac07['push'](_0x4f0b83);
      });
    }),
    _0x19ac07
  );
}
function stripSensitiveConfigValues(_0x1cf6d2 = {}) {
  const _0x3570e6 = cloneConfig(_0x1cf6d2);
  return (
    isPlainObject(_0x3570e6['providers']) &&
      Object['values'](_0x3570e6['providers'])['forEach']((_0x296a95) => {
        if (!isPlainObject(_0x296a95)) return;
        SECURE_PROVIDER_FIELDS['forEach']((_0xb85567) => {
          delete _0x296a95[_0xb85567];
        });
      }),
    isPlainObject(_0x3570e6['objectStorage']) &&
      (SECURE_OBJECT_STORAGE_FIELDS['forEach']((_0x197d3e) => {
        delete _0x3570e6['objectStorage'][_0x197d3e];
      }),
      isPlainObject(_0x3570e6['objectStorage']['profiles']) &&
        Object['values'](_0x3570e6['objectStorage']['profiles'])['forEach']((_0x52913) => {
          if (!isPlainObject(_0x52913)) return;
          SECURE_OBJECT_STORAGE_FIELDS['forEach']((_0x5ee5ab) => {
            delete _0x52913[_0x5ee5ab];
          });
        })),
    LEGACY_GRSAI_KEY_FIELDS['forEach']((_0x55a14c) => {
      delete _0x3570e6[_0x55a14c];
    }),
    _0x3570e6
  );
}
function normalizeConfigForStorage(_0x5848ac = {}) {
  const _0x3096c0 = cloneConfig(_0x5848ac),
    _0x2342ce = _0x3096c0['providers']?.['comfyui'];
  return (
    isPlainObject(_0x2342ce) &&
      ((Object['prototype']['hasOwnProperty']['call'](_0x2342ce, 'apiUrl') ||
        Object['prototype']['hasOwnProperty']['call'](_0x2342ce, 'baseUrl')) &&
        (_0x2342ce['apiUrl'] = normalizeComfyUiBaseUrl(_0x2342ce['apiUrl'] || _0x2342ce['baseUrl'] || '')),
      (Object['prototype']['hasOwnProperty']['call'](_0x2342ce, 'cloudApiUrl') ||
        Object['prototype']['hasOwnProperty']['call'](_0x2342ce, 'cloudBaseUrl')) &&
        (_0x2342ce['cloudApiUrl'] = normalizeComfyUiBaseUrl(
          _0x2342ce['cloudApiUrl'] || _0x2342ce['cloudBaseUrl'] || '',
        ))),
    _0x3096c0
  );
}
function extractPlaintextSecureValues(_0x411905 = {}) {
  const _0x1fe841 = new Map(),
    _0x17cdbb = isPlainObject(_0x411905['providers']) ? _0x411905['providers'] : {};
  Object['entries'](_0x17cdbb)['forEach'](([_0x5609d1, _0x57376e]) => {
    if (!isPlainObject(_0x57376e)) return;
    SECURE_PROVIDER_FIELDS['forEach']((_0x41f180) => {
      if (!Object['prototype']['hasOwnProperty']['call'](_0x57376e, _0x41f180)) return;
      const _0x130fc3 = buildProviderSecureKey(_0x5609d1, _0x41f180);
      if (!_0x130fc3) return;
      _0x1fe841['set'](_0x130fc3, String(_0x57376e[_0x41f180] || ''));
    });
  });
  isPlainObject(_0x411905['objectStorage']) &&
    (SECURE_OBJECT_STORAGE_FIELDS['forEach']((_0x3aa8ba) => {
      if (!Object['prototype']['hasOwnProperty']['call'](_0x411905['objectStorage'], _0x3aa8ba)) return;
      const _0x20066b = buildObjectStorageSecureKey(_0x3aa8ba);
      if (!_0x20066b) return;
      _0x1fe841['set'](_0x20066b, String(_0x411905['objectStorage'][_0x3aa8ba] || ''));
    }),
    isPlainObject(_0x411905['objectStorage']['profiles']) &&
      Object['entries'](_0x411905['objectStorage']['profiles'])['forEach'](([_0x52a725, _0x382e11]) => {
        if (!isPlainObject(_0x382e11)) return;
        SECURE_OBJECT_STORAGE_FIELDS['forEach']((_0x32c454) => {
          if (!Object['prototype']['hasOwnProperty']['call'](_0x382e11, _0x32c454)) return;
          const _0xaa3674 = buildObjectStorageSecureKey(_0x32c454, _0x52a725);
          if (!_0xaa3674) return;
          _0x1fe841['set'](_0xaa3674, String(_0x382e11[_0x32c454] || ''));
        });
      }));
  const _0x1782ac = !!String(_0x17cdbb?.['grsai']?.['apiKey'] || '')['trim']();
  if (!_0x1782ac)
    for (const _0x460caa of LEGACY_GRSAI_KEY_FIELDS) {
      if (!Object['prototype']['hasOwnProperty']['call'](_0x411905, _0x460caa)) continue;
      const _0x51ef75 = String(_0x411905[_0x460caa] || '');
      if (_0x51ef75) _0x1fe841['set'](buildProviderSecureKey('grsai', 'apiKey'), _0x51ef75);
    }
  return _0x1fe841;
}
function mergeSecureValuesIntoConfig(_0x650f18 = {}, _0x11c626 = {}) {
  const _0x242d2e = stripSensitiveConfigValues(_0x650f18);
  return (
    Object['entries'](_0x11c626 || {})['forEach'](([_0x167f04, _0xd27e0c]) => {
      const _0x914b77 = String(_0x167f04 || '')['match'](
        /^apiConfig\.objectStorage\.profiles\.([A-Za-z0-9_-]+)\.(accessKeyId|secretAccessKey|sessionToken)$/,
      );
      if (_0x914b77) {
        const _0x142beb = String(_0xd27e0c || '');
        if (!_0x142beb) return;
        const _0xb6f6b0 = _0x914b77[0x1],
          _0x5d65b2 = _0x914b77[0x2];
        if (!isPlainObject(_0x242d2e['objectStorage'])) _0x242d2e['objectStorage'] = {};
        !isPlainObject(_0x242d2e['objectStorage']['profiles']) &&
          (_0x242d2e['objectStorage']['profiles'] = {});
        !isPlainObject(_0x242d2e['objectStorage']['profiles'][_0xb6f6b0]) &&
          (_0x242d2e['objectStorage']['profiles'][_0xb6f6b0] = {});
        _0x242d2e['objectStorage']['profiles'][_0xb6f6b0][_0x5d65b2] = _0x142beb;
        return;
      }
      const _0x140427 = String(_0x167f04 || '')['match'](
        /^apiConfig\.objectStorage\.(accessKeyId|secretAccessKey|sessionToken)$/,
      );
      if (_0x140427) {
        const _0x31a44d = String(_0xd27e0c || '');
        if (!_0x31a44d) return;
        if (!isPlainObject(_0x242d2e['objectStorage'])) _0x242d2e['objectStorage'] = {};
        _0x242d2e['objectStorage'][_0x140427[0x1]] = _0x31a44d;
        return;
      }
      const _0x1e1d3c = String(_0x167f04 || '')['match'](
        /^apiConfig\.providers\.([A-Za-z0-9_-]+)\.(apiKey|modelApiKey)$/,
      );
      if (!_0x1e1d3c) return;
      const _0x594515 = _0x1e1d3c[0x1],
        _0x2c9539 = _0x1e1d3c[0x2],
        _0x507674 = String(_0xd27e0c || '');
      if (!_0x507674) return;
      if (!isPlainObject(_0x242d2e['providers'])) _0x242d2e['providers'] = {};
      if (!isPlainObject(_0x242d2e['providers'][_0x594515])) _0x242d2e['providers'][_0x594515] = {};
      _0x242d2e['providers'][_0x594515][_0x2c9539] = _0x507674;
    }),
    _0x242d2e
  );
}
function hasProviderConfigValue(_0xb92405 = {}) {
  if (!isPlainObject(_0xb92405)) return ![];
  return [
    'apiUrl',
    'cloudApiUrl',
    'apiKey',
    'modelApiKey',
    'routeId',
    'concurrentLimit',
    'workflowConcurrentLimit',
    'modelConcurrentLimit',
  ]['some']((_0x18d80a) => {
    const _0x296987 = _0xb92405[_0x18d80a];
    return _0x296987 !== undefined && _0x296987 !== null && String(_0x296987)['trim']() !== '';
  });
}
async function readSecureValues(_0x209572 = {}) {
  const _0x351602 = getSecureSettingsApi();
  if (!_0x351602) return { available: ![], values: {} };
  try {
    const _0x475e7f = await _0x351602['get']({ keys: collectSecureKeys(_0x209572) });
    if (!_0x475e7f?.['available']) return { available: ![], values: {} };
    return { available: !![], values: isPlainObject(_0x475e7f['values']) ? _0x475e7f['values'] : {} };
  } catch {
    return { available: ![], values: {} };
  }
}
async function writeSecureValues(_0xc8243f) {
  const _0x337de4 = getSecureSettingsApi();
  if (!_0x337de4 || !(_0xc8243f instanceof Map)) return { available: ![], changed: ![] };
  const _0x123434 = await _0x337de4['get']({ keys: [] })['catch'](() => null);
  if (!_0x123434?.['available']) return { available: ![], changed: ![] };
  let _0xa7a0ef = ![],
    _0x4a80f6 = ![];
  for (const [_0x52bf8e, _0x9c4703] of _0xc8243f['entries']()) {
    if (!_0x52bf8e) continue;
    const _0x420755 = String(_0x9c4703 || '');
    if (_0x420755) {
      const _0x36fc64 = await _0x337de4['set']({ key: _0x52bf8e, value: _0x420755 });
      if (_0x36fc64?.['ok']) _0xa7a0ef = !![];
      else _0x4a80f6 = !![];
    } else {
      const _0x782f16 = await _0x337de4['delete']({ key: _0x52bf8e });
      if (_0x782f16?.['ok']) _0xa7a0ef = !![];
      else _0x4a80f6 = !![];
    }
  }
  return { available: !![], changed: _0xa7a0ef, failed: _0x4a80f6 };
}
async function hydrateConfigFromSecureStorage(_0x35f755 = {}) {
  const _0x306a02 = extractPlaintextSecureValues(_0x35f755),
    { available: _0xc5b23d, values: _0x2eae7a } = await readSecureValues(_0x35f755);
  if (!_0xc5b23d) return _0x35f755;
  let _0x20fc9b = { ..._0x2eae7a };
  if (_0x306a02['size'] > 0x0) {
    const _0x3fb769 = await writeSecureValues(_0x306a02);
    if (_0x3fb769['available'] && !_0x3fb769['failed']) {
      _0x306a02['forEach']((_0xc9f553, _0x2754a5) => {
        if (String(_0xc9f553 || '')) _0x20fc9b[_0x2754a5] = String(_0xc9f553 || '');
        else delete _0x20fc9b[_0x2754a5];
      });
      const _0x4300f4 = stripSensitiveConfigValues(_0x35f755);
      await post('/api/config', _0x4300f4)['catch'](() => null);
    }
  }
  return mergeSecureValuesIntoConfig(_0x35f755, _0x20fc9b);
}
function _syncLegacyWindowApiKeys(_0x53679c) {
  if (typeof window === 'undefined') return;
  const _0x7f16b7 = _0x53679c?.['providers'] || {},
    _0x164f44 = _0x53679c?.['apiKey'] || '';
  ((window['_appApiKey'] = _0x7f16b7['grsai']?.['apiKey'] || _0x164f44 || ''),
    (window['_runningHubApiKey'] = _0x7f16b7['runninghub']?.['apiKey'] || ''),
    (window['_runningHubModelApiKey'] = _0x7f16b7['runninghub']?.['modelApiKey'] || ''));
}
export async function fetchApiConfigFromServer() {
  if (apiConfigLoadPromise) return apiConfigLoadPromise;
  const _0x5db757 = (async () => {
    const _0x5ea5ea = await get('/api/config');
    if (!_0x5ea5ea['success']) throw new Error(_0x5ea5ea['error'] || '获取配置失败');
    return (
      (apiConfig = await hydrateConfigFromSecureStorage(_0x5ea5ea['data'] || {})),
      (lastPersistedApiConfig = cloneConfig(apiConfig)),
      _syncLegacyWindowApiKeys(apiConfig),
      notifyApiConfigChanged('loaded'),
      apiConfig
    );
  })();
  apiConfigLoadPromise = _0x5db757;
  try {
    return await _0x5db757;
  } finally {
    apiConfigLoadPromise === _0x5db757 && (apiConfigLoadPromise = null);
  }
}
async function persistApiConfigToServer(_0x2fd03b, _0x544dfc) {
  const _0x55f256 = normalizeConfigForStorage(_0x2fd03b || {}),
    _0x1630d6 = extractPlaintextSecureValues(_0x55f256),
    _0x1febad = await writeSecureValues(_0x1630d6),
    _0x1c7dbc = [..._0x1630d6['keys']()]['some']((_0x4d6505) =>
      String(_0x4d6505 || '')['startsWith']('apiConfig.objectStorage.'),
    );
  if (_0x1c7dbc && (!_0x1febad['available'] || _0x1febad['failed']))
    throw new Error('安全存储不可用，无法保存对象存储访问密钥');
  const _0x267e32 =
      _0x1febad['available'] && !_0x1febad['failed'] ? stripSensitiveConfigValues(_0x55f256) : _0x55f256,
    _0x1c019f = await post('/api/config', _0x267e32);
  if (!_0x1c019f['success']) throw new Error(_0x1c019f['error'] || '保存配置失败');
  return (
    (lastPersistedApiConfig = cloneConfig(_0x55f256)),
    _0x544dfc === apiConfigSaveRevision &&
      ((apiConfig = cloneConfig(_0x55f256)),
      _syncLegacyWindowApiKeys({ providers: _0x55f256?.['providers'] || {} }),
      notifyApiConfigChanged('saved')),
    _0x1c019f['data']
  );
}
export function saveApiConfigToServer(_0x255c10) {
  const _0x28725a = normalizeConfigForStorage(_0x255c10 || {}),
    _0x163732 = ++apiConfigSaveRevision;
  ((apiConfig = cloneConfig(_0x28725a)),
    _syncLegacyWindowApiKeys({ providers: _0x28725a?.['providers'] || {} }),
    notifyApiConfigChanged('save-pending'),
    (apiConfigSavePendingCount += 0x1));
  const _0x532cb7 = apiConfigSaveQueue['catch'](() => {})
    ['then'](() => persistApiConfigToServer(_0x28725a, _0x163732))
    ['catch']((_0x56f766) => {
      _0x163732 === apiConfigSaveRevision &&
        ((apiConfig = lastPersistedApiConfig === null ? null : cloneConfig(lastPersistedApiConfig)),
        _syncLegacyWindowApiKeys({ providers: apiConfig?.['providers'] || {} }),
        notifyApiConfigChanged('save-failed'));
      throw _0x56f766;
    })
    ['finally'](() => {
      apiConfigSavePendingCount = Math['max'](0x0, apiConfigSavePendingCount - 0x1);
    });
  return ((apiConfigSaveQueue = _0x532cb7), _0x532cb7);
}
export async function ensureConfig() {
  apiConfigSavePendingCount > 0x0 && (await apiConfigSaveQueue['catch'](() => {}));
  if (apiConfig) return;
  await fetchApiConfigFromServer();
}
export function getProviderConfig(_0x475dbf) {
  if (_0x475dbf === 'runninghubwf') {
    const _0x1d6183 = getRunningHubWorkflowDefaultProfileId(apiConfig || {}),
      _0x572f16 = PROVIDERS_META[_0x1d6183],
      _0x4470bb = _0x572f16?.['defaultUrl'] || 'https://www.runninghub.cn',
      _0xa7e442 = apiConfig?.['providers']?.[_0x1d6183] || {};
    return {
      ..._0xa7e442,
      apiUrl: (_0xa7e442['apiUrl'] || _0x4470bb)['replace'](/\/+$/, ''),
      apiKey: _0xa7e442['apiKey'] || '',
      modelApiKey: '',
      providerProfileId: _0x1d6183,
      rhProviderProfileId: _0x1d6183,
    };
  }
  const _0x1f9d94 = PROVIDERS_META[_0x475dbf],
    _0x2e2af1 = _0x1f9d94?.['defaultUrl'] || 'https://grsai.dakka.com.cn',
    _0x276f62 = apiConfig?.['providers']?.[_0x475dbf];
  if (hasProviderConfigValue(_0x276f62)) {
    const _0x22feb1 = resolveProviderApiRoute(_0x475dbf, _0x276f62);
    if (_0x22feb1)
      return {
        ..._0x276f62,
        ..._0x22feb1,
        apiKey: _0x276f62['apiKey'] || '',
        modelApiKey: _0x276f62['modelApiKey'] || '',
      };
    if (_0x475dbf === 'comfyui')
      return {
        ..._0x276f62,
        apiUrl: normalizeComfyUiBaseUrl(_0x276f62['apiUrl'] || _0x276f62['baseUrl'], _0x2e2af1),
        cloudApiUrl: normalizeComfyUiBaseUrl(_0x276f62['cloudApiUrl'] || _0x276f62['cloudBaseUrl'] || ''),
        apiKey: _0x276f62['apiKey'] || '',
        modelApiKey: _0x276f62['modelApiKey'] || '',
      };
    return {
      ..._0x276f62,
      apiUrl: (_0x276f62['apiUrl'] || _0x2e2af1)['replace'](/\/+$/, ''),
      apiKey: _0x276f62['apiKey'] || '',
      modelApiKey: _0x276f62['modelApiKey'] || '',
    };
  }
  if (_0x475dbf === 'grsai')
    return {
      apiUrl: (apiConfig?.['apiUrlInput'] || apiConfig?.['apiUrl'] || _0x2e2af1)['replace'](/\/+$/, ''),
      apiKey: apiConfig?.['apiKeyInput'] || apiConfig?.['apiKey'] || '',
      modelApiKey: '',
    };
  const _0x336285 = resolveProviderApiRoute(_0x475dbf);
  if (_0x336285) return { ..._0x336285, apiKey: '', modelApiKey: '' };
  return { apiUrl: _0x2e2af1, apiKey: '', modelApiKey: '' };
}
export async function resolveRunningHubWorkflowAccess(_0x270476 = '') {
  await ensureConfig();
  const _0x27e489 = String(_0x270476 || '')['trim'](),
    _0xd6036d = getProviderConfig(_0x27e489 || 'runninghubwf');
  return {
    apiKey: String(_0xd6036d?.['apiKey'] || '')['trim'](),
    apiUrl: String(_0xd6036d?.['apiUrl'] || '')
      ['trim']()
      ['replace'](/\/+$/, ''),
    providerProfileId: String(_0x27e489 || _0xd6036d?.['providerProfileId'] || '')['trim'](),
  };
}
export function getObjectStorageConfig() {
  return cloneConfig(isPlainObject(apiConfig?.['objectStorage']) ? apiConfig['objectStorage'] : {});
}
