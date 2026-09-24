import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const LEGACY_RENDERER_STORAGE_SCHEMA_VERSION = 1;

const STAGING_FILENAME = 'legacy-renderer-storage-migration.json';
const COMPLETED_FILENAME = 'legacy-renderer-storage-migration.completed.json';

export function buildLegacyRendererStorageMigrationAppUrl(appUrl, { available = false } = {}) {
  const url = new URL(String(appUrl || 'http://127.0.0.1:8777/'));
  url.searchParams.set('aicLegacyStorageMigration', available === true ? '1' : '0');
  return url.href;
}

// Runs inside the app-origin renderer window: same origin means it can read the
// legacy localStorage/IndexedDB this migration is meant to carry forward.
const LEGACY_STORAGE_EXPORT_SCRIPT = `(${async function exportLegacyRendererStorage() {
  const schemaVersion = 1;
  const maxBinaryRecordBytes = 16 * 1024 * 1024;
  const maxExportBytes = 96 * 1024 * 1024;
  let exportedBytes = 0;
  const skipped = [];
  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 32768;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }
  async function encodeValue(value, allowLargeBinary = false) {
    if (value instanceof Blob) {
      if (!allowLargeBinary && value.size > maxBinaryRecordBytes) {
        throw new Error('binary-record-too-large');
      }
      const bytes = new Uint8Array(await value.arrayBuffer());
      return {
        __aicStorageType: 'blob',
        mimeType: value.type || 'application/octet-stream',
        base64: bytesToBase64(bytes),
      };
    }
    if (value instanceof ArrayBuffer) {
      if (!allowLargeBinary && value.byteLength > maxBinaryRecordBytes) {
        throw new Error('binary-record-too-large');
      }
      return { __aicStorageType: 'array-buffer', base64: bytesToBase64(new Uint8Array(value)) };
    }
    if (ArrayBuffer.isView(value)) {
      const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      if (!allowLargeBinary && bytes.byteLength > maxBinaryRecordBytes) {
        throw new Error('binary-record-too-large');
      }
      return {
        __aicStorageType: 'typed-array',
        constructorName: value.constructor?.name || 'Uint8Array',
        base64: bytesToBase64(bytes),
      };
    }
    if (value instanceof Date) {
      return { __aicStorageType: 'date', value: value.toISOString() };
    }
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => encodeValue(item, allowLargeBinary)));
    }
    if (value && typeof value === 'object') {
      const output = {};
      for (const [key, item] of Object.entries(value)) {
        output[key] = await encodeValue(item, allowLargeBinary);
      }
      return output;
    }
    return value;
  }
  function openDatabase(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error(`Unable to open ${name}`));
      request.onblocked = () => reject(new Error(`Opening ${name} was blocked`));
    });
  }
  function readStoreEntries(db, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const entries = [];
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        entries.push({ key: cursor.key, value: cursor.value });
        cursor.continue();
      };
      request.onerror = () => reject(request.error || new Error(`Unable to read ${storeName}`));
      transaction.oncomplete = () => resolve(entries);
      transaction.onerror = () => reject(transaction.error || new Error(`Unable to read ${storeName}`));
      transaction.onabort = () => reject(transaction.error || new Error(`Unable to read ${storeName}`));
    });
  }
  const localStorageEntries = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    localStorageEntries[key] = localStorage.getItem(key);
  }
  exportedBytes += JSON.stringify(localStorageEntries).length;
  const targets = [
    { name: 'TapNowV2Cache', stores: ['workspace'] },
    { name: 'TapNowCanvasDB', stores: ['images', 'thumbnails'] },
    { name: 'AICanvasStoryboard3DAssets', stores: ['assets'] },
  ];
  let knownDatabases = null;
  if (typeof indexedDB.databases === 'function') {
    try {
      knownDatabases = new Set((await indexedDB.databases()).map((item) => item?.name).filter(Boolean));
    } catch {}
  }
  const databases = [];
  for (const target of targets) {
    if (knownDatabases && !knownDatabases.has(target.name)) continue;
    let db = null;
    try {
      db = await openDatabase(target.name);
      const stores = [];
      for (const storeName of target.stores) {
        if (!db.objectStoreNames.contains(storeName)) continue;
        const rawEntries = await readStoreEntries(db, storeName);
        const entries = [];
        const isPersistentUserData =
          target.name === 'TapNowV2Cache' || target.name === 'AICanvasStoryboard3DAssets';
        for (const rawEntry of rawEntries) {
          try {
            const encoded = {
              key: await encodeValue(rawEntry.key, isPersistentUserData),
              value: await encodeValue(rawEntry.value, isPersistentUserData),
            };
            const size = JSON.stringify(encoded).length;
            if (!isPersistentUserData && exportedBytes + size > maxExportBytes) {
              skipped.push({ database: target.name, store: storeName, reason: 'export-limit' });
              continue;
            }
            exportedBytes += size;
            entries.push(encoded);
          } catch (error) {
            skipped.push({
              database: target.name,
              store: storeName,
              reason: String(error?.message || error || 'encode-failed'),
            });
          }
        }
        const transaction = db.transaction(storeName, 'readonly');
        const objectStore = transaction.objectStore(storeName);
        stores.push({
          name: storeName,
          keyPath: objectStore.keyPath ?? null,
          autoIncrement: objectStore.autoIncrement === true,
          entries,
        });
      }
      if (stores.length > 0) databases.push({ name: target.name, version: db.version, stores });
    } catch (error) {
      skipped.push({ database: target.name, reason: String(error?.message || error) });
    } finally {
      db?.close?.();
    }
  }
  return { schemaVersion, exportedAt: Date.now(), localStorage: localStorageEntries, databases, skipped };
}})()`;

function readJsonFile(file, readFile = readFileSync) {
  try {
    const parsed = JSON.parse(readFile(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function createLegacyRendererStorageMigration({
  userDataDir,
  appUrl,
  createWindow,
  exists = existsSync,
  readFile = readFileSync,
  writeFile = writeFileSync,
  rename = renameSync,
  unlink = unlinkSync,
  now = () => Date.now(),
} = {}) {
  const resolvedUserDataDir = path.resolve(String(userDataDir || process.cwd()));
  const stagingPath = path.join(resolvedUserDataDir, STAGING_FILENAME);
  const completedPath = path.join(resolvedUserDataDir, COMPLETED_FILENAME);

  function isCompleted() {
    return exists(completedPath);
  }

  async function prepare() {
    if (isCompleted()) return { available: false, reason: 'completed' };
    if (exists(stagingPath)) return { available: true, reason: 'staged' };
    if (typeof createWindow !== 'function') return { available: false, reason: 'window-unavailable' };
    const migrationWindow = createWindow();
    try {
      const targetUrl = new URL('electron/legacyStorageMigration.html', appUrl).href;
      await migrationWindow.loadURL(targetUrl);
      const payload = await migrationWindow.webContents.executeJavaScript(
        LEGACY_STORAGE_EXPORT_SCRIPT,
        true,
      );
      if (Number(payload?.schemaVersion) !== LEGACY_RENDERER_STORAGE_SCHEMA_VERSION)
        throw new Error('Legacy renderer storage export returned an unsupported schema');
      const tempPath = stagingPath + '.tmp';
      writeFile(tempPath, JSON.stringify(payload) + '\n', 'utf8');
      rename(tempPath, stagingPath);
      return { available: true, reason: 'prepared' };
    } finally {
      migrationWindow.destroy?.();
    }
  }

  function read() {
    if (isCompleted()) return { available: false, reason: 'completed' };
    const payload = readJsonFile(stagingPath, readFile);
    if (!payload) return { available: false, reason: 'not-prepared' };
    return { available: true, payload };
  }

  function complete(summary = {}) {
    writeFile(
      completedPath,
      JSON.stringify(
        {
          schemaVersion: LEGACY_RENDERER_STORAGE_SCHEMA_VERSION,
          completedAt: now(),
          summary: summary && typeof summary === 'object' ? summary : {},
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );
    try {
      unlink(stagingPath);
    } catch {}
    return { success: true };
  }

  return Object.freeze({
    prepare,
    read,
    complete,
    stagingPath,
    completedPath,
  });
}

export const __legacyRendererStorageMigrationForTest = {
  LEGACY_STORAGE_EXPORT_SCRIPT,
  readJsonFile,
};
