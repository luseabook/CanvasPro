import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppProjectContext, DEFAULT_APP_PROJECT_ID } from './projectContext.js';

test('the default project id is the frozen constant', () => {
  assert.equal(DEFAULT_APP_PROJECT_ID, 'default_v2_project');
});

test('resolves the live project id from the window object', () => {
  const context = createAppProjectContext({ windowObject: { currentProjectId: 'p-1' } });
  assert.equal(context.getCurrentProjectId(), 'p-1');
  assert.equal(context.getCurrentProjectIdOrNull(), 'p-1');
});

test('trims the live project id', () => {
  const context = createAppProjectContext({ windowObject: { currentProjectId: '  p-2 \n' } });
  assert.equal(context.getCurrentProjectIdOrNull(), 'p-2');
});

test('an unset live id falls back to the default for getCurrentProjectId', () => {
  const context = createAppProjectContext({ windowObject: {} });
  assert.equal(context.getCurrentProjectId(), DEFAULT_APP_PROJECT_ID);
  assert.equal(context.getCurrentProjectIdOrNull(), null);
});

test('a whitespace-only live id counts as unset', () => {
  const context = createAppProjectContext({ windowObject: { currentProjectId: '   ' } });
  assert.equal(context.getCurrentProjectIdOrNull(), null);
  assert.equal(context.getCurrentProjectId(), DEFAULT_APP_PROJECT_ID);
});

test('honours a custom default project id', () => {
  const context = createAppProjectContext({ windowObject: {}, defaultProjectId: '  custom-id ' });
  assert.equal(context.getCurrentProjectId(), 'custom-id');
});

test('an empty custom default collapses to the built-in constant', () => {
  const context = createAppProjectContext({ windowObject: {}, defaultProjectId: '   ' });
  assert.equal(context.getCurrentProjectId(), DEFAULT_APP_PROJECT_ID);
});

test('coerces a numeric live id through String', () => {
  const context = createAppProjectContext({ windowObject: { currentProjectId: 42 } });
  assert.equal(context.getCurrentProjectIdOrNull(), '42');
});

test('an absent window object leaves the default in place', () => {
  const context = createAppProjectContext({ windowObject: null });
  assert.equal(context.getCurrentProjectIdOrNull(), null);
  assert.equal(context.getCurrentProjectId(), DEFAULT_APP_PROJECT_ID);
});

test('the two getters track later mutations of the window object', () => {
  const windowObject = {};
  const context = createAppProjectContext({ windowObject });
  assert.equal(context.getCurrentProjectIdOrNull(), null);
  windowObject.currentProjectId = 'p-3';
  assert.equal(context.getCurrentProjectIdOrNull(), 'p-3');
  assert.equal(context.getCurrentProjectId(), 'p-3');
});

test('the default window object is the global window', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: { currentProjectId: 'from-global' },
  });
  try {
    assert.equal(createAppProjectContext().getCurrentProjectId(), 'from-global');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  }
});
