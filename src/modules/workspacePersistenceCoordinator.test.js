import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspacePersistenceCoordinator } from './workspacePersistenceCoordinator.js';

function makeTimers() {
  const pending = new Map();
  const cleared = [];
  let nextId = 1;
  return {
    pending,
    cleared,
    set(fn, delay) {
      const id = nextId;
      nextId += 1;
      pending.set(id, { fn, delay });
      return id;
    },
    clear(id) {
      cleared.push(id);
      pending.delete(id);
    },
    fire(id) {
      const entry = pending.get(id);
      pending.delete(id);
      entry.fn();
      return entry;
    },
    ids() {
      return [...pending.keys()];
    },
    delays() {
      return [...pending.values()].map((entry) => entry.delay);
    },
  };
}

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

function setup(over = {}) {
  const timers = makeTimers();
  const states = [];
  const errors = [];
  const saveCalls = [];
  let snapshotSeq = 0;
  const providedSave = 'save' in over ? over.save : async (snapshot) => snapshot;
  const providedSnapshot = 'getSnapshot' in over ? over.getSnapshot : () => ({ seq: (snapshotSeq += 1) });
  const { save: _save, getSnapshot: _getSnapshot, ...rest } = over;
  const coordinator = createWorkspacePersistenceCoordinator({
    save: async (snapshot) => {
      saveCalls.push(snapshot);
      return providedSave(snapshot);
    },
    getSnapshot: providedSnapshot,
    setTimeoutFn: timers.set,
    clearTimeoutFn: timers.clear,
    onStateChange: (state) => states.push(state),
    onError: (error) => errors.push(error),
    ...rest,
  });
  return {
    coordinator,
    timers,
    states,
    errors,
    saveCalls,
    statuses: () => states.map((state) => state.status),
  };
}

test('starts idle without usable save and snapshot callbacks', () => {
  const coordinator = createWorkspacePersistenceCoordinator();
  assert.deepEqual(coordinator.getState(), { status: 'idle', error: '', retryAttempt: 0 });
  assert.equal(coordinator.isReady(), true);
  assert.equal(coordinator.getRevision(), 0);
  assert.equal(coordinator.getPersistedRevision(), 0);
  assert.equal(coordinator.isDirty(), false);
});

test('starts saved when both callbacks are usable', () => {
  const harness = setup();
  assert.deepEqual(harness.coordinator.getState(), { status: 'saved', error: '', retryAttempt: 0 });
});

test('exposes a frozen coordinator surface', () => {
  const coordinator = createWorkspacePersistenceCoordinator();
  assert.equal(Object.isFrozen(coordinator), true);
  assert.deepEqual(Object.keys(coordinator).sort(), [
    'destroy',
    'flush',
    'getPersistedRevision',
    'getRevision',
    'getState',
    'isDirty',
    'isReady',
    'schedule',
    'setHydrationError',
    'setReady',
  ]);
});

test('getState and onStateChange expose copies of the internal state', () => {
  const harness = setup();
  const snapshot = harness.coordinator.getState();
  snapshot.status = 'tampered';
  assert.equal(harness.coordinator.getState().status, 'saved');

  harness.coordinator.schedule();
  const reported = harness.states[0];
  reported.error = 'tampered';
  assert.equal(harness.coordinator.getState().error, '');
});

test('schedule bumps the revision and coalesces into one debounced save', () => {
  const harness = setup();
  assert.equal(harness.coordinator.schedule(), 1);
  assert.equal(harness.coordinator.schedule(), 2);
  assert.equal(harness.coordinator.schedule(), 3);
  assert.equal(harness.timers.pending.size, 1);
  assert.deepEqual(harness.timers.delays(), [500]);
  assert.equal(harness.coordinator.getRevision(), 3);
  assert.equal(harness.coordinator.getPersistedRevision(), 0);
  assert.equal(harness.coordinator.isDirty(), true);
  assert.deepEqual(harness.statuses(), ['pending', 'pending', 'pending']);
  assert.deepEqual(harness.saveCalls, []);
});

test('firing the debounce timer saves the snapshot once', async () => {
  const harness = setup();
  harness.coordinator.schedule();
  const [debounceId] = harness.timers.ids();
  harness.timers.fire(debounceId);
  assert.equal(harness.coordinator.getState().status, 'saving');

  const result = await harness.coordinator.flush();
  assert.deepEqual(harness.saveCalls, [{ seq: 1 }]);
  assert.deepEqual(result, { seq: 1 });
  assert.deepEqual(harness.coordinator.getState(), { status: 'saved', error: '', retryAttempt: 0 });
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
  assert.equal(harness.coordinator.isDirty(), false);
  assert.deepEqual(harness.statuses(), ['pending', 'saving', 'saved']);
  assert.equal(harness.timers.pending.size, 0);
});

test('honours a custom debounce delay', () => {
  const harness = setup({ debounceMs: 25 });
  harness.coordinator.schedule();
  assert.deepEqual(harness.timers.delays(), [25]);
});

test('falls back to the default debounce for unusable delays', () => {
  for (const debounceMs of [-1, '-5', 'nope', NaN, Infinity, {}]) {
    const harness = setup({ debounceMs });
    harness.coordinator.schedule();
    assert.deepEqual(harness.timers.delays(), [500], String(debounceMs));
  }
});

test('accepts a zero or blank debounce as a real timer', () => {
  for (const debounceMs of [0, '', null]) {
    const harness = setup({ debounceMs });
    harness.coordinator.schedule();
    assert.equal(harness.timers.pending.size, 1);
    const [delay] = harness.timers.delays();
    assert.ok(delay === 0, `expected a zero delay for ${String(debounceMs)}`);
  }
});

test('keeps a negative zero delay instead of the fallback', () => {
  const harness = setup({ debounceMs: -0 });
  harness.coordinator.schedule();
  const [delay] = harness.timers.delays();
  assert.ok(delay === 0);
});

test('ignores a longer delay while a shorter debounce is pending', () => {
  const harness = setup({ debounceMs: 300 });
  harness.coordinator.schedule({ delayMs: 100 });
  const [firstId] = harness.timers.ids();
  harness.coordinator.schedule({ delayMs: 250 });
  assert.equal(harness.timers.pending.size, 1);
  assert.equal(harness.timers.pending.get(firstId).delay, 100);
  assert.deepEqual(harness.timers.cleared, []);
});

test('a shorter delay replaces a pending longer one', () => {
  const harness = setup({ debounceMs: 300 });
  harness.coordinator.schedule();
  harness.coordinator.schedule({ delayMs: 20 });
  assert.equal(harness.timers.pending.size, 1);
  assert.deepEqual(harness.timers.delays(), [20]);
  assert.deepEqual(harness.timers.cleared, [1]);
});

test('schedule with immediate saves without a timer', async () => {
  const harness = setup();
  assert.equal(harness.coordinator.schedule({ immediate: true }), 1);
  assert.equal(harness.timers.pending.size, 0);
  const result = await harness.coordinator.flush();
  assert.deepEqual(result, { seq: 1 });
  assert.deepEqual(harness.statuses(), ['pending', 'saving', 'saved']);
});

test('does not mutate the options object passed to schedule', () => {
  const harness = setup();
  const options = { immediate: false, delayMs: 10 };
  harness.coordinator.schedule(options);
  assert.deepEqual(options, { immediate: false, delayMs: 10 });
});

test('schedule stops scheduling when the timer function is missing', () => {
  const harness = setup({ setTimeoutFn: null });
  assert.equal(harness.coordinator.schedule(), 1);
  assert.equal(harness.timers.pending.size, 0);
  assert.equal(harness.coordinator.getState().status, 'pending');
  assert.equal(harness.coordinator.isDirty(), true);
});

test('max wait forces a save while the debounce keeps resetting', async () => {
  const harness = setup({ debounceMs: 1000, maxWaitMs: 200 });
  harness.coordinator.schedule();
  harness.coordinator.schedule();
  assert.equal(harness.timers.pending.size, 2);
  assert.deepEqual(
    harness.timers.delays().sort((a, b) => a - b),
    [200, 1000],
  );

  const maxWaitId = harness.timers.ids().find((id) => harness.timers.pending.get(id).delay === 200);
  harness.timers.fire(maxWaitId);
  await harness.coordinator.flush();
  assert.equal(harness.coordinator.getState().status, 'saved');
  assert.equal(harness.coordinator.getPersistedRevision(), 2);
  assert.equal(harness.timers.pending.size, 0);
});

test('does not schedule a max wait timer when it is not positive', () => {
  for (const maxWaitMs of [0, -5, 'nope']) {
    const harness = setup({ maxWaitMs });
    harness.coordinator.schedule();
    assert.equal(harness.timers.pending.size, 1, String(maxWaitMs));
  }
});

test('rejects any ready flag that is not literally true', () => {
  assert.equal(setup({ ready: 1 }).coordinator.isReady(), false);
  assert.equal(setup({ ready: 'true' }).coordinator.isReady(), false);
  assert.equal(setup({ ready: undefined }).coordinator.isReady(), true);
  assert.equal(setup({ ready: true }).coordinator.isReady(), true);
});

test('setReady only accepts the literal true', () => {
  const harness = setup();
  harness.coordinator.setReady(1);
  assert.equal(harness.coordinator.isReady(), false);
  harness.coordinator.setReady(true);
  assert.equal(harness.coordinator.isReady(), true);
});

test('schedule tracks revisions but stays idle while not ready', () => {
  const harness = setup({ ready: false });
  assert.equal(harness.coordinator.schedule(), 1);
  assert.equal(harness.timers.pending.size, 0);
  assert.equal(harness.coordinator.getState().status, 'pending');
  assert.equal(harness.coordinator.isDirty(), true);
  assert.deepEqual(harness.saveCalls, []);
});

test('setReady(true) debounces the pending revision', async () => {
  const harness = setup({ ready: false, debounceMs: 40 });
  harness.coordinator.schedule();
  harness.coordinator.setReady(true);
  assert.deepEqual(harness.timers.delays(), [40]);
  const [debounceId] = harness.timers.ids();
  harness.timers.fire(debounceId);
  await harness.coordinator.flush();
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
  assert.equal(harness.coordinator.getState().status, 'saved');
});

test('setReady(true, immediate) drains at once', async () => {
  const harness = setup({ ready: false });
  harness.coordinator.schedule();
  harness.coordinator.setReady(true, { immediate: true });
  assert.equal(harness.timers.pending.size, 0);
  const result = await harness.coordinator.flush();
  assert.deepEqual(result, { seq: 1 });
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
});

test('setReady(false) stops further saves and is a no-op when clean', () => {
  const harness = setup();
  harness.coordinator.setReady(false);
  assert.equal(harness.coordinator.isReady(), false);
  harness.coordinator.schedule();
  assert.equal(harness.timers.pending.size, 0);
  assert.deepEqual(harness.saveCalls, []);
});

test('setHydrationError clears timers and records the failure', () => {
  const harness = setup({ debounceMs: 30 });
  harness.coordinator.schedule();
  harness.coordinator.setHydrationError(new Error('hydrate failed'));
  assert.equal(harness.coordinator.isReady(), false);
  assert.deepEqual(harness.coordinator.getState(), {
    status: 'error',
    error: 'hydrate failed',
    retryAttempt: 0,
  });
  assert.equal(harness.timers.pending.size, 0);
  assert.deepEqual(harness.timers.cleared, [1]);
});

test('setHydrationError falls back to the default message', () => {
  const cases = [
    [new Error('boom'), 'boom'],
    [{ message: '   spaced   ' }, 'spaced'],
    ['plain', 'plain'],
    [{}, '[object Object]'],
    [null, '自动保存失败'],
    [undefined, '自动保存失败'],
    ['   ', '自动保存失败'],
    [0, '自动保存失败'],
  ];
  for (const [input, expected] of cases) {
    const harness = setup();
    harness.coordinator.setHydrationError(input);
    assert.equal(harness.coordinator.getState().error, expected, String(input));
  }
});

test('setHydrationError then setReady(true) resumes the save', async () => {
  const harness = setup();
  harness.coordinator.schedule();
  harness.coordinator.setHydrationError('nope');
  harness.coordinator.setReady(true, { immediate: true });
  await harness.coordinator.flush();
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
  assert.equal(harness.coordinator.getState().status, 'saved');
});

test('a failing save records the error and schedules a retry', async () => {
  const failure = new Error('disk full');
  const harness = setup({
    save: async () => {
      throw failure;
    },
    retryBaseMs: 100,
    retryMaxMs: 1000,
  });
  harness.coordinator.schedule();
  const [debounceId] = harness.timers.ids();
  harness.timers.fire(debounceId);

  await assert.rejects(harness.coordinator.flush(), (error) => error === failure);
  assert.deepEqual(harness.coordinator.getState(), {
    status: 'error',
    error: 'disk full',
    retryAttempt: 1,
  });
  assert.deepEqual(harness.errors, [failure]);
  assert.deepEqual(harness.statuses(), ['pending', 'saving', 'error']);
  assert.deepEqual(harness.timers.delays(), [100]);
  assert.equal(harness.coordinator.getPersistedRevision(), 0);
  assert.equal(harness.coordinator.isDirty(), true);
});

test('retries with exponential backoff capped at retryMaxMs', async () => {
  const harness = setup({
    save: async () => {
      throw new Error('down');
    },
    retryBaseMs: 100,
    retryMaxMs: 250,
  });
  harness.coordinator.schedule({ immediate: true });
  await assert.rejects(harness.coordinator.flush());

  for (const expected of [100, 200, 250]) {
    assert.deepEqual(harness.timers.delays(), [expected]);
    const [retryId] = harness.timers.ids();
    harness.timers.fire(retryId);
    await assert.rejects(harness.coordinator.flush());
  }
  assert.equal(harness.coordinator.getState().retryAttempt, 4);
  assert.deepEqual(harness.timers.delays(), [250]);
});

test('never retries faster than the base delay when the max is smaller', async () => {
  const harness = setup({
    save: async () => {
      throw new Error('down');
    },
    retryBaseMs: 500,
    retryMaxMs: 100,
  });
  harness.coordinator.schedule({ immediate: true });
  await assert.rejects(harness.coordinator.flush());
  assert.deepEqual(harness.timers.delays(), [500]);

  const [retryId] = harness.timers.ids();
  harness.timers.fire(retryId);
  await assert.rejects(harness.coordinator.flush());
  assert.deepEqual(harness.timers.delays(), [500]);
});

test('a pending retry blocks new debounce schedules', async () => {
  const harness = setup({
    save: async () => {
      throw new Error('down');
    },
    retryBaseMs: 10,
  });
  harness.coordinator.schedule({ immediate: true });
  await assert.rejects(harness.coordinator.flush());
  assert.equal(harness.timers.pending.size, 1);

  assert.equal(harness.coordinator.schedule(), 2);
  assert.equal(harness.timers.pending.size, 1);
  assert.deepEqual(harness.statuses(), ['pending', 'saving', 'error']);
  assert.equal(harness.coordinator.isDirty(), true);
});

test('a successful retry clears the attempt count and reports saved', async () => {
  let attempts = 0;
  const harness = setup({
    save: async (snapshot) => {
      attempts += 1;
      if (attempts === 1) throw new Error('flaky');
      return snapshot;
    },
    retryBaseMs: 10,
  });
  harness.coordinator.schedule();
  const [debounceId] = harness.timers.ids();
  harness.timers.fire(debounceId);
  await assert.rejects(harness.coordinator.flush());
  assert.equal(harness.coordinator.getState().retryAttempt, 1);

  const [retryId] = harness.timers.ids();
  harness.timers.fire(retryId);
  await harness.coordinator.flush();
  assert.deepEqual(harness.coordinator.getState(), { status: 'saved', error: '', retryAttempt: 0 });
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
  assert.equal(attempts, 2);
  assert.deepEqual(harness.statuses(), ['pending', 'saving', 'error', 'saving', 'saved']);
});

test('reports every failed retry through onError', async () => {
  const failure = new Error('still down');
  const harness = setup({
    save: async () => {
      throw failure;
    },
    retryBaseMs: 20,
  });
  harness.coordinator.schedule({ immediate: true });
  await assert.rejects(harness.coordinator.flush());
  assert.deepEqual(harness.errors, [failure]);

  const [retryId] = harness.timers.ids();
  harness.timers.fire(retryId);
  await flushMicrotasks();
  assert.deepEqual(harness.errors, [failure, failure]);
  assert.equal(harness.coordinator.getState().retryAttempt, 2);
});

test('a failed debounced save stays quiet without an onError hook', async () => {
  const timers = makeTimers();
  const coordinator = createWorkspacePersistenceCoordinator({
    save: async () => {
      throw new Error('quiet');
    },
    getSnapshot: () => ({}),
    setTimeoutFn: timers.set,
    clearTimeoutFn: timers.clear,
    retryBaseMs: 1000,
  });
  coordinator.schedule();
  const [debounceId] = timers.ids();
  timers.fire(debounceId);
  await flushMicrotasks();
  assert.equal(coordinator.getState().status, 'error');
  assert.equal(coordinator.getState().error, 'quiet');
});

test('flush resolves with the last saved value when nothing is dirty', async () => {
  const harness = setup();
  assert.equal(await harness.coordinator.flush(), null);
  assert.deepEqual(harness.saveCalls, []);
  assert.deepEqual(harness.states, []);
});

test('flush with force marks a fresh pending revision before draining', async () => {
  const harness = setup();
  harness.coordinator.schedule();
  const [debounceId] = harness.timers.ids();
  harness.timers.fire(debounceId);
  await harness.coordinator.flush();
  assert.equal(harness.coordinator.getRevision(), 1);

  const promise = harness.coordinator.flush({ force: true });
  assert.equal(harness.coordinator.getRevision(), 2);
  assert.deepEqual(harness.statuses().slice(-2), ['pending', 'saving']);
  assert.deepEqual(await promise, { seq: 2 });
  assert.equal(harness.coordinator.getPersistedRevision(), 2);
  assert.equal(harness.saveCalls.length, 2);
});

test('plain flush leaves a persisted revision alone', async () => {
  const harness = setup();
  harness.coordinator.schedule();
  const [debounceId] = harness.timers.ids();
  harness.timers.fire(debounceId);
  await harness.coordinator.flush();
  assert.deepEqual(await harness.coordinator.flush(), { seq: 1 });
  assert.equal(harness.coordinator.getRevision(), 1);
  assert.equal(harness.saveCalls.length, 1);
});

test('flush resolves with the last value while not ready', async () => {
  const harness = setup({ ready: false });
  harness.coordinator.schedule();
  assert.equal(await harness.coordinator.flush({ force: true }), null);
  assert.deepEqual(harness.saveCalls, []);
  assert.equal(harness.coordinator.getRevision(), 1);
});

test('a coordinator without callbacks never saves but tracks revisions', async () => {
  const timers = makeTimers();
  const coordinator = createWorkspacePersistenceCoordinator({
    setTimeoutFn: timers.set,
    clearTimeoutFn: timers.clear,
  });
  assert.equal(coordinator.getState().status, 'idle');
  assert.equal(coordinator.schedule(), 1);
  assert.equal(timers.pending.size, 0);
  assert.equal(coordinator.getState().status, 'idle');
  assert.equal(await coordinator.flush({ force: true }), null);
  assert.equal(coordinator.isDirty(), true);
});

test('a second flush reuses the in-flight promise', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const harness = setup({
    save: async (snapshot) => {
      await gate;
      return snapshot;
    },
  });
  harness.coordinator.schedule();
  const first = harness.coordinator.flush();
  const second = harness.coordinator.flush();
  assert.equal(first, second);
  release();
  await first;
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
  assert.equal(harness.saveCalls.length, 1);
});

test('drains a revision scheduled while a save is in flight', async () => {
  const harness = setup({
    save: async (snapshot) => {
      if (harness.saveCalls.length === 1) harness.coordinator.schedule({ delayMs: 5 });
      return snapshot;
    },
  });
  harness.coordinator.schedule({ immediate: true });
  await harness.coordinator.flush();
  assert.equal(harness.saveCalls.length, 2);
  assert.equal(harness.coordinator.getPersistedRevision(), 2);
  assert.equal(harness.timers.pending.size, 0);
  assert.deepEqual(harness.statuses(), ['pending', 'saving', 'saving', 'saved']);
});

test('passes the snapshot through untouched', async () => {
  const snapshot = { nodes: [1, 2], meta: { title: 'x' } };
  const harness = setup({ getSnapshot: () => snapshot });
  harness.coordinator.schedule({ immediate: true });
  await harness.coordinator.flush();
  assert.equal(harness.saveCalls.length, 1);
  assert.equal(harness.saveCalls[0], snapshot);
  assert.deepEqual(snapshot, { nodes: [1, 2], meta: { title: 'x' } });
});

test('destroy flushes the pending revision by default', async () => {
  const harness = setup();
  harness.coordinator.schedule();
  const result = await harness.coordinator.destroy();
  assert.deepEqual(result, { seq: 1 });
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
  assert.deepEqual(harness.coordinator.getState(), { status: 'saved', error: '', retryAttempt: 0 });
  assert.equal(harness.timers.pending.size, 0);
});

test('destroy with flush disabled keeps the work unsaved', async () => {
  const harness = setup();
  harness.coordinator.schedule();
  assert.equal(await harness.coordinator.destroy({ flush: false }), null);
  assert.deepEqual(harness.saveCalls, []);
  assert.equal(harness.coordinator.getPersistedRevision(), 0);
  assert.equal(harness.coordinator.getState().status, 'pending');
  assert.equal(harness.timers.pending.size, 0);
  assert.deepEqual(harness.timers.cleared, [1]);
});

test('destroy force-bumps a revision even when nothing is dirty', async () => {
  const harness = setup();
  const result = await harness.coordinator.destroy({ force: true });
  assert.deepEqual(result, { seq: 1 });
  assert.equal(harness.coordinator.getRevision(), 1);
  assert.equal(harness.coordinator.getPersistedRevision(), 1);
});

test('destroy is idempotent and reports the last saved value afterwards', async () => {
  const harness = setup();
  harness.coordinator.schedule();
  const first = await harness.coordinator.destroy();
  const second = await harness.coordinator.destroy();
  assert.deepEqual(first, { seq: 1 });
  assert.deepEqual(second, { seq: 1 });
  assert.equal(harness.saveCalls.length, 1);
});

test('a destroyed coordinator ignores later schedules and flushes', async () => {
  const harness = setup();
  await harness.coordinator.destroy();
  assert.equal(harness.coordinator.schedule(), 0);
  assert.equal(harness.timers.pending.size, 0);
  assert.equal(await harness.coordinator.flush({ force: true }), null);
  assert.deepEqual(harness.saveCalls, []);
});

test('tolerates a missing clear function while cancelling timers', async () => {
  const harness = setup({ clearTimeoutFn: null, debounceMs: 100 });
  harness.coordinator.schedule();
  assert.doesNotThrow(() => harness.coordinator.schedule({ immediate: true }));
  await harness.coordinator.flush();
  assert.equal(harness.coordinator.getRevision(), 2);
  assert.equal(harness.coordinator.getPersistedRevision(), 2);
  assert.equal(harness.timers.pending.size, 1);
});
