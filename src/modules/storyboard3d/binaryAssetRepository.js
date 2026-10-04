export const STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION = 0x1;
export const STORYBOARD_3D_BINARY_ASSET_DB_NAME = 'AICanvasStoryboard3DAssets';
export const STORYBOARD_3D_BINARY_ASSET_STORE_NAME = 'assets';
const DEFAULT_DESCRIPTOR_MAX_BYTES = 0x200 * 0x400,
  DEFAULT_GET_MANY_LIMIT = 0x1f4;
function text(value) {
  return String(value ?? '')['trim']();
}
function requiredText(item, key) {
  const text2 = text(item);
  if (!text2)
    throw new Storyboard3DBinaryAssetRepositoryError(key + ' is required', {
      code: 'BINARY_ASSET_INVALID_RECORD',
    });
  return text2;
}
function isBlobLike(index) {
  return Boolean(
    index &&
    typeof index === 'object' &&
    typeof index['arrayBuffer'] === 'function' &&
    Number['isFinite'](Number(index['size'])),
  );
}
function isBinaryValue(result) {
  return isBlobLike(result) || result instanceof ArrayBuffer || ArrayBuffer['isView'](result);
}
function normalizePath(data, options) {
  const text3 = text(data || options)
    ['replaceAll']('\x5c', '/')
    ['split']('/')
    ['filter']((target) => target && target !== '.' && target !== '..')
    ['join']('/');
  return text3 || options;
}
function jsonDescriptor(source, next) {
  const current = source && typeof source === 'object' && !Array['isArray'](source) ? source : {};
  let entry;
  try {
    entry = JSON['stringify'](current, (record, payload) => {
      if (isBinaryValue(payload)) throw new TypeError('descriptor must not contain binary data');
      if (['function', 'symbol', 'bigint']['includes'](typeof payload))
        throw new TypeError('descriptor\x20must\x20contain\x20JSON-safe\x20values\x20only');
      return payload;
    });
  } catch (cause) {
    throw new Storyboard3DBinaryAssetRepositoryError(
      'Invalid\x20binary\x20asset\x20descriptor:\x20' + (cause?.['message'] || String(cause)),
      { code: 'BINARY_ASSET_INVALID_DESCRIPTOR', cause: cause },
    );
  }
  const textEncoder = new TextEncoder()['encode'](entry)['byteLength'];
  if (textEncoder > next)
    throw new Storyboard3DBinaryAssetRepositoryError('Binary asset descriptor exceeds ' + next + ' bytes', {
      code: 'BINARY_ASSET_DESCRIPTOR_TOO_LARGE',
    });
  return JSON['parse'](entry);
}
function toBlob(handle, type = 'application/octet-stream') {
  if (isBlobLike(handle)) return handle;
  if (handle instanceof ArrayBuffer || ArrayBuffer['isView'](handle))
    return new Blob([handle], { type: type });
  return null;
}
function normalizeBinaryFile(error, state, config = null) {
  const error2 = error && typeof error === 'object' && 'blob' in error ? error : {},
    scope = error2['blob'] ?? error,
    blob = toBlob(scope, text(error2['type'] || error?.['type']) || 'application/octet-stream');
  if (!blob)
    throw new Storyboard3DBinaryAssetRepositoryError(
      state + '\x20must\x20contain\x20a\x20Blob\x20or\x20ArrayBuffer',
      { code: 'BINARY_ASSET_INVALID_BINARY' },
    );
  const input = config == null ? 'asset.bin' : 'related-' + (config + 0x1) + '.bin',
    name = normalizePath(error2['name'] || error?.['name'], input)
      ['split']('/')
      ['at'](-0x1),
    relativePath = normalizePath(
      error2['relativePath'] || error2['path'] || error?.['webkitRelativePath'],
      name,
    );
  return {
    name: name,
    relativePath: relativePath,
    type: text(error2['type'] || error?.['type'] || blob['type']) || 'application/octet-stream',
    size: Math['max'](0x0, Number(blob['size']) || 0x0),
    lastModified: Math['max'](0x0, Number(error2['lastModified'] || error?.['lastModified']) || 0x0),
    blob: blob,
  };
}
function cloneRecord(relatedFiles) {
  if (relatedFiles == null) return null;
  if (typeof structuredClone === 'function') return structuredClone(relatedFiles);
  return {
    ...relatedFiles,
    descriptor: JSON['parse'](JSON['stringify'](relatedFiles['descriptor'])),
    primaryFile: { ...relatedFiles['primaryFile'] },
    relatedFiles: relatedFiles['relatedFiles']['map']((args) => ({ ...args })),
  };
}
function validateRetrievedRecord(now2, descriptorMaxBytes2) {
  if (now2 == null) return null;
  if (Number(now2['schemaVersion']) !== STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION)
    throw new Storyboard3DBinaryAssetRepositoryError(
      'Unsupported\x20stored\x203D\x20binary\x20asset\x20schema\x20version:\x20' + now2['schemaVersion'],
      { code: 'BINARY_ASSET_UNSUPPORTED_SCHEMA' },
    );
  return normalizeStoryboard3DBinaryAssetRecord(now2, {
    now: now2['updatedAt'],
    descriptorMaxBytes: descriptorMaxBytes2,
  });
}
export function normalizeStoryboard3DBinaryAssetRecord(
  enabled,
  { now: now = Date['now'](), descriptorMaxBytes: descriptorMaxBytes = DEFAULT_DESCRIPTOR_MAX_BYTES } = {},
) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled))
    throw new Storyboard3DBinaryAssetRepositoryError(
      'Binary\x20asset\x20record\x20must\x20be\x20an\x20object',
      { code: 'BINARY_ASSET_INVALID_RECORD' },
    );
  const assetId2 = requiredText(enabled['assetId'], 'assetId'),
    kind = requiredText(enabled['kind'], 'kind'),
    primaryFile = normalizeBinaryFile(enabled['primaryFile'], 'primaryFile'),
    relatedFiles2 = (Array['isArray'](enabled['relatedFiles']) ? enabled['relatedFiles'] : [])['map'](
      (output, value2) => normalizeBinaryFile(output, 'relatedFiles[' + value2 + ']', value2),
    ),
    map = new Set();
  for (const value3 of [primaryFile, ...relatedFiles2]) {
    const value4 = value3['relativePath']['toLocaleLowerCase']();
    if (map['has'](value4))
      throw new Storyboard3DBinaryAssetRepositoryError(
        'Duplicate binary asset file path: ' + value3['relativePath'],
        { code: 'BINARY_ASSET_DUPLICATE_FILE' },
      );
    map['add'](value4);
  }
  const updatedAt = Math['max'](0x0, Number(now) || Date['now']());
  return {
    schemaVersion: STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION,
    assetId: assetId2,
    kind: kind,
    descriptor: jsonDescriptor(
      enabled['descriptor'],
      Math['max'](0x400, Number(descriptorMaxBytes) || DEFAULT_DESCRIPTOR_MAX_BYTES),
    ),
    primaryFile: primaryFile,
    relatedFiles: relatedFiles2,
    byteLength: [primaryFile, ...relatedFiles2]['reduce']((value5, value6) => value5 + value6['size'], 0x0),
    createdAt: Math['max'](0x0, Number(enabled['createdAt']) || updatedAt),
    updatedAt: updatedAt,
  };
}
function fileReference(name2) {
  return {
    name: name2['name'],
    relativePath: name2['relativePath'],
    type: name2['type'],
    size: name2['size'],
    lastModified: name2['lastModified'],
  };
}
export function createStoryboard3DBinaryAssetReference(enabled2) {
  const assetId3 = requiredText(enabled2?.['assetId'], 'assetId'),
    kind2 = requiredText(enabled2?.['kind'], 'kind');
  if (!enabled2?.['primaryFile'])
    throw new Storyboard3DBinaryAssetRepositoryError('primaryFile\x20is\x20required', {
      code: 'BINARY_ASSET_INVALID_RECORD',
    });
  return {
    schemaVersion: STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION,
    assetId: assetId3,
    kind: kind2,
    descriptor: jsonDescriptor(enabled2['descriptor'], DEFAULT_DESCRIPTOR_MAX_BYTES),
    storage: {
      driver: 'indexeddb',
      database: STORYBOARD_3D_BINARY_ASSET_DB_NAME,
      primaryFile: fileReference(enabled2['primaryFile']),
      relatedFiles: (enabled2['relatedFiles'] || [])['map'](fileReference),
      byteLength: Math['max'](0x0, Number(enabled2['byteLength']) || 0x0),
    },
  };
}
export class Storyboard3DBinaryAssetRepositoryError extends Error {
  constructor(
    value7,
    {
      code: code = 'BINARY_ASSET_STORAGE_ERROR',
      operation: operation = '',
      assetId: assetId = '',
      cause: cause2,
    } = {},
  ) {
    (super(value7, { cause: cause2 }),
      (this['name'] = 'Storyboard3DBinaryAssetRepositoryError'),
      (this['code'] = code),
      (this['operation'] = operation),
      (this['assetId'] = assetId));
  }
}
function storageError(operation2, cause3, assetId4 = '') {
  if (cause3 instanceof Storyboard3DBinaryAssetRepositoryError) return cause3;
  const code2 = cause3?.['name'] === 'QuotaExceededError';
  return new Storyboard3DBinaryAssetRepositoryError(
    code2
      ? 'Insufficient browser storage for 3D asset ' + (assetId4 || 'data')
      : 'Failed to ' +
          operation2 +
          ' 3D binary asset' +
          (assetId4 ? '\x20' + assetId4 : '') +
          ':\x20' +
          (cause3?.['message'] || String(cause3)),
    {
      code: code2 ? 'BINARY_ASSET_QUOTA_EXCEEDED' : 'BINARY_ASSET_' + operation2['toUpperCase']() + '_FAILED',
      operation: operation2,
      assetId: assetId4,
      cause: cause3,
    },
  );
}
export class Storyboard3DMemoryAssetDriver {
  constructor({ records: records = new Map() } = {}) {
    this['records'] = records;
  }
  async ['put'](value8) {
    return (this['records']['set'](value8['assetId'], cloneRecord(value8)), cloneRecord(value8));
  }
  async ['get'](value9) {
    return cloneRecord(this['records']['get'](value9) || null);
  }
  async ['getMany'](list) {
    return list['map']((value10) => cloneRecord(this['records']['get'](value10) || null));
  }
  async ['remove'](value11) {
    return this['records']['delete'](value11);
  }
  async ['close']() {}
}
function requestResult(value12) {
  return new Promise((handler, handler2) => {
    ((value12['onsuccess'] = (event) => handler(event?.['target']?.['result'] ?? value12['result'] ?? null)),
      (value12['onerror'] = (event2) =>
        handler2(
          event2?.['target']?.['error'] || value12['error'] || new Error('IndexedDB request failed'),
        )));
  });
}
function transactionDone(value13) {
  return new Promise((handler3, handler4) => {
    ((value13['oncomplete'] = () => handler3()),
      (value13['onerror'] = (event3) =>
        handler4(
          event3?.['target']?.['error'] || value13['error'] || new Error('IndexedDB transaction failed'),
        )),
      (value13['onabort'] = (event4) =>
        handler4(
          event4?.['target']?.['error'] || value13['error'] || new Error('IndexedDB transaction aborted'),
        )));
  });
}
export class Storyboard3DIndexedDBAssetDriver {
  constructor({
    indexedDB: indexedDB = globalThis['indexedDB'],
    dbName: dbName = STORYBOARD_3D_BINARY_ASSET_DB_NAME,
    storeName: storeName = STORYBOARD_3D_BINARY_ASSET_STORE_NAME,
    version: version = STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION,
  } = {}) {
    ((this['indexedDB'] = indexedDB),
      (this['dbName'] = dbName),
      (this['storeName'] = storeName),
      (this['version'] = version),
      (this['dbPromise'] = null));
  }
  ['_open']() {
    if (this['dbPromise']) return this['dbPromise'];
    if (!this['indexedDB']?.['open'])
      return Promise['reject'](
        new Storyboard3DBinaryAssetRepositoryError('IndexedDB is unavailable in this browser runtime', {
          code: 'BINARY_ASSET_STORAGE_UNAVAILABLE',
          operation: 'open',
        }),
      );
    return (
      (this['dbPromise'] = new Promise((handler5, handler6) => {
        let value14;
        try {
          value14 = this['indexedDB']['open'](this['dbName'], this['version']);
        } catch (value15) {
          handler6(storageError('open', value15));
          return;
        }
        ((value14['onupgradeneeded'] = (event5) => {
          const enabled3 = event5['target']['result'];
          !enabled3['objectStoreNames']['contains'](this['storeName']) &&
            enabled3['createObjectStore'](this['storeName'], { keyPath: 'assetId' });
        }),
          (value14['onsuccess'] = (event6) => {
            const value16 = event6['target']['result'];
            ((value16['onversionchange'] = () => {
              (value16['close'](), (this['dbPromise'] = null));
            }),
              handler5(value16));
          }),
          (value14['onerror'] = (event7) => {
            ((this['dbPromise'] = null), handler6(storageError('open', event7['target']['error'])));
          }),
          (value14['onblocked'] = () => {
            ((this['dbPromise'] = null),
              handler6(
                new Storyboard3DBinaryAssetRepositoryError(
                  '3D binary asset database upgrade is blocked by another open window',
                  { code: 'BINARY_ASSET_STORAGE_BLOCKED', operation: 'open' },
                ),
              ));
          }));
      })),
      this['dbPromise']
    );
  }
  async ['put'](value17) {
    const value18 = await this['_open'](),
      value19 = value18['transaction'](this['storeName'], 'readwrite'),
      transactionDone2 = transactionDone(value19),
      requestResult2 = requestResult(value19['objectStore'](this['storeName'])['put'](value17));
    return (await Promise['all']([requestResult2, transactionDone2]), cloneRecord(value17));
  }
  async ['get'](value20) {
    const value21 = await this['_open'](),
      value22 = value21['transaction'](this['storeName'], 'readonly'),
      transactionDone3 = transactionDone(value22),
      requestResult3 = await requestResult(value22['objectStore'](this['storeName'])['get'](value20));
    return (await transactionDone3, requestResult3 || null);
  }
  async ['getMany'](list2) {
    const value23 = await this['_open'](),
      value24 = value23['transaction'](this['storeName'], 'readonly'),
      transactionDone4 = transactionDone(value24),
      map2 = value24['objectStore'](this['storeName']),
      list3 = await Promise['all'](list2['map']((value25) => requestResult(map2['get'](value25))));
    return (await transactionDone4, list3['map']((value26) => value26 || null));
  }
  async ['remove'](value27) {
    const value28 = await this['_open'](),
      value29 = value28['transaction'](this['storeName'], 'readwrite'),
      transactionDone5 = transactionDone(value29),
      map3 = value29['objectStore'](this['storeName']),
      requestResult4 = requestResult(map3['count'](value27)),
      requestResult5 = requestResult(map3['delete'](value27)),
      [value30] = await Promise['all']([requestResult4, requestResult5, transactionDone5]);
    return Number(value30) > 0x0;
  }
  async ['close']() {
    if (!this['dbPromise']) return;
    const value31 = await this['dbPromise']['catch'](() => null);
    (value31?.['close']?.(), (this['dbPromise'] = null));
  }
}
export class Storyboard3DBinaryAssetRepository {
  constructor({
    driver: driver = new Storyboard3DIndexedDBAssetDriver(),
    now: now = () => Date['now'](),
    descriptorMaxBytes: descriptorMaxBytes = DEFAULT_DESCRIPTOR_MAX_BYTES,
    getManyLimit: getManyLimit = DEFAULT_GET_MANY_LIMIT,
  } = {}) {
    for (const value32 of ['put', 'get', 'getMany', 'remove']) {
      if (typeof driver?.[value32] !== 'function')
        throw new TypeError('Binary asset driver must implement ' + value32 + '()');
    }
    ((this['driver'] = driver),
      (this['now'] = now),
      (this['descriptorMaxBytes'] = Math['max'](
        0x400,
        Number(descriptorMaxBytes) || DEFAULT_DESCRIPTOR_MAX_BYTES,
      )),
      (this['getManyLimit'] = Math['max'](0x1, Number(getManyLimit) || DEFAULT_GET_MANY_LIMIT)));
  }
  async ['put'](value33) {
    let storyboard3DBinaryAssetRecord;
    try {
      return (
        (storyboard3DBinaryAssetRecord = normalizeStoryboard3DBinaryAssetRecord(value33, {
          now: this['now'](),
          descriptorMaxBytes: this['descriptorMaxBytes'],
        })),
        await this['driver']['put'](storyboard3DBinaryAssetRecord),
        cloneRecord(storyboard3DBinaryAssetRecord)
      );
    } catch (value34) {
      throw storageError('put', value34, storyboard3DBinaryAssetRecord?.['assetId'] || value33?.['assetId']);
    }
  }
  async ['get'](value35) {
    const requiredText2 = requiredText(value35, 'assetId');
    try {
      return cloneRecord(
        validateRetrievedRecord(await this['driver']['get'](requiredText2), this['descriptorMaxBytes']),
      );
    } catch (value36) {
      throw storageError('get', value36, requiredText2);
    }
  }
  async ['getMany'](list4) {
    if (!Array['isArray'](list4))
      throw new Storyboard3DBinaryAssetRepositoryError('assetIds\x20must\x20be\x20an\x20array', {
        code: 'BINARY_ASSET_INVALID_QUERY',
        operation: 'getMany',
      });
    if (list4['length'] > this['getManyLimit'])
      throw new Storyboard3DBinaryAssetRepositoryError(
        'getMany supports at most ' + this['getManyLimit'] + ' asset ids',
        { code: 'BINARY_ASSET_QUERY_TOO_LARGE', operation: 'getMany' },
      );
    const value37 = list4['map']((value38) => requiredText(value38, 'assetId'));
    try {
      return (await this['driver']['getMany'](value37))['map']((value39) =>
        cloneRecord(validateRetrievedRecord(value39, this['descriptorMaxBytes'])),
      );
    } catch (value40) {
      throw storageError('getMany', value40);
    }
  }
  async ['remove'](value41) {
    const requiredText3 = requiredText(value41, 'assetId');
    try {
      return await this['driver']['remove'](requiredText3);
    } catch (value42) {
      throw storageError('remove', value42, requiredText3);
    }
  }
  async ['close']() {
    await this['driver']['close']?.();
  }
}
export function createStoryboard3DBinaryAssetRepository(value43) {
  return new Storyboard3DBinaryAssetRepository(value43);
}
export function createStoryboard3DMemoryAssetDriver(value44) {
  return new Storyboard3DMemoryAssetDriver(value44);
}
export function createStoryboard3DIndexedDBAssetDriver(value45) {
  return new Storyboard3DIndexedDBAssetDriver(value45);
}
