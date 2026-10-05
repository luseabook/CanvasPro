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
      (globalThis.document.createElement = (value = 'div') => {
        const item = {
          tagName: String(value).toUpperCase(),
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
          appendChild(key) {
            return (this.childNodes.push(key), key);
          },
          replaceChildren(...args) {
            this.childNodes = args;
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
          setAttribute(index, result) {
            this[index] = result;
          },
          getAttribute(data) {
            return this[data] || '';
          },
          click() {},
        };
        return (
          String(value).toLowerCase() === 'template' &&
            (item.content = {
              cloneNode() {
                return { childNodes: [] };
              },
            }),
          item
        );
      }),
    typeof globalThis.document.createElementNS !== 'function' &&
      (globalThis.document.createElementNS = (options, target = 'svg') =>
        globalThis.document.createElement(target)),
    typeof globalThis.document.createTextNode !== 'function' &&
      (globalThis.document.createTextNode = (source = '') => ({
        nodeType: globalThis.Node?.TEXT_NODE || 3,
        textContent: String(source),
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
  const { SourceImageNode: SourceImageNode } = await import('./SourceImageNode.js'),
    next = globalThis.window.requestIdleCallback,
    current = globalThis.window.cancelIdleCallback;
  let entry = null;
  ((globalThis.window.requestIdleCallback = (record) => {
    return ((entry = record), 7);
  }),
    (globalThis.window.cancelIdleCallback = () => {}));
  try {
    const payload = {
        id: 'source-image-mount-lazy',
        type: 'source-image',
        displayLocalPath: 'output/_derived/display/lazy.display.jpg',
        thumbLocalPath: 'output/_derived/thumb/lazy.thumb.jpg',
        fixedSize: true,
        needsAutoResize: false,
        imageWidth: 1200,
        imageHeight: 800,
      },
      handle = new SourceImageNode(payload);
    (handle.mount(),
      assert.equal(handle._img.src, '/output/_derived/thumb/lazy.thumb.jpg'),
      assert.equal(handle._currentSrc, '/output/_derived/display/lazy.display.jpg'),
      assert.equal(handle._img.loading, 'eager'),
      assert.equal(handle._img.fetchPriority, 'high'),
      assert.equal(handle._img.dataset.lodSrc, 'placeholder'),
      assert.equal(typeof entry, 'function'),
      handle.unmount());
  } finally {
    (next === undefined
      ? delete globalThis.window.requestIdleCallback
      : (globalThis.window.requestIdleCallback = next),
      current === undefined
        ? delete globalThis.window.cancelIdleCallback
        : (globalThis.window.cancelIdleCallback = current),
      resetStore());
  }
}),
  test('SourceImageNode: renderer-deferred media waits for hydration', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: SourceImageNode2 } = await import('./SourceImageNode.js'),
      state = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      config = globalThis.Image,
      list = [];
    class scope {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 640),
          (this.naturalHeight = 360));
      }
      set ['src'](input) {
        ((this._src = input), list.push({ resolve: () => this.onload?.() }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    globalThis.Image = scope;
    try {
      const output = new SourceImageNode2({
        id: 'source-image-defer-media',
        type: 'source-image',
        displayLocalPath: 'output/_derived/display/defer.display.jpg',
        thumbLocalPath: 'output/_derived/thumb/defer.thumb.jpg',
        fixedSize: true,
        needsAutoResize: false,
        [RENDERER_DEFER_MEDIA_ON_MOUNT_FLAG]: true,
      });
      (output.mount(),
        assert.equal(output._img.src, '/output/_derived/thumb/defer.thumb.jpg'),
        assert.equal(output._img.style.display, 'block'),
        assert.equal(output._img.dataset.lodSrc, 'placeholder'),
        assert.equal(output._currentSrc, '/output/_derived/display/defer.display.jpg'),
        assert.equal(list.length, 0),
        output.hydrateDeferredMedia(),
        assert.equal(list.length, 1),
        list.shift()?.resolve());
      for (let count = 0; count < 8; count += 1) await Promise.resolve();
      (assert.equal(output._img.src, '/output/_derived/display/defer.display.jpg'), output.unmount());
    } finally {
      (resetStore(), state ? (globalThis.Image = config) : delete globalThis.Image);
    }
  }),
  test('SourceImageNode: 旧超时失败的 RunningHub 节点仍可恢复', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode3 } = await import('./SourceImageNode.js'),
      value2 = Object.create(SourceImageNode3.prototype);
    assert.equal(
      value2._isRunningHubRecoverableTask({
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
    const { SourceImageNode: SourceImageNode4 } = await import('./SourceImageNode.js'),
      value3 = Object.create(SourceImageNode4.prototype),
      list2 = [];
    (Object.assign(value3, {
      id: 'capture-preview',
      _data: { id: 'capture-preview', type: 'source-image', capturePreviewUrl: 'blob:capture-preview' },
      _resolvedPreviewSig: '',
      _previewResolveToken: 0,
      _cachedThumbUrl: '',
      _activeCapturePreviewUrl: '',
      _showImg(url, previewUrl) {
        list2.push({ url: url, previewUrl: previewUrl });
      },
    }),
      await value3._refreshImageDisplay(),
      assert.deepEqual(list2, [{ url: 'blob:capture-preview', previewUrl: '' }]),
      assert.equal(value3._activeCapturePreviewUrl, 'blob:capture-preview'));
  }),
  test('SourceImageNode: accepts electron local capture preview URL', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode5 } = await import('./SourceImageNode.js'),
      value4 = Object.create(SourceImageNode5.prototype);
    assert.equal(
      value4._getCapturePreviewUrl({ capturePreviewUrl: 'aic-local-preview://preview/token/large.png' }),
      'aic-local-preview://preview/token/large.png',
    );
  }),
  test('SourceImageNode: pending capture preview is not covered by running overlay', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode6 } = await import('./SourceImageNode.js'),
      value5 = Object.create(SourceImageNode6.prototype),
      _jobUI = {
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
    (Object.assign(value5, {
      _data: {
        id: 'capture-preview-running',
        type: 'source-image',
        jobStatus: 'running',
        capturePreviewUrl: 'blob:capture-preview-running',
      },
      _jobUI: _jobUI,
      _hint: { style: { display: '' } },
      _uploadBtn: { disabled: false },
    }),
      value5._syncJobUI('running'),
      assert.equal(_jobUI.style.display, 'none'),
      assert.equal(_jobUI.replaceChildrenCalled, 1),
      assert.equal(value5._hint.style.display, 'none'),
      assert.equal(value5._uploadBtn.disabled, true));
  }),
  test('SourceImageNode: running RH task ignores inactive Dreamina done fields', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode7 } = await import('./SourceImageNode.js');
    let value6 = 0;
    const value7 = Object.create(SourceImageNode7.prototype);
    (Object.assign(value7, {
      id: 'source-rh-running',
      _img: {},
      _data: { id: 'source-rh-running', type: 'source-image' },
      _currentJobStatus: null,
      _currentSrc: '',
      _isUploading: false,
      _card: {
        classList: { remove() {} },
        querySelectorAll() {
          return ((value6 += 1), []);
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
      value7.update({
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
      assert.equal(value6, 0),
      assert.equal(value7._currentJobStatus, 'running'));
  }),
  test('SourceImageNode: recovering task without result shows unified loading', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode8 } = await import('./SourceImageNode.js'),
      list3 = [],
      value8 = Object.create(SourceImageNode8.prototype);
    (Object.assign(value8, {
      id: 'source-rh-recovering',
      _img: {},
      _data: { id: 'source-rh-recovering', type: 'source-image' },
      _currentJobStatus: null,
      _currentSrc: '',
      _isUploading: false,
      _card: {
        classList: {
          add(...args2) {
            list3.push(...args2);
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
      value8.update({
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
      await new Promise((value9) => setTimeout(value9, 60)),
      assert.equal(value8._uploadBtn.disabled, true),
      assert.equal(value8._hint.style.display, 'none'),
      assert.ok(list3.includes('img-preview-loading')));
  }),
  test('SourceImageNode: terminal failure stops loading over stale generating flag', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode9 } = await import('./SourceImageNode.js');
    let value10 = 0;
    const value11 = Object.create(SourceImageNode9.prototype);
    (Object.assign(value11, {
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
          return ((value10 += 1), []);
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
      value11.update({
        id: 'source-rh-stale-failed',
        type: 'source-image',
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        isGenerating: true,
        jobStatus: 'running',
        rhTaskStatus: 'failed',
      }),
      assert.equal(value10, 1),
      assert.equal(value11._uploadBtn.disabled, false));
  }),
  test('SourceImageNode: upload size patch preserves landscape ratio', async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: buildSourceImageUploadSizePatch } =
      await import('./SourceImageNode.js');
    assert.deepEqual(buildSourceImageUploadSizePatch({ width: 1920, height: 1080 }), {
      width: 512,
      height: 288,
      imageWidth: 1920,
      imageHeight: 1080,
      needsAutoResize: false,
    });
  }),
  test('SourceImageNode: upload size patch preserves portrait ratio', async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: buildSourceImageUploadSizePatch2 } =
      await import('./SourceImageNode.js');
    assert.deepEqual(buildSourceImageUploadSizePatch2({ width: 1080, height: 1920 }), {
      width: 288,
      height: 512,
      imageWidth: 1080,
      imageHeight: 1920,
      needsAutoResize: false,
    });
  }),
  test('SourceImageNode: upload size patch waits for auto resize when metadata is missing', async () => {
    installDomStubs();
    const { buildSourceImageUploadSizePatch: buildSourceImageUploadSizePatch3 } =
      await import('./SourceImageNode.js');
    assert.deepEqual(buildSourceImageUploadSizePatch3({ width: 0, height: 0 }), { needsAutoResize: true });
  }),
  test('SourceImageNode: RunningHub pending 恢复结果保持生成中并安排继续查询', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: SourceImageNode10 } = await import('./SourceImageNode.js'),
      id = {
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
    appStore.addNode(id);
    const value12 = Object.create(SourceImageNode10.prototype);
    Object.assign(value12, {
      id: id.id,
      _data: id,
      _rhResumeAbortController: null,
      _rhResumeTaskId: '',
      _rhResumePromise: null,
      _rhResumeRetryTimer: null,
    });
    let value13 = 0;
    ((value12._resumeRunningHubTaskPoller = async (value14) => {
      return (
        assert.equal(value14, 'rh-task-pending'),
        { pending: true, taskId: 'rh-task-pending', status: 'running', message: '任务仍在 RunningHub 生成中' }
      );
    }),
      (value12._scheduleRunningHubRecoveryRetry = () => {
        value13 += 1;
      }),
      value12._maybeResumeRunningHubTask(),
      await value12._rhResumePromise);
    const value15 = appStore.getState().nodes[id.id];
    (assert.equal(value15.isGenerating, true),
      assert.equal(value15.jobStatus, 'running'),
      assert.equal(value15.rhTaskStatus, 'running'),
      assert.equal(value15.rhTaskRecovering, false),
      assert.equal(value15.rhStatusMessage, '任务仍在 RunningHub 生成中'),
      assert.equal(value13, 1),
      resetStore());
  }),
  test('SourceImageNode: RunningHub 恢复失败通过结果渲染器写入错误结果', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: SourceImageNode11 } = await import('./SourceImageNode.js'),
      id2 = {
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
    appStore.addNode(id2);
    const value16 = Object.create(SourceImageNode11.prototype);
    (Object.assign(value16, {
      id: id2.id,
      _data: id2,
      _rhResumeAbortController: null,
      _rhResumeTaskId: '',
      _rhResumePromise: null,
      _computeGenerationDuration: () => 321,
    }),
      (value16._resumeRunningHubTaskPoller = async () => {
        throw new Error('RunningHub 恢复失败');
      }),
      value16._maybeResumeRunningHubTask(),
      await value16._rhResumePromise);
    const value17 = appStore.getState().nodes[id2.id];
    (assert.equal(value17.isGenerating, false),
      assert.equal(value17.jobStatus, 'error'),
      assert.equal(value17.jobError, 'RunningHub 恢复失败'),
      assert.equal(value17.generationDuration, 321),
      assert.equal(value17.rhTaskStatus, 'failed'),
      assert.equal(value17.rhTaskRecovering, false),
      assert.equal(value17.images?.[0]?.error, 'RunningHub 恢复失败'),
      assert.equal(value17.mainImageIndex, 0),
      assert.match(value17.outputText, /恢复失败: RunningHub 恢复失败/),
      resetStore());
  }),
  test('SourceImageNode: Dreamina error aliases are not recoverable', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode12 } = await import('./SourceImageNode.js'),
      value18 = Object.create(SourceImageNode12.prototype);
    (assert.equal(
      value18._isDreaminaRecoverableTask({
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
        value18._isDreaminaRecoverableTask({
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
        value18._isDreaminaRecoverableTask({
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
        value18._isDreaminaRecoverableTask({
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
    const { SourceImageNode: SourceImageNode13 } = await import('./SourceImageNode.js'),
      id3 = {
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
        dreaminaTaskLastCheckedAt: 456,
        isGenerating: false,
        jobStatus: 'success',
      };
    appStore.addNode(id3);
    const value19 = Object.create(SourceImageNode13.prototype);
    Object.assign(value19, {
      id: id3.id,
      _data: id3,
      _dreaminaResumeAbortController: null,
      _dreaminaResumeSubmitId: '',
      _dreaminaResumePromise: null,
      _computeGenerationDuration: () => 789,
    });
    let run = null;
    const value20 = new Promise((handler) => {
      value19._dreaminaResumePoller = async (value21) => {
        (assert.equal(value21, 'dm-syncing-failed'),
          handler(),
          await new Promise((value22, value23) => {
            run = value23;
          }));
      };
    });
    (value19._maybeResumeDreaminaTask(),
      await value20,
      assert.equal(appStore.getState().nodes[id3.id].dreaminaTaskStatus, 'pending'),
      assert.equal(appStore.getState().nodes[id3.id].dreaminaTaskPhase, 'generating'),
      run(new Error('generation failed: final generation failed')),
      await value19._dreaminaResumePromise);
    const value24 = appStore.getState().nodes[id3.id];
    (assert.equal(value24.isGenerating, false),
      assert.equal(value24.jobStatus, 'error'),
      assert.equal(value24.jobError, 'generation failed: final generation failed'),
      assert.equal(value24.generationDuration, 789),
      assert.equal(value24.images?.[0]?.error, 'generation failed: final generation failed'),
      assert.equal(value24.mainImageIndex, 0),
      assert.equal(value24.dreaminaTaskStatus, 'failed'),
      assert.equal(value24.dreaminaTaskPhase, 'failed'),
      assert.equal(value24.dreaminaTaskLabel, 'generation failed: final generation failed'),
      assert.equal(value24.dreaminaTaskRecovering, false),
      resetStore());
  }),
  test('SourceImageNode: Dreamina 恢复超时转为后台 pending', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: SourceImageNode14 } = await import('./SourceImageNode.js'),
      id4 = {
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
        dreaminaTaskLastCheckedAt: 456,
        dreaminaTaskRecovering: true,
        isGenerating: true,
        jobStatus: 'running',
      };
    appStore.addNode(id4);
    const value25 = Object.create(SourceImageNode14.prototype);
    (Object.assign(value25, {
      id: id4.id,
      _data: id4,
      _dreaminaResumeAbortController: null,
      _dreaminaResumeSubmitId: '',
      _dreaminaResumePromise: null,
      _computeGenerationDuration: () => 789,
    }),
      (value25._dreaminaResumePoller = async (value26) => {
        assert.equal(value26, 'dm-timeout');
        const error = new Error('Dreamina poll timeout');
        error.code = 'DREAMINA_POLL_TIMEOUT';
        throw error;
      }),
      value25._maybeResumeDreaminaTask(),
      await value25._dreaminaResumePromise);
    const value27 = appStore.getState().nodes[id4.id];
    (assert.equal(value27.isGenerating, true),
      assert.equal(value27.jobStatus, 'running'),
      assert.equal(value27.jobError, null),
      assert.equal(value27.dreaminaTaskStatus, 'pending'),
      assert.equal(value27.dreaminaTaskPhase, 'generating'),
      assert.equal(value27.dreaminaTaskLabel, '排队中（后台查询）'),
      assert.equal(value27.dreaminaTaskRecovering, false),
      resetStore());
  }),
  test('SourceImageNode: async 恢复失败保留已有媒体字段并写入错误结果', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: SourceImageNode15 } = await import('./SourceImageNode.js'),
      id5 = {
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
    appStore.addNode(id5);
    const value28 = Object.create(SourceImageNode15.prototype);
    (Object.assign(value28, {
      id: id5.id,
      _data: id5,
      _asyncResumeAbortController: null,
      _asyncResumeTaskId: '',
      _asyncResumePromise: null,
      _computeGenerationDuration: () => 654,
    }),
      (value28._resumeAsyncTaskPoller = async () => {
        throw new Error('异步恢复失败');
      }),
      value28._maybeResumeAsyncTask(),
      await value28._asyncResumePromise);
    const value29 = appStore.getState().nodes[id5.id];
    (assert.equal(value29.isGenerating, false),
      assert.equal(value29.jobStatus, 'error'),
      assert.equal(value29.jobError, '异步恢复失败'),
      assert.equal(value29.generationDuration, 654),
      assert.equal(value29.asyncTaskStatus, 'failed'),
      assert.equal(value29.asyncTaskRecovering, false),
      assert.equal(value29.images?.[0]?.error, '异步恢复失败'),
      assert.equal(value29.mainImageIndex, 0),
      assert.equal(value29.imageUrl, '/output/previous.png'),
      assert.equal(value29.thumbUrl, '/output/previous-thumb.png'),
      assert.match(value29.outputText, /恢复失败: 异步恢复失败/),
      resetStore());
  }),
  test('SourceImageNode: display image preloads use conservative global limit', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: SourceImageNode16 } = await import('./SourceImageNode.js'),
      value30 = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      value31 = globalThis.Image,
      value32 = Object.prototype.hasOwnProperty.call(globalThis, '__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__'),
      value33 = globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__,
      value34 = console.log,
      list4 = [];
    let value35 = 0,
      value36 = 0;
    class value37 {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 800),
          (this.naturalHeight = 600));
      }
      set ['src'](value38) {
        ((this._src = value38),
          (value35 += 1),
          (value36 = Math.max(value36, value35)),
          list4.push(() => {
            ((value35 -= 1), this.onload?.());
          }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    ((globalThis.Image = value37),
      (globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__ = 3),
      (console.log = () => {}));
    try {
      const list5 = [];
      for (let count2 = 0; count2 < 8; count2 += 1) {
        const id6 = 'preload-limit-' + count2,
          _data = {
            id: id6,
            type: 'source-image',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fixedSize: true,
            needsAutoResize: false,
            thumbLocalPath: 'data/assets/thumb.jpg',
          };
        appStore.addNode(_data);
        const _img = {
            src: '',
            style: { display: 'none' },
            getAttribute(value39) {
              return value39 === 'src' ? this.src : '';
            },
          },
          value40 = Object.create(SourceImageNode16.prototype);
        (Object.assign(value40, {
          id: id6,
          _data: _data,
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
          _img: _img,
          _hint: { style: { display: '' } },
          _releaseActiveCapturePreviewUrl() {},
          _queueThumbnail() {},
        }),
          list5.push(value40));
      }
      for (let value41 = 0; value41 < list5.length; value41 += 1) {
        list5[value41]._showImg('/output/preload-' + value41 + '.png', '');
      }
      assert.equal(value36, 3);
      while (list4.length > 0) {
        const run2 = list4.shift();
        (run2(), await Promise.resolve());
      }
      (await Promise.resolve(),
        assert.equal(value36, 3),
        assert.equal(value35, 0),
        (value36 = 0),
        (list5[0]._currentSrc = ''),
        (list5[1]._currentSrc = ''),
        list5[0]._showImg('/output/shared-preload.png', ''),
        list5[1]._showImg('/output/shared-preload.png', ''),
        assert.equal(value35, 1),
        assert.equal(value36, 1),
        list4.shift()?.(),
        await Promise.resolve(),
        await Promise.resolve(),
        await new Promise((value42) => setTimeout(value42, 0)),
        assert.equal(value35, 0));
      const value43 = list4.length;
      (list5[0]._showImg('/output/shared-preload.png', ''),
        await Promise.resolve(),
        assert.equal(value35, 0),
        assert.equal(list4.length, value43));
    } finally {
      (value30 ? (globalThis.Image = value31) : delete globalThis.Image,
        value32
          ? (globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__ = value33)
          : delete globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__,
        (console.log = value34),
        resetStore());
    }
  }),
  test('SourceImageNode: thumbnail stays visible while display image preloads', async () => {
    (installDomStubs(), resetStore());
    const { SourceImageNode: SourceImageNode17 } = await import('./SourceImageNode.js'),
      value44 = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      value45 = globalThis.Image,
      value46 = console.log,
      list6 = [];
    let value47 = 0,
      value48 = 0,
      value49 = 0;
    class value50 {
      constructor() {
        ((this.onload = null),
          (this.onerror = null),
          (this.naturalWidth = 900),
          (this.naturalHeight = 600));
      }
      set ['src'](value51) {
        ((this._src = value51),
          (value47 += 1),
          list6.push(() => {
            ((value47 -= 1), this.onload?.());
          }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    ((globalThis.Image = value50), (console.log = () => {}));
    try {
      const id7 = {
        id: 'thumb-first',
        type: 'source-image',
        width: 100,
        height: 100,
        fixedSize: true,
        needsAutoResize: false,
        imageWidth: 900,
        imageHeight: 600,
      };
      appStore.addNode(id7);
      const _img2 = {
          src: '',
          style: { display: 'none' },
          getAttribute(value52) {
            return value52 === 'src' ? this.src : '';
          },
        },
        _card = {
          classList: {
            add() {
              value48 += 1;
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
            value49 += 1;
          },
        },
        value53 = Object.create(SourceImageNode17.prototype);
      (Object.assign(value53, {
        id: id7.id,
        _data: id7,
        _currentSrc: '',
        _cachedThumbUrl: '',
        _failedSrc: '',
        _activeCapturePreviewUrl: '',
        _card: _card,
        _img: _img2,
        _hint: { style: { display: '' } },
        _releaseActiveCapturePreviewUrl() {},
        _queueThumbnail() {},
      }),
        value53._showImg('/output/display-image.png', '/output/thumb-image.jpg'),
        assert.equal(_img2.src, '/output/thumb-image.jpg'),
        assert.equal(_img2.style.display, 'block'),
        assert.equal(value47, 1),
        await new Promise((value54) => setTimeout(value54, 80)),
        assert.equal(value48, 0),
        assert.equal(value49, 0),
        assert.equal(_img2.src, '/output/thumb-image.jpg'),
        list6.shift()?.(),
        await Promise.resolve(),
        await Promise.resolve(),
        await new Promise((value55) => setTimeout(value55, 0)),
        assert.equal(value47, 0),
        assert.equal(_img2.src, '/output/display-image.png'));
    } finally {
      (value44 ? (globalThis.Image = value45) : delete globalThis.Image,
        (console.log = value46),
        resetStore());
    }
  }),
  test('SourceImageNode: previous image stays visible while next image preloads without thumbnail', async () => {
    (installDomStubs(), resetStore());
    const value56 = Object.prototype.hasOwnProperty.call(globalThis, 'Image'),
      value57 = globalThis.Image,
      value58 = console.log;
    console.log = () => {};
    const list7 = [];
    let value59 = 0;
    class value60 {
      constructor() {
        ((this.naturalWidth = 640), (this.naturalHeight = 360));
      }
      set ['src'](value61) {
        ((this._src = value61),
          (value59 += 1),
          list7.push(() => {
            ((value59 -= 1), this.onload?.());
          }));
      }
      get ['src']() {
        return this._src || '';
      }
    }
    globalThis.Image = value60;
    const { SourceImageNode: SourceImageNode18 } = await import('./SourceImageNode.js');
    try {
      const id8 = {
        id: 'keep-previous-image',
        type: 'source-image',
        imageWidth: 640,
        imageHeight: 360,
        needsAutoResize: false,
      };
      appStore.addNode(id8);
      const _img3 = {
          src: '/output/old-image.png',
          style: { display: 'block' },
          dataset: {},
          getAttribute(value62) {
            return value62 === 'src' ? this.src : '';
          },
        },
        value63 = Object.create(SourceImageNode18.prototype);
      (Object.assign(value63, {
        id: id8.id,
        _data: id8,
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
        _img: _img3,
        _hint: { style: { display: '' } },
        _releaseActiveCapturePreviewUrl() {},
        _queueThumbnail() {},
      }),
        value63._showImg('/output/new-image.png', ''),
        assert.equal(_img3.src, '/output/old-image.png'),
        assert.equal(_img3.style.display, 'block'),
        assert.equal(value59, 1),
        list7.shift()?.(),
        await Promise.resolve(),
        await Promise.resolve(),
        await new Promise((value64) => setTimeout(value64, 0)),
        assert.equal(value59, 0),
        assert.equal(_img3.src, '/output/new-image.png'),
        assert.equal(_img3.style.display, 'block'));
    } finally {
      (value56 ? (globalThis.Image = value57) : delete globalThis.Image,
        (console.log = value58),
        resetStore());
    }
  }),
  test('SourceImageNode: local display image shows before thumbnail cache lookup', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode19 } = await import('./SourceImageNode.js'),
      value65 = Object.create(SourceImageNode19.prototype);
    let value66 = null;
    Object.assign(value65, {
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
      _showImg(url2, previewUrl2) {
        value66 = { url: url2, previewUrl: previewUrl2 };
      },
    });
    const value67 = value65._refreshImageDisplay();
    (assert.deepEqual(value66, {
      url: '/output/_derived/display/demo.display.jpg',
      previewUrl: '/output/_derived/thumb/demo.thumb.jpg',
    }),
      await value67);
  }),
  test('SourceImageNode: previewLocalPath is used as an immediate local preview', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode20 } = await import('./SourceImageNode.js'),
      value68 = Object.create(SourceImageNode20.prototype);
    (assert.equal(
      value68._getSynchronousThumbUrl({
        previewLocalPath: 'output/previews/local-preview.jpg',
        thumbUrl: 'https://example.invalid/remote-thumb.jpg',
      }),
      '/output/previews/local-preview.jpg',
    ),
      assert.equal(
        value68._getSynchronousThumbUrl({
          images: [{ previewLocalPath: 'output/previews/nested-preview.jpg' }],
        }),
        '/output/previews/nested-preview.jpg',
      ),
      assert.equal(
        value68._getSynchronousThumbUrl({ previewUrl: 'data:image/png;base64,preview' }),
        'data:image/png;base64,preview',
      ));
  }),
  test('SourceImageNode: local preview displays immediately without thumbnail cache lookup', async () => {
    installDomStubs();
    const { SourceImageNode: SourceImageNode21 } = await import('./SourceImageNode.js');
    let value69 = '';
    const value70 = Object.create(SourceImageNode21.prototype);
    (Object.assign(value70, {
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
      _showLowZoomThumb(value71) {
        value69 = value71;
      },
    }),
      await value70._refreshImageDisplay(),
      assert.equal(value69, '/output/previews/preview-only.jpg'));
  }));
