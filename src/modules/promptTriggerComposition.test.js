import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deferPromptTriggerUntilCompositionEnd,
  shouldSkipPromptTriggerForBulkInput,
} from './promptTriggerComposition.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeElement() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    emit(type, evt = {}) {
      const fn = listeners.get(type);
      if (fn) fn(evt);
    },
  };
}

test('bulk input types are always skipped', () => {
  for (const inputType of ['insertFromPaste', 'insertFromDrop', 'insertReplacementText', 'insertHTML']) {
    assert.equal(shouldSkipPromptTriggerForBulkInput({ inputType }), true);
  }
});

test('multi-character committed data is skipped, single or empty data is not', () => {
  assert.equal(shouldSkipPromptTriggerForBulkInput({ inputType: 'insertText', data: 'ab' }), true);
  assert.equal(shouldSkipPromptTriggerForBulkInput({ data: 'ab' }), true);
  assert.equal(shouldSkipPromptTriggerForBulkInput({ inputType: 'insertText', data: 'a' }), false);
  assert.equal(shouldSkipPromptTriggerForBulkInput({ inputType: 'insertText', data: '' }), false);
  assert.equal(shouldSkipPromptTriggerForBulkInput({ inputType: 'insertText' }), false);
  assert.equal(shouldSkipPromptTriggerForBulkInput({}), false);
  assert.equal(shouldSkipPromptTriggerForBulkInput(undefined), false);
  assert.equal(shouldSkipPromptTriggerForBulkInput(null), false);
});

test('a non-composing event reports false and never registers a callback', () => {
  const el = makeElement();
  const calls = [];
  assert.equal(
    deferPromptTriggerUntilCompositionEnd({
      event: { inputType: 'insertText' },
      promptEl: el,
      triggerKey: 'slash',
      onCompositionEnd: () => calls.push('x'),
    }),
    false,
  );
  assert.equal(el.listeners.has('compositionend'), false);
  assert.deepEqual(calls, []);
});

test('composition events without a usable element or callback report true and store nothing', () => {
  assert.equal(
    deferPromptTriggerUntilCompositionEnd({
      event: { isComposing: true },
      promptEl: {},
      triggerKey: 'k',
      onCompositionEnd: () => {},
    }),
    true,
  );
  const el = makeElement();
  assert.equal(
    deferPromptTriggerUntilCompositionEnd({
      event: { isComposing: true },
      promptEl: el,
      triggerKey: 'k',
      onCompositionEnd: 'nope',
    }),
    true,
  );
  assert.equal(el.listeners.has('compositionend'), false);
});

test('a composition event defers the callback until compositionend flushes', async () => {
  const el = makeElement();
  const calls = [];
  const deferred = deferPromptTriggerUntilCompositionEnd({
    event: { isComposing: true },
    promptEl: el,
    triggerKey: 'slash',
    onCompositionEnd: () => calls.push('slash'),
  });
  assert.equal(deferred, true);
  assert.equal(el.listeners.has('compositionend'), true);
  assert.deepEqual(calls, []);
  el.emit('compositionend');
  await tick();
  assert.deepEqual(calls, ['slash']);
  el.emit('compositionend');
  await tick();
  assert.deepEqual(calls, ['slash']);
});

test('insertCompositionText counts as composing', async () => {
  const el = makeElement();
  const calls = [];
  const deferred = deferPromptTriggerUntilCompositionEnd({
    event: { inputType: 'insertCompositionText' },
    promptEl: el,
    triggerKey: 'k',
    onCompositionEnd: () => calls.push('k'),
  });
  assert.equal(deferred, true);
  el.emit('compositionend');
  await tick();
  assert.deepEqual(calls, ['k']);
});

test('queued callbacks for different trigger keys flush together', async () => {
  const el = makeElement();
  const calls = [];
  deferPromptTriggerUntilCompositionEnd({
    event: { isComposing: true },
    promptEl: el,
    triggerKey: 'a',
    onCompositionEnd: () => calls.push('a'),
  });
  deferPromptTriggerUntilCompositionEnd({
    event: { isComposing: true },
    promptEl: el,
    triggerKey: 'b',
    onCompositionEnd: () => calls.push('b'),
  });
  assert.equal(el.listeners.size, 1);
  el.emit('compositionend');
  await tick();
  assert.deepEqual(calls.sort(), ['a', 'b']);
});

test('a later non-composing event drops the pending callback for that key', async () => {
  const el = makeElement();
  const calls = [];
  deferPromptTriggerUntilCompositionEnd({
    event: { isComposing: true },
    promptEl: el,
    triggerKey: 'a',
    onCompositionEnd: () => calls.push('a'),
  });
  deferPromptTriggerUntilCompositionEnd({
    event: { isComposing: true },
    promptEl: el,
    triggerKey: 'b',
    onCompositionEnd: () => calls.push('b'),
  });
  assert.equal(
    deferPromptTriggerUntilCompositionEnd({
      event: { inputType: 'insertText' },
      promptEl: el,
      triggerKey: 'a',
      onCompositionEnd: () => calls.push('a'),
    }),
    false,
  );
  el.emit('compositionend');
  await tick();
  assert.deepEqual(calls, ['b']);
});

test('re-deferring the same key replaces the stored callback', async () => {
  const el = makeElement();
  const calls = [];
  deferPromptTriggerUntilCompositionEnd({
    event: { isComposing: true },
    promptEl: el,
    triggerKey: 'k',
    onCompositionEnd: () => calls.push('first'),
  });
  deferPromptTriggerUntilCompositionEnd({
    event: { isComposing: true },
    promptEl: el,
    triggerKey: 'k',
    onCompositionEnd: () => calls.push('second'),
  });
  el.emit('compositionend');
  await tick();
  assert.deepEqual(calls, ['second']);
});
