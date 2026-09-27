import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationConflicts, partitionCollaborationConflict } from './collaborationConflicts.js';

function change(id, before, after, kind = 'nodes') {
  return { kind, id, before, after };
}

function graph(nodes = {}, edges = {}) {
  return { nodes, edges };
}

function keys(changes) {
  return changes.map(({ kind, id }) => `${kind}:${id}`);
}

// An independent conflict prevents the conservative all-blocked fallback from
// hiding mistakes in the target lock/job checks. All values are synthetic.
function partitionFixture(over = {}) {
  const seed = change('seed', { value: 0 }, { value: 1 });
  const target = change('target', { value: 0 }, { value: 1 });
  const snapshot = {
    document: graph({ seed: { value: 2 }, target: { value: 0 } }),
    locks: 'locks' in over ? over.locks : {},
    jobs: 'jobs' in over ? over.jobs : [],
  };
  return { seed, target, snapshot };
}

function partition(fixture) {
  return partitionCollaborationConflict([fixture.seed, fixture.target], fixture.snapshot, 'actor', 'client');
}

test('registry starts empty and hold stores unique kind/id pairs only', () => {
  const conflicts = createCollaborationConflicts();
  assert.deepEqual(conflicts.list(), []);
  assert.equal(conflicts.has({ kind: 'nodes', id: 'a' }), false);
  conflicts.hold([
    change('a', null, { value: 1 }),
    change('a', null, { value: 2 }),
    change('a', null, {}, 'edges'),
  ]);
  assert.deepEqual(conflicts.list(), [
    { kind: 'nodes', id: 'a' },
    { kind: 'edges', id: 'a' },
  ]);
  assert.equal(conflicts.has({ kind: 'edges', id: 'a' }), true);
  assert.equal(conflicts.has({ kind: 'nodes', id: 'b' }), false);
});

test('clear removes held entries and list returns a fresh array', () => {
  const conflicts = createCollaborationConflicts();
  conflicts.hold([change('a', null, {})]);
  conflicts.list().pop();
  assert.equal(conflicts.list().length, 1);
  conflicts.clear();
  assert.deepEqual(conflicts.list(), []);
  assert.equal(conflicts.blocks(['a'], graph()), false);
});

test('blocks checks held node IDs without blocking unrelated selections', () => {
  const conflicts = createCollaborationConflicts();
  conflicts.hold([change('a', null, {})]);
  assert.equal(conflicts.blocks(['a'], graph()), true);
  assert.equal(conflicts.blocks(['b'], graph()), false);
  assert.equal(conflicts.blocks([], graph()), false);
});

test('held edges block both endpoints but a missing edge has no endpoints', () => {
  const conflicts = createCollaborationConflicts();
  conflicts.hold([change('e', null, {}, 'edges')]);
  const document = graph({}, { e: { sourceId: 'a', targetId: 'b' } });
  assert.equal(conflicts.blocks(['a'], document), true);
  assert.equal(conflicts.blocks(['b'], document), true);
  assert.equal(conflicts.blocks(['c'], document), false);
  assert.equal(conflicts.blocks(['a'], graph()), false);
});

test('reconcile preserves unrelated change identity and does not mutate inputs', () => {
  const conflicts = createCollaborationConflicts();
  const local = [change('a', { x: 0 }, { x: 1 })];
  const remote = [change('b', { x: 0 }, { x: 2 })];
  const document = graph({ a: { x: 0 }, b: { x: 2 } });
  const before = structuredClone({ local, remote, document });
  const result = conflicts.reconcile(local, remote, document);
  assert.deepEqual(result, local);
  assert.equal(result[0], local[0]);
  assert.deepEqual({ local, remote, document }, before);
  assert.deepEqual(conflicts.list(), []);
});

test('reconcile filters a previously held change even without remote changes', () => {
  const conflicts = createCollaborationConflicts();
  const local = [change('a', {}, { x: 1 }), change('b', {}, { x: 1 })];
  conflicts.hold([local[0]]);
  assert.deepEqual(conflicts.reconcile(local, [], graph()), [local[1]]);
  assert.equal(conflicts.has(local[0]), true);
});

test('reconcile holds incompatible edits of the same field once', () => {
  const conflicts = createCollaborationConflicts();
  const local = change('a', { x: 0 }, { x: 1 });
  const remote = change('a', { x: 0 }, { x: 2 });
  assert.deepEqual(conflicts.reconcile([local], [remote], graph({ a: remote.after })), []);
  assert.deepEqual(conflicts.list(), [{ kind: 'nodes', id: 'a' }]);
});

test('reconcile accepts independent fields but does not apply their merged graph', () => {
  const conflicts = createCollaborationConflicts();
  const local = change('a', { x: 0, y: 0 }, { x: 1, y: 0 });
  const remote = change('a', { x: 0, y: 0 }, { x: 0, y: 2 });
  const document = graph({ a: structuredClone(remote.after) });
  assert.deepEqual(conflicts.reconcile([local], [remote], document), [local]);
  assert.deepEqual(document.nodes.a, { x: 0, y: 2 });
  assert.deepEqual(local.after, { x: 1, y: 0 });
  assert.deepEqual(conflicts.list(), []);
});

test('reconcile accepts convergent same-field edits', () => {
  const conflicts = createCollaborationConflicts();
  const local = change('a', { x: 0 }, { x: 1 });
  assert.deepEqual(conflicts.reconcile([local], [structuredClone(local)], graph({ a: { x: 1 } })), [local]);
  assert.deepEqual(conflicts.list(), []);
});

test('reconcile holds a delete versus edit conflict', () => {
  const conflicts = createCollaborationConflicts();
  const local = change('a', { x: 0 }, null);
  const remote = change('a', { x: 0 }, { x: 2 });
  assert.deepEqual(conflicts.reconcile([local], [remote], graph({ a: remote.after })), []);
  assert.equal(conflicts.has(local), true);
});

test('reconcile holds node deletion and dependent remote edge together', () => {
  const conflicts = createCollaborationConflicts();
  const local = change('a', { x: 0 }, null);
  const remote = change('e', null, { sourceId: 'a', targetId: 'b' }, 'edges');
  assert.deepEqual(conflicts.reconcile([local], [remote], graph()), []);
  assert.deepEqual(keys(conflicts.list()), ['nodes:a', 'edges:e']);
});

test('reconcile detects ancestor deletion affecting a remote descendant', () => {
  const conflicts = createCollaborationConflicts();
  const local = change('root', {}, null);
  const remote = change('child', null, { parentId: 'middle' });
  const document = graph({ middle: { parentId: 'root' } });
  assert.deepEqual(conflicts.reconcile([local], [remote], document), []);
  assert.deepEqual(keys(conflicts.list()), ['nodes:root', 'nodes:child']);
});

test('partition on an empty list returns two empty lists', () => {
  assert.deepEqual(partitionCollaborationConflict([], { document: graph() }, 'actor', 'client'), {
    blocked: [],
    safe: [],
  });
});

test('partition conservatively blocks every change when no cause is found', () => {
  const changes = [change('a', { x: 0 }, { x: 1 })];
  const result = partitionCollaborationConflict(
    changes,
    { document: graph({ a: { x: 0 } }) },
    'actor',
    'client',
  );
  assert.equal(result.blocked, changes);
  assert.deepEqual(result.safe, []);
});

test('partition separates an incompatible field edit from an independent safe edit', () => {
  const fixture = partitionFixture();
  const before = structuredClone(fixture);
  const result = partition(fixture);
  assert.deepEqual(result.blocked, [fixture.seed]);
  assert.deepEqual(result.safe, [fixture.target]);
  assert.equal(result.safe[0], fixture.target);
  assert.deepEqual(fixture, before);
});

for (const [label, actorId, clientId, expiresAt, blocked] of [
  ['foreign actor', 'other', 'client', 101, true],
  ['foreign client', 'actor', 'other', 101, true],
  ['same actor and client', 'actor', 'client', 101, false],
  ['expired lock', 'other', 'other', 99, false],
  ['lock expiring exactly now', 'other', 'other', 100, false],
]) {
  test(`partition lock: ${label}`, (t) => {
    t.mock.method(Date, 'now', () => 100000);
    const fixture = partitionFixture({ locks: { target: { actorId, clientId, expiresAt } } });
    const result = partition(fixture);
    assert.equal(result.blocked.includes(fixture.target), blocked);
    assert.equal(result.safe.includes(fixture.target), !blocked);
  });
}

for (const [label, actor, client, status, blocked] of [
  ['foreign actor running', 'other', 'client', 'running', true],
  ['foreign client running', 'actor', 'other', 'running', true],
  ['same owner running', 'actor', 'client', 'running', false],
  ['foreign completed', 'other', 'other', 'completed', false],
  ['foreign queued', 'other', 'other', 'queued', false],
]) {
  test(`partition job: ${label}`, () => {
    const fixture = partitionFixture({ jobs: [{ node: 'target', actor, client, status }] });
    const result = partition(fixture);
    assert.equal(result.blocked.includes(fixture.target), blocked);
    assert.equal(result.safe.includes(fixture.target), !blocked);
  });
}

test('partition tolerates absent locks/jobs and ignores jobs for other nodes', () => {
  const absent = partitionFixture({ locks: undefined, jobs: undefined });
  assert.deepEqual(partition(absent).safe, [absent.target]);
  const unrelated = partitionFixture({
    jobs: [{ node: 'elsewhere', actor: 'other', client: 'other', status: 'running' }],
  });
  assert.deepEqual(partition(unrelated).safe, [unrelated.target]);
});

test('partition preserves first-running-job lookup semantics', () => {
  const fixture = partitionFixture({
    jobs: [
      { node: 'target', actor: 'actor', client: 'client', status: 'running' },
      { node: 'target', actor: 'other', client: 'other', status: 'running' },
    ],
  });
  assert.deepEqual(partition(fixture).safe, [fixture.target]);
});

for (const side of ['before', 'after']) {
  test(`partition checks the ${side} parent of a moved node for foreign locks`, (t) => {
    t.mock.method(Date, 'now', () => 100000);
    const target = change('child', { parentId: 'old' }, { parentId: 'new' });
    const parent = target[side].parentId;
    const independent = change('other', {}, { label: 'safe' });
    const snapshot = {
      document: graph({ child: target.before, other: {} }),
      locks: { [parent]: { actorId: 'foreign', clientId: 'client', expiresAt: 101 } },
    };
    assert.deepEqual(partitionCollaborationConflict([target, independent], snapshot, 'actor', 'client'), {
      blocked: [target],
      safe: [independent],
    });
  });
}

for (const field of ['sourceId', 'targetId']) {
  for (const side of ['before', 'after']) {
    test(`partition checks an edge ${side}.${field} for foreign locks`, (t) => {
      t.mock.method(Date, 'now', () => 100000);
      const target = change(
        'edge',
        { sourceId: 'a', targetId: 'b' },
        { sourceId: 'c', targetId: 'd' },
        'edges',
      );
      const independent = change('other', {}, { label: 'safe' });
      const snapshot = {
        document: graph({ other: {} }, { edge: target.before }),
        locks: { [target[side][field]]: { actorId: 'foreign', clientId: 'client', expiresAt: 101 } },
      };
      assert.deepEqual(partitionCollaborationConflict([target, independent], snapshot, 'actor', 'client'), {
        blocked: [target],
        safe: [independent],
      });
    });
  }
}

test('partition expands dependency blocking to a fixed point even in reverse order', () => {
  const a = change('a', { value: 0 }, { value: 1 });
  const ab = change('ab', null, { sourceId: 'a', targetId: 'b' }, 'edges');
  const bc = change('bc', null, { sourceId: 'b', targetId: 'c' }, 'edges');
  const safe = change('z', { value: 0 }, { value: 1 });
  const changes = [bc, ab, a, safe];
  const snapshot = { document: graph({ a: { value: 2 }, z: { value: 0 } }) };
  const result = partitionCollaborationConflict(changes, snapshot, 'actor', 'client');
  assert.deepEqual(keys(result.blocked), ['nodes:a', 'edges:ab', 'edges:bc']);
  assert.deepEqual(result.safe, [safe]);
  assert.deepEqual(changes, [bc, ab, a, safe]);
});

test('partition propagates blocking through old and new parent connections', () => {
  const seed = change('parent', { value: 0 }, { value: 1 });
  const child = change('child', { parentId: 'parent' }, { parentId: 'newParent' });
  const sibling = change('sibling', null, { parentId: 'newParent' });
  const safe = change('safe', null, {});
  const snapshot = { document: graph({ parent: { value: 2 }, child: child.before }) };
  const result = partitionCollaborationConflict([sibling, child, seed, safe], snapshot, 'actor', 'client');
  assert.deepEqual(keys(result.blocked), ['nodes:parent', 'nodes:child', 'nodes:sibling']);
  assert.deepEqual(result.safe, [safe]);
});

test('partition uses null for absent remote objects and can keep an independent addition safe', () => {
  const seed = change('a', { x: 0 }, { x: 1 });
  const addition = change('new', null, { x: 1 });
  const result = partitionCollaborationConflict([seed, addition], { document: graph() }, 'actor', 'client');
  assert.deepEqual(result, { blocked: [seed], safe: [addition] });
});
