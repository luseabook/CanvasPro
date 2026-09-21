import test from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../core/stores/appStore.js';
import { resetCanvasMediaSchedulerForTests } from '../modules/canvasMediaScheduler.js';
import { RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG } from '../core/rendererDeferredMedia.js';
function installDomStubs() {
  if (!globalThis.window) globalThis.window = {};
  typeof globalThis.window.addEventListener !== 'function' && (globalThis.window.addEventListener = () => {});
  typeof globalThis.window.removeEventListener !== 'function' &&
    (globalThis.window.removeEventListener = () => {});
  typeof globalThis.window.showToast !== 'function' && (globalThis.window.showToast = () => {});
  typeof globalThis.window._triggerLocalCacheSave !== 'function' &&
    (globalThis.window._triggerLocalCacheSave = () => {});
  if (!globalThis.document) globalThis.document = {};
  (!globalThis.document.documentElement &&
    (globalThis.document.documentElement = { classList: { add() {}, remove() {} } }),
    typeof globalThis.document.addEventListener !== 'function' &&
      (globalThis.document.addEventListener = () => {}),
    typeof globalThis.document.removeEventListener !== 'function' &&
      (globalThis.document.removeEventListener = () => {}),
    typeof globalThis.document.getElementById !== 'function' &&
      (globalThis.document.getElementById = () => null),
    !globalThis.document.body && (globalThis.document.body = { appendChild() {}, removeChild() {} }),
    !globalThis.Node && (globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 }));
}
function resetStore(_0x5a105b = {}) {
  appStore.loadState({ nodes: _0x5a105b, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
}
function createFrameInterpolationNode(_0x3c21bc = {}) {
  return {
    id: 'source-video-frame-rh',
    type: 'source-video',
    x: 0,
    y: 0,
    width: 0x140,
    height: 180,
    provider: 'runninghubwf',
    model: 'runninghub/2047784060881211393',
    rhTaskId: 'rh-frame-task',
    rhTaskStatus: 'running',
    rhTaskUseOpenapiQuery: true,
    name: '补帧视频 (处理中)',
    isGenerating: true,
    jobStatus: 'running',
    generationStartTime: 123,
    ..._0x3c21bc,
  };
}
function createFakeClassList() {
  const _0xf8be9a = new Set();
  return {
    add: (..._0x2004ab) => _0x2004ab.forEach((_0x15f383) => _0xf8be9a.add(_0x15f383)),
    remove: (..._0x5f2a3c) => _0x5f2a3c.forEach((_0x56d6da) => _0xf8be9a.delete(_0x56d6da)),
    contains: (_0x32148b) => _0xf8be9a.has(_0x32148b),
    toggle(_0x4c8ef2, _0x3ef701) {
      const _0x31bf87 = _0x3ef701 === undefined ? !_0xf8be9a.has(_0x4c8ef2) : !!_0x3ef701;
      if (_0x31bf87) _0xf8be9a.add(_0x4c8ef2);
      else _0xf8be9a.delete(_0x4c8ef2);
      return _0x31bf87;
    },
  };
}
function createFakeButton({
  html: html = '<svg data-original-keying></svg>',
  tooltip: tooltip = '抠像',
  aria: aria = '抠像',
} = {}) {
  const _0x3b1d82 = {},
    _0x2ead0f = new Map([['aria-label', aria]]);
  return {
    innerHTML: html,
    dataset: { tooltip: tooltip },
    title: '',
    classList: createFakeClassList(),
    addEventListener(_0x25f5b2, _0x260b9d) {
      _0x3b1d82[_0x25f5b2] = _0x260b9d;
    },
    getAttribute(_0x372441) {
      return _0x2ead0f.get(_0x372441) || '';
    },
    setAttribute(_0x43df91, _0x5937be) {
      _0x2ead0f.set(_0x43df91, String(_0x5937be));
    },
    removeAttribute(_0xaf2d1c) {
      _0x2ead0f.delete(_0xaf2d1c);
    },
    dispatchClick() {
      _0x3b1d82.click?.({ preventDefault() {}, stopPropagation() {} });
    },
  };
}
function createFakeToolbar(_0x36aff8) {
  return {
    isConnected: true,
    addEventListener() {},
    querySelector(_0x4b4572) {
      return _0x4b4572 === '.act-keying' ? _0x36aff8 : null;
    },
  };
}
function createFakeVideoElement() {
  const _0x5a607d = new Map([['src', '']]);
  let _0x36a8df = 0;
  return {
    style: { display: '' },
    preload: 'auto',
    poster: '',
    src: '',
    currentSrc: '',
    paused: true,
    addEventListener() {},
    removeEventListener() {},
    getAttribute(_0x15ad5c) {
      return _0x5a607d.get(_0x15ad5c) || '';
    },
    setAttribute(_0x2546d4, _0x2aeeb5) {
      const _0x1d848d = String(_0x2aeeb5 || '');
      _0x5a607d.set(_0x2546d4, _0x1d848d);
      if (_0x2546d4 === 'src') this.src = _0x1d848d;
      if (_0x2546d4 === 'poster') this.poster = _0x1d848d;
    },
    removeAttribute(_0x43b8d7) {
      _0x5a607d.delete(_0x43b8d7);
      _0x43b8d7 === 'src' && ((this.src = ''), (this.currentSrc = ''));
      if (_0x43b8d7 === 'poster') this.poster = '';
    },
    load() {
      ((_0x36a8df += 1), (this.currentSrc = this.src));
    },
    pause() {
      this.paused = true;
    },
    get loadCalls() {
      return _0x36a8df;
    },
  };
}
function createFakeImageElement() {
  const _0x6b484 = new Map();
  return {
    src: '',
    classList: createFakeClassList(),
    setAttribute(_0x214655, _0x27db30) {
      _0x6b484.set(String(_0x214655), String(_0x27db30 || ''));
      if (_0x214655 === 'src') this.src = String(_0x27db30 || '');
    },
    removeAttribute(_0x51a367) {
      _0x6b484.delete(String(_0x51a367));
      if (_0x51a367 === 'src') this.src = '';
    },
    getAttribute(_0x523e91) {
      return _0x6b484.get(String(_0x523e91)) || '';
    },
  };
}
function createFakeLoadingCard() {
  return {
    classList: createFakeClassList(),
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    appendChild() {},
  };
}
(test('SourceVideoNode: RunningHub 补帧恢复失败时同步失败标题', async () => {
  installDomStubs();
  const { SourceVideoNode: _0x3e7328 } = await import('./SourceVideoNode.js'),
    _0x9dabdb = createFrameInterpolationNode();
  resetStore({ [_0x9dabdb.id]: _0x9dabdb });
  const _0xe633d8 = Object.create(_0x3e7328.prototype);
  (Object.assign(_0xe633d8, {
    id: _0x9dabdb.id,
    _data: _0x9dabdb,
    _rhResumeAbortController: null,
    _rhResumeTaskId: '',
    _rhResumePromise: null,
  }),
    (_0xe633d8._resumeRunningHubTaskPoller = async () => {
      throw new Error('官方任务失败');
    }),
    _0xe633d8._maybeResumeRunningHubTask(),
    await _0xe633d8._rhResumePromise);
  const _0x54eb1a = appStore.getState().nodes[_0x9dabdb.id];
  (assert.equal(_0x54eb1a.name, '补帧视频 (失败)'),
    assert.equal(_0x54eb1a.jobStatus, 'error'),
    assert.equal(_0x54eb1a.isGenerating, false),
    assert.equal(_0x54eb1a.rhTaskStatus, 'failed'),
    assert.equal(_0x54eb1a.rhTaskRecovering, false),
    assert.equal(_0x54eb1a.jobError, '官方任务失败'),
    assert.equal(_0x54eb1a.videos?.[0]?.error, '官方任务失败'),
    assert.equal(_0x54eb1a.mainVideoIndex, 0),
    resetStore());
}),
  test('SourceVideoNode: RunningHub 恢复轮询被卸载中止时保持可恢复状态', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x514c1a } = await import('./SourceVideoNode.js'),
      _0x5aa7c3 = createFrameInterpolationNode({
        id: 'source-video-hd-recover-abort',
        model: 'runninghub/2047787809091620866',
        name: '高清视频 (处理中)',
        rhTaskId: 'rh-hd-recover-abort',
        rhTaskStatus: 'running',
        rhTaskUseOpenapiQuery: true,
      });
    resetStore({ [_0x5aa7c3.id]: _0x5aa7c3 });
    const _0x238d85 = Object.create(_0x514c1a.prototype);
    (Object.assign(_0x238d85, {
      id: _0x5aa7c3.id,
      _data: _0x5aa7c3,
      _rhResumeAbortController: null,
      _rhResumeTaskId: '',
      _rhResumePromise: null,
    }),
      (_0x238d85._resumeRunningHubTaskPoller = async (_0x49564e, _0x103aa6, { signal: _0x34e375 }) =>
        new Promise((_0x46354e, _0x48ec16) => {
          if (_0x34e375.aborted) {
            _0x48ec16(new Error('CANCELLED'));
            return;
          }
          _0x34e375.addEventListener('abort', () => _0x48ec16(new Error('CANCELLED')), { once: true });
        })),
      _0x238d85._maybeResumeRunningHubTask());
    const _0x49e753 = _0x238d85._rhResumePromise;
    (_0x238d85._stopRunningHubRecovery(false), await _0x49e753);
    const _0x44c954 = appStore.getState().nodes[_0x5aa7c3.id];
    (assert.equal(_0x44c954.name, '高清视频 (处理中)'),
      assert.equal(_0x44c954.jobStatus, 'running'),
      assert.equal(_0x44c954.isGenerating, true),
      assert.equal(_0x44c954.rhTaskStatus, 'running'),
      assert.equal(_0x44c954.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: async 恢复失败保留已有视频并写入错误结果', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x22cf8a } = await import('./SourceVideoNode.js'),
      _0x551327 = {
        id: 'source-video-async-failed',
        type: 'source-video',
        x: 0,
        y: 0,
        width: 0x140,
        height: 180,
        provider: 'apimart',
        model: 'apimart/seedance-1.5',
        asyncTaskId: 'async-video-task',
        asyncTaskStatus: 'running',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        videoUrl: '/output/previous.mp4',
        thumbUrl: '/output/previous.jpg',
        outputText: '模型: APIMart 视频任务',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
      };
    resetStore({ [_0x551327.id]: _0x551327 });
    const _0x59c08c = Object.create(_0x22cf8a.prototype);
    (Object.assign(_0x59c08c, {
      id: _0x551327.id,
      _data: _0x551327,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: '',
      _asyncResumePromise: null,
      _computeGenerationDuration: () => 0x28e,
    }),
      (_0x59c08c._resumeAsyncTaskPoller = async () => {
        throw new Error('异步视频恢复失败');
      }),
      _0x59c08c._maybeResumeAsyncTask(),
      await _0x59c08c._asyncResumePromise);
    const _0x1d1d17 = appStore.getState().nodes[_0x551327.id];
    (assert.equal(_0x1d1d17.isGenerating, false),
      assert.equal(_0x1d1d17.jobStatus, 'error'),
      assert.equal(_0x1d1d17.jobError, '异步视频恢复失败'),
      assert.equal(_0x1d1d17.generationDuration, 0x28e),
      assert.equal(_0x1d1d17.asyncTaskStatus, 'failed'),
      assert.equal(_0x1d1d17.asyncTaskRecovering, false),
      assert.equal(_0x1d1d17.videos?.[0]?.error, '异步视频恢复失败'),
      assert.equal(_0x1d1d17.mainVideoIndex, 0),
      assert.equal(_0x1d1d17.videoUrl, '/output/previous.mp4'),
      assert.equal(_0x1d1d17.thumbUrl, '/output/previous.jpg'),
      assert.match(_0x1d1d17.outputText, /恢复失败: 异步视频恢复失败/),
      resetStore());
  }),
  test('SourceVideoNode: async 恢复轮询被卸载中止时保持可恢复状态', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x201dbe } = await import('./SourceVideoNode.js'),
      _0x548206 = {
        id: 'source-video-async-recover-abort',
        type: 'source-video',
        provider: 'apimart',
        model: 'apimart/seedance-1.5',
        asyncTaskId: 'async-video-recover-abort',
        asyncTaskStatus: 'running',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
      };
    resetStore({ [_0x548206.id]: _0x548206 });
    const _0x58aea5 = Object.create(_0x201dbe.prototype);
    (Object.assign(_0x58aea5, {
      id: _0x548206.id,
      _data: _0x548206,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: '',
      _asyncResumePromise: null,
    }),
      (_0x58aea5._resumeAsyncTaskPoller = async (_0x440d65, _0x499753, { signal: _0x155e17 }) =>
        new Promise((_0x486024, _0x377f2b) => {
          if (_0x155e17.aborted) {
            _0x377f2b(new Error('CANCELLED'));
            return;
          }
          _0x155e17.addEventListener('abort', () => _0x377f2b(new Error('CANCELLED')), { once: true });
        })),
      _0x58aea5._maybeResumeAsyncTask());
    const _0x1687fb = _0x58aea5._asyncResumePromise;
    (_0x58aea5._stopAsyncRecovery(false), await _0x1687fb);
    const _0x14220d = appStore.getState().nodes[_0x548206.id];
    (assert.equal(_0x14220d.jobStatus, 'running'),
      assert.equal(_0x14220d.isGenerating, true),
      assert.equal(_0x14220d.asyncTaskStatus, 'running'),
      assert.equal(_0x14220d.asyncTaskRecovering, false),
      resetStore());
  }),
  test('VideoKeyingController: 按结果节点取消只影响当前抠像任务', async () => {
    installDomStubs();
    const _0x9edda6 = (await import('../modules/VideoKeyingController.js')).default,
      _0x1c87cb = createFrameInterpolationNode({ id: 'source-video-a', model: 'runninghub/video_matting' }),
      _0x1b1165 = createFrameInterpolationNode({ id: 'source-video-b', model: 'runninghub/video_matting' }),
      _0x32254d = createFrameInterpolationNode({
        id: 'source-video-matting-a',
        model: 'runninghub/video_matting',
        rhTaskStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 处理中',
      }),
      _0x507efd = createFrameInterpolationNode({
        id: 'source-video-matting-b',
        model: 'runninghub/video_matting',
        rhTaskStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 处理中',
      });
    (resetStore({
      [_0x1c87cb.id]: _0x1c87cb,
      [_0x1b1165.id]: _0x1b1165,
      [_0x32254d.id]: _0x32254d,
      [_0x507efd.id]: _0x507efd,
    }),
      _0x9edda6._rhTasks.clear(),
      _0x9edda6._rhTasks.set(_0x1c87cb.id, {
        id: 'ctx-a',
        running: true,
        sourceNodeId: _0x1c87cb.id,
        outId: _0x32254d.id,
        mode: 'keying',
        abort: { abort() {} },
      }),
      _0x9edda6._rhTasks.set(_0x1b1165.id, {
        id: 'ctx-b',
        running: true,
        sourceNodeId: _0x1b1165.id,
        outId: _0x507efd.id,
        mode: 'keying',
        abort: { abort() {} },
      }));
    const _0x29adee = await _0x9edda6.cancelRunningKeyingTaskForNode(_0x32254d.id);
    (assert.equal(_0x29adee, true),
      assert.equal(_0x9edda6._rhTasks.has(_0x1c87cb.id), false),
      assert.equal(_0x9edda6._rhTasks.has(_0x1b1165.id), true),
      assert.equal(appStore.getState().nodes[_0x32254d.id].rhTaskStatus, 'cancelled'),
      assert.equal(appStore.getState().nodes[_0x507efd.id].rhTaskStatus, 'running'),
      _0x9edda6._rhTasks.clear(),
      resetStore());
  }),
  test('videoToolbar: 结果节点抠像按钮在任务中显示并触发取消', async () => {
    installDomStubs();
    const _0x3b466b = (await import('../modules/VideoKeyingController.js')).default,
      { bindVideoToolbarEvents: _0x4bbef3 } = await import('./nodeToolbar/videoToolbar.js'),
      _0x190089 = 'source-video-keying-source',
      _0x1d1183 = 'source-video-keying-output';
    (resetStore({
      [_0x190089]: createFrameInterpolationNode({ id: _0x190089, model: 'runninghub/video_matting' }),
      [_0x1d1183]: createFrameInterpolationNode({
        id: _0x1d1183,
        model: 'runninghub/video_matting',
        rhTaskStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 处理中',
      }),
    }),
      _0x3b466b._rhTasks.clear(),
      _0x3b466b._rhTasks.set(_0x190089, {
        id: 'ctx-keying',
        running: true,
        sourceNodeId: _0x190089,
        outId: _0x1d1183,
        mode: 'keying',
        abort: { abort() {} },
      }));
    const _0x33fb5e = createFakeButton(),
      _0x489352 = createFakeToolbar(_0x33fb5e);
    (_0x4bbef3(_0x489352, { id: _0x1d1183, type: 'source-video' }),
      assert.equal(_0x33fb5e.classList.contains('is-task-cancel'), true),
      assert.match(_0x33fb5e.innerHTML, /v2-task-cancel-spin/),
      assert.equal(_0x33fb5e.dataset.tooltip, '取消抠像任务'),
      _0x33fb5e.dispatchClick(),
      await new Promise((_0x46a265) => setTimeout(_0x46a265, 0)),
      assert.equal(_0x3b466b._rhTasks.has(_0x190089), false),
      assert.equal(_0x33fb5e.classList.contains('is-task-cancel'), false),
      assert.match(_0x33fb5e.innerHTML, /data-original-keying/),
      assert.equal(appStore.getState().nodes[_0x1d1183].rhTaskStatus, 'cancelled'),
      _0x3b466b._rhTasks.clear(),
      resetStore());
  }),
  test('videoToolbar: 只靠 Store 中的抠像结果节点也显示取消态', async () => {
    installDomStubs();
    const _0x27b37d = (await import('../modules/VideoKeyingController.js')).default,
      { bindVideoToolbarEvents: _0xaec84 } = await import('./nodeToolbar/videoToolbar.js'),
      _0x44d203 = 'source-video-store-keying-source',
      _0x274437 = 'source-video-store-keying-output';
    (resetStore({
      [_0x44d203]: createFrameInterpolationNode({ id: _0x44d203, model: 'runninghub/video_matting' }),
      [_0x274437]: createFrameInterpolationNode({
        id: _0x274437,
        model: 'runninghub/video_matting',
        rhSourceNodeId: _0x44d203,
        rhTaskId: 'rh-keying-store-task',
        rhTaskStatus: 'running',
        isGenerating: true,
        outputText: '模型: RH视频抠像\n状态: 处理中',
      }),
    }),
      _0x27b37d._rhTasks.clear());
    const _0x17171e = createFakeButton(),
      _0x10db7a = createFakeToolbar(_0x17171e);
    (_0xaec84(_0x10db7a, { id: _0x274437, type: 'source-video' }),
      assert.equal(_0x17171e.classList.contains('is-task-cancel'), true),
      assert.match(_0x17171e.innerHTML, /v2-task-cancel-spin/),
      assert.equal(_0x17171e.dataset.tooltip, '取消抠像任务'),
      _0x17171e._cleanupKeyingButtonState?.(),
      resetStore());
  }),
  test('videoToolbar: 抠像终态会压过 stale isGenerating', async () => {
    installDomStubs();
    const _0x533b16 = (await import('../modules/VideoKeyingController.js')).default,
      { bindVideoToolbarEvents: _0x1767b3 } = await import('./nodeToolbar/videoToolbar.js'),
      _0x51717f = 'source-video-terminal-keying-source',
      _0x1814f0 = 'source-video-terminal-keying-output';
    (resetStore({
      [_0x51717f]: createFrameInterpolationNode({ id: _0x51717f, model: 'runninghub/video_matting' }),
      [_0x1814f0]: createFrameInterpolationNode({
        id: _0x1814f0,
        model: 'runninghub/video_matting',
        rhSourceNodeId: _0x51717f,
        rhTaskId: 'rh-keying-terminal-task',
        rhTaskStatus: 'success',
        isGenerating: true,
        jobStatus: 'running',
        outputText: '模型: RH视频抠像\n状态: 完成',
      }),
    }),
      _0x533b16._rhTasks.clear());
    const _0x327b2f = createFakeButton(),
      _0x3967f9 = createFakeToolbar(_0x327b2f);
    (_0x1767b3(_0x3967f9, { id: _0x1814f0, type: 'source-video' }),
      assert.equal(_0x327b2f.classList.contains('is-task-cancel'), false),
      assert.equal(_0x327b2f.dataset.tooltip, '抠像'),
      _0x327b2f._cleanupKeyingButtonState?.(),
      resetStore());
  }),
  test('SourceVideoNode: 无本地路径时使用 capturePreviewUrl', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x184ee3 } = await import('./SourceVideoNode.js'),
      _0x47a8ea = Object.create(_0x184ee3.prototype);
    (Object.assign(_0x47a8ea, {
      _data: {
        id: 'source-video-preview',
        type: 'source-video',
        capturePreviewUrl: 'blob:pending-video-preview',
      },
    }),
      assert.equal(_0x47a8ea._resolveVideoSrc(_0x47a8ea._data), 'blob:pending-video-preview'));
  }),
  test('SourceVideoNode: accepts electron local capture preview URL', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x380a5a } = await import('./SourceVideoNode.js'),
      _0x25f5d2 = Object.create(_0x380a5a.prototype);
    (Object.assign(_0x25f5d2, {
      _data: {
        id: 'source-video-electron-preview',
        type: 'source-video',
        capturePreviewUrl: 'aic-local-preview://preview/token/clip.mp4',
      },
    }),
      assert.equal(
        _0x25f5d2._resolveVideoSrc(_0x25f5d2._data),
        'aic-local-preview://preview/token/clip.mp4',
      ));
  }),
  test('SourceVideoNode: media task source ignores electron capture preview URL', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x5f3700, resolveSourceVideoMediaTaskSrc: _0x4bb269 } =
        await import('./SourceVideoNode.js'),
      _0x4bd616 = Object.create(_0x5f3700.prototype);
    (Object.assign(_0x4bd616, {
      _data: {
        id: 'source-video-task-source',
        type: 'source-video',
        originalLocalPath: 'data/assets/original/hash/source.mp4',
        capturePreviewUrl: 'aic-local-preview://preview/token/source.mp4',
      },
    }),
      assert.equal(_0x4bb269(_0x4bd616._data), 'data/assets/original/hash/source.mp4'),
      assert.equal(_0x4bd616._resolveVideoSrc(_0x4bd616._data), _0x4bd616._data.capturePreviewUrl),
      assert.equal(_0x4bd616._resolveVideoMetaSrc(_0x4bd616._data), 'data/assets/original/hash/source.mp4'));
  }),
  test('SourceVideoNode: media task source rejects preview-only video', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x3e9a8c, resolveSourceVideoMediaTaskSrc: _0x379868 } =
        await import('./SourceVideoNode.js'),
      _0x15c181 = Object.create(_0x3e9a8c.prototype);
    (Object.assign(_0x15c181, {
      _data: {
        id: 'source-video-preview-only-task-source',
        type: 'source-video',
        capturePreviewUrl: 'aic-local-preview://preview/token/source.mp4',
      },
    }),
      assert.equal(_0x379868(_0x15c181._data), ''),
      assert.equal(
        _0x15c181._resolveVideoSrc(_0x15c181._data),
        'aic-local-preview://preview/token/source.mp4',
      ),
      assert.equal(_0x15c181._resolveVideoMetaSrc(_0x15c181._data), ''));
  }),
  test('SourceVideoNode: mute preference persists in node data', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x2ab36e } = await import('./SourceVideoNode.js'),
      _0x5bfcbb = globalThis.document.createElement;
    globalThis.document.createElement = () => ({ className: '' });
    const _0x467b9e = 'source-video-muted-preference';
    resetStore({ [_0x467b9e]: { id: _0x467b9e, type: 'source-video', videoMuted: false } });
    try {
      const _0x3fea27 = { muted: true },
        _0xb40974 = Object.create(_0x2ab36e.prototype);
      (Object.assign(_0xb40974, {
        id: _0x467b9e,
        _data: appStore.getState().nodes[_0x467b9e],
        _video: _0x3fea27,
        _iconMuted: { style: { display: '' } },
        _iconUnmuted: { style: { display: '' } },
      }),
        _0xb40974._syncMutedStateFromData(_0xb40974._data),
        assert.equal(_0xb40974._isMuted, false),
        assert.equal(_0x3fea27.muted, false),
        assert.equal(_0xb40974._iconMuted.style.display, 'none'),
        assert.equal(_0xb40974._iconUnmuted.style.display, 'block'),
        _0xb40974._setMuted(true, { persist: true }));
      const _0x4cc333 = appStore.getState().nodes[_0x467b9e];
      (assert.equal(_0x4cc333.videoMuted, true),
        assert.equal(_0x3fea27.muted, true),
        assert.equal(_0xb40974._iconMuted.style.display, 'block'),
        assert.equal(_0xb40974._iconUnmuted.style.display, 'none'),
        assert.equal(new _0x2ab36e(_0x4cc333)._isMuted, true));
    } finally {
      (_0x5bfcbb === undefined
        ? delete globalThis.document.createElement
        : (globalThis.document.createElement = _0x5bfcbb),
        resetStore());
    }
  }),
  test('SourceVideoNode: resolves poster from local poster path', async () => {
    installDomStubs();
    const { resolveSourceVideoPosterSrc: _0x574feb } = await import('./SourceVideoNode.js');
    (assert.equal(
      _0x574feb({ posterLocalPath: 'output/VideoThumbs/source-poster.jpg' }),
      '/output/VideoThumbs/source-poster.jpg',
    ),
      assert.equal(_0x574feb({ posterLocalPath: 'C:/Users/example/source-poster.jpg' }), ''),
      assert.equal(
        _0x574feb({
          thumbUrl: 'https://example.invalid/remote-thumb.jpg',
          posterLocalPath: 'output/VideoThumbs/local-poster.jpg',
        }),
        '/output/VideoThumbs/local-poster.jpg',
      ),
      assert.equal(_0x574feb({ posterUrl: 'https://example.invalid/remote-poster.jpg' }), ''),
      assert.equal(
        _0x574feb({
          mainVideoIndex: 0,
          posterLocalPath: 'output/VideoThumbs/second-poster.jpg',
          videos: [
            { posterLocalPath: 'output/VideoThumbs/first-poster.jpg' },
            { posterLocalPath: 'output/VideoThumbs/second-poster.jpg' },
          ],
        }),
        '/output/VideoThumbs/first-poster.jpg',
      ));
  }),
  test('SourceVideoNode: poster frame is populated before mount connection', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x223e43 } = await import('./SourceVideoNode.js'),
      _0xc76ab4 = createFakeImageElement();
    _0xc76ab4.isConnected = false;
    const _0x3f4304 = Object.create(_0x223e43.prototype);
    (Object.assign(_0x3f4304, { _video: null, _posterFrame: _0xc76ab4, _lastPosterSrc: '' }),
      _0x3f4304._applyVideoPoster({ posterLocalPath: 'output/source-thumb.jpg' }),
      assert.equal(_0xc76ab4.src, '/output/source-thumb.jpg'),
      assert.equal(_0xc76ab4.classList.contains('is-visible'), true),
      assert.equal(_0x3f4304._lastPosterSrc, '/output/source-thumb.jpg'));
  }),
  test('SourceVideoNode: poster-backed load does not create video element', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x225cd0 } = await import('./SourceVideoNode.js'),
      _0x86be4e = createFakeImageElement();
    let _0x15fcc6 = 0;
    const _0x5b1e66 = Object.create(_0x225cd0.prototype);
    (Object.assign(_0x5b1e66, {
      id: 'source-video-poster-no-video',
      _data: {
        id: 'source-video-poster-no-video',
        type: 'source-video',
        src: '/output/source.mp4',
        thumbUrl: '/output/source-thumb.jpg',
      },
      _video: null,
      _posterFrame: _0x86be4e,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _ensureVideoElement() {
        return ((_0x15fcc6 += 1), createFakeVideoElement());
      },
    }),
      _0x5b1e66._loadVideo('/output/source.mp4'),
      assert.equal(_0x5b1e66._currentSrc, '/output/source.mp4'),
      assert.equal(_0x5b1e66._video, null),
      assert.equal(_0x15fcc6, 0),
      assert.equal(_0x86be4e.src, '/output/source-thumb.jpg'),
      assert.equal(_0x86be4e.classList.contains('is-visible'), true),
      assert.equal(_0x5b1e66._controls.style.opacity, '1'),
      assert.equal(_0x5b1e66._muteBtn.style.display, 'flex'));
  }),
  test('SourceVideoNode: poster-backed video defers media load until needed', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x49e50e } = await import('./SourceVideoNode.js'),
      _0x2c807f = createFakeVideoElement(),
      _0x2864f3 = createFakeImageElement();
    _0x2c807f.duration = 7;
    const _0x17f769 = Object.create(_0x49e50e.prototype);
    (Object.assign(_0x17f769, {
      id: 'source-video-lazy-poster',
      _data: {
        id: 'source-video-lazy-poster',
        type: 'source-video',
        src: '/output/source.mp4',
        thumbUrl: '/output/source-thumb.jpg',
      },
      _video: _0x2c807f,
      _posterFrame: _0x2864f3,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
    }),
      _0x17f769._loadVideo('/output/source.mp4'),
      assert.equal(_0x17f769._currentSrc, '/output/source.mp4'),
      assert.equal(_0x2c807f.poster, '/output/source-thumb.jpg'),
      assert.equal(_0x2864f3.src, '/output/source-thumb.jpg'),
      assert.equal(_0x2864f3.classList.contains('is-visible'), true),
      assert.equal(_0x2c807f.preload, 'none'),
      assert.equal(_0x2c807f.src, ''),
      assert.equal(_0x2c807f.currentSrc, ''),
      assert.equal(_0x2c807f.loadCalls, 0),
      assert.equal(_0x2c807f.style.opacity, '0'),
      assert.equal(_0x2c807f.style.visibility, 'hidden'),
      assert.equal(_0x17f769._timeTotal.textContent, '0:07'),
      assert.equal(_0x17f769._controls.style.opacity, '1'),
      assert.equal(_0x17f769._muteBtn.style.display, 'flex'));
    const _0x362482 = _0x2c807f.loadCalls;
    (assert.equal(await _0x17f769._ensurePlaybackVideoSrc(), true),
      assert.equal(_0x2c807f.preload, 'metadata'),
      assert.equal(_0x2c807f.src, '/output/source.mp4'),
      assert.equal(_0x2c807f.loadCalls, _0x362482 + 1),
      assert.equal(await _0x17f769._ensurePlaybackVideoSrc({ forPlayback: true }), true),
      assert.equal(_0x2c807f.preload, 'auto'),
      assert.equal(_0x2c807f.src, '/output/source.mp4'),
      assert.equal(_0x2c807f.loadCalls, _0x362482 + 1));
  }),
  test('SourceVideoNode: renderer-deferred media waits for hydration', async () => {
    installDomStubs();
    const { SourceVideoNode: _0xc71eb6 } = await import('./SourceVideoNode.js'),
      _0x671512 = createFakeVideoElement(),
      _0x3caa3a = createFakeImageElement(),
      _0x5f3035 = Object.create(_0xc71eb6.prototype);
    (Object.assign(_0x5f3035, {
      id: 'source-video-defer-media',
      _data: {
        id: 'source-video-defer-media',
        type: 'source-video',
        src: '/output/source.mp4',
        posterLocalPath: 'output/source-thumb.jpg',
        [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
      },
      _video: _0x671512,
      _posterFrame: _0x3caa3a,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _rendererMediaDeferred: true,
    }),
      _0x5f3035._loadVideo('/output/source.mp4'),
      assert.equal(_0x5f3035._currentSrc, '/output/source.mp4'),
      assert.equal(_0x671512.poster, '/output/source-thumb.jpg'),
      assert.equal(_0x3caa3a.src, '/output/source-thumb.jpg'),
      assert.equal(_0x671512.src, ''),
      _0x5f3035.hydrateDeferredMedia(),
      assert.equal(_0x671512.poster, '/output/source-thumb.jpg'),
      assert.equal(_0x3caa3a.src, '/output/source-thumb.jpg'),
      assert.equal(_0x5f3035._rendererMediaDeferred, false),
      assert.equal(_0x3caa3a.classList.contains('is-visible'), true),
      assert.equal(_0x671512.style.opacity, '0'),
      assert.equal(_0x671512.style.visibility, 'hidden'));
  }),
  test('SourceVideoNode: deferred update keeps video source empty until hydration', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x596ad5 } = await import('./SourceVideoNode.js'),
      _0x5ba469 = 'source-video-defer-update',
      _0x18c84d = {
        id: _0x5ba469,
        type: 'source-video',
        src: '/output/source.mp4',
        posterLocalPath: 'output/source-thumb.jpg',
        [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
      };
    resetStore({ [_0x5ba469]: _0x18c84d });
    const _0x5b538d = createFakeVideoElement(),
      _0x258305 = createFakeImageElement();
    let _0x2ffe0b = 0;
    const _0x2c3399 = Object.create(_0x596ad5.prototype);
    (Object.assign(_0x2c3399, {
      id: _0x5ba469,
      _data: _0x18c84d,
      _video: _0x5b538d,
      _posterFrame: _0x258305,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _rendererMediaDeferred: true,
      _syncRunningHubVideoTaskState: () => false,
      _clearResolvedVideoTimer: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
      _maybeFetchVideoMeta: () => {
        _0x2ffe0b += 1;
      },
    }),
      _0x2c3399.update({ ..._0x18c84d, name: 'Deferred source video' }),
      assert.equal(_0x2c3399._currentSrc, '/output/source.mp4'),
      assert.equal(_0x5b538d.preload, 'none'),
      assert.equal(_0x5b538d.src, ''),
      assert.equal(_0x5b538d.loadCalls, 0),
      assert.equal(_0x5b538d.poster, '/output/source-thumb.jpg'),
      assert.equal(_0x258305.src, '/output/source-thumb.jpg'),
      assert.equal(_0x2ffe0b, 0),
      _0x2c3399.hydrateDeferredMedia(),
      assert.equal(_0x2c3399._rendererMediaDeferred, false),
      assert.equal(_0x2ffe0b, 1),
      resetStore());
  }),
  test('SourceVideoNode: poster refresh preserves already loaded matching video source', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x38337e } = await import('./SourceVideoNode.js'),
      _0x133212 = createFakeVideoElement(),
      _0x578aaf = createFakeImageElement();
    ((_0x133212.src = '/output/source.mp4'), (_0x133212.currentSrc = '/output/source.mp4'));
    const _0x2bb97b = Object.create(_0x38337e.prototype);
    Object.assign(_0x2bb97b, {
      id: 'source-video-preserve-loaded',
      _data: {
        id: 'source-video-preserve-loaded',
        type: 'source-video',
        src: '/output/source.mp4',
        posterLocalPath: 'output/source-thumb.jpg',
      },
      _video: _0x133212,
      _posterFrame: _0x578aaf,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _timeTotal: { textContent: '' },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
    });
    const _0x19b09f = _0x133212.loadCalls;
    (_0x2bb97b._loadVideo('/output/source.mp4'),
      assert.equal(_0x2bb97b._currentSrc, '/output/source.mp4'),
      assert.equal(_0x133212.src, '/output/source.mp4'),
      assert.equal(_0x133212.currentSrc, '/output/source.mp4'),
      assert.equal(_0x133212.loadCalls, _0x19b09f),
      assert.equal(_0x133212.poster, '/output/source-thumb.jpg'),
      assert.equal(_0x578aaf.classList.contains('is-visible'), true));
  }),
  test('SourceVideoNode: poster frame swaps only after the next poster decodes', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x74dc72 } = await import('./SourceVideoNode.js'),
      _0x3f220d = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      _0x1d7d44 = globalThis.Image,
      _0x5a5448 = [];
    class _0x26746e {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 0x140),
          (this.naturalHeight = 180));
      }
      set ['src'](_0x37d43b) {
        ((this._src = _0x37d43b), _0x5a5448.push({ src: _0x37d43b, resolve: () => this.onload?.() }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    ((globalThis.Image = _0x26746e), resetCanvasMediaSchedulerForTests());
    try {
      const _0x223cfb = createFakeVideoElement(),
        _0x4c6905 = createFakeImageElement();
      _0x4c6905.setAttribute('src', '/output/old-thumb.jpg');
      const _0x32afc1 = Object.create(_0x74dc72.prototype);
      (Object.assign(_0x32afc1, {
        _video: _0x223cfb,
        _posterFrame: _0x4c6905,
        _lastPosterSrc: '/output/old-thumb.jpg',
      }),
        _0x32afc1._applyVideoPoster({ posterLocalPath: 'output/new-thumb.jpg' }),
        assert.equal(_0x223cfb.poster, '/output/new-thumb.jpg'),
        assert.equal(_0x4c6905.src, '/output/old-thumb.jpg'),
        assert.equal(_0x4c6905.classList.contains('is-visible'), true),
        assert.equal(_0x5a5448[0]?.src, '/output/new-thumb.jpg'),
        _0x5a5448.shift()?.resolve());
      for (let _0x148486 = 0; _0x148486 < 8; _0x148486 += 1) await Promise.resolve();
      assert.equal(_0x4c6905.src, '/output/new-thumb.jpg');
    } finally {
      (resetCanvasMediaSchedulerForTests(),
        _0x3f220d ? (globalThis.Image = _0x1d7d44) : delete globalThis.Image);
    }
  }),
  test('SourceVideoNode: poster frame ignores stale decode after disconnect', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x1c37a2 } = await import('./SourceVideoNode.js'),
      _0x3eacbc = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      _0x29425a = globalThis.Image,
      _0x3027c2 = [];
    class _0x259ce3 {
      constructor() {
        this.onload = null;
      }
      set ['src'](_0x600a58) {
        ((this._src = _0x600a58), _0x3027c2.push({ resolve: () => this.onload?.() }));
      }
    }
    ((globalThis.Image = _0x259ce3), resetCanvasMediaSchedulerForTests());
    try {
      const _0x136fb0 = createFakeImageElement();
      ((_0x136fb0.isConnected = false), _0x136fb0.setAttribute('src', '/output/old-thumb.jpg'));
      const _0xf78932 = Object.create(_0x1c37a2.prototype);
      (Object.assign(_0xf78932, {
        _video: createFakeVideoElement(),
        _posterFrame: _0x136fb0,
        _lastPosterSrc: '/output/old-thumb.jpg',
      }),
        _0xf78932._applyVideoPoster({ posterLocalPath: 'output/new-thumb.jpg' }),
        _0x3027c2.shift()?.resolve());
      for (let _0x25c8aa = 0; _0x25c8aa < 8; _0x25c8aa += 1) await Promise.resolve();
      assert.equal(_0x136fb0.src, '/output/old-thumb.jpg');
    } finally {
      (resetCanvasMediaSchedulerForTests(),
        _0x3eacbc ? (globalThis.Image = _0x29425a) : delete globalThis.Image);
    }
  }),
  test('SourceVideoNode: 播放首帧 ready 后立即隐藏低清封面层', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x43fbf8 } = await import('./SourceVideoNode.js'),
      _0x44d0ba = createFakeVideoElement(),
      _0x46f0dd = createFakeImageElement(),
      _0x29e574 = Object.create(_0x43fbf8.prototype);
    (Object.assign(_0x29e574, {
      _video: _0x44d0ba,
      _posterFrame: _0x46f0dd,
      _currentSrc: '/output/source.mp4',
      _lastPosterSrc: '/output/source-thumb.jpg',
    }),
      (_0x44d0ba.readyState = 2),
      (_0x44d0ba.currentTime = 0),
      (_0x44d0ba.paused = true),
      _0x29e574._syncPosterFrameVisibility(),
      assert.equal(_0x46f0dd.classList.contains('is-visible'), true),
      assert.equal(_0x44d0ba.style.opacity, '0'),
      assert.equal(_0x44d0ba.style.visibility, 'hidden'),
      (_0x44d0ba.paused = false),
      _0x29e574._syncPosterFrameVisibility(),
      assert.equal(_0x46f0dd.classList.contains('is-visible'), false),
      assert.equal(_0x44d0ba.style.opacity, '1'),
      assert.equal(_0x44d0ba.style.visibility, 'visible'));
  }),
  test('SourceVideoNode: paused video at first frame keeps poster fallback visible', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x16e440 } = await import('./SourceVideoNode.js'),
      _0xcd04ba = createFakeVideoElement(),
      _0x43d846 = createFakeImageElement(),
      _0x30bcf9 = Object.create(_0x16e440.prototype);
    (Object.assign(_0x30bcf9, {
      _video: _0xcd04ba,
      _posterFrame: _0x43d846,
      _currentSrc: '/output/source.mp4',
      _lastPosterSrc: '/output/source-thumb.jpg',
    }),
      (_0xcd04ba.readyState = 2),
      (_0xcd04ba.currentTime = 0),
      (_0xcd04ba.paused = true),
      _0x30bcf9._syncPosterFrameVisibility(),
      assert.equal(_0x43d846.classList.contains('is-visible'), true),
      assert.equal(_0xcd04ba.style.opacity, '0'),
      assert.equal(_0xcd04ba.style.visibility, 'hidden'),
      (_0xcd04ba.currentTime = 0.2),
      _0x30bcf9._syncPosterFrameVisibility(),
      assert.equal(_0x43d846.classList.contains('is-visible'), false),
      assert.equal(_0xcd04ba.style.opacity, '1'),
      assert.equal(_0xcd04ba.style.visibility, 'visible'));
  }),
  test('SourceVideoNode: desktop video thumb extraction waits for idle', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x2da7c8 } = await import('./SourceVideoNode.js'),
      _0xefce0a = globalThis.window.electronAPI,
      _0x2c3077 = globalThis.window.requestIdleCallback,
      _0x24f8be = globalThis.window.cancelIdleCallback;
    let _0x5654c5 = null;
    ((globalThis.window.electronAPI = {}),
      (globalThis.window.requestIdleCallback = (_0x58682b) => {
        return ((_0x5654c5 = _0x58682b), 11);
      }),
      (globalThis.window.cancelIdleCallback = () => {}));
    try {
      const _0x27b17d = createFakeVideoElement();
      let _0x2b41d7 = 0;
      const _0x429095 = Object.create(_0x2da7c8.prototype);
      (Object.assign(_0x429095, {
        id: 'source-video-idle-thumb',
        _data: { id: 'source-video-idle-thumb', type: 'source-video', src: '/output/source.mp4' },
        _video: _0x27b17d,
        _posterFrame: createFakeImageElement(),
        _card: createFakeLoadingCard(),
        _controls: { style: { opacity: '' } },
        _muteBtn: { style: { display: '' } },
        _centerIndicator: { style: { display: '' } },
        _hint: { style: { display: '' } },
        _uploadBtn: { disabled: false },
        _activeCapturePreviewUrl: '',
        _lastPosterSrc: '',
        _idleVideoThumbCancel: null,
        _setManualLoopPlayback() {},
        _showPausedCenterIndicator() {},
        _attachPlaybackRecovery() {},
        _maybeEnsureVideoThumb() {
          _0x2b41d7 += 1;
        },
      }),
        _0x429095._loadVideo('/output/source.mp4'),
        assert.equal(_0x2b41d7, 0),
        assert.equal(typeof _0x5654c5, 'function'),
        assert.equal(_0x27b17d.preload, 'none'),
        assert.equal(_0x27b17d.src, ''),
        _0x5654c5(),
        assert.equal(_0x2b41d7, 1));
    } finally {
      (_0xefce0a === undefined
        ? delete globalThis.window.electronAPI
        : (globalThis.window.electronAPI = _0xefce0a),
        _0x2c3077 === undefined
          ? delete globalThis.window.requestIdleCallback
          : (globalThis.window.requestIdleCallback = _0x2c3077),
        _0x24f8be === undefined
          ? delete globalThis.window.cancelIdleCallback
          : (globalThis.window.cancelIdleCallback = _0x24f8be));
    }
  }),
  test('SourceVideoNode: no-poster video handles immediate loadeddata during load', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x1c8617 } = await import('./SourceVideoNode.js'),
      _0x44339b = createFakeVideoElement(),
      _0x33620a = _0x44339b.load.bind(_0x44339b);
    ((_0x44339b.readyState = 0),
      (_0x44339b.load = function _0x3d66c0() {
        (_0x33620a(), (this.readyState = 2), this.onloadeddata?.());
      }));
    let _0x2d8f88 = 0,
      _0x2258c9 = false;
    const _0x579338 = Object.create(_0x1c8617.prototype);
    (Object.assign(_0x579338, {
      id: 'source-video-cut-load',
      _data: { id: 'source-video-cut-load', type: 'source-video', src: '/output/CutVideo/cut.mp4' },
      _video: _0x44339b,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: '',
      _lastPosterSrc: '',
      _attachPlaybackRecovery() {},
      _clearMediaUnavailableAfterPlayback() {},
      _maybeEnsureVideoThumb() {
        _0x2d8f88 += 1;
      },
      _showPausedCenterIndicator() {
        _0x2258c9 = true;
      },
    }),
      _0x579338._loadVideo('/output/CutVideo/cut.mp4'),
      assert.equal(_0x44339b.preload, 'auto'),
      assert.equal(_0x44339b.src, '/output/CutVideo/cut.mp4'),
      assert.equal(_0x579338._controls.style.opacity, '1'),
      assert.equal(_0x579338._muteBtn.style.display, 'flex'),
      assert.equal(_0x579338._centerIndicator.style.display, 'flex'),
      assert.equal(_0x2258c9, true),
      assert.equal(_0x2d8f88, 1));
  }),
  test('SourceVideoNode: switching to final poster source releases capture preview', async () => {
    installDomStubs();
    const _0x39ff14 = globalThis.window.URL,
      _0xd781a2 = [];
    globalThis.window.URL = {
      revokeObjectURL(_0xa5628c) {
        _0xd781a2.push(_0xa5628c);
      },
    };
    const { SourceVideoNode: _0x4c3665 } = await import('./SourceVideoNode.js'),
      _0x13ce6e = createFakeVideoElement(),
      _0x15d100 = Object.create(_0x4c3665.prototype);
    Object.assign(_0x15d100, {
      id: 'source-video-release-preview',
      _data: {
        id: 'source-video-release-preview',
        type: 'source-video',
        src: '/output/source.mp4',
        thumbUrl: '/output/source-thumb.jpg',
        capturePreviewUrl: 'blob:pending-video-preview',
      },
      _video: _0x13ce6e,
      _card: createFakeLoadingCard(),
      _controls: { style: { opacity: '' } },
      _muteBtn: { style: { display: '' } },
      _centerIndicator: { style: { display: '' } },
      _indicatorInner: null,
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
      _activeCapturePreviewUrl: 'blob:pending-video-preview',
      _lastPosterSrc: '',
    });
    try {
      (_0x15d100._loadVideo('/output/source.mp4'),
        assert.deepEqual(_0xd781a2, ['blob:pending-video-preview']),
        assert.equal(_0x15d100._activeCapturePreviewUrl, ''),
        assert.equal(_0x13ce6e.poster, '/output/source-thumb.jpg'));
    } finally {
      globalThis.window.URL = _0x39ff14;
    }
  }),
  test('SourceVideoNode: 正式视频路径优先于 capturePreviewUrl', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x3136a9 } = await import('./SourceVideoNode.js'),
      _0x48c18f = Object.create(_0x3136a9.prototype);
    (Object.assign(_0x48c18f, {
      _data: {
        id: 'source-video-final',
        type: 'source-video',
        localPath: 'output/final.mp4',
        capturePreviewUrl: 'blob:pending-video-preview',
      },
    }),
      assert.equal(_0x48c18f._resolveVideoSrc(_0x48c18f._data), '/output/final.mp4'));
  }),
  test('SourceVideoNode: loaded playback clears stale media unavailable marker', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x4ebd69 } = await import('./SourceVideoNode.js'),
      _0x311c31 = {
        id: 'source-video-keyed-loaded',
        type: 'source-video',
        localPath: 'output/keyed.mp4',
        videoUrl: '/output/keyed.mp4',
        mediaUnavailable: true,
        mediaUnavailableSource: 'output/keyed.mp4',
      };
    resetStore({ [_0x311c31.id]: _0x311c31 });
    const _0x231350 = Object.create(_0x4ebd69.prototype);
    (Object.assign(_0x231350, { id: _0x311c31.id, _data: _0x311c31 }),
      _0x231350._clearMediaUnavailableAfterPlayback('/output/keyed.mp4'));
    const _0x38a852 = appStore.getState().nodes[_0x311c31.id];
    (assert.equal(_0x38a852.mediaUnavailable, false), assert.equal(_0x38a852.mediaUnavailableSource, ''));
  }),
  test('SourceVideoNode: Alt 播放按钮进入手动循环，停止时退出循环', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x47ad41 } = await import('./SourceVideoNode.js'),
      _0x355f5e = [],
      _0xd4d1e0 = {
        paused: true,
        loop: false,
        currentTime: 0,
        duration: 12,
        pause() {
          this.paused = true;
        },
      },
      _0x2042df = Object.create(_0x47ad41.prototype);
    (Object.assign(_0x2042df, {
      id: 'source-video-loop-playback',
      _data: { id: 'source-video-loop-playback', type: 'source-video' },
      _video: _0xd4d1e0,
      _currentSrc: '/output/source-loop.mp4',
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _flashCenterIndicator(_0x59ed2a) {
        _0x355f5e.push(_0x59ed2a);
      },
      _playVideoWithRecovery: async () => {
        return ((_0xd4d1e0.paused = false), true);
      },
    }),
      _0x2042df._toggleManualPlayback({ loop: true }),
      await Promise.resolve(),
      assert.equal(_0x2042df._isManualLoopPlayback, true),
      assert.equal(_0x2042df._isManualControl, true),
      assert.equal(_0xd4d1e0.loop, true),
      assert.deepEqual(_0x355f5e, ['play']),
      (_0x355f5e.length = 0),
      _0x2042df._toggleManualPlayback(),
      assert.equal(_0x2042df._isManualLoopPlayback, false),
      assert.equal(_0xd4d1e0.loop, false),
      assert.equal(_0xd4d1e0.paused, true),
      assert.equal(_0x2042df._hoverManualPause, true),
      assert.deepEqual(_0x355f5e, ['pause']));
  }),
  test('SourceVideoNode: manual playback lazily creates video element', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x15e897 } = await import('./SourceVideoNode.js'),
      _0x330a1a = createFakeVideoElement();
    _0x330a1a.duration = 8;
    let _0x17f9b7 = 0,
      _0x34d21d = 0;
    const _0x40da31 = Object.create(_0x15e897.prototype);
    (Object.assign(_0x40da31, {
      id: 'source-video-lazy-manual-play',
      _data: { id: 'source-video-lazy-manual-play', type: 'source-video' },
      _video: null,
      _currentSrc: '/output/source-lazy.mp4',
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _ensureVideoElement() {
        return ((_0x17f9b7 += 1), (this._video = _0x330a1a), _0x330a1a);
      },
      _playVideoWithRecovery() {
        return ((_0x34d21d += 1), Promise.resolve(true));
      },
      _flashCenterIndicator() {},
    }),
      _0x40da31._toggleManualPlayback(),
      await Promise.resolve(),
      assert.equal(_0x17f9b7, 1),
      assert.equal(_0x34d21d, 1),
      assert.equal(_0x40da31._video, _0x330a1a),
      assert.equal(_0x40da31._isManualControl, true));
  }),
  test('SourceVideoNode: manual click keeps fresh hover playback instead of pausing', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x2a27a5 } = await import('./SourceVideoNode.js'),
      _0x1cfcf5 = {
        paused: false,
        loop: false,
        currentTime: 0,
        duration: 12,
        pause() {
          this.paused = true;
        },
      };
    let _0x181956 = 0;
    const _0x2d156e = Object.create(_0x2a27a5.prototype);
    (Object.assign(_0x2d156e, {
      id: 'source-video-hover-click',
      _data: { id: 'source-video-hover-click', type: 'source-video' },
      _video: _0x1cfcf5,
      _currentSrc: '/output/source-hover.mp4',
      _isHovered: true,
      _isManualControl: false,
      _hoverManualPause: false,
      _isManualLoopPlayback: false,
      _autoPlayToken: 0,
      _flashCenterIndicator() {},
      _playVideoWithRecovery: async () => {
        return ((_0x181956 += 1), (_0x1cfcf5.paused = false), true);
      },
    }),
      assert.equal(_0x2d156e._shouldKeepHoverPlaybackOnManualClick(), true),
      _0x2d156e._toggleManualPlayback({ forcePlay: true }),
      await Promise.resolve(),
      assert.equal(_0x1cfcf5.paused, false),
      assert.equal(_0x2d156e._hoverManualPause, false),
      assert.equal(_0x2d156e._isManualControl, true),
      assert.equal(_0x181956, 1));
  }),
  test('SourceVideoNode: upload size patch preserves landscape ratio', async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: _0x90db9f } = await import('./SourceVideoNode.js');
    assert.deepEqual(_0x90db9f({ width: 0x780, height: 0x438 }), {
      width: 0x200,
      height: 0x120,
      videoWidth: 0x780,
      videoHeight: 0x438,
      needsAutoResize: false,
    });
  }),
  test('SourceVideoNode: upload size patch preserves portrait ratio', async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: _0x9ec928 } = await import('./SourceVideoNode.js');
    assert.deepEqual(_0x9ec928({ width: 0x438, height: 0x780 }), {
      width: 0x120,
      height: 0x200,
      videoWidth: 0x438,
      videoHeight: 0x780,
      needsAutoResize: false,
    });
  }),
  test('SourceVideoNode: upload size patch waits for auto resize when metadata is missing', async () => {
    installDomStubs();
    const { buildSourceVideoUploadSizePatch: _0x2d0f5b } = await import('./SourceVideoNode.js');
    assert.deepEqual(_0x2d0f5b({ width: 0, height: 0 }), { needsAutoResize: true });
  }),
  test('SourceVideoNode: upload starts after preview paint without waiting for metadata', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x115590 } = await import('./SourceVideoNode.js'),
      _0x37e7b6 = globalThis.window,
      _0x179c27 = 'source-video-upload-order',
      _0x3854b7 = [],
      _0x29805c = { name: 'clip.mp4', type: 'video/mp4' };
    let _0x4ebcb5 = false,
      _0x59e1b0 = null;
    const _0x58f492 = () => ({ cloneNode: _0x58f492 }),
      _0x2c00d3 = {
        classList: {
          add(..._0x2eff72) {
            _0x3854b7.push('loading:' + _0x2eff72.join(','));
          },
          remove() {},
          contains(_0x1d5607) {
            return _0x1d5607 === 'img-preview-loading';
          },
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
        appendChild() {},
      };
    (appStore.loadState({
      nodes: {
        [_0x179c27]: {
          id: _0x179c27,
          type: 'source-video',
          x: 0,
          y: 0,
          width: 0x200,
          height: 0x120,
          name: '视频',
        },
      },
      edges: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    }),
      (globalThis.window = {
        ...(_0x37e7b6 || {}),
        currentProjectId: 'project-video',
        showToast() {},
        URL: {
          createObjectURL(_0x5b7504) {
            return (
              assert.equal(_0x5b7504, _0x29805c),
              _0x3854b7.push('preview-url'),
              'blob:source-video-upload-preview'
            );
          },
          revokeObjectURL() {},
        },
      }));
    const _0x4f1f94 = Object.create(_0x115590.prototype);
    Object.assign(_0x4f1f94, {
      id: _0x179c27,
      _data: { id: _0x179c27, type: 'source-video' },
      _card: _0x2c00d3,
      _video: { style: { display: 'block' } },
      _controls: { style: { opacity: '1' } },
      _uploadBtn: {
        childNodes: [{ cloneNode: _0x58f492 }],
        textContent: '上传',
        style: {},
        replaceChildren(..._0x1c93ce) {
          _0x3854b7.push('restore:' + _0x1c93ce.length);
        },
      },
      _input: { value: 'selected' },
      _currentSrc: '',
      _loadVideo(_0x3744cf) {
        (_0x3854b7.push('load:' + _0x3744cf), (this._currentSrc = _0x3744cf));
      },
      _waitForUploadPaint: async () => {
        _0x3854b7.push('paint');
      },
      _readUploadVideoNaturalSize: () => {
        return (
          _0x3854b7.push('size:start'),
          new Promise((_0x47273f) => {
            _0x59e1b0 = (_0x3ea46e) => {
              ((_0x4ebcb5 = true), _0x3854b7.push('size:resolve'), _0x47273f(_0x3ea46e));
            };
          })
        );
      },
      _uploadSourceVideoFile: async (_0x199de9, _0x39816b) => {
        return (
          _0x3854b7.push('upload:start:' + _0x39816b + ':sizeResolved=' + _0x4ebcb5),
          {
            url: '/data/assets/original/clip.mp4',
            localPath: 'data/assets/original/clip.mp4',
            originalLocalPath: 'data/assets/original/clip.mp4',
            videoProxyStatus: 'not_required',
            filename: 'clip.mp4',
          }
        );
      },
    });
    try {
      const _0x2eddbf = _0x4f1f94._handleUploadInputFile(_0x29805c);
      (await Promise.resolve(),
        await Promise.resolve(),
        assert.ok(_0x3854b7.includes('loading:img-preview-loading')),
        assert.ok(_0x3854b7.includes('loading:img-preview-loading--static')),
        assert.ok(_0x3854b7.includes('load:blob:source-video-upload-preview')),
        assert.ok(_0x3854b7.includes('paint')),
        assert.ok(_0x3854b7.includes('upload:start:project-video:sizeResolved=false')),
        assert.equal(typeof _0x59e1b0, 'function'),
        _0x59e1b0({ width: 0x780, height: 0x438 }),
        await _0x2eddbf);
      const _0x4070a6 = appStore.getState().nodes[_0x179c27];
      (assert.equal(_0x4070a6.localPath, 'data/assets/original/clip.mp4'),
        assert.equal(_0x4070a6.width, 0x200),
        assert.equal(_0x4070a6.height, 0x120),
        assert.equal(_0x4070a6.videoWidth, 0x780),
        assert.equal(_0x4070a6.videoHeight, 0x438),
        assert.equal(_0x4f1f94._input.value, ''),
        assert.ok(_0x3854b7.includes('restore:1')));
    } finally {
      ((globalThis.window = _0x37e7b6),
        appStore.loadState({ nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }));
    }
  }),
  test('SourceVideoNode: running RH task ignores inactive Dreamina done fields', async () => {
    installDomStubs();
    typeof globalThis.document.createElement !== 'function' &&
      (globalThis.document.createElement = () => ({ className: '', appendChild() {}, remove() {} }));
    const { SourceVideoNode: _0x133d63 } = await import('./SourceVideoNode.js');
    let _0x54a6cb = 0;
    const _0x493ee3 = [],
      _0x2bc6c2 = Object.create(_0x133d63.prototype);
    (Object.assign(_0x2bc6c2, {
      id: 'source-video-rh-running',
      _data: { id: 'source-video-rh-running', type: 'source-video' },
      _video: {},
      _card: {
        classList: {
          add(..._0x6684c2) {
            _0x493ee3.push(..._0x6684c2);
          },
          remove() {},
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((_0x54a6cb += 1), []);
        },
        appendChild() {},
      },
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      _0x2bc6c2.update({
        id: 'source-video-rh-running',
        type: 'source-video',
        provider: 'runninghubwf',
        model: 'runninghub/2047784060881211393',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'pending',
        dreaminaTaskStatus: 'idle',
        dreaminaTaskPhase: 'done',
        asyncTaskStatus: 'idle',
      }),
      await new Promise((_0x239dc0) => setTimeout(_0x239dc0, 60)),
      assert.equal(_0x54a6cb, 0),
      assert.equal(_0x2bc6c2._uploadBtn.disabled, true),
      assert.ok(_0x493ee3.includes('img-preview-loading')));
  }),
  test('SourceVideoNode: resolved source video clears stale running timer', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x337985 } = await import('./SourceVideoNode.js'),
      _0x469ca5 = 'source-video-stale-timer',
      _0x60cf2d = {
        id: _0x469ca5,
        type: 'source-video',
        src: '/output/source.mp4',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
        generationDuration: null,
      };
    resetStore({ [_0x469ca5]: _0x60cf2d });
    const _0x4753ce = Object.create(_0x337985.prototype);
    (Object.assign(_0x4753ce, {
      id: _0x469ca5,
      _data: _0x60cf2d,
      _video: { paused: true },
      _card: createFakeLoadingCard(),
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: true },
      _lastPosterSrc: '',
      _currentSrc: '/output/source.mp4',
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '/output/source.mp4',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      _0x4753ce.update(_0x60cf2d));
    const _0x3ec848 = appStore.getState().nodes[_0x469ca5];
    (assert.equal(_0x3ec848.generationStartTime, null),
      assert.equal(Number.isFinite(Number(_0x3ec848.generationDuration)), true),
      assert.equal(_0x3ec848.isGenerating, false),
      resetStore());
  }),
  test('SourceVideoNode: active video task with existing result keeps running timer', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x5a0b2d } = await import('./SourceVideoNode.js'),
      _0x129c5e = 'source-video-active-task-timer',
      _0x27df0b = {
        id: _0x129c5e,
        type: 'source-video',
        videoUrl: '/output/previous.mp4',
        asyncTaskId: 'async-video-task',
        asyncTaskStatus: 'running',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'video',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
        generationDuration: null,
      };
    resetStore({ [_0x129c5e]: _0x27df0b });
    const _0x18a0ae = Object.create(_0x5a0b2d.prototype);
    (Object.assign(_0x18a0ae, {
      id: _0x129c5e,
      _data: _0x27df0b,
      _video: { paused: true },
      _card: createFakeLoadingCard(),
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: true },
      _lastPosterSrc: '',
      _currentSrc: '/output/previous.mp4',
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '/output/previous.mp4',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      _0x18a0ae.update(_0x27df0b));
    const _0x1da1b2 = appStore.getState().nodes[_0x129c5e];
    (assert.equal(_0x1da1b2.generationStartTime, 123),
      assert.equal(_0x1da1b2.generationDuration, null),
      assert.equal(_0x1da1b2.isGenerating, true),
      resetStore());
  }),
  test('SourceVideoNode: terminal failure stops loading over stale generating flag', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x455217 } = await import('./SourceVideoNode.js');
    let _0x2c0282 = 0;
    const _0x3ffa86 = Object.create(_0x455217.prototype);
    (Object.assign(_0x3ffa86, {
      id: 'source-video-stale-failed',
      _data: { id: 'source-video-stale-failed', type: 'source-video' },
      _video: {},
      _card: {
        classList: { add() {}, remove() {} },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((_0x2c0282 += 1), []);
        },
      },
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: true },
      _syncRunningHubVideoTaskState: () => false,
      _resolveVideoSrc: () => '',
      _loadVideo: () => {},
      _maybeFetchVideoMeta: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      _0x3ffa86.update({
        id: 'source-video-stale-failed',
        type: 'source-video',
        provider: 'runninghubwf',
        model: 'runninghub/2047784060881211393',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'failed',
      }),
      assert.equal(_0x2c0282, 1),
      assert.equal(_0x3ffa86._uploadBtn.disabled, false));
  }),
  test('SourceVideoNode: 旧失败补帧节点 update 时纠正处理中标题', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x2f948a } = await import('./SourceVideoNode.js'),
      _0x2095b7 = createFrameInterpolationNode({
        rhTaskStatus: 'failed',
        name: '补帧视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [_0x2095b7.id]: _0x2095b7 });
    const _0x4a9bc5 = Object.create(_0x2f948a.prototype);
    (Object.assign(_0x4a9bc5, { id: _0x2095b7.id, _data: _0x2095b7, _video: null }),
      _0x4a9bc5.update(_0x2095b7));
    const _0x1df802 = appStore.getState().nodes[_0x2095b7.id];
    (assert.equal(_0x1df802.name, '补帧视频 (失败)'),
      assert.equal(_0x1df802.jobStatus, 'error'),
      assert.equal(_0x1df802.isGenerating, false),
      assert.equal(_0x1df802.rhTaskStatus, 'failed'),
      assert.equal(_0x1df802.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 高清失败时使用高清失败标题', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x5075a3 } = await import('./SourceVideoNode.js'),
      _0x51ae2e = createFrameInterpolationNode({
        id: 'source-video-hd-rh',
        rhTaskStatus: 'failed',
        name: '高清视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [_0x51ae2e.id]: _0x51ae2e });
    const _0x536275 = Object.create(_0x5075a3.prototype);
    (Object.assign(_0x536275, { id: _0x51ae2e.id, _data: _0x51ae2e, _video: null }),
      _0x536275.update(_0x51ae2e));
    const _0xf547a1 = appStore.getState().nodes[_0x51ae2e.id];
    (assert.equal(_0xf547a1.name, '高清视频 (失败)'),
      assert.equal(_0xf547a1.jobStatus, 'error'),
      assert.equal(_0xf547a1.isGenerating, false),
      assert.equal(_0xf547a1.rhTaskStatus, 'failed'),
      assert.equal(_0xf547a1.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 成功终态会清掉处理中标题', async () => {
    installDomStubs();
    const { SourceVideoNode: _0xc60f28 } = await import('./SourceVideoNode.js'),
      _0x5ab7cc = createFrameInterpolationNode({
        rhTaskStatus: 'success',
        name: '补帧视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [_0x5ab7cc.id]: _0x5ab7cc });
    const _0x39700b = Object.create(_0xc60f28.prototype);
    (Object.assign(_0x39700b, { id: _0x5ab7cc.id, _data: _0x5ab7cc, _video: null }),
      _0x39700b.update(_0x5ab7cc));
    const _0x1cc1f6 = appStore.getState().nodes[_0x5ab7cc.id];
    (assert.equal(_0x1cc1f6.name, '补帧视频'),
      assert.equal(_0x1cc1f6.jobStatus, 'success'),
      assert.equal(_0x1cc1f6.isGenerating, false),
      assert.equal(_0x1cc1f6.rhTaskStatus, 'success'),
      assert.equal(_0x1cc1f6.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 取消终态会修正补帧取消标题', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x1d590c } = await import('./SourceVideoNode.js'),
      _0x2b429f = createFrameInterpolationNode({
        rhTaskStatus: 'cancelled',
        name: '补帧视频 (处理中)',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [_0x2b429f.id]: _0x2b429f });
    const _0x397f6c = Object.create(_0x1d590c.prototype);
    (Object.assign(_0x397f6c, { id: _0x2b429f.id, _data: _0x2b429f, _video: null }),
      _0x397f6c.update(_0x2b429f));
    const _0xb99505 = appStore.getState().nodes[_0x2b429f.id];
    (assert.equal(_0xb99505.name, '补帧视频 (已取消)'),
      assert.equal(_0xb99505.jobStatus, null),
      assert.equal(_0xb99505.isGenerating, false),
      assert.equal(_0xb99505.rhTaskStatus, 'cancelled'),
      assert.equal(_0xb99505.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 视频擦除失败终态会修正生成中标题', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x2dcbea } = await import('./SourceVideoNode.js'),
      _0x4519ab = createFrameInterpolationNode({
        id: 'source-video-erase-rh',
        model: 'runninghub/video_matting',
        rhTaskStatus: 'failed',
        name: '视频擦除生成中...',
        outputText: '模型: RH视频擦除\n状态: 处理中',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [_0x4519ab.id]: _0x4519ab });
    const _0x3d94bd = Object.create(_0x2dcbea.prototype);
    (Object.assign(_0x3d94bd, { id: _0x4519ab.id, _data: _0x4519ab, _video: null }),
      _0x3d94bd.update(_0x4519ab));
    const _0x442c0d = appStore.getState().nodes[_0x4519ab.id];
    (assert.equal(_0x442c0d.name, '视频擦除失败'),
      assert.equal(_0x442c0d.jobStatus, 'error'),
      assert.equal(_0x442c0d.isGenerating, false),
      assert.equal(_0x442c0d.rhTaskStatus, 'failed'),
      assert.equal(_0x442c0d.rhTaskRecovering, false),
      resetStore());
  }),
  test('SourceVideoNode: RunningHub 终态不会覆盖用户自定义标题', async () => {
    installDomStubs();
    const { SourceVideoNode: _0x2a2c37 } = await import('./SourceVideoNode.js'),
      _0x32c85d = createFrameInterpolationNode({
        rhTaskStatus: 'failed',
        name: '我的自定义补帧版本',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskRecovering: true,
      });
    resetStore({ [_0x32c85d.id]: _0x32c85d });
    const _0x31fb79 = Object.create(_0x2a2c37.prototype);
    (Object.assign(_0x31fb79, { id: _0x32c85d.id, _data: _0x32c85d, _video: null }),
      _0x31fb79.update(_0x32c85d));
    const _0x254ca0 = appStore.getState().nodes[_0x32c85d.id];
    (assert.equal(_0x254ca0.name, '我的自定义补帧版本'),
      assert.equal(_0x254ca0.jobStatus, 'error'),
      assert.equal(_0x254ca0.isGenerating, false),
      assert.equal(_0x254ca0.rhTaskStatus, 'failed'),
      resetStore());
  }));
