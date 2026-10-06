import { fetchBinghuoModelCatalog } from '../../api/modelCatalogApi.js';
import { withoutBinghuoCatalogPrices } from '../services/binghuoCatalogPricing.js';
import {
  registerManifestBundle,
  unregisterManifestBundle,
  validateManifestBundle,
} from '../manifests/modelRegistry.js';
export const BINGHUO_MODEL_CATALOG_CACHE_KEY = 'aic-model-catalog-binghuo-v1';
export const BINGHUO_MODEL_CATALOG_SOURCE_ID = 'server.binghuo';
const BINGHUO_EXECUTION_POLICY = Object.freeze({
    image: Object.freeze({ endpoint: '/v1/images/generations', bodyResolver: '', pollingUrlTemplate: '' }),
    video: Object.freeze({
      endpoint: '/v1/video/generations',
      bodyResolver: 'binghuoVideo',
      pollingUrlTemplate: '{baseUrl}/v1/video/generations/{taskId}',
    }),
  }),
  BINGHUO_ASSET_UPLOAD_ENDPOINT = '/v1/assets/uploads',
  BINGHUO_ASSET_UPLOAD_PROVIDER = 'customProviderAsset',
  BINGHUO_ASSET_UPLOAD_KEYS = Object.freeze(['imageInputUpload', 'videoInputUpload', 'audioInputUpload']),
  BINGHUO_EXECUTION_KEYS = new Set([
    'schemaVersion',
    'id',
    'provider',
    'kind',
    'adapterType',
    'endpoint',
    'endpointMode',
    'method',
    'headers',
    'model',
    'extensions',
    'bodyMapping',
    'responseMapping',
    'result',
  ]),
  BINGHUO_EXECUTION_EXTENSION_KEYS = new Set([
    ...BINGHUO_ASSET_UPLOAD_KEYS,
    'binghuoVideo',
    'bodyResolver',
    'mergeGenericInputImagesWithSlots',
    'requestTimeoutMs',
    'strictInputCounts',
    'strictUiSchemaParams',
    'taskPolling',
  ]),
  BINGHUO_BODY_MAPPING_SOURCES = new Set([
    'constant',
    'inputAudios',
    'inputImages',
    'inputVideos',
    'model',
    'param',
    'prompt',
  ]),
  BINGHUO_BODY_MAPPING_TRANSFORMS = new Set(['booleanParam', 'providerRatioSize']),
  BINGHUO_BODY_MAPPING_PATHS = new Set([
    'duration',
    'generate_audio',
    'images',
    'model',
    'n',
    'prompt',
    'quality',
    'quality_level',
    'ratio',
    'reference_audios',
    'reference_videos',
    'resolution',
    'response_format',
    'size',
    'skip_review',
  ]),
  BINGHUO_TASK_POLLING_KEYS = new Set([
    'failedStatuses',
    'headersMode',
    'maxWaitMs',
    'method',
    'mode',
    'pollIntervalMs',
    'successStatuses',
    'transportErrorPolicy',
    'urlTemplate',
  ]),
  BINGHUO_TASK_TRANSPORT_POLICY_KEYS = new Set([
    'maxConsecutiveErrors',
    'retryableStatuses',
    'surfaceLastError',
    'terminalStatuses',
  ]),
  BINGHUO_UPLOAD_POLICY_KEYS = new Set([
    'allowedExtensions',
    'endpoint',
    'forceProviderUpload',
    'inputKinds',
    'maxBytes',
    'multipartField',
    'provider',
    'responsePath',
    'strictUpload',
    'uploadTimeout',
  ]),
  BINGHUO_MODEL_KEYS = new Set([
    'adapterType',
    'async',
    'cancellable',
    'description',
    'displayName',
    'executionId',
    'extensions',
    'help',
    'icon',
    'inputSlots',
    'kind',
    'modelId',
    'outputType',
    'prompt',
    'provider',
    'schemaVersion',
    'uiSchema',
    'vip',
  ]),
  BINGHUO_MODEL_EXTENSION_KEYS = Object.freeze({
    image: new Set(['imageMenu', 'modelCatalog', 'ratioPolicy']),
    video: new Set(['modelCatalog', 'ratioPolicy', 'videoInputSurface', 'videoMenu']),
  }),
  BINGHUO_MODEL_CATALOG_EXTENSION_KEYS = new Set([
    'templateFamilyDefault',
    'templateFamilyId',
    'templateFamilyLabel',
  ]);
function normalizeIdentity(value) {
  return String(value || '').trim();
}
function normalizeExpirySeconds(item) {
  if (item === null || item === undefined || item === '') return null;
  const count = Number(item);
  if (Number.isFinite(count) && count > 0)
    return count > 100000000000 ? Math.floor(count / 1000) : Math.floor(count);
  const count2 = Date.parse(String(item));
  return Number.isFinite(count2) && count2 > 0 ? Math.floor(count2 / 1000) : null;
}
function isActiveSubscription(response, key) {
  if (
    String(response?.status || '')
      .trim()
      .toLowerCase() !== 'active'
  )
    return false;
  const expirySeconds = normalizeExpirySeconds(response?.expiresAt);
  return expirySeconds === null || expirySeconds > Math.floor(key / 1000);
}
function assertExactValue(index, result, data) {
  if (index !== result) throw new Error('[modelCatalog] invalid ' + data);
}
function assertObjectKeysAllowed(enabled, map, options) {
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled))
    throw new Error('[modelCatalog] invalid ' + options);
  for (const target of Object.keys(enabled)) {
    if (!map.has(target))
      throw new Error('[modelCatalog] ' + options + '.' + target + ' is not allowed');
  }
}
function assertBinghuoModelCatalogMetadata(source, next) {
  if (source === undefined || source === null) return;
  assertObjectKeysAllowed(source, BINGHUO_MODEL_CATALOG_EXTENSION_KEYS, next);
  for (const current of BINGHUO_MODEL_CATALOG_EXTENSION_KEYS) {
    if (!Object.hasOwn(source, current))
      throw new Error('[modelCatalog] ' + next + '.' + current + ' is required');
  }
  if (
    typeof source.templateFamilyId !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]{0,127}$/.test(source.templateFamilyId)
  )
    throw new Error('[modelCatalog] invalid ' + next + '.templateFamilyId');
  if (
    typeof source.templateFamilyLabel !== 'string' ||
    source.templateFamilyLabel !== source.templateFamilyLabel.trim() ||
    source.templateFamilyLabel.length === 0 ||
    source.templateFamilyLabel.length > 128 ||
    /[\u0000-\u001f]/.test(source.templateFamilyLabel)
  )
    throw new Error('[modelCatalog] invalid ' + next + '.templateFamilyLabel');
  if (typeof source.templateFamilyDefault !== 'boolean')
    throw new Error('[modelCatalog] invalid ' + next + '.templateFamilyDefault');
}
function normalizeMappingTransformNames(entry) {
  const list = Array.isArray(entry) ? entry : [entry];
  return list.filter((record) => record !== undefined && record !== null && record !== '').map(
    (error2) => (typeof error2 === 'string' ? error2 : String(error2?.name || '').trim()),
  );
}
function assertBinghuoBodyMapping(list2, payload) {
  if (!Array.isArray(list2)) throw new Error('[modelCatalog] invalid ' + payload);
  list2.forEach((handle, state) => {
    const config = payload + '[' + state + ']';
    assertObjectKeysAllowed(
      handle,
      new Set(['defaultValue', 'field', 'from', 'omitWhenEmpty', 'path', 'transform', 'value']),
      config,
    );
    const scope = String(handle.path || '').trim();
    if (!BINGHUO_BODY_MAPPING_PATHS.has(scope))
      throw new Error('[modelCatalog] invalid ' + config + '.path');
    const input = String(handle.from || '').trim();
    if (!BINGHUO_BODY_MAPPING_SOURCES.has(input))
      throw new Error('[modelCatalog] invalid ' + config + '.from');
    for (const output of normalizeMappingTransformNames(handle.transform)) {
      if (!BINGHUO_BODY_MAPPING_TRANSFORMS.has(output))
        throw new Error('[modelCatalog] invalid ' + config + '.transform');
    }
  });
}
function assertBinghuoAssetUploadPolicy(value2, value3, value4) {
  if (value2 === undefined || value2 === null) return;
  (assertObjectKeysAllowed(value2, BINGHUO_UPLOAD_POLICY_KEYS, value3),
    assertExactValue(
      String(value2.provider || '').trim(),
      BINGHUO_ASSET_UPLOAD_PROVIDER,
      value3 + '.provider',
    ),
    assertExactValue(
      String(value2.endpoint || '').trim(),
      BINGHUO_ASSET_UPLOAD_ENDPOINT,
      value3 + '.endpoint',
    ));
  if (value2.forceProviderUpload !== true)
    throw new Error('[modelCatalog] invalid ' + value3 + '.forceProviderUpload');
  if (
    value2.multipartField !== 'file' ||
    value2.responsePath !== 'url' ||
    value2.strictUpload !== true ||
    !Array.isArray(value2.inputKinds) ||
    value2.inputKinds.length !== 1 ||
    value2.inputKinds[0] !== value4
  )
    throw new Error('[modelCatalog] invalid ' + value3 + ' contract');
}
function assertStatusList(list3, value5) {
  if (
    !Array.isArray(list3) ||
    list3.length === 0 ||
    list3.some((value6) => !/^[a-z][a-z0-9_-]{0,63}$/.test(String(value6 || '')))
  )
    throw new Error('[modelCatalog] invalid ' + value5);
}
function assertHttpStatusList(list4, value7) {
  if (
    !Array.isArray(list4) ||
    list4.some((count3) => !Number.isInteger(count3) || count3 < 400 || count3 > 599)
  )
    throw new Error('[modelCatalog] invalid ' + value7);
}
function assertBinghuoTaskPolling(value8, enabled2) {
  if (!enabled2.pollingUrlTemplate) {
    if (value8 !== undefined && value8 !== null)
      throw new Error('[modelCatalog] image task polling is not allowed');
    return;
  }
  (assertObjectKeysAllowed(value8, BINGHUO_TASK_POLLING_KEYS, 'execution extensions.taskPolling'),
    assertExactValue(value8.mode, 'task-proxy', 'task polling mode'),
    assertExactValue(value8.method, 'GET', 'task polling method'),
    assertExactValue(value8.headersMode, 'bearer', 'task polling headersMode'),
    assertExactValue(
      value8.urlTemplate,
      enabled2.pollingUrlTemplate,
      'execution task polling endpoint',
    ));
  const count4 = Number(value8.pollIntervalMs),
    count5 = Number(value8.maxWaitMs);
  if (
    !Number.isFinite(count4) ||
    count4 < 1000 ||
    count4 > 30000 ||
    !Number.isFinite(count5) ||
    count5 < 60000 ||
    count5 > 7200000
  )
    throw new Error('[modelCatalog] invalid task polling timing');
  (assertStatusList(value8.successStatuses, 'task polling successStatuses'),
    assertStatusList(value8.failedStatuses, 'task polling failedStatuses'));
  const value9 = value8.transportErrorPolicy;
  assertObjectKeysAllowed(
    value9,
    BINGHUO_TASK_TRANSPORT_POLICY_KEYS,
    'execution extensions.taskPolling.transportErrorPolicy',
  );
  if (
    !Number.isInteger(value9.maxConsecutiveErrors) ||
    value9.maxConsecutiveErrors < 1 ||
    value9.maxConsecutiveErrors > 10 ||
    value9.surfaceLastError !== true
  )
    throw new Error('[modelCatalog] invalid task polling transport policy');
  (assertHttpStatusList(value9.retryableStatuses, 'task polling retryableStatuses'),
    assertHttpStatusList(value9.terminalStatuses, 'task polling terminalStatuses'));
}
function assertBinghuoExecutionPolicy(response2) {
  assertObjectKeysAllowed(response2, BINGHUO_EXECUTION_KEYS, 'execution');
  const value10 = String(response2?.kind || '')
      .trim()
      .toLowerCase(),
    enabled3 = BINGHUO_EXECUTION_POLICY[value10];
  if (!enabled3)
    throw new Error('[modelCatalog] catalog contains an unsupported execution kind');
  (assertExactValue(String(response2?.adapterType || '').trim(), 'modelApi', 'execution adapterType'),
    assertExactValue(
      String(response2?.method || '')
        .trim()
        .toUpperCase(),
      'POST',
      'execution method',
    ),
    assertExactValue(
      String(response2?.endpoint || '').trim(),
      enabled3.endpoint,
      'execution endpoint',
    ),
    assertExactValue(
      String(response2?.extensions?.bodyResolver || '').trim(),
      enabled3.bodyResolver,
      'execution bodyResolver',
    ));
  if (response2?.extensions?.endpointResolver !== undefined)
    throw new Error('[modelCatalog] endpointResolver is not allowed');
  const value11 = response2?.extensions || {};
  (assertObjectKeysAllowed(value11, BINGHUO_EXECUTION_EXTENSION_KEYS, 'execution extensions'),
    assertExactValue(
      JSON.stringify(response2?.headers || {}),
      JSON.stringify({ 'Content-Type': 'application/json' }),
      'execution headers',
    ),
    assertBinghuoBodyMapping(response2?.bodyMapping, 'execution bodyMapping'),
    assertBinghuoTaskPolling(response2?.extensions?.taskPolling, enabled3));
  for (const [value12, value13] of [
    ['imageInputUpload', 'image'],
    ['videoInputUpload', 'video'],
    ['audioInputUpload', 'audio'],
  ]) {
    assertBinghuoAssetUploadPolicy(
      response2?.extensions?.[value12],
      'execution extensions.' + value12,
      value13,
    );
  }
}
function assertBinghuoBundle(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object' || Array.isArray(enabled4))
    throw new TypeError('[modelCatalog] catalog bundle must be an object');
  if (enabled4.schemaVersion !== '1.0')
    throw new Error('[modelCatalog] unsupported catalog schemaVersion');
  if (enabled4.sourceId !== BINGHUO_MODEL_CATALOG_SOURCE_ID)
    throw new Error('[modelCatalog] invalid catalog sourceId');
  if (!Number.isInteger(enabled4.version) || enabled4.version < 1)
    throw new Error('[modelCatalog] catalog version must be a positive integer');
  if (!Array.isArray(enabled4.models) || !Array.isArray(enabled4.executions))
    throw new Error('[modelCatalog] catalog models/executions must be arrays');
  const enabled5 = new Set(),
    enabled6 = new Set();
  (enabled4.models.forEach((value14) => {
    const value15 = String(value14?.provider || '')
        .trim()
        .toLowerCase(),
      enabled7 = String(value14?.modelId || '').trim(),
      value16 = String(value14?.kind || '')
        .trim()
        .toLowerCase();
    (assertObjectKeysAllowed(value14, BINGHUO_MODEL_KEYS, 'model'),
      assertObjectKeysAllowed(
        value14?.extensions || {},
        BINGHUO_MODEL_EXTENSION_KEYS[value16] || new Set(),
        'model extensions',
      ),
      assertBinghuoModelCatalogMetadata(
        value14?.extensions?.modelCatalog,
        'model extensions.modelCatalog',
      ));
    if (
      value15 !== 'binghuo' ||
      !enabled7.startsWith('binghuo/') ||
      String(value14?.adapterType || '').trim() !== 'modelApi' ||
      value14?.outputType !== value16
    )
      throw new Error('[modelCatalog] catalog contains a non-Binghuo model');
    enabled5.add(value16);
  }),
    enabled4.executions.forEach((value17) => {
      if (
        String(value17?.provider || '')
          .trim()
          .toLowerCase() !== 'binghuo'
      )
        throw new Error('[modelCatalog] catalog contains a non-Binghuo execution');
      (assertBinghuoExecutionPolicy(value17),
        enabled6.add(
          String(value17?.kind || '')
            .trim()
            .toLowerCase(),
        ));
    }));
  if (!enabled5.size || !enabled6.size)
    throw new Error(
      '[modelCatalog] catalog must include at least one executable model',
    );
  return enabled4;
}
function readCache(value18) {
  try {
    const enabled8 = value18?.getItem?.(BINGHUO_MODEL_CATALOG_CACHE_KEY);
    if (!enabled8) return null;
    const value19 = JSON.parse(enabled8);
    return value19 && typeof value19 === 'object' ? value19 : null;
  } catch {
    return null;
  }
}
function removeCache(value20) {
  try {
    value20?.removeItem?.(BINGHUO_MODEL_CATALOG_CACHE_KEY);
  } catch {}
}
function writeCache(value21, value22) {
  try {
    return (value21?.setItem?.(BINGHUO_MODEL_CATALOG_CACHE_KEY, JSON.stringify(value22)), true);
  } catch {
    return false;
  }
}
function isCacheEligible(value23, { installId: installId, deviceId: deviceId, nowMs: nowMs }) {
  const expirySeconds2 = normalizeExpirySeconds(value23?.authorization?.expiresAt);
  return (
    value23?.schemaVersion === '1.0' &&
    value23?.provider === 'binghuo' &&
    value23?.authorization?.status === 'active' &&
    normalizeIdentity(value23?.subject?.installId) === normalizeIdentity(installId) &&
    normalizeIdentity(value23?.subject?.deviceId) === normalizeIdentity(deviceId) &&
    expirySeconds2 !== null &&
    expirySeconds2 > Math.floor(nowMs / 1000) &&
    value23?.bundle?.sourceId === BINGHUO_MODEL_CATALOG_SOURCE_ID
  );
}
function readCachedAuthorization(value24) {
  return { status: 'active', expiresAt: normalizeExpirySeconds(value24?.authorization?.expiresAt) };
}
function createCatalogState(args = {}) {
  return {
    provider: 'binghuo',
    status: 'idle',
    source: 'none',
    sourceId: '',
    version: null,
    etag: '',
    modelCount: 0,
    executionCount: 0,
    lastLoadedAt: 0,
    lastSyncAt: 0,
    error: null,
    ...args,
  };
}
export function createModelCatalogService({
  store: store,
  storage: storage = globalThis.localStorage,
  fetchCatalog: fetchCatalog = fetchBinghuoModelCatalog,
  validateBundle: validateBundle = validateManifestBundle,
  registerBundle: registerBundle = registerManifestBundle,
  unregisterBundle: unregisterBundle = unregisterManifestBundle,
  now: now = () => Date.now(),
} = {}) {
  let status2 = null,
    value25 = 0;
  function run(args2) {
    const args3 = store?.getStateRaw?.()?.modelCatalog || {};
    store?.setModelCatalogState?.({ ...args3, ...createCatalogState(), ...args2 });
  }
  function run2(withoutBinghuoCatalogPrices2) {
    (assertBinghuoBundle(withoutBinghuoCatalogPrices2),
      (withoutBinghuoCatalogPrices2 = withoutBinghuoCatalogPrices(withoutBinghuoCatalogPrices2)));
    const value26 = status2;
    if (value26) unregisterBundle(value26);
    try {
      (validateBundle(withoutBinghuoCatalogPrices2),
        registerBundle(withoutBinghuoCatalogPrices2),
        (status2 = withoutBinghuoCatalogPrices2));
    } catch (value27) {
      value26 && (registerBundle(value26), (status2 = value26));
      throw value27;
    }
  }
  function run3(sourceId, { source: source2, etag: etag = '', synced: synced = false }) {
    const lastLoadedAt = now();
    run({
      status: 'ready',
      source: source2,
      sourceId: sourceId.sourceId,
      version: sourceId.version,
      etag: etag,
      modelCount: sourceId.models.length,
      executionCount: sourceId.executions.length,
      lastLoadedAt: lastLoadedAt,
      lastSyncAt: synced ? lastLoadedAt : 0,
      error: null,
    });
  }
  function run4({ clearCache: clearCache = false, status: status = 'unavailable', error: error = null } = {}) {
    if (status2) unregisterBundle(status2);
    status2 = null;
    if (clearCache) removeCache(storage);
    run({
      status: status,
      source: 'none',
      sourceId: '',
      version: null,
      etag: '',
      modelCount: 0,
      executionCount: 0,
      lastLoadedAt: 0,
      lastSyncAt: now(),
      error: error,
    });
  }
  function loadCachedCatalog({ installId: installId2, deviceId: deviceId2 } = {}) {
    const bundle = readCache(storage);
    if (!isCacheEligible(bundle, { installId: installId2, deviceId: deviceId2, nowMs: now() })) {
      if (bundle) removeCache(storage);
      return { loaded: false, reason: 'cache-ineligible' };
    }
    try {
      return (
        run2(bundle.bundle),
        run3(bundle.bundle, { source: 'cache', etag: String(bundle.etag || '') }),
        { loaded: true, bundle: bundle.bundle, authorization: readCachedAuthorization(bundle) }
      );
    } catch (error3) {
      return (
        removeCache(storage),
        run4({ status: 'error', error: error3?.message || String(error3) }),
        { loaded: false, reason: 'cache-invalid', error: error3 }
      );
    }
  }
  function retainCachedCatalogAfterSubscriptionError({
    installId: installId3,
    deviceId: deviceId3,
    error: error4,
  } = {}) {
    value25 += 1;
    const bundle2 = readCache(storage);
    if (!isCacheEligible(bundle2, { installId: installId3, deviceId: deviceId3, nowMs: now() })) {
      if (bundle2) removeCache(storage);
      return (
        run4({ status: 'error', error: error4?.message || String(error4 || '') }),
        { status: 'error', error: error4 }
      );
    }
    try {
      return (
        (!status2 || status2.version !== bundle2.bundle.version) && run2(bundle2.bundle),
        run3(bundle2.bundle, {
          source: 'cache-fallback',
          etag: String(bundle2.etag || ''),
          synced: true,
        }),
        {
          status: 'cache-fallback',
          bundle: bundle2.bundle,
          authorization: readCachedAuthorization(bundle2),
          error: error4,
        }
      );
    } catch (error5) {
      return (
        removeCache(storage),
        run4({ status: 'error', error: error5?.message || String(error5) }),
        { status: 'error', error: error5 }
      );
    }
  }
  async function sync({
    subscriptionState: subscriptionState,
    installId: installId4,
    deviceId: deviceId4,
    force: force = false,
  } = {}) {
    const value28 = ++value25,
      nowMs2 = now();
    if (!isActiveSubscription(subscriptionState, nowMs2))
      return (run4({ clearCache: true, status: 'unavailable' }), { status: 'unauthorized' });
    const installId5 = normalizeIdentity(installId4),
      deviceId5 = normalizeIdentity(deviceId4);
    if (!installId5 || !deviceId5)
      return (
        run4({ status: 'error', error: '缺少模型目录授权主体信息' }),
        { status: 'error', error: 'missing-subject' }
      );
    const cache = readCache(storage),
      bundle3 = isCacheEligible(cache, { installId: installId5, deviceId: deviceId5, nowMs: nowMs2 })
        ? cache
        : null;
    if (cache && !bundle3) removeCache(storage);
    run({
      status: status2 ? 'refreshing' : 'loading',
      source: status2 ? 'cache' : 'none',
      error: null,
    });
    try {
      let etag2 = await fetchCatalog({
        installId: installId5,
        deviceId: deviceId5,
        etag: force ? '' : String(bundle3?.etag || ''),
      });
      if (value28 !== value25) return { status: 'superseded' };
      if (etag2?.status === 'not-modified' && !bundle3) {
        etag2 = await fetchCatalog({ installId: installId5, deviceId: deviceId5, etag: '' });
        if (value28 !== value25) return { status: 'superseded' };
      }
      if (etag2?.status === 'not-modified')
        return (
          (!status2 || status2.version !== bundle3.bundle.version) && run2(bundle3.bundle),
          run3(bundle3.bundle, {
            source: 'cache',
            etag: etag2.etag || bundle3.etag,
            synced: true,
          }),
          { status: 'not-modified', bundle: bundle3.bundle }
        );
      const version = assertBinghuoBundle(etag2?.bundle);
      run2(version);
      const expiresAt = normalizeExpirySeconds(subscriptionState?.expiresAt);
      return (
        expiresAt !== null && expiresAt > Math.floor(now() / 1000)
          ? writeCache(storage, {
              schemaVersion: '1.0',
              provider: 'binghuo',
              subject: { installId: installId5, deviceId: deviceId5 },
              authorization: { status: 'active', expiresAt: expiresAt },
              version: version.version,
              etag: String(etag2?.etag || ''),
              cachedAt: now(),
              bundle: version,
            })
          : removeCache(storage),
        run3(version, { source: 'remote', etag: String(etag2?.etag || ''), synced: true }),
        { status: 'updated', bundle: version }
      );
    } catch (error6) {
      if (value28 !== value25) return { status: 'superseded', error: error6 };
      if (error6?.status === 401 || error6?.status === 403)
        return (run4({ clearCache: true, status: 'unavailable' }), { status: 'unauthorized', error: error6 });
      if (bundle3)
        return (
          (!status2 || status2.version !== bundle3.bundle.version) && run2(bundle3.bundle),
          run3(bundle3.bundle, { source: 'cache-fallback', etag: bundle3.etag, synced: true }),
          { status: 'cache-fallback', bundle: bundle3.bundle, error: error6 }
        );
      return (
        run4({ status: 'error', error: error6?.message || String(error6) }),
        { status: 'error', error: error6 }
      );
    }
  }
  function clear() {
    ((value25 += 1), run4({ clearCache: true, status: 'unavailable' }));
  }
  return {
    loadCachedCatalog: loadCachedCatalog,
    retainCachedCatalogAfterSubscriptionError: retainCachedCatalogAfterSubscriptionError,
    sync: sync,
    clear: clear,
  };
}
