import assert from 'node:assert/strict';
import test from 'node:test';

import { createStoryboard3DEditorStore } from './editorStore.js';

test('编辑器状态：默认快照与取值隔离', () => {
  const store = createStoryboard3DEditorStore();
  assert.deepEqual(store.getSnapshot(), {
    selectedObjectIds: [],
    activeTool: 'select',
    assetLibraryOpen: false,
    inspectorOpen: false,
    inspectorTab: 'properties',
    objectOutlineOpen: false,
    flyMode: false,
  });
  const first = store.getSnapshot();
  first.selectedObjectIds.push('leak');
  first.activeTool = 'move';
  assert.deepEqual(store.getSnapshot().selectedObjectIds, []);
  assert.equal(store.getSnapshot().activeTool, 'select');
  assert.notEqual(store.getSnapshot(), first);
});

test('编辑器状态：初始入参合并且选中集归一化', () => {
  const store = createStoryboard3DEditorStore({
    selectedObjectIds: [' a ', 'a', '', null, 7, 'b'],
    inspectorTab: 'shot',
    flyMode: true,
  });
  assert.deepEqual(store.getSnapshot(), {
    selectedObjectIds: ['a', '7', 'b'],
    activeTool: 'select',
    assetLibraryOpen: false,
    inspectorOpen: false,
    inspectorTab: 'shot',
    objectOutlineOpen: false,
    flyMode: true,
  });
  assert.deepEqual(
    createStoryboard3DEditorStore({ selectedObjectIds: 'a' }).getSnapshot().selectedObjectIds,
    [],
  );
});

test('编辑器状态：订阅、变更通知与取消订阅', () => {
  const store = createStoryboard3DEditorStore();
  const seen = [];
  assert.equal(typeof store.subscribe(null), 'function');
  assert.equal(store.subscribe(null)(), undefined);
  const unsubscribe = store.subscribe((snapshot, meta) => seen.push([snapshot.activeTool, meta.reason]));
  const snapshot = store.setActiveTool('rotate');
  assert.equal(snapshot.activeTool, 'rotate');
  assert.deepEqual(seen, [['rotate', 'set-tool']]);
  unsubscribe();
  store.setActiveTool('scale');
  assert.deepEqual(seen, [['rotate', 'set-tool']]);
});

test('编辑器状态：多订阅者收到同一次快照', () => {
  const store = createStoryboard3DEditorStore();
  const got = [];
  store.subscribe((snapshot) => got.push(snapshot));
  store.subscribe((snapshot) => got.push(snapshot));
  store.setFlyMode(true);
  assert.equal(got.length, 2);
  assert.equal(got[0], got[1]);
  assert.equal(got[0].flyMode, true);
});

test('编辑器状态：工具与检查器页签走白名单', () => {
  const store = createStoryboard3DEditorStore();
  for (const tool of ['select', 'move', 'rotate', 'scale']) {
    assert.equal(store.setActiveTool(tool).activeTool, tool);
  }
  assert.equal(store.setActiveTool('fly').activeTool, 'select');
  assert.equal(store.setActiveTool(undefined).activeTool, 'select');
  for (const tab of ['properties', 'shot', 'scene']) {
    assert.equal(store.setInspectorTab(tab).inspectorTab, tab);
  }
  assert.equal(store.setInspectorTab('layers').inspectorTab, 'properties');
});

test('编辑器状态：选中集写入归一化，非数组清空', () => {
  const store = createStoryboard3DEditorStore();
  assert.deepEqual(store.setSelectedObjects([' x ', 'x', 'y', '']).selectedObjectIds, ['x', 'y']);
  assert.deepEqual(store.setSelectedObjects(null).selectedObjectIds, []);
  assert.deepEqual(store.setSelectedObjects(['z']).selectedObjectIds, ['z']);
});

test('编辑器状态：布尔开关只认严格 true 并给出对应原因', () => {
  const store = createStoryboard3DEditorStore();
  const reasons = [];
  store.subscribe((snapshot, meta) => reasons.push(meta.reason));
  assert.equal(store.setAssetLibraryOpen(true).assetLibraryOpen, true);
  assert.equal(store.setAssetLibraryOpen(1).assetLibraryOpen, false);
  assert.equal(store.setInspectorOpen('true').inspectorOpen, false);
  assert.equal(store.setInspectorOpen(true).inspectorOpen, true);
  assert.equal(store.setObjectOutlineOpen(0).objectOutlineOpen, false);
  assert.equal(store.setObjectOutlineOpen(true).objectOutlineOpen, true);
  assert.equal(store.setFlyMode(true).flyMode, true);
  assert.deepEqual(reasons, [
    'open-asset-library',
    'close-asset-library',
    'toggle-inspector',
    'toggle-inspector',
    'toggle-object-outline',
    'toggle-object-outline',
    'toggle-fly-mode',
  ]);
});

test('编辑器状态：销毁后不再通知', () => {
  const store = createStoryboard3DEditorStore();
  let count = 0;
  store.subscribe(() => (count += 1));
  store.setActiveTool('move');
  store.destroy();
  store.setActiveTool('scale');
  assert.equal(count, 1);
});
