import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetAppearance,
  getWorkspaceAssetBaseAppearance,
  getWorkspaceAssetAppearanceStats,
} from './workspaceAssetAppearance.js';

const APPEARANCES = [{ id: 'a', imageUrl: 'a.png' }, { id: 'b', error: 'boom' }, { id: 'c' }];

test('returns exactly the array it was handed, or an empty one', () => {
  assert.equal(getWorkspaceAssetAppearances({ appearances: APPEARANCES }), APPEARANCES);
  assert.deepEqual(getWorkspaceAssetAppearances({ appearances: 'nope' }), []);
  assert.deepEqual(getWorkspaceAssetAppearances({}), []);
  assert.deepEqual(getWorkspaceAssetAppearances(), []);
  assert.deepEqual(getWorkspaceAssetAppearances(null), []);
});

test('picks the appearance by clamped index', () => {
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }, 1), APPEARANCES[1]);
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }, '2'), APPEARANCES[2]);
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }, 1.9), APPEARANCES[1]);
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }, -5), APPEARANCES[0]);
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }, 99), APPEARANCES[2]);
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }, Infinity), APPEARANCES[2]);
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }), APPEARANCES[0]);
  assert.deepEqual(getWorkspaceAssetAppearance({ appearances: APPEARANCES }, 'x'), APPEARANCES[0]);
});

test('returns null when there is nothing to pick', () => {
  assert.equal(getWorkspaceAssetAppearance({ appearances: [] }, 0), null);
  assert.equal(getWorkspaceAssetAppearance({}, 3), null);
  assert.equal(getWorkspaceAssetAppearance(), null);
});

test('finds the base appearance by trimmed id', () => {
  assert.deepEqual(
    getWorkspaceAssetBaseAppearance({ appearances: APPEARANCES, baseAppearanceId: 'b' }),
    APPEARANCES[1],
  );
  assert.deepEqual(getWorkspaceAssetBaseAppearance({ appearances: [{ id: ' x ' }], baseAppearanceId: 'x' }), {
    id: ' x ',
  });
});

test('returns null when the base appearance cannot be resolved', () => {
  assert.equal(getWorkspaceAssetBaseAppearance({ appearances: APPEARANCES }), null);
  assert.equal(getWorkspaceAssetBaseAppearance({ appearances: APPEARANCES, baseAppearanceId: '   ' }), null);
  assert.equal(getWorkspaceAssetBaseAppearance({ appearances: APPEARANCES, baseAppearanceId: 'z' }), null);
  assert.equal(getWorkspaceAssetBaseAppearance(), null);
});

test('counts generated, failed and pending appearances', () => {
  assert.deepEqual(getWorkspaceAssetAppearanceStats({ appearances: APPEARANCES }), {
    total: 3,
    generated: 1,
    failed: 1,
    pending: 1,
  });
});

test('treats an errored appearance that still has an image as generated', () => {
  assert.deepEqual(
    getWorkspaceAssetAppearanceStats({ appearances: [{ id: 'a', imageUrl: 'a.png', error: 'late' }] }),
    { total: 1, generated: 1, failed: 0, pending: 0 },
  );
});

test('treats blank urls and errors as neither generated nor failed', () => {
  assert.deepEqual(
    getWorkspaceAssetAppearanceStats({ appearances: [{ imageUrl: '   ', error: '  ' }, null] }),
    { total: 2, generated: 0, failed: 0, pending: 2 },
  );
});

test('reports all zeros for an empty library', () => {
  assert.deepEqual(getWorkspaceAssetAppearanceStats(), { total: 0, generated: 0, failed: 0, pending: 0 });
});
