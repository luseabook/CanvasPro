import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_WORKSPACE_INTENTS,
  createPersonReplacementWorkspaceIntentPort,
} from './personReplacementWorkspaceIntentPort.js';

test('exposes a frozen intent catalog with string values', () => {
  assert.equal(Object.isFrozen(PERSON_REPLACEMENT_WORKSPACE_INTENTS), true);
  assert.equal(PERSON_REPLACEMENT_WORKSPACE_INTENTS.PREVIEW_GENERATION, 'preview-generation');
  assert.equal(PERSON_REPLACEMENT_WORKSPACE_INTENTS.PROCESS_SOURCES, 'process-sources');
  assert.equal(PERSON_REPLACEMENT_WORKSPACE_INTENTS.DROP_PROJECT_PACKAGE, 'drop-project-package');
  assert.equal(PERSON_REPLACEMENT_WORKSPACE_INTENTS.CLOSE, 'close');

  for (const value of Object.values(PERSON_REPLACEMENT_WORKSPACE_INTENTS)) {
    assert.equal(typeof value, 'string');
    assert.ok(value.length > 0);
  }
  assert.equal(
    new Set(Object.values(PERSON_REPLACEMENT_WORKSPACE_INTENTS)).size,
    Object.keys(PERSON_REPLACEMENT_WORKSPACE_INTENTS).length,
  );
});

test('rejects a handler bag that is not a plain object', () => {
  for (const handlers of [null, 'nope', 42, ['preview-generation']]) {
    assert.throws(
      () => createPersonReplacementWorkspaceIntentPort({ handlers }),
      /Replacement Studio workspace intent handlers must be an object\./u,
    );
  }
  assert.doesNotThrow(() => createPersonReplacementWorkspaceIntentPort());
});

test('rejects unsupported intent names and non-function handlers', () => {
  assert.throws(
    () => createPersonReplacementWorkspaceIntentPort({ handlers: { 'not-an-intent': () => {} } }),
    /Unsupported Replacement Studio workspace intent: not-an-intent/u,
  );
  assert.throws(
    () => createPersonReplacementWorkspaceIntentPort({ handlers: { 'preview-generation': 'nope' } }),
    /Replacement Studio workspace intent handler must be a function: preview-generation/u,
  );
});

test('normalizes intent names when registering handlers', () => {
  const port = createPersonReplacementWorkspaceIntentPort({ handlers: { '  close  ': () => 'closed' } });

  assert.equal(port.supports('close'), true);
  assert.equal(port.supports('  close '), true);
  assert.equal(port.request('close'), 'closed');
});

test('supports only distinguishes known and registered intents', () => {
  const port = createPersonReplacementWorkspaceIntentPort({ handlers: { 'preview-generation': () => {} } });

  assert.equal(port.supports('preview-generation'), true);
  assert.equal(port.supports('close'), false);
  assert.equal(port.supports('not-an-intent'), false);
  assert.equal(port.supports(''), false);
  assert.equal(port.supports(), false);
});

test('request forwards every argument and returns the handler result', () => {
  const calls = [];
  const port = createPersonReplacementWorkspaceIntentPort({
    handlers: {
      'select-source-video': (...args) => {
        calls.push(args);
        return args.length;
      },
    },
  });

  assert.equal(port.request('select-source-video', 'a', 'b', 3), 3);
  assert.deepEqual(calls, [['a', 'b', 3]]);
});

test('request throws for unknown intents and returns undefined when unregistered', () => {
  const port = createPersonReplacementWorkspaceIntentPort({ handlers: { close: () => 'x' } });

  assert.throws(
    () => port.request('not-an-intent'),
    /Unsupported Replacement Studio workspace intent: not-an-intent/u,
  );
  assert.equal(port.request('preview-generation'), undefined);
});

test('the port surface is frozen', () => {
  const port = createPersonReplacementWorkspaceIntentPort({ handlers: { close: () => {} } });

  assert.equal(Object.isFrozen(port), true);
});
