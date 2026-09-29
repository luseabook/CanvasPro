import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureCanvasProjectSaveTransaction,
  commitCanvasProjectSave,
  releaseCanvasProjectSave,
} from './canvasProjectSaveTransaction.js';

function createManager({ canvases = [{ id: 'c1', name: '画布一' }], projectContext = null } = {}) {
  const calls = { context: [], cleaned: [], renamed: [], rendered: 0 };
  return {
    calls,
    manager: {
      _canvases: canvases,
      getCanvasProjectContext: (id) => projectContext || { projectId: 'p-' + id },
      captureCanvasSaveCheckpoint: (id, options) => ({
        canvasId: id,
        hasName: Object.hasOwn(options, 'name'),
      }),
      setCanvasProjectContext: (id, context) => calls.context.push([id, context]),
      markCanvasClean: (id, options) => calls.cleaned.push([id, options]),
      renameCanvas: (id, name) => calls.renamed.push([id, name]),
      renderTabs: () => {
        calls.rendered += 1;
      },
    },
  };
}

function createExportSource({ activeCanvasId = 'c1', canvases = [{ id: 'c1' }], projectName = '新工程' } = {}) {
  return { multiData: { activeCanvasId, canvases }, projectName };
}

test('canvasProjectSaveTransaction: 快照带画笔 id、工程上下文与检查点', () => {
  const { manager } = createManager();
  const exportSource = createExportSource();
  const transaction = captureCanvasProjectSaveTransaction({ manager, exportSource });
  assert.equal(transaction.manager, manager);
  assert.equal(transaction.canvasId, 'c1');
  assert.equal(transaction.exportSource, exportSource);
  assert.equal(typeof transaction.token, 'symbol');
  assert.deepEqual(transaction.projectContext, { projectId: 'p-c1' });
  assert.equal(transaction.originalCanvasName, '画布一');
  assert.deepEqual(transaction.checkpoint, { canvasId: 'c1', hasName: false });
});

test('canvasProjectSaveTransaction: rename 时把工程名带进检查点', () => {
  const { manager } = createManager();
  const transaction = captureCanvasProjectSaveTransaction({
    manager,
    exportSource: createExportSource(),
    rename: true,
  });
  assert.deepEqual(transaction.checkpoint, { canvasId: 'c1', hasName: true });
});

test('canvasProjectSaveTransaction: 没有画像时上下文回落调用方给的默认值', () => {
  const { manager } = createManager({ projectContext: null });
  const transaction = captureCanvasProjectSaveTransaction({
    manager,
    exportSource: createExportSource({ canvases: [{ id: 'c9' }], activeCanvasId: 'c9' }),
    projectContext: { projectId: 'fallback' },
  });
  assert.deepEqual(transaction.projectContext, { projectId: 'p-c9' });
  const withoutManager = captureCanvasProjectSaveTransaction({
    exportSource: createExportSource({ canvases: [], activeCanvasId: 'x' }),
    projectContext: { projectId: 'fallback' },
  });
  assert.deepEqual(withoutManager.projectContext, { projectId: 'fallback' });
  assert.equal(withoutManager.canvasId, 'x');
});

test('canvasProjectSaveTransaction: 任一刻布不允许保存就整体拒绝', () => {
  const blocked = [{ id: 'c1', projectAccess: { canSave: false, saveMessage: '共享画布只读' } }];
  const { manager } = createManager({ canvases: blocked });
  assert.throws(
    () =>
      captureCanvasProjectSaveTransaction({
        manager,
        exportSource: createExportSource({ canvases: blocked }),
      }),
    (error) => error.code === 'PROJECT_SAVE_FORBIDDEN' && error.message === '共享画布只读',
  );

  const silentCanvases = [{ id: 'c1', projectAccess: { canSave: false } }];
  const silent = createManager({ canvases: silentCanvases });
  assert.throws(
    () =>
      captureCanvasProjectSaveTransaction({
        manager: silent.manager,
        exportSource: createExportSource({ canvases: silentCanvases }),
      }),
    { message: '当前项目不允许保存' },
  );
});

test('canvasProjectSaveTransaction: 提交会写上下文、清脏标记并重绘标签', () => {
  const { manager, calls } = createManager();
  const transaction = captureCanvasProjectSaveTransaction({ manager, exportSource: createExportSource() });
  const ok = commitCanvasProjectSave(transaction, { projectId: 'p1' });
  assert.equal(ok, true);
  assert.deepEqual(calls.context, [['c1', { projectId: 'p1' }]]);
  assert.deepEqual(calls.cleaned, [['c1', { checkpoint: { canvasId: 'c1', hasName: false } }]]);
  assert.equal(calls.rendered, 1);
  assert.deepEqual(calls.renamed, [], '不改名时不碰画布名');
});

test('canvasProjectSaveTransaction: 改名只在画布名未被改过时生效', () => {
  const { manager, calls } = createManager();
  const transaction = captureCanvasProjectSaveTransaction({
    manager,
    exportSource: createExportSource({ projectName: '工程新名' }),
    rename: true,
  });
  commitCanvasProjectSave(transaction, { projectId: 'p1' }, { rename: true });
  assert.deepEqual(calls.renamed, [['c1', '工程新名']]);

  const renamed = createManager({ canvases: [{ id: 'c1', name: '快照时的名字' }] });
  const second = captureCanvasProjectSaveTransaction({
    manager: renamed.manager,
    exportSource: createExportSource({ projectName: '又改' }),
    rename: true,
  });
  renamed.manager._canvases[0].name = '用户手改的名字';
  commitCanvasProjectSave(second, { projectId: 'p1' }, { rename: true });
  assert.deepEqual(renamed.calls.renamed, [], '画布名与快照时不同就跳过改名');
});

test('canvasProjectSaveTransaction: 同画布后发的快照会作废先发的提交', () => {
  const { manager, calls } = createManager();
  const first = captureCanvasProjectSaveTransaction({ manager, exportSource: createExportSource() });
  const second = captureCanvasProjectSaveTransaction({ manager, exportSource: createExportSource() });
  assert.equal(commitCanvasProjectSave(first, { projectId: 'stale' }), false);
  assert.equal(commitCanvasProjectSave(second, { projectId: 'fresh' }), true);
  assert.deepEqual(calls.context, [['c1', { projectId: 'fresh' }]]);
});

test('canvasProjectSaveTransaction: 画布已不存在时提交失败', () => {
  const { manager } = createManager();
  const transaction = captureCanvasProjectSaveTransaction({ manager, exportSource: createExportSource() });
  manager._canvases = [];
  assert.equal(commitCanvasProjectSave(transaction, { projectId: 'p1' }), false);
});

test('canvasProjectSaveTransaction: 释放只清掉自己那一次的记录', () => {
  const { manager } = createManager();
  const first = captureCanvasProjectSaveTransaction({ manager, exportSource: createExportSource() });
  const second = captureCanvasProjectSaveTransaction({ manager, exportSource: createExportSource() });
  releaseCanvasProjectSave(first);
  assert.equal(commitCanvasProjectSave(second, { projectId: 'still-valid' }), true);
  releaseCanvasProjectSave(null);
  releaseCanvasProjectSave({ manager, canvasId: 'c1', token: Symbol('nope') });
  const third = captureCanvasProjectSaveTransaction({ manager, exportSource: createExportSource() });
  assert.equal(commitCanvasProjectSave(third, { projectId: 'again' }), true);
});
