import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectLifecycle } from '../src/modules/app/projectLifecycle.js';
function createMemoryLocalStorage(_0x32d13b = {}) {
  const _0x5bd367 = new Map(Object.entries(_0x32d13b));
  return {
    getItem(_0x282feb) {
      return _0x5bd367.has(_0x282feb) ? String(_0x5bd367.get(_0x282feb)) : null;
    },
    setItem(_0x1fa9db, _0x1a34fe) {
      _0x5bd367.set(_0x1fa9db, String(_0x1a34fe));
    },
    removeItem(_0x31febe) {
      _0x5bd367.delete(_0x31febe);
    },
    dump() {
      return _0x5bd367;
    },
  };
}
(test('projectLifecycle: 仅有 getMultiData 时仍能写入同步恢复备份', { concurrency: false }, async () => {
  const _0x3e916c = globalThis.window,
    _0x2acd29 = globalThis.document,
    _0x32f97a = console.warn;
  try {
    console.warn = () => {};
    const _0x24352f = createMemoryLocalStorage();
    ((globalThis.window = { localStorage: _0x24352f, currentProjectId: 'proj-legacy', showToast: () => {} }),
      (globalThis.document = {
        getElementById(_0x22b95f) {
          if (_0x22b95f === 'projectNameText') return { textContent: '旧接口测试' };
          return null;
        },
        querySelector() {
          return null;
        },
      }));
    const _0x16f7e8 = {
        activeCanvasId: 'c1',
        canvases: [
          {
            id: 'c1',
            name: '画布旧接口',
            nodes: [
              {
                id: 'img-running',
                type: 'ai-image',
                model: 'runninghub-model/rhart-image-v1',
                provider: 'runninghub',
                rhTaskId: 'rh-img-legacy',
                rhTaskStatus: 'pending',
                rhTaskStartedAt: 111,
              },
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1.1 },
            assets: [],
          },
        ],
      },
      _0x2c550e = createProjectLifecycle({
        store: {
          subscribeSelector() {},
          getStateRaw() {
            return { nodes: {} };
          },
          updateNodeData() {},
        },
        CanvasTabManager: {
          getMultiData() {
            return _0x16f7e8;
          },
          get _canvases() {
            return [];
          },
        },
        project: {
          resolveCanvasData(_0x10a36e) {
            return _0x10a36e;
          },
          async loadProject() {
            return { canvases: [], activeCanvasId: null };
          },
          async saveProject() {},
          async saveRemoteImageLocally() {
            return '/output/mock.png';
          },
        },
        loadCustomPresets() {},
        async migrateLegacyThumbnailsInMultiData(_0x76e909) {
          return { changed: false, multiData: _0x76e909 };
        },
        sanitizeMultiCanvasDataForPersistence(_0x5e5fa0) {
          return _0x5e5fa0;
        },
        commit() {},
        patchStoreSourceNodeNamesFromFileName() {},
        applySourceNamesFromFileNameToCanvas() {},
      });
    (_0x2c550e.triggerLocalCacheSave(), await new Promise((_0x289166) => setTimeout(_0x289166, 0)));
    const _0x50a61d = _0x24352f.dump().get('tapnow_v2_dreamina_resume_backup');
    assert.ok(_0x50a61d);
    const _0x1101b7 = JSON.parse(_0x50a61d);
    (assert.equal(_0x1101b7.projectId, 'proj-legacy'),
      assert.equal(Array.isArray(_0x1101b7.items), true),
      assert.equal(_0x1101b7.items.length, 1));
  } finally {
    ((console.warn = _0x32f97a), (globalThis.window = _0x3e916c), (globalThis.document = _0x2acd29));
  }
}),
  test(
    'projectLifecycle: ai-image/ai-audio/source-audio RunningHub 进行中任务会写入同步恢复备份',
    { concurrency: false },
    async () => {
      const _0xe7a5a6 = globalThis.window,
        _0x3289bb = globalThis.document,
        _0x4c250f = console.warn;
      try {
        console.warn = () => {};
        const _0x515df9 = createMemoryLocalStorage();
        ((globalThis.window = { localStorage: _0x515df9, currentProjectId: 'proj-rh', showToast: () => {} }),
          (globalThis.document = {
            getElementById(_0x16db84) {
              if (_0x16db84 === 'projectNameText') return { textContent: '恢复测试' };
              return null;
            },
            querySelector() {
              return null;
            },
          }));
        const _0x455923 = {
            activeCanvasId: 'c1',
            canvases: [
              {
                id: 'c1',
                name: '画布1',
                nodes: [
                  {
                    id: 'img-running',
                    type: 'ai-image',
                    model: 'runninghub-model/rhart-image-v1',
                    provider: 'runninghub',
                    rhTaskId: 'rh-img-1',
                    rhTaskStatus: 'pending',
                    rhTaskStartedAt: 111,
                    rhTaskUseOpenapiQuery: true,
                  },
                  {
                    id: 'aud-running',
                    type: 'ai-audio',
                    provider: 'runninghubwf',
                    model: 'indextts2_clone',
                    rhTaskId: 'rh-aud-1',
                    rhTaskStatus: 'running',
                    rhTaskStartedAt: 222,
                  },
                  {
                    id: 'img-success',
                    type: 'ai-image',
                    model: 'runninghub/2050306122774532097',
                    provider: 'runninghubwf',
                    rhTaskId: 'rh-img-success',
                    rhTaskStatus: 'success',
                  },
                  {
                    id: 'src-video-running',
                    type: 'source-video',
                    model: 'runninghub/video_matting',
                    provider: 'runninghubwf',
                    rhTaskId: 'rh-video-1',
                    rhTaskStatus: 'running',
                    rhTaskStartedAt: 0x14d,
                  },
                  {
                    id: 'src-image-running',
                    type: 'source-image',
                    model: 'runninghub/2012862147813974018',
                    provider: 'runninghubwf',
                    rhTaskId: 'rh-src-image-1',
                    rhTaskStatus: 'pending',
                    rhTaskStartedAt: 0x1bc,
                    rhTaskUseOpenapiQuery: false,
                  },
                  {
                    id: 'src-audio-running',
                    type: 'source-audio',
                    model: 'runninghub/2047408096384917505',
                    provider: 'runninghubwf',
                    rhTaskId: 'rh-src-audio-1',
                    rhTaskStatus: 'running',
                    rhTaskStartedAt: 0x22b,
                    rhTaskUseOpenapiQuery: true,
                    audioSplitRole: 'vocals',
                    audioSplitPeerId: 'src-audio-peer',
                  },
                ],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1.1 },
                assets: [],
              },
            ],
          },
          _0x429c6a = createProjectLifecycle({
            store: {
              subscribeSelector() {},
              getStateRaw() {
                return { nodes: {} };
              },
              updateNodeData() {},
            },
            CanvasTabManager: {
              getMultiData() {
                return _0x455923;
              },
              get _canvases() {
                return [];
              },
            },
            project: {
              resolveCanvasData(_0x366cf6) {
                return _0x366cf6;
              },
              async loadProject() {
                return { canvases: [], activeCanvasId: null };
              },
              async saveProject() {},
              async saveRemoteImageLocally() {
                return '/output/mock.png';
              },
            },
            loadCustomPresets() {},
            async migrateLegacyThumbnailsInMultiData(_0x42be1c) {
              return { changed: false, multiData: _0x42be1c };
            },
            sanitizeMultiCanvasDataForPersistence(_0x28d299) {
              return _0x28d299;
            },
            commit() {},
            patchStoreSourceNodeNamesFromFileName() {},
            applySourceNamesFromFileNameToCanvas() {},
          });
        (_0x429c6a.triggerLocalCacheSave(), await new Promise((_0x2739bb) => setTimeout(_0x2739bb, 0)));
        const _0x1b3075 = _0x515df9.dump().get('tapnow_v2_dreamina_resume_backup');
        assert.ok(_0x1b3075);
        const _0x1224bc = JSON.parse(_0x1b3075);
        assert.equal(_0x1224bc.projectId, 'proj-rh');
        const _0xb0e5f3 = Array.isArray(_0x1224bc.items) ? _0x1224bc.items : [];
        assert.equal(_0xb0e5f3.length, 5);
        const _0x2b5ee8 = _0xb0e5f3.find((_0xb2c804) => _0xb2c804.nodeId === 'img-running'),
          _0x373b68 = _0xb0e5f3.find((_0x5b4dac) => _0x5b4dac.nodeId === 'aud-running'),
          _0x144f9d = _0xb0e5f3.find((_0x51a726) => _0x51a726.nodeId === 'src-video-running'),
          _0x96cf08 = _0xb0e5f3.find((_0x1f1c36) => _0x1f1c36.nodeId === 'src-image-running'),
          _0x2f65f0 = _0xb0e5f3.find((_0x5165a6) => _0x5165a6.nodeId === 'src-audio-running');
        (assert.ok(_0x2b5ee8),
          assert.equal(_0x2b5ee8.kind, 'runninghub'),
          assert.equal(_0x2b5ee8.nodeType, 'ai-image'),
          assert.equal(_0x2b5ee8.rhTaskId, 'rh-img-1'),
          assert.ok(_0x373b68),
          assert.equal(_0x373b68.kind, 'runninghub'),
          assert.equal(_0x373b68.nodeType, 'ai-audio'),
          assert.equal(_0x373b68.rhTaskId, 'rh-aud-1'),
          assert.ok(_0x144f9d),
          assert.equal(_0x144f9d.kind, 'runninghub'),
          assert.equal(_0x144f9d.nodeType, 'source-video'),
          assert.equal(_0x144f9d.rhTaskId, 'rh-video-1'),
          assert.ok(_0x96cf08),
          assert.equal(_0x96cf08.kind, 'runninghub'),
          assert.equal(_0x96cf08.nodeType, 'source-image'),
          assert.equal(_0x96cf08.rhTaskId, 'rh-src-image-1'),
          assert.ok(_0x2f65f0),
          assert.equal(_0x2f65f0.kind, 'runninghub'),
          assert.equal(_0x2f65f0.nodeType, 'source-audio'),
          assert.equal(_0x2f65f0.rhTaskId, 'rh-src-audio-1'),
          assert.equal(
            _0xb0e5f3.some((_0x1a5a68) => _0x1a5a68.nodeId === 'img-success'),
            false,
          ));
      } finally {
        ((console.warn = _0x4c250f), (globalThis.window = _0xe7a5a6), (globalThis.document = _0x3289bb));
      }
    },
  ),
  test(
    'projectLifecycle: Dreamina 图片与 async 进行中任务会写入同步恢复备份',
    { concurrency: false },
    async () => {
      const _0x53ba5a = globalThis.window,
        _0x23c145 = globalThis.document,
        _0x42999e = console.warn;
      try {
        console.warn = () => {};
        const _0x4870d7 = createMemoryLocalStorage();
        ((globalThis.window = {
          localStorage: _0x4870d7,
          currentProjectId: 'proj-async',
          showToast: () => {},
        }),
          (globalThis.document = {
            getElementById(_0x21eb50) {
              if (_0x21eb50 === 'projectNameText') return { textContent: '恢复测试2' };
              return null;
            },
            querySelector() {
              return null;
            },
          }));
        const _0x13d4bf = {
            activeCanvasId: 'c1',
            canvases: [
              {
                id: 'c1',
                name: '画布1',
                nodes: [
                  {
                    id: 'dreamina-img-running',
                    type: 'ai-image',
                    model: 'dreamina/4.5',
                    provider: 'dreamina',
                    dreaminaSubmitId: 'dm-submit-1',
                    dreaminaTaskStatus: 'pending',
                    dreaminaTaskPhase: 'generating',
                    dreaminaTaskStartedAt: 0x3e9,
                  },
                  {
                    id: 'dreamina-img-error-result',
                    type: 'ai-image',
                    model: 'dreamina/4.5',
                    provider: 'dreamina',
                    dreaminaSubmitId: 'dm-submit-error',
                    dreaminaTaskStatus: 'pending',
                    dreaminaTaskPhase: 'syncing',
                    dreaminaTaskStartedAt: 0x3ef,
                    dreaminaTaskRecovering: true,
                    images: [
                      {
                        error: 'generation failed: final generation failed',
                        imageUrl: '',
                        thumbUrl: '',
                      },
                    ],
                  },
                  {
                    id: 'async-video-running',
                    type: 'ai-video',
                    model: 'apimart/veo3-fast',
                    provider: 'apimart',
                    asyncTaskProvider: 'apimart',
                    asyncTaskKind: 'video',
                    asyncTaskId: 'async-video-1',
                    asyncTaskStatus: 'running',
                    asyncTaskStartedAt: 0x3ea,
                  },
                  {
                    id: 'async-image-running',
                    type: 'source-image',
                    model: 'grsai/seedream-4.0',
                    provider: 'grsai',
                    asyncTaskProvider: 'grsai',
                    asyncTaskKind: 'image',
                    asyncTaskId: 'async-image-1',
                    asyncTaskStatus: 'pending',
                    asyncTaskStartedAt: 0x3eb,
                  },
                  {
                    id: 'async-success',
                    type: 'source-video',
                    model: 'apimart/veo3-fast',
                    provider: 'apimart',
                    asyncTaskProvider: 'apimart',
                    asyncTaskKind: 'video',
                    asyncTaskId: 'async-video-success',
                    asyncTaskStatus: 'success',
                  },
                  {
                    id: 'async-ppio-model-only',
                    type: 'ai-image',
                    model: 'ppio/seedream-5.0-lite',
                    asyncTaskKind: 'image',
                    asyncTaskId: 'async-ppio-1',
                    asyncTaskStatus: 'running',
                    asyncTaskStartedAt: 0x3ec,
                  },
                  {
                    id: 'async-ppio-model-with-stale-provider',
                    type: 'ai-image',
                    model: 'ppio/seedream-4.5',
                    provider: 'grsai',
                    asyncTaskKind: 'image',
                    asyncTaskId: 'async-ppio-2',
                    asyncTaskStatus: 'running',
                    asyncTaskStartedAt: 0x3ed,
                  },
                  {
                    id: 'async-grsai-bare-model-with-stale-provider',
                    type: 'ai-image',
                    model: 'nano-banana-pro-vt',
                    provider: 'runninghubwf',
                    asyncTaskKind: 'image',
                    asyncTaskId: 'async-grsai-1',
                    asyncTaskStatus: 'running',
                    asyncTaskStartedAt: 0x3ee,
                  },
                ],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1.1 },
                assets: [],
              },
            ],
          },
          _0x20ece6 = createProjectLifecycle({
            store: {
              subscribeSelector() {},
              getStateRaw() {
                return { nodes: {} };
              },
              updateNodeData() {},
            },
            CanvasTabManager: {
              getMultiData() {
                return _0x13d4bf;
              },
              get _canvases() {
                return [];
              },
            },
            project: {
              resolveCanvasData(_0x584f5a) {
                return _0x584f5a;
              },
              async loadProject() {
                return { canvases: [], activeCanvasId: null };
              },
              async saveProject() {},
              async saveRemoteImageLocally() {
                return '/output/mock.png';
              },
            },
            loadCustomPresets() {},
            async migrateLegacyThumbnailsInMultiData(_0x24526a) {
              return { changed: false, multiData: _0x24526a };
            },
            sanitizeMultiCanvasDataForPersistence(_0x5ee3a8) {
              return _0x5ee3a8;
            },
            commit() {},
            patchStoreSourceNodeNamesFromFileName() {},
            applySourceNamesFromFileNameToCanvas() {},
          });
        (_0x20ece6.triggerLocalCacheSave(), await new Promise((_0xd931a8) => setTimeout(_0xd931a8, 0)));
        const _0x12faa2 = _0x4870d7.dump().get('tapnow_v2_dreamina_resume_backup');
        assert.ok(_0x12faa2);
        const _0x45cefe = JSON.parse(_0x12faa2),
          _0x5b5dd7 = Array.isArray(_0x45cefe.items) ? _0x45cefe.items : [];
        assert.equal(_0x5b5dd7.length, 6);
        const _0x7f506b = _0x5b5dd7.find((_0x447f3a) => _0x447f3a.nodeId === 'dreamina-img-running'),
          _0x413b60 = _0x5b5dd7.find((_0x50d2b2) => _0x50d2b2.nodeId === 'async-video-running'),
          _0x19e9c9 = _0x5b5dd7.find((_0x89f0e) => _0x89f0e.nodeId === 'async-ppio-model-only'),
          _0x299c4f = _0x5b5dd7.find(
            (_0x171f02) => _0x171f02.nodeId === 'async-ppio-model-with-stale-provider',
          ),
          _0x2bcc7d = _0x5b5dd7.find((_0x1470ad) => _0x1470ad.nodeId === 'async-image-running'),
          _0x231a20 = _0x5b5dd7.find(
            (_0x489c94) => _0x489c94.nodeId === 'async-grsai-bare-model-with-stale-provider',
          );
        (assert.ok(_0x7f506b),
          assert.equal(_0x7f506b.kind, 'dreamina'),
          assert.equal(_0x7f506b.dreaminaSubmitId, 'dm-submit-1'),
          assert.ok(_0x413b60),
          assert.equal(_0x413b60.kind, 'async'),
          assert.equal(_0x413b60.asyncTaskProvider, 'apimart'),
          assert.equal(_0x413b60.asyncTaskKind, 'video'),
          assert.equal(_0x413b60.asyncTaskId, 'async-video-1'),
          assert.ok(_0x19e9c9),
          assert.equal(_0x19e9c9.kind, 'async'),
          assert.equal(_0x19e9c9.asyncTaskProvider, 'ppio'),
          assert.equal(_0x19e9c9.asyncTaskKind, 'image'),
          assert.equal(_0x19e9c9.asyncTaskId, 'async-ppio-1'),
          assert.ok(_0x299c4f),
          assert.equal(_0x299c4f.kind, 'async'),
          assert.equal(_0x299c4f.asyncTaskProvider, 'ppio'),
          assert.equal(_0x299c4f.asyncTaskKind, 'image'),
          assert.equal(_0x299c4f.asyncTaskId, 'async-ppio-2'),
          assert.ok(_0x2bcc7d),
          assert.equal(_0x2bcc7d.kind, 'async'),
          assert.equal(_0x2bcc7d.asyncTaskProvider, 'grsai'),
          assert.equal(_0x2bcc7d.asyncTaskKind, 'image'),
          assert.equal(_0x2bcc7d.asyncTaskId, 'async-image-1'),
          assert.ok(_0x231a20),
          assert.equal(_0x231a20.kind, 'async'),
          assert.equal(_0x231a20.asyncTaskProvider, 'grsai'),
          assert.equal(_0x231a20.asyncTaskKind, 'image'),
          assert.equal(_0x231a20.asyncTaskId, 'async-grsai-1'),
          assert.equal(
            _0x5b5dd7.some((_0x503732) => _0x503732.nodeId === 'async-success'),
            false,
          ),
          assert.equal(
            _0x5b5dd7.some((_0xd3ee6d) => _0xd3ee6d.nodeId === 'dreamina-img-error-result'),
            false,
          ));
      } finally {
        ((console.warn = _0x42999e), (globalThis.window = _0x53ba5a), (globalThis.document = _0x23c145));
      }
    },
  ));
