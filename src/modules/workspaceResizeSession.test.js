import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  beginWorkspaceResizeSession,
  beginWorkspaceHorizontalResizeSession,
  beginWorkspaceVerticalResizeSession,
} from './workspaceResizeSession.js';

function makeWindow() {
  const listeners = new Map();
  return {
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const entries = listeners.get(type) || [];
      const index = entries.indexOf(fn);
      if (index >= 0) entries.splice(index, 1);
    },
    dispatch(type, event) {
      for (const fn of [...(listeners.get(type) || [])]) fn(event);
    },
  };
}

function makeSignal() {
  const listeners = new Map();
  return {
    aborted: false,
    addCalls: [],
    removeCalls: [],
    addEventListener(type, fn, options) {
      this.addCalls.push({ type, fn, options });
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      this.removeCalls.push({ type, fn });
      const entries = listeners.get(type) || [];
      const index = entries.indexOf(fn);
      if (index >= 0) entries.splice(index, 1);
    },
    abort() {
      this.aborted = true;
      for (const fn of [...(listeners.get('abort') || [])]) fn();
    },
  };
}

function makeSplitter() {
  const classes = new Set();
  const splitter = {
    classes,
    captured: [],
    released: [],
    capture: true,
    setPointerCapture(id) {
      splitter.captured.push(id);
    },
    hasPointerCapture() {
      return splitter.capture;
    },
    releasePointerCapture(id) {
      splitter.released.push(id);
    },
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
    },
  };
  return splitter;
}

function makeBody() {
  const classes = new Set();
  const calls = [];
  return {
    classes,
    calls,
    classList: {
      add(name) {
        calls.push(['add', name]);
        classes.add(name);
      },
      remove(name) {
        calls.push(['remove', name]);
        classes.delete(name);
      },
    },
  };
}

function makeLayout(rect) {
  const layout = {
    rect,
    rectCalls: 0,
    getBoundingClientRect() {
      layout.rectCalls += 1;
      return layout.rect;
    },
  };
  return layout;
}

function makeEvent(over = {}) {
  const event = {
    pointerId: 'pointerId' in over ? over.pointerId : 1,
    isPrimary: 'isPrimary' in over ? over.isPrimary : true,
    button: 'button' in over ? over.button : 0,
    clientX: 'clientX' in over ? over.clientX : 0,
    clientY: 'clientY' in over ? over.clientY : 0,
    prevented: 0,
    stopped: 0,
    preventDefault() {
      event.prevented += 1;
    },
    stopPropagation() {
      event.stopped += 1;
    },
  };
  return event;
}

function setup(over = {}) {
  const { rect = { left: 10, top: 20, width: 200, height: 100 }, ...rest } = over;
  const win = makeWindow();
  const splitter = makeSplitter();
  const body = makeBody();
  const layout = makeLayout(rect);
  const event = makeEvent();
  const ratios = [];
  const finished = [];
  const options = {
    event,
    splitter,
    layout,
    windowObject: win,
    body,
    resizingClass: '',
    onRatio(value, pointerEvent) {
      ratios.push([value, pointerEvent]);
    },
    onFinish(pointerEvent) {
      finished.push(pointerEvent);
    },
  };
  Object.assign(options, rest);
  return {
    options,
    win,
    splitter,
    body,
    layout,
    event,
    ratios,
    finished,
    run: () => beginWorkspaceResizeSession(options),
    runHorizontal: () => beginWorkspaceHorizontalResizeSession(options),
    runVertical: () => beginWorkspaceVerticalResizeSession(options),
  };
}

test('refuses to start without a complete set of options', () => {
  assert.equal(beginWorkspaceResizeSession(), false);
  assert.equal(beginWorkspaceResizeSession({}), false);

  const partial = setup();
  assert.equal(beginWorkspaceResizeSession({ event: partial.event }), false);
  assert.equal(beginWorkspaceResizeSession({ event: partial.event, splitter: partial.splitter }), false);
  assert.equal(
    beginWorkspaceResizeSession({ event: partial.event, splitter: partial.splitter, layout: partial.layout }),
    false,
  );
  assert.equal(
    beginWorkspaceResizeSession({
      event: partial.event,
      splitter: partial.splitter,
      layout: partial.layout,
      onRatio: 'nope',
    }),
    false,
  );
  assert.equal(setup({ onRatio: null }).run(), false);
  assert.equal(partial.win.listenerCount('pointermove'), 0);
});

test('refuses a secondary or non-left button press', () => {
  assert.equal(setup({ event: makeEvent({ button: 1 }) }).run(), false);
  assert.equal(setup({ event: makeEvent({ button: 2 }) }).run(), false);
  assert.equal(setup({ event: makeEvent({ button: 0 }) }).run(), true);
  assert.equal(setup({ event: makeEvent({ button: undefined }) }).run(), true);
});

test('does not coerce the button value when screening it', () => {
  const stringy = setup({ event: makeEvent({ button: '1' }) });
  assert.equal(stringy.run(), true);
  assert.deepEqual(stringy.splitter.captured, [1]);
});

test('refuses a non-primary pointer', () => {
  assert.equal(setup({ event: makeEvent({ isPrimary: false }) }).run(), false);
  assert.equal(setup({ event: makeEvent({ isPrimary: undefined }) }).run(), true);
});

test('refuses an already aborted signal', () => {
  const signal = makeSignal();
  signal.aborted = true;
  const scene = setup({ signal });
  assert.equal(scene.run(), false);
  assert.deepEqual(signal.addCalls, []);
  assert.equal(scene.win.listenerCount('pointermove'), 0);
  assert.equal(scene.event.prevented, 0);
});

test('refuses a layout with no measurable size', () => {
  const rects = [
    { left: 0, top: 0, width: 0, height: 100 },
    { left: 0, top: 0, width: -20, height: 100 },
    { left: 0, top: 0, height: 100 },
    { left: 0, top: 0, width: 'abc', height: 100 },
  ];
  for (const rect of rects) {
    const scene = setup({ rect });
    assert.equal(scene.run(), false);
    assert.equal(scene.layout.rectCalls, 1);
    assert.equal(scene.event.prevented, 0);
  }

  const withoutRect = setup();
  assert.equal(beginWorkspaceResizeSession({ ...withoutRect.options, layout: {} }), false);
  assert.equal(withoutRect.event.prevented, 0);
});

test('accepts a numeric string size', () => {
  const scene = setup({ rect: { left: 10, top: 0, width: '200', height: 100 } });
  assert.equal(scene.run(), true);
  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 60 });
  assert.equal(scene.ratios[0][0], 25);
});

test('starts a session and marks both targets active', () => {
  const scene = setup({ resizingClass: 'is-resizing' });
  assert.equal(scene.run(), true);
  assert.equal(scene.event.prevented, 1);
  assert.equal(scene.event.stopped, 1);
  assert.deepEqual(scene.splitter.captured, [1]);
  assert.deepEqual([...scene.splitter.classes], ['is-active']);
  assert.deepEqual([...scene.body.classes], ['is-resizing']);
  assert.equal(scene.win.listenerCount('pointermove'), 1);
  assert.equal(scene.win.listenerCount('pointerup'), 1);
  assert.equal(scene.win.listenerCount('pointercancel'), 1);
  assert.equal(scene.layout.rectCalls, 1);
});

test('skips the body class when no resizing class is configured', () => {
  const scene = setup({ resizingClass: '' });
  assert.equal(scene.run(), true);
  assert.deepEqual(scene.body.calls, []);
  assert.deepEqual([...scene.body.classes], []);
});

test('subscribes to the abort signal with a one-shot listener', () => {
  const signal = makeSignal();
  const scene = setup({ signal });
  assert.equal(scene.run(), true);
  assert.equal(signal.addCalls.length, 1);
  assert.equal(signal.addCalls[0].type, 'abort');
  assert.deepEqual(signal.addCalls[0].options, { once: true });
  assert.equal(typeof signal.addCalls[0].fn, 'function');
  assert.equal(signal.removeCalls.length, 0);
});

test('reports the horizontal ratio as a percentage of the width', () => {
  const scene = setup();
  scene.run();
  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 60 });
  assert.equal(scene.ratios.length, 1);
  assert.ok(scene.ratios[0][0] === 25);
  assert.equal(scene.ratios[0][1].clientX, 60);

  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 10 });
  assert.ok(scene.ratios[1][0] === 0);
  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 210 });
  assert.ok(scene.ratios[2][0] === 100);
});

test('any orientation other than vertical uses the width', () => {
  const scene = setup({ orientation: 'diagonal' });
  scene.run();
  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 60, clientY: 70 });
  assert.ok(scene.ratios[0][0] === 25);
});

test('reports the vertical ratio from the height and top', () => {
  const scene = setup({ orientation: 'vertical' });
  assert.equal(scene.run(), true);
  scene.win.dispatch('pointermove', { pointerId: 1, clientY: 70, clientX: 999 });
  assert.ok(scene.ratios[0][0] === 50);
});

test('falls back to a zero origin when the rect has no offset', () => {
  const scene = setup({ rect: { width: 200, height: 100 } });
  scene.run();
  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 50 });
  assert.ok(scene.ratios[0][0] === 25);

  const vertical = setup({ orientation: 'vertical', rect: { width: 200, height: 100 } });
  vertical.run();
  vertical.win.dispatch('pointermove', { pointerId: 1, clientY: 50 });
  assert.ok(vertical.ratios[0][0] === 50);
});

test('ignores pointer moves coming from another pointer', () => {
  const scene = setup({ event: makeEvent({ pointerId: 7 }) });
  scene.run();
  scene.win.dispatch('pointermove', { pointerId: 8, clientX: 60 });
  assert.equal(scene.ratios.length, 0);
  scene.win.dispatch('pointermove', { pointerId: 7, clientX: 60 });
  assert.equal(scene.ratios.length, 1);
});

test('accepts every move when the tracked pointer id is not finite', () => {
  const scene = setup({ event: makeEvent({ pointerId: undefined }) });
  scene.run();
  scene.win.dispatch('pointermove', { pointerId: 99, clientX: 60 });
  scene.win.dispatch('pointermove', { clientX: 60 });
  assert.equal(scene.ratios.length, 2);
});

test('finishes on pointerup and tears the session down', () => {
  const signal = makeSignal();
  const scene = setup({ resizingClass: 'is-resizing', signal });
  scene.run();
  const upEvent = { pointerId: 1, clientX: 200 };
  scene.win.dispatch('pointerup', upEvent);
  assert.deepEqual(scene.finished, [upEvent]);
  assert.deepEqual(scene.splitter.released, [1]);
  assert.deepEqual([...scene.splitter.classes], []);
  assert.deepEqual([...scene.body.classes], []);
  assert.equal(scene.win.listenerCount('pointermove'), 0);
  assert.equal(scene.win.listenerCount('pointerup'), 0);
  assert.equal(scene.win.listenerCount('pointercancel'), 0);
  assert.equal(signal.removeCalls.length, 1);
  assert.equal(signal.removeCalls[0].type, 'abort');

  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 60 });
  assert.equal(scene.ratios.length, 0);
});

test('finishes on pointercancel as well', () => {
  const scene = setup();
  scene.run();
  const cancelEvent = { pointerId: 1 };
  scene.win.dispatch('pointercancel', cancelEvent);
  assert.deepEqual(scene.finished, [cancelEvent]);
  assert.deepEqual([...scene.splitter.classes], []);
  assert.equal(scene.win.listenerCount('pointermove'), 0);
});

test('ignores a finish coming from another pointer', () => {
  const scene = setup({ event: makeEvent({ pointerId: 7 }) });
  scene.run();
  scene.win.dispatch('pointerup', { pointerId: 8 });
  assert.equal(scene.finished.length, 0);
  assert.deepEqual([...scene.splitter.classes], ['is-active']);
  assert.equal(scene.win.listenerCount('pointermove'), 1);
});

test('skips the pointer-capture release when the splitter does not hold it', () => {
  const scene = setup();
  scene.splitter.capture = false;
  scene.run();
  scene.win.dispatch('pointerup', { pointerId: 1 });
  assert.deepEqual(scene.splitter.released, []);
  assert.equal(scene.finished.length, 1);
});

test('survives a splitter without capture or class hooks', () => {
  const scene = setup();
  assert.equal(beginWorkspaceResizeSession({ ...scene.options, splitter: {} }), true);
  assert.doesNotThrow(() => scene.win.dispatch('pointerup', { pointerId: 1 }));
  assert.equal(scene.finished.length, 1);
});

test('swallows a throwing pointer-capture probe', () => {
  const scene = setup();
  scene.splitter.hasPointerCapture = () => {
    throw new Error('nope');
  };
  scene.run();
  assert.doesNotThrow(() => scene.win.dispatch('pointerup', { pointerId: 1 }));
  assert.equal(scene.finished.length, 1);
});

test('finishes when the abort signal fires', () => {
  const signal = makeSignal();
  const scene = setup({ signal, resizingClass: 'is-resizing', event: makeEvent({ pointerId: 5 }) });
  assert.equal(scene.run(), true);
  signal.abort();
  assert.equal(scene.finished.length, 1);
  assert.deepEqual(scene.finished[0], { pointerId: 5 });
  assert.deepEqual([...scene.splitter.classes], []);
  assert.deepEqual([...scene.body.classes], []);
  assert.equal(scene.win.listenerCount('pointerup'), 0);
});

test('makes onFinish optional', () => {
  const scene = setup({ onFinish: null });
  assert.equal(scene.run(), true);
  assert.doesNotThrow(() => scene.win.dispatch('pointerup', { pointerId: 1 }));
  assert.equal(scene.finished.length, 0);
});

test('accepts a raw event without listener hooks', () => {
  const scene = setup({ event: { pointerId: 1, button: 0 } });
  assert.equal(scene.run(), true);
  assert.doesNotThrow(() => scene.win.dispatch('pointerup', { pointerId: 1 }));
  assert.equal(scene.finished.length, 1);
});

test('works without a window or a body object', () => {
  const scene = setup({ windowObject: null, body: null });
  assert.equal(scene.run(), true);
  assert.equal(scene.event.prevented, 1);
  assert.deepEqual(scene.splitter.captured, [1]);

  const fallback = setup();
  const { windowObject, body, ...minimal } = fallback.options;
  assert.equal(beginWorkspaceResizeSession(minimal), true);
});

test('does not mutate the caller options', () => {
  const scene = setup({ resizingClass: 'is-resizing' });
  const keys = Object.keys(scene.options);
  assert.equal(scene.run(), true);
  assert.deepEqual(Object.keys(scene.options), keys);
  assert.equal(scene.options.resizingClass, 'is-resizing');
  assert.equal(scene.options.orientation, undefined);
});

test('the horizontal helper forces the horizontal axis', () => {
  const scene = setup({ orientation: 'vertical' });
  assert.equal(scene.runHorizontal(), true);
  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 60, clientY: 70 });
  assert.ok(scene.ratios[0][0] === 25);
  assert.equal(scene.options.orientation, 'vertical');
});

test('the vertical helper forces the vertical axis', () => {
  const scene = setup({ orientation: 'horizontal' });
  assert.equal(scene.runVertical(), true);
  scene.win.dispatch('pointermove', { pointerId: 1, clientX: 60, clientY: 70 });
  assert.ok(scene.ratios[0][0] === 50);
  assert.equal(scene.options.orientation, 'horizontal');
});

test('the axis helpers reject an incomplete options object', () => {
  assert.equal(beginWorkspaceHorizontalResizeSession(), false);
  assert.equal(beginWorkspaceVerticalResizeSession(), false);
  assert.equal(beginWorkspaceHorizontalResizeSession({}), false);
  assert.equal(beginWorkspaceVerticalResizeSession(null), false);

  const partial = setup({ onRatio: null });
  assert.equal(partial.runHorizontal(), false);
  assert.equal(partial.runVertical(), false);
  assert.equal(partial.win.listenerCount('pointermove'), 0);
});
