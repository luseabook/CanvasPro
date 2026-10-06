import { PROVIDERS_META, resolveProviderApiRoute } from '../src/modules/providers.js';
import { getRunningHubWorkflowDefaultProfileId } from '../src/modules/runningHubProviderProfiles.js';
import { desktopBridge } from '../src/services/desktopBridge.js';
import { get, post } from './apiBase.js';
import { OBJECT_STORAGE_PROVIDER_IDS } from './objectStorageProfiles.js';
let apiConfig = null,
  lastPersistedApiConfig = null,
  apiConfigLoadPromise = null,
  apiConfigSaveQueue = Promise.resolve(),
  apiConfigSavePendingCount = 0,
  apiConfigSaveRevision = 0;
export const API_CONFIG_CHANGED_EVENT = 'aicanvas:api-config-changed';
const SECURE_PROVIDER_FIELDS = ['apiKey', 'modelApiKey'],
  SECURE_OBJECT_STORAGE_FIELDS = ['accessKeyId', 'secretAccessKey', 'sessionToken'],
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
  ((apiConfig = null),
    (lastPersistedApiConfig = null),
    (apiConfigLoadPromise = null),
    (apiConfigSaveRevision += 1));
}
export function isApiConfigLoaded() {
  return apiConfig !== null;
}
export function getApiConfigSnapshot() {
  return cloneConfig(apiConfig || {});
}
function notifyApiConfigChanged(reason = 'updated') {
  const enabled = globalThis.window;
  if (!enabled || typeof enabled.dispatchEvent !== 'function') return;
  const detail = { reason: reason },
    value =
      typeof globalThis.CustomEvent === 'function'
        ? new globalThis.CustomEvent(API_CONFIG_CHANGED_EVENT, { detail: detail })
        : { type: API_CONFIG_CHANGED_EVENT, detail: detail };
  enabled.dispatchEvent(value);
}
function isPlainObject(enabled2) {
  return !!enabled2 && typeof enabled2 === 'object' && !Array.isArray(enabled2);
}
function cloneConfig(item) {
  return isPlainObject(item) ? JSON.parse(JSON.stringify(item)) : {};
}
function normalizeProviderId(key) {
  return String(key || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, '');
}
function normalizeComfyUiBaseUrl(index, result = '') {
  const enabled3 = String(index || result || '').trim();
  if (!enabled3) return '';
  const data = /^[a-z][a-z0-9+.-]*:\/\//i.test(enabled3);
  try {
    const uRL = new URL(data ? enabled3 : 'http://' + enabled3);
    return ((uRL.search = ''), (uRL.hash = ''), uRL.toString().replace(/\/+$/, ''));
  } catch {
    const enabled4 = enabled3.replace(/[?#].*$/, '').replace(/\/+$/, '');
    if (!enabled4) return '';
    return data ? enabled4 : 'http://' + enabled4;
  }
}
function buildProviderSecureKey(options, target) {
  const providerId = normalizeProviderId(options),
    source = String(target || '').trim();
  if (!providerId || !SECURE_PROVIDER_FIELDS.includes(source)) return '';
  return 'apiConfig.providers.' + providerId + '.' + source;
}
function buildObjectStorageSecureKey(next, current = '') {
  const entry = String(next || '').trim();
  if (!SECURE_OBJECT_STORAGE_FIELDS.includes(entry)) return '';
  const providerId2 = normalizeProviderId(current);
  if (providerId2) return 'apiConfig.objectStorage.profiles.' + providerId2 + '.' + entry;
  return 'apiConfig.objectStorage.' + entry;
}
function getSecureSettingsApi() {
  if (!desktopBridge.isElectron && !desktopBridge.isChromeShell) return null;
  const map = desktopBridge.secureSettings;
  if (
    map &&
    typeof map.get === 'function' &&
    typeof map.set === 'function' &&
    typeof map.delete === 'function'
  )
    return map;
  return null;
}
function collectProviderIds(options2 = {}) {
  const args = new Set(DEFAULT_SECURE_PROVIDER_IDS);
  return (
    isPlainObject(options2.providers) &&
      Object.keys(options2.providers).forEach((record) => {
        const providerId3 = normalizeProviderId(record);
        if (providerId3) args.add(providerId3);
      }),
    [...args]
  );
}
function collectSecureKeys(options3 = {}) {
  const list = [];
  (collectProviderIds(options3).forEach((payload) => {
    SECURE_PROVIDER_FIELDS.forEach((handle) => {
      const providerSecureKey = buildProviderSecureKey(payload, handle);
      if (providerSecureKey) list.push(providerSecureKey);
    });
  }),
    SECURE_OBJECT_STORAGE_FIELDS.forEach((state) => {
      const objectStorageSecureKey = buildObjectStorageSecureKey(state);
      if (objectStorageSecureKey) list.push(objectStorageSecureKey);
    }));
  const list2 = new Set(OBJECT_STORAGE_PROVIDER_IDS);
  return (
    isPlainObject(options3?.objectStorage?.profiles) &&
      Object.keys(options3.objectStorage.profiles).forEach((config) => {
        const providerId4 = normalizeProviderId(config);
        if (providerId4) list2.add(providerId4);
      }),
    list2.forEach((scope) => {
      SECURE_OBJECT_STORAGE_FIELDS.forEach((input) => {
        const objectStorageSecureKey2 = buildObjectStorageSecureKey(input, scope);
        if (objectStorageSecureKey2) list.push(objectStorageSecureKey2);
      });
    }),
    list
  );
}
function stripSensitiveConfigValues(options4 = {}) {
  const cloneConfig2 = cloneConfig(options4);
  return (
    isPlainObject(cloneConfig2.providers) &&
      Object.values(cloneConfig2.providers).forEach((output) => {
        if (!isPlainObject(output)) return;
        SECURE_PROVIDER_FIELDS.forEach((value2) => {
          delete output[value2];
        });
      }),
    isPlainObject(cloneConfig2.objectStorage) &&
      (SECURE_OBJECT_STORAGE_FIELDS.forEach((value3) => {
        delete cloneConfig2.objectStorage[value3];
      }),
      isPlainObject(cloneConfig2.objectStorage.profiles) &&
        Object.values(cloneConfig2.objectStorage.profiles).forEach((value4) => {
          if (!isPlainObject(value4)) return;
          SECURE_OBJECT_STORAGE_FIELDS.forEach((value5) => {
            delete value4[value5];
          });
        })),
    LEGACY_GRSAI_KEY_FIELDS.forEach((value6) => {
      delete cloneConfig2[value6];
    }),
    cloneConfig2
  );
}
function normalizeConfigForStorage(options5 = {}) {
  const cloneConfig3 = cloneConfig(options5),
    value7 = cloneConfig3.providers?.comfyui;
  return (
    isPlainObject(value7) &&
      ((Object.prototype.hasOwnProperty.call(value7, 'apiUrl') ||
        Object.prototype.hasOwnProperty.call(value7, 'baseUrl')) &&
        (value7.apiUrl = normalizeComfyUiBaseUrl(value7.apiUrl || value7.baseUrl || '')),
      (Object.prototype.hasOwnProperty.call(value7, 'cloudApiUrl') ||
        Object.prototype.hasOwnProperty.call(value7, 'cloudBaseUrl')) &&
        (value7.cloudApiUrl = normalizeComfyUiBaseUrl(
          value7.cloudApiUrl || value7.cloudBaseUrl || '',
        ))),
    cloneConfig3
  );
}
function extractPlaintextSecureValues(options6 = {}) {
  const map2 = new Map(),
    isPlainObject2 = isPlainObject(options6.providers) ? options6.providers : {};
  Object.entries(isPlainObject2).forEach(([value8, value9]) => {
    if (!isPlainObject(value9)) return;
    SECURE_PROVIDER_FIELDS.forEach((value10) => {
      if (!Object.prototype.hasOwnProperty.call(value9, value10)) return;
      const providerSecureKey2 = buildProviderSecureKey(value8, value10);
      if (!providerSecureKey2) return;
      map2.set(providerSecureKey2, String(value9[value10] || ''));
    });
  });
  isPlainObject(options6.objectStorage) &&
    (SECURE_OBJECT_STORAGE_FIELDS.forEach((value11) => {
      if (!Object.prototype.hasOwnProperty.call(options6.objectStorage, value11)) return;
      const objectStorageSecureKey3 = buildObjectStorageSecureKey(value11);
      if (!objectStorageSecureKey3) return;
      map2.set(objectStorageSecureKey3, String(options6.objectStorage[value11] || ''));
    }),
    isPlainObject(options6.objectStorage.profiles) &&
      Object.entries(options6.objectStorage.profiles).forEach(([value12, value13]) => {
        if (!isPlainObject(value13)) return;
        SECURE_OBJECT_STORAGE_FIELDS.forEach((value14) => {
          if (!Object.prototype.hasOwnProperty.call(value13, value14)) return;
          const objectStorageSecureKey4 = buildObjectStorageSecureKey(value14, value12);
          if (!objectStorageSecureKey4) return;
          map2.set(objectStorageSecureKey4, String(value13[value14] || ''));
        });
      }));
  const enabled5 = !!String(isPlainObject2?.grsai?.apiKey || '').trim();
  if (!enabled5)
    for (const value15 of LEGACY_GRSAI_KEY_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(options6, value15)) continue;
      const value16 = String(options6[value15] || '');
      if (value16) map2.set(buildProviderSecureKey('grsai', 'apiKey'), value16);
    }
  return map2;
}
function mergeSecureValuesIntoConfig(options7 = {}, value17 = {}) {
  const stripSensitiveConfigValues2 = stripSensitiveConfigValues(options7);
  return (
    Object.entries(value17 || {}).forEach(([value18, value19]) => {
      const value20 = String(value18 || '').match(
        /^apiConfig\.objectStorage\.profiles\.([A-Za-z0-9_-]+)\.(accessKeyId|secretAccessKey|sessionToken)$/,
      );
      if (value20) {
        const enabled6 = String(value19 || '');
        if (!enabled6) return;
        const value21 = value20[1],
          value22 = value20[2];
        if (!isPlainObject(stripSensitiveConfigValues2.objectStorage))
          stripSensitiveConfigValues2.objectStorage = {};
        !isPlainObject(stripSensitiveConfigValues2.objectStorage.profiles) &&
          (stripSensitiveConfigValues2.objectStorage.profiles = {});
        !isPlainObject(stripSensitiveConfigValues2.objectStorage.profiles[value21]) &&
          (stripSensitiveConfigValues2.objectStorage.profiles[value21] = {});
        stripSensitiveConfigValues2.objectStorage.profiles[value21][value22] = enabled6;
        return;
      }
      const value23 = String(value18 || '').match(
        /^apiConfig\.objectStorage\.(accessKeyId|secretAccessKey|sessionToken)$/,
      );
      if (value23) {
        const enabled7 = String(value19 || '');
        if (!enabled7) return;
        if (!isPlainObject(stripSensitiveConfigValues2.objectStorage))
          stripSensitiveConfigValues2.objectStorage = {};
        stripSensitiveConfigValues2.objectStorage[value23[1]] = enabled7;
        return;
      }
      const enabled8 = String(value18 || '').match(
        /^apiConfig\.providers\.([A-Za-z0-9_-]+)\.(apiKey|modelApiKey)$/,
      );
      if (!enabled8) return;
      const value24 = enabled8[1],
        value25 = enabled8[2],
        enabled9 = String(value19 || '');
      if (!enabled9) return;
      if (!isPlainObject(stripSensitiveConfigValues2.providers))
        stripSensitiveConfigValues2.providers = {};
      if (!isPlainObject(stripSensitiveConfigValues2.providers[value24]))
        stripSensitiveConfigValues2.providers[value24] = {};
      stripSensitiveConfigValues2.providers[value24][value25] = enabled9;
    }),
    stripSensitiveConfigValues2
  );
}
function hasProviderConfigValue(options8 = {}) {
  if (!isPlainObject(options8)) return false;
  return [
    'apiUrl',
    'cloudApiUrl',
    'apiKey',
    'modelApiKey',
    'routeId',
    'concurrentLimit',
    'workflowConcurrentLimit',
    'modelConcurrentLimit',
  ].some((value26) => {
    const value27 = options8[value26];
    return value27 !== undefined && value27 !== null && String(value27).trim() !== '';
  });
}
async function readSecureValues(options9 = {}) {
  const map3 = getSecureSettingsApi();
  if (!map3) return { available: false, values: {} };
  try {
    const map4 = await map3.get({ keys: collectSecureKeys(options9) });
    if (!map4?.available) return { available: false, values: {} };
    return { available: true, values: isPlainObject(map4.values) ? map4.values : {} };
  } catch {
    return { available: false, values: {} };
  }
}
async function writeSecureValues(map5) {
  const map6 = getSecureSettingsApi();
  if (!map6 || !(map5 instanceof Map)) return { available: false, changed: false };
  const enabled10 = await map6.get({ keys: [] }).catch(() => null);
  if (!enabled10?.available) return { available: false, changed: false };
  let changed = false,
    failed = false;
  for (const [key2, value28] of map5.entries()) {
    if (!key2) continue;
    const value29 = String(value28 || '');
    if (value29) {
      const response = await map6.set({ key: key2, value: value29 });
      if (response?.ok) changed = true;
      else failed = true;
    } else {
      const response2 = await map6.delete({ key: key2 });
      if (response2?.ok) changed = true;
      else failed = true;
    }
  }
  return { available: true, changed: changed, failed: failed };
}
async function hydrateConfigFromSecureStorage(options10 = {}) {
  const list3 = extractPlaintextSecureValues(options10),
    { available: available, values: values } = await readSecureValues(options10);
  if (!available) return options10;
  let value30 = { ...values };
  if (list3.size > 0) {
    const writeSecureValues2 = await writeSecureValues(list3);
    if (writeSecureValues2.available && !writeSecureValues2.failed) {
      list3.forEach((value31, value32) => {
        if (String(value31 || '')) value30[value32] = String(value31 || '');
        else delete value30[value32];
      });
      const stripSensitiveConfigValues3 = stripSensitiveConfigValues(options10);
      await post('/api/config', stripSensitiveConfigValues3).catch(() => null);
    }
  }
  return mergeSecureValuesIntoConfig(options10, value30);
}
function _syncLegacyWindowApiKeys(value33) {
  if (typeof window === 'undefined') return;
  const value34 = value33?.providers || {},
    value35 = value33?.apiKey || '';
  ((window._appApiKey = value34.grsai?.apiKey || value35 || ''),
    (window._runningHubApiKey = value34.runninghub?.apiKey || ''),
    (window._runningHubModelApiKey = value34.runninghub?.modelApiKey || ''));
}
export async function fetchApiConfigFromServer() {
  if (apiConfigLoadPromise) return apiConfigLoadPromise;
  const value36 = (async () => {
    const response3 = await get('/api/config');
    if (!response3.success) throw new Error(response3.error || '获取配置失败');
    return (
      (apiConfig = await hydrateConfigFromSecureStorage(response3.data || {})),
      (lastPersistedApiConfig = cloneConfig(apiConfig)),
      _syncLegacyWindowApiKeys(apiConfig),
      notifyApiConfigChanged('loaded'),
      apiConfig
    );
  })();
  apiConfigLoadPromise = value36;
  try {
    return await value36;
  } finally {
    apiConfigLoadPromise === value36 && (apiConfigLoadPromise = null);
  }
}
async function persistApiConfigToServer(value37, value38) {
  const providers = normalizeConfigForStorage(value37 || {}),
    map7 = extractPlaintextSecureValues(providers),
    writeSecureValues3 = await writeSecureValues(map7),
    value39 = [...map7.keys()].some((value40) =>
      String(value40 || '').startsWith('apiConfig.objectStorage.'),
    );
  if (value39 && (!writeSecureValues3.available || writeSecureValues3.failed))
    throw new Error('安全存储不可用，无法保存对象存储访问密钥');
  const value41 =
      writeSecureValues3.available && !writeSecureValues3.failed
        ? stripSensitiveConfigValues(providers)
        : providers,
    response4 = await post('/api/config', value41);
  if (!response4.success) throw new Error(response4.error || '保存配置失败');
  return (
    (lastPersistedApiConfig = cloneConfig(providers)),
    value38 === apiConfigSaveRevision &&
      ((apiConfig = cloneConfig(providers)),
      _syncLegacyWindowApiKeys({ providers: providers?.providers || {} }),
      notifyApiConfigChanged('saved')),
    response4.data
  );
}
export function saveApiConfigToServer(value42) {
  const providers2 = normalizeConfigForStorage(value42 || {}),
    value43 = ++apiConfigSaveRevision;
  ((apiConfig = cloneConfig(providers2)),
    _syncLegacyWindowApiKeys({ providers: providers2?.providers || {} }),
    notifyApiConfigChanged('save-pending'),
    (apiConfigSavePendingCount += 1));
  const value44 = apiConfigSaveQueue.catch(() => {})
    .then(() => persistApiConfigToServer(providers2, value43))
    .catch((value45) => {
      value43 === apiConfigSaveRevision &&
        ((apiConfig = lastPersistedApiConfig === null ? null : cloneConfig(lastPersistedApiConfig)),
        _syncLegacyWindowApiKeys({ providers: apiConfig?.providers || {} }),
        notifyApiConfigChanged('save-failed'));
      throw value45;
    })
    .finally(() => {
      apiConfigSavePendingCount = Math.max(0, apiConfigSavePendingCount - 1);
    });
  return ((apiConfigSaveQueue = value44), value44);
}
export async function ensureConfig() {
  apiConfigSavePendingCount > 0 && (await apiConfigSaveQueue.catch(() => {}));
  if (apiConfig) return;
  await fetchApiConfigFromServer();
}
export function getProviderConfig(value46) {
  if (value46 === 'runninghubwf') {
    const providerProfileId = getRunningHubWorkflowDefaultProfileId(apiConfig || {}),
      value47 = PROVIDERS_META[providerProfileId],
      value48 = value47?.defaultUrl || 'https://www.runninghub.cn',
      apiKey = apiConfig?.providers?.[providerProfileId] || {};
    return {
      ...apiKey,
      apiUrl: (apiKey.apiUrl || value48).replace(/\/+$/, ''),
      apiKey: apiKey.apiKey || '',
      modelApiKey: '',
      providerProfileId: providerProfileId,
      rhProviderProfileId: providerProfileId,
    };
  }
  const value49 = PROVIDERS_META[value46],
    apiUrl = value49?.defaultUrl || 'https://grsai.dakka.com.cn',
    apiKey2 = apiConfig?.providers?.[value46];
  if (hasProviderConfigValue(apiKey2)) {
    const args2 = resolveProviderApiRoute(value46, apiKey2);
    if (args2)
      return {
        ...apiKey2,
        ...args2,
        apiKey: apiKey2.apiKey || '',
        modelApiKey: apiKey2.modelApiKey || '',
      };
    if (value46 === 'comfyui')
      return {
        ...apiKey2,
        apiUrl: normalizeComfyUiBaseUrl(apiKey2.apiUrl || apiKey2.baseUrl, apiUrl),
        cloudApiUrl: normalizeComfyUiBaseUrl(apiKey2.cloudApiUrl || apiKey2.cloudBaseUrl || ''),
        apiKey: apiKey2.apiKey || '',
        modelApiKey: apiKey2.modelApiKey || '',
      };
    return {
      ...apiKey2,
      apiUrl: (apiKey2.apiUrl || apiUrl).replace(/\/+$/, ''),
      apiKey: apiKey2.apiKey || '',
      modelApiKey: apiKey2.modelApiKey || '',
    };
  }
  if (value46 === 'grsai')
    return {
      apiUrl: (apiConfig?.apiUrlInput || apiConfig?.apiUrl || apiUrl).replace(/\/+$/, ''),
      apiKey: apiConfig?.apiKeyInput || apiConfig?.apiKey || '',
      modelApiKey: '',
    };
  const args3 = resolveProviderApiRoute(value46);
  if (args3) return { ...args3, apiKey: '', modelApiKey: '' };
  return { apiUrl: apiUrl, apiKey: '', modelApiKey: '' };
}
export async function resolveRunningHubWorkflowAccess(value50 = '') {
  await ensureConfig();
  const value51 = String(value50 || '').trim(),
    providerConfig = getProviderConfig(value51 || 'runninghubwf');
  return {
    apiKey: String(providerConfig?.apiKey || '').trim(),
    apiUrl: String(providerConfig?.apiUrl || '')
      .trim()
      .replace(/\/+$/, ''),
    providerProfileId: String(value51 || providerConfig?.providerProfileId || '').trim(),
  };
}
export function getObjectStorageConfig() {
  return cloneConfig(isPlainObject(apiConfig?.objectStorage) ? apiConfig.objectStorage : {});
}
