import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import {
  isCanvasPanShortcutHeld,
  releaseCanvasPanShortcut,
  setCanvasPanShortcutHeld,
} from './canvasPanShortcutState.js';

const silent = { windowObject: null, documentObject: null };

afterEach(() => {
  releaseCanvasPanShortcut(silent);
});

const makeEnvironment = () => {
  const element = { style: { cursor: '' } };
  const requestedIds = [];
  const windowObject = {};
  const documentObject = {
    getElementById(id) {
      requestedIds.push(id);
      return id === 'v2-wrap' ? element : null;
    },
  };
  return { element, requestedIds, windowObject, documentObject };
};

test('starts released', () => {
  assert.equal(isCanvasPanShortcutHeld(), false);
});

test('holding sets the flag, the window hint and the grab cursor', () => {
  const env = makeEnvironment();
  setCanvasPanShortcutHeld(true, env);
  assert.equal(isCanvasPanShortcutHeld(), true);
  assert.equal(env.windowObject['_spaceHeld'], true);
  assert.equal(env.element.style.cursor, 'var(--grab-cursor)');
  assert.deepEqual(env.requestedIds, ['v2-wrap']);
});

test('releasing clears the flag, the window hint and the cursor', () => {
  const env = makeEnvironment();
  setCanvasPanShortcutHeld(true, env);
  setCanvasPanShortcutHeld(false, env);
  assert.equal(isCanvasPanShortcutHeld(), false);
  assert.equal(env.windowObject['_spaceHeld'], false);
  assert.equal(env.element.style.cursor, '');
});

test('releaseCanvasPanShortcut forwards its options and forces release', () => {
  const env = makeEnvironment();
  setCanvasPanShortcutHeld(true, env);
  releaseCanvasPanShortcut(env);
  assert.equal(isCanvasPanShortcutHeld(), false);
  assert.equal(env.windowObject['_spaceHeld'], false);
  assert.equal(env.element.style.cursor, '');
});

test('only a strict boolean true holds the shortcut', () => {
  const env = makeEnvironment();
  for (const value of [1, 'true', {}, [], 'x', 0, null, undefined]) {
    setCanvasPanShortcutHeld(value, env);
    assert.equal(isCanvasPanShortcutHeld(), false, `value ${JSON.stringify(value)} must not hold`);
    assert.equal(env.windowObject['_spaceHeld'], false);
  }
  setCanvasPanShortcutHeld(true, env);
  assert.equal(isCanvasPanShortcutHeld(), true);
});

test('a missing window object is tolerated', () => {
  const env = makeEnvironment();
  assert.doesNotThrow(() => setCanvasPanShortcutHeld(true, { documentObject: env.documentObject }));
  assert.equal(isCanvasPanShortcutHeld(), true);
  assert.equal(env.element.style.cursor, 'var(--grab-cursor)');
});

test('a missing document object is tolerated', () => {
  const env = makeEnvironment();
  assert.doesNotThrow(() => setCanvasPanShortcutHeld(true, { windowObject: env.windowObject }));
  assert.equal(isCanvasPanShortcutHeld(), true);
  assert.equal(env.windowObject['_spaceHeld'], true);
});

test('both environment objects missing is tolerated', () => {
  assert.doesNotThrow(() => setCanvasPanShortcutHeld(true, {}));
  assert.equal(isCanvasPanShortcutHeld(), true);
});

test('a document without getElementById is tolerated', () => {
  const windowObject = {};
  assert.doesNotThrow(() =>
    setCanvasPanShortcutHeld(true, { windowObject: windowObject, documentObject: {} }),
  );
  assert.equal(isCanvasPanShortcutHeld(), true);
  assert.equal(windowObject['_spaceHeld'], true);
});

test('a missing canvas wrapper element is tolerated', () => {
  const env = makeEnvironment();
  const documentObject = { getElementById: () => null };
  assert.doesNotThrow(() =>
    setCanvasPanShortcutHeld(true, { windowObject: env.windowObject, documentObject: documentObject }),
  );
  assert.equal(isCanvasPanShortcutHeld(), true);
  assert.equal(env.windowObject['_spaceHeld'], true);
});

test('unrelated element ids are not touched', () => {
  const other = { style: { cursor: 'kept' } };
  const documentObject = { getElementById: (id) => (id === 'other' ? other : null) };
  setCanvasPanShortcutHeld(true, { windowObject: {}, documentObject: documentObject });
  assert.equal(other.style.cursor, 'kept');
});
