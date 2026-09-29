import { fetchBinghuoModelCatalog } from '../../api/modelCatalogApi.js';
import { withoutBinghuoCatalogPrices } from '../services/binghuoCatalogPricing.js';
import {
  registerManifestBundle,
  unregisterManifestBundle,
  validateManifestBundle,
} from '../manifests/modelRegistry.js';
export const BINGHUO_MODEL_CATALOG_CACHE_KEY = 'aic-model-catalog-binghuo-v1';
export const BINGHUO_MODEL_CATALOG_SOURCE_ID = 'server.binghuo';
const BINGHUO_EXECUTION_POLICY = Object['freeze']({
    image: Object['freeze']({ endpoint: '/v1/images/generations', bodyResolver: '', pollingUrlTemplate: '' }),
    video: Object['freeze']({
      endpoint: '/v1/video/generations',
      bodyResolver: 'binghuoVideo',
      pollingUrlTemplate: '{baseUrl}/v1/video/generations/{taskId}',
    }),
  }),
  BINGHUO_ASSET_UPLOAD_ENDPOINT = '/v1/assets/uploads',
  BINGHUO_ASSET_UPLOAD_PROVIDER = 'customProviderAsset',
  BINGHUO_ASSET_UPLOAD_KEYS = Object['freeze'](['imageInputUpload', 'videoInputUpload', 'audioInputUpload']),
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
  BINGHUO_MODEL_EXTENSION_KEYS = Object['freeze']({
    image: new Set(['imageMenu', 'modelCatalog', 'ratioPolicy']),
    video: new Set(['modelCatalog', 'ratioPolicy', 'videoInputSurface', 'videoMenu']),
  }),
  BINGHUO_MODEL_CATALOG_EXTENSION_KEYS = new Set([
    'templateFamilyDefault',
    'templateFamilyId',
    'templateFamilyLabel',
  ]);
function normalizeIdentity(_0x326428) {
  return String(_0x326428 || '')['trim']();
}
function normalizeExpirySeconds(_0x3aa9ce) {
  if (_0x3aa9ce === null || _0x3aa9ce === undefined || _0x3aa9ce === '') return null;
  const _0x4155e3 = Number(_0x3aa9ce);
  if (Number['isFinite'](_0x4155e3) && _0x4155e3 > 0x0)
    return _0x4155e3 > 0x174876e800 ? Math['floor'](_0x4155e3 / 0x3e8) : Math['floor'](_0x4155e3);
  const _0x300ea8 = Date['parse'](String(_0x3aa9ce));
  return Number['isFinite'](_0x300ea8) && _0x300ea8 > 0x0 ? Math['floor'](_0x300ea8 / 0x3e8) : null;
}
function isActiveSubscription(_0x2a4ef6, _0x7006b0) {
  if (
    String(_0x2a4ef6?.['status'] || '')
      ['trim']()
      ['toLowerCase']() !== 'active'
  )
    return ![];
  const _0x26ce7e = normalizeExpirySeconds(_0x2a4ef6?.['expiresAt']);
  return _0x26ce7e === null || _0x26ce7e > Math['floor'](_0x7006b0 / 0x3e8);
}
function assertExactValue(_0x5be57f, _0x249b9b, _0x3fa16c) {
  if (_0x5be57f !== _0x249b9b) throw new Error('[modelCatalog] invalid ' + _0x3fa16c);
}
function assertObjectKeysAllowed(_0x2ac908, _0x54990e, _0x44460f) {
  if (!_0x2ac908 || typeof _0x2ac908 !== 'object' || Array['isArray'](_0x2ac908))
    throw new Error('[modelCatalog] invalid ' + _0x44460f);
  for (const _0x20c8ad of Object['keys'](_0x2ac908)) {
    if (!_0x54990e['has'](_0x20c8ad))
      throw new Error('[modelCatalog] ' + _0x44460f + '.' + _0x20c8ad + '\x20is\x20not\x20allowed');
  }
}
function assertBinghuoModelCatalogMetadata(_0x47b51a, _0x43ef7d) {
  if (_0x47b51a === undefined || _0x47b51a === null) return;
  assertObjectKeysAllowed(_0x47b51a, BINGHUO_MODEL_CATALOG_EXTENSION_KEYS, _0x43ef7d);
  for (const _0x5e39fc of BINGHUO_MODEL_CATALOG_EXTENSION_KEYS) {
    if (!Object['hasOwn'](_0x47b51a, _0x5e39fc))
      throw new Error('[modelCatalog] ' + _0x43ef7d + '.' + _0x5e39fc + '\x20is\x20required');
  }
  if (
    typeof _0x47b51a['templateFamilyId'] !== 'string' ||
    !/^[a-z0-9][a-z0-9._-]{0,127}$/['test'](_0x47b51a['templateFamilyId'])
  )
    throw new Error('[modelCatalog]\x20invalid\x20' + _0x43ef7d + '.templateFamilyId');
  if (
    typeof _0x47b51a['templateFamilyLabel'] !== 'string' ||
    _0x47b51a['templateFamilyLabel'] !== _0x47b51a['templateFamilyLabel']['trim']() ||
    _0x47b51a['templateFamilyLabel']['length'] === 0x0 ||
    _0x47b51a['templateFamilyLabel']['length'] > 0x80 ||
    /[\u0000-\u001f]/['test'](_0x47b51a['templateFamilyLabel'])
  )
    throw new Error('[modelCatalog] invalid ' + _0x43ef7d + '.templateFamilyLabel');
  if (typeof _0x47b51a['templateFamilyDefault'] !== 'boolean')
    throw new Error('[modelCatalog] invalid ' + _0x43ef7d + '.templateFamilyDefault');
}
function normalizeMappingTransformNames(_0x3c7f4e) {
  const _0x2c4355 = Array['isArray'](_0x3c7f4e) ? _0x3c7f4e : [_0x3c7f4e];
  return _0x2c4355['filter'](
    (_0x59a38b) => _0x59a38b !== undefined && _0x59a38b !== null && _0x59a38b !== '',
  )['map']((_0x4cd9a3) =>
    typeof _0x4cd9a3 === 'string' ? _0x4cd9a3 : String(_0x4cd9a3?.['name'] || '')['trim'](),
  );
}
function assertBinghuoBodyMapping(_0x12b4ea, _0xba6619) {
  if (!Array['isArray'](_0x12b4ea)) throw new Error('[modelCatalog] invalid ' + _0xba6619);
  _0x12b4ea['forEach']((_0x245d25, _0x32afeb) => {
    const _0x361382 = _0xba6619 + '[' + _0x32afeb + ']';
    assertObjectKeysAllowed(
      _0x245d25,
      new Set(['defaultValue', 'field', 'from', 'omitWhenEmpty', 'path', 'transform', 'value']),
      _0x361382,
    );
    const _0x3427cb = String(_0x245d25['path'] || '')['trim']();
    if (!BINGHUO_BODY_MAPPING_PATHS['has'](_0x3427cb))
      throw new Error('[modelCatalog]\x20invalid\x20' + _0x361382 + '.path');
    const _0x11bade = String(_0x245d25['from'] || '')['trim']();
    if (!BINGHUO_BODY_MAPPING_SOURCES['has'](_0x11bade))
      throw new Error('[modelCatalog]\x20invalid\x20' + _0x361382 + '.from');
    for (const _0x4b09fe of normalizeMappingTransformNames(_0x245d25['transform'])) {
      if (!BINGHUO_BODY_MAPPING_TRANSFORMS['has'](_0x4b09fe))
        throw new Error('[modelCatalog] invalid ' + _0x361382 + '.transform');
    }
  });
}
function assertBinghuoAssetUploadPolicy(_0x39bbc8, _0x4509ee, _0x2fd7c3) {
  if (_0x39bbc8 === undefined || _0x39bbc8 === null) return;
  (assertObjectKeysAllowed(_0x39bbc8, BINGHUO_UPLOAD_POLICY_KEYS, _0x4509ee),
    assertExactValue(
      String(_0x39bbc8['provider'] || '')['trim'](),
      BINGHUO_ASSET_UPLOAD_PROVIDER,
      _0x4509ee + '.provider',
    ),
    assertExactValue(
      String(_0x39bbc8['endpoint'] || '')['trim'](),
      BINGHUO_ASSET_UPLOAD_ENDPOINT,
      _0x4509ee + '.endpoint',
    ));
  if (_0x39bbc8['forceProviderUpload'] !== !![])
    throw new Error('[modelCatalog] invalid ' + _0x4509ee + '.forceProviderUpload');
  if (
    _0x39bbc8['multipartField'] !== 'file' ||
    _0x39bbc8['responsePath'] !== 'url' ||
    _0x39bbc8['strictUpload'] !== !![] ||
    !Array['isArray'](_0x39bbc8['inputKinds']) ||
    _0x39bbc8['inputKinds']['length'] !== 0x1 ||
    _0x39bbc8['inputKinds'][0x0] !== _0x2fd7c3
  )
    throw new Error('[modelCatalog]\x20invalid\x20' + _0x4509ee + ' contract');
}
function assertStatusList(_0x4876d5, _0x57e407) {
  if (
    !Array['isArray'](_0x4876d5) ||
    _0x4876d5['length'] === 0x0 ||
    _0x4876d5['some']((_0xe65653) => !/^[a-z][a-z0-9_-]{0,63}$/['test'](String(_0xe65653 || '')))
  )
    throw new Error('[modelCatalog] invalid ' + _0x57e407);
}
function assertHttpStatusList(_0x2a807b, _0xe0e32) {
  if (
    !Array['isArray'](_0x2a807b) ||
    _0x2a807b['some'](
      (_0x1dd9ca) => !Number['isInteger'](_0x1dd9ca) || _0x1dd9ca < 0x190 || _0x1dd9ca > 0x257,
    )
  )
    throw new Error('[modelCatalog] invalid ' + _0xe0e32);
}
function assertBinghuoTaskPolling(_0x15e9f6, _0x37d5e2) {
  if (!_0x37d5e2['pollingUrlTemplate']) {
    if (_0x15e9f6 !== undefined && _0x15e9f6 !== null)
      throw new Error('[modelCatalog] image task polling is not allowed');
    return;
  }
  (assertObjectKeysAllowed(_0x15e9f6, BINGHUO_TASK_POLLING_KEYS, 'execution extensions.taskPolling'),
    assertExactValue(_0x15e9f6['mode'], 'task-proxy', 'task polling mode'),
    assertExactValue(_0x15e9f6['method'], 'GET', 'task polling method'),
    assertExactValue(_0x15e9f6['headersMode'], 'bearer', 'task\x20polling\x20headersMode'),
    assertExactValue(
      _0x15e9f6['urlTemplate'],
      _0x37d5e2['pollingUrlTemplate'],
      'execution task polling endpoint',
    ));
  const _0x2df713 = Number(_0x15e9f6['pollIntervalMs']),
    _0x2102ad = Number(_0x15e9f6['maxWaitMs']);
  if (
    !Number['isFinite'](_0x2df713) ||
    _0x2df713 < 0x3e8 ||
    _0x2df713 > 0x7530 ||
    !Number['isFinite'](_0x2102ad) ||
    _0x2102ad < 0xea60 ||
    _0x2102ad > 0x6ddd00
  )
    throw new Error('[modelCatalog] invalid task polling timing');
  (assertStatusList(_0x15e9f6['successStatuses'], 'task\x20polling\x20successStatuses'),
    assertStatusList(_0x15e9f6['failedStatuses'], 'task polling failedStatuses'));
  const _0x30525b = _0x15e9f6['transportErrorPolicy'];
  assertObjectKeysAllowed(
    _0x30525b,
    BINGHUO_TASK_TRANSPORT_POLICY_KEYS,
    'execution extensions.taskPolling.transportErrorPolicy',
  );
  if (
    !Number['isInteger'](_0x30525b['maxConsecutiveErrors']) ||
    _0x30525b['maxConsecutiveErrors'] < 0x1 ||
    _0x30525b['maxConsecutiveErrors'] > 0xa ||
    _0x30525b['surfaceLastError'] !== !![]
  )
    throw new Error('[modelCatalog] invalid task polling transport policy');
  (assertHttpStatusList(_0x30525b['retryableStatuses'], 'task polling retryableStatuses'),
    assertHttpStatusList(_0x30525b['terminalStatuses'], 'task polling terminalStatuses'));
}
function assertBinghuoExecutionPolicy(_0x13bf1b) {
  assertObjectKeysAllowed(_0x13bf1b, BINGHUO_EXECUTION_KEYS, 'execution');
  const _0x144c3f = String(_0x13bf1b?.['kind'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x2fa5b5 = BINGHUO_EXECUTION_POLICY[_0x144c3f];
  if (!_0x2fa5b5)
    throw new Error('[modelCatalog]\x20catalog\x20contains\x20an\x20unsupported\x20execution\x20kind');
  (assertExactValue(String(_0x13bf1b?.['adapterType'] || '')['trim'](), 'modelApi', 'execution adapterType'),
    assertExactValue(
      String(_0x13bf1b?.['method'] || '')
        ['trim']()
        ['toUpperCase'](),
      'POST',
      'execution method',
    ),
    assertExactValue(
      String(_0x13bf1b?.['endpoint'] || '')['trim'](),
      _0x2fa5b5['endpoint'],
      'execution endpoint',
    ),
    assertExactValue(
      String(_0x13bf1b?.['extensions']?.['bodyResolver'] || '')['trim'](),
      _0x2fa5b5['bodyResolver'],
      'execution bodyResolver',
    ));
  if (_0x13bf1b?.['extensions']?.['endpointResolver'] !== undefined)
    throw new Error('[modelCatalog] endpointResolver is not allowed');
  const _0x3c85b7 = _0x13bf1b?.['extensions'] || {};
  (assertObjectKeysAllowed(_0x3c85b7, BINGHUO_EXECUTION_EXTENSION_KEYS, 'execution extensions'),
    assertExactValue(
      JSON['stringify'](_0x13bf1b?.['headers'] || {}),
      JSON['stringify']({ 'Content-Type': 'application/json' }),
      'execution headers',
    ),
    assertBinghuoBodyMapping(_0x13bf1b?.['bodyMapping'], 'execution bodyMapping'),
    assertBinghuoTaskPolling(_0x13bf1b?.['extensions']?.['taskPolling'], _0x2fa5b5));
  for (const [_0x5534ab, _0x1468ec] of [
    ['imageInputUpload', 'image'],
    ['videoInputUpload', 'video'],
    ['audioInputUpload', 'audio'],
  ]) {
    assertBinghuoAssetUploadPolicy(
      _0x13bf1b?.['extensions']?.[_0x5534ab],
      'execution\x20extensions.' + _0x5534ab,
      _0x1468ec,
    );
  }
}
function assertBinghuoBundle(_0x2ade9d) {
  if (!_0x2ade9d || typeof _0x2ade9d !== 'object' || Array['isArray'](_0x2ade9d))
    throw new TypeError('[modelCatalog]\x20catalog\x20bundle\x20must\x20be\x20an\x20object');
  if (_0x2ade9d['schemaVersion'] !== '1.0')
    throw new Error('[modelCatalog] unsupported catalog schemaVersion');
  if (_0x2ade9d['sourceId'] !== BINGHUO_MODEL_CATALOG_SOURCE_ID)
    throw new Error('[modelCatalog] invalid catalog sourceId');
  if (!Number['isInteger'](_0x2ade9d['version']) || _0x2ade9d['version'] < 0x1)
    throw new Error('[modelCatalog] catalog version must be a positive integer');
  if (!Array['isArray'](_0x2ade9d['models']) || !Array['isArray'](_0x2ade9d['executions']))
    throw new Error('[modelCatalog]\x20catalog\x20models/executions\x20must\x20be\x20arrays');
  const _0x590f9b = new Set(),
    _0x565a2 = new Set();
  (_0x2ade9d['models']['forEach']((_0x15169e) => {
    const _0x475208 = String(_0x15169e?.['provider'] || '')
        ['trim']()
        ['toLowerCase'](),
      _0x51c11b = String(_0x15169e?.['modelId'] || '')['trim'](),
      _0x1c51d3 = String(_0x15169e?.['kind'] || '')
        ['trim']()
        ['toLowerCase']();
    (assertObjectKeysAllowed(_0x15169e, BINGHUO_MODEL_KEYS, 'model'),
      assertObjectKeysAllowed(
        _0x15169e?.['extensions'] || {},
        BINGHUO_MODEL_EXTENSION_KEYS[_0x1c51d3] || new Set(),
        'model extensions',
      ),
      assertBinghuoModelCatalogMetadata(
        _0x15169e?.['extensions']?.['modelCatalog'],
        'model\x20extensions.modelCatalog',
      ));
    if (
      _0x475208 !== 'binghuo' ||
      !_0x51c11b['startsWith']('binghuo/') ||
      String(_0x15169e?.['adapterType'] || '')['trim']() !== 'modelApi' ||
      _0x15169e?.['outputType'] !== _0x1c51d3
    )
      throw new Error('[modelCatalog] catalog contains a non-Binghuo model');
    _0x590f9b['add'](_0x1c51d3);
  }),
    _0x2ade9d['executions']['forEach']((_0x5f4e6a) => {
      if (
        String(_0x5f4e6a?.['provider'] || '')
          ['trim']()
          ['toLowerCase']() !== 'binghuo'
      )
        throw new Error('[modelCatalog] catalog contains a non-Binghuo execution');
      (assertBinghuoExecutionPolicy(_0x5f4e6a),
        _0x565a2['add'](
          String(_0x5f4e6a?.['kind'] || '')
            ['trim']()
            ['toLowerCase'](),
        ));
    }));
  if (!_0x590f9b['size'] || !_0x565a2['size'])
    throw new Error(
      '[modelCatalog]\x20catalog\x20must\x20include\x20at\x20least\x20one\x20executable\x20model',
    );
  return _0x2ade9d;
}
function readCache(_0x2df30a) {
  try {
    const _0x211489 = _0x2df30a?.['getItem']?.(BINGHUO_MODEL_CATALOG_CACHE_KEY);
    if (!_0x211489) return null;
    const _0x3970a0 = JSON['parse'](_0x211489);
    return _0x3970a0 && typeof _0x3970a0 === 'object' ? _0x3970a0 : null;
  } catch {
    return null;
  }
}
function removeCache(_0x368e20) {
  try {
    _0x368e20?.['removeItem']?.(BINGHUO_MODEL_CATALOG_CACHE_KEY);
  } catch {}
}
function writeCache(_0x3ffe44, _0x3ae5ce) {
  try {
    return (_0x3ffe44?.['setItem']?.(BINGHUO_MODEL_CATALOG_CACHE_KEY, JSON['stringify'](_0x3ae5ce)), !![]);
  } catch {
    return ![];
  }
}
function isCacheEligible(_0x274aff, { installId: _0x555f15, deviceId: _0xc0ef01, nowMs: _0xc97dd5 }) {
  const _0x3605e7 = normalizeExpirySeconds(_0x274aff?.['authorization']?.['expiresAt']);
  return (
    _0x274aff?.['schemaVersion'] === '1.0' &&
    _0x274aff?.['provider'] === 'binghuo' &&
    _0x274aff?.['authorization']?.['status'] === 'active' &&
    normalizeIdentity(_0x274aff?.['subject']?.['installId']) === normalizeIdentity(_0x555f15) &&
    normalizeIdentity(_0x274aff?.['subject']?.['deviceId']) === normalizeIdentity(_0xc0ef01) &&
    _0x3605e7 !== null &&
    _0x3605e7 > Math['floor'](_0xc97dd5 / 0x3e8) &&
    _0x274aff?.['bundle']?.['sourceId'] === BINGHUO_MODEL_CATALOG_SOURCE_ID
  );
}
function readCachedAuthorization(_0x240d39) {
  return { status: 'active', expiresAt: normalizeExpirySeconds(_0x240d39?.['authorization']?.['expiresAt']) };
}
function createCatalogState(_0x155a37 = {}) {
  return {
    provider: 'binghuo',
    status: 'idle',
    source: 'none',
    sourceId: '',
    version: null,
    etag: '',
    modelCount: 0x0,
    executionCount: 0x0,
    lastLoadedAt: 0x0,
    lastSyncAt: 0x0,
    error: null,
    ..._0x155a37,
  };
}
export function createModelCatalogService({
  store: _0x23bc1b,
  storage: storage = globalThis['localStorage'],
  fetchCatalog: fetchCatalog = fetchBinghuoModelCatalog,
  validateBundle: validateBundle = validateManifestBundle,
  registerBundle: registerBundle = registerManifestBundle,
  unregisterBundle: unregisterBundle = unregisterManifestBundle,
  now: now = () => Date['now'](),
} = {}) {
  let _0x28e0d4 = null,
    _0x5bc09d = 0x0;
  function _0x391353(_0x51b45c) {
    const _0x58442d = _0x23bc1b?.['getStateRaw']?.()?.['modelCatalog'] || {};
    _0x23bc1b?.['setModelCatalogState']?.({ ..._0x58442d, ...createCatalogState(), ..._0x51b45c });
  }
  function _0x577420(_0x8c5779) {
    (assertBinghuoBundle(_0x8c5779), (_0x8c5779 = withoutBinghuoCatalogPrices(_0x8c5779)));
    const _0x22b883 = _0x28e0d4;
    if (_0x22b883) unregisterBundle(_0x22b883);
    try {
      (validateBundle(_0x8c5779), registerBundle(_0x8c5779), (_0x28e0d4 = _0x8c5779));
    } catch (_0x1ff877) {
      _0x22b883 && (registerBundle(_0x22b883), (_0x28e0d4 = _0x22b883));
      throw _0x1ff877;
    }
  }
  function _0x2323c4(_0x27ffda, { source: _0x4f5610, etag: etag = '', synced: synced = ![] }) {
    const _0x20df1b = now();
    _0x391353({
      status: 'ready',
      source: _0x4f5610,
      sourceId: _0x27ffda['sourceId'],
      version: _0x27ffda['version'],
      etag: etag,
      modelCount: _0x27ffda['models']['length'],
      executionCount: _0x27ffda['executions']['length'],
      lastLoadedAt: _0x20df1b,
      lastSyncAt: synced ? _0x20df1b : 0x0,
      error: null,
    });
  }
  function _0x3849ad({
    clearCache: clearCache = ![],
    status: status = 'unavailable',
    error: error = null,
  } = {}) {
    if (_0x28e0d4) unregisterBundle(_0x28e0d4);
    _0x28e0d4 = null;
    if (clearCache) removeCache(storage);
    _0x391353({
      status: status,
      source: 'none',
      sourceId: '',
      version: null,
      etag: '',
      modelCount: 0x0,
      executionCount: 0x0,
      lastLoadedAt: 0x0,
      lastSyncAt: now(),
      error: error,
    });
  }
  function _0x5f1c07({ installId: _0x9b088e, deviceId: _0x230b1e } = {}) {
    const _0x37072d = readCache(storage);
    if (!isCacheEligible(_0x37072d, { installId: _0x9b088e, deviceId: _0x230b1e, nowMs: now() })) {
      if (_0x37072d) removeCache(storage);
      return { loaded: ![], reason: 'cache-ineligible' };
    }
    try {
      return (
        _0x577420(_0x37072d['bundle']),
        _0x2323c4(_0x37072d['bundle'], { source: 'cache', etag: String(_0x37072d['etag'] || '') }),
        { loaded: !![], bundle: _0x37072d['bundle'], authorization: readCachedAuthorization(_0x37072d) }
      );
    } catch (_0xe1f937) {
      return (
        removeCache(storage),
        _0x3849ad({ status: 'error', error: _0xe1f937?.['message'] || String(_0xe1f937) }),
        { loaded: ![], reason: 'cache-invalid', error: _0xe1f937 }
      );
    }
  }
  function _0x1a02e3({ installId: _0x4f1a89, deviceId: _0x214234, error: _0x1e66dd } = {}) {
    _0x5bc09d += 0x1;
    const _0x473799 = readCache(storage);
    if (!isCacheEligible(_0x473799, { installId: _0x4f1a89, deviceId: _0x214234, nowMs: now() })) {
      if (_0x473799) removeCache(storage);
      return (
        _0x3849ad({ status: 'error', error: _0x1e66dd?.['message'] || String(_0x1e66dd || '') }),
        { status: 'error', error: _0x1e66dd }
      );
    }
    try {
      return (
        (!_0x28e0d4 || _0x28e0d4['version'] !== _0x473799['bundle']['version']) &&
          _0x577420(_0x473799['bundle']),
        _0x2323c4(_0x473799['bundle'], {
          source: 'cache-fallback',
          etag: String(_0x473799['etag'] || ''),
          synced: !![],
        }),
        {
          status: 'cache-fallback',
          bundle: _0x473799['bundle'],
          authorization: readCachedAuthorization(_0x473799),
          error: _0x1e66dd,
        }
      );
    } catch (_0x29ce2f) {
      return (
        removeCache(storage),
        _0x3849ad({ status: 'error', error: _0x29ce2f?.['message'] || String(_0x29ce2f) }),
        { status: 'error', error: _0x29ce2f }
      );
    }
  }
  async function _0x28fd55({
    subscriptionState: _0x24f41c,
    installId: _0x336d23,
    deviceId: _0x22a0a2,
    force: force = ![],
  } = {}) {
    const _0x4b18e4 = ++_0x5bc09d,
      _0x41dd3d = now();
    if (!isActiveSubscription(_0x24f41c, _0x41dd3d))
      return (_0x3849ad({ clearCache: !![], status: 'unavailable' }), { status: 'unauthorized' });
    const _0x1d56b0 = normalizeIdentity(_0x336d23),
      _0x492095 = normalizeIdentity(_0x22a0a2);
    if (!_0x1d56b0 || !_0x492095)
      return (
        _0x3849ad({ status: 'error', error: '缺少模型目录授权主体信息' }),
        { status: 'error', error: 'missing-subject' }
      );
    const _0x3d365b = readCache(storage),
      _0x229f21 = isCacheEligible(_0x3d365b, { installId: _0x1d56b0, deviceId: _0x492095, nowMs: _0x41dd3d })
        ? _0x3d365b
        : null;
    if (_0x3d365b && !_0x229f21) removeCache(storage);
    _0x391353({
      status: _0x28e0d4 ? 'refreshing' : 'loading',
      source: _0x28e0d4 ? 'cache' : 'none',
      error: null,
    });
    try {
      let _0x2a77f2 = await fetchCatalog({
        installId: _0x1d56b0,
        deviceId: _0x492095,
        etag: force ? '' : String(_0x229f21?.['etag'] || ''),
      });
      if (_0x4b18e4 !== _0x5bc09d) return { status: 'superseded' };
      if (_0x2a77f2?.['status'] === 'not-modified' && !_0x229f21) {
        _0x2a77f2 = await fetchCatalog({ installId: _0x1d56b0, deviceId: _0x492095, etag: '' });
        if (_0x4b18e4 !== _0x5bc09d) return { status: 'superseded' };
      }
      if (_0x2a77f2?.['status'] === 'not-modified')
        return (
          (!_0x28e0d4 || _0x28e0d4['version'] !== _0x229f21['bundle']['version']) &&
            _0x577420(_0x229f21['bundle']),
          _0x2323c4(_0x229f21['bundle'], {
            source: 'cache',
            etag: _0x2a77f2['etag'] || _0x229f21['etag'],
            synced: !![],
          }),
          { status: 'not-modified', bundle: _0x229f21['bundle'] }
        );
      const _0x54e2c8 = assertBinghuoBundle(_0x2a77f2?.['bundle']);
      _0x577420(_0x54e2c8);
      const _0x26ed6a = normalizeExpirySeconds(_0x24f41c?.['expiresAt']);
      return (
        _0x26ed6a !== null && _0x26ed6a > Math['floor'](now() / 0x3e8)
          ? writeCache(storage, {
              schemaVersion: '1.0',
              provider: 'binghuo',
              subject: { installId: _0x1d56b0, deviceId: _0x492095 },
              authorization: { status: 'active', expiresAt: _0x26ed6a },
              version: _0x54e2c8['version'],
              etag: String(_0x2a77f2?.['etag'] || ''),
              cachedAt: now(),
              bundle: _0x54e2c8,
            })
          : removeCache(storage),
        _0x2323c4(_0x54e2c8, { source: 'remote', etag: String(_0x2a77f2?.['etag'] || ''), synced: !![] }),
        { status: 'updated', bundle: _0x54e2c8 }
      );
    } catch (_0x570068) {
      if (_0x4b18e4 !== _0x5bc09d) return { status: 'superseded', error: _0x570068 };
      if (_0x570068?.['status'] === 0x191 || _0x570068?.['status'] === 0x193)
        return (
          _0x3849ad({ clearCache: !![], status: 'unavailable' }),
          { status: 'unauthorized', error: _0x570068 }
        );
      if (_0x229f21)
        return (
          (!_0x28e0d4 || _0x28e0d4['version'] !== _0x229f21['bundle']['version']) &&
            _0x577420(_0x229f21['bundle']),
          _0x2323c4(_0x229f21['bundle'], { source: 'cache-fallback', etag: _0x229f21['etag'], synced: !![] }),
          { status: 'cache-fallback', bundle: _0x229f21['bundle'], error: _0x570068 }
        );
      return (
        _0x3849ad({ status: 'error', error: _0x570068?.['message'] || String(_0x570068) }),
        { status: 'error', error: _0x570068 }
      );
    }
  }
  function _0x369763() {
    ((_0x5bc09d += 0x1), _0x3849ad({ clearCache: !![], status: 'unavailable' }));
  }
  return {
    loadCachedCatalog: _0x5f1c07,
    retainCachedCatalogAfterSubscriptionError: _0x1a02e3,
    sync: _0x28fd55,
    clear: _0x369763,
  };
}
