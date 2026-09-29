import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CommandHistory,
  applyStoryboard3DObjectTransforms,
  createCommandHistory,
  createStoryboard3DProjectMutationCommand,
  createStoryboard3DTransformCommand,
} from './commandHistory.js';
import { cloneStoryboard3DProject, createStoryboard3DProject } from './projectModel.js';

function createSequenceIdFactory() {
  const counts = new Map();
  return (kind) => {
    const count = (counts.get(kind) || 0) + 1;
    counts.set(kind, count);
    return `${kind}-${count}`;
  };
}

test('commandHistory: executes, merges, undoes, and redoes commands', () => {
  const state = { value: 0 };
  const history = createCommandHistory({ context: state });
  const command = {
    type: 'increment',
    label: 'Increment',
    execute() {
      state.value += 1;
      return true;
    },
    undo() {
      state.value -= 1;
      return true;
    },
    redo() {
      state.value += 1;
      return true;
    },
  };

  assert.equal(history.execute(command), true);
  assert.equal(state.value, 1);
  assert.equal(history.getSnapshot().undoCount, 1);
  assert.equal(history.undo(), true);
  assert.equal(state.value, 0);
  assert.equal(history.getSnapshot().redoCount, 1);
  assert.equal(history.redo(), true);
  assert.equal(state.value, 1);

  let mergeCount = 0;
  const mergeable = {
    type: 'mergeable',
    label: 'Mergeable',
    mergeKey: 'merge',
    execute() {
      state.value += 1;
      return true;
    },
    undo() {
      state.value -= 1;
      return true;
    },
    mergeWith() {
      mergeCount += 1;
      return true;
    },
  };
  history.clear();
  history.execute(mergeable);
  history.execute(mergeable);
  assert.equal(mergeCount, 1);
  assert.equal(history.getSnapshot().undoCount, 1);
  assert.equal(state.value, 3);
});

test('commandHistory: commits and cancels transactions in order', () => {
  const state = [];
  const history = new CommandHistory({ context: state });
  const makeCommand = (value) => ({
    type: `add-${value}`,
    label: `Add ${value}`,
    execute() {
      state.push(value);
      return true;
    },
    undo() {
      state.pop();
      return true;
    },
  });

  history.beginTransaction('Add pair');
  history.execute(makeCommand('a'));
  history.execute(makeCommand('b'));
  assert.equal(history.getSnapshot().transactionActive, true);
  assert.equal(history.getSnapshot().transactionSize, 2);
  const transaction = history.commitTransaction();
  assert.equal(transaction.type, 'transaction');
  assert.deepEqual(state, ['a', 'b']);
  history.undo();
  assert.deepEqual(state, []);
  history.redo();
  assert.deepEqual(state, ['a', 'b']);

  history.beginTransaction('Cancel');
  history.execute(makeCommand('c'));
  assert.equal(history.cancelTransaction(), null);
  assert.deepEqual(state, ['a', 'b']);

  assert.throws(
    () => {
      history.beginTransaction('Nested');
      history.beginTransaction('Nested again');
    },
    /Nested/u,
  );
  history.cancelTransaction();
});

test('commandHistory: exposes busy state for asynchronous commands', async () => {
  let release;
  const history = createCommandHistory({ context: {} });
  const command = {
    type: 'async',
    label: 'Async',
    execute() {
      return new Promise((resolve) => {
        release = resolve;
      });
    },
    undo() {
      return true;
    },
  };

  const pending = history.execute(command);
  assert.equal(history.busy, true);
  assert.equal(history.getSnapshot().canUndo, false);
  assert.throws(() => history.execute(command), /busy/u);
  assert.equal(history.undo(), false);
  release('done');
  assert.equal(await pending, 'done');
  assert.equal(history.busy, false);
  assert.equal(history.getSnapshot().canUndo, true);
});

test('commandHistory: applies transform and project mutation commands with undo', () => {
  let current = createStoryboard3DProject({ idFactory: createSequenceIdFactory(), now: 10 });
  current.scenes[0].objects.push({
    id: 'prop-1',
    type: 'prop',
    name: 'Prop',
    visible: true,
    locked: false,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  });

  const context = {
    getProject: () => cloneStoryboard3DProject(current),
    replaceProject: (project) => {
      current = cloneStoryboard3DProject(project);
      return cloneStoryboard3DProject(current);
    },
  };
  const history = createCommandHistory({ context });
  const transform = createStoryboard3DTransformCommand({
    sceneId: current.scenes[0].id,
    transforms: { 'prop-1': { position: [2, 3, 4] } },
  });

  assert.ok(history.execute(transform));
  assert.deepEqual(
    current.scenes[0].objects.find((object) => object.id === 'prop-1').transform.position,
    [2, 3, 4],
  );
  history.undo();
  assert.deepEqual(
    current.scenes[0].objects.find((object) => object.id === 'prop-1').transform.position,
    [0, 0, 0],
  );
  history.redo();
  assert.deepEqual(
    current.scenes[0].objects.find((object) => object.id === 'prop-1').transform.position,
    [2, 3, 4],
  );

  const mutation = createStoryboard3DProjectMutationCommand({
    type: 'rename-project',
    label: 'Rename project',
    mutate(project) {
      project.name = 'Renamed';
    },
  });
  history.execute(mutation);
  assert.equal(current.name, 'Renamed');
  history.undo();
  assert.equal(current.name, '3D Storyboard');
  history.redo();
  assert.equal(current.name, 'Renamed');
});

test('commandHistory: respects object locks in transform application', () => {
  const project = createStoryboard3DProject({ idFactory: createSequenceIdFactory(), now: 10 });
  project.scenes[0].objects.push({
    id: 'locked-prop',
    type: 'prop',
    name: 'Locked',
    visible: true,
    locked: true,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  });

  const result = applyStoryboard3DObjectTransforms(project, {
    sceneId: project.scenes[0].id,
    transforms: { 'locked-prop': { position: [9, 9, 9] } },
  });
  assert.deepEqual(result.changedObjectIds, []);
  assert.deepEqual(result.project.scenes[0].objects.at(-1).transform.position, [0, 0, 0]);
});
