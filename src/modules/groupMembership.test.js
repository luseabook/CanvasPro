import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectGroupContainmentReparentOps } from './groupMembership.js';
(test('groupMembership: resized group releases nodes outside its bounds', () => {
  const _0x3efe22 = collectGroupContainmentReparentOps(
    {
      group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
      child: { id: 'child', type: 'ai-image', parentId: 'group', x: 120, y: 20, width: 20, height: 20 },
    },
    ['group'],
  );
  assert.deepEqual(_0x3efe22, [{ nodeId: 'child', parentId: null }]);
}),
  test('groupMembership: resized group adopts nodes contained in its bounds', () => {
    const _0x9b9a1d = collectGroupContainmentReparentOps(
      {
        group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
        child: { id: 'child', type: 'ai-image', parentId: null, x: 20, y: 20, width: 20, height: 20 },
      },
      ['group'],
    );
    assert.deepEqual(_0x9b9a1d, [{ nodeId: 'child', parentId: 'group' }]);
  }),
  test('groupMembership: moved node joins the first containing group', () => {
    const _0x1641ec = collectGroupContainmentReparentOps(
      {
        group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
        child: { id: 'child', type: 'ai-image', parentId: null, x: 20, y: 20, width: 20, height: 20 },
      },
      ['child'],
    );
    assert.deepEqual(_0x1641ec, [{ nodeId: 'child', parentId: 'group' }]);
  }),
  test('groupMembership: unchanged containment returns no ops', () => {
    const _0x48fbbd = collectGroupContainmentReparentOps(
      {
        group: { id: 'group', type: 'group', x: 0, y: 0, width: 100, height: 100 },
        child: { id: 'child', type: 'ai-image', parentId: 'group', x: 20, y: 20, width: 20, height: 20 },
      },
      ['group'],
    );
    assert.deepEqual(_0x48fbbd, []);
  }));
