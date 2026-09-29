import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bindIconButtonMotion,
  ICON_BUTTON_ACTIVATION_ANIMATION,
  ICON_BUTTON_ACTIVATION_CLASS,
} from './iconButtonMotion.js';

function fakeButton(over = {}) {
  const listeners = new Map();
  const classes = new Set('classes' in over ? over.classes : []);
  const node = {
    disabled: 'disabled' in over ? over.disabled : false,
    classes,
    listeners,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      listeners.set(
        type,
        (listeners.get(type) || []).filter((entry) => entry !== listener),
      );
    },
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    emit(type, event) {
      for (const listener of [...(listeners.get(type) || [])]) listener(event);
    },
  };
  return node;
}

function harness(over = {}) {
  const frames = [];
  const timers = new Map();
  let nextTimer = 1;
  const log = { cleared: [], timers: [] };
  const options = {
    requestFrame: (callback) => {
      frames.push(callback);
      return frames.length;
    },
    setTimer: (callback, delay) => {
      const id = nextTimer++;
      timers.set(id, { callback, delay });
      log.timers.push([id, delay]);
      return id;
    },
    clearTimer: (id) => {
      log.cleared.push(id);
      timers.delete(id);
    },
    prefersReducedMotion: () => false,
    ...over,
  };
  return {
    frames,
    timers,
    log,
    options,
    runFrame() {
      const callback = frames.shift();
      if (callback) callback();
      return Boolean(callback);
    },
    fireTimer(id) {
      const entry = timers.get(id);
      if (!entry) return false;
      timers.delete(id);
      entry.callback();
      return true;
    },
  };
}

test('the frozen constants are exported', () => {
  assert.equal(ICON_BUTTON_ACTIVATION_CLASS, 'is-icon-activating');
  assert.equal(ICON_BUTTON_ACTIVATION_ANIMATION, 'canvas-chrome-icon-activate');
});

test('a click arms a frame and the frame lights the button', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  assert.equal(ctx.frames.length, 1);
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
  ctx.runFrame();
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
  assert.deepEqual(ctx.log.timers, [[1, 320]]);
});

test('the trailing timer clears the activation class', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  ctx.runFrame();
  assert.equal(ctx.timers.size, 1);
  ctx.fireTimer(1);
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
});

test('a custom duration is honoured', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button], { ...ctx.options, durationMs: 90 });
  button.emit('click');
  ctx.runFrame();
  assert.deepEqual(ctx.log.timers, [[1, 90]]);
});

test('the matching animationend resets the button', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  ctx.runFrame();
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
  button.emit('animationend', { animationName: ICON_BUTTON_ACTIVATION_ANIMATION });
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
  assert.equal(ctx.timers.size, 0);
});

test('a foreign animation name is ignored', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  ctx.runFrame();
  button.emit('animationend', { animationName: 'fade-out' });
  button.emit('animationend', {});
  button.emit('animationend', null);
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
  assert.equal(ctx.timers.size, 1);
});

test('a disabled button never activates', () => {
  const button = fakeButton({ disabled: true });
  const ctx = harness();
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  assert.equal(ctx.frames.length, 0);
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
});

test('reduced motion suppresses the frame entirely', () => {
  const button = fakeButton();
  const ctx = harness({ prefersReducedMotion: () => true });
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  assert.equal(ctx.frames.length, 0);
});

test('a second click before the frame supersedes the first', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  button.emit('click');
  assert.equal(ctx.frames.length, 2);
  ctx.runFrame();
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
  ctx.runFrame();
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
  assert.equal(ctx.timers.size, 1);
});

test('a click clears any activation still pending from an earlier timer', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  ctx.runFrame();
  const firstTimer = [...ctx.timers.keys()][0];
  button.emit('click');
  assert.deepEqual(ctx.log.cleared, [firstTimer]);
  assert.equal(ctx.timers.size, 0);
});

test('a frame that fires after disposal does nothing', () => {
  const button = fakeButton();
  const ctx = harness();
  const dispose = bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  dispose();
  ctx.runFrame();
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
  assert.equal(ctx.timers.size, 0);
});

test('disposal detaches both listeners and clears the class', () => {
  const button = fakeButton();
  const ctx = harness();
  const dispose = bindIconButtonMotion([button], ctx.options);
  button.emit('click');
  ctx.runFrame();
  dispose();
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
  assert.equal(button.listeners.get('click').length, 0);
  assert.equal(button.listeners.get('animationend').length, 0);
  button.emit('click');
  assert.equal(ctx.frames.length, 0);
});

test('several buttons are bound independently', () => {
  const first = fakeButton();
  const second = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([first, second], ctx.options);
  first.emit('click');
  second.emit('click');
  ctx.runFrame();
  assert.equal(first.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
  assert.equal(second.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
  ctx.runFrame();
  assert.equal(second.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
  assert.equal(ctx.timers.size, 2);
});

test('duplicate elements in the input are bound once', () => {
  const button = fakeButton();
  const ctx = harness();
  bindIconButtonMotion([button, button], ctx.options);
  assert.equal(button.listeners.get('click').length, 1);
});

test('an empty or nullish input yields an inert disposer', () => {
  for (const input of [null, undefined, []]) {
    const dispose = bindIconButtonMotion(input, harness().options);
    assert.equal(typeof dispose, 'function');
    assert.equal(dispose(), undefined);
  }
});

test('elements without listener or class support are skipped', () => {
  const bare = { disabled: false };
  const noClasses = { addEventListener() {}, removeEventListener() {} };
  const ctx = harness();
  const dispose = bindIconButtonMotion([bare, noClasses, null], ctx.options);
  assert.equal(typeof dispose, 'function');
  dispose();
});

test('the global timer is used when no timer hooks are supplied', async () => {
  const button = fakeButton();
  bindIconButtonMotion([button], {
    durationMs: 5,
    prefersReducedMotion: () => false,
    requestFrame: (callback) => callback(),
  });
  button.emit('click');
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), false);
  button.emit('animationend', { animationName: ICON_BUTTON_ACTIVATION_ANIMATION });
});

test('the default frame falls back to an immediate call', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  delete globalThis.requestAnimationFrame;
  try {
    const button = fakeButton();
    const dispose = bindIconButtonMotion([button], {
      setTimer: () => 1,
      clearTimer: () => {},
      prefersReducedMotion: () => false,
    });
    button.emit('click');
    assert.equal(button.classList.contains(ICON_BUTTON_ACTIVATION_CLASS), true);
    dispose();
  } finally {
    if (previous) Object.defineProperty(globalThis, 'requestAnimationFrame', previous);
  }
});

test('the default reduced-motion check reads the media query', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'matchMedia');
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query) => ({ matches: query === '(prefers-reduced-motion: reduce)' }),
  });
  try {
    const button = fakeButton();
    const frames = [];
    bindIconButtonMotion([button], {
      requestFrame: (callback) => frames.push(callback),
      setTimer: () => 1,
      clearTimer: () => {},
    });
    button.emit('click');
    assert.equal(frames.length, 0);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'matchMedia', previous);
    else delete globalThis.matchMedia;
  }
});
