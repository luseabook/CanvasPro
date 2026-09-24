import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAssetIndexCoordinator } from './assetIndexCoordinator.js';

function createRig({ initial = { version: 1, assets: {} }, now = () => '2026-01-01T00:00:00.000Z' } = {}) {
  const state = { index: initial, writes: [] };
  const coordinator = createAssetIndexCoordinator({
    readIndex: () => state.index,
    writeIndex: (index) => {
      state.writes.push(index);
      state.index = index;
    },
    now: now,
  });
  return { coordinator, state };
}

test('a missing argument set throws for each required function', () => {
  assert.throws(() => createAssetIndexCoordinator({ writeIndex: () => {} }), /readIndex must be a function/);
  assert.throws(() => createAssetIndexCoordinator({ readIndex: () => {} }), /writeIndex must be a function/);
  assert.throws(
    () => createAssetIndexCoordinator({ readIndex: () => {}, writeIndex: () => {}, now: 1 }),
    /now must be a function/,
  );
});

test('commit stamps assetId, bumps the revision and records updatedAt', () => {
  const { coordinator, state } = createRig();
  const record = coordinator.commit('asset-1', () => ({ kind: 'image', status: 'ready' }));
  assert.deepEqual(record, {
    kind: 'image',
    status: 'ready',
    assetId: 'asset-1',
    assetRevision: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  assert.equal(state.index.assets['asset-1'], record);
  assert.equal(state.writes.length, 1);
  assert.equal(state.writes[0].version, 1);
});

test('repeated commits keep incrementing the revision', () => {
  const { coordinator } = createRig({ initial: { assets: { a: { assetRevision: 41 } } } });
  assert.equal(coordinator.commit('a', (existing) => ({ ...existing, status: 'processing' })).assetRevision, 42);
  assert.equal(coordinator.commit('a', (existing) => ({ ...existing, status: 'ready' })).assetRevision, 43);
});

test('the updater receives the previous record and the full index snapshot', () => {
  const { coordinator } = createRig({ initial: { version: 1, assets: { a: { assetId: 'a', kind: 'video' } } } });
  const seen = [];
  coordinator.commit('a', (existing, index) => {
    seen.push({ existing, assetKeys: Object.keys(index.assets), version: index.version });
    return { ...existing, status: 'ready' };
  });
  assert.deepEqual(seen, [
    { existing: { assetId: 'a', kind: 'video' }, assetKeys: ['a'], version: 1 },
  ]);
});

test('an updater returning nothing leaves the index untouched', () => {
  const { coordinator, state } = createRig({ initial: { assets: { a: { assetId: 'a' } } } });
  assert.equal(coordinator.commit('a', () => null), null);
  assert.equal(coordinator.commit('a', () => undefined), null);
  assert.equal(state.writes.length, 0);
});

test('an assetId that is missing from the index still commits when the updater returns a record', () => {
  const { coordinator } = createRig();
  const record = coordinator.commit('fresh', () => ({ kind: 'audio' }));
  assert.equal(record.assetRevision, 1);
});

test('an async updater is rejected instead of writing a promise into the index', () => {
  const { coordinator, state } = createRig();
  assert.throws(
    () => coordinator.commit('a', async () => ({ kind: 'image' })),
    /asset index updater must be synchronous/,
  );
  assert.equal(state.writes.length, 0);
});

test('blank assetIds and non-function updaters are rejected', () => {
  const { coordinator } = createRig();
  assert.throws(() => coordinator.commit('  ', () => ({})), /assetId must be a non-empty string/);
  assert.throws(() => coordinator.commit(null, () => ({})), /assetId must be a non-empty string/);
  assert.throws(() => coordinator.commit('a', 'nope'), /updater must be a function/);
});

test('an out-of-range previous revision is a RangeError', () => {
  const { coordinator } = createRig({ initial: { assets: { a: { assetRevision: -1 } } } });
  assert.throws(
    () => coordinator.commit('a', (existing) => ({ ...existing })),
    /asset revision must be a non-negative safe integer/,
  );
  const { coordinator: other } = createRig({ initial: { assets: { a: { assetRevision: 1.5 } } } });
  assert.throws(() => other.commit('a', (existing) => ({ ...existing })), RangeError);
});

test('patch merges fields into the existing record and returns null for unknown assets', () => {
  const { coordinator } = createRig({
    initial: { assets: { a: { assetId: 'a', kind: 'video', status: 'processing' } } },
  });
  const patched = coordinator.patch('a', { status: 'ready', error: '' });
  assert.deepEqual(patched, {
    assetId: 'a',
    kind: 'video',
    status: 'ready',
    error: '',
    assetRevision: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  assert.equal(coordinator.patch('missing', { status: 'ready' }), null);
});

test('patch ignores non-object field payloads instead of corrupting the record', () => {
  const { coordinator } = createRig({ initial: { assets: { a: { assetId: 'a', status: 'processing' } } } });
  assert.deepEqual(coordinator.patch('a', null), {
    assetId: 'a',
    status: 'processing',
    assetRevision: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
});

test('patch with expectedMediaTaskId refuses to clobber a newer task', () => {
  const { coordinator } = createRig({
    initial: { assets: { a: { assetId: 'a', mediaTaskId: 'task-2', status: 'processing' } } },
  });
  assert.equal(coordinator.patch('a', { status: 'ready' }, { expectedMediaTaskId: 'task-1' }), null);
  assert.ok(coordinator.patch('a', { status: 'ready' }, { expectedMediaTaskId: 'task-2' }));
  assert.ok(coordinator.patch('a', { status: 'ready' }, { expectedMediaTaskId: '  ' }));
});
