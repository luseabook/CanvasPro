import assert from 'node:assert/strict';
import test from 'node:test';

// three.js 的 FileLoader 在模块求值时依赖浏览器的 ProgressEvent，Node 下需要最小垫片。
if (typeof globalThis.ProgressEvent !== 'function') {
  globalThis.ProgressEvent = class ProgressEvent {
    constructor(type, init = {}) {
      this.type = type;
      Object.assign(this, init);
    }
  };
}

const { DirectorSceneRuntime } = await import('./directorSceneRuntime.js');

function fakeRuntime({
  objects = [],
  mannequins = new Map(),
  cubes = new Map(),
  importedInstances = new Map(),
  importedRoots = new Map(),
  scene = undefined,
  groundColor = null,
  disposed = false,
} = {}) {
  return {
    adapted: { scene: { objects, background: {}, environment: {} } },
    bridge: {
      scene,
      _mannequinMap: mannequins,
      _cubeMap: cubes,
      _ground: groundColor ? { material: { color: groundColor } } : null,
    },
    importedInstanceByObjectId: importedInstances,
    importedModelRoots: importedRoots,
    disposed,
  };
}

function fakeMaterial(label) {
  return {
    label,
    transparent: false,
    opacity: 0.9,
    needsUpdate: false,
    map: { label: `${label}-map` },
    color: {
      value: label,
      copy(source) {
        this.value = source.value;
      },
    },
    cloneCount: 0,
    disposed: false,
    clone() {
      this.cloneCount += 1;
      return fakeMaterial(`${label}-clone`);
    },
    dispose() {
      this.disposed = true;
    },
  };
}

test('导演场景运行时：构造期字段初始化', () => {
  const view = new DirectorSceneRuntime(fakeRuntime());
  assert.equal(view.runtime instanceof Object, true);
  assert.equal(view.materials.size, 0);
  assert.equal(view.token, 0);
  assert.equal(view.assetId, '');
  assert.equal(view.pending, false);
  assert.equal(view.error, null);
});

test('导演场景运行时：roots 过滤隐藏对象、group 与排除集', () => {
  const group = { isObject3D: true };
  const mannequin = { group };
  const runtime = fakeRuntime({
    objects: [
      { id: 'c1', type: 'character', visible: true },
      { id: 'p1', type: 'prop', visible: true },
      { id: 'g1', type: 'group', visible: true },
      { id: 'c2', type: 'character', visible: false },
      { id: 'c3', type: 'character', visible: true },
    ],
    mannequins: new Map([
      ['c1', mannequin],
      ['c2', mannequin],
      ['c3', {}],
    ]),
    cubes: new Map([['p1', mannequin]]),
  });
  const view = new DirectorSceneRuntime(runtime);

  const roots = view.roots();
  assert.deepEqual(
    roots.map((entry) => entry.id),
    ['c1', 'p1'],
  );
  assert.equal(roots[0].root, group);
  assert.equal(roots[0].instanceId, null);
  assert.deepEqual(
    view.roots(new Set(['c1'])).map((entry) => entry.id),
    ['p1'],
  );
});

test('导演场景运行时：roots 优先使用导入实例网格并暴露实例序号', () => {
  const instanceMesh = { isObject3D: true, objectIds: ['x', 'c1'] };
  const runtime = fakeRuntime({
    objects: [
      { id: 'c1', type: 'character', visible: true },
      { id: 'c2', type: 'character', visible: true },
    ],
    mannequins: new Map([
      ['c1', { group: { isObject3D: true } }],
      ['c2', { group: { isObject3D: true } }],
    ]),
    importedInstances: new Map([['c1', { mesh: instanceMesh, objectIds: ['x', 'c1'] }]]),
    importedRoots: new Map([['c2', { isObject3D: true }]]),
  });
  const view = new DirectorSceneRuntime(runtime);

  const roots = view.roots();
  assert.deepEqual(
    roots.map((entry) => entry.id),
    ['c1', 'c2'],
  );
  assert.equal(roots[0].root, instanceMesh);
  assert.equal(roots[0].instanceId, 1);
  assert.equal(roots[1].root, runtime.importedModelRoots.get('c2'));
  assert.equal(roots[1].instanceId, null);
});

test('导演场景运行时：sync 在没有 three 场景时提前返回', () => {
  const view = new DirectorSceneRuntime(fakeRuntime());
  assert.doesNotThrow(() => view.sync());
  assert.equal(view.settings, undefined);
});

test('导演场景运行时：obstacles 与 surfaceHeight 在无 root 时给出兜底值', () => {
  const view = new DirectorSceneRuntime(fakeRuntime());
  assert.deepEqual(view.obstacles(), []);
  assert.equal(view.surfaceHeight(0, 0), 0);
  view.settings = { groundHeight: 2.5 };
  assert.equal(view.surfaceHeight(0, 0), 2.5);
});

test('导演场景运行时：syncMaterials 在无材质需求时不动网格', () => {
  const mesh = { isMesh: true, material: fakeMaterial('plain'), geometry: {} };
  const root = {
    isObject3D: true,
    traverse: (callback) => callback(mesh),
  };
  const runtime = fakeRuntime({
    objects: [{ id: 'p1', type: 'prop', visible: true }],
    cubes: new Map([['p1', { group: root }]]),
  });
  const view = new DirectorSceneRuntime(runtime);

  view.syncMaterials('solid');
  assert.equal(view.materials.size, 0);
  assert.equal(mesh.material.label, 'plain');
  assert.equal(mesh.material.cloneCount, 0);
});

test('导演场景运行时：syncMaterials clay 模式克隆材质并改写颜色/贴图', () => {
  const mesh = { isMesh: true, material: fakeMaterial('原始'), geometry: {} };
  const root = {
    isObject3D: true,
    traverse: (callback) => callback(mesh),
  };
  const runtime = fakeRuntime({
    objects: [{ id: 'p1', type: 'prop', visible: true }],
    cubes: new Map([['p1', { group: root }]]),
    groundColor: { value: 'GROUND' },
  });
  const view = new DirectorSceneRuntime(runtime);

  view.syncMaterials('clay');

  assert.equal(view.materials.size, 1);
  assert.notEqual(mesh.material, runtime.bridge._cubeMap.get('p1').group);
  const entry = view.materials.get(mesh);
  assert.equal(entry.clones.length, 1);
  assert.equal(mesh.material, entry.clones[0]);
  assert.equal(entry.clones[0].transparent, false);
  assert.equal(entry.clones[0].opacity, 0.9);
  assert.equal(entry.clones[0].depthWrite, true);
  assert.equal(entry.clones[0].needsUpdate, true);
  assert.equal(entry.clones[0].map, null);
  assert.equal(entry.clones[0].color.value, 'GROUND');
});

test('导演场景运行时：syncMaterials transparent 模式改半透明，solid 还原并释放克隆', () => {
  const original = fakeMaterial('原始');
  const mesh = { isMesh: true, material: original, geometry: {} };
  const root = {
    isObject3D: true,
    traverse: (callback) => callback(mesh),
  };
  const runtime = fakeRuntime({
    objects: [{ id: 'p1', type: 'prop', visible: true }],
    cubes: new Map([['p1', { group: root }]]),
    groundColor: { value: 'GROUND' },
  });
  const view = new DirectorSceneRuntime(runtime);

  view.prepareMaterials();
  assert.equal(view.materials.size, 0);

  view.syncMaterials('transparent');
  const entry = view.materials.get(mesh);
  assert.equal(entry.clones[0].transparent, true);
  assert.equal(entry.clones[0].opacity, 0.35);
  assert.equal(entry.clones[0].depthWrite, false);
  assert.equal(entry.clones[0].color.value, '原始');
  assert.equal(entry.clones[0].map, original.map);

  view.prepareMaterials();
  assert.equal(mesh.material, original);

  view.syncMaterials('solid');
  assert.equal(mesh.material, original);
  assert.equal(entry.clones[0].disposed, true);
  assert.equal(view.materials.size, 0);
});

test('导演场景运行时：syncMaterials 清掉不再属于场景的材质条目', () => {
  const original = fakeMaterial('原始');
  const mesh = { isMesh: true, material: original, geometry: {} };
  const objects = [{ id: 'p1', type: 'prop', visible: true }];
  const root = {
    isObject3D: true,
    traverse: (callback) => callback(mesh),
  };
  const runtime = fakeRuntime({
    objects,
    cubes: new Map([['p1', { group: root }]]),
    groundColor: { value: 'GROUND' },
  });
  const view = new DirectorSceneRuntime(runtime);
  view.syncMaterials('clay');
  const entry = view.materials.get(mesh);
  assert.equal(view.materials.size, 1);

  objects[0].visible = false;
  view.syncMaterials('clay');
  assert.equal(view.materials.size, 0);
  assert.equal(mesh.material, original);
  assert.equal(entry.clones[0].disposed, true);
});

test('导演场景运行时：dispose 复位状态且不依赖地面/全景节点', () => {
  const view = new DirectorSceneRuntime(fakeRuntime());
  assert.doesNotThrow(() => view.dispose());
  assert.equal(view.token, 1);
  assert.equal(view.pending, false);
  assert.equal(view.labels, null);
  assert.equal(view.materials.size, 0);
});
