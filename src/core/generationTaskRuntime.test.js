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
function createMockStore(args = {}) {
  const state = { nodes: { ...args }, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } };
  return {
    state: state,
    addNode(args2) {
      state.nodes[args2.id] = { ...args2 };
    },
    updateNodeData(id2, args3) {
      state.nodes[id2] = { ...(state.nodes[id2] || { id: id2 }), ...args3 };
    },
    getState() {
      return state;
    },
    getStateRaw() {
      return state;
    },
  };
}
function baseSpec(args4 = {}) {
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
    resultBuilder: (outputText) => ({ outputText: outputText.text || 'done' }),
    ...args4,
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
    const store = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      list = [],
      response = await submitTask(
        baseSpec({
          submit: async (value, item) => {
            return (list.push(['submit', item.targetNodeId]), { data: { taskId: 'rh-task-1' } });
          },
          poll: async ({ taskId: taskId }) => {
            return (list.push(['poll', taskId]), { text: 'ok' });
          },
        }),
        { store: store, now: () => 1000 },
      ),
      key = store.state.nodes['target-1'];
    (assert.equal(response.ok, true),
      assert.deepEqual(list, [
        ['submit', 'target-1'],
        ['poll', 'rh-task-1'],
      ]),
      assert.equal(key.isGenerating, false),
      assert.equal(key.jobStatus, 'success'),
      assert.equal(key.rhTaskId, 'rh-task-1'),
      assert.equal(key.rhTaskStatus, 'success'),
      assert.equal(key.rhSourceNodeId, 'source-1'),
      assert.equal(key.rhToolbarTaskType, 'image-hd'),
      assert.equal(key.taskCancellable, true),
      assert.equal(key.taskResumable, true),
      assert.equal(key.taskAdapterType, 'workflow'),
      assert.equal(key.outputText, 'ok'));
  }),
  test('generationTaskRuntime: success plays completion sound once', async () => {
    const store2 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      list2 = [],
      list3 = [];
    ((globalThis.window.electronAPI.notification.showGenerationComplete = async (index) => {
      return (list3.push(index), { success: true, shown: true });
    }),
      setCompletionSoundSettingsCache({ enabled: true, volume: 0.4 }),
      __completionSoundServiceForTest.setAudioFactory((result) => ({
        set volume(data) {
          list2.push(['volume', data]);
        },
        play: async () => {
          list2.push(['play', result]);
        },
      })));
    const response2 = await submitTask(baseSpec({ submit: async () => ({ result: { text: 'ok' } }) }), {
      store: store2,
      now: () => 1000,
    });
    (assert.equal(response2.status, 'success'),
      await Promise.resolve(),
      await Promise.resolve(),
      assert.deepEqual(list2, [
        ['volume', 0.4],
        ['play', 'assets/sounds/notify.mp3'],
      ]),
      assert.deepEqual(list3, [{ title: 'Canvas', body: '生成任务已完成。' }]));
  }),
  test('generationTaskRuntime: resume skips duplicate recovery while foreground task is active', async () => {
    const store3 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      list4 = [],
      list5 = [];
    let run, handler;
    const options = new Promise((target) => {
        run = target;
      }),
      source = new Promise((next) => {
        handler = next;
      });
    ((globalThis.window.electronAPI.notification.showGenerationComplete = async (current) => {
      return (list5.push(current), { success: true, shown: true });
    }),
      setCompletionSoundSettingsCache({ enabled: true, volume: 0.4 }),
      __completionSoundServiceForTest.setAudioFactory((entry) => ({
        set volume(record) {
          list4.push(['volume', record]);
        },
        play: async () => {
          list4.push(['play', entry]);
        },
      })));
    const submitTask2 = submitTask(
      baseSpec({
        submit: async () => ({ taskId: 'rh-dupe-1' }),
        poll: async ({ taskId: taskId2 }) => {
          return (assert.equal(taskId2, 'rh-dupe-1'), handler(), await options, { text: 'foreground' });
        },
      }),
      { store: store3, now: () => 1000 },
    );
    await source;
    let payload = 0;
    const response3 = await resumeTask(
      baseSpec({
        taskId: 'rh-dupe-1',
        poll: async () => {
          return ((payload += 1), { text: 'recovery' });
        },
      }),
      { store: store3, now: () => 1100 },
    );
    (assert.equal(response3.ok, true),
      assert.equal(response3.status, 'running'),
      assert.equal(response3.alreadyActive, true),
      assert.equal(response3.taskId, 'rh-dupe-1'),
      assert.equal(payload, 0),
      assert.equal(store3.state.nodes['target-1'].rhTaskRecovering, false),
      run());
    const response4 = await submitTask2;
    (await Promise.resolve(), await Promise.resolve());
    const handle = store3.state.nodes['target-1'];
    (assert.equal(response4.status, 'success'),
      assert.equal(handle.outputText, 'foreground'),
      assert.equal(handle.rhTaskStatus, 'success'),
      assert.deepEqual(list4, [
        ['volume', 0.4],
        ['play', 'assets/sounds/notify.mp3'],
      ]),
      assert.equal(list5.length, 1));
  }),
  test('generationTaskRuntime: pending and failed tasks do not play completion sound', async () => {
    const store4 = createMockStore({
        'target-1': { id: 'target-1', type: 'source-image' },
        'target-2': { id: 'target-2', type: 'source-image' },
      }),
      list6 = [],
      list7 = [];
    ((globalThis.window.electronAPI.notification.showGenerationComplete = async (config) => {
      return (list7.push(config), { success: true, shown: true });
    }),
      setCompletionSoundSettingsCache({ enabled: true }),
      __completionSoundServiceForTest.setAudioFactory((scope) => ({
        set volume(input) {
          list6.push(['volume', input]);
        },
        play: async () => {
          list6.push(['play', scope]);
        },
      })),
      await submitTask(
        baseSpec({ submit: async () => ({ taskId: 'rh-pending' }), poll: async () => ({ pending: true }) }),
        { store: store4, now: () => 1000 },
      ),
      await submitTask(
        baseSpec({
          targetNodeId: 'target-2',
          submit: async () => {
            throw new Error('boom');
          },
        }),
        { store: store4, now: () => 2000 },
      ),
      await Promise.resolve(),
      await Promise.resolve(),
      assert.deepEqual(list6, []),
      assert.deepEqual(list7, []));
  }),
  test('generationTaskRuntime: submit applies business start patch once before submit', async () => {
    const store5 = createMockStore({
        'target-1': { id: 'target-1', type: 'ai-video', staleField: 'keep' },
      }),
      list8 = [];
    await submitTask(
      baseSpec({
        provider: 'dreamina',
        adapterType: 'modelApi',
        modelId: 'dreamina/video',
        executionId: 'dreamina.video',
        cancellable: false,
        resumable: true,
        startBuilder: (output) => {
          return (
            list8.push(['startBuilder', output.targetNodeId]),
            { dreaminaTaskStatus: 'pending', dreaminaTaskPhase: 'generating', asyncTaskStatus: 'idle' }
          );
        },
        onTaskStart: (value2) => {
          list8.push(['onTaskStart', value2.targetNodeId]);
        },
        submit: async () => {
          return (
            list8.push(['submit', store5.state.nodes['target-1'].dreaminaTaskStatus]),
            { result: { text: 'started' } }
          );
        },
      }),
      { store: store5, now: () => 2100 },
    );
    const value3 = store5.state.nodes['target-1'];
    (assert.deepEqual(list8, [
      ['startBuilder', 'target-1'],
      ['onTaskStart', 'target-1'],
      ['submit', 'pending'],
    ]),
      assert.equal(value3.outputText, 'started'),
      assert.equal(value3.dreaminaTaskStatus, 'pending'),
      assert.equal(value3.asyncTaskStatus, 'idle'));
  }),
  test('generationTaskRuntime: createTargetNode path adds receiver before running', async () => {
    const store6 = createMockStore();
    await submitTask(
      baseSpec({
        targetNodeId: '',
        createTargetNode: ({ startPatch: startPatch, protocolPatch: protocolPatch }) => ({
          id: 'created-1',
          type: 'source-image',
          ...startPatch,
          ...protocolPatch,
        }),
        submit: async () => ({ result: { text: 'created' } }),
      }),
      { store: store6, now: () => 2000 },
    );
    const value4 = store6.state.nodes['created-1'];
    (assert.equal(value4.id, 'created-1'),
      assert.equal(value4.isGenerating, false),
      assert.equal(value4.jobStatus, 'success'),
      assert.equal(value4.outputText, 'created'));
  }),
  test('generationTaskRuntime: waitForResult false keeps active task cancellable', async () => {
    const store7 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } });
    let value5 = '';
    const response5 = await submitTask(
        baseSpec({
          waitForResult: false,
          submit: async () => ({ taskId: 'rh-cancel-1' }),
          cancel: async ({ taskId: taskId3 }) => {
            value5 = taskId3;
          },
        }),
        { store: store7, now: () => 3000 },
      ),
      response6 = await cancelTask('target-1', { store: store7, now: () => 5000 }),
      value6 = store7.state.nodes['target-1'];
    (assert.equal(response5.status, 'submitted'),
      assert.equal(response6.ok, true),
      assert.equal(value5, 'rh-cancel-1'),
      assert.equal(value6.isGenerating, false),
      assert.equal(value6.jobStatus, 'cancelled'),
      assert.equal(value6.rhTaskStatus, 'cancelled'));
  }),
  test('generationTaskRuntime: cancellation prevents late result patch', async () => {
    const store8 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } });
    let run2,
      value7 = '';
    const submitTask3 = submitTask(
      baseSpec({
        submit: async () =>
          new Promise((handler2) => {
            run2 = () => handler2({ taskId: 'rh-late-1' });
          }),
        poll: async () => ({ text: 'late result' }),
        cancel: async ({ taskId: taskId4 }) => {
          value7 = taskId4;
        },
      }),
      { store: store8, now: () => 3000 },
    );
    await new Promise((value8) => setTimeout(value8, 0));
    const response7 = await cancelTask('target-1', { store: store8, now: () => 3500 });
    run2();
    const response8 = await submitTask3,
      value9 = store8.state.nodes['target-1'];
    (assert.equal(response7.ok, true),
      assert.equal(response8.status, 'cancelled'),
      assert.equal(value7, 'rh-late-1'),
      assert.equal(value9.isGenerating, false),
      assert.equal(value9.jobStatus, 'cancelled'),
      assert.equal(value9.rhTaskStatus, 'cancelled'),
      assert.equal(value9.outputText, undefined));
  }),
  test('generationTaskRuntime: cancellation during result build prevents success patch', async () => {
    const store9 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      response9 = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: 'rh-build-cancel-1' }),
          poll: async () => ({ text: 'late result' }),
          resultBuilder: async () => {
            return (
              await cancelTask('target-1', { store: store9, now: () => 3500 }),
              { outputText: 'late result' }
            );
          },
        }),
        { store: store9, now: () => 3000 },
      ),
      value10 = store9.state.nodes['target-1'];
    (assert.equal(response9.status, 'cancelled'),
      assert.equal(value10.isGenerating, false),
      assert.equal(value10.jobStatus, 'cancelled'),
      assert.equal(value10.rhTaskStatus, 'cancelled'),
      assert.equal(value10.outputText, undefined));
  }),
  test('generationTaskRuntime: model API without remote cancel reports not-cancellable', async () => {
    const store10 = createMockStore({ 'target-1': { id: 'target-1', type: 'ai-image' } });
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
      { store: store10, now: () => 7000 },
    );
    const cancelTask2 = await cancelTask('target-1', { store: store10 });
    (assert.deepEqual(cancelTask2, { ok: false, reason: 'not-cancellable', targetNodeId: 'target-1' }),
      assert.equal(store10.state.nodes['target-1'].isGenerating, true));
  }),
  test('generationTaskRuntime: pending result keeps task running without terminal patch', async () => {
    const store11 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      response10 = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: 'rh-pending-1' }),
          poll: async () => ({ pending: true, message: '仍在生成' }),
        }),
        { store: store11, now: () => 8000 },
      ),
      value11 = store11.state.nodes['target-1'];
    (assert.equal(response10.ok, true),
      assert.equal(response10.status, 'pending'),
      assert.equal(response10.pending, true),
      assert.equal(value11.isGenerating, true),
      assert.equal(value11.jobStatus, 'running'),
      assert.equal(value11.rhTaskId, 'rh-pending-1'),
      assert.equal(value11.rhTaskStatus, 'running'),
      assert.equal(value11.rhStatusMessage, '仍在生成'),
      assert.equal(value11.outputText, undefined));
  }),
  test('generationTaskRuntime: pending foreground task can be resumed after poll exits', async () => {
    const store12 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      response11 = await submitTask(
        baseSpec({
          submit: async () => ({ taskId: 'rh-pending-resume-1' }),
          poll: async () => ({ pending: true, message: 'background' }),
        }),
        { store: store12, now: () => 8000 },
      );
    assert.equal(response11.status, 'pending');
    const response12 = await resumeTask(
        baseSpec({
          taskId: 'rh-pending-resume-1',
          poll: async ({ taskId: taskId5 }) => ({ text: 'resumed:' + taskId5 }),
        }),
        { store: store12, now: () => 9000 },
      ),
      value12 = store12.state.nodes['target-1'];
    (assert.equal(response12.status, 'success'),
      assert.equal(response12.alreadyActive, undefined),
      assert.equal(value12.jobStatus, 'success'),
      assert.equal(value12.rhTaskStatus, 'success'),
      assert.equal(value12.outputText, 'resumed:rh-pending-resume-1'));
  }),
  test('generationTaskRuntime: failure and cancellation builders add display patches', async () => {
    const store13 = createMockStore({
      'target-1': { id: 'target-1', type: 'source-image' },
      'target-2': { id: 'target-2', type: 'source-image' },
    });
    (await submitTask(
      baseSpec({
        submit: async () => {
          throw new Error('boom');
        },
        failureBuilder: (error) => ({ name: '结果失败', outputText: '失败: ' + error.message }),
      }),
      { store: store13, now: () => 9000 },
    ),
      await submitTask(
        baseSpec({
          targetNodeId: 'target-2',
          submit: async () => {
            throw new Error('任务已取消');
          },
          cancelledBuilder: () => ({ name: '结果已取消', outputText: '状态: 已取消' }),
        }),
        { store: store13, now: () => 10000 },
      ),
      assert.equal(store13.state.nodes['target-1'].jobStatus, 'error'),
      assert.equal(store13.state.nodes['target-1'].name, '结果失败'),
      assert.equal(store13.state.nodes['target-1'].outputText, '失败: boom'),
      assert.equal(store13.state.nodes['target-2'].jobStatus, 'cancelled'),
      assert.equal(store13.state.nodes['target-2'].name, '结果已取消'),
      assert.equal(store13.state.nodes['target-2'].outputText, '状态: 已取消'));
  }),
  test('generationTaskRuntime: async model API writes async status and resumes', async () => {
    const store14 = createMockStore({
        'target-1': { id: 'target-1', type: 'ai-image', asyncTaskId: 'async-1', generationStartTime: 9000 },
      }),
      response13 = await resumeTask(
        baseSpec({
          provider: 'vendor',
          adapterType: 'modelApi',
          modelId: 'vendor/async',
          executionId: 'vendor.async',
          cancellable: false,
          resumable: true,
          async: true,
          taskId: 'async-1',
          poll: async ({ taskId: taskId6 }) => ({ text: 'done:' + taskId6 }),
        }),
        { store: store14, now: () => 12000 },
      ),
      value13 = store14.state.nodes['target-1'];
    (assert.equal(response13.ok, true),
      assert.equal(value13.isGenerating, false),
      assert.equal(value13.jobStatus, 'success'),
      assert.equal(value13.asyncTaskId, 'async-1'),
      assert.equal(value13.asyncTaskStatus, 'success'),
      assert.equal(value13.asyncTaskRecovering, false),
      assert.equal(value13.outputText, 'done:async-1'));
  }),
  test('generationTaskRuntime: resume applies start patch and keeps pending task cancellable', async () => {
    const store15 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-audio',
          rhTaskId: 'rh-resume-1',
          generationStartTime: 10000,
        },
      }),
      list9 = [];
    let value14 = '';
    const response14 = await resumeTask(
        baseSpec({
          taskId: 'rh-resume-1',
          startBuilder: (value15) => {
            return (list9.push(['startBuilder', value15.taskId]), { audioWorkflowKey: 'voice-clone' });
          },
          onTaskStart: (value16) => {
            list9.push(['onTaskStart', value16.taskId]);
          },
          poll: async ({ taskId: taskId7 }) => {
            return (list9.push(['poll', taskId7]), { pending: true, message: '仍在生成' });
          },
          cancel: async ({ taskId: taskId8 }) => {
            value14 = taskId8;
          },
          cancelledBuilder: () => ({ audioUrl: '', outputText: '已取消恢复' }),
        }),
        { store: store15, now: () => 13000 },
      ),
      value17 = store15.state.nodes['target-1'];
    (assert.equal(response14.status, 'pending'),
      assert.deepEqual(list9, [
        ['startBuilder', 'rh-resume-1'],
        ['onTaskStart', 'rh-resume-1'],
        ['poll', 'rh-resume-1'],
      ]),
      assert.equal(value17.isGenerating, true),
      assert.equal(value17.jobStatus, 'running'),
      assert.equal(value17.rhTaskStatus, 'running'),
      assert.equal(value17.rhTaskRecovering, false),
      assert.equal(value17.audioWorkflowKey, 'voice-clone'),
      assert.equal(value17.rhStatusMessage, '仍在生成'));
    const response15 = await cancelTask('target-1', { store: store15, now: () => 14000 }),
      value18 = store15.state.nodes['target-1'];
    (assert.equal(response15.status, 'cancelled'),
      assert.equal(value14, 'rh-resume-1'),
      assert.equal(value18.jobStatus, 'cancelled'),
      assert.equal(value18.rhTaskStatus, 'cancelled'),
      assert.equal(value18.outputText, '已取消恢复'));
  }),
  test('generationTaskRuntime: resume abort uses cancelled builder', async () => {
    const store16 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-audio',
          rhTaskId: 'rh-abort-1',
          generationStartTime: 15000,
        },
      }),
      response16 = await resumeTask(
        baseSpec({
          taskId: 'rh-abort-1',
          poll: async () => {
            const error2 = new Error('CANCELLED');
            error2.name = 'AbortError';
            throw error2;
          },
          cancelledBuilder: () => ({ outputText: '恢复已中断' }),
        }),
        { store: store16, now: () => 16000 },
      ),
      value19 = store16.state.nodes['target-1'];
    (assert.equal(response16.ok, false),
      assert.equal(response16.status, 'cancelled'),
      assert.equal(value19.isGenerating, false),
      assert.equal(value19.jobStatus, 'cancelled'),
      assert.equal(value19.rhTaskStatus, 'cancelled'),
      assert.equal(value19.outputText, '恢复已中断'));
  }),
  test('generationTaskRuntime: resume abort can pause without finalizing duration', async () => {
    const store17 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-audio',
          rhTaskId: 'rh-pause-1',
          generationStartTime: 15000,
          generationDuration: null,
        },
      }),
      response17 = await resumeTask(
        baseSpec({
          taskId: 'rh-pause-1',
          pauseOnAbort: true,
          poll: async () => {
            const error3 = new Error('CANCELLED');
            error3.name = 'AbortError';
            throw error3;
          },
          pauseBuilder: () => ({ outputText: '恢复暂停' }),
        }),
        { store: store17, now: () => 16000 },
      ),
      value20 = store17.state.nodes['target-1'];
    (assert.equal(response17.ok, false),
      assert.equal(response17.status, 'paused'),
      assert.equal(value20.isGenerating, true),
      assert.equal(value20.jobStatus, 'running'),
      assert.equal(value20.generationStartTime, 15000),
      assert.equal(value20.generationDuration, null),
      assert.equal(value20.rhTaskStatus, 'running'),
      assert.equal(value20.rhTaskRecovering, false),
      assert.equal(value20.outputText, '恢复暂停'));
  }),
  test('generationTaskRuntime: cancel builder receives remote cancel result and error', async () => {
    const store18 = createMockStore({
      'target-1': {
        id: 'target-1',
        type: 'source-image',
        rhTaskId: 'rh-cancel-result-1',
        generationStartTime: 17000,
      },
      'target-2': {
        id: 'target-2',
        type: 'source-image',
        rhTaskId: 'rh-cancel-error-1',
        generationStartTime: 17000,
      },
    });
    (await submitTask(
      baseSpec({
        targetNodeId: 'target-1',
        waitForResult: false,
        submit: async () => ({ taskId: 'rh-cancel-result-1' }),
        cancel: async () => ({ code: 0, msg: 'remote ok' }),
        cancelledBuilder: ({ remoteResult: remoteResult }) => ({ outputText: remoteResult?.msg || '' }),
      }),
      { store: store18, now: () => 17000 },
    ),
      await cancelTask('target-1', { store: store18, now: () => 17500 }),
      await submitTask(
        baseSpec({
          targetNodeId: 'target-2',
          waitForResult: false,
          submit: async () => ({ taskId: 'rh-cancel-error-1' }),
          cancel: async () => {
            throw new Error('remote failed');
          },
          cancelledBuilder: ({ remoteError: remoteError }) => ({ outputText: remoteError?.message || '' }),
        }),
        { store: store18, now: () => 18000 },
      ),
      await cancelTask('target-2', { store: store18, now: () => 18500 }),
      assert.equal(store18.state.nodes['target-1'].outputText, 'remote ok'),
      assert.equal(store18.state.nodes['target-2'].outputText, 'remote failed'),
      assert.equal(store18.state.nodes['target-1'].jobStatus, 'cancelled'),
      assert.equal(store18.state.nodes['target-2'].jobStatus, 'cancelled'));
  }),
  test('generationTaskRuntime: local abort does not overwrite explicit cancel patch', async () => {
    const store19 = createMockStore({
      'target-1': { id: 'target-1', type: 'source-image', generationStartTime: 19000 },
    });
    let run3;
    const submitTask4 = submitTask(
      baseSpec({
        submit: async () => ({ taskId: 'rh-no-overwrite-1' }),
        poll: async () =>
          new Promise((value21, value22) => {
            run3 = value22;
          }),
        cancel: async () => ({ code: 0, msg: 'remote ok' }),
        cancelledBuilder: () => ({ outputText: 'late cancelled patch' }),
      }),
      { store: store19, now: () => 19000 },
    );
    (await new Promise((value23) => setTimeout(value23, 0)),
      await cancelTask('target-1', {
        store: store19,
        now: () => 19500,
        cancelledBuilder: () => ({ outputText: 'remote cancel patch' }),
      }));
    const error4 = new Error('CANCELLED');
    ((error4.name = 'AbortError'), run3(error4));
    const response18 = await submitTask4,
      value24 = store19.state.nodes['target-1'];
    (assert.equal(response18.status, 'cancelled'),
      assert.equal(value24.jobStatus, 'cancelled'),
      assert.equal(value24.outputText, 'remote cancel patch'));
  }),
  test('generationTaskRuntime: submit abort can pause without finalizing duration', async () => {
    const store20 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-image',
          generationStartTime: 20000,
          generationDuration: null,
        },
      }),
      abortController = new AbortController();
    let run4;
    const submitTask5 = submitTask(
      baseSpec({
        pauseOnAbort: true,
        submit: async () => ({ taskId: 'rh-submit-pause-1' }),
        poll: async () =>
          new Promise((value25, value26) => {
            run4 = value26;
          }),
      }),
      { store: store20, now: () => 20000, abortController: abortController },
    );
    (await new Promise((value27) => setTimeout(value27, 0)), abortController.abort());
    const error5 = new Error('CANCELLED');
    ((error5.name = 'AbortError'), run4(error5));
    const response19 = await submitTask5,
      value28 = store20.state.nodes['target-1'];
    (assert.equal(response19.status, 'paused'),
      assert.equal(value28.isGenerating, true),
      assert.equal(value28.jobStatus, 'running'),
      assert.equal(value28.rhTaskStatus, 'running'),
      assert.equal(value28.generationDuration, null));
  }),
  test('generationTaskRuntime: submit abort can pause only after task id is known', async () => {
    const store21 = createMockStore({
        'target-1': {
          id: 'target-1',
          type: 'source-video',
          generationStartTime: 21000,
          generationDuration: null,
        },
      }),
      response20 = await submitTask(
        baseSpec({
          targetNodeId: 'target-1',
          taskType: 'video-frame',
          pauseOnAbort: 'afterTaskId',
          submit: async () => ({ taskId: 'rh-after-task-id-1' }),
          poll: async () => {
            const error6 = new Error('CANCELLED');
            error6.name = 'AbortError';
            throw error6;
          },
        }),
        { store: store21, now: () => 21000 },
      ),
      value29 = store21.state.nodes['target-1'];
    (assert.equal(response20.status, 'paused'),
      assert.equal(response20.taskId, 'rh-after-task-id-1'),
      assert.equal(value29.isGenerating, true),
      assert.equal(value29.jobStatus, 'running'),
      assert.equal(value29.rhTaskStatus, 'running'),
      assert.equal(value29.rhTaskId, 'rh-after-task-id-1'),
      assert.equal(value29.generationDuration, null));
  }),
  test('generationTaskRuntime: submit abort before task id is not paused', async () => {
    const store22 = createMockStore({
        'target-1': { id: 'target-1', type: 'source-video', generationStartTime: 22000 },
      }),
      response21 = await submitTask(
        baseSpec({
          targetNodeId: 'target-1',
          taskType: 'video-frame',
          pauseOnAbort: 'afterTaskId',
          submit: async () => {
            const error7 = new Error('CANCELLED');
            error7.name = 'AbortError';
            throw error7;
          },
        }),
        { store: store22, now: () => 22000 },
      ),
      value30 = store22.state.nodes['target-1'];
    (assert.equal(response21.status, 'cancelled'),
      assert.equal(response21.taskId, ''),
      assert.equal(value30.isGenerating, false),
      assert.equal(value30.jobStatus, 'cancelled'),
      assert.equal(value30.rhTaskStatus, 'cancelled'),
      assert.equal(value30.rhTaskId, ''));
  }),
  test('generationTaskRuntime: submit failure stores failure status', async () => {
    const store23 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } }),
      response22 = await submitTask(
        baseSpec({
          submit: async () => {
            throw new Error('boom');
          },
        }),
        { store: store23, now: () => 15000 },
      ),
      value31 = store23.state.nodes['target-1'];
    (assert.equal(response22.ok, false),
      assert.equal(value31.isGenerating, false),
      assert.equal(value31.jobStatus, 'error'),
      assert.equal(value31.jobError, 'boom'),
      assert.equal(value31.rhTaskStatus, 'failed'));
  }),
  test('generationTaskRuntime: submit failure can normalize provider errors', async () => {
    const store24 = createMockStore({ 'target-1': { id: 'target-1', type: 'source-image' } });
    (await submitTask(
      baseSpec({
        parseError: (value32) => value32?.getUserMessage?.(),
        submit: async () => {
          throw { message: 'raw provider error', getUserMessage: () => '用户可读错误' };
        },
      }),
      { store: store24, now: () => 17000 },
    ),
      assert.equal(store24.state.nodes['target-1'].jobError, '用户可读错误'));
  }));
