import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveWorkspaceLibraryContextSelection,
  createWorkspaceAssetLibraryContextMenuItems,
} from './workspaceAssetLibraryContextMenu.js';

test('keeps the whole selection when the clicked asset is inside it', () => {
  const selected = ['a', 'b', 'c'];
  const result = resolveWorkspaceLibraryContextSelection('b', true, selected);
  assert.deepEqual(result, ['a', 'b', 'c']);
  assert.notEqual(result, selected);
});

test('narrows to the clicked asset when it is outside the selection', () => {
  assert.deepEqual(resolveWorkspaceLibraryContextSelection('z', true, ['a', 'b']), ['z']);
});

test('narrows to the clicked asset outside of selection mode', () => {
  assert.deepEqual(resolveWorkspaceLibraryContextSelection('b', false, ['a', 'b']), ['b']);
  assert.deepEqual(resolveWorkspaceLibraryContextSelection('b'), ['b']);
});

test('treats any truthy selection mode as selection mode', () => {
  assert.deepEqual(resolveWorkspaceLibraryContextSelection('b', 1, ['a', 'b']), ['a', 'b']);
});

test('builds a single add-to-project entry', () => {
  const items = [{ label: 'x' }];
  const menu = createWorkspaceAssetLibraryContextMenuItems({ selectedCount: 2, items });
  assert.equal(menu.length, 1);
  assert.deepEqual(menu[0], {
    label: '加入到项目',
    icon: 'folder-open',
    disabled: false,
    subItems: items,
  });
});

test('appends the selected count while in selection mode', () => {
  assert.equal(
    createWorkspaceAssetLibraryContextMenuItems({ selectedCount: 3, selectionMode: true })[0].label,
    '加入到项目 (3)',
  );
  assert.equal(
    createWorkspaceAssetLibraryContextMenuItems({ selectedCount: 1, selectionMode: true })[0].label,
    '加入到项目 (1)',
  );
});

test('omits the count outside selection mode or with an empty selection', () => {
  assert.equal(createWorkspaceAssetLibraryContextMenuItems({ selectedCount: 3 })[0].label, '加入到项目');
  assert.equal(
    createWorkspaceAssetLibraryContextMenuItems({ selectedCount: 0, selectionMode: true })[0].label,
    '加入到项目',
  );
});

test('disables the entry until something is selected', () => {
  assert.equal(createWorkspaceAssetLibraryContextMenuItems()[0].disabled, true);
  assert.equal(createWorkspaceAssetLibraryContextMenuItems({ selectedCount: 0 })[0].disabled, true);
  assert.equal(createWorkspaceAssetLibraryContextMenuItems({ selectedCount: 4 })[0].disabled, false);
});
