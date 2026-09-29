import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompletionNavigation } from './completionNavigation.js';

const DELETED_TOAST = '对应的画布节点已删除或项目已关闭。';
const FAILURE_TOAST = '无法打开任务结果，请从对应工作区查看。';

const settle = () => new Promise((resolve) => setImmediate(resolve));

function createHarness(over = {}) {
  const handlers = [];
  const toasts = [];
  const snapshotCalls = [];
  const projectContextCalls = [];
  const switchCalls = [];
  const modeCalls = [];
  const focusCalls = [];
  const selectedCalls = [];
  const replacementCalls = [];
  let unsubscribeCalls = 0;
  const canvases = 'canvases' in over ? over.canvases : [];
  const nodes = 'nodes' in over ? over.nodes : {};
  const canvasTabs = {
    getMultiDataSnapshot:
      'getMultiDataSnapshot' in over
        ? over.getMultiDataSnapshot
        : (options) => {
            snapshotCalls.push(options);
            return { canvases };
          },
    getCanvasProjectContext:
      'getCanvasProjectContext' in over
        ? over.getCanvasProjectContext
        : (canvasId) => {
            projectContextCalls.push(canvasId);
            return 'projectContext' in over ? over.projectContext : { projectId: 'proj-a' };
          },
    switchTo:
      'switchTo' in over
        ? over.switchTo
        : async (canvasId) => {
            switchCalls.push(canvasId);
          },
    getActiveCanvasId:
      'getActiveCanvasId' in over
        ? over.getActiveCanvasId
        : () => ('activeCanvasId' in over ? over.activeCanvasId : (canvases[0]?.id ?? null)),
  };
  const store = {
    getState: 'getState' in over ? over.getState : () => ({ nodes }),
    setSelectedNodes:
      'setSelectedNodes' in over
        ? over.setSelectedNodes
        : (nodeIds) => {
            selectedCalls.push(nodeIds);
          },
  };
  const viewport = {
    focusNode:
      'focusNode' in over
        ? over.focusNode
        : (nodeId, dx, dy, options) => {
            focusCalls.push({ nodeId, dx, dy, options });
            return { focused: nodeId };
          },
  };
  const requestWorkspaceMode =
    'requestWorkspaceMode' in over
      ? over.requestWorkspaceMode
      : (mode) => {
          modeCalls.push(mode);
          return true;
        };
  const replacementStudio = {
    whenReady:
      'whenReady' in over
        ? over.whenReady
        : async () => {
            replacementCalls.push('whenReady');
          },
    navigateToTaskResult:
      'navigateToTaskResult' in over
        ? over.navigateToTaskResult
        : (payload) => {
            replacementCalls.push({ navigate: payload });
            return { navigated: payload };
          },
  };
  const navigation = createCompletionNavigation({
    canvasTabs,
    store,
    viewport,
    requestWorkspaceMode,
    replacementStudio,
    prepareReplacement:
      'prepareReplacement' in over
        ? over.prepareReplacement
        : async () => {
            replacementCalls.push('prepare');
          },
    subscribe:
      'subscribe' in over
        ? over.subscribe
        : (handler) => {
            handlers.push(handler);
            return () => {
              unsubscribeCalls += 1;
            };
          },
    showToast:
      'showToast' in over
        ? over.showToast
        : (message, level) => {
            toasts.push({ message, level });
          },
  });
  return {
    navigation,
    handlers,
    toasts,
    snapshotCalls,
    projectContextCalls,
    switchCalls,
    modeCalls,
    focusCalls,
    selectedCalls,
    replacementCalls,
    unsubscribeCount: () => unsubscribeCalls,
    notify(payload) {
      for (const handler of handlers) handler(payload);
    },
  };
}

test('completionNavigation: 创建即订阅一次，whenIdle 初始已完成，destroy 可重复反注册', async () => {
  const harness = createHarness();
  assert.equal(harness.handlers.length, 1);
  assert.equal(typeof harness.navigation.whenIdle, 'function');
  assert.equal(typeof harness.navigation.destroy, 'function');
  assert.equal(await harness.navigation.whenIdle(), undefined);
  assert.equal(harness.unsubscribeCount(), 0);
  harness.navigation.destroy();
  assert.equal(harness.unsubscribeCount(), 1);
  harness.navigation.destroy();
  assert.equal(harness.unsubscribeCount(), 2);
});

test('completionNavigation: 只处理 canvas 与 replacement-studio 来源', async () => {
  const harness = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    nodes: { n1: {} },
  });
  for (const payload of [undefined, {}, { source: 'task' }, { source: 'canvasX', nodeId: 'n1' }]) {
    harness.notify(payload);
  }
  await settle();
  assert.deepEqual(harness.snapshotCalls, []);
  assert.deepEqual(harness.toasts, []);
  assert.deepEqual(harness.focusCalls, []);
  assert.equal(await harness.navigation.whenIdle(), undefined);
});

test('completionNavigation: 画布来源命中唯一画布后切换、选中并聚焦', async () => {
  const harness = createHarness({
    canvases: [
      { id: 'c1', nodes: [{ id: 'n1' }, { id: 'n2' }] },
      { id: 'c2', nodes: [{ id: 'n9' }] },
    ],
    nodes: { n2: { id: 'n2' } },
    activeCanvasId: 'c1',
  });
  harness.notify({ source: 'canvas', nodeId: 'n2' });
  assert.deepEqual(harness.snapshotCalls, []);
  await settle();
  assert.deepEqual(harness.snapshotCalls, [{ captureVisualSnapshot: false }]);
  assert.deepEqual(harness.modeCalls, ['canvas']);
  assert.deepEqual(harness.switchCalls, ['c1']);
  assert.deepEqual(harness.selectedCalls, [['n2']]);
  assert.deepEqual(harness.focusCalls, [
    { nodeId: 'n2', dx: 96, dy: 500, options: { maxZoom: 1.15 } },
  ]);
  assert.deepEqual(harness.toasts, []);
  assert.deepEqual(await harness.navigation.whenIdle(), { focused: 'n2' });
});

test('completionNavigation: canvasId 与 projectId 共同过滤候选画布', async () => {
  const canvases = [
    { id: 'c1', nodes: [{ id: 'n1' }] },
    { id: 'c2', nodes: [{ id: 'n1' }] },
  ];
  const contexts = { c1: { projectId: 'proj-a' }, c2: { projectId: 'proj-b' } };
  const projectContextCalls = [];
  const harness = createHarness({
    canvases,
    nodes: { n1: {} },
    activeCanvasId: 'c2',
    getCanvasProjectContext: (canvasId) => {
      projectContextCalls.push(canvasId);
      return contexts[canvasId];
    },
  });
  harness.notify({ source: 'canvas', nodeId: 'n1', canvasId: 'c2', projectId: 'proj-b' });
  await settle();
  assert.deepEqual(projectContextCalls, ['c2']);
  assert.deepEqual(harness.switchCalls, ['c2']);
  assert.deepEqual(harness.selectedCalls, [['n1']]);
  assert.deepEqual(harness.toasts, []);
  assert.deepEqual(await harness.navigation.whenIdle(), { focused: 'n1' });

  const mismatched = createHarness({
    canvases,
    nodes: { n1: {} },
    getCanvasProjectContext: (canvasId) => contexts[canvasId],
  });
  mismatched.notify({ source: 'canvas', nodeId: 'n1', projectId: 'proj-x' });
  await settle();
  assert.deepEqual(mismatched.switchCalls, []);
  assert.deepEqual(mismatched.toasts, [{ message: DELETED_TOAST, level: 'warn' }]);
  assert.equal(await mismatched.navigation.whenIdle(), false);
});

test('completionNavigation: nodes 为对象映射时按 key 判定', async () => {
  const harness = createHarness({
    canvases: [{ id: 'c1', nodes: { n1: { id: 'n1' } } }],
    nodes: { n1: {} },
    activeCanvasId: 'c1',
  });
  harness.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(harness.switchCalls, ['c1']);
  assert.deepEqual(await harness.navigation.whenIdle(), { focused: 'n1' });

  const missing = createHarness({
    canvases: [{ id: 'c1', nodes: { n1: { id: 'n1' } } }],
    nodes: { n9: {} },
    activeCanvasId: 'c1',
  });
  missing.notify({ source: 'canvas', nodeId: 'n9' });
  await settle();
  assert.deepEqual(missing.toasts, [{ message: DELETED_TOAST, level: 'warn' }]);
  assert.equal(await missing.navigation.whenIdle(), false);
});

test('completionNavigation: 候选取不到唯一画布时提示并失败收尾', async () => {
  const duplicated = createHarness({
    canvases: [
      { id: 'c1', nodes: [{ id: 'n1' }] },
      { id: 'c2', nodes: [{ id: 'n1' }] },
    ],
    nodes: { n1: {} },
  });
  duplicated.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(duplicated.toasts, [{ message: DELETED_TOAST, level: 'warn' }]);
  assert.deepEqual(duplicated.modeCalls, []);
  assert.deepEqual(duplicated.switchCalls, []);
  assert.equal(await duplicated.navigation.whenIdle(), false);

  const empty = createHarness({ canvases: [], nodes: { n1: {} } });
  empty.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(empty.toasts, [{ message: DELETED_TOAST, level: 'warn' }]);
  assert.equal(await empty.navigation.whenIdle(), false);

  const noField = createHarness({ nodes: { n1: {} } });
  noField.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(noField.toasts, [{ message: DELETED_TOAST, level: 'warn' }]);
});

test('completionNavigation: store 里节点不存在时静默失败', async () => {
  const harness = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    nodes: {},
    activeCanvasId: 'c1',
  });
  harness.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(harness.switchCalls, ['c1']);
  assert.deepEqual(harness.selectedCalls, []);
  assert.deepEqual(harness.focusCalls, []);
  assert.deepEqual(harness.toasts, []);
  assert.equal(await harness.navigation.whenIdle(), false);

  const stateless = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    getState: () => ({}),
    activeCanvasId: 'c1',
  });
  stateless.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(stateless.selectedCalls, []);
  assert.equal(await stateless.navigation.whenIdle(), false);
});

test('completionNavigation: 切换后活动画布不符则放弃', async () => {
  const harness = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    nodes: { n1: {} },
    activeCanvasId: 'c9',
  });
  harness.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(harness.switchCalls, ['c1']);
  assert.deepEqual(harness.selectedCalls, []);
  assert.deepEqual(harness.toasts, []);
  assert.equal(await harness.navigation.whenIdle(), false);

  const switchFailure = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    nodes: { n1: {} },
    activeCanvasId: 'c1',
    switchTo: async () => {
      throw new Error('switch boom');
    },
  });
  switchFailure.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(switchFailure.toasts, [{ message: FAILURE_TOAST, level: 'warn' }]);
  assert.equal(await switchFailure.navigation.whenIdle(), false);
});

test('completionNavigation: 未批准画布工作区时不切换', async () => {
  const modes = [];
  const harness = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    nodes: { n1: {} },
    requestWorkspaceMode: (mode) => {
      modes.push(mode);
      return mode !== 'canvas';
    },
  });
  harness.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(modes, ['canvas']);
  assert.deepEqual(harness.modeCalls, []);
  assert.deepEqual(harness.switchCalls, []);
  assert.deepEqual(harness.toasts, []);
  assert.equal(await harness.navigation.whenIdle(), false);
});

test('completionNavigation: replacement-studio 先就绪再准备并跳转任务结果', async () => {
  const harness = createHarness();
  const payload = { source: 'replacement-studio', taskId: 't1' };
  harness.notify(payload);
  await settle();
  assert.deepEqual(harness.replacementCalls, ['whenReady', 'prepare', { navigate: payload }]);
  assert.deepEqual(harness.modeCalls, ['person-replacement']);
  assert.deepEqual(harness.snapshotCalls, []);
  assert.deepEqual(harness.toasts, []);
  assert.deepEqual(await harness.navigation.whenIdle(), { navigated: payload });
});

test('completionNavigation: replacement-studio 未批准替换工作室时不跳转', async () => {
  const modes = [];
  const harness = createHarness({
    requestWorkspaceMode: (mode) => {
      modes.push(mode);
      return false;
    },
  });
  const payload = { source: 'replacement-studio', taskId: 't2' };
  harness.notify(payload);
  await settle();
  assert.deepEqual(modes, ['person-replacement']);
  assert.deepEqual(harness.replacementCalls, ['whenReady', 'prepare']);
  assert.deepEqual(harness.toasts, []);
  assert.equal(await harness.navigation.whenIdle(), false);
});

test('completionNavigation: destroy 后不再处理通知', async () => {
  const harness = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    nodes: { n1: {} },
  });
  harness.navigation.destroy();
  harness.notify({ source: 'canvas', nodeId: 'n1' });
  harness.notify({ source: 'replacement-studio' });
  await settle();
  assert.deepEqual(harness.snapshotCalls, []);
  assert.deepEqual(harness.replacementCalls, []);
  assert.deepEqual(harness.toasts, []);
  assert.equal(await harness.navigation.whenIdle(), false);
});

test('completionNavigation: 就绪等待期间被销毁则放弃跳转', async () => {
  let navigation;
  const harness = createHarness({
    prepareReplacement: async () => {
      navigation.destroy();
    },
  });
  navigation = harness.navigation;
  harness.notify({ source: 'replacement-studio' });
  await settle();
  assert.deepEqual(harness.replacementCalls, ['whenReady']);
  assert.equal(await navigation.whenIdle(), false);
});

test('completionNavigation: 处理抛错时提示，已销毁时不再提示', async () => {
  const thrown = createHarness({
    getMultiDataSnapshot: () => {
      throw new Error('boom');
    },
  });
  thrown.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(thrown.toasts, [{ message: FAILURE_TOAST, level: 'warn' }]);
  assert.equal(await thrown.navigation.whenIdle(), false);

  let navigation;
  const disposed = createHarness({
    canvases: [{ id: 'c1', nodes: [{ id: 'n1' }] }],
    nodes: { n1: {} },
    activeCanvasId: 'c1',
    setSelectedNodes: () => {
      navigation.destroy();
    },
    focusNode: () => {
      throw new Error('focus boom');
    },
  });
  navigation = disposed.navigation;
  disposed.notify({ source: 'canvas', nodeId: 'n1' });
  await settle();
  assert.deepEqual(disposed.toasts, []);
  assert.equal(disposed.unsubscribeCount(), 1);
  assert.equal(await navigation.whenIdle(), false);
});

test('completionNavigation: 多次通知串行执行且不打断前一个', async () => {
  const order = [];
  const state = { active: 'c1' };
  const harness = createHarness({
    canvases: [
      { id: 'c1', nodes: [{ id: 'n1' }] },
      { id: 'c2', nodes: [{ id: 'n2' }] },
    ],
    nodes: { n1: {}, n2: {} },
    getActiveCanvasId: () => state.active,
    switchTo: async (canvasId) => {
      order.push('switch:' + canvasId);
      state.active = canvasId;
    },
    focusNode: (nodeId) => {
      order.push('focus:' + nodeId);
      return { focused: nodeId };
    },
  });
  harness.notify({ source: 'canvas', nodeId: 'n1' });
  harness.notify({ source: 'canvas', nodeId: 'n2' });
  await settle();
  assert.deepEqual(order, ['switch:c1', 'focus:n1', 'switch:c2', 'focus:n2']);
  assert.deepEqual(harness.modeCalls, ['canvas', 'canvas']);
  assert.deepEqual(await harness.navigation.whenIdle(), { focused: 'n2' });
});
