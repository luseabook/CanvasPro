import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDirectorGeneratedLayers,
  normalizeDirectorGenerationJobs,
  applyDirectorGeneratedLayer,
  restoreDirectorLayerVersion,
} from './directorGeneratedLayers.js';

test('normalizeDirectorGeneratedLayers 只保留最近 30 层并收敛名称与对象引用', () => {
  assert.deepEqual(
    normalizeDirectorGeneratedLayers(undefined, (v) => v),
    [],
  );
  const input = Array.from({ length: 32 }, (_, i) => ({
    id: 'layer-' + i,
    name: '层' + i,
    objectIds: ['o' + i, 7, null],
    versions: [],
  }));
  const layers = normalizeDirectorGeneratedLayers(input, (v) => v);
  assert.equal(layers.length, 30);
  assert.equal(layers[0].id, 'layer-2');
  assert.equal(layers.at(-1).id, 'layer-31');
  assert.deepEqual(layers[0].objectIds, ['o2']);
});

test('normalizeDirectorGeneratedLayers 处理默认名称、版本窗口与对象映射过滤', () => {
  const long = 'x'.repeat(200);
  const [layer] = normalizeDirectorGeneratedLayers(
    [
      {
        id: 'L',
        name: long,
        versions: [
          ...Array.from({ length: 12 }, (_, i) => ({ id: 'v' + i, name: '', objects: [] })),
          { id: 9, objects: [{ keep: true }, { drop: true }] },
        ],
      },
      { name: '缺少 id' },
    ],
    (o) => (o.keep ? { keep: true } : null),
  );
  assert.equal(layer.name.length, 120);
  assert.equal(layer.versions.length, 10);
  const latest = layer.versions.at(-1);
  assert.equal(latest.id, '9');
  assert.equal(latest.name, '历史版本');
  assert.deepEqual(latest.objects, [{ keep: true }]);
  assert.equal(normalizeDirectorGeneratedLayers([{ id: 'a' }], (v) => v)[0].name, '生成层');
});

test('normalizeDirectorGenerationJobs 收敛枚举、截断文本并钳制时间', () => {
  assert.deepEqual(normalizeDirectorGenerationJobs(null), []);
  const jobs = normalizeDirectorGenerationJobs(
    Array.from({ length: 31 }, (_, i) => ({
      id: 'j' + i,
      kind: i % 2 === 0 ? 'weird' : 'panorama',
      status: i === 30 ? 'running' : 'unknown',
      message: 'm'.repeat(600),
      prompt: 'p'.repeat(6000),
      createdAt: i === 2 ? 'abc' : -5,
    })),
  );
  assert.equal(jobs.length, 30);
  assert.equal(jobs[0].id, 'j1');
  assert.equal(jobs[0].kind, 'panorama');
  assert.equal(jobs[1].kind, 'layer');
  assert.equal(jobs[0].status, 'failed');
  assert.equal(jobs.at(-1).status, 'running');
  assert.equal(jobs[0].message.length, 500);
  assert.equal(jobs[0].prompt.length, 5000);
  assert.equal(jobs[0].createdAt, 0);
  assert.equal(jobs[1].createdAt, 0);
  assert.equal(jobs[0].projectId, '');
  assert.equal(jobs[0].sceneId, '');
  assert.equal(jobs[0].model, '');
  assert.equal(jobs[0].provider, '');
  assert.equal(jobs[0].taskId, '');
  assert.equal(normalizeDirectorGenerationJobs([{ id: 'ok' }, { nope: 1 }]).length, 1);
});

test('applyDirectorGeneratedLayer 新建生成层并重置父级与过滤类型', () => {
  const project = { objects: [], generatedLayers: [] };
  const result = {
    objects: [
      { id: 'a', type: 'prop', parentId: 'p' },
      { id: 'b', type: 'camera' },
      { id: 'c', type: 'light', parentId: 'q' },
      { id: 'd', type: 'character' },
    ],
  };
  const returned = applyDirectorGeneratedLayer(project, result);
  assert.equal(returned, project);
  assert.equal(project.generatedLayers.length, 1);
  const layer = project.generatedLayers[0];
  assert.ok(layer.id.startsWith('layer-'));
  assert.equal(layer.name, 'AI 生成层');
  assert.equal(project.objects.length, 3);
  assert.deepEqual(
    project.objects.map((o) => o.type),
    ['prop', 'light', 'character'],
  );
  for (const object of project.objects) {
    assert.ok(object.id.startsWith('generated-'));
    assert.equal(object.parentId, undefined);
  }
  assert.deepEqual(
    layer.objectIds,
    project.objects.map((o) => o.id),
  );
  assert.deepEqual(layer.versions, []);
  const named = { objects: [], generatedLayers: [] };
  applyDirectorGeneratedLayer(named, result, { name: '自定义层' });
  assert.equal(named.generatedLayers[0].name, '自定义层');
});

test('applyDirectorGeneratedLayer 对缺失层、锁定对象与空结果分别抛错', () => {
  assert.throws(
    () =>
      applyDirectorGeneratedLayer(
        { objects: [], generatedLayers: [{ id: 'layer-1', objectIds: [], versions: [] }] },
        { objects: [{ id: 'a', type: 'prop' }] },
        { layerId: 'layer-9' },
      ),
    /要替换的生成层已不存在。/,
  );
  assert.throws(
    () =>
      applyDirectorGeneratedLayer(
        {
          objects: [{ id: 'o1', locked: true }],
          generatedLayers: [{ id: 'layer-1', objectIds: ['o1'], versions: [] }],
        },
        { objects: [{ id: 'a', type: 'prop' }] },
        { layerId: 'layer-1' },
      ),
    /生成层中有锁定对象，无法替换。/,
  );
  assert.throws(
    () =>
      applyDirectorGeneratedLayer(
        { objects: [], generatedLayers: [] },
        { objects: [{ id: 'a', type: 'camera' }] },
      ),
    /生成结果没有可插入的场景对象。/,
  );
});

test('applyDirectorGeneratedLayer 替换旧对象时压入历史版本并保留最近 10 版', () => {
  const versions = Array.from({ length: 10 }, (_, i) => ({ id: 'v' + i, name: 'v' + i, objects: [] }));
  const project = {
    objects: [
      { id: 'o1', type: 'prop' },
      { id: 'o2', type: 'prop' },
    ],
    generatedLayers: [{ id: 'layer-1', name: '旧层', objectIds: ['o1'], versions }],
  };
  applyDirectorGeneratedLayer(
    project,
    { objects: [{ id: 'n1', type: 'character' }] },
    { layerId: 'layer-1' },
  );
  const layer = project.generatedLayers[0];
  assert.equal(layer.versions.length, 10);
  const latest = layer.versions.at(-1);
  assert.ok(latest.id.startsWith('version-'));
  assert.ok(latest.name.startsWith('旧层 · '));
  assert.deepEqual(latest.objects, [{ id: 'o1', type: 'prop' }]);
  assert.deepEqual(
    project.objects.map((o) => o.type),
    ['prop', 'character'],
  );
  assert.equal(project.objects[0].id, 'o2');
  assert.equal(layer.objectIds.length, 1);
  assert.ok(layer.objectIds[0].startsWith('generated-'));
});

test('restoreDirectorLayerVersion 缺版本抛错，命中时按版本快照重建', () => {
  const project = {
    objects: [{ id: 'o1', type: 'prop' }],
    generatedLayers: [
      {
        id: 'layer-1',
        name: 'L',
        objectIds: ['o1'],
        versions: [{ id: 'v1', name: 'v1', objects: [{ id: 'old', type: 'light', parentId: 'z' }] }],
      },
    ],
  };
  assert.throws(() => restoreDirectorLayerVersion(project, 'layer-1', 'nope'), /生成层历史版本不存在。/);
  assert.throws(() => restoreDirectorLayerVersion(project, 'gone', 'v1'), /生成层历史版本不存在。/);
  restoreDirectorLayerVersion(project, 'layer-1', 'v1');
  assert.equal(project.objects.length, 1);
  assert.equal(project.objects[0].type, 'light');
  assert.ok(project.objects[0].id.startsWith('generated-'));
  assert.equal(project.objects[0].parentId, undefined);
  assert.equal(project.generatedLayers[0].versions.length, 2);
  assert.deepEqual(project.generatedLayers[0].versions.at(-1).objects, [{ id: 'o1', type: 'prop' }]);
});
