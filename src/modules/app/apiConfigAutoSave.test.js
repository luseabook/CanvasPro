import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiConfigAutoSaveController } from './apiConfigAutoSave.js';

function fixture(over = {}) {
  const timers = new Map();
  let nextTimerId = 1;
  const log = [];
  const timerHost = {
    setTimeout(fn, delay) {
      const id = nextTimerId++;
      timers.set(id, { fn, delay });
      log.push(['setTimeout', id, delay]);
      return id;
    },
    clearTimeout(id) {
      log.push(['clearTimeout', id]);
      timers.delete(id);
    },
  };
  const state = { config: { theme: 'dark' } };
  const saved = [];
  const errors = [];
  const phases = [];
  const controller = createApiConfigAutoSaveController({
    beforePersist: () => {
      log.push(['beforePersist']);
    },
    collectConfig: () => {
      log.push(['collectConfig']);
      return state.config;
    },
    saveConfig: async (config) => {
      log.push(['saveConfig', config]);
      if (over.saveError) throw over.saveError;
    },
    onSaved: (config, options) => saved.push([config, options]),
    onError: (error, options) => errors.push([error, options]),
    onStateChange: (phase) => phases.push(phase),
    timerHost,
    ...(over.delay === undefined ? {} : { delay: over.delay }),
  });
  return {
    controller,
    timers,
    log,
    saved,
    errors,
    phases,
    state,
    fireTimer(id) {
      const entry = timers.get(id);
      timers.delete(id);
      entry.fn();
    },
  };
}

test('persist runs the three steps in order and resolves with the config', async () => {
  const ctx = fixture();
  const config = await ctx.controller.persist();
  assert.equal(config, ctx.state.config);
  assert.deepEqual(
    ctx.log.map((entry) => entry[0]),
    ['beforePersist', 'collectConfig', 'saveConfig'],
  );
  assert.equal(ctx.log[2][1], ctx.state.config);
});

test('a successful persist reports saving then saved', async () => {
  const ctx = fixture();
  const options = { reason: 'manual' };
  await ctx.controller.persist(options);
  assert.deepEqual(ctx.phases, ['saving', 'saved']);
  assert.equal(ctx.saved.length, 1);
  assert.equal(ctx.saved[0][0], ctx.state.config);
  assert.equal(ctx.saved[0][1], options);
  assert.equal(ctx.errors.length, 0);
});

test('persist defaults its options to an empty object', async () => {
  const ctx = fixture();
  await ctx.controller.persist();
  assert.deepEqual(ctx.saved[0][1], {});
});

test('a save failure is reported and resolves to null', async () => {
  const failure = new Error('disk full');
  const ctx = fixture({ saveError: failure });
  const result = await ctx.controller.persist({ reason: 'auto' });
  assert.equal(result, null);
  assert.deepEqual(ctx.phases, ['saving', 'error']);
  assert.equal(ctx.errors.length, 1);
  assert.equal(ctx.errors[0][0], failure);
  assert.deepEqual(ctx.errors[0][1], { reason: 'auto' });
  assert.equal(ctx.saved.length, 0);
});

test('a failure of beforePersist is reported the same way', async () => {
  const failure = new Error('collect failed');
  const log = [];
  const errors = [];
  const controller = createApiConfigAutoSaveController({
    beforePersist: async () => {
      throw failure;
    },
    collectConfig: () => ({}),
    saveConfig: () => {
      log.push('saveConfig');
    },
    onError: (error) => errors.push(error),
  });
  assert.equal(await controller.persist(), null);
  assert.deepEqual(errors, [failure]);
  assert.deepEqual(log, []);
});

test('missing hooks surface as a reported error instead of a throw', async () => {
  const controller = createApiConfigAutoSaveController();
  assert.equal(await controller.persist(), null);
});

test('an older persist is superseded by a newer one', async () => {
  let collected = 0;
  const errors = [];
  const saved = [];
  const phases = [];
  const controller = createApiConfigAutoSaveController({
    collectConfig: () => {
      collected += 1;
      return { n: collected };
    },
    saveConfig: () => {},
    onSaved: (config, options) => saved.push([config, options]),
    onError: (error) => errors.push(error),
    onStateChange: (phase) => phases.push(phase),
  });
  const first = controller.persist({ tag: 'a' });
  const second = controller.persist({ tag: 'b' });
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.deepEqual(firstResult, { n: 1 });
  assert.deepEqual(secondResult, { n: 2 });
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0], [{ n: 2 }, { tag: 'b' }]);
  assert.deepEqual(phases, ['saving', 'saving', 'saved']);
  assert.equal(errors.length, 0);
});

test('persists are serialised: the second starts after the first', async () => {
  const order = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const controller = createApiConfigAutoSaveController({
    collectConfig: () => ({}),
    saveConfig: async (config) => {
      order.push('start');
      await gate;
      order.push('end');
    },
  });
  const first = controller.persist();
  const second = controller.persist();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(order, ['start']);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(order, ['start', 'end', 'start', 'end']);
});

test('schedule arms one timer with the default 600 ms delay', () => {
  const ctx = fixture();
  ctx.controller.schedule();
  assert.equal(ctx.timers.size, 1);
  const [id, entry] = [...ctx.timers.entries()][0];
  assert.equal(entry.delay, 600);
  assert.deepEqual(ctx.phases, ['scheduled']);
  assert.equal(id, 1);
});

test('schedule honours a custom delay', () => {
  const ctx = fixture({ delay: 25 });
  ctx.controller.schedule();
  assert.equal([...ctx.timers.values()][0].delay, 25);
});

test('a second schedule replaces the pending timer', () => {
  const ctx = fixture();
  ctx.controller.schedule();
  ctx.controller.schedule();
  assert.equal(ctx.timers.size, 1);
  assert.deepEqual(
    ctx.log.filter((entry) => entry[0] === 'clearTimeout'),
    [['clearTimeout', 1]],
  );
});

test('schedule reports saving while a persist is still in flight', async () => {
  const ctx = fixture();
  const pending = ctx.controller.persist();
  ctx.controller.schedule();
  assert.deepEqual(ctx.phases, ['saving', 'saving']);
  await pending;
});

test('the armed timer eventually triggers a persist', async () => {
  const ctx = fixture();
  ctx.controller.schedule();
  const [id] = ctx.timers.keys();
  ctx.fireTimer(id);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(ctx.log.filter((entry) => entry[0] === 'saveConfig').length, 1);
  assert.deepEqual(ctx.phases, ['scheduled', 'saving', 'saved']);
});

test('flush runs immediately when a timer is armed', async () => {
  const ctx = fixture();
  ctx.controller.schedule();
  const result = await ctx.controller.flush();
  assert.deepEqual(result, ctx.state.config);
  assert.equal(ctx.timers.size, 0);
  assert.deepEqual(
    ctx.log.filter((entry) => entry[0] === 'clearTimeout'),
    [['clearTimeout', 1]],
  );
});

test('flush with nothing armed joins the in-flight chain', async () => {
  const ctx = fixture();
  const pending = ctx.controller.persist();
  const flushed = ctx.controller.flush();
  assert.notEqual(flushed, pending);
  await pending;
  await flushed;
  assert.equal(ctx.saved.length, 1);
});

test('an armed timer supersedes the in-flight persist and re-announces scheduled', async () => {
  const ctx = fixture();
  const pending = ctx.controller.persist();
  ctx.controller.schedule();
  await pending;
  assert.deepEqual(ctx.phases, ['saving', 'saving', 'scheduled']);
  assert.equal(ctx.saved.length, 0);
});

test('the timer host defaults to the global window', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const calls = [];
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      setTimeout: (fn, delay) => {
        calls.push(delay);
        return 1;
      },
      clearTimeout: () => {},
    },
  });
  try {
    createApiConfigAutoSaveController().schedule();
    assert.deepEqual(calls, [600]);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
  }
});
