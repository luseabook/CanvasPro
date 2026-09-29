import test from 'node:test';
import assert from 'node:assert/strict';

import { beginNodeEditInteraction, deferNodeEditCompletion } from './nodeEditInteraction.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolveValue, rejectValue) => {
    resolve = resolveValue;
    reject = rejectValue;
  });
  return { promise, resolve, reject };
}

function createWindow() {
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
        (listeners.get(type) || []).filter((candidate) => candidate !== listener),
      );
    },
  };
}

test('nodeEditInteraction: derives the interaction from the graph mutation policy', () => {
  const policyResult = { ready: true, allowed: () => true, wait: Promise.resolve(true) };
  const host = {
    getGraphMutationPolicy() {
      return {
        beginInteraction(ids) {
          assert.deepEqual(ids, ['a', 'b']);
          return policyResult;
        },
      };
    },
  };

  assert.equal(beginNodeEditInteraction(host, ['a', 'b', 'a']), policyResult);
  const fallback = beginNodeEditInteraction({}, []);
  assert.equal(fallback.ready, true);
  assert.equal(fallback.allowed(), true);
});

test('nodeEditInteraction: defers a completion until the interaction settles', async () => {
  const pending = deferred();
  const windowObject = createWindow();
  const calls = [];
  const interaction = {
    ready: false,
    allowed: () => true,
    wait: pending.promise,
  };

  assert.equal(
    deferNodeEditCompletion(
      interaction,
      (result) => calls.push(result),
      () => true,
      windowObject,
    ),
    true,
  );
  for (const type of ['pointerdown', 'pointercancel', 'keydown', 'blur']) {
    assert.equal(windowObject.listeners.get(type).length, 1);
  }

  windowObject.listeners.get('pointerdown')[0]();
  pending.resolve(true);
  await pending.promise;
  await Promise.resolve();

  assert.deepEqual(calls, [false]);
  for (const type of ['pointerdown', 'pointercancel', 'keydown', 'blur']) {
    assert.equal(windowObject.listeners.get(type).length, 0);
  }
});

test('nodeEditInteraction: resolves success once the interaction becomes ready', async () => {
  const pending = deferred();
  const windowObject = createWindow();
  const calls = [];
  const interaction = {
    ready: false,
    allowed: () => true,
    wait: pending.promise,
  };

  assert.equal(
    deferNodeEditCompletion(
      interaction,
      (result) => calls.push(result),
      () => true,
      windowObject,
    ),
    true,
  );
  pending.resolve(true);
  await pending.promise;
  await Promise.resolve();

  assert.deepEqual(calls, [true]);
  assert.equal(
    deferNodeEditCompletion({ ready: true }, () => {}),
    false,
  );
  assert.equal(
    deferNodeEditCompletion({ ready: false }, () => {}),
    false,
  );
});
