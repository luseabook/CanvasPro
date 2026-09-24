import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { dispatchScopedEscape, registerEscapeScope } from './escapeScope.js';

const cleanups = [];
const register = (handler) => {
  const off = registerEscapeScope(handler);
  cleanups.push(off);
  return off;
};

afterEach(() => {
  while (cleanups.length) cleanups.pop()();
});

const makeEvent = (overrides = {}) => {
  const calls = { preventDefault: 0, stopImmediatePropagation: 0 };
  return {
    event: {
      key: 'Escape',
      isComposing: false,
      preventDefault() {
        calls.preventDefault += 1;
      },
      stopImmediatePropagation() {
        calls.stopImmediatePropagation += 1;
      },
      ...overrides,
    },
    calls,
  };
};

test('starts with no registered handlers', () => {
  const { event } = makeEvent();
  assert.equal(dispatchScopedEscape(event), false);
});

test('registerEscapeScope returns a function', () => {
  assert.equal(typeof register(() => {}), 'function');
});

test('dispatch runs the last registered handler and reports handled', () => {
  const seen = [];
  register(() => seen.push('first'));
  register(() => seen.push('second'));
  const { event, calls } = makeEvent();
  assert.equal(dispatchScopedEscape(event), true);
  assert.deepEqual(seen, ['second']);
  assert.equal(calls.preventDefault, 1);
  assert.equal(calls.stopImmediatePropagation, 1);
});

test('only the top-most handler runs, earlier ones are skipped', () => {
  const seen = [];
  register(() => seen.push(1));
  register(() => seen.push(2));
  register(() => seen.push(3));
  dispatchScopedEscape(makeEvent().event);
  assert.deepEqual(seen, [3]);
});

test('handler is invoked without arguments', () => {
  let args = null;
  register((...rest) => {
    args = rest;
  });
  dispatchScopedEscape(makeEvent().event);
  assert.deepEqual(args, []);
});

test('unsubscribe removes only that handler', () => {
  const seen = [];
  register(() => seen.push('first'));
  const off = register(() => seen.push('second'));
  off();
  dispatchScopedEscape(makeEvent().event);
  assert.deepEqual(seen, ['first']);
});

test('unsubscribing twice is safe and idempotent', () => {
  const seen = [];
  register(() => seen.push('kept'));
  const off = register(() => seen.push('dropped'));
  off();
  off();
  off();
  dispatchScopedEscape(makeEvent().event);
  assert.deepEqual(seen, ['kept']);
});

test('unsubscribing a handler from the middle of the stack keeps the rest', () => {
  const seen = [];
  register(() => seen.push('bottom'));
  const off = register(() => seen.push('middle'));
  register(() => seen.push('top'));
  off();
  dispatchScopedEscape(makeEvent().event);
  assert.deepEqual(seen, ['top']);
  dispatchScopedEscape(makeEvent().event);
  assert.deepEqual(seen, ['top', 'top']);
  cleanups.pop()();
  dispatchScopedEscape(makeEvent().event);
  assert.deepEqual(seen, ['top', 'top', 'bottom']);
});

test('the same handler registered twice needs two unsubscribes', () => {
  let count = 0;
  const handler = () => {
    count += 1;
  };
  register(handler);
  register(handler);
  dispatchScopedEscape(makeEvent().event);
  assert.equal(count, 1);
  dispatchScopedEscape(makeEvent().event);
  assert.equal(count, 2);
});

test('returns false and does nothing when the key is not Escape', () => {
  let called = 0;
  register(() => {
    called += 1;
  });
  const { event, calls } = makeEvent({ key: 'Enter' });
  assert.equal(dispatchScopedEscape(event), false);
  assert.equal(called, 0);
  assert.equal(calls.preventDefault, 0);
  assert.equal(calls.stopImmediatePropagation, 0);
});

test('returns false while composing', () => {
  let called = 0;
  register(() => {
    called += 1;
  });
  const { event, calls } = makeEvent({ isComposing: true });
  assert.equal(dispatchScopedEscape(event), false);
  assert.equal(called, 0);
  assert.equal(calls.preventDefault, 0);
  assert.equal(calls.stopImmediatePropagation, 0);
});

test('returns false when the key is Escape but no handler is registered', () => {
  const { event, calls } = makeEvent();
  assert.equal(dispatchScopedEscape(event), false);
  assert.equal(calls.preventDefault, 0);
  assert.equal(calls.stopImmediatePropagation, 0);
});

test('a handler that unsubscribes itself does not disturb the pending dispatch', () => {
  const seen = [];
  const off = register(() => {
    seen.push('self');
    off();
  });
  assert.equal(dispatchScopedEscape(makeEvent().event), true);
  assert.deepEqual(seen, ['self']);
  assert.equal(dispatchScopedEscape(makeEvent().event), false);
});
