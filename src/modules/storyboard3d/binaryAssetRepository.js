export const STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION = 0x1;
export const STORYBOARD_3D_BINARY_ASSET_DB_NAME = 'AICanvasStoryboard3DAssets';
export const STORYBOARD_3D_BINARY_ASSET_STORE_NAME = 'assets';
const DEFAULT_DESCRIPTOR_MAX_BYTES = 0x200 * 0x400,
  DEFAULT_GET_MANY_LIMIT = 0x1f4;
function text(_0xdba5fe) {
  return String(_0xdba5fe ?? '')['trim']();
}
function requiredText(_0x3a7a84, _0x33d30f) {
  const _0x501283 = text(_0x3a7a84);
  if (!_0x501283)
    throw new Storyboard3DBinaryAssetRepositoryError(_0x33d30f + ' is required', {
      code: 'BINARY_ASSET_INVALID_RECORD',
    });
  return _0x501283;
}
function isBlobLike(_0x56fd91) {
  return Boolean(
    _0x56fd91 &&
    typeof _0x56fd91 === 'object' &&
    typeof _0x56fd91['arrayBuffer'] === 'function' &&
    Number['isFinite'](Number(_0x56fd91['size'])),
  );
}
function isBinaryValue(_0x81b2f) {
  return isBlobLike(_0x81b2f) || _0x81b2f instanceof ArrayBuffer || ArrayBuffer['isView'](_0x81b2f);
}
function normalizePath(_0x10c236, _0x4774e5) {
  const _0x227c6b = text(_0x10c236 || _0x4774e5)
    ['replaceAll']('\x5c', '/')
    ['split']('/')
    ['filter']((_0x1cedb4) => _0x1cedb4 && _0x1cedb4 !== '.' && _0x1cedb4 !== '..')
    ['join']('/');
  return _0x227c6b || _0x4774e5;
}
function jsonDescriptor(_0x26112c, _0x3b08ba) {
  const _0xb501ad =
    _0x26112c && typeof _0x26112c === 'object' && !Array['isArray'](_0x26112c) ? _0x26112c : {};
  let _0x54aa54;
  try {
    _0x54aa54 = JSON['stringify'](_0xb501ad, (_0x10c3ad, _0x5d664c) => {
      if (isBinaryValue(_0x5d664c)) throw new TypeError('descriptor must not contain binary data');
      if (['function', 'symbol', 'bigint']['includes'](typeof _0x5d664c))
        throw new TypeError('descriptor\x20must\x20contain\x20JSON-safe\x20values\x20only');
      return _0x5d664c;
    });
  } catch (_0x31cb75) {
    throw new Storyboard3DBinaryAssetRepositoryError(
      'Invalid\x20binary\x20asset\x20descriptor:\x20' + (_0x31cb75?.['message'] || String(_0x31cb75)),
      { code: 'BINARY_ASSET_INVALID_DESCRIPTOR', cause: _0x31cb75 },
    );
  }
  const _0x44cec5 = new TextEncoder()['encode'](_0x54aa54)['byteLength'];
  if (_0x44cec5 > _0x3b08ba)
    throw new Storyboard3DBinaryAssetRepositoryError(
      'Binary asset descriptor exceeds ' + _0x3b08ba + ' bytes',
      { code: 'BINARY_ASSET_DESCRIPTOR_TOO_LARGE' },
    );
  return JSON['parse'](_0x54aa54);
}
function toBlob(_0x3d885a, _0x2fb2da = 'application/octet-stream') {
  if (isBlobLike(_0x3d885a)) return _0x3d885a;
  if (_0x3d885a instanceof ArrayBuffer || ArrayBuffer['isView'](_0x3d885a))
    return new Blob([_0x3d885a], { type: _0x2fb2da });
  return null;
}
function normalizeBinaryFile(_0x3af1f4, _0x154617, _0x452ab5 = null) {
  const _0x5cf329 = _0x3af1f4 && typeof _0x3af1f4 === 'object' && 'blob' in _0x3af1f4 ? _0x3af1f4 : {},
    _0x505846 = _0x5cf329['blob'] ?? _0x3af1f4,
    _0x447ef8 = toBlob(
      _0x505846,
      text(_0x5cf329['type'] || _0x3af1f4?.['type']) || 'application/octet-stream',
    );
  if (!_0x447ef8)
    throw new Storyboard3DBinaryAssetRepositoryError(
      _0x154617 + '\x20must\x20contain\x20a\x20Blob\x20or\x20ArrayBuffer',
      { code: 'BINARY_ASSET_INVALID_BINARY' },
    );
  const _0x572958 = _0x452ab5 == null ? 'asset.bin' : 'related-' + (_0x452ab5 + 0x1) + '.bin',
    _0x16e3bd = normalizePath(_0x5cf329['name'] || _0x3af1f4?.['name'], _0x572958)
      ['split']('/')
      ['at'](-0x1),
    _0xe4ca8e = normalizePath(
      _0x5cf329['relativePath'] || _0x5cf329['path'] || _0x3af1f4?.['webkitRelativePath'],
      _0x16e3bd,
    );
  return {
    name: _0x16e3bd,
    relativePath: _0xe4ca8e,
    type: text(_0x5cf329['type'] || _0x3af1f4?.['type'] || _0x447ef8['type']) || 'application/octet-stream',
    size: Math['max'](0x0, Number(_0x447ef8['size']) || 0x0),
    lastModified: Math['max'](0x0, Number(_0x5cf329['lastModified'] || _0x3af1f4?.['lastModified']) || 0x0),
    blob: _0x447ef8,
  };
}
function cloneRecord(_0x285206) {
  if (_0x285206 == null) return null;
  if (typeof structuredClone === 'function') return structuredClone(_0x285206);
  return {
    ..._0x285206,
    descriptor: JSON['parse'](JSON['stringify'](_0x285206['descriptor'])),
    primaryFile: { ..._0x285206['primaryFile'] },
    relatedFiles: _0x285206['relatedFiles']['map']((_0xabaa17) => ({ ..._0xabaa17 })),
  };
}
function validateRetrievedRecord(_0x29dc9e, _0xbc210d) {
  if (_0x29dc9e == null) return null;
  if (Number(_0x29dc9e['schemaVersion']) !== STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION)
    throw new Storyboard3DBinaryAssetRepositoryError(
      'Unsupported\x20stored\x203D\x20binary\x20asset\x20schema\x20version:\x20' + _0x29dc9e['schemaVersion'],
      { code: 'BINARY_ASSET_UNSUPPORTED_SCHEMA' },
    );
  return normalizeStoryboard3DBinaryAssetRecord(_0x29dc9e, {
    now: _0x29dc9e['updatedAt'],
    descriptorMaxBytes: _0xbc210d,
  });
}
export function normalizeStoryboard3DBinaryAssetRecord(
  _0x4fc170,
  { now: now = Date['now'](), descriptorMaxBytes: descriptorMaxBytes = DEFAULT_DESCRIPTOR_MAX_BYTES } = {},
) {
  if (!_0x4fc170 || typeof _0x4fc170 !== 'object' || Array['isArray'](_0x4fc170))
    throw new Storyboard3DBinaryAssetRepositoryError(
      'Binary\x20asset\x20record\x20must\x20be\x20an\x20object',
      { code: 'BINARY_ASSET_INVALID_RECORD' },
    );
  const _0x98bd44 = requiredText(_0x4fc170['assetId'], 'assetId'),
    _0x51f87b = requiredText(_0x4fc170['kind'], 'kind'),
    _0x332cc9 = normalizeBinaryFile(_0x4fc170['primaryFile'], 'primaryFile'),
    _0x356bb0 = (Array['isArray'](_0x4fc170['relatedFiles']) ? _0x4fc170['relatedFiles'] : [])['map'](
      (_0x35e3d3, _0x351180) => normalizeBinaryFile(_0x35e3d3, 'relatedFiles[' + _0x351180 + ']', _0x351180),
    ),
    _0x42f274 = new Set();
  for (const _0x4c5e4f of [_0x332cc9, ..._0x356bb0]) {
    const _0x2fe7f9 = _0x4c5e4f['relativePath']['toLocaleLowerCase']();
    if (_0x42f274['has'](_0x2fe7f9))
      throw new Storyboard3DBinaryAssetRepositoryError(
        'Duplicate binary asset file path: ' + _0x4c5e4f['relativePath'],
        { code: 'BINARY_ASSET_DUPLICATE_FILE' },
      );
    _0x42f274['add'](_0x2fe7f9);
  }
  const _0x38d522 = Math['max'](0x0, Number(now) || Date['now']());
  return {
    schemaVersion: STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION,
    assetId: _0x98bd44,
    kind: _0x51f87b,
    descriptor: jsonDescriptor(
      _0x4fc170['descriptor'],
      Math['max'](0x400, Number(descriptorMaxBytes) || DEFAULT_DESCRIPTOR_MAX_BYTES),
    ),
    primaryFile: _0x332cc9,
    relatedFiles: _0x356bb0,
    byteLength: [_0x332cc9, ..._0x356bb0]['reduce'](
      (_0x251bfc, _0x1f3adf) => _0x251bfc + _0x1f3adf['size'],
      0x0,
    ),
    createdAt: Math['max'](0x0, Number(_0x4fc170['createdAt']) || _0x38d522),
    updatedAt: _0x38d522,
  };
}
function fileReference(_0x14c15d) {
  return {
    name: _0x14c15d['name'],
    relativePath: _0x14c15d['relativePath'],
    type: _0x14c15d['type'],
    size: _0x14c15d['size'],
    lastModified: _0x14c15d['lastModified'],
  };
}
export function createStoryboard3DBinaryAssetReference(_0x464b76) {
  const _0x5e82a3 = requiredText(_0x464b76?.['assetId'], 'assetId'),
    _0xda42aa = requiredText(_0x464b76?.['kind'], 'kind');
  if (!_0x464b76?.['primaryFile'])
    throw new Storyboard3DBinaryAssetRepositoryError('primaryFile\x20is\x20required', {
      code: 'BINARY_ASSET_INVALID_RECORD',
    });
  return {
    schemaVersion: STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION,
    assetId: _0x5e82a3,
    kind: _0xda42aa,
    descriptor: jsonDescriptor(_0x464b76['descriptor'], DEFAULT_DESCRIPTOR_MAX_BYTES),
    storage: {
      driver: 'indexeddb',
      database: STORYBOARD_3D_BINARY_ASSET_DB_NAME,
      primaryFile: fileReference(_0x464b76['primaryFile']),
      relatedFiles: (_0x464b76['relatedFiles'] || [])['map'](fileReference),
      byteLength: Math['max'](0x0, Number(_0x464b76['byteLength']) || 0x0),
    },
  };
}
export class Storyboard3DBinaryAssetRepositoryError extends Error {
  constructor(
    _0xb31a04,
    {
      code: code = 'BINARY_ASSET_STORAGE_ERROR',
      operation: operation = '',
      assetId: assetId = '',
      cause: _0x3d8b8d,
    } = {},
  ) {
    (super(_0xb31a04, { cause: _0x3d8b8d }),
      (this['name'] = 'Storyboard3DBinaryAssetRepositoryError'),
      (this['code'] = code),
      (this['operation'] = operation),
      (this['assetId'] = assetId));
  }
}
function storageError(_0x566ea8, _0x3b3043, _0x497a2d = '') {
  if (_0x3b3043 instanceof Storyboard3DBinaryAssetRepositoryError) return _0x3b3043;
  const _0x19b28a = _0x3b3043?.['name'] === 'QuotaExceededError';
  return new Storyboard3DBinaryAssetRepositoryError(
    _0x19b28a
      ? 'Insufficient browser storage for 3D asset ' + (_0x497a2d || 'data')
      : 'Failed to ' +
          _0x566ea8 +
          ' 3D binary asset' +
          (_0x497a2d ? '\x20' + _0x497a2d : '') +
          ':\x20' +
          (_0x3b3043?.['message'] || String(_0x3b3043)),
    {
      code: _0x19b28a
        ? 'BINARY_ASSET_QUOTA_EXCEEDED'
        : 'BINARY_ASSET_' + _0x566ea8['toUpperCase']() + '_FAILED',
      operation: _0x566ea8,
      assetId: _0x497a2d,
      cause: _0x3b3043,
    },
  );
}
export class Storyboard3DMemoryAssetDriver {
  constructor({ records: records = new Map() } = {}) {
    this['records'] = records;
  }
  async ['put'](_0x1bb91c) {
    return (this['records']['set'](_0x1bb91c['assetId'], cloneRecord(_0x1bb91c)), cloneRecord(_0x1bb91c));
  }
  async ['get'](_0x3e555e) {
    return cloneRecord(this['records']['get'](_0x3e555e) || null);
  }
  async ['getMany'](_0x159dae) {
    return _0x159dae['map']((_0x20a233) => cloneRecord(this['records']['get'](_0x20a233) || null));
  }
  async ['remove'](_0x3fe864) {
    return this['records']['delete'](_0x3fe864);
  }
  async ['close']() {}
}
function requestResult(_0x2fe3f7) {
  return new Promise((_0xd84e5, _0x3207b9) => {
    ((_0x2fe3f7['onsuccess'] = (_0x1ac1cc) =>
      _0xd84e5(_0x1ac1cc?.['target']?.['result'] ?? _0x2fe3f7['result'] ?? null)),
      (_0x2fe3f7['onerror'] = (_0x2d95e4) =>
        _0x3207b9(
          _0x2d95e4?.['target']?.['error'] || _0x2fe3f7['error'] || new Error('IndexedDB request failed'),
        )));
  });
}
function transactionDone(_0x21a110) {
  return new Promise((_0x91f0d5, _0x2b5d98) => {
    ((_0x21a110['oncomplete'] = () => _0x91f0d5()),
      (_0x21a110['onerror'] = (_0xccb0c8) =>
        _0x2b5d98(
          _0xccb0c8?.['target']?.['error'] || _0x21a110['error'] || new Error('IndexedDB transaction failed'),
        )),
      (_0x21a110['onabort'] = (_0x5dbbd0) =>
        _0x2b5d98(
          _0x5dbbd0?.['target']?.['error'] ||
            _0x21a110['error'] ||
            new Error('IndexedDB transaction aborted'),
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
      (this['dbPromise'] = new Promise((_0x3e7865, _0x40b724) => {
        let _0x146981;
        try {
          _0x146981 = this['indexedDB']['open'](this['dbName'], this['version']);
        } catch (_0x15dfbb) {
          _0x40b724(storageError('open', _0x15dfbb));
          return;
        }
        ((_0x146981['onupgradeneeded'] = (_0x48e010) => {
          const _0x4c86c0 = _0x48e010['target']['result'];
          !_0x4c86c0['objectStoreNames']['contains'](this['storeName']) &&
            _0x4c86c0['createObjectStore'](this['storeName'], { keyPath: 'assetId' });
        }),
          (_0x146981['onsuccess'] = (_0x3a1237) => {
            const _0x42f6e6 = _0x3a1237['target']['result'];
            ((_0x42f6e6['onversionchange'] = () => {
              (_0x42f6e6['close'](), (this['dbPromise'] = null));
            }),
              _0x3e7865(_0x42f6e6));
          }),
          (_0x146981['onerror'] = (_0x40ef63) => {
            ((this['dbPromise'] = null), _0x40b724(storageError('open', _0x40ef63['target']['error'])));
          }),
          (_0x146981['onblocked'] = () => {
            ((this['dbPromise'] = null),
              _0x40b724(
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
  async ['put'](_0x414b6a) {
    const _0x4433c7 = await this['_open'](),
      _0x4c2ad7 = _0x4433c7['transaction'](this['storeName'], 'readwrite'),
      _0x5499e2 = transactionDone(_0x4c2ad7),
      _0xf9e9d6 = requestResult(_0x4c2ad7['objectStore'](this['storeName'])['put'](_0x414b6a));
    return (await Promise['all']([_0xf9e9d6, _0x5499e2]), cloneRecord(_0x414b6a));
  }
  async ['get'](_0x50bdba) {
    const _0xbeca26 = await this['_open'](),
      _0x37b714 = _0xbeca26['transaction'](this['storeName'], 'readonly'),
      _0x5a6619 = transactionDone(_0x37b714),
      _0x5f46b3 = await requestResult(_0x37b714['objectStore'](this['storeName'])['get'](_0x50bdba));
    return (await _0x5a6619, _0x5f46b3 || null);
  }
  async ['getMany'](_0x362eae) {
    const _0x509188 = await this['_open'](),
      _0x41f677 = _0x509188['transaction'](this['storeName'], 'readonly'),
      _0x8d2289 = transactionDone(_0x41f677),
      _0x2b8304 = _0x41f677['objectStore'](this['storeName']),
      _0x4bf3aa = await Promise['all'](
        _0x362eae['map']((_0xa8cdf9) => requestResult(_0x2b8304['get'](_0xa8cdf9))),
      );
    return (await _0x8d2289, _0x4bf3aa['map']((_0x3e1841) => _0x3e1841 || null));
  }
  async ['remove'](_0x1b972b) {
    const _0x486ad2 = await this['_open'](),
      _0x48b651 = _0x486ad2['transaction'](this['storeName'], 'readwrite'),
      _0x40c5fe = transactionDone(_0x48b651),
      _0x133755 = _0x48b651['objectStore'](this['storeName']),
      _0x19512a = requestResult(_0x133755['count'](_0x1b972b)),
      _0x28d215 = requestResult(_0x133755['delete'](_0x1b972b)),
      [_0x31d41c] = await Promise['all']([_0x19512a, _0x28d215, _0x40c5fe]);
    return Number(_0x31d41c) > 0x0;
  }
  async ['close']() {
    if (!this['dbPromise']) return;
    const _0xa74cfd = await this['dbPromise']['catch'](() => null);
    (_0xa74cfd?.['close']?.(), (this['dbPromise'] = null));
  }
}
export class Storyboard3DBinaryAssetRepository {
  constructor({
    driver: driver = new Storyboard3DIndexedDBAssetDriver(),
    now: now = () => Date['now'](),
    descriptorMaxBytes: descriptorMaxBytes = DEFAULT_DESCRIPTOR_MAX_BYTES,
    getManyLimit: getManyLimit = DEFAULT_GET_MANY_LIMIT,
  } = {}) {
    for (const _0x56cb30 of ['put', 'get', 'getMany', 'remove']) {
      if (typeof driver?.[_0x56cb30] !== 'function')
        throw new TypeError('Binary asset driver must implement ' + _0x56cb30 + '()');
    }
    ((this['driver'] = driver),
      (this['now'] = now),
      (this['descriptorMaxBytes'] = Math['max'](
        0x400,
        Number(descriptorMaxBytes) || DEFAULT_DESCRIPTOR_MAX_BYTES,
      )),
      (this['getManyLimit'] = Math['max'](0x1, Number(getManyLimit) || DEFAULT_GET_MANY_LIMIT)));
  }
  async ['put'](_0x4368cd) {
    let _0x25f121;
    try {
      return (
        (_0x25f121 = normalizeStoryboard3DBinaryAssetRecord(_0x4368cd, {
          now: this['now'](),
          descriptorMaxBytes: this['descriptorMaxBytes'],
        })),
        await this['driver']['put'](_0x25f121),
        cloneRecord(_0x25f121)
      );
    } catch (_0x482340) {
      throw storageError('put', _0x482340, _0x25f121?.['assetId'] || _0x4368cd?.['assetId']);
    }
  }
  async ['get'](_0x1cac7a) {
    const _0x2ba549 = requiredText(_0x1cac7a, 'assetId');
    try {
      return cloneRecord(
        validateRetrievedRecord(await this['driver']['get'](_0x2ba549), this['descriptorMaxBytes']),
      );
    } catch (_0x504873) {
      throw storageError('get', _0x504873, _0x2ba549);
    }
  }
  async ['getMany'](_0x1ab421) {
    if (!Array['isArray'](_0x1ab421))
      throw new Storyboard3DBinaryAssetRepositoryError('assetIds\x20must\x20be\x20an\x20array', {
        code: 'BINARY_ASSET_INVALID_QUERY',
        operation: 'getMany',
      });
    if (_0x1ab421['length'] > this['getManyLimit'])
      throw new Storyboard3DBinaryAssetRepositoryError(
        'getMany supports at most ' + this['getManyLimit'] + ' asset ids',
        { code: 'BINARY_ASSET_QUERY_TOO_LARGE', operation: 'getMany' },
      );
    const _0x57d9bc = _0x1ab421['map']((_0x306b06) => requiredText(_0x306b06, 'assetId'));
    try {
      return (await this['driver']['getMany'](_0x57d9bc))['map']((_0x3117a8) =>
        cloneRecord(validateRetrievedRecord(_0x3117a8, this['descriptorMaxBytes'])),
      );
    } catch (_0x2bc5a5) {
      throw storageError('getMany', _0x2bc5a5);
    }
  }
  async ['remove'](_0x2f8fb6) {
    const _0x1907b8 = requiredText(_0x2f8fb6, 'assetId');
    try {
      return await this['driver']['remove'](_0x1907b8);
    } catch (_0x3e23b1) {
      throw storageError('remove', _0x3e23b1, _0x1907b8);
    }
  }
  async ['close']() {
    await this['driver']['close']?.();
  }
}
export function createStoryboard3DBinaryAssetRepository(_0x51fa06) {
  return new Storyboard3DBinaryAssetRepository(_0x51fa06);
}
export function createStoryboard3DMemoryAssetDriver(_0x35496f) {
  return new Storyboard3DMemoryAssetDriver(_0x35496f);
}
export function createStoryboard3DIndexedDBAssetDriver(_0x438763) {
  return new Storyboard3DIndexedDBAssetDriver(_0x438763);
}
