import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDirectorCurveEditor, DirectorCurveEditor } from './directorCurveEditor.js';

const MATCH_ALL = (selector) => selector === '[data-curve-value],[data-curve-tangent]';

test('renderDirectorCurveEditor 输出默认缓动曲线与控制柄', () => {
  const html = renderDirectorCurveEditor({});
  assert.ok(html.includes('<details class="storyboard-3d-director-curve">'));
  assert.ok(html.includes('<svg viewBox="0 0 200 140" data-director-curve'));
  assert.ok(html.includes('<path data-curve-line d="M20 120 C20 120,180 20,180 20"/>'));
  assert.ok(html.includes('data-curve-handle="0" cx="20" cy="120" r="6"/>'));
  assert.ok(html.includes('data-curve-handle="1" cx="180" cy="20" r="6"/>'));
  assert.ok(
    html.includes(
      '<label>起点 X<input type="number" step="0.05" min="0" max="1" data-curve-value="0" value="0"></label>',
    ),
  );
  assert.ok(
    html.includes(
      '<label>终点 Y<input type="number" step="0.05" min="-4" max="4" data-curve-value="3" value="1"></label>',
    ),
  );
  assert.ok(html.includes('<b>入切线 / 米</b>'));
  assert.ok(html.includes('<b>出切线 / 米</b>'));
  assert.ok(html.includes('data-curve-tangent="inTangent" data-axis="2" value="0"'));
  assert.ok(html.includes('data-curve-tangent="outTangent" data-axis="0" value="0"'));
});

test('renderDirectorCurveEditor 按给定曲线与切线换算控制柄坐标', () => {
  const html = renderDirectorCurveEditor({
    easingCurve: [0.25, 0, 0.75, 1],
    inTangent: [1, 2, 3],
    outTangent: [-1, 0, 1],
  });
  assert.ok(html.includes('<path data-curve-line d="M20 120 C60 120,140 20,180 20"/>'));
  assert.ok(html.includes('data-curve-value="0" value="0.25"'));
  assert.ok(html.includes('data-curve-value="2" value="0.75"'));
  assert.ok(html.includes('data-curve-tangent="inTangent" data-axis="2" value="3"'));
  assert.ok(html.includes('data-curve-tangent="outTangent" data-axis="0" value="-1"'));
});

test('DirectorCurveEditor.change 写入曲线数值与空间切线，非有限值不落盘', () => {
  const calls = [];
  const path = {
    selected: () => ({ easingCurve: [0, 0, 1, 1], inTangent: [0, 0, 0] }),
    change: (p) => calls.push(p),
  };
  const editor = new DirectorCurveEditor(path);
  assert.equal(
    editor['change']({
      target: { matches: MATCH_ALL, type: 'number', value: '0.5', dataset: { curveValue: '0' } },
    }),
    true,
  );
  assert.deepEqual(calls[0], { easingCurve: [0.5, 0, 1, 1] });
  editor['change']({
    target: {
      matches: MATCH_ALL,
      type: 'number',
      value: '-2',
      dataset: { curveTangent: 'inTangent', axis: '1' },
    },
  });
  assert.deepEqual(calls[1], { inTangent: [0, -2, 0] });
  assert.equal(
    editor['change']({
      target: { matches: MATCH_ALL, type: 'number', value: 'abc', dataset: { curveValue: '1' } },
    }),
    true,
  );
  assert.equal(calls.length, 2);
  assert.equal(editor['change']({ target: { matches: (selector) => selector === 'x' } }), false);
  const idle = new DirectorCurveEditor({ selected: () => null, change: () => assert.fail('不应写入') });
  assert.equal(
    idle['change']({ target: { matches: MATCH_ALL, type: 'number', value: '1', dataset: {} } }),
    false,
  );
});

const keyEvent = (key, handle, stats) => ({
  target: { dataset: { curveHandle: handle } },
  key,
  preventDefault: () => {
    stats.prevented += 1;
  },
  stopImmediatePropagation: () => {
    stats.stopped += 1;
  },
});

test('DirectorCurveEditor.key 用方向键微调控制柄并阻止默认行为', () => {
  const calls = [];
  const stats = { prevented: 0, stopped: 0 };
  const path = { selected: () => ({ easingCurve: [0, 0, 1, 1] }), change: (p) => calls.push(p) };
  const editor = new DirectorCurveEditor(path);
  assert.equal(editor['key']({ target: { dataset: {} }, key: 'ArrowUp' }), false);
  assert.equal(editor['key'](keyEvent('Enter', '0', stats)), false);
  assert.equal(editor['key'](keyEvent('ArrowUp', '1', stats)), true);
  assert.deepEqual(calls[0], { easingCurve: [0, 0, 1, 1.05] });
  assert.equal(editor['key'](keyEvent('ArrowLeft', '0', stats)), true);
  assert.deepEqual(calls[1], { easingCurve: [-0.05, 0, 1, 1] });
  assert.equal(stats.prevented, 2);
  assert.equal(stats.stopped, 2);
});

test('DirectorCurveEditor.down 拖拽时刷新控制柄与曲线，抬起后写回', () => {
  const handlers = {};
  const calls = [];
  let identity = 'id-1';
  const selected = { easingCurve: [0, 0, 1, 1] };
  const line = {
    setAttribute: (key, value) => {
      line[key] = value;
    },
  };
  const handle = {
    dataset: { curveHandle: '0' },
    setAttribute: (key, value) => {
      handle[key] = value;
    },
    ownerSVGElement: {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 140 }),
      querySelector: () => line,
    },
  };
  const path = {
    selected: () => selected,
    identity: () => identity,
    change: (p) => calls.push(p),
    timeline: {
      requestRender: () => {},
      window: {
        AbortController: class {
          constructor() {
            this.signal = { aborted: false };
          }
          abort() {
            this.signal.aborted = true;
          }
        },
        addEventListener: (type, fn) => {
          handlers[type] = fn;
        },
      },
    },
  };
  const editor = new DirectorCurveEditor(path);
  assert.equal(editor['down']({ target: { closest: () => null }, button: 0 }), false);
  assert.equal(editor['down']({ target: { closest: () => handle }, button: 1 }), false);
  assert.equal(
    editor['down']({
      target: { closest: () => handle },
      button: 0,
      pointerId: 7,
      preventDefault: () => {},
      stopImmediatePropagation: () => {},
    }),
    true,
  );
  handlers['pointermove']({ pointerId: 7, clientX: 100, clientY: 20 });
  assert.equal(handle.cx, 100);
  assert.equal(handle.cy, 20);
  assert.ok(line.d.startsWith('M20 120 C'));
  handlers['pointerup']({ pointerId: 7 });
  assert.deepEqual(calls.at(-1), { easingCurve: [0.5, 1, 1, 1] });
  identity = 'id-2';
  calls.length = 0;
  assert.equal(
    editor['down']({
      target: { closest: () => handle },
      button: 0,
      pointerId: 8,
      preventDefault: () => {},
      stopImmediatePropagation: () => {},
    }),
    true,
  );
  identity = 'id-3';
  handlers['pointermove']({ pointerId: 8, clientX: 20, clientY: 120 });
  handlers['pointerup']({ pointerId: 8 });
  assert.deepEqual(calls, []);
});
