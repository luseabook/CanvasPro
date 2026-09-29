import { desktopBridge } from './desktopBridge.js';
import { createMigrationDeadline } from './legacyStorageMigrationDeadline.js';
const LEGACY_RENDERER_STORAGE_MIGRATION_COMPLETED_KEY = 'aic_legacy_renderer_storage_migration_completed';
function readMigrationAvailabilityHint(_0x3049b0 = globalThis['location']) {
  try {
    const _0x4e165e = new URLSearchParams(_0x3049b0?.['search'] || '')['get']('aicLegacyStorageMigration');
    if (_0x4e165e === '1') return !![];
    if (_0x4e165e === '0') return ![];
  } catch {}
  return null;
}
function hasCompletedMigrationMarker(_0x4efc27) {
  try {
    return _0x4efc27?.['getItem']?.(LEGACY_RENDERER_STORAGE_MIGRATION_COMPLETED_KEY) === '1';
  } catch {
    return ![];
  }
}
function markMigrationCompleted(_0x11c934) {
  try {
    _0x11c934?.['setItem']?.(LEGACY_RENDERER_STORAGE_MIGRATION_COMPLETED_KEY, '1');
  } catch {}
}
function base64ToBytes(_0x457da1) {
  const _0x15ac4c = atob(String(_0x457da1 || '')),
    _0x38eddb = new Uint8Array(_0x15ac4c['length']);
  for (let _0x2d7506 = 0x0; _0x2d7506 < _0x15ac4c['length']; _0x2d7506 += 0x1) {
    _0x38eddb[_0x2d7506] = _0x15ac4c['charCodeAt'](_0x2d7506);
  }
  return _0x38eddb;
}
export function decodeLegacyStorageValue(_0x4af727) {
  if (Array['isArray'](_0x4af727))
    return _0x4af727['map']((_0x2924da) => decodeLegacyStorageValue(_0x2924da));
  if (!_0x4af727 || typeof _0x4af727 !== 'object') return _0x4af727;
  const _0xa38ede = String(_0x4af727['__aicStorageType'] || '');
  if (_0xa38ede === 'blob')
    return new Blob([base64ToBytes(_0x4af727['base64'])], {
      type: String(_0x4af727['mimeType'] || 'application/octet-stream'),
    });
  if (_0xa38ede === 'array-buffer') return base64ToBytes(_0x4af727['base64'])['buffer'];
  if (_0xa38ede === 'typed-array') {
    const _0x3e3b88 = base64ToBytes(_0x4af727['base64']),
      _0x2de5ae = globalThis[String(_0x4af727['constructorName'] || '')] || Uint8Array;
    try {
      return new _0x2de5ae(_0x3e3b88['buffer']['slice'](0x0));
    } catch {
      return _0x3e3b88;
    }
  }
  if (_0xa38ede === 'date') return new Date(_0x4af727['value']);
  return Object['fromEntries'](
    Object['entries'](_0x4af727)['map'](([_0x2eff1c, _0x48cf89]) => [
      _0x2eff1c,
      decodeLegacyStorageValue(_0x48cf89),
    ]),
  );
}
export function applyLegacyLocalStorage(_0xc3415f, _0x3001ab = globalThis['localStorage']) {
  if (!_0x3001ab || !_0xc3415f || typeof _0xc3415f !== 'object') return 0x0;
  let _0x1d36f3 = 0x0;
  for (const [_0x3041b9, _0x35f4a4] of Object['entries'](_0xc3415f)) {
    if (_0x3001ab['getItem'](_0x3041b9) !== null || _0x35f4a4 === null || _0x35f4a4 === undefined) continue;
    (_0x3001ab['setItem'](_0x3041b9, String(_0x35f4a4)), (_0x1d36f3 += 0x1));
  }
  return _0x1d36f3;
}
function openDatabase(_0x335b79, _0x3700b2, _0x57c881, _0x336c40, _0x738cc3) {
  return new Promise((_0xd2009e, _0x1ced9d) => {
    _0x738cc3?.['throwIfAborted']();
    const _0x59bccc = _0x57c881 ? _0x335b79['open'](_0x3700b2, _0x57c881) : _0x335b79['open'](_0x3700b2);
    let _0x5a4262 = ![];
    const _0xea331c = (_0x4e8241) => {
        ((_0x5a4262 = !![]), _0x738cc3?.['removeEventListener']('abort', _0x39d04d));
        try {
          _0x59bccc['transaction']?.['abort']();
        } catch {}
        _0x1ced9d(_0x4e8241);
      },
      _0x39d04d = () => _0xea331c(_0x738cc3['reason']);
    (_0x738cc3?.['addEventListener']('abort', _0x39d04d, { once: !![] }),
      (_0x59bccc['onupgradeneeded'] = (_0x2d1c49) => {
        if (_0x5a4262 || _0x738cc3?.['aborted']) {
          try {
            _0x59bccc['transaction']?.['abort']();
          } catch {}
          return;
        }
        try {
          _0x336c40?.(_0x2d1c49['target']['result']);
        } catch (_0x3dbbb3) {
          _0xea331c(_0x3dbbb3);
        }
      }),
      (_0x59bccc['onsuccess'] = () => {
        _0x738cc3?.['removeEventListener']('abort', _0x39d04d);
        if (_0x5a4262 || _0x738cc3?.['aborted']) {
          _0x59bccc['result']['close']();
          return;
        }
        _0xd2009e(_0x59bccc['result']);
      }),
      (_0x59bccc['onerror'] = () =>
        _0xea331c(_0x59bccc['error'] || new Error('Unable to open ' + _0x3700b2))),
      (_0x59bccc['onblocked'] = () => _0xea331c(new Error('Opening ' + _0x3700b2 + ' was blocked'))));
  });
}
function createMissingStores(_0x59bf7e, _0x54f186) {
  for (const _0x3bb26f of _0x54f186 || []) {
    if (!_0x3bb26f?.['name'] || _0x59bf7e['objectStoreNames']['contains'](_0x3bb26f['name'])) continue;
    const _0x1b1553 = {};
    if (_0x3bb26f['keyPath'] !== null && _0x3bb26f['keyPath'] !== undefined)
      _0x1b1553['keyPath'] = _0x3bb26f['keyPath'];
    if (_0x3bb26f['autoIncrement'] === !![]) _0x1b1553['autoIncrement'] = !![];
    _0x59bf7e['createObjectStore'](_0x3bb26f['name'], _0x1b1553);
  }
}
async function openDatabaseForImport(_0x595517, _0x4d3439, _0x20b55f) {
  let _0x2ffb35 = await openDatabase(
    _0x595517,
    _0x4d3439['name'],
    0x0,
    (_0x4f6a81) => createMissingStores(_0x4f6a81, _0x4d3439['stores']),
    _0x20b55f,
  );
  const _0x81ca15 = (_0x4d3439['stores'] || [])['some'](
    (_0x16cf6c) => _0x16cf6c?.['name'] && !_0x2ffb35['objectStoreNames']['contains'](_0x16cf6c['name']),
  );
  if (!_0x81ca15) return _0x2ffb35;
  const _0x5e2098 = Math['max'](0x1, Number(_0x2ffb35['version'] || 0x0) + 0x1);
  return (
    _0x2ffb35['close'](),
    (_0x2ffb35 = await openDatabase(
      _0x595517,
      _0x4d3439['name'],
      _0x5e2098,
      (_0x4bfeb2) => createMissingStores(_0x4bfeb2, _0x4d3439['stores']),
      _0x20b55f,
    )),
    _0x2ffb35
  );
}
function mergeStoreEntries(_0x3321e4, _0x2217b5, _0x21b217) {
  const _0x536b25 = Array['isArray'](_0x2217b5?.['entries']) ? _0x2217b5['entries'] : [];
  if (!_0x2217b5?.['name'] || _0x536b25['length'] === 0x0) return Promise['resolve'](0x0);
  return new Promise((_0x587726, _0x589fca) => {
    _0x21b217?.['throwIfAborted']();
    const _0x32c2c8 = _0x3321e4['transaction'](_0x2217b5['name'], 'readwrite'),
      _0xfa3230 = () => {
        try {
          _0x32c2c8['abort']();
        } catch {}
      };
    _0x21b217?.['addEventListener']('abort', _0xfa3230, { once: !![] });
    const _0x3301e9 = (_0x4635d9) => {
        _0x21b217?.['removeEventListener']('abort', _0xfa3230);
        if (_0x4635d9) _0x589fca(_0x4635d9);
        else _0x587726(_0x43f0f3);
      },
      _0x12468f = _0x32c2c8['objectStore'](_0x2217b5['name']);
    let _0x43f0f3 = 0x0;
    ((_0x32c2c8['oncomplete'] = () => _0x3301e9(_0x21b217?.['aborted'] ? _0x21b217['reason'] : null)),
      (_0x32c2c8['onerror'] = () =>
        _0x3301e9(_0x32c2c8['error'] || new Error('Unable to import ' + _0x2217b5['name']))),
      (_0x32c2c8['onabort'] = () =>
        _0x3301e9(
          _0x21b217?.['reason'] ||
            _0x32c2c8['error'] ||
            new Error('Unable\x20to\x20import\x20' + _0x2217b5['name']),
        )));
    try {
      for (const _0x1505d3 of _0x536b25) {
        const _0x42bde8 = decodeLegacyStorageValue(_0x1505d3?.['key']),
          _0x4a2dd4 = decodeLegacyStorageValue(_0x1505d3?.['value']),
          _0x2ec2d9 = _0x12468f['get'](_0x42bde8);
        ((_0x2ec2d9['onsuccess'] = () => {
          if (_0x21b217?.['aborted'] || _0x2ec2d9['result'] !== undefined) return;
          try {
            if (_0x12468f['keyPath'] === null) _0x12468f['put'](_0x4a2dd4, _0x42bde8);
            else _0x12468f['put'](_0x4a2dd4);
            _0x43f0f3 += 0x1;
          } catch (_0x374486) {
            (_0xfa3230(), _0x3301e9(_0x374486));
          }
        }),
          (_0x2ec2d9['onerror'] = _0xfa3230));
      }
    } catch (_0x63f857) {
      (_0xfa3230(), _0x3301e9(_0x63f857));
    }
  });
}
export async function importLegacyIndexedDatabases(
  _0x3f8cfd,
  _0x413a81 = globalThis['indexedDB'],
  { signal: _0x4843fe } = {},
) {
  if (!Array['isArray'](_0x3f8cfd) || _0x3f8cfd['length'] === 0x0) return 0x0;
  if (!_0x413a81?.['open']) throw new Error('IndexedDB is unavailable for storage migration');
  let _0x44f33e = 0x0;
  for (const _0xa4797e of _0x3f8cfd) {
    if (!_0xa4797e?.['name']) continue;
    _0x4843fe?.['throwIfAborted']();
    const _0x2088d0 = await openDatabaseForImport(_0x413a81, _0xa4797e, _0x4843fe);
    try {
      for (const _0x426861 of _0xa4797e['stores'] || []) {
        _0x44f33e += await mergeStoreEntries(_0x2088d0, _0x426861, _0x4843fe);
      }
    } finally {
      _0x2088d0['close']();
    }
  }
  return _0x44f33e;
}
export async function migrateLegacyRendererStorageIfNeeded({
  bridge: bridge = desktopBridge['storageMigration'],
  storage: storage = globalThis['localStorage'],
  indexedDBApi: indexedDBApi = globalThis['indexedDB'],
  importDatabases: importDatabases = importLegacyIndexedDatabases,
  locationObject: locationObject = globalThis['location'],
  timeoutMs: _0x4c291b,
} = {}) {
  if (!bridge?.['isAvailable']?.()) return { migrated: ![], reason: 'unavailable' };
  const _0x5853af = readMigrationAvailabilityHint(locationObject);
  if (_0x5853af === ![]) return { migrated: ![], reason: 'not-staged' };
  if (hasCompletedMigrationMarker(storage)) return { migrated: ![], reason: 'completed' };
  const _0x3fbc68 = createMigrationDeadline(_0x4c291b);
  try {
    const _0x42c765 = await _0x3fbc68['wait'](() => bridge['read']());
    if (!_0x42c765?.['available'] || !_0x42c765['payload'])
      return (
        _0x42c765?.['reason'] === 'completed' && markMigrationCompleted(storage),
        { migrated: ![], reason: _0x42c765?.['reason'] || 'not-staged' }
      );
    const _0xf3a7e0 = await _0x3fbc68['wait'](() =>
      importDatabases(_0x42c765['payload']['databases'], indexedDBApi, { signal: _0x3fbc68['signal'] }),
    );
    _0x3fbc68['signal']['throwIfAborted']();
    const _0x528bc2 = applyLegacyLocalStorage(_0x42c765['payload']['localStorage'], storage),
      _0x42c8dc = {
        localStorageCount: _0x528bc2,
        indexedDbCount: _0xf3a7e0,
        skippedCount: Array['isArray'](_0x42c765['payload']['skipped'])
          ? _0x42c765['payload']['skipped']['length']
          : 0x0,
      };
    return (
      await _0x3fbc68['wait'](() => bridge['complete'](_0x42c8dc)),
      _0x3fbc68['signal']['throwIfAborted'](),
      markMigrationCompleted(storage),
      { migrated: !![], ..._0x42c8dc }
    );
  } catch (_0x5844d0) {
    return (
      console['warn']('[storageMigration] legacy Electron storage migration failed:', _0x5844d0),
      { migrated: ![], reason: 'failed', error: String(_0x5844d0?.['message'] || _0x5844d0) }
    );
  } finally {
    _0x3fbc68['dispose']();
  }
}
