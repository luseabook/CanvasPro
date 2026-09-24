import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeScreenshotAcceleratorKeys,
  normalizeShortcutToken,
  parseScreenshotShortcutPayload,
} from './screenshotShortcutAccelerators.js';

test('screenshotShortcutAccelerators: maps modifier and key aliases', () => {
  (assert.equal(normalizeShortcutToken('ctrl'), 'CommandOrControl'),
    assert.equal(normalizeShortcutToken('Control'), 'CommandOrControl'),
    assert.equal(normalizeShortcutToken('CmdOrCtrl'), 'CommandOrControl'),
    assert.equal(normalizeShortcutToken('CommandOrControl'), 'CommandOrControl'),
    assert.equal(normalizeShortcutToken('CommandOrCtrl'), 'CommandOrControl'),
    assert.equal(normalizeShortcutToken('shift'), 'Shift'),
    assert.equal(normalizeShortcutToken('ALT'), 'Alt'),
    assert.equal(normalizeShortcutToken('option'), 'Alt'),
    assert.equal(normalizeShortcutToken('Space'), 'Space'),
    assert.equal(normalizeShortcutToken('backquote'), '`'),
    assert.equal(normalizeShortcutToken('`'), '`'),
    assert.equal(normalizeShortcutToken('~'), '`'));
});

test('screenshotShortcutAccelerators: maps named keys, function keys and punctuation', () => {
  (assert.equal(normalizeShortcutToken('enter'), 'Enter'),
    assert.equal(normalizeShortcutToken('return'), 'Enter'),
    assert.equal(normalizeShortcutToken('esc'), 'Escape'),
    assert.equal(normalizeShortcutToken('ins'), 'Insert'),
    assert.equal(normalizeShortcutToken('del'), 'Delete'),
    assert.equal(normalizeShortcutToken('pageup'), 'PageUp'),
    assert.equal(normalizeShortcutToken('right'), 'Right'),
    assert.equal(normalizeShortcutToken('f1'), 'F1'),
    assert.equal(normalizeShortcutToken('f24'), 'F24'),
    assert.equal(normalizeShortcutToken('a'), 'A'),
    assert.equal(normalizeShortcutToken('7'), '7'),
    assert.equal(normalizeShortcutToken('='), 'Plus'),
    assert.equal(normalizeShortcutToken('+'), 'Plus'),
    assert.equal(normalizeShortcutToken('-'), 'Minus'),
    assert.equal(normalizeShortcutToken(','), 'Comma'),
    assert.equal(normalizeShortcutToken('.'), 'Period'),
    assert.equal(normalizeShortcutToken('/'), 'Slash'),
    assert.equal(normalizeShortcutToken('\\'), 'Backslash'),
    assert.equal(normalizeShortcutToken(';'), 'Semicolon'),
    assert.equal(normalizeShortcutToken("'"), 'Quote'),
    assert.equal(normalizeShortcutToken('['), 'BracketLeft'),
    assert.equal(normalizeShortcutToken(']'), 'BracketRight'));
});

test('screenshotShortcutAccelerators: rejects unknown tokens and out-of-range function keys', () => {
  (assert.equal(normalizeShortcutToken('meta'), ''),
    assert.equal(normalizeShortcutToken('cmd'), ''),
    assert.equal(normalizeShortcutToken('f25'), ''),
    assert.equal(normalizeShortcutToken(''), ''),
    assert.equal(normalizeShortcutToken(null), ''),
    assert.equal(normalizeShortcutToken('unknown-key'), ''));
});

test('screenshotShortcutAccelerators: orders modifiers before a single primary key', () => {
  (assert.deepEqual(normalizeScreenshotAcceleratorKeys(['Alt', 'E']), ['Alt', 'E']),
    assert.deepEqual(normalizeScreenshotAcceleratorKeys(['Shift', 'Ctrl', 'K']), [
      'CommandOrControl',
      'Shift',
      'K',
    ]),
    assert.deepEqual(normalizeScreenshotAcceleratorKeys(['Alt', 'Shift', 'Ctrl', 'q']), [
      'CommandOrControl',
      'Shift',
      'Alt',
      'Q',
    ]),
    assert.deepEqual(normalizeScreenshotAcceleratorKeys(['Ctrl', 'space']), [
      'CommandOrControl',
      'Space',
    ]));
});

test('screenshotShortcutAccelerators: rejects modifiers-only, multi-primary and unknown keys', () => {
  (assert.equal(normalizeScreenshotAcceleratorKeys([]), null),
    assert.equal(normalizeScreenshotAcceleratorKeys(['Ctrl', 'Shift']), null),
    assert.equal(normalizeScreenshotAcceleratorKeys(['Alt']), null),
    assert.equal(normalizeScreenshotAcceleratorKeys(['Ctrl', 'A', 'B']), null),
    assert.equal(normalizeScreenshotAcceleratorKeys(['Ctrl', 'Shift', 'Alt', 'K', 'A']), null),
    assert.equal(normalizeScreenshotAcceleratorKeys(['Ctrl', 'unknown-key']), null),
    assert.equal(normalizeScreenshotAcceleratorKeys('Alt+E'), null));
});

test('screenshotShortcutAccelerators: parses keys arrays and accelerator strings', () => {
  (assert.deepEqual(parseScreenshotShortcutPayload({ keys: ['Alt', 'E'] }), {
    ok: true,
    accelerator: 'Alt+E',
    keys: ['Alt', 'E'],
  }),
    assert.deepEqual(parseScreenshotShortcutPayload({ accelerator: 'Alt+Q' }), {
      ok: true,
      accelerator: 'Alt+Q',
      keys: ['Alt', 'Q'],
    }),
    assert.deepEqual(parseScreenshotShortcutPayload({ accelerator: 'Ctrl+Shift+K' }), {
      ok: true,
      accelerator: 'CommandOrControl+Shift+K',
      keys: ['CommandOrControl', 'Shift', 'K'],
    }));
});

test('screenshotShortcutAccelerators: reports invalid-shortcut payloads', () => {
  (assert.deepEqual(parseScreenshotShortcutPayload(), { ok: false, reason: 'invalid-shortcut' }),
    assert.deepEqual(parseScreenshotShortcutPayload({}), { ok: false, reason: 'invalid-shortcut' }),
    assert.deepEqual(parseScreenshotShortcutPayload({ keys: [] }), {
      ok: false,
      reason: 'invalid-shortcut',
    }),
    assert.deepEqual(parseScreenshotShortcutPayload({ accelerator: 'Alt' }), {
      ok: false,
      reason: 'invalid-shortcut',
    }),
    assert.deepEqual(parseScreenshotShortcutPayload({ accelerator: '' }), {
      ok: false,
      reason: 'invalid-shortcut',
    }),
    assert.deepEqual(parseScreenshotShortcutPayload({ keys: 'Alt+E' }), {
      ok: false,
      reason: 'invalid-shortcut',
    }));
});
