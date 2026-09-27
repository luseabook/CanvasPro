import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationCanvasBinding } from './collaborationCanvasBinding.js';

const HOST_KEY = 'aicanvas.collaboration.host-canvases.v1';
const GUEST_KEY = 'aicanvas.collaboration.guest-canvases.v1';

function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
  };
}

function harness(over = {}) {
  const state = {
    actor: 'actor-1',
    active: 'canvas-a',
    contexts: {},
    canvases: [{ id: 'canvas-a' }, { id: 'canvas-b' }],
    switches: [],
  };
  const storage = 'storage' in over ? over.storage : memoryStorage();
  const tabs = {
    getCanvasProjectContext: (id) => state.contexts[id],
    getActiveCanvasId: () => state.active,
    getPersistenceRevisionSnapshot: () => ({ canvases: state.canvases }),
    async switchTo(id) {
      state.switches.push(id);
      state.active = id;
    },
  };
  const options = { storage, canvasTabs: tabs, actorId: () => state.actor };
  if ('hosting' in over) options.hosting = over.hosting;
  const binding = createCollaborationCanvasBinding(options);
  return { binding, state, storage, tabs, options };
}

function records(storage, key = HOST_KEY) {
  return JSON.parse(storage.getItem(key) || '{}');
}

function installIndexedDB(t, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, writable: true, value });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous);
    else delete globalThis.indexedDB;
  });
}

// In-memory IndexedDB adapter only: exercise the real Journal module. Requests
// complete asynchronously; failed transactions do not commit. No browser/global
// application is started. Tests in this file run sequentially and restore globals.
function fakeIndexedDB(over = {}) {
  const stores = new Map();
  const log = { opens: [], operations: [], closed: 0, held: [] };
  const failTx = 'failTx' in over ? over.failTx : () => false;
  const manual = 'manual' in over ? over.manual : false;
  const factory = {
    open(name, version) {
      log.opens.push([name, version]);
      const request = {};
      queueMicrotask(() => {
        if ('openError' in over) {
          request.error = over.openError;
          request.onerror?.();
          return;
        }
        let closed = false;
        const db = {
          createObjectStore(name) {
            stores.set(name, new Map());
          },
          transaction(name, mode) {
            if (closed) throw new Error('database is closed');
            const tx = { error: null };
            let perform;
            const result = {};
            tx.objectStore = (storeName) => {
              assert.equal(storeName, 'pending');
              const map = stores.get(storeName);
              function operation(kind, key, value) {
                log.operations.push({ kind, key, mode });
                perform = () => {
                  if (kind === 'get') result.result = structuredClone(map.get(key));
                  if (kind === 'put') {
                    map.set(key, structuredClone(value));
                    result.result = key;
                  }
                  if (kind === 'delete') {
                    map.delete(key);
                    result.result = undefined;
                  }
                };
                return result;
              }
              return {
                get: (key) => operation('get', key),
                put: (value, key) => operation('put', key, value),
                delete: (key) => operation('delete', key),
              };
            };
            const settle = () => {
              if (failTx(mode)) {
                tx.error = 'txError' in over ? over.txError : new Error('transaction failed');
                tx.onabort?.();
              } else {
                perform();
                tx.oncomplete?.();
              }
            };
            if (manual) log.held.push(settle);
            else queueMicrotask(settle);
            return tx;
          },
          close() {
            closed = true;
            log.closed++;
          },
        };
        request.result = db;
        if (!stores.has('pending')) request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
  return { factory, stores, log };
}

const turn = () => new Promise((resolve) => setImmediate(resolve));

test('remember stores room, canvas, project, original access and resume under current actor', () => {
  const { binding, state, storage } = harness();
  state.contexts['canvas-a'] = { projectId: 'project-1' };
  const access = { editable: true };
  const resume = { revision: 3 };
  binding.remember('room-1', 'canvas-a', access, resume);
  assert.deepEqual(records(storage), {
    'actor-1:room-1': {
      roomId: 'room-1',
      canvasId: 'canvas-a',
      projectId: 'project-1',
      originalAccess: { editable: true },
      resume: { revision: 3 },
    },
  });
  access.editable = false;
  resume.revision = 100;
  assert.deepEqual(binding.originalAccess('room-1', null), { editable: true });
  assert.deepEqual(binding.resumeFor('canvas-a'), { revision: 3 });
});

test('remember defaults to empty project and null access/resume when context API is absent', () => {
  const { binding, storage, tabs } = harness();
  tabs.getCanvasProjectContext = undefined;
  binding.remember('room-1', 'canvas-a');
  assert.deepEqual(records(storage)['actor-1:room-1'], {
    roomId: 'room-1',
    canvasId: 'canvas-a',
    projectId: '',
    originalAccess: null,
    resume: null,
  });
});

test('host is the default and guest records are kept in a separate storage namespace', () => {
  const { binding, options, storage } = harness();
  const guest = createCollaborationCanvasBinding({ ...options, hosting: false });
  binding.remember('host-room', 'canvas-a');
  guest.remember('guest-room', 'canvas-a');
  assert.equal(binding.roomFor('canvas-a'), 'host-room');
  assert.equal(guest.roomFor('canvas-a'), 'guest-room');
  assert.deepEqual(Object.keys(records(storage, HOST_KEY)), ['actor-1:host-room']);
  assert.deepEqual(Object.keys(records(storage, GUEST_KEY)), ['actor-1:guest-room']);
});

for (const invalid of ['{broken', 'null', '[]', 'false', '123', '"text"']) {
  test(`invalid top-level storage ${invalid} is treated as an empty map`, () => {
    const { binding, storage } = harness();
    storage.setItem(HOST_KEY, invalid);
    assert.equal(binding.roomFor('canvas-a'), undefined);
    assert.equal(binding.originalAccess('room-1', 'fallback'), 'fallback');
    assert.equal(binding.resumeFor('canvas-a'), null);
    binding.remember('room-1', 'canvas-a');
    assert.equal(binding.roomFor('canvas-a'), 'room-1');
  });
}

test('storage read errors are swallowed while write errors propagate unchanged', () => {
  const error = new Error('quota exceeded');
  const { binding } = harness({
    storage: {
      getItem() {
        throw new Error('read denied');
      },
      setItem() {
        throw error;
      },
    },
  });
  assert.equal(binding.roomFor('canvas-a'), undefined);
  assert.throws(
    () => binding.remember('room-1', 'canvas-a'),
    (e) => e === error,
  );
  assert.throws(
    () => binding.forget('room-1'),
    (e) => e === error,
  );
});

test('missing storage allows no-op remember/forget but does not persist a binding', async () => {
  const { binding } = harness({ storage: undefined });
  binding.remember('room-1', 'canvas-a');
  binding.forget('room-1');
  assert.equal(binding.roomFor('canvas-a'), undefined);
  assert.equal(await binding.activate('room-1'), false);
});

test('remember refreshes recency and roomFor chooses the most recently remembered match', () => {
  const { binding, storage } = harness();
  binding.remember('room-1', 'canvas-a');
  binding.remember('room-2', 'canvas-a');
  assert.equal(binding.roomFor('canvas-a'), 'room-2');
  binding.remember('room-1', 'canvas-a');
  assert.equal(binding.roomFor('canvas-a'), 'room-1');
  assert.deepEqual(Object.keys(records(storage)), ['actor-1:room-2', 'actor-1:room-1']);
});

test('current actor controls lookup, access and deletion without touching another actor', () => {
  const { binding, state, storage } = harness();
  binding.remember('room-1', 'canvas-a', 'first');
  state.actor = 'actor-2';
  assert.equal(binding.roomFor('canvas-a'), undefined);
  assert.equal(binding.originalAccess('room-1', 'fallback'), 'fallback');
  binding.remember('room-1', 'canvas-a', 'second');
  binding.forget('room-1');
  assert.equal(binding.roomFor('canvas-a'), undefined);
  state.actor = 'actor-1';
  assert.equal(binding.roomFor('canvas-a'), 'room-1');
  assert.equal(binding.originalAccess('room-1', null), 'first');
  assert.deepEqual(Object.keys(records(storage)), ['actor-1:room-1']);
});

test('forget removes only the requested actor-room metadata and leaves other rooms', () => {
  const { binding } = harness();
  binding.remember('room-1', 'canvas-a');
  binding.remember('room-2', 'canvas-b');
  binding.forget('room-1');
  binding.forget('absent');
  assert.equal(binding.roomFor('canvas-a'), undefined);
  assert.equal(binding.roomFor('canvas-b'), 'room-2');
});

test('originalAccess distinguishes an absent property from explicit null/false/zero/empty values', () => {
  const { binding, storage } = harness();
  const initial = {};
  for (const [i, value] of [null, false, 0, '', { role: 'viewer' }].entries()) {
    initial[`actor-1:room-${i}`] = { originalAccess: value };
  }
  initial['actor-1:legacy'] = {};
  storage.setItem(HOST_KEY, JSON.stringify(initial));
  for (const [i, value] of [null, false, 0, '', { role: 'viewer' }].entries()) {
    assert.deepEqual(binding.originalAccess(`room-${i}`, 'fallback'), value);
  }
  assert.equal(binding.originalAccess('legacy', 'fallback'), 'fallback');
  assert.equal(binding.originalAccess('absent', 'fallback'), 'fallback');
});

test('roomFor respects an optional allowlist, including an empty list', () => {
  const { binding } = harness();
  binding.remember('room-1', 'canvas-a');
  binding.remember('room-2', 'canvas-a');
  assert.equal(binding.roomFor('canvas-a', ['room-1']), 'room-1');
  assert.equal(binding.roomFor('canvas-a', []), undefined);
  assert.equal(binding.roomFor('canvas-a', ['unknown']), undefined);
  assert.equal(binding.roomFor('canvas-a', null), 'room-2');
});

test('roomFor ignores actor IDs that merely share a prefix', () => {
  const { binding, state } = harness();
  state.actor = 'actor-10';
  binding.remember('other', 'canvas-a');
  state.actor = 'actor-1';
  assert.equal(binding.roomFor('canvas-a'), undefined);
});

test('roomFor rejects a recycled canvas ID attached to a different project', () => {
  const { binding, state } = harness();
  state.contexts['canvas-a'] = { projectId: 'project-old' };
  binding.remember('room-1', 'canvas-a');
  state.contexts['canvas-a'] = { projectId: 'project-new' };
  assert.equal(binding.roomFor('canvas-a'), undefined);
});

test('roomFor can relocate a binding by project when its canvas ID changes', () => {
  const { binding, state } = harness();
  state.contexts['canvas-a'] = { projectId: 'project-1' };
  binding.remember('room-1', 'canvas-a');
  state.contexts['canvas-b'] = { projectId: 'project-1' };
  assert.equal(binding.roomFor('canvas-b'), 'room-1');
});

test('legacy records without project IDs still match their exact canvas but not another empty-project canvas', () => {
  const { binding, storage, state } = harness();
  storage.setItem(HOST_KEY, JSON.stringify({ 'actor-1:legacy': { roomId: 'legacy', canvasId: 'canvas-a' } }));
  state.contexts['canvas-a'] = { projectId: 'now-has-project' };
  assert.equal(binding.roomFor('canvas-a'), 'legacy');
  assert.equal(binding.roomFor('canvas-b'), undefined);
});

test('roomFor recency wins over exact canvas match when both share a project', () => {
  const { binding, state } = harness();
  state.contexts['canvas-a'] = state.contexts['canvas-b'] = { projectId: 'project-1' };
  binding.remember('exact', 'canvas-a');
  binding.remember('newer-project', 'canvas-b');
  assert.equal(binding.roomFor('canvas-a'), 'newer-project');
});

test('resumeFor follows room resolution and returns null when resume is absent or falsy', () => {
  const { binding } = harness();
  assert.equal(binding.resumeFor('canvas-a'), null);
  binding.remember('room-1', 'canvas-a', null, { client: 'client-1', revision: 4 });
  assert.deepEqual(binding.resumeFor('canvas-a'), { client: 'client-1', revision: 4 });
  binding.remember('room-2', 'canvas-a', null, false);
  assert.equal(binding.resumeFor('canvas-a'), null);
});

test('activate returns false for missing room and does not switch canvases', async () => {
  const { binding, state } = harness();
  assert.equal(await binding.activate('absent'), false);
  assert.deepEqual(state.switches, []);
});

test('activate returns true for the correct active canvas/project without reading the snapshot', async () => {
  const { binding, state, tabs } = harness();
  state.contexts['canvas-a'] = { projectId: 'project-1' };
  binding.remember('room-1', 'canvas-a');
  tabs.getPersistenceRevisionSnapshot = () => {
    throw new Error('unnecessary snapshot');
  };
  assert.equal(await binding.activate('room-1'), true);
  assert.deepEqual(state.switches, []);
});

test('activate switches to the recorded canvas and verifies the active ID', async () => {
  const { binding, state } = harness();
  binding.remember('room-1', 'canvas-b');
  assert.equal(await binding.activate('room-1'), true);
  assert.equal(state.active, 'canvas-b');
  assert.deepEqual(state.switches, ['canvas-b']);
});

test('activate prefers an exact canvas/project match over an earlier same-project candidate', async () => {
  const { binding, state } = harness();
  state.contexts['canvas-a'] = state.contexts['canvas-b'] = { projectId: 'project-1' };
  state.canvases = [{ id: 'canvas-a' }, { id: 'canvas-b' }];
  binding.remember('room-1', 'canvas-b');
  assert.equal(await binding.activate('room-1'), true);
  assert.deepEqual(state.switches, ['canvas-b']);
});

test('activate relocates to the first same-project canvas when the original canvas is missing', async () => {
  const { binding, state } = harness();
  state.contexts['old-canvas'] = { projectId: 'project-1' };
  binding.remember('room-1', 'old-canvas');
  state.contexts['canvas-b'] = { projectId: 'project-1' };
  state.contexts['canvas-c'] = { projectId: 'project-1' };
  state.canvases = [{ id: 'canvas-b' }, { id: 'canvas-c' }];
  assert.equal(await binding.activate('room-1'), true);
  assert.deepEqual(state.switches, ['canvas-b']);
});

test('activate does not reuse an active canvas with the wrong project but can find a valid replacement', async () => {
  const { binding, state } = harness();
  state.contexts['canvas-a'] = { projectId: 'old-project' };
  binding.remember('room-1', 'canvas-a');
  state.contexts['canvas-a'] = { projectId: 'recycled-project' };
  state.contexts['canvas-b'] = { projectId: 'old-project' };
  assert.equal(await binding.activate('room-1'), true);
  assert.deepEqual(state.switches, ['canvas-b']);
});

test('activate returns false when neither the original nor its project is available', async () => {
  const { binding, state } = harness();
  state.contexts['canvas-b'] = { projectId: 'old-project' };
  binding.remember('room-1', 'canvas-b');
  state.contexts['canvas-b'] = { projectId: 'recycled-project' };
  assert.equal(await binding.activate('room-1'), false);
  assert.deepEqual(state.switches, []);
});

test('activate tolerates absent or empty persistence snapshot without selecting an arbitrary canvas', async () => {
  const { binding, tabs, state } = harness();
  binding.remember('room-1', 'missing');
  tabs.getPersistenceRevisionSnapshot = undefined;
  assert.equal(await binding.activate('room-1'), false);
  tabs.getPersistenceRevisionSnapshot = () => null;
  assert.equal(await binding.activate('room-1'), false);
  tabs.getPersistenceRevisionSnapshot = () => ({});
  assert.equal(await binding.activate('room-1'), false);
  assert.deepEqual(state.switches, []);
});

test('activate awaits switchTo before validating and returning', async () => {
  const { binding, tabs, state } = harness();
  binding.remember('room-1', 'canvas-b');
  let release;
  tabs.switchTo = async (id) => {
    await new Promise((r) => {
      release = r;
    });
    state.active = id;
  };
  let settled = false;
  const pending = binding.activate('room-1').then((value) => {
    settled = true;
    return value;
  });
  await turn();
  assert.equal(settled, false);
  assert.equal(state.active, 'canvas-a');
  release();
  assert.equal(await pending, true);
  assert.equal(state.active, 'canvas-b');
});

test('activate throws a useful error when switchTo resolves without activating the requested canvas', async () => {
  const { binding, tabs } = harness();
  binding.remember('room-1', 'canvas-b');
  tabs.switchTo = async () => {};
  await assert.rejects(binding.activate('room-1'), {
    message: '无法切换到此房间的原画布，请先完成当前画布的操作',
  });
});

test('activate propagates a switch error unchanged', async () => {
  const { binding, tabs } = harness();
  const error = new Error('unsaved canvas');
  binding.remember('room-1', 'canvas-b');
  tabs.switchTo = async () => {
    throw error;
  };
  await assert.rejects(binding.activate('room-1'), (e) => e === error);
});

test('without IndexedDB, reads default to null/empty and checkpoint is memory-only', async (t) => {
  installIndexedDB(t, undefined);
  const { binding, options } = harness();
  assert.equal(await binding.baseline('room-1'), null);
  assert.deepEqual(await binding.mediaBindings('room-1'), []);
  await binding.checkpoint('room-1', { nodes: { n1: { x: 1 } } });
  assert.deepEqual(await binding.baseline('room-1'), { nodes: { n1: { x: 1 } } });
  assert.deepEqual(await binding.mediaBindings('room-1'), []);
  const reopened = createCollaborationCanvasBinding(options);
  assert.equal(await reopened.baseline('room-1'), null);
  await binding.close();
  await reopened.close();
});

test('checkpoint deep-clones both baseline and media before awaiting persistence', async (t) => {
  installIndexedDB(t, undefined);
  const { binding } = harness();
  const base = { nodes: { n1: { x: 1 } } };
  const media = [{ node: 'n1', source: { id: 'media-1' } }];
  const pending = binding.checkpoint('room-1', base, media);
  base.nodes.n1.x = 99;
  media[0].source.id = 'mutated';
  await pending;
  assert.deepEqual(await binding.baseline('room-1'), { nodes: { n1: { x: 1 } } });
  assert.deepEqual(await binding.mediaBindings('room-1'), [{ node: 'n1', source: { id: 'media-1' } }]);
  await binding.close();
});

test('a later checkpoint replaces both baseline and previous media, defaulting omitted media to empty', async (t) => {
  installIndexedDB(t, undefined);
  const { binding } = harness();
  await binding.checkpoint('room-1', { n: 1 }, [{ media: 1 }]);
  await binding.checkpoint('room-1', { n: 2 });
  assert.deepEqual(await binding.baseline('room-1'), { n: 2 });
  assert.deepEqual(await binding.mediaBindings('room-1'), []);
  await binding.close();
});

test('in-memory checkpoints are isolated by actor and room, including actor switches', async (t) => {
  installIndexedDB(t, undefined);
  const { binding, state } = harness();
  await binding.checkpoint('room-1', { n: 1 }, ['first']);
  await binding.checkpoint('room-2', { n: 2 }, ['second']);
  state.actor = 'actor-2';
  assert.equal(await binding.baseline('room-1'), null);
  await binding.checkpoint('room-1', { n: 3 }, ['third']);
  state.actor = 'actor-1';
  assert.deepEqual(await binding.baseline('room-1'), { n: 1 });
  assert.deepEqual(await binding.mediaBindings('room-2'), ['second']);
  state.actor = 'actor-2';
  assert.deepEqual(await binding.baseline('room-1'), { n: 3 });
  await binding.close();
});

test('uncloneable checkpoint rejects before replacing the existing cached baseline', async (t) => {
  installIndexedDB(t, undefined);
  const { binding } = harness();
  await binding.checkpoint('room-1', { n: 1 });
  await assert.rejects(binding.checkpoint('room-1', { callback() {} }), { name: 'DataCloneError' });
  assert.deepEqual(await binding.baseline('room-1'), { n: 1 });
  await binding.close();
});

test('checkpoint getters expose cached references, not defensive read copies', async (t) => {
  installIndexedDB(t, undefined);
  const { binding } = harness();
  await binding.checkpoint('room-1', { n: 1 }, [{ id: 'media-1' }]);
  const baseline = await binding.baseline('room-1');
  const media = await binding.mediaBindings('room-1');
  baseline.n = 9;
  media.push({ id: 'media-2' });
  assert.equal(await binding.baseline('room-1'), baseline);
  assert.equal(await binding.mediaBindings('room-1'), media);
  assert.equal((await binding.baseline('room-1')).n, 9);
  await binding.close();
});

test('forget removes room metadata but does not erase cached recovery data', async (t) => {
  installIndexedDB(t, undefined);
  const { binding } = harness();
  binding.remember('room-1', 'canvas-a');
  await binding.checkpoint('room-1', { n: 1 }, ['media']);
  binding.forget('room-1');
  assert.equal(binding.roomFor('canvas-a'), undefined);
  assert.deepEqual(await binding.baseline('room-1'), { n: 1 });
  assert.deepEqual(await binding.mediaBindings('room-1'), ['media']);
  await binding.close();
});

test('close on an idle binding does not open IndexedDB', async (t) => {
  const db = fakeIndexedDB();
  installIndexedDB(t, db.factory);
  await harness().binding.close();
  assert.deepEqual(db.log.opens, []);
  assert.equal(db.log.closed, 0);
});

test('checkpoint persists through the real Journal and restores in a new binding', async (t) => {
  const db = fakeIndexedDB();
  installIndexedDB(t, db.factory);
  const { binding, options } = harness();
  const base = { nodes: { n1: { x: 1 } }, edges: {} };
  const media = [{ id: 'media-1' }];
  await binding.checkpoint('room-1', base, media);
  const key = JSON.stringify(['room-1', 'actor-1', 'host-canvas-baseline']);
  assert.deepEqual(db.stores.get('pending').get(key), { hostBase: base, mediaBindings: media, schema: 1 });
  await binding.close();
  const reopened = createCollaborationCanvasBinding(options);
  assert.deepEqual(await reopened.baseline('room-1'), base);
  assert.deepEqual(await reopened.mediaBindings('room-1'), media);
  assert.deepEqual(db.log.opens, [
    ['aicanvas-collaboration-recovery', 1],
    ['aicanvas-collaboration-recovery', 1],
  ]);
  await reopened.close();
  assert.equal(db.log.closed, 2);
});

test('host and guest use distinct Journal client IDs for the same actor and room', async (t) => {
  const db = fakeIndexedDB();
  installIndexedDB(t, db.factory);
  const { binding, options } = harness();
  const guest = createCollaborationCanvasBinding({ ...options, hosting: false });
  await binding.checkpoint('room-1', { mode: 'host' });
  await guest.checkpoint('room-1', { mode: 'guest' });
  const entries = db.stores.get('pending');
  assert.equal(entries.size, 2);
  assert.deepEqual(entries.get(JSON.stringify(['room-1', 'actor-1', 'host-canvas-baseline'])).hostBase, {
    mode: 'host',
  });
  assert.deepEqual(entries.get(JSON.stringify(['room-1', 'actor-1', 'guest-canvas-baseline'])).hostBase, {
    mode: 'guest',
  });
  await binding.close();
  await guest.close();
});

test('one Journal connection is reused per actor-room and close visits every opened connection', async (t) => {
  const db = fakeIndexedDB();
  installIndexedDB(t, db.factory);
  const { binding, state } = harness();
  await binding.baseline('room-1');
  await binding.mediaBindings('room-1');
  await binding.checkpoint('room-1', { n: 1 });
  await binding.checkpoint('room-2', { n: 2 });
  state.actor = 'actor-2';
  await binding.checkpoint('room-1', { n: 3 });
  assert.equal(db.log.opens.length, 3);
  await binding.close();
  assert.equal(db.log.closed, 3);
});

test('cache hits do not read IndexedDB again after checkpoint', async (t) => {
  const db = fakeIndexedDB();
  installIndexedDB(t, db.factory);
  const { binding } = harness();
  await binding.checkpoint('room-1', { n: 1 }, ['media']);
  await binding.baseline('room-1');
  await binding.mediaBindings('room-1');
  assert.deepEqual(
    db.log.operations.map((x) => x.kind),
    ['put'],
  );
  await binding.close();
});

test('storage-only reads are not memoized into the in-memory checkpoint cache', async (t) => {
  const db = fakeIndexedDB();
  installIndexedDB(t, db.factory);
  const { binding, options } = harness();
  await binding.checkpoint('room-1', { n: 1 });
  const reader = createCollaborationCanvasBinding(options);
  assert.deepEqual(await reader.baseline('room-1'), { n: 1 });
  await binding.checkpoint('room-1', { n: 2 });
  assert.deepEqual(await reader.baseline('room-1'), { n: 2 });
  assert.equal(db.log.operations.filter((x) => x.kind === 'get').length, 2);
  await binding.close();
  await reader.close();
});

test('a failed persistence write rejects but retains its in-memory checkpoint; a later write can succeed', async (t) => {
  let fail = true;
  const error = new Error('quota exceeded');
  const db = fakeIndexedDB({ failTx: (mode) => fail && mode === 'readwrite', txError: error });
  installIndexedDB(t, db.factory);
  const { binding, options } = harness();
  await assert.rejects(binding.checkpoint('room-1', { n: 1 }), (e) => e === error);
  assert.deepEqual(await binding.baseline('room-1'), { n: 1 });
  assert.equal(db.stores.get('pending').size, 0);
  const reader = createCollaborationCanvasBinding(options);
  assert.equal(await reader.baseline('room-1'), null);
  fail = false;
  await binding.checkpoint('room-1', { n: 2 });
  assert.deepEqual(await reader.baseline('room-1'), { n: 2 });
  await binding.close();
  await reader.close();
});

test('Journal read failures propagate and close tolerates an open failure', async (t) => {
  const error = new Error('IndexedDB denied');
  const db = fakeIndexedDB({ openError: error });
  installIndexedDB(t, db.factory);
  const { binding } = harness();
  await assert.rejects(binding.baseline('room-1'), (e) => e === error);
  await assert.rejects(binding.mediaBindings('room-1'), (e) => e === error);
  await binding.close();
  assert.equal(db.log.opens.length, 1);
});

test('close waits for the pending Journal transaction before closing the connection', async (t) => {
  const db = fakeIndexedDB({ manual: true });
  installIndexedDB(t, db.factory);
  const { binding } = harness();
  const pending = binding.checkpoint('room-1', { n: 1 });
  let closed = false;
  const closing = binding.close().then(() => {
    closed = true;
  });
  await turn();
  assert.equal(db.log.held.length, 1);
  assert.equal(closed, false);
  assert.equal(db.log.closed, 0);
  db.log.held.shift()();
  await pending;
  await closing;
  assert.equal(db.log.closed, 1);
});

test('forget does not clear persisted recovery data and close does not clear checkpoint memory', async (t) => {
  const db = fakeIndexedDB();
  installIndexedDB(t, db.factory);
  const { binding, options } = harness();
  binding.remember('room-1', 'canvas-a');
  await binding.checkpoint('room-1', { n: 1 });
  binding.forget('room-1');
  await binding.close();
  assert.deepEqual(await binding.baseline('room-1'), { n: 1 });
  const reader = createCollaborationCanvasBinding(options);
  assert.deepEqual(await reader.baseline('room-1'), { n: 1 });
  await reader.close();
});
