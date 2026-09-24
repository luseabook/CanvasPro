import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContextMenuAccelerator } from './contextMenuShortcutAccelerators.js';

test('normalizeContextMenuAccelerator accepts modifier aliases and orders them', () => {
  assert.equal(normalizeContextMenuAccelerator(['ctrl', 'e']), 'CommandOrControl+E');
  assert.equal(normalizeContextMenuAccelerator(['meta', 'E']), 'CommandOrControl+E');
  assert.equal(normalizeContextMenuAccelerator(['cmd', 'E']), 'CommandOrControl+E');
  assert.equal(normalizeContextMenuAccelerator(['command', 'E']), 'CommandOrControl+E');
  assert.equal(normalizeContextMenuAccelerator(['cmdOrCtrl', 'E']), 'CommandOrControl+E');
  assert.equal(normalizeContextMenuAccelerator(['commandOrControl', 'E']), 'CommandOrControl+E');
  assert.equal(normalizeContextMenuAccelerator(['alt', 'shift', 'z']), 'Shift+Alt+Z');
  assert.equal(normalizeContextMenuAccelerator(['shift', 'ctrl', 'a']), 'CommandOrControl+Shift+A');
  assert.equal(normalizeContextMenuAccelerator(['option', 'e']), 'Alt+E');
});

test('normalizeContextMenuAccelerator resolves named keys, function keys and punctuation', () => {
  assert.equal(normalizeContextMenuAccelerator(['enter']), 'Enter');
  assert.equal(normalizeContextMenuAccelerator(['return']), 'Enter');
  assert.equal(normalizeContextMenuAccelerator(['esc']), 'Escape');
  assert.equal(normalizeContextMenuAccelerator(['arrowup']), 'Up');
  assert.equal(normalizeContextMenuAccelerator(['arrowleft']), 'Left');
  assert.equal(normalizeContextMenuAccelerator(['space']), 'Space');
  assert.equal(normalizeContextMenuAccelerator(['alt', 'f1']), 'Alt+F1');
  assert.equal(normalizeContextMenuAccelerator(['alt', 'f24']), 'Alt+F24');
  assert.equal(normalizeContextMenuAccelerator(['=']), 'Plus');
  assert.equal(normalizeContextMenuAccelerator(['+']), 'Plus');
  assert.equal(normalizeContextMenuAccelerator(['ctrl', '/']), 'CommandOrControl+Slash');
  assert.equal(normalizeContextMenuAccelerator(['ctrl', ';']), 'CommandOrControl+Semicolon');
  assert.equal(normalizeContextMenuAccelerator(['ctrl', '`']), 'CommandOrControl+`');
  assert.equal(normalizeContextMenuAccelerator(['ctrl', '~']), 'CommandOrControl+`');
  assert.equal(normalizeContextMenuAccelerator(['ctrl', '7']), 'CommandOrControl+7');
});

test('normalizeContextMenuAccelerator rejects invalid shapes', () => {
  assert.equal(normalizeContextMenuAccelerator([]), '');
  assert.equal(normalizeContextMenuAccelerator('alt+e'), '');
  assert.equal(normalizeContextMenuAccelerator(null), '');
  assert.equal(normalizeContextMenuAccelerator(undefined), '');
  assert.equal(normalizeContextMenuAccelerator(['ctrl', 'shift', 'alt', 'a', 'b']), '');
  assert.equal(normalizeContextMenuAccelerator(['f25']), '');
  assert.equal(normalizeContextMenuAccelerator(['unknown-key']), '');
  assert.equal(normalizeContextMenuAccelerator(['ctrl']), '');
  assert.equal(normalizeContextMenuAccelerator(['ctrl', 'shift']), '');
  assert.equal(normalizeContextMenuAccelerator(['a', 'b']), '');
  assert.equal(normalizeContextMenuAccelerator(['', 'a']), '');
});

test('normalizeContextMenuAccelerator allows the maximum of four keys', () => {
  assert.equal(normalizeContextMenuAccelerator(['ctrl', 'shift', 'alt', 'a']), 'CommandOrControl+Shift+Alt+A');
});
