import test from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../core/stores/appStore.js';
import { buildSourceAudioNodePayload } from '../services/fileService.js';
import {
  cancelAudioSeparationTaskForNode,
  getRunningAudioSeparationTaskForNode,
  __resetAudioSeparationDepsForTest,
  __setAudioSeparationDepsForTest,
  maybeResumeAudioSeparationLeader,
  runAudioSeparationFromNode,
} from './AudioSeparationController.js';
function installDomStubs() {
  if (!globalThis.window) globalThis.window = {};
  (typeof globalThis.window.showToast !== 'function' && (globalThis.window.showToast = () => {}),
    typeof globalThis.window._triggerLocalCacheSave !== 'function' &&
      (globalThis.window._triggerLocalCacheSave = () => {}),
    typeof globalThis.window.v2FocusOnNodes !== 'function' && (globalThis.window.v2FocusOnNodes = () => {}));
}
function resetStore() {
  appStore.loadState({ nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1.1 } });
}
function addSourceAudioNode(args = {}) {
  const sourceAudioNodePayload = buildSourceAudioNodePayload({
    id: 'source-audio-1',
    x: 0,
    y: 0,
    width: 320,
    height: 140,
    name: '原始音频',
    localPath: 'output/source-audio-1.mp3',
    src: '/output/source-audio-1.mp3',
    ...args,
  });
  return (appStore.addNode(sourceAudioNodePayload), sourceAudioNodePayload.id);
}
function getCreatedSplitNodes() {
  return Object.values(appStore.getState().nodes || {}).filter((item) => item.id !== 'source-audio-1');
}
(test.beforeEach(() => {
  (installDomStubs(), resetStore(), __resetAudioSeparationDepsForTest());
}),
  test.afterEach(() => {
    (__resetAudioSeparationDepsForTest(), resetStore());
  }),
  test('AudioSeparationController: 点击后立即创建双占位节点并在完成后写入结果', async () => {
    addSourceAudioNode();
    let value = null;
    globalThis.window.v2FocusOnNodes = (args2) => {
      value = [...args2];
    };
    let key = null;
    __setAudioSeparationDepsForTest({
      runAudioSeparationImpl: async () =>
        await new Promise((index) => {
          key = index;
        }),
      saveRemoteAudioLocallyDetailedImpl: async (result) => {
        if (String(result).includes('vocals'))
          return { localPath: 'output/vocals.mp3', localUrl: '/output/vocals.mp3' };
        return { localPath: 'output/background.mp3', localUrl: '/output/background.mp3' };
      },
    });
    const runAudioSeparationFromNode2 = runAudioSeparationFromNode('source-audio-1');
    await Promise.resolve();
    const list = getCreatedSplitNodes();
    assert.equal(list.length, 2);
    const error = list.find((item2) => item2.audioSplitRole === 'vocals'),
      error2 = list.find((item3) => item3.audioSplitRole === 'background');
    (assert.ok(error),
      assert.ok(error2),
      assert.equal(error.name, '人声 (处理中)'),
      assert.equal(error2.name, '背景声 (处理中)'),
      assert.equal(error.audioSplitPeerId, error2.id),
      assert.equal(error2.audioSplitPeerId, error.id),
      assert.deepEqual(appStore.getState().selectedNodeIds, [error.id, error2.id]),
      assert.deepEqual(value, ['source-audio-1', error.id, error2.id]),
      key?.({
        taskId: 'split-task-1',
        audios: [
          { audioUrl: 'https://cdn.example.com/vocals.mp3' },
          { audioUrl: 'https://cdn.example.com/background.mp3' },
        ],
      }),
      await runAudioSeparationFromNode2);
    const data = appStore.getState();
    (assert.equal(data.nodes[error.id].name, '人声'),
      assert.equal(data.nodes[error.id].src, '/output/vocals.mp3'),
      assert.equal(data.nodes[error.id].localPath, 'output/vocals.mp3'),
      assert.equal(data.nodes[error.id].jobStatus, 'success'),
      assert.equal(data.nodes[error.id].rhTaskStatus, 'success'),
      assert.equal(data.nodes[error2.id].name, '背景声'),
      assert.equal(data.nodes[error2.id].src, '/output/background.mp3'),
      assert.equal(data.nodes[error2.id].localPath, 'output/background.mp3'),
      assert.equal(data.nodes[error2.id].jobStatus, 'success'));
  }),
  test('AudioSeparationController: 失败时保留双节点并标记失败', async () => {
    (addSourceAudioNode(),
      __setAudioSeparationDepsForTest({
        runAudioSeparationImpl: async () => {
          throw new Error('RH 失败');
        },
      }),
      await runAudioSeparationFromNode('source-audio-1'));
    const list2 = getCreatedSplitNodes();
    assert.equal(list2.length, 2);
    const error3 = list2.find((item4) => item4.audioSplitRole === 'vocals'),
      error4 = list2.find((item5) => item5.audioSplitRole === 'background');
    (assert.equal(error3?.name, '人声 (失败)'),
      assert.equal(error4?.name, '背景声 (失败)'),
      assert.equal(error3?.jobStatus, 'error'),
      assert.equal(error4?.jobStatus, 'error'),
      assert.equal(error3?.src, ''),
      assert.equal(error4?.src, ''));
  }),
  test('AudioSeparationController: 恢复 leader 任务时会同步回填 peer', async () => {
    const id = 'source-audio-split-vocals-1',
      audioSplitPeerId = 'source-audio-split-background-1';
    (appStore.addNode(
      buildSourceAudioNodePayload({
        id: id,
        x: 100,
        y: 0,
        width: 320,
        height: 140,
        name: '人声 (处理中)',
        audioSplitRole: 'vocals',
        audioSplitPeerId: audioSplitPeerId,
        provider: 'runninghubwf',
        model: 'runninghub/2047408096384917505',
        rhTaskId: 'split-task-resume-1',
        rhTaskStatus: 'running',
        rhTaskStartedAt: 1234,
        rhTaskUseOpenapiQuery: true,
        isGenerating: true,
      }),
    ),
      appStore.addNode(
        buildSourceAudioNodePayload({
          id: audioSplitPeerId,
          x: 460,
          y: 0,
          width: 320,
          height: 140,
          name: '背景声 (处理中)',
          audioSplitRole: 'background',
          audioSplitPeerId: id,
          isGenerating: true,
        }),
      ),
      __setAudioSeparationDepsForTest({
        resumeAudioSeparationTaskImpl: async (taskId) => {
          return (
            assert.equal(taskId, 'split-task-resume-1'),
            {
              taskId: taskId,
              audios: [
                { audioUrl: 'https://cdn.example.com/resume-vocals.mp3' },
                { audioUrl: 'https://cdn.example.com/resume-background.mp3' },
              ],
            }
          );
        },
        saveRemoteAudioLocallyDetailedImpl: async (options) => {
          if (String(options).includes('resume-vocals'))
            return { localPath: 'output/resume-vocals.mp3', localUrl: '/output/resume-vocals.mp3' };
          return { localPath: 'output/resume-background.mp3', localUrl: '/output/resume-background.mp3' };
        },
      }),
      await maybeResumeAudioSeparationLeader(id));
    const target = appStore.getState();
    (assert.equal(target.nodes[id].name, '人声'),
      assert.equal(target.nodes[id].src, '/output/resume-vocals.mp3'),
      assert.equal(target.nodes[id].jobStatus, 'success'),
      assert.equal(target.nodes[id].rhTaskStatus, 'success'),
      assert.equal(target.nodes[audioSplitPeerId].name, '背景声'),
      assert.equal(target.nodes[audioSplitPeerId].src, '/output/resume-background.mp3'),
      assert.equal(target.nodes[audioSplitPeerId].jobStatus, 'success'));
  }),
  test('AudioSeparationController: cancel only affects the matching split pair', async () => {
    (addSourceAudioNode(),
      appStore.addNode(
        buildSourceAudioNodePayload({
          id: 'leader-a',
          name: '人声 (处理中)',
          audioSplitRole: 'vocals',
          audioSplitPeerId: 'peer-a',
          rhSourceNodeId: 'source-audio-1',
          provider: 'runninghubwf',
          model: 'runninghub/2047408096384917505',
          rhTaskId: '',
          rhTaskStatus: 'running',
          isGenerating: true,
        }),
      ),
      appStore.addNode(
        buildSourceAudioNodePayload({
          id: 'peer-a',
          name: '背景声 (处理中)',
          audioSplitRole: 'background',
          audioSplitPeerId: 'leader-a',
          rhSourceNodeId: 'source-audio-1',
          isGenerating: true,
        }),
      ),
      appStore.addNode(
        buildSourceAudioNodePayload({
          id: 'leader-b',
          name: '人声 (处理中)',
          audioSplitRole: 'vocals',
          audioSplitPeerId: 'peer-b',
          rhSourceNodeId: 'source-other',
          provider: 'runninghubwf',
          model: 'runninghub/2047408096384917505',
          rhTaskId: '',
          rhTaskStatus: 'running',
          isGenerating: true,
        }),
      ));
    const runningAudioSeparationTaskForNode = getRunningAudioSeparationTaskForNode('peer-a');
    assert.equal(runningAudioSeparationTaskForNode.outId, 'leader-a');
    const runningAudioSeparationTaskForNode2 = getRunningAudioSeparationTaskForNode('source-audio-1');
    (assert.equal(runningAudioSeparationTaskForNode2.outId, 'leader-a'),
      await cancelAudioSeparationTaskForNode('source-audio-1'),
      assert.equal(appStore.getState().nodes['leader-a'].rhTaskStatus, 'cancelled'),
      assert.equal(appStore.getState().nodes['peer-a'].isGenerating, false),
      assert.equal(appStore.getState().nodes['leader-b'].rhTaskStatus, 'running'));
  }));
