import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __resetGenerationTaskRuntimeForTest,
  cancelTask,
  resumeTask,
  submitTask,
} from './generationTaskRuntime.js';
import {
  __completionSoundServiceForTest,
  setCompletionSoundSettingsCache,
} from '../services/completionSoundService.js';
const originalWindow = globalThis.window;
function createMockStore(_0x172529 = {}) {
  const _0x33589f = { nodes: { ..._0x172529 }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } };
  return {
    state: _0x33589f,
    addNode(_0x5b9c85) {
      _0x33589f.nodes[_0x5b9c85.id] = { ..._0x5b9c85 };
    },
    updateNodeData(_0x4915df, _0x6e1cb) {
      _0x33589f.nodes[_0x4915df] = { ...(_0x33589f.nodes[_0x4915df] || { id: _0x4915df }), ..._0x6e1cb };
    },
    getState() {
      return _0x33589f;
    },
    getStateRaw() {
      return _0x33589f;
    },
  };
}
function baseSpec(_0x29ad51 = {}) {
  return {
    sourceNodeId: 'source-1',
    targetNodeId: 'target-1',
    trigger: 'toolbar',
    taskType: 'image-hd',
    provider: 'runninghubwf',
    adapterType: 'workflow',
    modelId: 'runninghub/test',
    executionId: 'runninghub.test',
    payload: { prompt: 'go' },
    cancellable: true,
    resumable: true,
    resultBuilder: (_0x2c9a70) => ({ outputText: _0x2c9a70.text || 'done' }),
    ..._0x29ad51,
  };
}
(test.beforeEach(() => {
  (__resetGenerationTaskRuntimeForTest(),
    __completionSoundServiceForTest.reset(),
    setCompletionSoundSettingsCache({ enabled: false }),
    (globalThis.window = {
      electronAPI: {
        notification: { showGenerationComplete: async () => ({ success: true, shown: false }) },
      },
    }));
}),
  test.afterEach(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }),
  test('generationTaskRuntime: workflow submit writes task id, polls, and stores success', async () => {
    const _0x2053c2 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      _0x150a9d = [],
      _0x331cc6 = await submitTask(
        baseSpec({
          submit: async (_0x5ba005, _0x44ba60) => {
            return (_0x150a9d.push(['submit', _0x44ba60.targetNodeId]), { data: { taskId: 'rh-task-1' } });
          },
          poll: async ({ taskId: _0x3c1c6d }) => {
            return (_0x150a9d.push(['poll', _0x3c1c6d]), { text: 'ok' });
          },
        }),
        { store: _0x2053c2, now: () => 0x3e8 },
      ),
      _0x44a473 = _0x2053c2.state.nodes['target-1'];
    (assert.equal(_0x331cc6.ok, true),
      assert.deepEqual(_0x150a9d, [
        ['submit', 'target-1'],
        ['poll', 'rh-task-1'],
      ]),
      assert.equal(_0x44a473.isGenerating, false),
      assert.equal(_0x44a473.jobStatus, 'success'),
      assert.equal(_0x44a473.rhTaskId, 'rh-task-1'),
      assert.equal(_0x44a473.rhTaskStatus, 'success'),
      assert.equal(_0x44a473.rhSourceNodeId, 'source-1'),
      assert.equal(_0x44a473.rhToolbarTaskType, 'image-hd'),
      assert.equal(_0x44a473.taskCancellable, true),
      assert.equal(_0x44a473.taskResumable, true),
      assert.equal(_0x44a473.taskAdapterType, 'workflow'),
      assert.equal(_0x44a473.outputText, 'ok'));
  }),
  test('generationTaskRuntime: success plays completion sound once', async () => {
    const _0x5adaac = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      _0x1004a8 = [],
      _0x38aa52 = [];
    ((globalThis.window.electronAPI.notification.showGenerationComplete = async (_0x149703) => {
      return (_0x38aa52.push(_0x149703), { success: true, shown: true });
    }),
      setCompletionSoundSettingsCache({ enabled: true, volume: 0.4 }),
      __completionSoundServiceForTest.setAudioFactory((_0x22535f) => ({
        set volume(_0x30283a) {
          _0x1004a8.push(['volume', _0x30283a]);
        },
        play: async () => {
          _0x1004a8.push(['play', _0x22535f]);
        },
      })));
    const _0xb49a48 = await submitTask(baseSpec({ submit: async () => ({ result: { text: 'ok' } }) }), {
      store: _0x5adaac,
      now: () => 0x3e8,
    });
    (assert.equal(_0xb49a48.status, 'success'),
      await Promise.resolve(),
      await Promise.resolve(),
      assert.deepEqual(_0x1004a8, [
        ['volume', 0.4],
        ['play', 'assets/sounds/notify.mp3'],
      ]),
      assert.deepEqual(_0x38aa52, [{ title: 'updream canvas', body: '生成任务已完成。' }]));
  }),
  test('generationTaskRuntime: resume skips duplicate recovery while foreground task is active', async () => {
    const _0x2c4df9 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      _0x56b42b = [],
      _0x5c5579 = [];
    let _0x5040e9, _0x143e1b;
    const _0x3dd366 = new Promise((_0x16cad1) => {
        _0x5040e9 = _0x16cad1;
      }),
      _0x545a29 = new Promise((_0x4de943) => {
        _0x143e1b = _0x4de943;
      });
    ((globalThis.window.electronAPI.notification.showGenerationComplete = async (_0xf3de01) => {
      return (_0x5c5579.push(_0xf3de01), { success: true, shown: true });
    }),
      setCompletionSoundSettingsCache({ enabled: true, volume: 0.4 }),
      __completionSoundServiceForTest.setAudioFactory((_0x3aac8c) => ({
        set volume(_0x4bbd86) {
          _0x56b42b.push(['volume', _0x4bbd86]);
        },
        play: async () => {
          _0x56b42b.push(['play', _0x3aac8c]);
        },
      })));
    const _0x56b455 = submitTask(
      baseSpec({
        submit: async () => ({ taskId: 'rh-dupe-1' }),
        poll: async ({ taskId: _0x34126a }) => {
          return (assert.equal(_0x34126a, 'rh-dupe-1'), _0x143e1b(), await _0x3dd366, { text: 'foreground' });
        },
      }),
      { store: _0x2c4df9, now: () => 0x3e8 },
    );
    await _0x545a29;
    let _0x35ae24 = 0;
    const _0x57d937 = await resumeTask(
      baseSpec({
        taskId: 'rh-dupe-1',
        poll: async () => {
          return ((_0x35ae24 += 1), { text: 'recovery' });
        },
      }),
      { store: _0x2c4df9, now: () => 0x44c },
    );
    (assert.equal(_0x57d937.ok, true),
      assert.equal(_0x57d937.status, 'running'),
      assert.equal(_0x57d937.alreadyActive, true),
      assert.equal(_0x57d937.taskId, 'rh-dupe-1'),
      assert.equal(_0x35ae24, 0),
      assert.equal(_0x2c4df9.state.nodes['target-1'].rhTaskRecovering, false),
      _0x5040e9());
    const _0xcf733c = await _0x56b455;
    (await Promise.resolve(), await Promise.resolve());
    const _0x30ffa8 = _0x2c4df9.state.nodes['target-1'];
    (assert.equal(_0xcf733c.status, 'success'),
      assert.equal(_0x30ffa8.outputText, 'foreground'),
      assert.equal(_0x30ffa8.rhTaskStatus, 'success'),
      assert.deepEqual(_0x56b42b, [
        ['volume', 0.4],
        ['play', 'assets/sounds/notify.mp3'],
      ]),
      assert.equal(_0x5c5579.length, 1));
  }),
  test('generationTaskRuntime: pending and failed tasks do not play completion sound', async () => {
    const _0x174bf3 = createMockStore({
        'target-1': { id: 'target-1', type: 'source-image' },
        'target-2': { id: 'target-2', type: 'source-image' },
      }),
      _0x2b54d1 = [],
      _0x3599d7 = [];
    ((globalThis.window.electronAPI.notification.showGenerationComplete = async (_0x5d757c) => {
      return (_0x3599d7.push(_0x5d757c), { success: true, shown: true });
    }),
      setCompletionSoundSettingsCache({ enabled: true }),
      __completionSoundServiceForTest.setAudioFactory((_0x1d09f0) => ({
        set volume(_0x1263ad) {
          _0x2b54d1.push(['volume', _0x1263ad]);
        },
        play: async () => {
          _0x2b54d1.push(['play', _0x1d09f0]);
        },
      })),
      await submitTask(
        baseSpec({ submit: async () => ({ taskId: 'rh-pending' }), poll: async () => ({ pending: true }) }),
        { store: _0x174bf3, now: () => 0x3e8 },
      ),
      await submitTask(
        baseSpec({
          targetNodeId: 'target-2',
          submit: async () => {
            throw new Error('boom');
          },
        }),
        { store: _0x174bf3, now: () => 0x7d0 },
      ),
      await Promise.resolve(),
      await Promise.resolve(),
      assert.deepEqual(_0x2b54d1, []),
      assert.deepEqual(_0x3599d7, []));
  }),
  test('generationTaskRuntime: submit applies business start patch once before submit', async () => {
    const _0x51e153 = createMockStore({
        'target-1': { id: 'target-1', type: 'ai-video', staleField: 'keep' },
      }),
      _0x4dabf0 = [];
    await submitTask(
      baseSpec({
        provider: 'dreamina',
        adapterType: 'modelApi',
        modelId: 'dreamina/video',
        executionId: 'dreamina.video',
        cancellable: false,
        resumable: true,
        startBuilder: (_0x20a2a9) => {
          return (
            _0x4dabf0.push(['startBuilder', _0x20a2a9.targetNodeId]),
            { dreaminaTaskStatus: 'pending', dreaminaTaskPhase: 'generating', asyncTaskStatus: 'idle' }
          );
        },
        onTaskStart: (_0x2844b9) => {
          _0x4dabf0.push(['onTaskStart', _0x2844b9.targetNodeId]);
        },
        submit: async () => {
          return (
            _0x4dabf0.push(['submit', _0x51e153.state.nodes['target-1'].dreaminaTaskStatus]),
            { result: { text: 'started' } }
          );
        },
      }),
      { store: _0x51e153, now: () => 0x834 },
    );
    const _0x45ea6e = _0x51e153.state.nodes['target-1'];
    (assert.deepEqual(_0x4dabf0, [
      ['startBuilder', 'target-1'],
      ['onTaskStart', 'target-1'],
      ['submit', 'pending'],
    ]),
      assert.equal(_0x45ea6e.outputText, 'started'),
      assert.equal(_0x45ea6e.dreaminaTaskStatus, 'pending'),
      assert.equal(_0x45ea6e.asyncTaskStatus, 'idle'));
  }),
  test('generationTaskRuntime: createTargetNode path adds receiver before running', async () => {
    const _0x35b796 = createMockStore();
    await submitTask(
      baseSpec({
        targetNodeId: '',
        createTargetNode: ({ startPatch: _0x5f610d, protocolPatch: _0x584c28 }) => ({
          id: 'created-1',
          type: 'source-image',
          ..._0x5f610d,
          ..._0x584c28,
        }),
        submit: async () => ({ result: { text: 'created' } }),
      }),
      { store: _0x35b796, now: () => 0x7d0 },
    );
    const _0x1ea386 = _0x35b796.state.nodes['created-1'];
    (assert.equal(_0x1ea386.id, 'created-1'),
      assert.equal(_0x1ea386.isGenerating, false),
      assert.equal(_0x1ea386.jobStatus, 'success'),
      assert.equal(_0x1ea386.outputText, 'created'));
  }),
  test('generationTaskRuntime: waitForResult false keeps active task cancellable', async () => {
    const _0x2092c4 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } });
    let _0x56865d = '';
    const _0x1f1688 = await submitTask(
        baseSpec({
          waitForResult: false,
          submit: async () => ({ taskId: 'rh-cancel-1' }),
          cancel: async ({ taskId: _0x5715f8 }) => {
            _0x56865d = _0x5715f8;
          },
        }),
        { store: _0x2092c4, now: () => 0xbb8 },
      ),
      _0x1b9bcc = await cancelTask('target-1', { store: _0x2092c4, now: () => 0x1388 }),
      _0x4ac6c8 = _0x2092c4.state.nodes['target-1'];
    (assert.equal(_0x1f1688.status, 'submitted'),
      assert.equal(_0x1b9bcc.ok, true),
      assert.equal(_0x56865d, 'rh-cancel-1'),
      assert.equal(_0x4ac6c8.isGenerating, false),
      assert.equal(_0x4ac6c8.jobStatus, 'cancelled'),
      assert.equal(_0x4ac6c8.rhTaskStatus, 'cancelled'));
  }),
  test('generationTaskRuntime: cancellation prevents late result patch', async () => {
    const _0x439818 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } });
    let _0x756973,
      _0x45ec58 = '';
    const _0x5853a3 = submitTask(
      baseSpec({
        submit: async () =>
          new Promise((_0xc18c65) => {
            _0x756973 = () => _0xc18c65({ taskId: 'rh-late-1' });
          }),
        poll: async () => ({ text: 'late result' }),
        cancel: async ({ taskId: _0x287ee8 }) => {
          _0x45ec58 = _0x287ee8;
        },
      }),
      { store: _0x439818, now: () => 0xbb8 },
    );
    await new Promise((_0xe717b4) => setTimeout(_0xe717b4, 0));
    const _0xa66821 = await cancelTask('target-1', { store: _0x439818, now: () => 0xdac });
    _0x756973();
    const _0x24d94c = await _0x5853a3,
      _0x338e87 = _0x439818.state.nodes['target-1'];
    (assert.equal(_0xa66821.ok, true),
      assert.equal(_0x24d94c.status, 'cancelled'),
      assert.equal(_0x45ec58, 'rh-late-1'),
      assert.equal(_0x338e87.isGenerating, false),
      assert.equal(_0x338e87.jobStatus, 'cancelled'),
      assert.equal(_0x338e87.rhTaskStatus, 'cancelled'),
      assert.equal(_0x338e87.outputText, undefined));
  }),
  test('generationTaskRuntime: cancellation during result build prevents success patch', async () => {
    const _0x5c4d76 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      _0x10121d = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: 'rh-build-cancel-1' }),
          poll: async () => ({ text: 'late result' }),
          resultBuilder: async () => {
            return (
              await cancelTask('target-1', { store: _0x5c4d76, now: () => 0xdac }),
              { outputText: 'late result' }
            );
          },
        }),
        { store: _0x5c4d76, now: () => 0xbb8 },
      ),
      _0x4237fd = _0x5c4d76.state.nodes['target-1'];
    (assert.equal(_0x10121d.status, 'cancelled'),
      assert.equal(_0x4237fd.isGenerating, false),
      assert.equal(_0x4237fd.jobStatus, 'cancelled'),
      assert.equal(_0x4237fd.rhTaskStatus, 'cancelled'),
      assert.equal(_0x4237fd.outputText, undefined));
  }),
  test('generationTaskRuntime: model API without remote cancel reports not-cancellable', async () => {
    const _0x3d0705 = createMockStore({ 'target-1': { id: 'target-1', type: 'ai-image' } });
    await submitTask(
      baseSpec({
        provider: 'apimart',
        adapterType: 'modelApi',
        modelId: 'apimart/image',
        executionId: 'apimart.image',
        cancellable: false,
        resumable: false,
        waitForResult: false,
        submit: async () => ({ taskId: 'remote-but-not-cancellable' }),
      }),
      { store: _0x3d0705, now: () => 0x1b58 },
    );
    const _0x57be92 = await cancelTask('target-1', { store: _0x3d0705 });
    (assert.deepEqual(_0x57be92, { ok: false, reason: 'not-cancellable', targetNodeId: 'target-1' }),
      assert.equal(_0x3d0705.state.nodes['target-1'].isGenerating, true));
  }),
  test('generationTaskRuntime: pending result keeps task running without terminal patch', async () => {
    const _0x2567e1 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      _0x928ff3 = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: 'rh-pending-1' }),
          poll: async () => ({ pending: true, message: '仍在生成' }),
        }),
        { store: _0x2567e1, now: () => 0x1f40 },
      ),
      _0x49d7a0 = _0x2567e1.state.nodes['target-1'];
    (assert.equal(_0x928ff3.ok, true),
      assert.equal(_0x928ff3.status, 'pending'),
      assert.equal(_0x928ff3.pending, true),
      assert.equal(_0x49d7a0.isGenerating, true),
      assert.equal(_0x49d7a0.jobStatus, 'running'),
      assert.equal(_0x49d7a0.rhTaskId, 'rh-pending-1'),
      assert.equal(_0x49d7a0.rhTaskStatus, 'running'),
      assert.equal(_0x49d7a0.rhStatusMessage, '仍在生成'),
      assert.equal(_0x49d7a0.outputText, undefined));
  }),
  test('generationTaskRuntime: pending foreground task can be resumed after poll exits', async () => {
    const _0x4fb3f6 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      _0x17ca16 = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: 'rh-pending-resume-1' }),
          poll: async () => ({ pending: true, message: 'background' }),
        }),
        { store: _0x4fb3f6, now: () => 0x1f40 },
      );
    assert.equal(_0x17ca16.status, 'pending');
    const _0x4cc0c7 = await resumeTask(
        baseSpec({
          taskId: 'rh-pending-resume-1',
          poll: async ({ taskId: _0x3300ef }) => ({ text: 'resumed:' + _0x3300ef }),
        }),
        { store: _0x4fb3f6, now: () => 0x2328 },
      ),
      _0x592004 = _0x4fb3f6.state.nodes['target-1'];
    (assert.equal(_0x4cc0c7.status, 'success'),
      assert.equal(_0x4cc0c7.alreadyActive, undefined),
      assert.equal(_0x592004.jobStatus, 'success'),
      assert.equal(_0x592004.rhTaskStatus, 'success'),
      assert.equal(_0x592004.outputText, 'resumed:rh-pending-resume-1'));
  }),
  test('generationTaskRuntime: failure and cancellation builders add display patches', async () => {
    const _0x560671 = createMockStore({
      'target-1': { id: 'target-1', type: 'source-image' },
      'target-2': { id: 'target-2', type: 'source-image' },
    });
    (await submitTask(
      baseSpec({
        submit: async () => {
          throw new Error('boom');
        },
        failureBuilder: (_0x3cf38d) => ({ name: '结果失败', outputText: '失败: ' + _0x3cf38d.message }),
      }),
      { store: _0x560671, now: () => 0x2328 },
    ),
      await submitTask(
        baseSpec({
          targetNodeId: 'target-2',
          submit: async () => {
            throw new Error('任务已取消');
          },
          cancelledBuilder: () => ({ name: '结果已取消', outputText: '状态: 已取消' }),
        }),
        { store: _0x560671, now: () => 0x2710 },
      ),
      assert.equal(_0x560671.state.nodes['target-1'].jobStatus, 'error'),
      assert.equal(_0x560671.state.nodes['target-1'].name, '结果失败'),
      assert.equal(_0x560671.state.nodes['target-1'].outputText, '失败: boom'),
      assert.equal(_0x560671.state.nodes['target-2'].jobStatus, 'cancelled'),
      assert.equal(_0x560671.state.nodes['target-2'].name, '结果已取消'),
      assert.equal(_0x560671.state.nodes['target-2'].outputText, '状态: 已取消'));
  }),
  test('generationTaskRuntime: async model API writes async status and resumes', async () => {
    const _0xebc76b = createMockStore({
        'target-1': { id: 'target-1', type: 'ai-image', asyncTaskId: 'async-1', generationStartTime: 0x2328 },
      }),
      _0x43f506 = await resumeTask(
        baseSpec({
          provider: 'vendor',
          adapterType: 'modelApi',
          modelId: 'vendor/async',
          executionId: 'vendor.async',
          cancellable: false,
          resumable: true,
          async: true,
          taskId: 'async-1',
          poll: async ({ taskId: _0x2123a8 }) => ({ text: 'done:' + _0x2123a8 }),
        }),
        { store: _0xebc76b, now: () => 0x2ee0 },
      ),
      _0x41f324 = _0xebc76b.state.nodes['target-1'];
    (assert.equal(_0x43f506.ok, true),
      assert.equal(_0x41f324.isGenerating, false),
      assert.equal(_0x41f324.jobStatus, 'success'),
      assert.equal(_0x41f324.asyncTaskId, 'async-1'),
      assert.equal(_0x41f324.asyncTaskStatus, 'success'),
      assert.equal(_0x41f324.asyncTaskRecovering, false),
      assert.equal(_0x41f324.outputText, 'done:async-1'));
  }),
  test('generationTaskRuntime: resume applies start patch and keeps pending task cancellable', async () => {
    const _0x368db5 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-audio',
          rhTaskId: 'rh-resume-1',
          generationStartTime: 0x2710,
        },
      }),
      _0x4c196e = [];
    let _0x3ac3b2 = '';
    const _0xb4477e = await resumeTask(
        baseSpec({
          taskId: 'rh-resume-1',
          startBuilder: (_0x4b86ef) => {
            return (_0x4c196e.push(['startBuilder', _0x4b86ef.taskId]), { audioWorkflowKey: 'voice-clone' });
          },
          onTaskStart: (_0x3c6fb1) => {
            _0x4c196e.push(['onTaskStart', _0x3c6fb1.taskId]);
          },
          poll: async ({ taskId: _0x135051 }) => {
            return (_0x4c196e.push(['poll', _0x135051]), { pending: true, message: '仍在生成' });
          },
          cancel: async ({ taskId: _0xe06290 }) => {
            _0x3ac3b2 = _0xe06290;
          },
          cancelledBuilder: () => ({ audioUrl: '', outputText: '已取消恢复' }),
        }),
        { store: _0x368db5, now: () => 0x32c8 },
      ),
      _0x178168 = _0x368db5.state.nodes['target-1'];
    (assert.equal(_0xb4477e.status, 'pending'),
      assert.deepEqual(_0x4c196e, [
        ['startBuilder', 'rh-resume-1'],
        ['onTaskStart', 'rh-resume-1'],
        ['poll', 'rh-resume-1'],
      ]),
      assert.equal(_0x178168.isGenerating, true),
      assert.equal(_0x178168.jobStatus, 'running'),
      assert.equal(_0x178168.rhTaskStatus, 'running'),
      assert.equal(_0x178168.rhTaskRecovering, false),
      assert.equal(_0x178168.audioWorkflowKey, 'voice-clone'),
      assert.equal(_0x178168.rhStatusMessage, '仍在生成'));
    const _0x5a893a = await cancelTask('target-1', { store: _0x368db5, now: () => 0x36b0 }),
      _0x520cec = _0x368db5.state.nodes['target-1'];
    (assert.equal(_0x5a893a.status, 'cancelled'),
      assert.equal(_0x3ac3b2, 'rh-resume-1'),
      assert.equal(_0x520cec.jobStatus, 'cancelled'),
      assert.equal(_0x520cec.rhTaskStatus, 'cancelled'),
      assert.equal(_0x520cec.outputText, '已取消恢复'));
  }),
  test('generationTaskRuntime: resume abort uses cancelled builder', async () => {
    const _0x1c27cc = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-audio',
          rhTaskId: 'rh-abort-1',
          generationStartTime: 0x3a98,
        },
      }),
      _0x161c97 = await resumeTask(
        baseSpec({
          taskId: 'rh-abort-1',
          poll: async () => {
            const _0x54a1cb = new Error('CANCELLED');
            _0x54a1cb.name = 'AbortError';
            throw _0x54a1cb;
          },
          cancelledBuilder: () => ({ outputText: '恢复已中断' }),
        }),
        { store: _0x1c27cc, now: () => 0x3e80 },
      ),
      _0x37cad0 = _0x1c27cc.state.nodes['target-1'];
    (assert.equal(_0x161c97.ok, false),
      assert.equal(_0x161c97.status, 'cancelled'),
      assert.equal(_0x37cad0.isGenerating, false),
      assert.equal(_0x37cad0.jobStatus, 'cancelled'),
      assert.equal(_0x37cad0.rhTaskStatus, 'cancelled'),
      assert.equal(_0x37cad0.outputText, '恢复已中断'));
  }),
  test('generationTaskRuntime: resume abort can pause without finalizing duration', async () => {
    const _0x454c80 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-audio',
          rhTaskId: 'rh-pause-1',
          generationStartTime: 0x3a98,
          generationDuration: null,
        },
      }),
      _0x35e73b = await resumeTask(
        baseSpec({
          taskId: 'rh-pause-1',
          pauseOnAbort: true,
          poll: async () => {
            const _0x4d06a4 = new Error('CANCELLED');
            _0x4d06a4.name = 'AbortError';
            throw _0x4d06a4;
          },
          pauseBuilder: () => ({ outputText: '恢复暂停' }),
        }),
        { store: _0x454c80, now: () => 0x3e80 },
      ),
      _0x458bf9 = _0x454c80.state.nodes['target-1'];
    (assert.equal(_0x35e73b.ok, false),
      assert.equal(_0x35e73b.status, 'paused'),
      assert.equal(_0x458bf9.isGenerating, true),
      assert.equal(_0x458bf9.jobStatus, 'running'),
      assert.equal(_0x458bf9.generationStartTime, 0x3a98),
      assert.equal(_0x458bf9.generationDuration, null),
      assert.equal(_0x458bf9.rhTaskStatus, 'running'),
      assert.equal(_0x458bf9.rhTaskRecovering, false),
      assert.equal(_0x458bf9.outputText, '恢复暂停'));
  }),
  test('generationTaskRuntime: cancel builder receives remote cancel result and error', async () => {
    const _0x42dcda = createMockStore({
      'target-1': {
        id: 'target-1',
        type: 'source-image',
        rhTaskId: 'rh-cancel-result-1',
        generationStartTime: 0x4268,
      },
      'target-2': {
        id: 'target-2',
        type: 'source-image',
        rhTaskId: 'rh-cancel-error-1',
        generationStartTime: 0x4268,
      },
    });
    (await submitTask(
      baseSpec({
        targetNodeId: 'target-1',
        waitForResult: false,
        submit: async () => ({ taskId: 'rh-cancel-result-1' }),
        cancel: async () => ({ code: 0, msg: 'remote ok' }),
        cancelledBuilder: ({ remoteResult: _0x4ac02e }) => ({ outputText: _0x4ac02e?.msg || '' }),
      }),
      { store: _0x42dcda, now: () => 0x4268 },
    ),
      await cancelTask('target-1', { store: _0x42dcda, now: () => 0x445c }),
      await submitTask(
        baseSpec({
          targetNodeId: 'target-2',
          waitForResult: false,
          submit: async () => ({ taskId: 'rh-cancel-error-1' }),
          cancel: async () => {
            throw new Error('remote failed');
          },
          cancelledBuilder: ({ remoteError: _0x8163fb }) => ({ outputText: _0x8163fb?.message || '' }),
        }),
        { store: _0x42dcda, now: () => 0x4650 },
      ),
      await cancelTask('target-2', { store: _0x42dcda, now: () => 0x4844 }),
      assert.equal(_0x42dcda.state.nodes['target-1'].outputText, 'remote ok'),
      assert.equal(_0x42dcda.state.nodes['target-2'].outputText, 'remote failed'),
      assert.equal(_0x42dcda.state.nodes['target-1'].jobStatus, 'cancelled'),
      assert.equal(_0x42dcda.state.nodes['target-2'].jobStatus, 'cancelled'));
  }),
  test('generationTaskRuntime: local abort does not overwrite explicit cancel patch', async () => {
    const _0x12edb9 = createMockStore({
      'target-1': { id: 'target-1', type: 'source-image', generationStartTime: 0x4a38 },
    });
    let _0x41f7ee;
    const _0x47128c = submitTask(
      baseSpec({
        submit: async () => ({ taskId: 'rh-no-overwrite-1' }),
        poll: async () =>
          new Promise((_0x1cfe29, _0x2e2301) => {
            _0x41f7ee = _0x2e2301;
          }),
        cancel: async () => ({ code: 0, msg: 'remote ok' }),
        cancelledBuilder: () => ({ outputText: 'late cancelled patch' }),
      }),
      { store: _0x12edb9, now: () => 0x4a38 },
    );
    (await new Promise((_0xb3e769) => setTimeout(_0xb3e769, 0)),
      await cancelTask('target-1', {
        store: _0x12edb9,
        now: () => 0x4c2c,
        cancelledBuilder: () => ({ outputText: 'remote cancel patch' }),
      }));
    const _0x435d48 = new Error('CANCELLED');
    ((_0x435d48.name = 'AbortError'), _0x41f7ee(_0x435d48));
    const _0x47c5b5 = await _0x47128c,
      _0x4373db = _0x12edb9.state.nodes['target-1'];
    (assert.equal(_0x47c5b5.status, 'cancelled'),
      assert.equal(_0x4373db.jobStatus, 'cancelled'),
      assert.equal(_0x4373db.outputText, 'remote cancel patch'));
  }),
  test('generationTaskRuntime: submit abort can pause without finalizing duration', async () => {
    const _0x29fad3 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-image',
          generationStartTime: 0x4e20,
          generationDuration: null,
        },
      }),
      _0x250dd9 = new AbortController();
    let _0xa3050f;
    const _0x8f4952 = submitTask(
      baseSpec({
        pauseOnAbort: true,
        submit: async () => ({ taskId: 'rh-submit-pause-1' }),
        poll: async () =>
          new Promise((_0x1838ed, _0x2fa174) => {
            _0xa3050f = _0x2fa174;
          }),
      }),
      { store: _0x29fad3, now: () => 0x4e20, abortController: _0x250dd9 },
    );
    (await new Promise((_0x345fbd) => setTimeout(_0x345fbd, 0)), _0x250dd9.abort());
    const _0x1b7f9f = new Error('CANCELLED');
    ((_0x1b7f9f.name = 'AbortError'), _0xa3050f(_0x1b7f9f));
    const _0x198fef = await _0x8f4952,
      _0x509baa = _0x29fad3.state.nodes['target-1'];
    (assert.equal(_0x198fef.status, 'paused'),
      assert.equal(_0x509baa.isGenerating, true),
      assert.equal(_0x509baa.jobStatus, 'running'),
      assert.equal(_0x509baa.rhTaskStatus, 'running'),
      assert.equal(_0x509baa.generationDuration, null));
  }),
  test('generationTaskRuntime: submit abort can pause only after task id is known', async () => {
    const _0x1d9bb6 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-video',
          generationStartTime: 0x5208,
          generationDuration: null,
        },
      }),
      _0x288298 = await submitTask(
        baseSpec({
          targetNodeId: 'target-1',
          taskType: 'video-frame',
          pauseOnAbort: 'afterTaskId',
          submit: async () => ({ taskId: 'rh-after-task-id-1' }),
          poll: async () => {
            const _0x2bb73a = new Error('CANCELLED');
            _0x2bb73a.name = 'AbortError';
            throw _0x2bb73a;
          },
        }),
        { store: _0x1d9bb6, now: () => 0x5208 },
      ),
      _0x4225d9 = _0x1d9bb6.state.nodes['target-1'];
    (assert.equal(_0x288298.status, 'paused'),
      assert.equal(_0x288298.taskId, 'rh-after-task-id-1'),
      assert.equal(_0x4225d9.isGenerating, true),
      assert.equal(_0x4225d9.jobStatus, 'running'),
      assert.equal(_0x4225d9.rhTaskStatus, 'running'),
      assert.equal(_0x4225d9.rhTaskId, 'rh-after-task-id-1'),
      assert.equal(_0x4225d9.generationDuration, null));
  }),
  test('generationTaskRuntime: submit abort before task id is not paused', async () => {
    const _0x18886b = createMockStore({
        'target-1': { id: 'target-1', type: 'source-video', generationStartTime: 0x55f0 },
      }),
      _0x3dd24b = await submitTask(
        baseSpec({
          targetNodeId: 'target-1',
          taskType: 'video-frame',
          pauseOnAbort: 'afterTaskId',
          submit: async () => {
            const _0x392065 = new Error('CANCELLED');
            _0x392065.name = 'AbortError';
            throw _0x392065;
          },
        }),
        { store: _0x18886b, now: () => 0x55f0 },
      ),
      _0x17006f = _0x18886b.state.nodes['target-1'];
    (assert.equal(_0x3dd24b.status, 'cancelled'),
      assert.equal(_0x3dd24b.taskId, ''),
      assert.equal(_0x17006f.isGenerating, false),
      assert.equal(_0x17006f.jobStatus, 'cancelled'),
      assert.equal(_0x17006f.rhTaskStatus, 'cancelled'),
      assert.equal(_0x17006f.rhTaskId, ''));
  }),
  test('generationTaskRuntime: submit failure stores failure status', async () => {
    const _0x6e271d = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      _0x1c61b9 = await submitTask(
        baseSpec({
          submit: async () => {
            throw new Error('boom');
          },
        }),
        { store: _0x6e271d, now: () => 0x3a98 },
      ),
      _0xd65544 = _0x6e271d.state.nodes['target-1'];
    (assert.equal(_0x1c61b9.ok, false),
      assert.equal(_0xd65544.isGenerating, false),
      assert.equal(_0xd65544.jobStatus, 'error'),
      assert.equal(_0xd65544.jobError, 'boom'),
      assert.equal(_0xd65544.rhTaskStatus, 'failed'));
  }),
  test('generationTaskRuntime: submit failure can normalize provider errors', async () => {
    const _0x3b12c7 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } });
    (await submitTask(
      baseSpec({
        parseError: (_0x5bd24a) => _0x5bd24a?.getUserMessage?.(),
        submit: async () => {
          throw { message: 'raw provider error', getUserMessage: () => '用户可读错误' };
        },
      }),
      { store: _0x3b12c7, now: () => 0x4268 },
    ),
      assert.equal(_0x3b12c7.state.nodes['target-1'].jobError, '用户可读错误'));
  }));
