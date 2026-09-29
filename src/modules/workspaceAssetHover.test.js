import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWorkspaceAssetHoverCard, getWorkspaceAssetHoverCardId } from './workspaceAssetHover.js';

const DEFAULT_SELECTOR = '[data-workspace-asset-id], [data-workspace-asset-hover-id]';

test('queries the closest card with the default selector', () => {
  const seen = [];
  const card = { id: 'card' };
  const root = {
    closest(selector) {
      seen.push(selector);
      return card;
    },
  };
  assert.equal(getWorkspaceAssetHoverCard(root), card);
  assert.deepEqual(seen, [DEFAULT_SELECTOR]);
});

test('trims and forwards a custom selector', () => {
  const seen = [];
  const root = {
    closest(selector) {
      seen.push(selector);
      return null;
    },
  };
  assert.equal(getWorkspaceAssetHoverCard(root, { selector: '  .card  ' }), null);
  assert.deepEqual(seen, ['.card']);
});

test('returns null for a blank selector without querying', () => {
  let called = 0;
  const root = {
    closest() {
      called += 1;
      return { id: 'card' };
    },
  };
  for (const selector of ['', '   ', null]) {
    assert.equal(getWorkspaceAssetHoverCard(root, { selector }), null);
  }
  assert.equal(called, 0);
});

test('returns null when the root cannot be queried', () => {
  assert.equal(getWorkspaceAssetHoverCard(), null);
  assert.equal(getWorkspaceAssetHoverCard(null), null);
  assert.equal(getWorkspaceAssetHoverCard({}), null);
  assert.equal(getWorkspaceAssetHoverCard({ closest: () => undefined }), null);
});

test('prefers the hover id over the plain asset id', () => {
  assert.equal(
    getWorkspaceAssetHoverCardId({ dataset: { workspaceAssetHoverId: 'hover', workspaceAssetId: 'plain' } }),
    'hover',
  );
});

test('falls back to the plain asset id and trims it', () => {
  assert.equal(getWorkspaceAssetHoverCardId({ dataset: { workspaceAssetId: '  plain  ' } }), 'plain');
  assert.equal(
    getWorkspaceAssetHoverCardId({ dataset: { workspaceAssetHoverId: '   ', workspaceAssetId: 'plain' } }),
    'plain',
  );
});

test('honours a custom key order', () => {
  const target = { dataset: { workspaceAssetHoverId: 'hover', workspaceAssetId: 'plain' } };
  assert.equal(getWorkspaceAssetHoverCardId(target, { datasetKeys: ['workspaceAssetId'] }), 'plain');
  assert.equal(
    getWorkspaceAssetHoverCardId(target, { datasetKeys: ['missing', 'workspaceAssetHoverId'] }),
    'hover',
  );
});

test('returns an empty string when nothing is usable', () => {
  assert.equal(getWorkspaceAssetHoverCardId(), '');
  assert.equal(getWorkspaceAssetHoverCardId({}), '');
  assert.equal(getWorkspaceAssetHoverCardId({ dataset: {} }), '');
  assert.equal(getWorkspaceAssetHoverCardId({ dataset: { workspaceAssetHoverId: '  ' } }), '');
  assert.equal(
    getWorkspaceAssetHoverCardId({ dataset: { workspaceAssetHoverId: 'x' } }, { datasetKeys: 'nope' }),
    '',
  );
  assert.equal(
    getWorkspaceAssetHoverCardId({ dataset: { workspaceAssetHoverId: 'x' } }, { datasetKeys: null }),
    '',
  );
});
