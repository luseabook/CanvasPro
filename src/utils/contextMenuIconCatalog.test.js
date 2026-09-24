import assert from 'node:assert/strict';
import test from 'node:test';
import { CONTEXT_MENU_ICON_IDS, resolveContextMenuIconDefinition } from './contextMenuIconCatalog.js';

const EXPECTED_ICON_IDS = [
  'comment',
  'action',
  'add-to-canvas',
  'add-to-library',
  'archive',
  'unarchive',
  'audio',
  'cancel',
  'collage',
  'compare',
  'copy',
  'cut',
  'delete',
  'details',
  'disable',
  'download',
  'duplicate',
  'edit',
  'enable',
  'favorite',
  'folder-open',
  'fullscreen',
  'generated',
  'grid',
  'image',
  'model',
  'move',
  'paste',
  'reveal',
  'save',
  'save-as',
  'package-export',
  'select-all',
  'send',
  'source',
  'text',
  'tone',
  'undo',
  'update',
  'video',
];

test('the exported id list is the frozen key order of the shape table', () => {
  assert.equal(Object.isFrozen(CONTEXT_MENU_ICON_IDS), true);
  assert.equal(Array.isArray(CONTEXT_MENU_ICON_IDS), true);
  assert.equal(CONTEXT_MENU_ICON_IDS.length, 40);
  assert.deepEqual([...CONTEXT_MENU_ICON_IDS], EXPECTED_ICON_IDS);
});

test('every catalogue entry is a non-empty list of [tag, attributes] pairs', () => {
  assert.equal(CONTEXT_MENU_ICON_IDS.length, 40);
  for (const iconId of CONTEXT_MENU_ICON_IDS) {
    const definition = resolveContextMenuIconDefinition(iconId);
    assert.equal(definition?.id, iconId, iconId);
    assert.equal(Array.isArray(definition.shapes), true, iconId);
    assert.ok(definition.shapes.length > 0, iconId);
    for (const [tag, attributes] of definition.shapes) {
      assert.equal(typeof tag, 'string', iconId);
      assert.ok(tag.length > 0, iconId);
      assert.equal(typeof attributes, 'object', iconId);
      assert.notEqual(attributes, null, iconId);
      assert.equal(Array.isArray(attributes), false, iconId);
    }
  }
});

test('aliases resolve to their target entry and keep the target id', () => {
  assert.equal(resolveContextMenuIconDefinition('folder')?.id, 'folder-open');
  assert.equal(resolveContextMenuIconDefinition('open')?.id, 'folder-open');
  assert.equal(resolveContextMenuIconDefinition('remove')?.id, 'delete');
  assert.equal(resolveContextMenuIconDefinition('settings')?.id, 'edit');
});

test('an alias reuses the very same shape array as its target', () => {
  const viaAlias = resolveContextMenuIconDefinition('folder');
  const viaTarget = resolveContextMenuIconDefinition('folder-open');
  assert.equal(viaAlias.shapes, viaTarget.shapes);
  assert.equal(viaAlias.shapes, resolveContextMenuIconDefinition('open').shapes);
  assert.notEqual(viaAlias, viaTarget);
});

test('alias names are not themselves advertised in the id list', () => {
  for (const alias of ['folder', 'open', 'remove', 'settings']) {
    assert.equal(CONTEXT_MENU_ICON_IDS.includes(alias), false, alias);
  }
  assert.equal(CONTEXT_MENU_ICON_IDS.includes('folder-open'), true);
  assert.equal(CONTEXT_MENU_ICON_IDS.includes('delete'), true);
  assert.equal(CONTEXT_MENU_ICON_IDS.includes('edit'), true);
});

test('unresolvable lookups all answer null', () => {
  assert.equal(resolveContextMenuIconDefinition(''), null);
  assert.equal(resolveContextMenuIconDefinition('   '), null);
  assert.equal(resolveContextMenuIconDefinition('no-such-icon'), null);
  assert.equal(resolveContextMenuIconDefinition(null), null);
  assert.equal(resolveContextMenuIconDefinition(undefined), null);
  assert.equal(resolveContextMenuIconDefinition(0), null);
  assert.equal(resolveContextMenuIconDefinition({}), null);
});

test('lookups trim surrounding whitespace but stay case sensitive', () => {
  assert.equal(resolveContextMenuIconDefinition('  text  ')?.id, 'text');
  assert.equal(resolveContextMenuIconDefinition('\tvideo\n')?.id, 'video');
  assert.equal(resolveContextMenuIconDefinition('  folder  ')?.id, 'folder-open');
  assert.equal(resolveContextMenuIconDefinition('TEXT'), null);
  assert.equal(resolveContextMenuIconDefinition('Folder'), null);
});

test('the returned definition is a fresh wrapper over the shared shapes', () => {
  const first = resolveContextMenuIconDefinition('comment');
  const second = resolveContextMenuIconDefinition('comment');
  assert.notEqual(first, second);
  assert.equal(first.shapes, second.shapes);
  assert.deepEqual(first.shapes, [
    [
      'path',
      { d: 'M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3V11.5A7.5 7.5 0 0 1 10.5 4h2a7.5 7.5 0 0 1 7.5 7.5Z' },
    ],
    ['path', { d: 'M7 10h9M7 14h6' }],
  ]);
});

test('numeric shape attributes are kept as numbers, not strings', () => {
  assert.deepEqual(resolveContextMenuIconDefinition('action').shapes, [
    ['circle', { cx: 12, cy: 12, r: 8.5 }],
    ['path', { d: 'M8.5 12h7M13 9.5l2.5 2.5-2.5 2.5' }],
  ]);
  const grid = resolveContextMenuIconDefinition('grid').shapes[0];
  assert.equal(grid[0], 'rect');
  assert.deepEqual(grid[1], { x: 3, y: 3, width: 18, height: 18, rx: 2 });
});
