import test from 'node:test';
import assert from 'node:assert/strict';

import { createStoryboard3DProject } from './projectModel.js';
import { createStoryboard3DProjectStore } from './projectStore.js';

function createSequenceIdFactory() {
  const counts = new Map();
  return (kind) => {
    const count = (counts.get(kind) || 0) + 1;
    counts.set(kind, count);
    return `${kind}-${count}`;
  };
}

test('projectStore: persists updates and exposes snapshots', () => {
  const persisted = [];
  let now = 10;
  const store = createStoryboard3DProjectStore(
    createStoryboard3DProject({ idFactory: createSequenceIdFactory(), now }),
    {
      now: () => now,
      idFactory: createSequenceIdFactory(),
      onPersist(snapshot, metadata) {
        persisted.push({ snapshot, metadata });
      },
    },
  );
  const events = [];
  const unsubscribe = store.subscribe((snapshot, metadata) => events.push({ snapshot, metadata }));

  const renamed = store.renameProject('  New name  ');
  assert.equal(renamed.name, 'New name');
  assert.equal(store.getSaveStatus(), 'saved');
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].metadata.reason, 'rename-project');
  assert.deepEqual(
    events.map((event) => event.metadata.reason),
    ['rename-project', 'rename-project'],
  );

  now = 20;
  const updated = store.updateProject('scene-title', (project) => {
    project.scenes[0].name = 'Opening';
  });
  assert.equal(updated.scenes[0].name, 'Opening');
  assert.equal(updated.updatedAt, 20);
  assert.equal(persisted.length, 2);
  assert.equal(persisted[1].metadata.reason, 'scene-title');

  unsubscribe();
  store.renameProject('After unsubscribe');
  assert.equal(events.length, 4);
});

test('projectStore: handles asynchronous persistence and revision races', async () => {
  const pending = [];
  const store = createStoryboard3DProjectStore(
    createStoryboard3DProject({ idFactory: createSequenceIdFactory(), now: 10 }),
    {
      now: () => 10,
      idFactory: createSequenceIdFactory(),
      onPersist() {
        return new Promise((resolve, reject) => pending.push({ resolve, reject }));
      },
    },
  );

  store.renameProject('First');
  assert.equal(store.getSaveStatus(), 'saving');
  store.renameProject('Second');
  assert.equal(store.getSaveStatus(), 'saving');
  assert.equal(pending.length, 2);

  pending[0].resolve();
  await Promise.resolve();
  assert.equal(store.getSaveStatus(), 'saving');

  pending[1].resolve();
  await Promise.resolve();
  assert.equal(store.getSaveStatus(), 'saved');

  store.renameProject('Third');
  pending[2].reject(new Error('disk full'));
  await Promise.resolve();
  assert.equal(store.getSaveStatus(), 'error');
});

test('projectStore: migrates, selects, creates, and destroys project state', () => {
  let now = 10;
  const store = createStoryboard3DProjectStore(
    createStoryboard3DProject({ idFactory: createSequenceIdFactory(), now }),
    {
      now: () => now,
      idFactory: createSequenceIdFactory(),
      onPersist() {},
    },
  );

  const loaded = store.load({
    id: 'loaded',
    version: 1,
    name: '',
    scenes: [{ id: 'scene-a', name: 'A', objects: [], shots: [] }],
  });
  assert.equal(loaded.id, 'loaded');
  assert.equal(loaded.version, 2);
  assert.equal(loaded.scenes.length, 1);

  now = 20;
  const selectionProject = store.createNew({ id: 'selection-project', name: 'Selection' });
  const sceneId = selectionProject.scenes[0].id;
  const selected = store.selectScene(sceneId);
  assert.equal(selected.activeSceneId, sceneId);
  assert.equal(store.selectScene('missing').activeSceneId, sceneId);

  const shotId = selectionProject.scenes[0].shots[0].id;
  const shotSelected = store.selectShot(shotId);
  assert.equal(shotSelected.scenes.find((scene) => scene.id === sceneId).activeShotId, shotId);
  assert.equal(store.selectShot('missing').scenes.find((scene) => scene.id === sceneId).activeShotId, shotId);

  const created = store.createNew({ id: 'new-project', name: 'New' });
  assert.equal(created.id, 'new-project');
  assert.equal(created.name, 'New');
  assert.notEqual(created.id, loaded.id);

  const events = [];
  store.subscribe((snapshot, metadata) => events.push(metadata.reason));
  store.destroy();
  store.renameProject('No listeners');
  assert.deepEqual(events, []);
});
