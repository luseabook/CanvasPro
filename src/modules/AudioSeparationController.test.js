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
function addSourceAudioNode(_0x44ae62 = {}) {
  const _0xbe39b0 = buildSourceAudioNodePayload({
    id: 'source-audio-1',
    x: 0,
    y: 0,
    width: 0x140,
    height: 140,
    name: '原始音频',
    localPath: 'output/source-audio-1.mp3',
    src: '/output/source-audio-1.mp3',
    ..._0x44ae62,
  });
  return (appStore.addNode(_0xbe39b0), _0xbe39b0.id);
}
function getCreatedSplitNodes() {
  return Object.values(appStore.getState().nodes || {}).filter(
    (_0x32c033) => _0x32c033.id !== 'source-audio-1',
  );
}
(test.beforeEach(() => {
  (installDomStubs(), resetStore(), __resetAudioSeparationDepsForTest());
}),
  test.afterEach(() => {
    (__resetAudioSeparationDepsForTest(), resetStore());
  }),
  test('AudioSeparationController: 点击后立即创建双占位节点并在完成后写入结果', async () => {
    addSourceAudioNode();
    let _0x23d1f8 = null;
    globalThis.window.v2FocusOnNodes = (_0x342b92) => {
      _0x23d1f8 = [..._0x342b92];
    };
    let _0x36e61e = null;
    __setAudioSeparationDepsForTest({
      runAudioSeparationImpl: async () =>
        await new Promise((_0x4431da) => {
          _0x36e61e = _0x4431da;
        }),
      saveRemoteAudioLocallyDetailedImpl: async (_0x3995df) => {
        if (String(_0x3995df).includes('vocals'))
          return { localPath: 'output/vocals.mp3', localUrl: '/output/vocals.mp3' };
        return { localPath: 'output/background.mp3', localUrl: '/output/background.mp3' };
      },
    });
    const _0x57bb40 = runAudioSeparationFromNode('source-audio-1');
    await Promise.resolve();
    const _0x18f7d0 = getCreatedSplitNodes();
    assert.equal(_0x18f7d0.length, 2);
    const _0xd0d5b0 = _0x18f7d0.find((_0x12f85d) => _0x12f85d.audioSplitRole === 'vocals'),
      _0x5ad0ea = _0x18f7d0.find((_0x410294) => _0x410294.audioSplitRole === 'background');
    (assert.ok(_0xd0d5b0),
      assert.ok(_0x5ad0ea),
      assert.equal(_0xd0d5b0.name, '人声 (处理中)'),
      assert.equal(_0x5ad0ea.name, '背景声 (处理中)'),
      assert.equal(_0xd0d5b0.audioSplitPeerId, _0x5ad0ea.id),
      assert.equal(_0x5ad0ea.audioSplitPeerId, _0xd0d5b0.id),
      assert.deepEqual(appStore.getState().selectedNodeIds, [_0xd0d5b0.id, _0x5ad0ea.id]),
      assert.deepEqual(_0x23d1f8, ['source-audio-1', _0xd0d5b0.id, _0x5ad0ea.id]),
      _0x36e61e?.({
        taskId: 'split-task-1',
        audios: [
          { audioUrl: 'https://cdn.example.com/vocals.mp3' },
          { audioUrl: 'https://cdn.example.com/background.mp3' },
        ],
      }),
      await _0x57bb40);
    const _0x185c96 = appStore.getState();
    (assert.equal(_0x185c96.nodes[_0xd0d5b0.id].name, '人声'),
      assert.equal(_0x185c96.nodes[_0xd0d5b0.id].src, '/output/vocals.mp3'),
      assert.equal(_0x185c96.nodes[_0xd0d5b0.id].localPath, 'output/vocals.mp3'),
      assert.equal(_0x185c96.nodes[_0xd0d5b0.id].jobStatus, 'success'),
      assert.equal(_0x185c96.nodes[_0xd0d5b0.id].rhTaskStatus, 'success'),
      assert.equal(_0x185c96.nodes[_0x5ad0ea.id].name, '背景声'),
      assert.equal(_0x185c96.nodes[_0x5ad0ea.id].src, '/output/background.mp3'),
      assert.equal(_0x185c96.nodes[_0x5ad0ea.id].localPath, 'output/background.mp3'),
      assert.equal(_0x185c96.nodes[_0x5ad0ea.id].jobStatus, 'success'));
  }),
  test('AudioSeparationController: 失败时保留双节点并标记失败', async () => {
    (addSourceAudioNode(),
      __setAudioSeparationDepsForTest({
        runAudioSeparationImpl: async () => {
          throw new Error('RH 失败');
        },
      }),
      await runAudioSeparationFromNode('source-audio-1'));
    const _0x3e2976 = getCreatedSplitNodes();
    assert.equal(_0x3e2976.length, 2);
    const _0x5d8b59 = _0x3e2976.find((_0x54771d) => _0x54771d.audioSplitRole === 'vocals'),
      _0x44953b = _0x3e2976.find((_0x5acf4e) => _0x5acf4e.audioSplitRole === 'background');
    (assert.equal(_0x5d8b59?.name, '人声 (失败)'),
      assert.equal(_0x44953b?.name, '背景声 (失败)'),
      assert.equal(_0x5d8b59?.jobStatus, 'error'),
      assert.equal(_0x44953b?.jobStatus, 'error'),
      assert.equal(_0x5d8b59?.src, ''),
      assert.equal(_0x44953b?.src, ''));
  }),
  test('AudioSeparationController: 恢复 leader 任务时会同步回填 peer', async () => {
    const _0x5394e5 = 'source-audio-split-vocals-1',
      _0x3f94dd = 'source-audio-split-background-1';
    (appStore.addNode(
      buildSourceAudioNodePayload({
        id: _0x5394e5,
        x: 100,
        y: 0,
        width: 0x140,
        height: 140,
        name: '人声 (处理中)',
        audioSplitRole: 'vocals',
        audioSplitPeerId: _0x3f94dd,
        provider: 'runninghubwf',
        model: 'runninghub/2047408096384917505',
        rhTaskId: 'split-task-resume-1',
        rhTaskStatus: 'running',
        rhTaskStartedAt: 0x4d2,
        rhTaskUseOpenapiQuery: true,
        isGenerating: true,
      }),
    ),
      appStore.addNode(
        buildSourceAudioNodePayload({
          id: _0x3f94dd,
          x: 0x1cc,
          y: 0,
          width: 0x140,
          height: 140,
          name: '背景声 (处理中)',
          audioSplitRole: 'background',
          audioSplitPeerId: _0x5394e5,
          isGenerating: true,
        }),
      ),
      __setAudioSeparationDepsForTest({
        resumeAudioSeparationTaskImpl: async (_0x396116) => {
          return (
            assert.equal(_0x396116, 'split-task-resume-1'),
            {
              taskId: _0x396116,
              audios: [
                { audioUrl: 'https://cdn.example.com/resume-vocals.mp3' },
                { audioUrl: 'https://cdn.example.com/resume-background.mp3' },
              ],
            }
          );
        },
        saveRemoteAudioLocallyDetailedImpl: async (_0x383a1a) => {
          if (String(_0x383a1a).includes('resume-vocals'))
            return { localPath: 'output/resume-vocals.mp3', localUrl: '/output/resume-vocals.mp3' };
          return { localPath: 'output/resume-background.mp3', localUrl: '/output/resume-background.mp3' };
        },
      }),
      await maybeResumeAudioSeparationLeader(_0x5394e5));
    const _0x7e7329 = appStore.getState();
    (assert.equal(_0x7e7329.nodes[_0x5394e5].name, '人声'),
      assert.equal(_0x7e7329.nodes[_0x5394e5].src, '/output/resume-vocals.mp3'),
      assert.equal(_0x7e7329.nodes[_0x5394e5].jobStatus, 'success'),
      assert.equal(_0x7e7329.nodes[_0x5394e5].rhTaskStatus, 'success'),
      assert.equal(_0x7e7329.nodes[_0x3f94dd].name, '背景声'),
      assert.equal(_0x7e7329.nodes[_0x3f94dd].src, '/output/resume-background.mp3'),
      assert.equal(_0x7e7329.nodes[_0x3f94dd].jobStatus, 'success'));
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
    const _0x5a8340 = getRunningAudioSeparationTaskForNode('peer-a');
    assert.equal(_0x5a8340.outId, 'leader-a');
    const _0x1c397f = getRunningAudioSeparationTaskForNode('source-audio-1');
    (assert.equal(_0x1c397f.outId, 'leader-a'),
      await cancelAudioSeparationTaskForNode('source-audio-1'),
      assert.equal(appStore.getState().nodes['leader-a'].rhTaskStatus, 'cancelled'),
      assert.equal(appStore.getState().nodes['peer-a'].isGenerating, false),
      assert.equal(appStore.getState().nodes['leader-b'].rhTaskStatus, 'running'));
  }));
