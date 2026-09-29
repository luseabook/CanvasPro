import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkspaceStepShortcut, handleWorkspaceStepShortcut } from './workspaceStepShortcut.js';

const EDITABLE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[role="textbox"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
].join(',');

function keyEvent(overrides = {}) {
  return { key: '1', target: null, ...overrides };
}

test('maps a plain digit key onto the step number', () => {
  for (let digit = 1; digit <= 9; digit += 1) {
    assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: String(digit) }), 9), digit);
  }
});

test('rejects keys that are not a single digit', () => {
  for (const key of ['0', 'a', '', '10', '-1', ' 1', '１', null, undefined]) {
    assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key }), 9), 0);
  }
});

test('rejects steps beyond the available count', () => {
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: '3' }), 3), 3);
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: '4' }), 3), 0);
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: '9' }), '3'), 0);
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: '2' }), 2.9), 2);
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: '3' }), 2.9), 0);
});

test('treats a missing or bogus step count as zero', () => {
  for (const stepCount of [0, -4, 'x', NaN, null, undefined, {}]) {
    assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: '1' }), stepCount), 0);
  }
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ key: '1' })), 0);
});

test('rejects a missing event or any modifier', () => {
  assert.equal(resolveWorkspaceStepShortcut(null, 9), 0);
  assert.equal(resolveWorkspaceStepShortcut(undefined, 9), 0);
  for (const flag of [
    'defaultPrevented',
    'isComposing',
    'repeat',
    'ctrlKey',
    'metaKey',
    'altKey',
    'shiftKey',
  ]) {
    assert.equal(resolveWorkspaceStepShortcut(keyEvent({ [flag]: true }), 9), 0);
  }
});

test('rejects keystrokes inside editable surfaces', () => {
  const seen = [];
  const editable = {
    isContentEditable: false,
    closest(selector) {
      seen.push(selector);
      return { tagName: 'INPUT' };
    },
  };
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ target: editable }), 9), 0);
  assert.deepEqual(seen, [EDITABLE_SELECTOR]);
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ target: { isContentEditable: true } }), 9), 0);
});

test('allows a non-editable target', () => {
  const target = { isContentEditable: false, closest: () => null };
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ target }), 9), 1);
  assert.equal(resolveWorkspaceStepShortcut(keyEvent({ target: {} }), 9), 1);
});

test('handles the shortcut and navigates to the step', () => {
  const calls = [];
  const event = keyEvent({
    key: '4',
    preventDefault: () => calls.push('preventDefault'),
    stopPropagation: () => calls.push('stopPropagation'),
  });
  const navigated = [];
  const handled = handleWorkspaceStepShortcut(event, {
    stepCount: 5,
    navigate: (step) => navigated.push(step),
  });
  assert.equal(handled, true);
  assert.deepEqual(calls, ['preventDefault', 'stopPropagation']);
  assert.deepEqual(navigated, [4]);
});

test('still reports handled without a navigate callback', () => {
  assert.equal(handleWorkspaceStepShortcut(keyEvent({ key: '2' }), { stepCount: 2 }), true);
});

test('does nothing while disabled or without a matching step', () => {
  const navigated = [];
  assert.equal(
    handleWorkspaceStepShortcut(keyEvent({ key: '2' }), {
      enabled: false,
      stepCount: 2,
      navigate: (step) => navigated.push(step),
    }),
    false,
  );
  assert.equal(
    handleWorkspaceStepShortcut(keyEvent({ key: '9' }), {
      stepCount: 2,
      navigate: (step) => navigated.push(step),
    }),
    false,
  );
  assert.deepEqual(navigated, []);
});
