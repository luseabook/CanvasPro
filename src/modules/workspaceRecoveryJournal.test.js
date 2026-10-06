import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceRecoveryJournal } from './workspaceRecoveryJournal.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('workspace recovery journal persists, clones, and clears snapshots', () => {
  const storage = createStorage(), journal = createWorkspaceRecoveryJournal({ storage, key: 'test', now: () => 42 });
  const snapshot = { revision: 3, projects: [{ id: 'p1' }] };
  assert.equal(journal.write(snapshot), true);
  snapshot.projects[0].id = 'changed';
  assert.deepEqual(journal.read(), { savedAt: 42, snapshot: { revision: 3, projects: [{ id: 'p1' }] } });
  journal.clear();
  assert.equal(journal.read(), null);
});

test('workspace recovery journal tolerates unavailable and corrupt storage', () => {
  const disabled = createWorkspaceRecoveryJournal({ storage: null });
  assert.equal(disabled.write({ projects: [] }), false);
  assert.equal(disabled.read(), null);
  const storage = createStorage();
  storage.setItem('broken', '{');
  assert.equal(createWorkspaceRecoveryJournal({ storage, key: 'broken' }).read(), null);
});
