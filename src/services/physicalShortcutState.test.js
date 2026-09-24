import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import {
  clearPhysicalShortcutKeys,
  physicalShortcutTokens,
  releasePhysicalShortcutKey,
  trackPhysicalShortcutKey,
} from './physicalShortcutState.js';

afterEach(() => {
  clearPhysicalShortcutKeys();
});

const press = (...codes) => {
  for (const code of codes) trackPhysicalShortcutKey({ code: code });
};

test('no alt returns an empty token list', () => {
  assert.deepEqual(physicalShortcutTokens({ altKey: false }), []);
  assert.deepEqual(physicalShortcutTokens({}), []);
});

test('alt alone yields the generic Alt token', () => {
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['Alt']);
});

test('alt with only one physical side still yields the generic Alt token', () => {
  press('AltLeft');
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['Alt']);
  clearPhysicalShortcutKeys();
  press('AltRight');
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['Alt']);
});

test('alt with both physical sides yields the ordered side tokens', () => {
  press('AltLeft', 'AltRight');
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['AltLeft', 'AltRight']);
});

test('both sides pressed without altKey still yields nothing', () => {
  press('AltLeft', 'AltRight');
  assert.deepEqual(physicalShortcutTokens({ altKey: false }), []);
});

test('tracking a key without a code is a no-op', () => {
  trackPhysicalShortcutKey({});
  trackPhysicalShortcutKey({ code: '' });
  trackPhysicalShortcutKey({ code: undefined });
  press('AltLeft', 'AltRight');
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['AltLeft', 'AltRight']);
});

test('release removes a tracked code', () => {
  press('AltLeft', 'AltRight');
  releasePhysicalShortcutKey({ code: 'AltRight' });
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['Alt']);
});

test('releasing a code that was never tracked is a no-op', () => {
  press('AltLeft', 'AltRight');
  releasePhysicalShortcutKey({ code: 'KeyA' });
  releasePhysicalShortcutKey({});
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['AltLeft', 'AltRight']);
});

test('clear drops every tracked code', () => {
  press('AltLeft', 'AltRight', 'KeyA');
  clearPhysicalShortcutKeys();
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['Alt']);
  assert.deepEqual(physicalShortcutTokens({ altKey: false }), []);
});

test('tracking the same code twice then releasing once drops it entirely', () => {
  press('AltLeft', 'AltLeft', 'AltRight');
  releasePhysicalShortcutKey({ code: 'AltLeft' });
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['Alt']);
});

test('non-alt codes are tracked but never surfaced as tokens', () => {
  press('ControlLeft', 'ShiftLeft', 'KeyZ');
  assert.deepEqual(physicalShortcutTokens({ altKey: true }), ['Alt']);
  assert.deepEqual(physicalShortcutTokens({ altKey: false }), []);
});
