import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryCanvasSyncWorkspaceController } from './storyCanvasSyncWorkspaceController.js';

const createElementStub = () => ({
  hidden: false,
  attributes: {},
  classList: { toggles: [], toggle(name, value) { this.toggles.push([name, value]); } },
  setAttribute(name, value) {
    this.attributes[name] = value;
  },
  removeAttribute(name) {
    delete this.attributes[name];
  },
  querySelector: () => null,
  focus() {
    this.focused = true;
  },
});

const tick = () => new Promise((resolve) => setImmediate(resolve));

function createHarness(overrides = {}) {
  const state = { view: 'episode', selectedEpisodeId: 'e1', canvasSyncPending: false, canvasSyncScope: '' };
  const root = createElementStub();
  const workspaceShell = createElementStub();
  const loadingElement = createElementStub();
  const calls = {
    closeMenu: 0,
    refreshToolbar: 0,
    syncEntry: [],
    schedule: [],
    refreshEpisodeRail: [],
    workspaceMode: [],
    handleMediaNodeChanges: [],
    toasts: [],
  };

  const token = () => ({
    projectId: 'p1',
    data: {
      project: { id: 'p1', canvasBinding: {}, episodes: [{ id: 'e1', clips: [] }], assets: [] },
      episodes: [{ id: 'e1', title: '第一集', clips: [] }],
      clipFrames: [],
    },
    modelSettings: {
      models: { image: 'im', video: 'vm' },
      imageProvider: 'ip',
      videoProvider: 'vp',
      imageGenerationParams: { a: 1 },
      videoGenerationParams: { b: 2 },
    },
  });

  const dependencies = {
    state,
    root,
    workspaceShell,
    loadingElement,
    documentObject: { activeElement: null },
    operations: {},
    projectTasks: {
      createToken: token,
      isCurrent: () => true,
      isLive: () => true,
      syncEntry: (entry) => calls.syncEntry.push(entry),
    },
    persistence: { schedule: (options) => calls.schedule.push(options) },
    presentation: {
      closeMenu: () => {
        calls.closeMenu += 1;
      },
      handleMediaNodeChanges: (payload) => calls.handleMediaNodeChanges.push(payload),
      refreshEpisodeRail: (options) => calls.refreshEpisodeRail.push(options),
      refreshToolbar: () => {
        calls.refreshToolbar += 1;
      },
      requestWorkspaceMode: (mode) => calls.workspaceMode.push(mode),
      showToast: (message, tone) => calls.toasts.push([message, tone]),
    },
    getSelectedEpisode: () => ({ id: 'e1' }),
    getProjectCanvasEpisodes: (episodes, selectedId) => episodes.filter((episode) => episode.id === selectedId),
    resolveClipGenerationSettings: (clip, entry) => ({ clip, entry }),
    ...overrides,
  };

  return { state, root, workspaceShell, loadingElement, calls, dependencies, create: () => createStoryCanvasSyncWorkspaceController(dependencies) };
}

test('storyCanvasSyncWorkspaceController: 缺 state 时抛 TypeError', () => {
  assert.throws(() => createStoryCanvasSyncWorkspaceController(), /Story canvas sync requires workspace state/);
  assert.throws(() => createStoryCanvasSyncWorkspaceController({ state: 'nope' }), /requires workspace state/);
});

test('storyCanvasSyncWorkspaceController: 四组依赖各自缺方法时报出可定位的错误', () => {
  assert.throws(
    () => createHarness({ projectTasks: {} }).create(),
    /Story canvas sync project tasks requires createToken/,
  );
  assert.throws(
    () => createHarness({ persistence: {} }).create(),
    /Story canvas sync persistence requires schedule/,
  );
  assert.throws(
    () => createHarness({ presentation: { closeMenu() {}, handleMediaNodeChanges() {}, refreshEpisodeRail() {}, requestWorkspaceMode() {}, showToast() {} } }).create(),
    /Story canvas sync presentation requires refreshToolbar/,
  );
  assert.throws(
    () => createHarness({ resolveClipGenerationSettings: null }).create(),
    /Story canvas sync projection requires resolveClipGenerationSettings/,
  );
});

test('storyCanvasSyncWorkspaceController: 依赖齐备时返回冻结的四个方法', () => {
  const controller = createHarness().create();
  assert.deepEqual(Object.keys(controller).sort(), ['addProject', 'addSelectedEpisode', 'destroy', 'syncFrame']);
  assert.equal(Object.isFrozen(controller), true);
});

test('storyCanvasSyncWorkspaceController: syncFrame 在缺服务或缺参数时返回 false', async () => {
  const harness = createHarness();
  const controller = harness.create();

  assert.equal(await controller.syncFrame({ data: { project: { canvasBinding: { canvasId: 'c1' } } } }, { id: 'f1' }), false);

  const withService = createHarness({ operations: { syncClipFrame: async () => ({ synced: true }) } });
  const syncing = withService.create();
  assert.equal(await syncing.syncFrame({ data: { project: { canvasBinding: {} } } }, { id: 'f1' }), false);
  assert.equal(await syncing.syncFrame({ data: { project: { canvasBinding: { canvasId: 'c1' } } } }, null), false);
});

test('storyCanvasSyncWorkspaceController: syncFrame 在服务未同步或找不到对应帧时返回 false', async () => {
  const entry = () => ({ data: { project: { canvasBinding: { canvasId: 'c1' } }, clipFrames: [{ id: 'f1', imageUrl: 'http://x/a.png' }] } });

  const notSynced = createHarness({ operations: { syncClipFrame: async () => ({ synced: false }) } });
  assert.equal(await notSynced.create().syncFrame(entry(), { id: 'f1' }), false);

  const missingFrame = createHarness({ operations: { syncClipFrame: async () => ({ synced: true, frame: {} }) } });
  assert.equal(await missingFrame.create().syncFrame(entry(), { id: 'other' }), false);
});

test('storyCanvasSyncWorkspaceController: syncFrame 成功时写回帧、存盘并在本集视图刷新栏目', async () => {
  const harness = createHarness({
    operations: { syncClipFrame: async () => ({ synced: true, frame: { imageUrl: 'http://x/synced.png' } }) },
  });
  const controller = harness.create();
  const entry = {
    data: { project: { canvasBinding: { canvasId: 'c1' } }, clipFrames: [{ id: 'f1', imageUrl: 'http://x/a.png' }] },
  };

  assert.equal(await controller.syncFrame(entry, { id: 'f1' }), true);
  assert.equal(entry.data.clipFrames[0].imageUrl, 'http://x/synced.png');
  assert.equal(harness.calls.syncEntry.length, 1);
  assert.deepEqual(harness.calls.schedule, [{ immediate: true }]);
  assert.deepEqual(harness.calls.refreshEpisodeRail, [{ refreshContent: true }]);
});

test('storyCanvasSyncWorkspaceController: syncFrame 在非本集视图时不刷新栏目', async () => {
  const harness = createHarness({
    operations: { syncClipFrame: async () => ({ synced: true, frame: {} }) },
  });
  harness.state.view = 'canvas';
  const controller = harness.create();
  const entry = {
    data: { project: { canvasBinding: { canvasId: 'c1' } }, clipFrames: [{ id: 'f1', imageUrl: 'http://x/a.png' }] },
  };

  assert.equal(await controller.syncFrame(entry, { id: 'f1' }), true);
  assert.deepEqual(harness.calls.refreshEpisodeRail, []);
});

test('storyCanvasSyncWorkspaceController: syncFrame 出错时按当前任务给警示提示', async () => {
  const harness = createHarness({
    operations: {
      syncClipFrame: async () => {
        throw new Error('同步炸了');
      },
    },
  });
  const controller = harness.create();
  const entry = {
    data: { project: { canvasBinding: { canvasId: 'c1' } }, clipFrames: [{ id: 'f1', imageUrl: 'http://x/a.png' }] },
  };

  assert.equal(await controller.syncFrame(entry, { id: 'f1' }), false);
  assert.deepEqual(harness.calls.toasts, [['同步炸了', 'warning']]);
  assert.deepEqual(harness.calls.schedule, []);
});

test('storyCanvasSyncWorkspaceController: syncFrame 出错但任务已过期时不弹提示', async () => {
  const harness = createHarness({
    projectTasks: {
      createToken: () => ({ projectId: 'p1', data: {} }),
      isCurrent: () => false,
      isLive: () => true,
      syncEntry() {},
    },
    operations: {
      syncClipFrame: async () => {
        throw new Error('同步炸了');
      },
    },
  });
  const entry = {
    data: { project: { canvasBinding: { canvasId: 'c1' } }, clipFrames: [{ id: 'f1' }] },
  };

  assert.equal(await harness.create().syncFrame(entry, { id: 'f1' }), false);
  assert.deepEqual(harness.calls.toasts, []);
});

test('storyCanvasSyncWorkspaceController: 加本集在没有选中集或服务未就绪时给确定结果', async () => {
  const noEpisode = createHarness({ getSelectedEpisode: () => null });
  assert.equal(await noEpisode.create().addSelectedEpisode(), false);

  const noService = createHarness();
  assert.equal(await noService.create().addSelectedEpisode(), false);
  assert.deepEqual(noService.calls.toasts, [['项目关联画布服务尚未初始化。', 'error']]);
});

test('storyCanvasSyncWorkspaceController: 加本集成功时绑定画布、同步帧并切到画布视图', async () => {
  const harness = createHarness({
    operations: {
      createEpisodeCanvas: async () => ({ canvasId: 'c9', nodes: [{ id: 'n1' }], reused: false }),
      syncClipFrame: async () => ({ synced: true, frame: {} }),
    },
  });
  const controller = harness.create();

  assert.equal(await controller.addSelectedEpisode(), true);
  assert.deepEqual(harness.calls.workspaceMode, ['canvas']);
  assert.deepEqual(harness.calls.toasts, [['已创建项目关联画布并同步本集。', 'success']]);
  assert.equal(harness.calls.syncEntry.length >= 1, true);
  assert.deepEqual(harness.calls.handleMediaNodeChanges, [{ canvasId: 'c9', nodes: [{ id: 'n1' }] }]);
});

test('storyCanvasSyncWorkspaceController: 加本集复用已有画布时用另一句成功提示', async () => {
  const harness = createHarness({
    operations: {
      createEpisodeCanvas: async () => ({ canvasId: 'c9', nodes: [], reused: true }),
      syncClipFrame: async () => ({ synced: true, frame: {} }),
    },
  });
  await harness.create().addSelectedEpisode();
  assert.deepEqual(harness.calls.toasts, [['已同步本集到项目关联画布。', 'success']]);
});

test('storyCanvasSyncWorkspaceController: 加本集失败时用错误信息提示并返回 false', async () => {
  const harness = createHarness({
    operations: {
      createEpisodeCanvas: async () => {
        throw new Error('创建失败');
      },
    },
  });
  assert.equal(await harness.create().addSelectedEpisode(), false);
  assert.deepEqual(harness.calls.toasts, [['创建失败', 'error']]);
});

test('storyCanvasSyncWorkspaceController: 加整个项目在没有分集或服务未就绪时给确定结果', async () => {
  const noEpisode = createHarness({ getProjectCanvasEpisodes: () => [] });
  assert.equal(await noEpisode.create().addProject(), false);

  const noService = createHarness();
  assert.equal(await noService.create().addProject(), false);
  assert.deepEqual(noService.calls.toasts, [['项目画布服务尚未初始化。', 'error']]);
});

test('storyCanvasSyncWorkspaceController: 加整个项目成功时按新增数量给提示', async () => {
  const created = createHarness({
    operations: { createProjectCanvas: async () => ({ canvasId: 'c7', nodes: [], reused: false, createdCount: 5 }) },
  });
  assert.equal(await created.create().addProject(), true);
  assert.deepEqual(created.calls.toasts, [['已创建项目画布，加入 5 项内容。', 'success']]);
  assert.deepEqual(created.calls.workspaceMode, ['canvas']);

  const reused = createHarness({
    operations: { createProjectCanvas: async () => ({ canvasId: 'c7', nodes: [], reused: true, updatedCount: 3, createdCount: 2 }) },
  });
  assert.equal(await reused.create().addProject(), true);
  assert.deepEqual(reused.calls.toasts, [['项目画布已同步：更新 3 项，新增 2 项。', 'success']]);
});

test('storyCanvasSyncWorkspaceController: 加整个项目失败时给错误提示', async () => {
  const harness = createHarness({
    operations: {
      createProjectCanvas: async () => {
        throw new Error('同步失败');
      },
    },
  });
  assert.equal(await harness.create().addProject(), false);
  assert.deepEqual(harness.calls.toasts, [['同步失败', 'error']]);
});

test('storyCanvasSyncWorkspaceController: 待处理期间给根节点与遮罩打标记，结束后再撤掉', async () => {
  let release;
  const harness = createHarness({
    operations: {
      createEpisodeCanvas: () =>
        new Promise((resolve) => {
          release = () => resolve({ canvasId: 'c9', nodes: [], reused: false });
        }),
      syncClipFrame: async () => ({ synced: true, frame: {} }),
    },
  });
  const controller = harness.create();
  const pending = controller.addSelectedEpisode();

  assert.equal(harness.state.canvasSyncPending, true);
  assert.equal(harness.state.canvasSyncScope, 'episode');
  assert.deepEqual(harness.root.classList.toggles, [['is-canvas-sync-pending', true]]);
  assert.equal(harness.root.attributes['aria-busy'], 'true');
  assert.equal(harness.workspaceShell.inert, true);
  assert.equal(harness.workspaceShell.attributes.inert, '');
  assert.equal(harness.loadingElement.hidden, false);
  assert.equal(harness.loadingElement.attributes['aria-hidden'], 'false');
  assert.equal(harness.calls.closeMenu, 1);

  await tick();
  release();
  await pending;

  assert.equal(harness.state.canvasSyncPending, false);
  assert.equal(harness.state.canvasSyncScope, '');
  assert.deepEqual(harness.root.classList.toggles[1], ['is-canvas-sync-pending', false]);
  assert.equal(harness.root.attributes['aria-busy'], 'false');
  assert.equal(harness.workspaceShell.inert, false);
  assert.equal(harness.workspaceShell.attributes.inert, undefined, 'inert 属性被移除');
  assert.equal(harness.loadingElement.hidden, true);
});

test('storyCanvasSyncWorkspaceController: 同一项目并发请求只真的执行一次', async () => {
  let calls = 0;
  const harness = createHarness({
    operations: {
      createEpisodeCanvas: async () => {
        calls += 1;
        return { canvasId: 'c9', nodes: [], reused: false };
      },
      syncClipFrame: async () => ({ synced: true, frame: {} }),
    },
  });
  const controller = harness.create();

  const first = controller.addSelectedEpisode();
  const second = controller.addSelectedEpisode();
  assert.equal(await first, true);
  assert.equal(await second, true);
  assert.equal(calls, 1, '第二次直接复用了第一次的内部 promise，没有重复执行');
});

test('storyCanvasSyncWorkspaceController: destroy 会清空待处理状态并恢复界面', async () => {
  let release;
  const harness = createHarness({
    operations: {
      createEpisodeCanvas: () =>
        new Promise((resolve) => {
          release = () => resolve({ canvasId: 'c9', nodes: [], reused: false });
        }),
      syncClipFrame: async () => ({ synced: true, frame: {} }),
    },
  });
  const controller = harness.create();
  const pending = controller.addSelectedEpisode();
  controller.destroy();

  assert.equal(harness.state.canvasSyncPending, false);
  assert.equal(harness.workspaceShell.inert, false);

  await tick();
  release();
  await pending;
});
