import { desktopBridge } from './desktopBridge.js';
import { createMigrationDeadline } from './legacyStorageMigrationDeadline.js';
const LEGACY_RENDERER_STORAGE_MIGRATION_COMPLETED_KEY = 'aic_legacy_renderer_storage_migration_completed';
function readMigrationAvailabilityHint(value = globalThis.location) {
  try {
    const uRLSearchParams = new URLSearchParams(value?.search || '').get('aicLegacyStorageMigration');
    if (uRLSearchParams === '1') return true;
    if (uRLSearchParams === '0') return false;
  } catch {}
  return null;
}
function hasCompletedMigrationMarker(item) {
  try {
    return item?.getItem?.(LEGACY_RENDERER_STORAGE_MIGRATION_COMPLETED_KEY) === '1';
  } catch {
    return false;
  }
}
function markMigrationCompleted(key) {
  try {
    key?.setItem?.(LEGACY_RENDERER_STORAGE_MIGRATION_COMPLETED_KEY, '1');
  } catch {}
}
function base64ToBytes(index) {
  const list = atob(String(index || '')),
    uint8Array = new Uint8Array(list.length);
  for (let result = 0; result < list.length; result += 1) {
    uint8Array[result] = list.charCodeAt(result);
  }
  return uint8Array;
}
export function decodeLegacyStorageValue(el) {
  if (Array.isArray(el)) return el.map((data) => decodeLegacyStorageValue(data));
  if (!el || typeof el !== 'object') return el;
  const options = String(el.__aicStorageType || '');
  if (options === 'blob')
    return new Blob([base64ToBytes(el.base64)], {
      type: String(el.mimeType || 'application/octet-stream'),
    });
  if (options === 'array-buffer') return base64ToBytes(el.base64).buffer;
  if (options === 'typed-array') {
    const bytes = base64ToBytes(el.base64),
      handler = globalThis[String(el.constructorName || '')] || Uint8Array;
    try {
      return new handler(bytes.buffer.slice(0));
    } catch {
      return bytes;
    }
  }
  if (options === 'date') return new Date(el.value);
  return Object.fromEntries(
    Object.entries(el).map(([target, source]) => [target, decodeLegacyStorageValue(source)]),
  );
}
export function applyLegacyLocalStorage(enabled, enabled2 = globalThis.localStorage) {
  if (!enabled2 || !enabled || typeof enabled !== 'object') return 0;
  let next = 0;
  for (const [current, entry] of Object.entries(enabled)) {
    if (enabled2.getItem(current) !== null || entry === null || entry === undefined) continue;
    (enabled2.setItem(current, String(entry)), (next += 1));
  }
  return next;
}
function openDatabase(record, payload, handle, state, el2) {
  return new Promise((handler2, handler3) => {
    el2?.throwIfAborted();
    const config = handle ? record.open(payload, handle) : record.open(payload);
    let scope = false;
    const run = (input) => {
        ((scope = true), el2?.removeEventListener('abort', output));
        try {
          config.transaction?.abort();
        } catch {}
        handler3(input);
      },
      output = () => run(el2.reason);
    (el2?.addEventListener('abort', output, { once: true }),
      (config.onupgradeneeded = (event) => {
        if (scope || el2?.aborted) {
          try {
            config.transaction?.abort();
          } catch {}
          return;
        }
        try {
          state?.(event.target.result);
        } catch (value2) {
          run(value2);
        }
      }),
      (config.onsuccess = () => {
        el2?.removeEventListener('abort', output);
        if (scope || el2?.aborted) {
          config.result.close();
          return;
        }
        handler2(config.result);
      }),
      (config.onerror = () => run(config.error || new Error('Unable to open ' + payload))),
      (config.onblocked = () => run(new Error('Opening ' + payload + ' was blocked'))));
  });
}
function createMissingStores(value3, value4) {
  for (const error of value4 || []) {
    if (!error?.name || value3.objectStoreNames.contains(error.name)) continue;
    const value5 = {};
    if (error.keyPath !== null && error.keyPath !== undefined) value5.keyPath = error.keyPath;
    if (error.autoIncrement === true) value5.autoIncrement = true;
    value3.createObjectStore(error.name, value5);
  }
}
async function openDatabaseForImport(value6, error2, value7) {
  let openDatabase2 = await openDatabase(
    value6,
    error2.name,
    0,
    (value8) => createMissingStores(value8, error2.stores),
    value7,
  );
  const enabled3 = (error2.stores || []).some(
    (error3) => error3?.name && !openDatabase2.objectStoreNames.contains(error3.name),
  );
  if (!enabled3) return openDatabase2;
  const value9 = Math.max(1, Number(openDatabase2.version || 0) + 1);
  return (
    openDatabase2.close(),
    (openDatabase2 = await openDatabase(
      value6,
      error2.name,
      value9,
      (value10) => createMissingStores(value10, error2.stores),
      value7,
    )),
    openDatabase2
  );
}
function mergeStoreEntries(value11, error4, el3) {
  const list2 = Array.isArray(error4?.entries) ? error4.entries : [];
  if (!error4?.name || list2.length === 0) return Promise.resolve(0);
  return new Promise((handler4, handler5) => {
    el3?.throwIfAborted();
    const value12 = value11.transaction(error4.name, 'readwrite'),
      handler6 = () => {
        try {
          value12.abort();
        } catch {}
      };
    el3?.addEventListener('abort', handler6, { once: true });
    const run2 = (value13) => {
        el3?.removeEventListener('abort', handler6);
        if (value13) handler5(value13);
        else handler4(value14);
      },
      map = value12.objectStore(error4.name);
    let value14 = 0;
    ((value12.oncomplete = () => run2(el3?.aborted ? el3.reason : null)),
      (value12.onerror = () => run2(value12.error || new Error('Unable to import ' + error4.name))),
      (value12.onabort = () =>
        run2(
          el3?.reason || value12.error || new Error('Unable to import ' + error4.name),
        )));
    try {
      for (const el4 of list2) {
        const decodeLegacyStorageValue2 = decodeLegacyStorageValue(el4?.key),
          decodeLegacyStorageValue3 = decodeLegacyStorageValue(el4?.value),
          value15 = map.get(decodeLegacyStorageValue2);
        ((value15.onsuccess = () => {
          if (el3?.aborted || value15.result !== undefined) return;
          try {
            if (map.keyPath === null) map.put(decodeLegacyStorageValue3, decodeLegacyStorageValue2);
            else map.put(decodeLegacyStorageValue3);
            value14 += 1;
          } catch (value16) {
            (handler6(), run2(value16));
          }
        }),
          (value15.onerror = handler6));
      }
    } catch (value17) {
      (handler6(), run2(value17));
    }
  });
}
export async function importLegacyIndexedDatabases(
  list3,
  enabled4 = globalThis.indexedDB,
  { signal: signal } = {},
) {
  if (!Array.isArray(list3) || list3.length === 0) return 0;
  if (!enabled4?.open) throw new Error('IndexedDB is unavailable for storage migration');
  let value18 = 0;
  for (const error5 of list3) {
    if (!error5?.name) continue;
    signal?.throwIfAborted();
    const openDatabaseForImport2 = await openDatabaseForImport(enabled4, error5, signal);
    try {
      for (const value19 of error5.stores || []) {
        value18 += await mergeStoreEntries(openDatabaseForImport2, value19, signal);
      }
    } finally {
      openDatabaseForImport2.close();
    }
  }
  return value18;
}
export async function migrateLegacyRendererStorageIfNeeded({
  bridge: bridge = desktopBridge.storageMigration,
  storage: storage = globalThis.localStorage,
  indexedDBApi: indexedDBApi = globalThis.indexedDB,
  importDatabases: importDatabases = importLegacyIndexedDatabases,
  locationObject: locationObject = globalThis.location,
  timeoutMs: timeoutMs,
} = {}) {
  if (!bridge?.isAvailable?.()) return { migrated: false, reason: 'unavailable' };
  const migrationAvailabilityHint = readMigrationAvailabilityHint(locationObject);
  if (migrationAvailabilityHint === false) return { migrated: false, reason: 'not-staged' };
  if (hasCompletedMigrationMarker(storage)) return { migrated: false, reason: 'completed' };
  const signal2 = createMigrationDeadline(timeoutMs);
  try {
    const reason = await signal2.wait(() => bridge.read());
    if (!reason?.available || !reason.payload)
      return (
        reason?.reason === 'completed' && markMigrationCompleted(storage),
        { migrated: false, reason: reason?.reason || 'not-staged' }
      );
    const indexedDbCount = await signal2.wait(() =>
      importDatabases(reason.payload.databases, indexedDBApi, { signal: signal2.signal }),
    );
    signal2.signal.throwIfAborted();
    const localStorageCount = applyLegacyLocalStorage(reason.payload.localStorage, storage),
      args = {
        localStorageCount: localStorageCount,
        indexedDbCount: indexedDbCount,
        skippedCount: Array.isArray(reason.payload.skipped)
          ? reason.payload.skipped.length
          : 0,
      };
    return (
      await signal2.wait(() => bridge.complete(args)),
      signal2.signal.throwIfAborted(),
      markMigrationCompleted(storage),
      { migrated: true, ...args }
    );
  } catch (error6) {
    return (
      console.warn('[storageMigration] legacy Electron storage migration failed:', error6),
      { migrated: false, reason: 'failed', error: String(error6?.message || error6) }
    );
  } finally {
    signal2.dispose();
  }
}
