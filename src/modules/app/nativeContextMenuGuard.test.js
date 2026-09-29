import test from 'node:test';
import assert from 'node:assert/strict';
import { installNativeContextMenuGuard } from './nativeContextMenuGuard.js';

function fakeTarget() {
  const listeners = new Map();
  return {
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
    emit(type, event) {
      for (const listener of [...(listeners.get(type) || [])]) listener(event);
    },
  };
}

test('returns a no-op disposer when the target cannot listen', () => {
  assert.equal(typeof installNativeContextMenuGuard(null), 'function');
  assert.equal(typeof installNativeContextMenuGuard(undefined), 'function');
  assert.equal(typeof installNativeContextMenuGuard({}), 'function');
  assert.equal(installNativeContextMenuGuard({}).length, 0);
  assert.equal(installNativeContextMenuGuard({})(), undefined);
});

test('binds exactly one contextmenu listener', () => {
  const target = fakeTarget();
  installNativeContextMenuGuard(target);
  assert.equal(target.listeners.size, 1);
  assert.equal(target.listeners.get('contextmenu').length, 1);
});

test('the listener suppresses the native menu', () => {
  const target = fakeTarget();
  installNativeContextMenuGuard(target);
  let prevented = 0;
  target.emit('contextmenu', {
    preventDefault() {
      prevented += 1;
    },
  });
  assert.equal(prevented, 1);
});

test('an event without preventDefault is tolerated', () => {
  const target = fakeTarget();
  installNativeContextMenuGuard(target);
  target.emit('contextmenu', {});
});

test('a nullish event is tolerated', () => {
  const target = fakeTarget();
  installNativeContextMenuGuard(target);
  target.emit('contextmenu', null);
  target.emit('contextmenu', undefined);
});

test('the returned disposer removes the very same listener', () => {
  const target = fakeTarget();
  const dispose = installNativeContextMenuGuard(target);
  const bound = target.listeners.get('contextmenu')[0];
  dispose();
  assert.equal(target.listeners.get('contextmenu').length, 0);
  assert.equal(typeof bound, 'function');
});

test('disposal tolerates a target without removeEventListener', () => {
  const listener = [];
  const target = { addEventListener: (type, fn) => listener.push([type, fn]) };
  const dispose = installNativeContextMenuGuard(target);
  dispose();
  assert.equal(listener.length, 1);
});

test('defaults to the global window', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const target = fakeTarget();
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: target });
  try {
    const dispose = installNativeContextMenuGuard();
    assert.equal(target.listeners.get('contextmenu').length, 1);
    dispose();
    assert.equal(target.listeners.get('contextmenu').length, 0);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  }
});
