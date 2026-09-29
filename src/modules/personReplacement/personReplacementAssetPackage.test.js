import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPersonReplacementAssetPackageItemRequest,
  createPersonReplacementAppearanceAssetLibraryOperation,
  readPersonReplacementLibraryAssets,
  savePersonReplacementAppearanceToAssetPackage,
} from './personReplacementAssetPackage.js';

test('buildPersonReplacementAssetPackageItemRequest falls back to placeholder names', () => {
  const request = buildPersonReplacementAssetPackageItemRequest();
  assert.equal(request.packageKey, 'person-replacement-project:');
  assert.equal(request.packageName, '未命名人物替换项目');
  assert.equal(request.category, '替换工作室');
  assert.equal(request.itemKey, 'person-replacement-appearance::');
  assert.equal(request.itemName, '人物｜未命名人物｜基础形象');
  assert.equal(request.image.imageUrl, '');
  assert.deepEqual(request.metadata, {
    sourceKind: 'person-replacement-workspace',
    sourceProjectId: '',
  });
  assert.deepEqual(request.itemMetadata, {
    sourceKind: 'person-replacement-workspace',
    sourceProjectId: '',
    sourceCharacterId: '',
    sourceAppearanceId: '',
  });
});

test('buildPersonReplacementAssetPackageItemRequest trims ids and titles', () => {
  const request = buildPersonReplacementAssetPackageItemRequest({
    project: { id: ' p-1 ', title: ' 我的项目 ' },
    character: { id: ' c-1 ', name: ' 张三 ' },
    appearance: { id: ' a-1 ', name: ' 正面 ', imageUrl: ' https://host/i.png ' },
  });
  assert.equal(request.packageKey, 'person-replacement-project:p-1');
  assert.equal(request.packageName, '我的项目');
  assert.equal(request.itemKey, 'person-replacement-appearance:c-1:a-1');
  assert.equal(request.itemName, '人物｜张三｜正面');
  assert.equal(request.image.imageUrl, 'https://host/i.png');
  assert.equal(request.itemMetadata.sourceProjectId, 'p-1');
  assert.equal(request.itemMetadata.sourceCharacterId, 'c-1');
  assert.equal(request.itemMetadata.sourceAppearanceId, 'a-1');
});

test('buildPersonReplacementAssetPackageItemRequest prefers an explicit image over generatedImage', () => {
  const fromGenerated = buildPersonReplacementAssetPackageItemRequest({
    appearance: { generatedImage: { imageUrl: 'https://host/generated.png' } },
  });
  assert.equal(fromGenerated.image.imageUrl, 'https://host/generated.png');
  const explicit = buildPersonReplacementAssetPackageItemRequest({
    appearance: { generatedImage: { imageUrl: 'https://host/generated.png' } },
    image: { imageUrl: 'https://host/explicit.png' },
  });
  assert.equal(explicit.image.imageUrl, 'https://host/explicit.png');
});

test('buildPersonReplacementAssetPackageItemRequest keeps only non-empty local paths', () => {
  const request = buildPersonReplacementAssetPackageItemRequest({
    appearance: {
      imageUrl: 'https://host/i.png',
      localPath: ' /cache/a.png ',
      originalLocalPath: '   ',
      displayLocalPath: '/cache/d.png',
    },
  });
  assert.equal(request.image.localPath, '/cache/a.png');
  assert.equal(request.image.displayLocalPath, '/cache/d.png');
  assert.equal('originalLocalPath' in request.image, false);
});

test('buildPersonReplacementAssetPackageItemRequest falls back through image urls', () => {
  assert.equal(
    buildPersonReplacementAssetPackageItemRequest({ image: { displayUrl: 'https://host/d.png' } }).image
      .imageUrl,
    'https://host/d.png',
  );
  assert.equal(
    buildPersonReplacementAssetPackageItemRequest({ image: { url: 'https://host/u.png' } }).image.imageUrl,
    'https://host/u.png',
  );
  assert.equal(
    buildPersonReplacementAssetPackageItemRequest({
      appearance: { url: 'https://host/ignored.png' },
    }).image.imageUrl,
    '',
  );
  assert.equal(
    buildPersonReplacementAssetPackageItemRequest({
      appearance: { id: 'a' },
      image: { imageUrl: ' ' },
    }).image.imageUrl,
    '',
  );
});

function baseProject() {
  return {
    id: 'p-1',
    title: 'T',
    characters: [
      {
        id: 'c-1',
        name: 'N',
        appearances: [{ id: 'a-1', name: 'Ap', imageUrl: 'https://host/i.png' }],
      },
    ],
  };
}

test('savePersonReplacementAppearanceToAssetPackage rejects an unknown character', async () => {
  await assert.rejects(
    savePersonReplacementAppearanceToAssetPackage({
      project: baseProject(),
      characterId: 'nope',
      appearanceId: 'a-1',
      saveAssetPackageItem: async () => ({}),
    }),
    /当前形象不可加入总素材。/,
  );
});

test('savePersonReplacementAppearanceToAssetPackage rejects an unknown appearance', async () => {
  await assert.rejects(
    savePersonReplacementAppearanceToAssetPackage({
      project: baseProject(),
      characterId: 'c-1',
      appearanceId: 'nope',
      saveAssetPackageItem: async () => ({}),
    }),
    /当前形象不可加入总素材。/,
  );
});

test('savePersonReplacementAppearanceToAssetPackage requires a generated image', async () => {
  const project = baseProject();
  project.characters[0].appearances[0].imageUrl = '   ';
  await assert.rejects(
    savePersonReplacementAppearanceToAssetPackage({
      project,
      characterId: 'c-1',
      appearanceId: 'a-1',
      saveAssetPackageItem: async () => ({}),
    }),
    /请先生成或上传当前形象。/,
  );
});

test('savePersonReplacementAppearanceToAssetPackage requires the asset package service', async () => {
  await assert.rejects(
    savePersonReplacementAppearanceToAssetPackage({
      project: baseProject(),
      characterId: 'c-1',
      appearanceId: 'a-1',
    }),
    /总素材服务尚未初始化。/,
  );
});

test('savePersonReplacementAppearanceToAssetPackage reports the saved reference', async () => {
  const seen = [];
  const project = baseProject();
  project.characters[0].appearances[0].localPath = '/cache/a.png';
  const result = await savePersonReplacementAppearanceToAssetPackage({
    project,
    characterId: ' c-1 ',
    appearanceId: ' a-1 ',
    saveAssetPackageItem: async (request) => {
      seen.push(request);
      return { assetId: ' as-1 ', itemIndex: 2.7, itemCreated: false };
    },
  });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].itemKey, 'person-replacement-appearance:c-1:a-1');
  assert.equal(result.characterId, 'c-1');
  assert.equal(result.appearanceId, 'a-1');
  assert.equal(result.imageUrl, 'https://host/i.png');
  assert.equal(result.itemCreated, false);
  assert.equal(result.totalAssetRef.assetId, 'as-1');
  assert.equal(result.totalAssetRef.itemIndex, 2);
  assert.equal(result.totalAssetRef.itemKey, 'person-replacement-appearance:c-1:a-1');
  assert.equal(result.totalAssetRef.imageUrl, 'https://host/i.png');
  assert.equal(typeof result.totalAssetRef.updatedAt, 'number');
});

test('savePersonReplacementAppearanceToAssetPackage clamps a negative item index', async () => {
  const result = await savePersonReplacementAppearanceToAssetPackage({
    project: baseProject(),
    characterId: 'c-1',
    appearanceId: 'a-1',
    saveAssetPackageItem: async () => ({ itemIndex: -3, itemCreated: undefined }),
  });
  assert.equal(result.totalAssetRef.itemIndex, 0);
  assert.equal(result.itemCreated, true);
});

test('savePersonReplacementAppearanceToAssetPackage persists a remote url when no local path exists', async () => {
  const persistCalls = [];
  const result = await savePersonReplacementAppearanceToAssetPackage({
    project: baseProject(),
    characterId: 'c-1',
    appearanceId: 'a-1',
    saveAssetPackageItem: async () => ({ assetId: 'as-1', itemIndex: 0 }),
    persistOutputFromUrl: async (url, options) => {
      persistCalls.push([url, options]);
      return { displayUrl: 'https://host/stable.png', localPath: '/cache/stable.png' };
    },
  });
  assert.equal(persistCalls.length, 1);
  assert.equal(persistCalls[0][0], 'https://host/i.png');
  assert.equal(persistCalls[0][1].kind, 'image');
  assert.equal(persistCalls[0][1].ext, 'png');
  assert.equal(
    persistCalls[0][1].dedupeKey,
    'person-replacement-asset-package:p-1:c-1:a-1:https://host/i.png',
  );
  assert.equal(result.request.image.imageUrl, 'https://host/stable.png');
  assert.equal(result.request.image.localPath, '/cache/stable.png');
  assert.equal(result.imageUrl, 'https://host/stable.png');
});

test('savePersonReplacementAppearanceToAssetPackage skips persisting when a local path already exists', async () => {
  const project = baseProject();
  project.characters[0].appearances[0].localPath = '/cache/a.png';
  let persisted = 0;
  await savePersonReplacementAppearanceToAssetPackage({
    project,
    characterId: 'c-1',
    appearanceId: 'a-1',
    saveAssetPackageItem: async () => ({}),
    persistOutputFromUrl: async () => {
      persisted += 1;
      return {};
    },
  });
  assert.equal(persisted, 0);
});

test('savePersonReplacementAppearanceToAssetPackage skips persisting non-remote urls', async () => {
  const project = baseProject();
  project.characters[0].appearances[0].imageUrl = 'assets/i.png';
  let persisted = 0;
  await savePersonReplacementAppearanceToAssetPackage({
    project,
    characterId: 'c-1',
    appearanceId: 'a-1',
    saveAssetPackageItem: async () => ({}),
    persistOutputFromUrl: async () => {
      persisted += 1;
      return {};
    },
  });
  assert.equal(persisted, 0);
});

test('savePersonReplacementAppearanceToAssetPackage surfaces persist errors', async () => {
  await assert.rejects(
    savePersonReplacementAppearanceToAssetPackage({
      project: baseProject(),
      characterId: 'c-1',
      appearanceId: 'a-1',
      saveAssetPackageItem: async () => ({}),
      persistOutputFromUrl: async () => ({ error: '落盘失败' }),
    }),
    /落盘失败/,
  );
});

test('savePersonReplacementAppearanceToAssetPackage requires a stable address from persist', async () => {
  await assert.rejects(
    savePersonReplacementAppearanceToAssetPackage({
      project: baseProject(),
      characterId: 'c-1',
      appearanceId: 'a-1',
      saveAssetPackageItem: async () => ({}),
      persistOutputFromUrl: async () => ({ unrelated: true }),
    }),
    /保存当前形象失败：缺少稳定图片地址。/,
  );
});

test('readPersonReplacementLibraryAssets keeps image and audio entries', () => {
  const items = readPersonReplacementLibraryAssets(() => [
    { type: 'image', id: 1 },
    { mediaKind: 'AUDIO', id: 2 },
    { type: 'video', id: 3 },
    null,
  ]);
  assert.deepEqual(
    items.map((item) => item.id),
    [1, 2],
  );
});

test('readPersonReplacementLibraryAssets survives a broken reader', () => {
  assert.deepEqual(readPersonReplacementLibraryAssets(null), []);
  const warnings = [];
  const items = readPersonReplacementLibraryAssets(
    () => {
      throw new Error('boom');
    },
    { warn: (...args) => warnings.push(args) },
  );
  assert.deepEqual(items, []);
  assert.equal(warnings.length, 1);
});

test('readPersonReplacementLibraryAssets tolerates a non-array result', () => {
  assert.deepEqual(
    readPersonReplacementLibraryAssets(() => null),
    [],
  );
});

function operationHarness(overrides = {}) {
  const toasts = [];
  const state = { project: overrides.project || baseProject(), saved: null, getCalls: 0 };
  const controller = {
    getProject: () => {
      state.getCalls += 1;
      return overrides.getProject ? overrides.getProject(state) : state.project;
    },
    setProject: (project) => {
      state.saved = project;
      return overrides.setProject ? overrides.setProject(project) : { saved: project };
    },
    saveAssetPackageItem: async () => ({ assetId: 'as-1', itemIndex: 1, itemCreated: true }),
    showToast: (message, tone) => toasts.push([message, tone]),
    ...overrides.extra,
  };
  const run = createPersonReplacementAppearanceAssetLibraryOperation(controller);
  return { run, toasts, state };
}

test('the asset library operation reports success with a created item', async () => {
  const { run, toasts, state } = operationHarness();
  const result = await run({ characterId: 'c-1', appearanceId: 'a-1' });
  assert.deepEqual(toasts, [
    ['正在将当前形象加入总素材。', 'info'],
    ['当前形象已加入总素材。', 'success'],
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.assetId, 'as-1');
  assert.equal(result.itemIndex, 1);
  assert.equal(result.project.saved.characters[0].appearances[0].totalAssetRef.assetId, 'as-1');
  assert.equal(state.saved.characters[0].appearances[0].imageUrl, 'https://host/i.png');
});

test('the asset library operation uses the updated wording for an existing item', async () => {
  const { run, toasts } = operationHarness({
    extra: { saveAssetPackageItem: async () => ({ assetId: 'as-1', itemCreated: false }) },
  });
  await run({ characterId: 'c-1', appearanceId: 'a-1' });
  assert.deepEqual(toasts[1], ['已更新总素材中的当前形象。', 'success']);
});

test('the asset library operation ignores a second concurrent call for the same appearance', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const { run, toasts } = operationHarness({
    extra: {
      saveAssetPackageItem: async () => {
        await gate;
        return { assetId: 'as-1', itemIndex: 0, itemCreated: true };
      },
    },
  });
  const first = run({ characterId: 'c-1', appearanceId: 'a-1' });
  const second = await run({ characterId: 'c-1', appearanceId: 'a-1' });
  assert.equal(second, null);
  release();
  const result = await first;
  assert.equal(result.ok, true);
  assert.equal(toasts.filter((entry) => entry[1] === 'info').length, 1);
});

test('the asset library operation drops the result when the project switched mid-flight', async () => {
  const { run, toasts, state } = operationHarness({
    getProject: (inner) => (inner.getCalls === 1 ? inner.project : { ...inner.project, id: 'p-2' }),
  });
  const result = await run({ characterId: 'c-1', appearanceId: 'a-1' });
  assert.equal(result, null);
  assert.equal(state.saved, null);
  assert.equal(toasts.length, 1);
});

test('the asset library operation drops the result when the appearance vanished', async () => {
  const { run, state } = operationHarness({
    getProject: (inner) =>
      inner.getCalls === 1
        ? inner.project
        : {
            id: 'p-1',
            characters: [{ id: 'c-1', appearances: [{ id: 'a-9', imageUrl: 'https://host/x.png' }] }],
          },
  });
  const result = await run({ characterId: 'c-1', appearanceId: 'a-1' });
  assert.equal(result, null);
  assert.equal(state.saved, null);
});

test('the asset library operation toasts a failure and releases the lock', async () => {
  const { run, toasts } = operationHarness({
    extra: {
      saveAssetPackageItem: async () => {
        throw new Error('网络错误');
      },
    },
  });
  const result = await run({ characterId: 'c-1', appearanceId: 'a-1' });
  assert.equal(result, null);
  assert.deepEqual(toasts[1], ['网络错误', 'error']);
  const retried = await run({ characterId: 'c-1', appearanceId: 'a-1' });
  assert.equal(retried, null);
  assert.equal(toasts.filter((entry) => entry[1] === 'info').length, 2);
});
