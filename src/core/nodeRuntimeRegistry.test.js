import assert from 'node:assert/strict';
import test from 'node:test';

import nodeRuntimeRegistry, { createNodeRuntimeRegistry } from './nodeRuntimeRegistry.js';

function createRuntime() {
  return { runGeneration: async () => ({ ok: true }) };
}

test('exports a live singleton created by the factory', () => {
  assert.equal(typeof nodeRuntimeRegistry.register, 'function');
  assert.equal(typeof nodeRuntimeRegistry.registerResolver, 'function');
  assert.equal(typeof nodeRuntimeRegistry.resolve, 'function');
  assert.equal(typeof nodeRuntimeRegistry.get, 'function');
});

test('register stores a runtime that exposes a generation method', () => {
  const registry = createNodeRuntimeRegistry();
  const runtime = createRuntime();
  assert.equal(registry.register('node-1', runtime), runtime);
  assert.equal(registry.get('node-1'), runtime);
});

test('register accepts any single generation method as the capability marker', () => {
  const registry = createNodeRuntimeRegistry();
  for (const [index, runtime] of [
    { runGeneration: () => {} },
    { getGenerationStatus: () => {} },
    { cancelGeneration: () => {} },
    { resumeGeneration: () => {} },
  ].entries()) {
    assert.equal(registry.register(`node-${index}`, runtime), runtime);
  }
  assert.equal(registry.get('node-3').resumeGeneration instanceof Function, true);
});

test('register rejects an empty, missing or non-object runtime', () => {
  const registry = createNodeRuntimeRegistry();
  assert.equal(registry.register('', createRuntime()), null);
  assert.equal(registry.register('   ', createRuntime()), null);
  assert.equal(registry.register('node-x', null), null);
  assert.equal(registry.register('node-x', undefined), null);
  assert.equal(registry.register('node-x', 'runtime'), null);
  assert.equal(registry.get('node-x'), null);
});

test('register rejects an object without any generation method', () => {
  const registry = createNodeRuntimeRegistry();
  assert.equal(registry.register('node-1', { someMethod: () => {} }), null);
  assert.equal(registry.get('node-1'), null);
});

test('register normalises the node id', () => {
  const registry = createNodeRuntimeRegistry();
  const runtime = createRuntime();
  registry.register('  node-spaced  ', runtime);
  assert.equal(registry.get('node-spaced'), runtime);
  assert.equal(registry.get('  node-spaced  '), runtime);
});

test('registering the same id twice replaces the runtime', () => {
  const registry = createNodeRuntimeRegistry();
  const first = createRuntime();
  const second = createRuntime();
  registry.register('node-1', first);
  registry.register('node-1', second);
  assert.equal(registry.get('node-1'), second);
});

test('get returns null for an unknown or empty id', () => {
  const registry = createNodeRuntimeRegistry();
  registry.register('node-1', createRuntime());
  assert.equal(registry.get('missing'), null);
  assert.equal(registry.get(''), null);
  assert.equal(registry.get(undefined), null);
});

test('unregister reports whether it removed anything', () => {
  const registry = createNodeRuntimeRegistry();
  registry.register('node-1', createRuntime());
  assert.equal(registry.unregister('node-1'), true);
  assert.equal(registry.unregister('node-1'), false);
  assert.equal(registry.unregister(''), false);
  assert.equal(registry.get('node-1'), null);
});

test('clear removes every runtime', () => {
  const registry = createNodeRuntimeRegistry();
  registry.register('node-1', createRuntime());
  registry.register('node-2', createRuntime());
  registry.clear();
  assert.equal(registry.get('node-1'), null);
  assert.equal(registry.get('node-2'), null);
});

test('clear leaves registered resolvers intact', () => {
  const registry = createNodeRuntimeRegistry();
  registry.registerResolver('image', () => 'resolved');
  registry.clear();
  assert.equal(
    registry.resolve('node-1', { store: { getState: () => ({ nodes: { 'node-1': { type: 'image' } } }) } }),
    'resolved',
  );
});

test('registerResolver throws a TypeError for a non-function resolver', () => {
  const registry = createNodeRuntimeRegistry();
  assert.throws(() => registry.registerResolver('image', null), TypeError);
  assert.throws(() => registry.registerResolver('image', 'resolver'), TypeError);
  assert.throws(() => registry.registerResolver('image', {}), TypeError);
});

test('registerResolver returns an unsubscribe that removes the resolver', () => {
  const registry = createNodeRuntimeRegistry();
  const store = { getState: () => ({ nodes: { 'node-1': { type: 'image' } } }) };
  const unsubscribe = registry.registerResolver('image', () => 'resolved');
  assert.equal(registry.resolve('node-1', { store }), 'resolved');
  unsubscribe();
  assert.equal(registry.resolve('node-1', { store }), null);
});

test('the unsubscribe is a no-op once the resolver has been replaced', () => {
  const registry = createNodeRuntimeRegistry();
  const store = { getState: () => ({ nodes: { 'node-1': { type: 'image' } } }) };
  const firstUnsubscribe = registry.registerResolver('image', () => 'first');
  registry.registerResolver('image', () => 'second');
  firstUnsubscribe();
  assert.equal(registry.resolve('node-1', { store }), 'second');
});

test('the unsubscribe of an already-removed resolver is safe to call twice', () => {
  const registry = createNodeRuntimeRegistry();
  const unsubscribe = registry.registerResolver('image', () => 'resolved');
  unsubscribe();
  unsubscribe();
});

test('resolve prefers a type resolver over a direct registration', () => {
  const registry = createNodeRuntimeRegistry();
  const runtime = createRuntime();
  registry.register('node-1', runtime);
  registry.registerResolver('image', () => 'from-resolver');
  assert.equal(
    registry.resolve('node-1', { store: { getState: () => ({ nodes: { 'node-1': { type: 'image' } } }) } }),
    'from-resolver',
  );
});

test('resolve falls back to the direct registration when the type has no resolver', () => {
  const registry = createNodeRuntimeRegistry();
  const runtime = createRuntime();
  registry.register('node-1', runtime);
  assert.equal(
    registry.resolve('node-1', { store: { getState: () => ({ nodes: { 'node-1': { type: 'video' } } }) } }),
    runtime,
  );
});

test('resolve returns null when neither a resolver nor a direct registration matches', () => {
  const registry = createNodeRuntimeRegistry();
  registry.registerResolver('image', () => 'from-resolver');
  assert.equal(
    registry.resolve('node-1', { store: { getState: () => ({ nodes: { 'node-1': { type: 'video' } } }) } }),
    null,
  );
  assert.equal(registry.resolve('node-1'), null);
});

test('resolve returns null for an empty node id even when a resolver exists', () => {
  const registry = createNodeRuntimeRegistry();
  let resolverCalls = 0;
  registry.registerResolver('image', () => {
    resolverCalls += 1;
    return 'from-resolver';
  });
  assert.equal(registry.resolve('   ', { store: { getState: () => ({ nodes: {} }) } }), null);
  assert.equal(resolverCalls, 0);
});

test('resolve prefers getStateRaw over getState', () => {
  const registry = createNodeRuntimeRegistry();
  const store = {
    getStateRaw: () => ({ nodes: { 'node-1': { type: 'image' } } }),
    getState: () => ({ nodes: { 'node-1': { type: 'video' } } }),
  };
  registry.registerResolver('image', () => 'image-runtime');
  registry.registerResolver('video', () => 'video-runtime');
  assert.equal(registry.resolve('node-1', { store }), 'image-runtime');
});

test('resolve falls back to getState when getStateRaw is absent', () => {
  const registry = createNodeRuntimeRegistry();
  const store = { getState: () => ({ nodes: { 'node-1': { type: 'video' } } }) };
  registry.registerResolver('video', () => 'video-runtime');
  assert.equal(registry.resolve('node-1', { store }), 'video-runtime');
});

test('resolve tolerates a store that answers nothing', () => {
  const registry = createNodeRuntimeRegistry();
  registry.registerResolver('image', () => 'from-resolver');
  assert.equal(registry.resolve('node-1', { store: {} }), null);
  assert.equal(registry.resolve('node-1', { store: { getState: () => ({}) } }), null);
  assert.equal(registry.resolve('node-1', { store: { getState: () => undefined } }), null);
  assert.equal(registry.resolve('node-1', {}), null);
});

test('resolve passes the normalised id and the whole options object to the resolver', () => {
  const registry = createNodeRuntimeRegistry();
  const seen = [];
  registry.registerResolver('image', (...args) => {
    seen.push(args);
    return 'from-resolver';
  });
  const store = { getState: () => ({ nodes: { 'node-1': { type: 'image' } } }) };
  registry.resolve('  node-1  ', { store, extra: 'kept' });
  assert.equal(seen.length, 1);
  assert.equal(seen[0][0], 'node-1');
  assert.equal(seen[0][1].extra, 'kept');
  assert.equal(seen[0][1].store, store);
});

test('resolve does not call the resolver when the node id is unknown to the store', () => {
  const registry = createNodeRuntimeRegistry();
  let resolverCalls = 0;
  registry.registerResolver('image', () => {
    resolverCalls += 1;
    return 'from-resolver';
  });
  assert.equal(registry.resolve('node-absent', { store: { getState: () => ({ nodes: {} }) } }), null);
  assert.equal(resolverCalls, 0);
});

test('resolve ignores a node record without a type', () => {
  const registry = createNodeRuntimeRegistry();
  registry.registerResolver('image', () => 'from-resolver');
  assert.equal(
    registry.resolve('node-1', { store: { getState: () => ({ nodes: { 'node-1': {} } }) } }),
    null,
  );
});

test('resolvers are isolated per registry instance', () => {
  const first = createNodeRuntimeRegistry();
  const second = createNodeRuntimeRegistry();
  first.registerResolver('image', () => 'first');
  const store = { getState: () => ({ nodes: { 'node-1': { type: 'image' } } }) };
  assert.equal(first.resolve('node-1', { store }), 'first');
  assert.equal(second.resolve('node-1', { store }), null);
});
