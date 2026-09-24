import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import * as three from '../panoramaSceneNode/threeRuntime.js';
import {
  DEFAULT_STORYBOARD_3D_ASSET_DATABASE,
  DEFAULT_STORYBOARD_3D_ASSET_STORE,
  STORYBOARD_3D_ASSET_RECORD_VERSION,
  createCanonicalStoryboard3DAssetId,
  createStoryboard3DAssetRecord,
  createStoryboard3DIndexedDbAssetReference,
} from './assetRecord.js';

const SAMPLE_BYTES = [1, 2, 3, 4, 5];

function fileStub(bytes = SAMPLE_BYTES, { name = 'model.glb', type = 'model/gltf-binary' } = {}) {
  const data = Uint8Array.from(bytes);
  return { name, type, size: data.length, arrayBuffer: async () => data.buffer };
}

function sha256Hex(bytes) {
  return createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

test('资产记录：版本号与默认库存储常量', () => {
  assert.equal(STORYBOARD_3D_ASSET_RECORD_VERSION, 1);
  assert.equal(DEFAULT_STORYBOARD_3D_ASSET_DATABASE, 'ai-canvaspro');
  assert.equal(DEFAULT_STORYBOARD_3D_ASSET_STORE, 'storyboard3d-assets');
});

test('资产记录：规范化资产 id 使用 SHA-256 小写十六进制', async () => {
  const id = await createCanonicalStoryboard3DAssetId(fileStub());
  assert.equal(id, 'asset:sha256:' + sha256Hex(SAMPLE_BYTES));
  assert.match(id, /^asset:sha256:[0-9a-f]{64}$/);

  const empty = await createCanonicalStoryboard3DAssetId(fileStub([], { name: 'e.bin' }));
  assert.equal(empty, 'asset:sha256:' + sha256Hex([]));
});

test('资产记录：规范化资产 id 守卫不可读文件与缺失摘要能力', async () => {
  await assert.rejects(
    () => createCanonicalStoryboard3DAssetId({ name: 'x.glb' }),
    /Asset file is unreadable/,
  );
  await assert.rejects(
    () => createCanonicalStoryboard3DAssetId(fileStub(), { cryptoObject: {} }),
    /SHA-256 support is unavailable/,
  );
  await assert.rejects(
    () => createCanonicalStoryboard3DAssetId(fileStub(), { cryptoObject: null }),
    /SHA-256 support is unavailable/,
  );
});

test('资产记录：IndexedDB 引用默认值与键校验', () => {
  assert.deepEqual(createStoryboard3DIndexedDbAssetReference({ key: ' asset:sha256:aa ' }), {
    kind: 'indexeddb',
    databaseName: DEFAULT_STORYBOARD_3D_ASSET_DATABASE,
    storeName: DEFAULT_STORYBOARD_3D_ASSET_STORE,
    key: 'asset:sha256:aa',
  });
  assert.deepEqual(
    createStoryboard3DIndexedDbAssetReference({ databaseName: '  db2 ', storeName: '  ', key: 'k' }),
    { kind: 'indexeddb', databaseName: 'db2', storeName: DEFAULT_STORYBOARD_3D_ASSET_STORE, key: 'k' },
  );
  for (const key of ['', '   ', null, undefined]) {
    assert.throws(
      () => createStoryboard3DIndexedDbAssetReference({ key }),
      /IndexedDB asset key is required/,
    );
  }
});

test('资产记录：显式包围盒与 normalize 结果入账', async () => {
  const record = await createStoryboard3DAssetRecord({
    file: fileStub([9, 9], { name: 'hero.glb' }),
    format: 'GLB',
    parsed: { bounds: { min: { x: -1, y: 0, z: -2 }, max: { x: 3, y: 4, z: 2 } }, triangleCount: 12.7 },
    normalization: { status: 'ready', uniformScale: 2.5 },
    canonicalAssetId: 'asset:sha256:deadbeef',
    createdAt: 1234.9,
  });
  assert.equal(record.version, 1);
  assert.equal(record.canonicalAssetId, 'asset:sha256:deadbeef');
  assert.equal(record.name, 'hero.glb');
  assert.equal(record.sourceFormat, 'glb');
  assert.deepEqual(record.source, {
    fileName: 'hero.glb',
    mimeType: 'model/gltf-binary',
    byteLength: 2,
  });
  assert.deepEqual(record.storage, {
    kind: 'indexeddb',
    databaseName: DEFAULT_STORYBOARD_3D_ASSET_DATABASE,
    storeName: DEFAULT_STORYBOARD_3D_ASSET_STORE,
    key: 'asset:sha256:deadbeef',
  });
  assert.deepEqual(record.bounds, {
    min: { x: -1, y: 0, z: -2 },
    max: { x: 3, y: 4, z: 2 },
  });
  assert.equal(record.triangleCount, 12);
  assert.equal(record.defaultScale, 2.5);
  assert.equal(record.normalizationStatus, 'ready');
  assert.equal(record.createdAt, 1234.9);
  assert.deepEqual(record.limitations, [
    'Draco 压缩模型需要调用方配置 DRACOLoader。',
    'Meshopt 压缩模型需要调用方配置 MeshoptDecoder。',
    'KTX2 纹理需要调用方配置 KTX2Loader。',
  ]);
});

test('资产记录：来自 scene 的包围盒与三角面计数', async () => {
  const mesh = new three.Mesh(new three.BoxGeometry(1, 1, 1), new three.MeshBasicMaterial());
  const record = await createStoryboard3DAssetRecord({
    file: fileStub([1], { name: 'cube.glb' }),
    format: 'glb',
    parsed: { scene: mesh },
    normalization: { status: 'awaiting-bounds' },
    canonicalAssetId: 'asset:sha256:abc',
  });
  assert.deepEqual(record.bounds, { min: { x: -0.5, y: -0.5, z: -0.5 }, max: { x: 0.5, y: 0.5, z: 0.5 } });
  assert.equal(record.triangleCount, 12);
  assert.equal(record.defaultScale, 1);
  assert.equal(record.normalizationStatus, 'awaiting-bounds');
});

test('资产记录：limitations 覆盖去重与空白过滤', async () => {
  const record = await createStoryboard3DAssetRecord({
    file: fileStub([1, 1, 1], { name: 'a.obj', type: 'text/plain' }),
    format: 'obj',
    parsed: { bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } } },
    normalization: null,
    canonicalAssetId: 'asset:sha256:obj',
    limitations: ['  a  ', 'a', '', null, 'b'],
  });
  assert.deepEqual(record.limitations, ['a', 'b']);
  assert.equal(record.defaultScale, 1);
  assert.equal(record.normalizationStatus, 'awaiting-bounds');
});

test('资产记录：显式 IndexedDB 引用优先于默认键', async () => {
  const record = await createStoryboard3DAssetRecord({
    file: fileStub([2], { name: 'x.glb' }),
    format: 'glb',
    parsed: { bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } } },
    canonicalAssetId: 'asset:sha256:zz',
    indexedDbReference: { databaseName: ' custom ', storeName: '', key: ' key-1 ' },
  });
  assert.deepEqual(record.storage, {
    kind: 'indexeddb',
    databaseName: 'custom',
    storeName: DEFAULT_STORYBOARD_3D_ASSET_STORE,
    key: 'key-1',
  });
});

test('资产记录：名称回退到规范化 id 且 createdAt 非负', async () => {
  const record = await createStoryboard3DAssetRecord({
    file: fileStub([3], { name: '   ' }),
    format: 'glb',
    parsed: { bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } } },
    canonicalAssetId: 'asset:sha256:fallback',
    createdAt: -5,
  });
  assert.equal(record.name, 'asset:sha256:fallback');
  assert.equal(record.source.fileName, '');
  assert.equal(record.createdAt, 0);
});

test('资产记录：不支持的格式与缺失包围盒抛出', async () => {
  await assert.rejects(
    () =>
      createStoryboard3DAssetRecord({
        file: fileStub(),
        format: 'step',
        parsed: { bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } } },
        canonicalAssetId: 'asset:sha256:x',
      }),
    /Unsupported parsed asset format: step/,
  );
  await assert.rejects(
    () =>
      createStoryboard3DAssetRecord({
        file: fileStub(),
        format: '',
        parsed: { bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } } },
        canonicalAssetId: 'asset:sha256:x',
      }),
    /Unsupported parsed asset format: unknown/,
  );
  await assert.rejects(
    () =>
      createStoryboard3DAssetRecord({
        file: fileStub(),
        format: 'glb',
        parsed: {},
        canonicalAssetId: 'asset:sha256:x',
      }),
    /Parsed asset bounds are required/,
  );
  await assert.rejects(
    () => createStoryboard3DAssetRecord({ file: { name: 'a.glb' }, format: 'glb', parsed: {} }),
    /Asset file is unreadable/,
  );
});
