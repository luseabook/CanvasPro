import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectGroupContainmentReparentOps } from './groupMembership.js';
(test('groupMembership: resized group releases nodes outside its bounds', () => {
  const groupContainmentReparentOps = collectGroupContainmentReparentOps(
    {
      group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
      child: { id: 'child', type: 'ai-image', parentId: 'group', x: 120, y: 20, width: 20, height: 20 },
    },
    ['group'],
  );
  assert.deepEqual(groupContainmentReparentOps, [{ nodeId: 'child', parentId: null }]);
}),
  test('groupMembership: resized group adopts nodes contained in its bounds', () => {
    const groupContainmentReparentOps2 = collectGroupContainmentReparentOps(
      {
        group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
        child: { id: 'child', type: 'ai-image', parentId: null, x: 20, y: 20, width: 20, height: 20 },
      },
      ['group'],
    );
    assert.deepEqual(groupContainmentReparentOps2, [{ nodeId: 'child', parentId: 'group' }]);
  }),
  test('groupMembership: moved node joins the first containing group', () => {
    const groupContainmentReparentOps3 = collectGroupContainmentReparentOps(
      {
        group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
        child: { id: 'child', type: 'ai-image', parentId: null, x: 20, y: 20, width: 20, height: 20 },
      },
      ['child'],
    );
    assert.deepEqual(groupContainmentReparentOps3, [{ nodeId: 'child', parentId: 'group' }]);
  }),
  test('groupMembership: unchanged containment returns no ops', () => {
    const groupContainmentReparentOps4 = collectGroupContainmentReparentOps(
      {
        group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
        child: { id: 'child', type: 'ai-image', parentId: 'group', x: 20, y: 20, width: 20, height: 20 },
      },
      ['group'],
    );
    assert.deepEqual(groupContainmentReparentOps4, []);
  }));
