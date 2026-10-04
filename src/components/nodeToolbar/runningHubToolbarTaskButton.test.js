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
      (globalThis.CustomEvent = class value {
        constructor(item, key = {}) {
          ((this.type = item), (this.detail = key.detail));
        }
      }));
}
function resetStore(nodes = {}) {
  appStore.loadState({ nodes: nodes, edges: {}, viewport: { x: 0, y: 0, zoom: 1 } });
}
function createClassList() {
  const map = new Set();
  return {
    add: (...list) => list.forEach((item2) => map.add(item2)),
    remove: (...list2) => list2.forEach((item3) => map.delete(item3)),
    contains: (index) => map.has(index),
    toggle(result, enabled) {
      const data = enabled === undefined ? !map.has(result) : !!enabled;
      if (data) map.add(result);
      else map.delete(result);
      return data;
    },
  };
}
function createButton() {
  const map2 = new Map([['aria-label', '高清']]),
    map3 = new Map();
  return {
    innerHTML: '<svg data-original></svg>',
    style: { color: '' },
    dataset: { tooltip: '高清' },
    title: '',
    classList: createClassList(),
    addEventListener(options, target) {
      map3.set(options, target);
    },
    removeEventListener(source) {
      map3.delete(source);
    },
    getAttribute(next) {
      return map2.get(next) || '';
    },
    setAttribute(current, entry) {
      map2.set(current, String(entry));
    },
    removeAttribute(record) {
      map2.delete(record);
    },
    dispatch(payload) {
      map3.get(payload)?.({
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
    const runningHubToolbarTaskForNode = findRunningHubToolbarTaskForNode('sourceA', {
        models: ['runninghub/2012862147813974018'],
        outputTextIncludes: ['RH高清放大'],
      }),
      runningHubToolbarTaskForNode2 = findRunningHubToolbarTaskForNode('sourceB', {
        models: ['runninghub/2012862147813974018'],
        outputTextIncludes: ['RH高清放大'],
      });
    (assert.equal(runningHubToolbarTaskForNode.outId, 'outA'),
      assert.equal(runningHubToolbarTaskForNode.taskId, 'task-a'),
      assert.equal(runningHubToolbarTaskForNode2, null));
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
    const button = createButton();
    let handle = null;
    (bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () =>
        findRunningHubToolbarTaskForNode('sourceA', {
          models: ['runninghub/2047784060881211393'],
          outputTextIncludes: ['RH视频补帧'],
        }),
      cancelTask: (state) => {
        handle = state;
      },
      cancelTooltip: '取消补帧',
    }),
      assert.equal(button.classList.contains('is-task-cancel'), true),
      assert.match(button.innerHTML, /v2-task-cancel-spin/),
      assert.equal(button.dataset.tooltip, '取消补帧'),
      button.dispatch('click'),
      assert.equal(handle.outId, 'outA'));
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
    const button2 = createButton();
    (bindRunningHubToolbarTaskButton({
      button: button2,
      getTask: () =>
        findRunningHubToolbarTaskForNode('sourceA', {
          models: ['runninghub/2047784060881211393'],
          taskTypes: ['video-frame'],
        }),
      cancelTask: (config) => {
        ((button2.style.color = 'var(--red)'),
          appStore.updateNodeData(config.outId, { isGenerating: false, rhTaskStatus: 'cancelled' }));
      },
      cancelTooltip: '取消补帧',
    }),
      button2.dispatch('click'),
      await new Promise((scope) => setTimeout(scope, 0)),
      assert.equal(button2.classList.contains('is-task-cancel'), false),
      assert.equal(button2.style.color, ''),
      assert.match(button2.innerHTML, /data-original/));
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
    for (const input of ['imageSource', 'panoramaOut']) {
      const runningHubToolbarTaskForNode3 = findRunningHubToolbarTaskForNode(input, {
        models: ['runninghub/2044874075721441281'],
        taskTypes: ['image-panorama-360'],
        outputTextIncludes: ['360°全景图'],
      });
      (assert.equal(runningHubToolbarTaskForNode3.outId, 'panoramaOut'),
        assert.equal(runningHubToolbarTaskForNode3.taskId, 'pano-task'));
    }
  }),
  test('RunningHub toolbar task button covers all source-toolbar RH task types', () => {
    const list3 = [
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
      output = {};
    (list3.forEach((id) => {
      ((output[id.sourceId] = { id: id.sourceId, type: 'source-image' }),
        (output[id.outId] = {
          id: id.outId,
          type: 'source-image',
          provider: 'runninghubwf',
          model: id.model,
          rhSourceNodeId: id.sourceId,
          rhToolbarTaskType: id.taskType,
          rhTaskId: id.taskType + '-task',
          rhTaskStatus: 'running',
          isGenerating: true,
        }));
    }),
      resetStore(output),
      list3.forEach((item4) => {
        for (const value2 of [item4.sourceId, item4.outId]) {
          const runningHubToolbarTaskForNode4 = findRunningHubToolbarTaskForNode(value2, {
            models: [item4.model],
            taskTypes: [item4.taskType],
          });
          assert.equal(runningHubToolbarTaskForNode4.outId, item4.outId, item4.taskType + ':' + value2);
        }
      }));
  }));
