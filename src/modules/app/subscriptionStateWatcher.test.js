import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeToModelCatalogState, subscribeToSubscriptionState } from './subscriptionStateWatcher.js';

function store(over = {}) {
  const listeners = [];
  const subject = {
    listeners,
    state: 'state' in over ? over.state : {},
    getStateRaw: 'getStateRaw' in over ? over.getStateRaw : () => subject.state,
    subscribe:
      'subscribe' in over
        ? over.subscribe
        : (callback) => {
            listeners.push(callback);
            return () => {
              const index = listeners.indexOf(callback);
              if (index >= 0) listeners.splice(index, 1);
            };
          },
    notify(next) {
      for (const callback of [...listeners]) callback(next);
    },
  };
  if ('subscribeSelector' in over) subject.subscribeSelector = over.subscribeSelector;
  return subject;
}

test('a missing callback yields an inert disposer', () => {
  const subject = store();
  for (const value of [undefined, null, 'nope', 42, {}]) {
    const dispose = subscribeToSubscriptionState(subject, value);
    assert.equal(typeof dispose, 'function');
    assert.equal(dispose(), undefined);
  }
  assert.equal(subject.listeners.length, 0);
});

test('prefers subscribeSelector when the store provides it', () => {
  const calls = [];
  const subject = store({
    subscribeSelector: (selector, callback) => {
      calls.push({ selector, callback });
      return 'disposed';
    },
  });
  const seen = [];
  const listener = (state) => seen.push(state);
  const dispose = subscribeToSubscriptionState(subject, listener);
  assert.equal(calls.length, 1);
  assert.equal(dispose, 'disposed');
  assert.equal(calls[0].callback, listener);
  assert.equal(seen.length, 0);
  calls[0].callback(calls[0].selector({ subscription: { plan: 'pro' } }));
  assert.deepEqual(seen, [{ plan: 'pro' }]);
});

test('falls back to an eager read plus subscribe', () => {
  const subject = store({ state: { subscription: { plan: 'free' } } });
  const seen = [];
  subscribeToSubscriptionState(subject, (state) => seen.push(state));
  assert.deepEqual(seen, [{ plan: 'free' }]);
  subject.notify({ subscription: { plan: 'pro' } });
  assert.deepEqual(seen, [{ plan: 'free' }, { plan: 'pro' }]);
});

test('reads through getStateRaw when getState is absent', () => {
  const seen = [];
  subscribeToSubscriptionState({ getStateRaw: () => ({ subscription: { plan: 'raw' } }) }, (state) =>
    seen.push(state),
  );
  assert.deepEqual(seen, [{ plan: 'raw' }]);
});

test('a store with neither hook only gets the eager call', () => {
  const seen = [];
  const dispose = subscribeToSubscriptionState(
    { getStateRaw: () => ({ subscription: { plan: 'x' } }) },
    (state) => seen.push(state),
  );
  assert.deepEqual(seen, [{ plan: 'x' }]);
  assert.equal(typeof dispose, 'function');
  assert.equal(dispose(), undefined);
});

test('a missing slice normalises to an empty object', () => {
  const seen = [];
  subscribeToSubscriptionState({ getStateRaw: () => ({}) }, (state) => seen.push(state));
  subscribeToSubscriptionState({ getStateRaw: () => undefined }, (state) => seen.push(state));
  subscribeToSubscriptionState({}, (state) => seen.push(state));
  assert.deepEqual(seen, [{}, {}, {}]);
});

test('a nullish store is tolerated', () => {
  const seen = [];
  const dispose = subscribeToSubscriptionState(null, (state) => seen.push(state));
  assert.deepEqual(seen, [{}]);
  assert.equal(typeof dispose, 'function');
  assert.equal(dispose(), undefined);
});

test('the model catalog wrapper selects its own slice', () => {
  const subject = store({ state: { modelCatalog: { models: ['a'] }, subscription: { plan: 'pro' } } });
  const seen = [];
  subscribeToModelCatalogState(subject, (state) => seen.push(state));
  assert.deepEqual(seen, [{ models: ['a'] }]);
});

test('the model catalog wrapper also prefers subscribeSelector', () => {
  const calls = [];
  const subject = store({
    subscribeSelector: (selector, callback) => {
      calls.push({ selector, callback });
      return () => {};
    },
  });
  subscribeToModelCatalogState(subject, () => {});
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].selector({ modelCatalog: 7 }), 7);
  assert.deepEqual(calls[0].selector(null), {});
  assert.deepEqual(calls[0].selector({ subscription: { plan: 'pro' } }), {});
});

test('the unsubscribe returned by subscribe is passed through', () => {
  const stops = [];
  const unsubscribe = () => stops.push(1);
  const subject = store({ subscribe: () => unsubscribe });
  const dispose = subscribeToSubscriptionState(subject, () => {});
  assert.equal(dispose, unsubscribe);
  dispose();
  assert.equal(stops.length, 1);
});
