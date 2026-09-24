import assert from 'node:assert/strict';
import test from 'node:test';

import { DirectorNumericDrag } from './directorNumericDrag.js';

const windowRecord = () => {
  const listeners = new Map();
  const aborted = [];
  class FakeAbortController {
    constructor() {
      this.signal = { aborted: false };
    }
    abort() {
      this.signal.aborted = true;
      aborted.push(this.signal);
      for (const [type, entries] of listeners) {
        listeners.set(
          type,
          entries.filter((entry) => entry.signal !== this.signal),
        );
      }
    }
  }
  class FakeEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.bubbles = init.bubbles === true;
    }
  }
  return {
    aborted,
    listeners,
    AbortController: FakeAbortController,
    Event: FakeEvent,
    addEventListener: (type, fn, options = {}) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ fn, signal: options.signal });
    },
    has: (type) => (listeners.get(type) || []).length > 0,
    emit: (type, event) => {
      for (const entry of listeners.get(type) || []) entry.fn(event);
    },
  };
};

const rootRecord = () => {
  const added = [];
  const removed = [];
  return {
    added,
    removed,
    addEventListener: (type, fn, capture) => added.push({ type, capture }),
    removeEventListener: (type, fn, capture) => removed.push({ type, capture }),
  };
};

const makeInput = ({
  value = '10',
  step = '0.5',
  min = null,
  max = null,
  hasMin = min !== null,
  hasMax = max !== null,
  disabled = false,
} = {}) => {
  const input = {
    value,
    step,
    disabled,
    isConnected: true,
    min: min === null ? undefined : String(min),
    max: max === null ? undefined : String(max),
    hasMin,
    hasMax,
    events: [],
    hasAttribute: (name) => (name === 'min' ? hasMin : name === 'max' ? hasMax : false),
    dispatchEvent: (event) => {
      input.events.push(event);
      return true;
    },
  };
  return input;
};

const harness = ({
  input = makeInput(),
  withLabel = true,
  blockTarget = false,
  button = 0,
  pointerId = 7,
  clientX = 100,
} = {}) => {
  const win = windowRecord();
  if (input) input.ownerDocument = { defaultView: win };
  const label = { querySelector: (sel) => (sel === 'input[type="number"]' ? input : null) };
  const target = {
    closest: (sel) => {
      if (sel === '[data-storyboard-3d-shot-timeline] label') return withLabel ? label : null;
      if (sel === 'input,select,button') return blockTarget ? { tag: 'input' } : null;
      return null;
    },
  };
  return {
    win,
    input,
    drag: new DirectorNumericDrag({ id: 'timeline' }),
    down: { target, button, pointerId, clientX },
  };
};

const move = ({ pointerId = 7, clientX, shiftKey = false } = {}) => ({
  pointerId,
  clientX,
  shiftKey,
  prevented: 0,
  preventDefault() {
    this.prevented += 1;
  },
});

test('数值拖拽：构造并绑定根节点，重复绑定同一根不回跳', () => {
  const timeline = { id: 'tl' };
  const drag = new DirectorNumericDrag(timeline);
  assert.equal(drag.timeline, timeline);
  assert.equal(typeof drag.onDown, 'function');
  assert.equal(drag.root, undefined);

  const root = rootRecord();
  drag.bind(root);
  assert.equal(drag.root, root);
  assert.deepEqual(root.added, [{ type: 'pointerdown', capture: true }]);

  drag.bind(root);
  assert.deepEqual(root.added, [{ type: 'pointerdown', capture: true }]);
  assert.deepEqual(root.removed, []);

  const other = rootRecord();
  drag.bind(other);
  assert.equal(drag.root, other);
  assert.deepEqual(root.removed, [{ type: 'pointerdown', capture: true }]);
  assert.deepEqual(other.added, [{ type: 'pointerdown', capture: true }]);

  const fresh = new DirectorNumericDrag({});
  fresh.bind(undefined);
  assert.equal(fresh.root, undefined);
});

test('数值拖拽：按下守卫不通过时不注册全局监听', () => {
  const scenarios = {
    非左键: harness({ button: 1 }),
    无标签祖先: harness({ withLabel: false }),
    标签内无数字输入: harness({ input: null }),
    输入被禁用: harness({ input: makeInput({ disabled: true }) }),
    落点在输入控件上: harness({ blockTarget: true }),
    当前值不是数字: harness({ input: makeInput({ value: 'abc' }) }),
  };
  for (const [name, scene] of Object.entries(scenarios)) {
    scene.drag.down(scene.down);
    assert.equal(scene.win.has('pointermove'), false, name);
    assert.equal(scene.win.has('pointerup'), false, name);
    assert.equal(scene.win.has('pointercancel'), false, name);
    assert.equal(typeof scene.drag.cancel, 'undefined', name);
  }
});

test('数值拖拽：按下成功后注册全局指针监听并持有取消句柄', () => {
  const scene = harness();
  scene.drag.down(scene.down);
  assert.equal(scene.win.has('pointermove'), true);
  assert.equal(scene.win.has('pointerup'), true);
  assert.equal(scene.win.has('pointercancel'), true);
  assert.equal(typeof scene.drag.cancel, 'function');
  assert.equal(scene.win.listeners.get('pointermove')[0].signal.aborted, false);
});

test('数值拖拽：移动阈值、步进与 shift 加速', () => {
  const scene = harness({ input: makeInput({ value: '10', step: '0.5' }) });
  scene.drag.down(scene.down);

  const under = move({ clientX: 103 });
  scene.win.emit('pointermove', under);
  assert.equal(under.prevented, 0);
  assert.equal(scene.input.value, '10');

  const crossed = move({ clientX: 104 });
  scene.win.emit('pointermove', crossed);
  assert.equal(crossed.prevented, 1);
  assert.equal(scene.input.value, '10.5');

  const backwards = move({ clientX: 102 });
  scene.win.emit('pointermove', backwards);
  assert.equal(backwards.prevented, 1);
  assert.equal(scene.input.value, '10.5');

  const fast = move({ clientX: 140, shiftKey: true });
  scene.win.emit('pointermove', fast);
  assert.equal(scene.input.value, '11');
});

test('数值拖拽：忽略其它指针的移动事件', () => {
  const scene = harness({ input: makeInput({ value: '10', step: '1' }) });
  scene.drag.down(scene.down);
  scene.win.emit('pointermove', move({ pointerId: 9, clientX: 200 }));
  assert.equal(scene.input.value, '10');
  scene.win.emit('pointermove', move({ pointerId: 7, clientX: 108 }));
  assert.equal(scene.input.value, '12');
});

test('数值拖拽：按 min/max 属性夹取取值', () => {
  const clamped = harness({ input: makeInput({ value: '10', step: '0.5', min: 8, max: 11 }) });
  clamped.drag.down(clamped.down);
  clamped.win.emit('pointermove', move({ clientX: 200 }));
  assert.equal(clamped.input.value, '11');
  clamped.win.emit('pointermove', move({ clientX: 0 }));
  assert.equal(clamped.input.value, '8');

  const unclamped = harness({ input: makeInput({ value: '10', min: 5, hasMin: false }) });
  unclamped.drag.down(unclamped.down);
  unclamped.win.emit('pointermove', move({ clientX: 0 }));
  assert.equal(unclamped.input.value, '-2.5');
});

test('数值拖拽：取值按 toFixed(6) 收敛浮点误差', () => {
  const scene = harness({ input: makeInput({ value: '0.1', step: '0.2' }) });
  scene.drag.down(scene.down);
  scene.win.emit('pointermove', move({ clientX: 104 }));
  assert.equal(scene.input.value, '0.3');
});

test('数值拖拽：抬起时仅在发生位移且取值变化时派发冒泡 change', () => {
  const scene = harness({ input: makeInput({ value: '10', step: '0.5' }) });
  scene.drag.down(scene.down);
  scene.win.emit('pointerup', { pointerId: 7 });
  assert.deepEqual(scene.input.events, []);
  assert.equal(scene.drag.cancel, null);

  scene.drag.down(scene.down);
  scene.win.emit('pointermove', move({ clientX: 140 }));
  assert.equal(scene.input.value, '15');
  scene.win.emit('pointerup', { pointerId: 9 });
  assert.deepEqual(scene.input.events, []);
  scene.win.emit('pointerup', { pointerId: 7 });
  assert.equal(scene.input.events.length, 1);
  assert.equal(scene.input.events[0].type, 'change');
  assert.equal(scene.input.events[0].bubbles, true);
  assert.equal(scene.drag.cancel, null);
  assert.equal(scene.win.has('pointermove'), false);
});

test('数值拖拽：有位移但取值未变时不派发 change', () => {
  const scene = harness({ input: makeInput({ value: '10', min: 10, max: 10 }) });
  scene.drag.down(scene.down);
  scene.win.emit('pointermove', move({ clientX: 200 }));
  assert.equal(scene.input.value, '10');
  scene.win.emit('pointerup', { pointerId: 7 });
  assert.deepEqual(scene.input.events, []);
});

test('数值拖拽：取消恢复按下时的原值并解除监听', () => {
  const scene = harness({ input: makeInput({ value: '10', step: '1' }) });
  scene.drag.down(scene.down);
  scene.win.emit('pointermove', move({ clientX: 120 }));
  assert.equal(scene.input.value, '15');

  const cancel = scene.drag.cancel;
  cancel();
  assert.equal(scene.input.value, '10');
  assert.equal(scene.drag.cancel, null);
  assert.equal(scene.win.aborted.length, 1);
  assert.equal(scene.win.has('pointercancel'), false);
  assert.deepEqual(scene.input.events, []);
});

test('数值拖拽：pointercancel 走取消路径并恢复原值', () => {
  const scene = harness({ input: makeInput({ value: '2', step: '1' }) });
  scene.drag.down(scene.down);
  scene.win.emit('pointermove', move({ clientX: 112 }));
  assert.equal(scene.input.value, '5');
  scene.win.emit('pointercancel', { pointerId: 7 });
  assert.equal(scene.input.value, '2');
  assert.equal(scene.drag.cancel, null);
});

test('数值拖拽：输入已脱离文档时不回写也不派发', () => {
  const committed = harness({ input: makeInput({ value: '10', step: '1' }) });
  committed.drag.down(committed.down);
  committed.win.emit('pointermove', move({ clientX: 120 }));
  assert.equal(committed.input.value, '15');
  committed.input.isConnected = false;
  committed.win.emit('pointerup', { pointerId: 7 });
  assert.equal(committed.input.value, '15');
  assert.deepEqual(committed.input.events, []);

  const cancelled = harness({ input: makeInput({ value: '4', step: '1' }) });
  cancelled.drag.down(cancelled.down);
  cancelled.win.emit('pointermove', move({ clientX: 108 }));
  assert.equal(cancelled.input.value, '6');
  cancelled.input.isConnected = false;
  cancelled.drag.cancel();
  assert.equal(cancelled.input.value, '6');
});

test('数值拖拽：新的按下会先取消尚未结束的上一次拖拽', () => {
  const win = windowRecord();
  const first = makeInput({ value: '10', step: '1' });
  const second = makeInput({ value: '100', step: '1' });
  first.ownerDocument = { defaultView: win };
  second.ownerDocument = { defaultView: win };
  let current = first;
  const target = {
    closest: (sel) =>
      sel === '[data-storyboard-3d-shot-timeline] label'
        ? { querySelector: (q) => (q === 'input[type="number"]' ? current : null) }
        : null,
  };
  const down = { target, button: 0, pointerId: 7, clientX: 100 };
  const drag = new DirectorNumericDrag({});

  drag.down(down);
  win.emit('pointermove', move({ clientX: 120 }));
  assert.equal(first.value, '15');

  current = second;
  drag.down(down);
  assert.equal(first.value, '10');
  assert.equal(typeof drag.cancel, 'function');
  assert.equal(win.aborted.length, 1);
});

test('数值拖拽：销毁时取消拖拽、解绑根节点并清空引用', () => {
  const scene = harness({ input: makeInput({ value: '10', step: '1' }) });
  const root = rootRecord();
  scene.drag.bind(root);
  scene.drag.down(scene.down);
  scene.win.emit('pointermove', move({ clientX: 120 }));
  assert.equal(scene.input.value, '15');

  scene.drag.destroy();
  assert.equal(scene.input.value, '10');
  assert.equal(scene.drag.root, null);
  assert.deepEqual(root.removed, [{ type: 'pointerdown', capture: true }]);
  assert.equal(scene.win.has('pointermove'), false);

  scene.drag.destroy();
  assert.equal(scene.drag.root, null);
  assert.deepEqual(root.removed, [{ type: 'pointerdown', capture: true }]);
});
