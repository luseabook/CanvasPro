import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORYBOARD_3D_BINARY_ASSET_DB_NAME,
  STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION,
  STORYBOARD_3D_BINARY_ASSET_STORE_NAME,
  Storyboard3DBinaryAssetRepository,
  Storyboard3DBinaryAssetRepositoryError,
  Storyboard3DIndexedDBAssetDriver,
  Storyboard3DMemoryAssetDriver,
  createStoryboard3DBinaryAssetReference,
  createStoryboard3DBinaryAssetRepository,
  createStoryboard3DIndexedDBAssetDriver,
  createStoryboard3DMemoryAssetDriver,
  normalizeStoryboard3DBinaryAssetRecord,
} from './binaryAssetRepository.js';

function isRepositoryError(error, code) {
  return error instanceof Storyboard3DBinaryAssetRepositoryError && error.code === code;
}

function file(name, bytes, extra = {}) {
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' }),
    name: name,
    ...extra,
  };
}

function record(overrides = {}) {
  return {
    assetId: 'asset-1',
    kind: 'gltf',
    descriptor: { name: 'model.glb' },
    primaryFile: file('model.glb', [1, 2, 3]),
    ...overrides,
  };
}

function makeRequest(resolve) {
  const request = { onsuccess: null, onerror: null, result: undefined };
  queueMicrotask(() => {
    const outcome = resolve();
    if (outcome && outcome.error) {
      request.error = outcome.error;
      request.onerror?.({ target: request });
      return;
    }
    request.result = outcome ? outcome.result : undefined;
    request.onsuccess?.({ target: request });
  });
  return request;
}

function makeTransaction(storeName, mode, { records, fail = false } = {}) {
  const transaction = { storeName, mode, oncomplete: null, onerror: null, onabort: null };
  queueMicrotask(() => {
    if (fail) transaction.onerror?.({ target: { error: new Error('transaction failed') } });
    else transaction.oncomplete?.();
  });
  transaction.objectStore = () => ({
    put: (value) =>
      makeRequest(() => {
        records.set(value.assetId, value);
        return { result: value.assetId };
      }),
    get: (assetId) => makeRequest(() => ({ result: records.get(assetId) })),
    count: () => makeRequest(() => ({ result: records.size })),
    delete: (assetId) =>
      makeRequest(() => {
        records.delete(assetId);
        return { result: undefined };
      }),
  });
  return transaction;
}

function makeFakeIndexedDB({ existingStores = [], blocked = false, openThrows, openError } = {}) {
  const calls = { open: [], created: [], closed: 0 };
  const storeNames = new Set(existingStores);
  const database = {
    objectStoreNames: { contains: (name) => storeNames.has(name) },
    createObjectStore: (name, options) => {
      calls.created.push({ name, options });
      storeNames.add(name);
      return {};
    },
    close: () => {
      calls.closed += 1;
    },
  };
  database.transaction = (storeName, mode) => makeTransaction(storeName, mode, { records: calls.records });
  calls.database = database;
  calls.records = new Map();
  return {
    calls,
    api: {
      open(dbName, version) {
        calls.open.push({ dbName, version });
        if (openThrows) throw openThrows;
        const request = {
          result: database,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
          onblocked: null,
        };
        queueMicrotask(() => {
          if (blocked) {
            request.onblocked?.();
            return;
          }
          if (openError) {
            request.onerror?.({ target: { error: openError } });
            return;
          }
          request.onupgradeneeded?.({ target: { result: database } });
          request.onsuccess?.({ target: { result: database } });
        });
        return request;
      },
    },
  };
}

test('二进制资产仓库：常量与错误类默认值', () => {
  assert.equal(STORYBOARD_3D_BINARY_ASSET_SCHEMA_VERSION, 1);
  assert.equal(STORYBOARD_3D_BINARY_ASSET_DB_NAME, 'AICanvasStoryboard3DAssets');
  assert.equal(STORYBOARD_3D_BINARY_ASSET_STORE_NAME, 'assets');

  const bare = new Storyboard3DBinaryAssetRepositoryError('boom');
  assert.equal(bare.name, 'Storyboard3DBinaryAssetRepositoryError');
  assert.equal(bare.code, 'BINARY_ASSET_STORAGE_ERROR');
  assert.equal(bare.operation, '');
  assert.equal(bare.assetId, '');
  assert.ok(bare instanceof Error);

  const cause = new Error('inner');
  const detailed = new Storyboard3DBinaryAssetRepositoryError('wrapped', {
    code: 'CUSTOM',
    operation: 'get',
    assetId: 'asset-1',
    cause: cause,
  });
  assert.equal(detailed.code, 'CUSTOM');
  assert.equal(detailed.operation, 'get');
  assert.equal(detailed.assetId, 'asset-1');
  assert.equal(detailed.cause, cause);
});

test('二进制资产仓库：Blob 主文件与相关文件归一化', () => {
  const normalized = normalizeStoryboard3DBinaryAssetRecord(
    {
      assetId: '  asset-1  ',
      kind: ' gltf ',
      descriptor: { name: 'model.glb' },
      primaryFile: file('model.glb', [1, 2, 3], { lastModified: 42 }),
      relatedFiles: [file('tex.png', [4, 5], { relativePath: 'textures/tex.png' })],
    },
    { now: 1000 },
  );
  assert.equal(normalized.schemaVersion, 1);
  assert.equal(normalized.assetId, 'asset-1');
  assert.equal(normalized.kind, 'gltf');
  assert.deepEqual(normalized.descriptor, { name: 'model.glb' });
  assert.equal(normalized.primaryFile.name, 'model.glb');
  assert.equal(normalized.primaryFile.relativePath, 'model.glb');
  assert.equal(normalized.primaryFile.size, 3);
  assert.equal(normalized.primaryFile.lastModified, 42);
  assert.equal(normalized.primaryFile.type, 'application/octet-stream');
  assert.equal(normalized.relatedFiles.length, 1);
  assert.equal(normalized.relatedFiles[0].name, 'tex.png');
  assert.equal(normalized.relatedFiles[0].relativePath, 'textures/tex.png');
  assert.equal(normalized.byteLength, 5);
  assert.equal(normalized.createdAt, 1000);
  assert.equal(normalized.updatedAt, 1000);
});

test('二进制资产仓库：无名称文件回落 asset.bin / related-N.bin，路径分隔符归一', () => {
  const normalized = normalizeStoryboard3DBinaryAssetRecord(
    {
      assetId: 'a',
      kind: 'k',
      primaryFile: { blob: new Blob([new Uint8Array([1])]), relativePath: '..\\nested//..\\model.glb' },
      relatedFiles: [
        { blob: new Blob([new Uint8Array([2])]) },
        { blob: new Blob([new Uint8Array([3])]), path: './textures\\albedo.png' },
      ],
    },
    { now: 5 },
  );
  assert.equal(normalized.primaryFile.name, 'asset.bin');
  assert.equal(normalized.primaryFile.relativePath, 'nested/model.glb');
  assert.equal(normalized.relatedFiles[0].name, 'related-1.bin');
  assert.equal(normalized.relatedFiles[0].relativePath, 'related-1.bin');
  assert.equal(normalized.relatedFiles[0].size, 1);
  assert.equal(normalized.relatedFiles[1].name, 'related-2.bin');
  assert.equal(normalized.relatedFiles[1].relativePath, 'textures/albedo.png');
  assert.equal(normalized.byteLength, 3);
});

test('二进制资产仓库：ArrayBuffer 与视图作为主文件', () => {
  const fromBuffer = normalizeStoryboard3DBinaryAssetRecord(
    { assetId: 'a', kind: 'k', primaryFile: new ArrayBuffer(8) },
    { now: 1 },
  );
  assert.equal(fromBuffer.primaryFile.name, 'asset.bin');
  assert.equal(fromBuffer.primaryFile.size, 8);
  assert.equal(fromBuffer.primaryFile.type, 'application/octet-stream');

  const fromView = normalizeStoryboard3DBinaryAssetRecord(
    { assetId: 'a', kind: 'k', primaryFile: new Uint8Array(new ArrayBuffer(16), 4, 8) },
    { now: 1 },
  );
  assert.equal(fromView.primaryFile.size, 8);
});

test('二进制资产仓库：非对象入参与缺少必填字段', () => {
  for (const input of [null, undefined, 'x', 7, [], () => {}]) {
    assert.throws(
      () => normalizeStoryboard3DBinaryAssetRecord(input),
      (error) => isRepositoryError(error, 'BINARY_ASSET_INVALID_RECORD'),
    );
  }
  assert.throws(
    () => normalizeStoryboard3DBinaryAssetRecord({ kind: 'k', primaryFile: file('a', [1]) }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_RECORD') && error.message === 'assetId is required',
  );
  assert.throws(
    () => normalizeStoryboard3DBinaryAssetRecord({ assetId: 'a', primaryFile: file('a', [1]) }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_RECORD') && error.message === 'kind is required',
  );
});

test('二进制资产仓库：主文件缺少二进制内容', () => {
  assert.throws(
    () => normalizeStoryboard3DBinaryAssetRecord({ assetId: 'a', kind: 'k', primaryFile: { name: 'a.bin' } }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_BINARY') &&
      error.message === 'primaryFile must contain a Blob or ArrayBuffer',
  );
  assert.throws(
    () =>
      normalizeStoryboard3DBinaryAssetRecord({
        assetId: 'a',
        kind: 'k',
        primaryFile: file('a', [1]),
        relatedFiles: [{ name: 'b.bin' }],
      }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_BINARY') &&
      error.message === 'relatedFiles[0] must contain a Blob or ArrayBuffer',
  );
});

test('二进制资产仓库：描述符必须为 JSON 安全值', () => {
  assert.throws(
    () =>
      normalizeStoryboard3DBinaryAssetRecord({
        assetId: 'a',
        kind: 'k',
        primaryFile: file('a', [1]),
        descriptor: { buffer: new ArrayBuffer(4) },
      }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_DESCRIPTOR') &&
      /descriptor must not contain binary data/.test(error.message) &&
      error.cause instanceof TypeError,
  );
  assert.throws(
    () =>
      normalizeStoryboard3DBinaryAssetRecord({
        assetId: 'a',
        kind: 'k',
        primaryFile: file('a', [1]),
        descriptor: { handler: () => {} },
      }),
    (error) => isRepositoryError(error, 'BINARY_ASSET_INVALID_DESCRIPTOR'),
  );
  const nonObject = normalizeStoryboard3DBinaryAssetRecord({
    assetId: 'a',
    kind: 'k',
    primaryFile: file('a', [1]),
    descriptor: 'not-an-object',
  });
  assert.deepEqual(nonObject.descriptor, {});
});

test('二进制资产仓库：描述符超限抛出 BINARY_ASSET_DESCRIPTOR_TOO_LARGE', () => {
  assert.throws(
    () =>
      normalizeStoryboard3DBinaryAssetRecord(
        {
          assetId: 'a',
          kind: 'k',
          primaryFile: file('a', [1]),
          descriptor: { pad: 'x'.repeat(2000) },
        },
        { descriptorMaxBytes: 1024 },
      ),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_DESCRIPTOR_TOO_LARGE') &&
      error.message === 'Binary asset descriptor exceeds 1024 bytes',
  );
  const allowed = normalizeStoryboard3DBinaryAssetRecord(
    { assetId: 'a', kind: 'k', primaryFile: file('a', [1]), descriptor: { pad: 'x'.repeat(2000) } },
    { descriptorMaxBytes: 4096 },
  );
  assert.equal(allowed.descriptor.pad.length, 2000);
});

test('二进制资产仓库：重复文件路径（大小写不敏感）抛出 BINARY_ASSET_DUPLICATE_FILE', () => {
  assert.throws(
    () =>
      normalizeStoryboard3DBinaryAssetRecord({
        assetId: 'a',
        kind: 'k',
        primaryFile: file('A.BIN', [1]),
        relatedFiles: [file('a.bin', [2], { relativePath: 'A.Bin' })],
      }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_DUPLICATE_FILE') &&
      error.message === 'Duplicate binary asset file path: A.Bin',
  );
});

test('二进制资产仓库：内存驱动往返、getMany 与克隆隔离', async () => {
  const driver = new Storyboard3DMemoryAssetDriver();
  const repository = new Storyboard3DBinaryAssetRepository({ driver: driver, now: () => 1000 });
  const stored = await repository.put(record());
  assert.equal(stored.assetId, 'asset-1');
  assert.equal(stored.createdAt, 1000);

  const loaded = await repository.get(' asset-1 ');
  assert.equal(loaded.assetId, 'asset-1');
  assert.equal(loaded.byteLength, 3);
  loaded.descriptor.name = 'mutated';
  loaded.primaryFile.size = 999;
  const reloaded = await repository.get('asset-1');
  assert.equal(reloaded.descriptor.name, 'model.glb');
  assert.equal(reloaded.primaryFile.size, 3);
  assert.notEqual(reloaded.primaryFile, loaded.primaryFile);

  await repository.put(record({ assetId: 'asset-2', primaryFile: file('b.bin', [1, 2]) }));
  const many = await repository.getMany(['asset-2', 'missing', 'asset-1']);
  assert.equal(many.length, 3);
  assert.equal(many[0].assetId, 'asset-2');
  assert.equal(many[1], null);
  assert.equal(many[2].assetId, 'asset-1');

  assert.equal(await repository.remove('asset-2'), true);
  assert.equal(await repository.remove('asset-2'), false);
  assert.equal(await repository.get('asset-2'), null);
  await repository.close();
});

test('二进制资产仓库：getMany 参数校验与上限', async () => {
  const repository = createStoryboard3DBinaryAssetRepository({
    driver: createStoryboard3DMemoryAssetDriver(),
    getManyLimit: 2,
  });
  await assert.rejects(
    repository.getMany('asset-1'),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_QUERY') && error.message === 'assetIds must be an array',
  );
  await assert.rejects(
    repository.getMany(['a', 'b', 'c']),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_QUERY_TOO_LARGE') &&
      error.message === 'getMany supports at most 2 asset ids',
  );
  await assert.rejects(repository.getMany(['a', '']), (error) =>
    isRepositoryError(error, 'BINARY_ASSET_INVALID_RECORD'),
  );
});

test('二进制资产仓库：schema 版本不符与缺记录', async () => {
  const driver = new Storyboard3DMemoryAssetDriver({
    records: new Map([
      [
        'legacy',
        { schemaVersion: 2, assetId: 'legacy', kind: 'k', descriptor: {}, primaryFile: {}, relatedFiles: [] },
      ],
    ]),
  });
  const repository = new Storyboard3DBinaryAssetRepository({ driver: driver });
  await assert.rejects(repository.get('legacy'), (error) =>
    isRepositoryError(error, 'BINARY_ASSET_UNSUPPORTED_SCHEMA'),
  );
  assert.equal(await repository.get('unknown'), null);
  await assert.rejects(
    repository.get(''),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_RECORD') && error.message === 'assetId is required',
  );
});

test('二进制资产仓库：驱动接口校验与存储错误包装', async () => {
  assert.throws(
    () => new Storyboard3DBinaryAssetRepository({ driver: { get: () => {} } }),
    (error) => error instanceof TypeError && error.message === 'Binary asset driver must implement put()',
  );

  const failing = new Storyboard3DBinaryAssetRepository({
    driver: {
      put: () => Promise.reject(new Error('disk full')),
      get: () => Promise.resolve(null),
      getMany: () => Promise.resolve([]),
      remove: () => Promise.resolve(true),
      close: () => Promise.resolve(),
    },
    now: () => 1,
  });
  await assert.rejects(
    failing.put(record()),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_PUT_FAILED') &&
      error.operation === 'put' &&
      error.assetId === 'asset-1' &&
      error.message === 'Failed to put 3D binary asset asset-1: disk full',
  );

  const quotaError = new Error('quota');
  quotaError.name = 'QuotaExceededError';
  const quota = new Storyboard3DBinaryAssetRepository({
    driver: {
      put: () => Promise.reject(quotaError),
      get: () => Promise.resolve(null),
      getMany: () => Promise.resolve([]),
      remove: () => Promise.resolve(true),
      close: () => Promise.resolve(),
    },
    now: () => 1,
  });
  await assert.rejects(
    quota.put(record()),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_QUOTA_EXCEEDED') &&
      error.message === 'Insufficient browser storage for 3D asset asset-1' &&
      error.cause === quotaError,
  );
});

test('二进制资产仓库：IndexedDB 驱动开库、缓存与失败分支', async () => {
  const plain = makeFakeIndexedDB();
  const driver = new Storyboard3DIndexedDBAssetDriver({ indexedDB: plain.api });
  const database = await driver._open();
  assert.equal(database, plain.calls.database);
  assert.equal(plain.calls.open.length, 1);
  assert.equal(plain.calls.open[0].dbName, STORYBOARD_3D_BINARY_ASSET_DB_NAME);
  assert.equal(plain.calls.open[0].version, 1);
  assert.equal(plain.calls.created.length, 1);
  assert.deepEqual(plain.calls.created[0].options, { keyPath: 'assetId' });
  assert.equal(await driver._open(), database);
  assert.equal(plain.calls.open.length, 1);

  plain.calls.database.onversionchange();
  assert.equal(plain.calls.closed, 1);
  await driver._open();
  assert.equal(plain.calls.open.length, 2);
  await driver.close();
  assert.equal(plain.calls.closed, 2);
  await driver.close();

  const existing = makeFakeIndexedDB({ existingStores: [STORYBOARD_3D_BINARY_ASSET_STORE_NAME] });
  await new Storyboard3DIndexedDBAssetDriver({ indexedDB: existing.api })._open();
  assert.equal(existing.calls.created.length, 0);

  await assert.rejects(
    new Storyboard3DIndexedDBAssetDriver({ indexedDB: null })._open(),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_STORAGE_UNAVAILABLE') &&
      error.operation === 'open' &&
      error.message === 'IndexedDB is unavailable in this browser runtime',
  );
  await assert.rejects(
    new Storyboard3DIndexedDBAssetDriver({ indexedDB: makeFakeIndexedDB({ blocked: true }).api })._open(),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_STORAGE_BLOCKED') &&
      error.message === '3D binary asset database upgrade is blocked by another open window',
  );
  await assert.rejects(
    new Storyboard3DIndexedDBAssetDriver({
      indexedDB: makeFakeIndexedDB({ openError: new Error('io') }).api,
    })._open(),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_OPEN_FAILED') &&
      error.message === 'Failed to open 3D binary asset: io',
  );
  await assert.rejects(
    new Storyboard3DIndexedDBAssetDriver({
      indexedDB: makeFakeIndexedDB({ openThrows: new Error('threw') }).api,
    })._open(),
    (error) => isRepositoryError(error, 'BINARY_ASSET_OPEN_FAILED') && error.cause instanceof Error,
  );
});

test('二进制资产仓库：IndexedDB 驱动读写走事务', async () => {
  const fake = makeFakeIndexedDB();
  const driver = createStoryboard3DIndexedDBAssetDriver({ indexedDB: fake.api, version: 3 });
  const normalized = normalizeStoryboard3DBinaryAssetRecord(record(), { now: 7 });
  const stored = await driver.put(normalized);
  assert.equal(stored.assetId, 'asset-1');
  assert.equal(fake.calls.records.get('asset-1').kind, 'gltf');

  const loaded = await driver.get('asset-1');
  assert.equal(loaded.kind, 'gltf');
  assert.equal(await driver.get('missing'), null);

  const many = await driver.getMany(['asset-1', 'missing']);
  assert.equal(many.length, 2);
  assert.equal(many[0].assetId, 'asset-1');
  assert.equal(many[1], null);

  assert.equal(await driver.remove('asset-1'), true);
  assert.equal(await driver.remove('asset-1'), false);
  assert.equal(fake.calls.open[0].version, 3);
  await driver.close();
  assert.equal(fake.calls.closed, 1);
});

test('二进制资产仓库：引用描述与工厂函数', () => {
  const reference = createStoryboard3DBinaryAssetReference({
    assetId: ' asset-9 ',
    kind: 'panorama',
    descriptor: { width: 2048 },
    primaryFile: {
      name: 'sky.jpg',
      relativePath: 'pano/sky.jpg',
      type: 'image/jpeg',
      size: 120,
      lastModified: 9,
    },
    relatedFiles: [{ name: 'thumb.jpg', relativePath: 'pano/thumb.jpg', type: 'image/jpeg', size: 20 }],
    byteLength: 140,
  });
  assert.equal(reference.schemaVersion, 1);
  assert.equal(reference.assetId, 'asset-9');
  assert.equal(reference.kind, 'panorama');
  assert.equal(reference.storage.driver, 'indexeddb');
  assert.equal(reference.storage.database, STORYBOARD_3D_BINARY_ASSET_DB_NAME);
  assert.equal(reference.storage.byteLength, 140);
  assert.deepEqual(reference.storage.primaryFile, {
    name: 'sky.jpg',
    relativePath: 'pano/sky.jpg',
    type: 'image/jpeg',
    size: 120,
    lastModified: 9,
  });
  assert.equal(reference.storage.relatedFiles.length, 1);
  assert.equal(reference.storage.byteLength, 140);

  assert.throws(
    () => createStoryboard3DBinaryAssetReference({ assetId: 'a', kind: 'k' }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_RECORD') && error.message === 'primaryFile is required',
  );
  assert.throws(
    () => createStoryboard3DBinaryAssetReference({ kind: 'k', primaryFile: { name: 'a' } }),
    (error) =>
      isRepositoryError(error, 'BINARY_ASSET_INVALID_RECORD') && error.message === 'assetId is required',
  );

  assert.ok(createStoryboard3DMemoryAssetDriver() instanceof Storyboard3DMemoryAssetDriver);
  assert.ok(
    createStoryboard3DBinaryAssetRepository({ driver: createStoryboard3DMemoryAssetDriver() }) instanceof
      Storyboard3DBinaryAssetRepository,
  );
  assert.ok(
    createStoryboard3DIndexedDBAssetDriver({ indexedDB: makeFakeIndexedDB().api }) instanceof
      Storyboard3DIndexedDBAssetDriver,
  );
});
