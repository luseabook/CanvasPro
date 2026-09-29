import { test } from 'node:test';
import assert from 'node:assert/strict';
import { containWorkspaceContextMenu } from './workspaceContextMenuGuard.js';

test('swallows the native context menu and reports success', () => {
  const calls = [];
  const event = {
    preventDefault: () => calls.push('preventDefault'),
    stopPropagation: () => calls.push('stopPropagation'),
  };
  assert.equal(containWorkspaceContextMenu(event), true);
  assert.deepEqual(calls, ['preventDefault', 'stopPropagation']);
});

test('reports truthy for an event without the hooks', () => {
  assert.equal(containWorkspaceContextMenu({}), true);
  assert.equal(containWorkspaceContextMenu({ preventDefault: null, stopPropagation: null }), true);
});

test('reports false for a missing event', () => {
  assert.equal(containWorkspaceContextMenu(null), false);
  assert.equal(containWorkspaceContextMenu(undefined), false);
  assert.equal(containWorkspaceContextMenu(0), false);
  assert.equal(containWorkspaceContextMenu(''), false);
});
