import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addStoryboard3DObjectsToGroup,
  applyStoryboard3DHierarchyOperation,
  createStoryboard3DSceneGroup,
  deleteStoryboard3DSceneGroup,
  setStoryboard3DObjectParent,
  ungroupStoryboard3DSceneGroup,
  validateStoryboard3DSceneHierarchy,
} from './sceneHierarchy.js';
import { createStoryboard3DProject } from './projectModel.js';

function createObject(id, type = 'prop', parentId) {
  return {
    id,
    type,
    name: id,
    visible: true,
    locked: false,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    ...(parentId ? { parentId } : {}),
  };
}

test('sceneHierarchy: validates object ids, parents, and cycles', () => {
  const valid = validateStoryboard3DSceneHierarchy({
    objects: [createObject('group-a', 'group'), createObject('prop-a', 'prop', 'group-a')],
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.objectCount, 2);
  assert.equal(valid.groupCount, 1);

  const invalid = validateStoryboard3DSceneHierarchy({
    objects: [
      createObject('', 'prop'),
      createObject('dup', 'prop'),
      createObject('dup', 'prop'),
      createObject('self', 'group', 'self'),
      createObject('orphan', 'prop', 'missing'),
      createObject('bad-parent', 'prop', 'prop-parent'),
      createObject('prop-parent', 'prop'),
    ],
  });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.some((error) => error.code === 'HIERARCHY_DUPLICATE_OBJECT_ID'));
  assert.ok(invalid.errors.some((error) => error.code === 'HIERARCHY_SELF_PARENT'));
  assert.ok(invalid.errors.some((error) => error.code === 'HIERARCHY_PARENT_NOT_FOUND'));
  assert.ok(invalid.errors.some((error) => error.code === 'HIERARCHY_PARENT_NOT_GROUP'));

  const cycle = validateStoryboard3DSceneHierarchy({
    objects: [
      createObject('group-a', 'group', 'group-b'),
      createObject('group-b', 'group', 'group-a'),
    ],
  });
  assert.equal(cycle.ok, false);
  assert.ok(cycle.errors.some((error) => error.code === 'HIERARCHY_CYCLE'));
});

test('sceneHierarchy: creates, reparents, and renames groups without mutating input', () => {
  const scene = {
    objects: [createObject('prop-a'), createObject('prop-b')],
    shots: [],
  };
  const grouped = createStoryboard3DSceneGroup(scene, {
    id: 'group-a',
    name: 'Group A',
    childIds: ['prop-a', 'prop-b'],
  });

  assert.equal(scene.objects.length, 2);
  assert.equal(grouped.objects.length, 3);
  assert.equal(grouped.objects.find((object) => object.id === 'prop-a').parentId, 'group-a');
  assert.equal(grouped.objects.find((object) => object.id === 'prop-b').parentId, 'group-a');
  assert.throws(
    () => createStoryboard3DSceneGroup(grouped, { id: 'group-a' }),
    /already exists/u,
  );

  const moved = setStoryboard3DObjectParent(grouped, 'prop-b', null);
  assert.equal('parentId' in moved.objects.find((object) => object.id === 'prop-b'), false);
  assert.equal(grouped.objects.find((object) => object.id === 'prop-b').parentId, 'group-a');

  const added = addStoryboard3DObjectsToGroup(moved, ['prop-b'], 'group-a');
  assert.equal(added.objects.find((object) => object.id === 'prop-b').parentId, 'group-a');
});

test('sceneHierarchy: ungroups and deletes groups with descendant handling', () => {
  const scene = {
    objects: [
      createObject('root', 'group'),
      createObject('child-group', 'group', 'root'),
      createObject('leaf', 'prop', 'child-group'),
    ],
    shots: [],
  };

  const ungrouped = ungroupStoryboard3DSceneGroup(scene, 'child-group');
  assert.equal(ungrouped.objects.some((object) => object.id === 'child-group'), false);
  assert.equal(ungrouped.objects.find((object) => object.id === 'leaf').parentId, 'root');

  const deleted = deleteStoryboard3DSceneGroup(scene, 'root', { deleteChildren: true });
  assert.deepEqual(deleted.objects, []);
  assert.throws(() => deleteStoryboard3DSceneGroup(scene, 'missing'), /does not exist/u);
});

test('sceneHierarchy: applies hierarchy operations to a project', () => {
  const project = createStoryboard3DProject({
    idFactory: () => 'id',
    now: 10,
  });
  const scene = project.scenes[0];
  scene.objects.push(createObject('prop-a'));

  const created = applyStoryboard3DHierarchyOperation(
    project,
    scene.id,
    {
      type: 'create-group',
      args: { id: 'group-a', name: 'Group', childIds: ['prop-a'] },
    },
    { now: 20 },
  );
  assert.equal(created.updatedAt, 20);
  assert.equal(created.scenes[0].objects.find((object) => object.id === 'prop-a').parentId, 'group-a');

  const renamed = applyStoryboard3DHierarchyOperation(
    created,
    scene.id,
    { type: 'rename-group', args: { groupId: 'group-a', name: 'Renamed' } },
    { now: 30 },
  );
  assert.equal(renamed.scenes[0].objects.find((object) => object.id === 'group-a').name, 'Renamed');
  assert.throws(
    () => applyStoryboard3DHierarchyOperation(created, 'missing', { type: 'rename-group' }),
    /scene/u,
  );
});
