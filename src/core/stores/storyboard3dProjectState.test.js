import test from 'node:test';
import assert from 'node:assert/strict';

import { cloneStoryboard3DProjects, createStoryboard3DProjectActions } from './storyboard3dProjectState.js';

test('storyboard3dProjectState: clones arrays and rejects non-array project collections', () => {
  const clone = (value) => ({ ...value });
  const projects = [{ id: 'a', name: 'A' }];

  assert.deepEqual(
    cloneStoryboard3DProjects(projects, (items) => items.map(clone)),
    projects,
  );
  assert.deepEqual(cloneStoryboard3DProjects({ id: 'a' }, clone), []);
  assert.deepEqual(cloneStoryboard3DProjects(null, clone), []);
});

test('storyboard3dProjectState: upserts projects by trimmed id and writes a fresh list', () => {
  let projects = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ];
  const writes = [];
  const clone = (value) => ({ ...value });
  const actions = createStoryboard3DProjectActions({
    readProjects: () => projects,
    writeProjects: (next) => {
      writes.push(next);
      projects = next;
    },
    clone,
  });

  assert.deepEqual(actions.upsertStoryboard3DProject({ id: 'a', name: 'Updated' }), {
    id: 'a',
    name: 'Updated',
  });
  assert.deepEqual(
    projects.map((project) => project.name),
    ['Updated', 'B'],
  );
  assert.equal(writes.length, 1);

  assert.deepEqual(actions.upsertStoryboard3DProject({ id: ' c ', name: 'C' }), {
    id: ' c ',
    name: 'C',
  });
  assert.deepEqual(
    projects.map((project) => project.id),
    [' c ', 'a', 'b'],
  );
  assert.throws(() => actions.upsertStoryboard3DProject({ id: '   ' }), /需要项目 id/);
});

test('storyboard3dProjectState: deletes only existing projects and reports whether a write occurred', () => {
  let projects = [{ id: 'a' }, { id: 'b' }];
  const writes = [];
  const actions = createStoryboard3DProjectActions({
    readProjects: () => projects,
    writeProjects: (next) => {
      writes.push(next);
      projects = next;
    },
    clone: (value) => ({ ...value }),
  });

  assert.equal(actions.deleteStoryboard3DProject('a'), true);
  assert.deepEqual(projects, [{ id: 'b' }]);
  assert.equal(actions.deleteStoryboard3DProject('missing'), false);
  assert.equal(writes.length, 1);

  projects = null;
  assert.equal(actions.deleteStoryboard3DProject('b'), false);
  assert.equal(writes.length, 1);
});
