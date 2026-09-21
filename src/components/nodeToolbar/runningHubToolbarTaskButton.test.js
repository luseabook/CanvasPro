import test from 'node:test';
import assert from 'node:assert/strict';
import appStore from '../../core/stores/appStore.js';
import {
  bindRunningHubToolbarTaskButton,
  findRunningHubToolbarTaskForNode,
  isRunningHubToolbarTaskCancelled,
  isRunningHubToolbarTaskNode,
} from './runningHubToolbarTaskButton.js';
function installDomStubs() {
  if (!globalThis.window) globalThis.window = {};
  (typeof globalThis.window.addEventListener !== 'function' &&
    (globalThis.window.addEventListener = () => {}),
    typeof globalThis.window.removeEventListener !== 'function' &&
      (globalThis.window.removeEventListener = () => {}),
    typeof globalThis.CustomEvent !== 'function' &&
      (globalThis.CustomEvent = class _0x38a3e8 {
        constructor(_0x5685d1, _0x5a95f6 = {}) {
          ((this.type = _0x5685d1), (this.detail = _0x5a95f6.detail));
        }
      }));
}
function resetStore(_0x141894 = {}) {
  appStore.loadState({ nodes: _0x141894, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
}
function createClassList() {
  const _0x48c0f5 = new Set();
  return {
    add: (..._0x599a08) => _0x599a08.forEach((_0x1d608a) => _0x48c0f5.add(_0x1d608a)),
    remove: (..._0x489a23) => _0x489a23.forEach((_0x1ebcde) => _0x48c0f5.delete(_0x1ebcde)),
    contains: (_0x3dbc79) => _0x48c0f5.has(_0x3dbc79),
    toggle(_0x2332e2, _0x2eac26) {
      const _0x12337b = _0x2eac26 === undefined ? !_0x48c0f5.has(_0x2332e2) : !!_0x2eac26;
      if (_0x12337b) _0x48c0f5.add(_0x2332e2);
      else _0x48c0f5.delete(_0x2332e2);
      return _0x12337b;
    },
  };
}
function createButton() {
  const _0x1e12f4 = new Map([['aria-label', '高清']]),
    _0x207078 = new Map();
  return {
    innerHTML: '<svg data-original></svg>',
    style: { color: '' },
    dataset: { tooltip: '高清' },
    title: '',
    classList: createClassList(),
    addEventListener(_0x24db99, _0x5c5a92) {
      _0x207078.set(_0x24db99, _0x5c5a92);
    },
    removeEventListener(_0x3e4dd8) {
      _0x207078.delete(_0x3e4dd8);
    },
    getAttribute(_0x3e7607) {
      return _0x1e12f4.get(_0x3e7607) || '';
    },
    setAttribute(_0xd69236, _0x41905c) {
      _0x1e12f4.set(_0xd69236, String(_0x41905c));
    },
    removeAttribute(_0xebe0d6) {
      _0x1e12f4.delete(_0xebe0d6);
    },
    dispatch(_0x3ac402) {
      _0x207078.get(_0x3ac402)?.({
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() {},
      });
    },
  };
}
(test.beforeEach(() => {
  (installDomStubs(), resetStore());
}),
  test.afterEach(() => {
    resetStore();
  }),
  test('RunningHub toolbar task button only matches related running result nodes', () => {
    resetStore({
      sourceA: { id: 'sourceA', type: 'source-image' },
      sourceB: { id: 'sourceB', type: 'source-image' },
      outA: {
        id: 'outA',
        type: 'source-image',
        provider: 'runninghubwf',
        model: 'runninghub/2012862147813974018',
        rhSourceNodeId: 'sourceA',
        rhTaskId: 'task-a',
        rhTaskStatus: 'running',
        outputText: '模型: RH高清放大',
        isGenerating: true,
      },
    });
    const _0x43411e = findRunningHubToolbarTaskForNode('sourceA', {
        models: ['runninghub/2012862147813974018'],
        outputTextIncludes: ['RH高清放大'],
      }),
      _0x1b9e37 = findRunningHubToolbarTaskForNode('sourceB', {
        models: ['runninghub/2012862147813974018'],
        outputTextIncludes: ['RH高清放大'],
      });
    (assert.equal(_0x43411e.outId, 'outA'),
      assert.equal(_0x43411e.taskId, 'task-a'),
      assert.equal(_0x1b9e37, null));
  }),
  test('RunningHub toolbar task button reads active state through unified selector', () => {
    (assert.equal(
      isRunningHubToolbarTaskNode({
        id: 'dreamina-active',
        provider: 'dreamina',
        model: 'dreamina/video',
        isGenerating: true,
        jobStatus: 'running',
      }),
      false,
    ),
      assert.equal(
        isRunningHubToolbarTaskNode({
          id: 'rh-recovering',
          provider: 'runninghubwf',
          rhTaskId: 'rh-task',
          rhTaskStatus: 'pending',
          rhTaskRecovering: true,
        }),
        true,
      ),
      assert.equal(
        isRunningHubToolbarTaskNode({
          id: 'rh-manifest-model-only',
          model: 'runninghub-model/rhart-image-v1',
          rhTaskStatus: 'running',
          isGenerating: true,
        }),
        true,
      ),
      resetStore({
        dreaminaCancelled: { id: 'dreaminaCancelled', provider: 'dreamina', jobStatus: 'cancelled' },
        rhCancelled: { id: 'rhCancelled', provider: 'runninghubwf', rhTaskStatus: 'cancelled' },
      }),
      assert.equal(isRunningHubToolbarTaskCancelled('dreaminaCancelled'), false),
      assert.equal(isRunningHubToolbarTaskCancelled('rhCancelled'), true));
  }),
  test('RunningHub toolbar task button flips to cancel state and cancels current task', () => {
    resetStore({
      sourceA: { id: 'sourceA', type: 'source-video' },
      outA: {
        id: 'outA',
        type: 'source-video',
        provider: 'runninghubwf',
        model: 'runninghub/2047784060881211393',
        rhSourceNodeId: 'sourceA',
        rhTaskId: 'task-a',
        rhTaskStatus: 'running',
        outputText: '模型: RH视频补帧',
        isGenerating: true,
      },
    });
    const _0x54c1de = createButton();
    let _0x5f2ad3 = null;
    (bindRunningHubToolbarTaskButton({
      button: _0x54c1de,
      getTask: () =>
        findRunningHubToolbarTaskForNode('sourceA', {
          models: ['runninghub/2047784060881211393'],
          outputTextIncludes: ['RH视频补帧'],
        }),
      cancelTask: (_0x5e1929) => {
        _0x5f2ad3 = _0x5e1929;
      },
      cancelTooltip: '取消补帧',
    }),
      assert.equal(_0x54c1de.classList.contains('is-task-cancel'), true),
      assert.match(_0x54c1de.innerHTML, /v2-task-cancel-spin/),
      assert.equal(_0x54c1de.dataset.tooltip, '取消补帧'),
      _0x54c1de.dispatch('click'),
      assert.equal(_0x5f2ad3.outId, 'outA'));
  }),
  test('RunningHub toolbar task button restores inline color after cancellation', async () => {
    resetStore({
      sourceA: { id: 'sourceA', type: 'source-video' },
      outA: {
        id: 'outA',
        type: 'source-video',
        provider: 'runninghubwf',
        model: 'runninghub/2047784060881211393',
        rhSourceNodeId: 'sourceA',
        rhToolbarTaskType: 'video-frame',
        rhTaskId: 'task-a',
        rhTaskStatus: 'running',
        isGenerating: true,
      },
    });
    const _0x57bed1 = createButton();
    (bindRunningHubToolbarTaskButton({
      button: _0x57bed1,
      getTask: () =>
        findRunningHubToolbarTaskForNode('sourceA', {
          models: ['runninghub/2047784060881211393'],
          taskTypes: ['video-frame'],
        }),
      cancelTask: (_0x5ba5e1) => {
        ((_0x57bed1.style.color = 'var(--red)'),
          appStore.updateNodeData(_0x5ba5e1.outId, { isGenerating: false, rhTaskStatus: 'cancelled' }));
      },
      cancelTooltip: '取消补帧',
    }),
      _0x57bed1.dispatch('click'),
      await new Promise((_0xefce44) => setTimeout(_0xefce44, 0)),
      assert.equal(_0x57bed1.classList.contains('is-task-cancel'), false),
      assert.equal(_0x57bed1.style.color, ''),
      assert.match(_0x57bed1.innerHTML, /data-original/));
  }),
  test('RunningHub toolbar task button matches stable task type from source and result nodes', () => {
    resetStore({
      imageSource: { id: 'imageSource', type: 'source-image' },
      panoramaOut: {
        id: 'panoramaOut',
        type: 'source-image',
        provider: 'runninghubwf',
        model: 'runninghub/2044874075721441281',
        rhSourceNodeId: 'imageSource',
        rhToolbarTaskType: 'image-panorama-360',
        rhTaskId: 'pano-task',
        rhTaskStatus: 'pending',
        outputText: '模型: RH',
        isGenerating: true,
      },
    });
    for (const _0x2e7167 of ['imageSource', 'panoramaOut']) {
      const _0x16ed6a = findRunningHubToolbarTaskForNode(_0x2e7167, {
        models: ['runninghub/2044874075721441281'],
        taskTypes: ['image-panorama-360'],
        outputTextIncludes: ['360°全景图'],
      });
      (assert.equal(_0x16ed6a.outId, 'panoramaOut'), assert.equal(_0x16ed6a.taskId, 'pano-task'));
    }
  }),
  test('RunningHub toolbar task button covers all source-toolbar RH task types', () => {
    const _0x4f6e09 = [
        {
          sourceId: 'img-subject-src',
          outId: 'img-subject-out',
          model: 'runninghub/2042329021530247170',
          taskType: 'image-auto-subject',
        },
        {
          sourceId: 'img-hd-src',
          outId: 'img-hd-out',
          model: 'runninghub/2012862147813974018',
          taskType: 'image-hd',
        },
        {
          sourceId: 'img-expand-src',
          outId: 'img-expand-out',
          model: 'runninghub-model/rhart-image-v1',
          taskType: 'image-expand',
        },
        {
          sourceId: 'img-repaint-src',
          outId: 'img-repaint-out',
          model: 'runninghub-model/rhart-image-v1',
          taskType: 'image-repaint',
        },
        {
          sourceId: 'img-erase-src',
          outId: 'img-erase-out',
          model: 'runninghub-model/rhart-image-v1',
          taskType: 'image-erase',
        },
        {
          sourceId: 'img-free-angle-src',
          outId: 'img-free-angle-out',
          model: 'runninghub-model/rhart-image-v1',
          taskType: 'image-free-angle',
        },
        {
          sourceId: 'video-frame-src',
          outId: 'video-frame-out',
          model: 'runninghub/2047784060881211393',
          taskType: 'video-frame',
        },
        {
          sourceId: 'video-hd-src',
          outId: 'video-hd-out',
          model: 'runninghub/2047787809091620866',
          taskType: 'video-hd',
        },
      ],
      _0x3c7097 = {};
    (_0x4f6e09.forEach((_0x53a2a7) => {
      ((_0x3c7097[_0x53a2a7.sourceId] = { id: _0x53a2a7.sourceId, type: 'source-image' }),
        (_0x3c7097[_0x53a2a7.outId] = {
          id: _0x53a2a7.outId,
          type: 'source-image',
          provider: 'runninghubwf',
          model: _0x53a2a7.model,
          rhSourceNodeId: _0x53a2a7.sourceId,
          rhToolbarTaskType: _0x53a2a7.taskType,
          rhTaskId: _0x53a2a7.taskType + '-task',
          rhTaskStatus: 'running',
          isGenerating: true,
        }));
    }),
      resetStore(_0x3c7097),
      _0x4f6e09.forEach((_0x9ad49c) => {
        for (const _0x3169ed of [_0x9ad49c.sourceId, _0x9ad49c.outId]) {
          const _0x5e2a6c = findRunningHubToolbarTaskForNode(_0x3169ed, {
            models: [_0x9ad49c.model],
            taskTypes: [_0x9ad49c.taskType],
          });
          assert.equal(_0x5e2a6c.outId, _0x9ad49c.outId, _0x9ad49c.taskType + ':' + _0x3169ed);
        }
      }));
  }));
