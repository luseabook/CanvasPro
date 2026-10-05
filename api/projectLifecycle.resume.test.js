import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectLifecycle } from '../src/modules/app/projectLifecycle.js';
function createMemoryLocalStorage(options = {}) {
  const map = new Map(Object.entries(options));
  return {
    getItem(value) {
      return map.has(value) ? String(map.get(value)) : null;
    },
    setItem(item, key) {
      map.set(item, String(key));
    },
    removeItem(index) {
      map.delete(index);
    },
    dump() {
      return map;
    },
  };
}
(test('projectLifecycle: 仅有 getMultiData 时仍能写入同步恢复备份', { concurrency: false }, async () => {
  const result = globalThis.window,
    data = globalThis.document,
    target = console.warn;
  try {
    console.warn = () => {};
    const localStorage = createMemoryLocalStorage();
    ((globalThis.window = {
      localStorage: localStorage,
      currentProjectId: 'proj-legacy',
      showToast: () => {},
    }),
      (globalThis.document = {
        getElementById(source) {
          if (source === 'projectNameText') return { textContent: '旧接口测试' };
          return null;
        },
        querySelector() {
          return null;
        },
      }));
    const next = {
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
      projectLifecycle = createProjectLifecycle({
        store: {
          subscribeSelector() {},
          getStateRaw() {
            return { nodes: {} };
          },
          updateNodeData() {},
        },
        CanvasTabManager: {
          getMultiData() {
            return next;
          },
          get _canvases() {
            return [];
          },
        },
        project: {
          resolveCanvasData(current) {
            return current;
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
        async migrateLegacyThumbnailsInMultiData(multiData) {
          return { changed: false, multiData: multiData };
        },
        sanitizeMultiCanvasDataForPersistence(entry) {
          return entry;
        },
        commit() {},
        patchStoreSourceNodeNamesFromFileName() {},
        applySourceNamesFromFileNameToCanvas() {},
      });
    (projectLifecycle.triggerLocalCacheSave(), await new Promise((record) => setTimeout(record, 0)));
    const payload = localStorage.dump().get('tapnow_v2_dreamina_resume_backup');
    assert.ok(payload);
    const handle = JSON.parse(payload);
    (assert.equal(handle.projectId, 'proj-legacy'),
      assert.equal(Array.isArray(handle.items), true),
      assert.equal(handle.items.length, 1));
  } finally {
    ((console.warn = target), (globalThis.window = result), (globalThis.document = data));
  }
}),
  test(
    'projectLifecycle: ai-image/ai-audio/source-audio RunningHub 进行中任务会写入同步恢复备份',
    { concurrency: false },
    async () => {
      const state = globalThis.window,
        config = globalThis.document,
        scope = console.warn;
      try {
        console.warn = () => {};
        const localStorage2 = createMemoryLocalStorage();
        ((globalThis.window = {
          localStorage: localStorage2,
          currentProjectId: 'proj-rh',
          showToast: () => {},
        }),
          (globalThis.document = {
            getElementById(input) {
              if (input === 'projectNameText') return { textContent: '恢复测试' };
              return null;
            },
            querySelector() {
              return null;
            },
          }));
        const output = {
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
                    rhTaskStartedAt: 333,
                  },
                  {
                    id: 'src-image-running',
                    type: 'source-image',
                    model: 'runninghub/2012862147813974018',
                    provider: 'runninghubwf',
                    rhTaskId: 'rh-src-image-1',
                    rhTaskStatus: 'pending',
                    rhTaskStartedAt: 444,
                    rhTaskUseOpenapiQuery: false,
                  },
                  {
                    id: 'src-audio-running',
                    type: 'source-audio',
                    model: 'runninghub/2047408096384917505',
                    provider: 'runninghubwf',
                    rhTaskId: 'rh-src-audio-1',
                    rhTaskStatus: 'running',
                    rhTaskStartedAt: 555,
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
          projectLifecycle2 = createProjectLifecycle({
            store: {
              subscribeSelector() {},
              getStateRaw() {
                return { nodes: {} };
              },
              updateNodeData() {},
            },
            CanvasTabManager: {
              getMultiData() {
                return output;
              },
              get _canvases() {
                return [];
              },
            },
            project: {
              resolveCanvasData(value2) {
                return value2;
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
            async migrateLegacyThumbnailsInMultiData(multiData2) {
              return { changed: false, multiData: multiData2 };
            },
            sanitizeMultiCanvasDataForPersistence(value3) {
              return value3;
            },
            commit() {},
            patchStoreSourceNodeNamesFromFileName() {},
            applySourceNamesFromFileNameToCanvas() {},
          });
        (projectLifecycle2.triggerLocalCacheSave(), await new Promise((value4) => setTimeout(value4, 0)));
        const value5 = localStorage2.dump().get('tapnow_v2_dreamina_resume_backup');
        assert.ok(value5);
        const value6 = JSON.parse(value5);
        assert.equal(value6.projectId, 'proj-rh');
        const list = Array.isArray(value6.items) ? value6.items : [];
        assert.equal(list.length, 5);
        const value7 = list.find((item2) => item2.nodeId === 'img-running'),
          value8 = list.find((item3) => item3.nodeId === 'aud-running'),
          value9 = list.find((item4) => item4.nodeId === 'src-video-running'),
          value10 = list.find((item5) => item5.nodeId === 'src-image-running'),
          value11 = list.find((item6) => item6.nodeId === 'src-audio-running');
        (assert.ok(value7),
          assert.equal(value7.kind, 'runninghub'),
          assert.equal(value7.nodeType, 'ai-image'),
          assert.equal(value7.rhTaskId, 'rh-img-1'),
          assert.ok(value8),
          assert.equal(value8.kind, 'runninghub'),
          assert.equal(value8.nodeType, 'ai-audio'),
          assert.equal(value8.rhTaskId, 'rh-aud-1'),
          assert.ok(value9),
          assert.equal(value9.kind, 'runninghub'),
          assert.equal(value9.nodeType, 'source-video'),
          assert.equal(value9.rhTaskId, 'rh-video-1'),
          assert.ok(value10),
          assert.equal(value10.kind, 'runninghub'),
          assert.equal(value10.nodeType, 'source-image'),
          assert.equal(value10.rhTaskId, 'rh-src-image-1'),
          assert.ok(value11),
          assert.equal(value11.kind, 'runninghub'),
          assert.equal(value11.nodeType, 'source-audio'),
          assert.equal(value11.rhTaskId, 'rh-src-audio-1'),
          assert.equal(
            list.some((item7) => item7.nodeId === 'img-success'),
            false,
          ));
      } finally {
        ((console.warn = scope), (globalThis.window = state), (globalThis.document = config));
      }
    },
  ),
  test(
    'projectLifecycle: Dreamina 图片与 async 进行中任务会写入同步恢复备份',
    { concurrency: false },
    async () => {
      const value12 = globalThis.window,
        value13 = globalThis.document,
        value14 = console.warn;
      try {
        console.warn = () => {};
        const localStorage3 = createMemoryLocalStorage();
        ((globalThis.window = {
          localStorage: localStorage3,
          currentProjectId: 'proj-async',
          showToast: () => {},
        }),
          (globalThis.document = {
            getElementById(value15) {
              if (value15 === 'projectNameText') return { textContent: '恢复测试2' };
              return null;
            },
            querySelector() {
              return null;
            },
          }));
        const value16 = {
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
                    dreaminaTaskStartedAt: 1001,
                  },
                  {
                    id: 'dreamina-img-error-result',
                    type: 'ai-image',
                    model: 'dreamina/4.5',
                    provider: 'dreamina',
                    dreaminaSubmitId: 'dm-submit-error',
                    dreaminaTaskStatus: 'pending',
                    dreaminaTaskPhase: 'syncing',
                    dreaminaTaskStartedAt: 1007,
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
                    asyncTaskStartedAt: 1002,
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
                    asyncTaskStartedAt: 1003,
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
                    asyncTaskStartedAt: 1004,
                  },
                  {
                    id: 'async-ppio-model-with-stale-provider',
                    type: 'ai-image',
                    model: 'ppio/seedream-4.5',
                    provider: 'grsai',
                    asyncTaskKind: 'image',
                    asyncTaskId: 'async-ppio-2',
                    asyncTaskStatus: 'running',
                    asyncTaskStartedAt: 1005,
                  },
                  {
                    id: 'async-grsai-bare-model-with-stale-provider',
                    type: 'ai-image',
                    model: 'nano-banana-pro-vt',
                    provider: 'runninghubwf',
                    asyncTaskKind: 'image',
                    asyncTaskId: 'async-grsai-1',
                    asyncTaskStatus: 'running',
                    asyncTaskStartedAt: 1006,
                  },
                ],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1.1 },
                assets: [],
              },
            ],
          },
          projectLifecycle3 = createProjectLifecycle({
            store: {
              subscribeSelector() {},
              getStateRaw() {
                return { nodes: {} };
              },
              updateNodeData() {},
            },
            CanvasTabManager: {
              getMultiData() {
                return value16;
              },
              get _canvases() {
                return [];
              },
            },
            project: {
              resolveCanvasData(value17) {
                return value17;
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
            async migrateLegacyThumbnailsInMultiData(multiData3) {
              return { changed: false, multiData: multiData3 };
            },
            sanitizeMultiCanvasDataForPersistence(value18) {
              return value18;
            },
            commit() {},
            patchStoreSourceNodeNamesFromFileName() {},
            applySourceNamesFromFileNameToCanvas() {},
          });
        (projectLifecycle3.triggerLocalCacheSave(), await new Promise((value19) => setTimeout(value19, 0)));
        const value20 = localStorage3.dump().get('tapnow_v2_dreamina_resume_backup');
        assert.ok(value20);
        const value21 = JSON.parse(value20),
          list2 = Array.isArray(value21.items) ? value21.items : [];
        assert.equal(list2.length, 6);
        const value22 = list2.find((item8) => item8.nodeId === 'dreamina-img-running'),
          value23 = list2.find((item9) => item9.nodeId === 'async-video-running'),
          value24 = list2.find((item10) => item10.nodeId === 'async-ppio-model-only'),
          value25 = list2.find((item11) => item11.nodeId === 'async-ppio-model-with-stale-provider'),
          value26 = list2.find((item12) => item12.nodeId === 'async-image-running'),
          value27 = list2.find((item13) => item13.nodeId === 'async-grsai-bare-model-with-stale-provider');
        (assert.ok(value22),
          assert.equal(value22.kind, 'dreamina'),
          assert.equal(value22.dreaminaSubmitId, 'dm-submit-1'),
          assert.ok(value23),
          assert.equal(value23.kind, 'async'),
          assert.equal(value23.asyncTaskProvider, 'apimart'),
          assert.equal(value23.asyncTaskKind, 'video'),
          assert.equal(value23.asyncTaskId, 'async-video-1'),
          assert.ok(value24),
          assert.equal(value24.kind, 'async'),
          assert.equal(value24.asyncTaskProvider, 'ppio'),
          assert.equal(value24.asyncTaskKind, 'image'),
          assert.equal(value24.asyncTaskId, 'async-ppio-1'),
          assert.ok(value25),
          assert.equal(value25.kind, 'async'),
          assert.equal(value25.asyncTaskProvider, 'ppio'),
          assert.equal(value25.asyncTaskKind, 'image'),
          assert.equal(value25.asyncTaskId, 'async-ppio-2'),
          assert.ok(value26),
          assert.equal(value26.kind, 'async'),
          assert.equal(value26.asyncTaskProvider, 'grsai'),
          assert.equal(value26.asyncTaskKind, 'image'),
          assert.equal(value26.asyncTaskId, 'async-image-1'),
          assert.ok(value27),
          assert.equal(value27.kind, 'async'),
          assert.equal(value27.asyncTaskProvider, 'grsai'),
          assert.equal(value27.asyncTaskKind, 'image'),
          assert.equal(value27.asyncTaskId, 'async-grsai-1'),
          assert.equal(
            list2.some((item14) => item14.nodeId === 'async-success'),
            false,
          ),
          assert.equal(
            list2.some((item15) => item15.nodeId === 'dreamina-img-error-result'),
            false,
          ));
      } finally {
        ((console.warn = value14), (globalThis.window = value12), (globalThis.document = value13));
      }
    },
  ));
