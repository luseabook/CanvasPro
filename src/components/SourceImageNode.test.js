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
    typeof globalThis.document.createElement !== 'function' &&
      (globalThis.document.createElement = (_0x2a77da = 'div') => {
        const _0xc89d1 = {
          tagName: String(_0x2a77da).toUpperCase(),
          className: '',
          style: {},
          dataset: {},
          fetchPriority: '',
          childNodes: [],
          classList: {
            add() {},
            remove() {},
            contains() {
              return false;
            },
          },
          appendChild(_0x156cfa) {
            return (this.childNodes.push(_0x156cfa), _0x156cfa);
          },
          replaceChildren(..._0x10c2d6) {
            this.childNodes = _0x10c2d6;
          },
          cloneNode() {
            return { ...this, childNodes: [...this.childNodes] };
          },
          remove() {},
          querySelector() {
            return null;
          },
          querySelectorAll() {
            return [];
          },
          addEventListener() {},
          removeEventListener() {},
          setAttribute(_0x2d24c0, _0x37ee19) {
            this[_0x2d24c0] = _0x37ee19;
          },
          getAttribute(_0x28f4b9) {
            return this[_0x28f4b9] || '';
          },
          click() {},
        };
        return (
          String(_0x2a77da).toLowerCase() === 'template' &&
            (_0xc89d1.content = {
              cloneNode() {
                return { childNodes: [] };
              },
            }),
          _0xc89d1
        );
      }),
    typeof globalThis.document.createElementNS !== 'function' &&
      (globalThis.document.createElementNS = (_0x581c12, _0x15f9c0 = 'svg') =>
        globalThis.document.createElement(_0x15f9c0)),
    typeof globalThis.document.createTextNode !== 'function' &&
      (globalThis.document.createTextNode = (_0xd14173 = '') => ({
        nodeType: globalThis.Node?.TEXT_NODE || 3,
        textContent: String(_0xd14173),
        cloneNode() {
          return { ...this };
        },
      })),
    !globalThis.document.body && (globalThis.document.body = { appendChild() {}, removeChild() {} }),
    !globalThis.Node && (globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 }),
    !globalThis.navigator &&
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'node-test', platform: 'node' },
        configurable: true,
      }));
}
function resetStore() {
  (appStore.loadState({ nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } }),
    resetCanvasMediaSchedulerForTests());
}
(test('SourceImageNode: mount starts from thumbnail and defers display image load', async () => {
  (installDomStubs(), resetStore());
  const { SourceImageNode: _0x5b8244 } = await import('./SourceImageNode.js'),
    _0x395add = globalThis.window.requestIdleCallback,
    _0xca7790 = globalThis.window.cancelIdleCallback;
  let _0x1635ee = null;
  ((globalThis.window.requestIdleCallback = (_0x679718) => {
    return ((_0x1635ee = _0x679718), 7);
  }),
    (globalThis.window.cancelIdleCallback = () => {}));
  try {
    const _0x5e12d2 = {
        id: 'source-image-mount-lazy',
        type: 'source-image',
        displayLocalPath: 'output/_derived/display/lazy.display.jpg',
        thumbLocalPath: 'output/_derived/thumb/lazy.thumb.jpg',
        fixedSize: true,
        needsAutoResize: false,
        imageWidth: 0x4b0,
        imageHeight: 0x320,
      },
      _0xe87d82 = new _0x5b8244(_0x5e12d2);
    (_0xe87d82.mount(),
      assert.equal(_0xe87d82._img.src, '/output/_derived/thumb/lazy.thumb.jpg'),
      assert.equal(_0xe87d82._currentSrc, '/output/_derived/display/lazy.display.jpg'),
      assert.equal(_0xe87d82._img.loading, 'eager'),
      assert.equal(_0xe87d82._img.fetchPriority, 'high'),
      assert.equal(_0xe87d82._img.dataset.lodSrc, 'placeholder'),
      assert.equal(typeof _0x1635ee, 'function'),
      _0xe87d82.unmount());
  } finally {
    (_0x395add === undefined
      ? delete globalThis.window.requestIdleCallback
      : (globalThis.window.requestIdleCallback = _0x395add),
      _0xca7790 === undefined
        ? delete globalThis.window.cancelIdleCallback
        : (globalThis.window.cancelIdleCallback = _0xca7790),
      resetStore());
  }
}),
  test('SourceImageNode: renderer-deferred media waits for hydration', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0x41523c } = await import('./SourceImageNode.js'),
      _0x562245 = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      _0x451481 = globalThis.Image,
      _0xd0a3df = [];
    class _0x1aeb23 {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 0x280),
          (this.naturalHeight = 0x168));
      }
      set ['src'](_0x5d6608) {
        ((this._src = _0x5d6608), _0xd0a3df.push({ resolve: () => this.onload?.() }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    globalThis.Image = _0x1aeb23;
    try {
      const _0x3737c1 = new _0x41523c({
        id: 'source-image-defer-media',
        type: 'source-image',
        displayLocalPath: 'output/_derived/display/defer.display.jpg',
        thumbLocalPath: 'output/_derived/thumb/defer.thumb.jpg',
        fixedSize: true,
        needsAutoResize: false,
        [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
      });
      (_0x3737c1.mount(),
        assert.equal(_0x3737c1._img.src, '/output/_derived/thumb/defer.thumb.jpg'),
        assert.equal(_0x3737c1._img.style.display, 'block'),
        assert.equal(_0x3737c1._img.dataset.lodSrc, 'placeholder'),
        assert.equal(_0x3737c1._currentSrc, '/output/_derived/display/defer.display.jpg'),
        assert.equal(_0xd0a3df.length, 0),
        _0x3737c1.hydrateDeferredMedia(),
        assert.equal(_0xd0a3df.length, 1),
        _0xd0a3df.shift()?.resolve());
      for (let _0x195422 = 0; _0x195422 < 8; _0x195422 += 1) await Promise.resolve();
      (assert.equal(_0x3737c1._img.src, '/output/_derived/display/defer.display.jpg'), _0x3737c1.unmount());
    } finally {
      (resetStore(), _0x562245 ? (globalThis.Image = _0x451481) : delete globalThis.Image);
    }
  }),
  test('SourceImageNode: 旧超时失败的 RunningHub 节点仍可恢复', async () => {
    installDomStubs();
    const { SourceImageNode: _0x1bedcc } = await import('./SourceImageNode.js'),
      _0x292c9b = Object.create(_0x1bedcc.prototype);
    assert.equal(
      _0x292c9b._isRunningHubRecoverableTask({
        id: 'source-rh-timeout',
        type: 'source-image',
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        rhTaskId: 'rh-task-timeout',
        rhTaskStatus: 'failed',
        outputText: '模型: RH 一键360°全景图\n错误: 任务超时，请稍后再试',
      }),
      true,
    );
  }),
  test('SourceImageNode: 无本地路径时立即显示 capturePreviewUrl', async () => {
    installDomStubs();
    const { SourceImageNode: _0x4ff985 } = await import('./SourceImageNode.js'),
      _0x189e29 = Object.create(_0x4ff985.prototype),
      _0x4ee748 = [];
    (Object.assign(_0x189e29, {
      id: 'capture-preview',
      _data: { id: 'capture-preview', type: 'source-image', capturePreviewUrl: 'blob:capture-preview' },
      _resolvedPreviewSig: '',
      _previewResolveToken: 0,
      _cachedThumbUrl: '',
      _activeCapturePreviewUrl: '',
      _showImg(_0x136875, _0x42401d) {
        _0x4ee748.push({ url: _0x136875, previewUrl: _0x42401d });
      },
    }),
      await _0x189e29._refreshImageDisplay(),
      assert.deepEqual(_0x4ee748, [{ url: 'blob:capture-preview', previewUrl: '' }]),
      assert.equal(_0x189e29._activeCapturePreviewUrl, 'blob:capture-preview'));
  }),
  test('SourceImageNode: accepts electron local capture preview URL', async () => {
    installDomStubs();
    const { SourceImageNode: _0x4d2b9e } = await import('./SourceImageNode.js'),
      _0x258290 = Object.create(_0x4d2b9e.prototype);
    assert.equal(
      _0x258290._getCapturePreviewUrl({ capturePreviewUrl: 'aic-local-preview://preview/token/large.png' }),
      'aic-local-preview://preview/token/large.png',
    );
  }),
  test('SourceImageNode: pending capture preview is not covered by running overlay', async () => {
    installDomStubs();
    const { SourceImageNode: _0x67b181 } = await import('./SourceImageNode.js'),
      _0x420abe = Object.create(_0x67b181.prototype),
      _0x4932e0 = {
        style: { display: '' },
        classList: { remove() {} },
        replaceChildrenCalled: 0,
        replaceChildren() {
          this.replaceChildrenCalled += 1;
        },
        querySelectorAll() {
          return [];
        },
      };
    (Object.assign(_0x420abe, {
      _data: {
        id: 'capture-preview-running',
        type: 'source-image',
        jobStatus: 'running',
        capturePreviewUrl: 'blob:capture-preview-running',
      },
      _jobUI: _0x4932e0,
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
    }),
      _0x420abe._syncJobUI('running'),
      assert.equal(_0x4932e0.style.display, 'none'),
      assert.equal(_0x4932e0.replaceChildrenCalled, 1),
      assert.equal(_0x420abe._hint.style.display, 'none'),
      assert.equal(_0x420abe._uploadBtn.disabled, true));
  }),
  test('SourceImageNode: running RH task ignores inactive Dreamina done fields', async () => {
    installDomStubs();
    const { SourceImageNode: _0x56bd3d } = await import('./SourceImageNode.js');
    let _0x32541d = 0;
    const _0x1db941 = Object.create(_0x56bd3d.prototype);
    (Object.assign(_0x1db941, {
      id: 'source-rh-running',
      _img: {},
      _data: { id: 'source-rh-running', type: 'source-image' },
      _currentJobStatus: null,
      _currentSrc: '',
      _isUploading: false,
      _card: {
        classList: { remove() {} },
        querySelectorAll() {
          return ((_0x32541d += 1), []);
        },
      },
      _uploadBtn: { disabled: false },
      _hint: { style: { display: '' } },
      _getPrimaryImageUrl: () => '',
      _syncJobUI: () => {},
      _refreshImageDisplay: async () => {},
      _applyMaskPreview: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeDreaminaTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      _0x1db941.update({
        id: 'source-rh-running',
        type: 'source-image',
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'pending',
        dreaminaTaskStatus: 'idle',
        dreaminaTaskPhase: 'done',
        asyncTaskStatus: 'idle',
      }),
      assert.equal(_0x32541d, 0),
      assert.equal(_0x1db941._currentJobStatus, 'running'));
  }),
  test('SourceImageNode: recovering task without result shows unified loading', async () => {
    installDomStubs();
    const { SourceImageNode: _0x551a42 } = await import('./SourceImageNode.js'),
      _0x5193ad = [],
      _0x217a60 = Object.create(_0x551a42.prototype);
    (Object.assign(_0x217a60, {
      id: 'source-rh-recovering',
      _img: {},
      _data: { id: 'source-rh-recovering', type: 'source-image' },
      _currentJobStatus: null,
      _currentSrc: '',
      _isUploading: false,
      _card: {
        classList: {
          add(..._0x9e4109) {
            _0x5193ad.push(..._0x9e4109);
          },
          remove() {},
        },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
        appendChild() {},
      },
      _uploadBtn: { disabled: false },
      _hint: { style: { display: '' } },
      _getPrimaryImageUrl: () => '',
      _syncJobUI: () => {},
      _refreshImageDisplay: async () => {},
      _applyMaskPreview: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeDreaminaTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      _0x217a60.update({
        id: 'source-rh-recovering',
        type: 'source-image',
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        rhTaskId: 'rh-recovering',
        rhTaskStatus: 'pending',
        rhTaskRecovering: true,
        isGenerating: false,
        jobStatus: null,
      }),
      await new Promise((_0xd49210) => setTimeout(_0xd49210, 60)),
      assert.equal(_0x217a60._uploadBtn.disabled, true),
      assert.equal(_0x217a60._hint.style.display, 'none'),
      assert.ok(_0x5193ad.includes('img-preview-loading')));
  }),
  test('SourceImageNode: terminal failure stops loading over stale generating flag', async () => {
    installDomStubs();
    const { SourceImageNode: _0x5e2e99 } = await import('./SourceImageNode.js');
    let _0x2c23b5 = 0;
    const _0x4026f6 = Object.create(_0x5e2e99.prototype);
    (Object.assign(_0x4026f6, {
      id: 'source-rh-stale-failed',
      _img: {},
      _data: { id: 'source-rh-stale-failed', type: 'source-image' },
      _currentJobStatus: null,
      _currentSrc: '',
      _isUploading: false,
      _card: {
        classList: { add() {}, remove() {} },
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return ((_0x2c23b5 += 1), []);
        },
      },
      _uploadBtn: { disabled: true },
      _hint: { style: { display: '' } },
      _getPrimaryImageUrl: () => '',
      _syncJobUI: () => {},
      _refreshImageDisplay: async () => {},
      _applyMaskPreview: () => {},
      _maybeResumeRunningHubTask: () => {},
      _maybeResumeDreaminaTask: () => {},
      _maybeResumeAsyncTask: () => {},
    }),
      _0x4026f6.update({
        id: 'source-rh-stale-failed',
        type: 'source-image',
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'failed',
      }),
      assert.equal(_0x2c23b5, 1),
      assert.equal(_0x4026f6._uploadBtn.disabled, false));
  }),
  test('SourceImageNode: upload size patch preserves landscape ratio', async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: _0x2e11da } = await import('./SourceImageNode.js');
    assert.deepEqual(_0x2e11da({ width: 0x780, height: 0x438 }), {
      width: 0x200,
      height: 0x120,
      imageWidth: 0x780,
      imageHeight: 0x438,
      needsAutoResize: false,
    });
  }),
  test('SourceImageNode: upload size patch preserves portrait ratio', async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: _0x25236a } = await import('./SourceImageNode.js');
    assert.deepEqual(_0x25236a({ width: 0x438, height: 0x780 }), {
      width: 0x120,
      height: 0x200,
      imageWidth: 0x438,
      imageHeight: 0x780,
      needsAutoResize: false,
    });
  }),
  test('SourceImageNode: upload size patch waits for auto resize when metadata is missing', async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: _0x462fe6 } = await import('./SourceImageNode.js');
    assert.deepEqual(_0x462fe6({ width: 0, height: 0 }), { needsAutoResize: true });
  }),
  test('SourceImageNode: RunningHub pending 恢复结果保持生成中并安排继续查询', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0x5d8e8c } = await import('./SourceImageNode.js'),
      _0x53949c = {
        id: 'source-rh-pending',
        type: 'source-image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        rhTaskId: 'rh-task-pending',
        rhTaskStatus: 'running',
        rhTaskUseOpenapiQuery: true,
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
      };
    appStore.addNode(_0x53949c);
    const _0x1833a9 = Object.create(_0x5d8e8c.prototype);
    Object.assign(_0x1833a9, {
      id: _0x53949c.id,
      _data: _0x53949c,
      _rhResumeAbortController: null,
      _rhResumeTaskId: '',
      _rhResumePromise: null,
      _rhResumeRetryTimer: null,
    });
    let _0x3de560 = 0;
    ((_0x1833a9._resumeRunningHubTaskPoller = async (_0x4ac063) => {
      return (
        assert.equal(_0x4ac063, 'rh-task-pending'),
        { pending: true, taskId: 'rh-task-pending', status: 'running', message: '任务仍在 RunningHub 生成中' }
      );
    }),
      (_0x1833a9._scheduleRunningHubRecoveryRetry = () => {
        _0x3de560 += 1;
      }),
      _0x1833a9._maybeResumeRunningHubTask(),
      await _0x1833a9._rhResumePromise);
    const _0x2e7237 = appStore.getState().nodes[_0x53949c.id];
    (assert.equal(_0x2e7237.isGenerating, true),
      assert.equal(_0x2e7237.jobStatus, 'running'),
      assert.equal(_0x2e7237.rhTaskStatus, 'running'),
      assert.equal(_0x2e7237.rhTaskRecovering, false),
      assert.equal(_0x2e7237.rhStatusMessage, '任务仍在 RunningHub 生成中'),
      assert.equal(_0x3de560, 1),
      resetStore());
  }),
  test('SourceImageNode: RunningHub 恢复失败通过结果渲染器写入错误结果', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0x290996 } = await import('./SourceImageNode.js'),
      _0x305bb1 = {
        id: 'source-rh-resume-failed',
        type: 'source-image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        rhTaskId: 'rh-task-failed',
        rhTaskStatus: 'running',
        rhTaskUseOpenapiQuery: true,
        outputText: '模型: RH 图片任务',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
      };
    appStore.addNode(_0x305bb1);
    const _0x332e0b = Object.create(_0x290996.prototype);
    (Object.assign(_0x332e0b, {
      id: _0x305bb1.id,
      _data: _0x305bb1,
      _rhResumeAbortController: null,
      _rhResumeTaskId: '',
      _rhResumePromise: null,
      _computeGenerationDuration: () => 0x141,
    }),
      (_0x332e0b._resumeRunningHubTaskPoller = async () => {
        throw new Error('RunningHub 恢复失败');
      }),
      _0x332e0b._maybeResumeRunningHubTask(),
      await _0x332e0b._rhResumePromise);
    const _0x5d78bc = appStore.getState().nodes[_0x305bb1.id];
    (assert.equal(_0x5d78bc.isGenerating, false),
      assert.equal(_0x5d78bc.jobStatus, 'error'),
      assert.equal(_0x5d78bc.jobError, 'RunningHub 恢复失败'),
      assert.equal(_0x5d78bc.generationDuration, 0x141),
      assert.equal(_0x5d78bc.rhTaskStatus, 'failed'),
      assert.equal(_0x5d78bc.rhTaskRecovering, false),
      assert.equal(_0x5d78bc.images?.[0]?.error, 'RunningHub 恢复失败'),
      assert.equal(_0x5d78bc.mainImageIndex, 0),
      assert.match(_0x5d78bc.outputText, /恢复失败: RunningHub 恢复失败/),
      resetStore());
  }),
  test('SourceImageNode: Dreamina error aliases are not recoverable', async () => {
    installDomStubs();
    const { SourceImageNode: _0x44ee1f } = await import('./SourceImageNode.js'),
      _0x495cfc = Object.create(_0x44ee1f.prototype);
    (assert.equal(
      _0x495cfc._isDreaminaRecoverableTask({
        id: 'source-dreamina-job-error',
        type: 'source-image',
        provider: 'dreamina',
        model: 'dreamina/4.5',
        dreaminaSubmitId: 'dm-job-error',
        jobStatus: 'error',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
      }),
      false,
    ),
      assert.equal(
        _0x495cfc._isDreaminaRecoverableTask({
          id: 'source-dreamina-status-error',
          type: 'source-image',
          provider: 'dreamina',
          model: 'dreamina/4.5',
          dreaminaSubmitId: 'dm-status-error',
          dreaminaTaskStatus: 'error',
          dreaminaTaskPhase: 'generating',
        }),
        false,
      ),
      assert.equal(
        _0x495cfc._isDreaminaRecoverableTask({
          id: 'source-dreamina-legacy-syncing',
          type: 'source-image',
          provider: 'dreamina',
          model: 'dreamina/4.5',
          dreaminaSubmitId: 'dm-legacy-syncing',
          dreaminaTaskStatus: 'success',
          dreaminaTaskPhase: 'syncing',
        }),
        true,
      ),
      assert.equal(
        _0x495cfc._isDreaminaRecoverableTask({
          id: 'source-dreamina-fresh-active',
          type: 'source-image',
          provider: 'dreamina',
          model: 'dreamina/4.5',
          dreaminaSubmitId: 'dm-fresh-active',
          dreaminaTaskStatus: 'pending',
          dreaminaTaskPhase: 'generating',
          dreaminaTaskLastCheckedAt: Date.now(),
          isGenerating: true,
        }),
        false,
      ));
  }),
  test('SourceImageNode: Dreamina success+syncing 旧状态恢复失败会清掉加载态', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0xe46b4f } = await import('./SourceImageNode.js'),
      _0xb15856 = {
        id: 'source-dreamina-syncing-failed',
        type: 'source-image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: 'dreamina',
        model: 'dreamina/4.5',
        dreaminaSubmitId: 'dm-syncing-failed',
        dreaminaTaskStatus: 'success',
        dreaminaTaskPhase: 'syncing',
        dreaminaTaskLabel: '同步结果中',
        dreaminaTaskStartedAt: 123,
        dreaminaTaskLastCheckedAt: 0x1c8,
        isGenerating: false,
        jobStatus: 'success',
      };
    appStore.addNode(_0xb15856);
    const _0x48ac2 = Object.create(_0xe46b4f.prototype);
    Object.assign(_0x48ac2, {
      id: _0xb15856.id,
      _data: _0xb15856,
      _dreaminaResumeAbortController: null,
      _dreaminaResumeSubmitId: '',
      _dreaminaResumePromise: null,
      _computeGenerationDuration: () => 0x315,
    });
    let _0x487035 = null;
    const _0x29a74d = new Promise((_0x25cc10) => {
      _0x48ac2._dreaminaResumePoller = async (_0x292f14) => {
        (assert.equal(_0x292f14, 'dm-syncing-failed'),
          _0x25cc10(),
          await new Promise((_0xd70966, _0x214ec7) => {
            _0x487035 = _0x214ec7;
          }));
      };
    });
    (_0x48ac2._maybeResumeDreaminaTask(),
      await _0x29a74d,
      assert.equal(appStore.getState().nodes[_0xb15856.id].dreaminaTaskStatus, 'pending'),
      assert.equal(appStore.getState().nodes[_0xb15856.id].dreaminaTaskPhase, 'generating'),
      _0x487035(new Error('generation failed: final generation failed')),
      await _0x48ac2._dreaminaResumePromise);
    const _0x1b89e4 = appStore.getState().nodes[_0xb15856.id];
    (assert.equal(_0x1b89e4.isGenerating, false),
      assert.equal(_0x1b89e4.jobStatus, 'error'),
      assert.equal(_0x1b89e4.jobError, 'generation failed: final generation failed'),
      assert.equal(_0x1b89e4.generationDuration, 0x315),
      assert.equal(_0x1b89e4.images?.[0]?.error, 'generation failed: final generation failed'),
      assert.equal(_0x1b89e4.mainImageIndex, 0),
      assert.equal(_0x1b89e4.dreaminaTaskStatus, 'failed'),
      assert.equal(_0x1b89e4.dreaminaTaskPhase, 'failed'),
      assert.equal(_0x1b89e4.dreaminaTaskLabel, 'generation failed: final generation failed'),
      assert.equal(_0x1b89e4.dreaminaTaskRecovering, false),
      resetStore());
  }),
  test('SourceImageNode: Dreamina 恢复超时转为后台 pending', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0xd87b4e } = await import('./SourceImageNode.js'),
      _0x18dfda = {
        id: 'source-dreamina-timeout',
        type: 'source-image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: 'dreamina',
        model: 'dreamina/4.5',
        dreaminaSubmitId: 'dm-timeout',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
        dreaminaTaskLabel: '生成中',
        dreaminaTaskStartedAt: 123,
        dreaminaTaskLastCheckedAt: 0x1c8,
        dreaminaTaskRecovering: true,
        isGenerating: true,
        jobStatus: 'running',
      };
    appStore.addNode(_0x18dfda);
    const _0x2bf126 = Object.create(_0xd87b4e.prototype);
    (Object.assign(_0x2bf126, {
      id: _0x18dfda.id,
      _data: _0x18dfda,
      _dreaminaResumeAbortController: null,
      _dreaminaResumeSubmitId: '',
      _dreaminaResumePromise: null,
      _computeGenerationDuration: () => 0x315,
    }),
      (_0x2bf126._dreaminaResumePoller = async (_0x5bc65d) => {
        assert.equal(_0x5bc65d, 'dm-timeout');
        const _0x18a8bd = new Error('Dreamina poll timeout');
        _0x18a8bd.code = 'DREAMINA_POLL_TIMEOUT';
        throw _0x18a8bd;
      }),
      _0x2bf126._maybeResumeDreaminaTask(),
      await _0x2bf126._dreaminaResumePromise);
    const _0xda60f8 = appStore.getState().nodes[_0x18dfda.id];
    (assert.equal(_0xda60f8.isGenerating, true),
      assert.equal(_0xda60f8.jobStatus, 'running'),
      assert.equal(_0xda60f8.jobError, null),
      assert.equal(_0xda60f8.dreaminaTaskStatus, 'pending'),
      assert.equal(_0xda60f8.dreaminaTaskPhase, 'generating'),
      assert.equal(_0xda60f8.dreaminaTaskLabel, '排队中（后台查询）'),
      assert.equal(_0xda60f8.dreaminaTaskRecovering, false),
      resetStore());
  }),
  test('SourceImageNode: async 恢复失败保留已有媒体字段并写入错误结果', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0x28fd9a } = await import('./SourceImageNode.js'),
      _0x325e54 = {
        id: 'source-async-resume-failed',
        type: 'source-image',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        provider: 'apimart',
        model: 'apimart/nano-banana-2',
        asyncTaskId: 'async-task-failed',
        asyncTaskStatus: 'running',
        asyncTaskProvider: 'apimart',
        asyncTaskKind: 'image',
        imageUrl: '/output/previous.png',
        thumbUrl: '/output/previous-thumb.png',
        outputText: '模型: APIMart 图片任务',
        isGenerating: true,
        jobStatus: 'running',
        generationStartTime: 123,
      };
    appStore.addNode(_0x325e54);
    const _0x193dde = Object.create(_0x28fd9a.prototype);
    (Object.assign(_0x193dde, {
      id: _0x325e54.id,
      _data: _0x325e54,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: '',
      _asyncResumePromise: null,
      _computeGenerationDuration: () => 0x28e,
    }),
      (_0x193dde._resumeAsyncTaskPoller = async () => {
        throw new Error('异步恢复失败');
      }),
      _0x193dde._maybeResumeAsyncTask(),
      await _0x193dde._asyncResumePromise);
    const _0x20edd2 = appStore.getState().nodes[_0x325e54.id];
    (assert.equal(_0x20edd2.isGenerating, false),
      assert.equal(_0x20edd2.jobStatus, 'error'),
      assert.equal(_0x20edd2.jobError, '异步恢复失败'),
      assert.equal(_0x20edd2.generationDuration, 0x28e),
      assert.equal(_0x20edd2.asyncTaskStatus, 'failed'),
      assert.equal(_0x20edd2.asyncTaskRecovering, false),
      assert.equal(_0x20edd2.images?.[0]?.error, '异步恢复失败'),
      assert.equal(_0x20edd2.mainImageIndex, 0),
      assert.equal(_0x20edd2.imageUrl, '/output/previous.png'),
      assert.equal(_0x20edd2.thumbUrl, '/output/previous-thumb.png'),
      assert.match(_0x20edd2.outputText, /恢复失败: 异步恢复失败/),
      resetStore());
  }),
  test('SourceImageNode: display image preloads use conservative global limit', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0x38a2ea } = await import('./SourceImageNode.js'),
      _0x4dbd2d = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      _0x586e23 = globalThis.Image,
      _0xf5b0ab = Object.prototype.hasOwnProperty.call(
        globalThis,
        '__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__',
      ),
      _0x38e7a1 = globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__,
      _0x36da8c = console.log,
      _0x3e2f7b = [];
    let _0x15ba3f = 0,
      _0x2f41f2 = 0;
    class _0x4bbead {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 0x320),
          (this.naturalHeight = 0x258));
      }
      set ['src'](_0x1c7c86) {
        ((this._src = _0x1c7c86),
          (_0x15ba3f += 1),
          (_0x2f41f2 = Math.max(_0x2f41f2, _0x15ba3f)),
          _0x3e2f7b.push(() => {
            ((_0x15ba3f -= 1), this.onload?.());
          }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    ((globalThis.Image = _0x4bbead),
      (globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__ = 3),
      (console.log = () => {}));
    try {
      const _0x955331 = [];
      for (let _0x2569e2 = 0; _0x2569e2 < 8; _0x2569e2 += 1) {
        const _0x18783f = 'preload-limit-' + _0x2569e2,
          _0x4edb2a = {
            id: _0x18783f,
            type: 'source-image',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fixedSize: true,
            needsAutoResize: false,
            thumbLocalPath: 'data/assets/thumb.jpg',
          };
        appStore.addNode(_0x4edb2a);
        const _0x256cc1 = {
            src: '',
            style: { display: 'none' },
            getAttribute(_0x1bf207) {
              return _0x1bf207 === 'src' ? this.src : '';
            },
          },
          _0x15e6e9 = Object.create(_0x38a2ea.prototype);
        (Object.assign(_0x15e6e9, {
          id: _0x18783f,
          _data: _0x4edb2a,
          _currentSrc: '',
          _cachedThumbUrl: '',
          _failedSrc: '',
          _activeCapturePreviewUrl: '',
          _card: {
            classList: { add() {}, remove() {} },
            querySelector() {
              return null;
            },
            querySelectorAll() {
              return [];
            },
          },
          _img: _0x256cc1,
          _hint: { style: { display: '' } },
          _releaseActiveCapturePreviewUrl() {},
          _queueThumbnail() {},
        }),
          _0x955331.push(_0x15e6e9));
      }
      for (let _0x40caf5 = 0; _0x40caf5 < _0x955331.length; _0x40caf5 += 1) {
        _0x955331[_0x40caf5]._showImg('/output/preload-' + _0x40caf5 + '.png', '');
      }
      assert.equal(_0x2f41f2, 3);
      while (_0x3e2f7b.length > 0) {
        const _0x1b0a35 = _0x3e2f7b.shift();
        (_0x1b0a35(), await Promise.resolve());
      }
      (await Promise.resolve(),
        assert.equal(_0x2f41f2, 3),
        assert.equal(_0x15ba3f, 0),
        (_0x2f41f2 = 0),
        (_0x955331[0]._currentSrc = ''),
        (_0x955331[1]._currentSrc = ''),
        _0x955331[0]._showImg('/output/shared-preload.png', ''),
        _0x955331[1]._showImg('/output/shared-preload.png', ''),
        assert.equal(_0x15ba3f, 1),
        assert.equal(_0x2f41f2, 1),
        _0x3e2f7b.shift()?.(),
        await Promise.resolve(),
        await Promise.resolve(),
        await new Promise((_0x8d40b9) => setTimeout(_0x8d40b9, 0)),
        assert.equal(_0x15ba3f, 0));
      const _0x5ab426 = _0x3e2f7b.length;
      (_0x955331[0]._showImg('/output/shared-preload.png', ''),
        await Promise.resolve(),
        assert.equal(_0x15ba3f, 0),
        assert.equal(_0x3e2f7b.length, _0x5ab426));
    } finally {
      (_0x4dbd2d ? (globalThis.Image = _0x586e23) : delete globalThis.Image,
        _0xf5b0ab
          ? (globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__ = _0x38e7a1)
          : delete globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__,
        (console.log = _0x36da8c),
        resetStore());
    }
  }),
  test('SourceImageNode: thumbnail stays visible while display image preloads', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: _0x74ed0c } = await import('./SourceImageNode.js'),
      _0x4b8459 = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      _0x1f1793 = globalThis.Image,
      _0x251af4 = console.log,
      _0x2103d5 = [];
    let _0x51e437 = 0,
      _0x5eeb97 = 0,
      _0x10995f = 0;
    class _0x4a0f3d {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 0x384),
          (this.naturalHeight = 0x258));
      }
      set ['src'](_0x5a9543) {
        ((this._src = _0x5a9543),
          (_0x51e437 += 1),
          _0x2103d5.push(() => {
            ((_0x51e437 -= 1), this.onload?.());
          }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    ((globalThis.Image = _0x4a0f3d), (console.log = () => {}));
    try {
      const _0x7b087c = {
        id: 'thumb-first',
        type: 'source-image',
        width: 100,
        height: 100,
        fixedSize: true,
        needsAutoResize: false,
        imageWidth: 0x384,
        imageHeight: 0x258,
      };
      appStore.addNode(_0x7b087c);
      const _0x40ba43 = {
          src: '',
          style: { display: 'none' },
          getAttribute(_0x58210f) {
            return _0x58210f === 'src' ? this.src : '';
          },
        },
        _0x15b762 = {
          classList: {
            add() {
              _0x5eeb97 += 1;
            },
            remove() {},
          },
          querySelector() {
            return null;
          },
          querySelectorAll() {
            return [];
          },
          appendChild() {
            _0x10995f += 1;
          },
        },
        _0x87aca3 = Object.create(_0x74ed0c.prototype);
      (Object.assign(_0x87aca3, {
        id: _0x7b087c.id,
        _data: _0x7b087c,
        _currentSrc: '',
        _cachedThumbUrl: '',
        _failedSrc: '',
        _activeCapturePreviewUrl: '',
        _card: _0x15b762,
        _img: _0x40ba43,
        _hint: { style: { display: '' } },
        _releaseActiveCapturePreviewUrl() {},
        _queueThumbnail() {},
      }),
        _0x87aca3._showImg('/output/display-image.png', '/output/thumb-image.jpg'),
        assert.equal(_0x40ba43.src, '/output/thumb-image.jpg'),
        assert.equal(_0x40ba43.style.display, 'block'),
        assert.equal(_0x51e437, 1),
        await new Promise((_0x348188) => setTimeout(_0x348188, 80)),
        assert.equal(_0x5eeb97, 0),
        assert.equal(_0x10995f, 0),
        assert.equal(_0x40ba43.src, '/output/thumb-image.jpg'),
        _0x2103d5.shift()?.(),
        await Promise.resolve(),
        await Promise.resolve(),
        await new Promise((_0x55fde7) => setTimeout(_0x55fde7, 0)),
        assert.equal(_0x51e437, 0),
        assert.equal(_0x40ba43.src, '/output/display-image.png'));
    } finally {
      (_0x4b8459 ? (globalThis.Image = _0x1f1793) : delete globalThis.Image,
        (console.log = _0x251af4),
        resetStore());
    }
  }),
  test('SourceImageNode: previous image stays visible while next image preloads without thumbnail', async () => {
    (installDomStubs(), resetStore());
    const _0x3a072f = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      _0x4f5367 = globalThis.Image,
      _0x501503 = console.log;
    console.log = () => {};
    const _0x4be091 = [];
    let _0x1c93f4 = 0;
    class _0x4aad54 {
      constructor() {
        ((this.naturalWidth = 0x280), (this.naturalHeight = 0x168));
      }
      set ['src'](_0x4a89dc) {
        ((this._src = _0x4a89dc),
          (_0x1c93f4 += 1),
          _0x4be091.push(() => {
            ((_0x1c93f4 -= 1), this.onload?.());
          }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    globalThis.Image = _0x4aad54;
    const { SourceImageNode: _0x2572ac } = await import('./SourceImageNode.js');
    try {
      const _0x3558a5 = {
        id: 'keep-previous-image',
        type: 'source-image',
        imageWidth: 0x280,
        imageHeight: 0x168,
        needsAutoResize: false,
      };
      appStore.addNode(_0x3558a5);
      const _0x4f7a08 = {
          src: '/output/old-image.png',
          style: { display: 'block' },
          dataset: {},
          getAttribute(_0x13b5cd) {
            return _0x13b5cd === 'src' ? this.src : '';
          },
        },
        _0x4395d8 = Object.create(_0x2572ac.prototype);
      (Object.assign(_0x4395d8, {
        id: _0x3558a5.id,
        _data: _0x3558a5,
        _currentSrc: '/output/old-image.png',
        _cachedThumbUrl: '',
        _failedSrc: '',
        _activeCapturePreviewUrl: '',
        _card: {
          classList: { add() {}, remove() {} },
          querySelector() {
            return null;
          },
          querySelectorAll() {
            return [];
          },
        },
        _img: _0x4f7a08,
        _hint: { style: { display: '' } },
        _releaseActiveCapturePreviewUrl() {},
        _queueThumbnail() {},
      }),
        _0x4395d8._showImg('/output/new-image.png', ''),
        assert.equal(_0x4f7a08.src, '/output/old-image.png'),
        assert.equal(_0x4f7a08.style.display, 'block'),
        assert.equal(_0x1c93f4, 1),
        _0x4be091.shift()?.(),
        await Promise.resolve(),
        await Promise.resolve(),
        await new Promise((_0x13cde0) => setTimeout(_0x13cde0, 0)),
        assert.equal(_0x1c93f4, 0),
        assert.equal(_0x4f7a08.src, '/output/new-image.png'),
        assert.equal(_0x4f7a08.style.display, 'block'));
    } finally {
      (_0x3a072f ? (globalThis.Image = _0x4f5367) : delete globalThis.Image,
        (console.log = _0x501503),
        resetStore());
    }
  }),
  test('SourceImageNode: local display image shows before thumbnail cache lookup', async () => {
    installDomStubs();
    const { SourceImageNode: _0x5ab995 } = await import('./SourceImageNode.js'),
      _0x3bab5a = Object.create(_0x5ab995.prototype);
    let _0x30ed50 = null;
    Object.assign(_0x3bab5a, {
      _data: {
        id: 'display-first',
        type: 'source-image',
        displayLocalPath: 'output/_derived/display/demo.display.jpg',
        thumbLocalPath: 'output/_derived/thumb/demo.thumb.jpg',
      },
      _resolvedPreviewSig: '',
      _previewResolveToken: 0,
      _cachedThumbUrl: '',
      _adoptCapturePreviewUrl() {},
      _showImg(_0x113adf, _0x568b33) {
        _0x30ed50 = { url: _0x113adf, previewUrl: _0x568b33 };
      },
    });
    const _0x3b2a90 = _0x3bab5a._refreshImageDisplay();
    (assert.deepEqual(_0x30ed50, {
      url: '/output/_derived/display/demo.display.jpg',
      previewUrl: '/output/_derived/thumb/demo.thumb.jpg',
    }),
      await _0x3b2a90);
  }),
  test('SourceImageNode: previewLocalPath is used as an immediate local preview', async () => {
    installDomStubs();
    const { SourceImageNode: _0x3dfbec } = await import('./SourceImageNode.js'),
      _0x484029 = Object.create(_0x3dfbec.prototype);
    (assert.equal(
      _0x484029._getSynchronousThumbUrl({
        previewLocalPath: 'output/previews/local-preview.jpg',
        thumbUrl: 'https://example.invalid/remote-thumb.jpg',
      }),
      '/output/previews/local-preview.jpg',
    ),
      assert.equal(
        _0x484029._getSynchronousThumbUrl({
          images: [{ previewLocalPath: 'output/previews/nested-preview.jpg' }],
        }),
        '/output/previews/nested-preview.jpg',
      ),
      assert.equal(
        _0x484029._getSynchronousThumbUrl({ previewUrl: 'data:image/png;base64,preview' }),
        'data:image/png;base64,preview',
      ));
  }),
  test('SourceImageNode: local preview displays immediately without thumbnail cache lookup', async () => {
    installDomStubs();
    const { SourceImageNode: _0x7e5d83 } = await import('./SourceImageNode.js');
    let _0x376c39 = '';
    const _0x11968f = Object.create(_0x7e5d83.prototype);
    (Object.assign(_0x11968f, {
      id: 'preview-only-image',
      _data: {
        id: 'preview-only-image',
        type: 'source-image',
        previewLocalPath: 'output/previews/preview-only.jpg',
      },
      _resolvedPreviewSig: '',
      _previewResolveToken: 0,
      _cachedThumbUrl: '',
      _activeCapturePreviewUrl: '',
      el: null,
      _shouldUseLowZoomThumbnail() {
        return false;
      },
      _releaseActiveCapturePreviewUrl() {},
      _showLowZoomThumb(_0x3115b3) {
        _0x376c39 = _0x3115b3;
      },
    }),
      await _0x11968f._refreshImageDisplay(),
      assert.equal(_0x376c39, '/output/previews/preview-only.jpg'));
  }));
