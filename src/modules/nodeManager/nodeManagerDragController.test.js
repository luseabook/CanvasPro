import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenToWorld } from '../../core/math.js';
import { NODE_MANAGER_DRAG_MIME } from './nodeManagerDragContract.js';
import {
  resolveNodeManagerDuplicateOffset,
  createNodeManagerDragController,
} from './nodeManagerDragController.js';

const STAGE_RECT = { left: 0, top: 0, right: 1000, bottom: 800 };

function createEmitter() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, fn) {
      const list = listeners.get(type) || [];
      list.push(fn);
      listeners.set(type, list);
    },
    removeEventListener(type, fn) {
      const list = listeners.get(type) || [],
        index = list.indexOf(fn);
      if (index >= 0) list.splice(index, 1);
    },
    emit(type, event) {
      for (const fn of [...(listeners.get(type) || [])]) fn(event);
    },
  };
}

function makeDropEvent({
  x = 0,
  y = 0,
  data = null,
  closest = null,
  types = [],
  withDataTransfer = true,
} = {}) {
  const event = {
    clientX: x,
    clientY: y,
    prevented: false,
    stopped: false,
    target: { closest: () => closest },
    preventDefault() {
      event.prevented = true;
    },
    stopPropagation() {
      event.stopped = true;
    },
  };
  if (withDataTransfer) {
    event.dataTransfer = {
      types,
      dropEffect: '',
      effectAllowed: '',
      getData: () => data,
      setData: (...args) => {
        event.written = args;
      },
    };
  }
  return event;
}

function makeHarness({ commandResult = { ok: true, result: { ids: ['dup-1'] } }, state } = {}) {
  const wrap = createEmitter(),
    calls = [],
    duplicated = [],
    failed = [];
  const graphStore = {
      getStateRaw: () =>
        state || {
          nodes: { n1: { id: 'n1', x: 100, y: 50, width: 200, height: 100 } },
          viewport: { x: 0, y: 0, zoom: 1 },
        },
    },
    canvasStage = { getBoundingClientRect: () => STAGE_RECT },
    controller = createNodeManagerDragController({
      graphStore,
      wrap,
      canvasStage,
      executeCanvasCommand: (...args) => {
        calls.push(args);
        return commandResult;
      },
      onDuplicated: (id) => duplicated.push(id),
      onDuplicateFailed: (result) => failed.push(result),
    });
  return { wrap, calls, duplicated, failed, controller };
}

test('nodeManagerDragController: duplicate 偏移量按目标中心对齐到世界坐标', () => {
  const offset = resolveNodeManagerDuplicateOffset({
      source: { x: 100, y: 50, width: 200, height: 100 },
      clientX: 500,
      clientY: 300,
      viewport: { x: 0, y: 0, zoom: 2 },
    }),
    world = screenToWorld(500, 300, { x: 0, y: 0, zoom: 2 });
  (assert.equal(offset.dx, world.x - 200),
    assert.equal(offset.dy, world.y - 100),
    assert.equal(offset.dx, 50),
    assert.equal(offset.dy, 50));
});

test('nodeManagerDragController: 缺少尺寸字段时以左上角为中心', () => {
  const offset = resolveNodeManagerDuplicateOffset({
    source: { x: 10, y: 20 },
    clientX: 110,
    clientY: 220,
    viewport: { x: 10, y: 20, zoom: 1 },
  });
  (assert.equal(offset.dx, 90), assert.equal(offset.dy, 180));
});

test('nodeManagerDragController: 拖放命中触发 node.duplicate 并回调新节点', () => {
  const { wrap, calls, duplicated, failed } = makeHarness(),
    event = makeDropEvent({ x: 400, y: 300, data: 'n1' });
  wrap.emit('drop', event);
  (assert.equal(calls.length, 1),
    assert.equal(calls[0][0], 'node.duplicate'),
    assert.deepEqual(calls[0][1], { ids: ['n1'], dx: 200, dy: 200, edgePolicy: 'all-touching' }),
    assert.deepEqual(duplicated, ['dup-1']),
    assert.deepEqual(failed, []),
    assert.equal(event.prevented, true),
    assert.equal(event.stopped, true));
});

test('nodeManagerDragController: 命令失败时走 onDuplicateFailed', () => {
  const { wrap, duplicated, failed } = makeHarness({ commandResult: { ok: false, error: 'boom' } });
  wrap.emit('drop', makeDropEvent({ x: 400, y: 300, data: 'n1' }));
  (assert.deepEqual(duplicated, []), assert.equal(failed.length, 1), assert.equal(failed[0].error, 'boom'));
});

test('nodeManagerDragController: 阻断区内的拖放被忽略', () => {
  const { wrap, calls } = makeHarness(),
    event = makeDropEvent({ x: 400, y: 300, data: 'n1', closest: {} });
  wrap.emit('drop', event);
  (assert.deepEqual(calls, []), assert.equal(event.prevented, false));
});

test('nodeManagerDragController: 画布外的拖放被忽略', () => {
  const { wrap, calls } = makeHarness(),
    event = makeDropEvent({ x: 2000, y: 300, data: 'n1' });
  wrap.emit('drop', event);
  (assert.deepEqual(calls, []), assert.equal(event.prevented, false));
});

test('nodeManagerDragController: 未知节点 id 不发起命令', () => {
  const { wrap, calls } = makeHarness();
  wrap.emit('drop', makeDropEvent({ x: 400, y: 300, data: 'missing' }));
  assert.deepEqual(calls, []);
});

test('nodeManagerDragController: 无标识的拖放不发起命令', () => {
  const { wrap, calls } = makeHarness();
  wrap.emit('drop', makeDropEvent({ x: 400, y: 300, data: '' }));
  assert.deepEqual(calls, []);
});

test('nodeManagerDragController: dragover 命中时阻止默认并设置 copy', () => {
  const { wrap } = makeHarness(),
    event = makeDropEvent({ x: 400, y: 300, types: [NODE_MANAGER_DRAG_MIME] });
  wrap.emit('dragover', event);
  (assert.equal(event.prevented, true), assert.equal(event.dataTransfer.dropEffect, 'copy'));
});

test('nodeManagerDragController: dragover 在阻断区或画布外不响应', () => {
  const { wrap } = makeHarness(),
    blocked = makeDropEvent({ x: 400, y: 300, types: [NODE_MANAGER_DRAG_MIME], closest: {} }),
    outside = makeDropEvent({ x: 4000, y: 300, types: [NODE_MANAGER_DRAG_MIME] });
  (wrap.emit('dragover', blocked),
    wrap.emit('dragover', outside),
    assert.equal(blocked.prevented, false),
    assert.equal(outside.prevented, false));
});

test('nodeManagerDragController: dragover 缺少节点管理器拖拽类型时忽略', () => {
  const { wrap } = makeHarness(),
    event = makeDropEvent({ x: 400, y: 300, types: ['text/plain'] });
  wrap.emit('dragover', event);
  assert.equal(event.prevented, false);
});

test('nodeManagerDragController: bindNodeRow 装配 dragstart/dragend 行状态', () => {
  const { wrap, calls, controller } = makeHarness(),
    trigger = createEmitter(),
    classes = [],
    row = {
      classList: {
        add: (name) => classes.push(['add', name]),
        remove: (name) => classes.push(['remove', name]),
      },
    };
  controller.bindNodeRow({ trigger, row, nodeId: 'n1' });
  (assert.equal(trigger.draggable, true),
    assert.equal(trigger.listeners.get('dragstart').length, 1),
    assert.equal(trigger.listeners.get('dragend').length, 1));
  const startEvent = makeDropEvent();
  trigger.emit('dragstart', startEvent);
  (assert.deepEqual(startEvent.written, [NODE_MANAGER_DRAG_MIME, 'n1']),
    assert.equal(startEvent.dataTransfer.effectAllowed, 'copy'),
    assert.deepEqual(classes[0], ['add', 'is-dragging']));
  trigger.emit('dragend', makeDropEvent());
  assert.deepEqual(classes[1], ['remove', 'is-dragging']);
  wrap.emit('drop', makeDropEvent({ x: 400, y: 300, data: '' }));
  assert.deepEqual(calls, []);
});

test('nodeManagerDragController: 缺少 dataTransfer 载荷时回退内部拖拽 id', () => {
  const wrap = createEmitter(),
    calls = [],
    controller = createNodeManagerDragController({
      graphStore: {
        getStateRaw: () => ({
          nodes: { n1: { id: 'n1', x: 0, y: 0, width: 100, height: 100 } },
          viewport: { x: 0, y: 0, zoom: 1 },
        }),
      },
      wrap,
      canvasStage: { getBoundingClientRect: () => STAGE_RECT },
      executeCanvasCommand: (...args) => {
        calls.push(args);
        return { ok: true, result: { ids: [] } };
      },
    }),
    trigger = createEmitter();
  controller.bindNodeRow({ trigger, row: { classList: { add() {}, remove() {} } }, nodeId: 'n1' });
  trigger.emit('dragstart', makeDropEvent());
  wrap.emit('drop', makeDropEvent({ x: 50, y: 50, data: null }));
  (assert.equal(calls.length, 1), assert.deepEqual(calls[0][1].ids, ['n1']));
});

test('nodeManagerDragController: 缺少画布容器时不响应拖放', () => {
  const wrap = createEmitter(),
    calls = [],
    controller = createNodeManagerDragController({
      graphStore: {
        getStateRaw: () => ({ nodes: { n1: { id: 'n1' } }, viewport: { x: 0, y: 0, zoom: 1 } }),
      },
      wrap,
      canvasStage: null,
      executeCanvasCommand: (...args) => {
        calls.push(args);
        return { ok: true };
      },
    });
  (wrap.emit('drop', makeDropEvent({ x: 10, y: 10, data: 'n1' })), assert.deepEqual(calls, []));
  assert.equal(typeof controller.bindNodeRow, 'function');
});

test('nodeManagerDragController: bindNodeRow 缺少触发器时安全返回', () => {
  const { controller } = makeHarness();
  assert.equal(controller.bindNodeRow({}), undefined);
  assert.equal(controller.bindNodeRow(), undefined);
});

test('nodeManagerDragController: destroy 解绑事件且清空拖拽态', () => {
  const { wrap, calls, controller } = makeHarness();
  controller.destroy();
  (wrap.emit('drop', makeDropEvent({ x: 400, y: 300, data: 'n1' })),
    wrap.emit('dragover', makeDropEvent({ x: 400, y: 300, types: [NODE_MANAGER_DRAG_MIME] })),
    assert.deepEqual(calls, []),
    assert.equal(wrap.listeners.get('drop').length, 0),
    assert.equal(wrap.listeners.get('dragover').length, 0));
});
