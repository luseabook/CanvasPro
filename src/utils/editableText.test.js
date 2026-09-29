import test from 'node:test';
import assert from 'node:assert/strict';

import { insertPlainTextAtSelection } from './editableText.js';

function fakeDocument({
  whiteSpace = 'normal',
  insertHtmlResult = true,
  insertTextResult = true,
  throwOnHtml = false,
} = {}) {
  const calls = [];
  const documentObject = {
    activeElement: { id: 'editor' },
    defaultView: {
      getComputedStyle(element) {
        assert.equal(element.id, 'editor');
        return { whiteSpace };
      },
    },
    execCommand(command, showUi, value) {
      calls.push({ command, showUi, value });
      if (command === 'insertHTML' && throwOnHtml) throw new Error('unsupported');
      return command === 'insertHTML' ? insertHtmlResult : insertTextResult;
    },
  };
  return { documentObject, calls };
}

test('editableText: escapes HTML and converts normal line breaks to br elements', () => {
  const { documentObject, calls } = fakeDocument();
  assert.equal(insertPlainTextAtSelection('a&<b>\nlast', { documentObject }), true);
  assert.deepEqual(calls, [
    {
      command: 'insertHTML',
      showUi: false,
      value: 'a&amp;&lt;b&gt;<br>last',
    },
  ]);
});

test('editableText: preserves line breaks in preformatted editors and marks the final break', () => {
  const { documentObject, calls } = fakeDocument({ whiteSpace: 'pre-wrap' });
  assert.equal(insertPlainTextAtSelection('first\nsecond\n', { documentObject }), true);
  assert.equal(calls[0].value, 'first\nsecond<br class="Apple-interchange-newline">');
});

test('editableText: falls back to insertText when insertHTML is unavailable', () => {
  const { documentObject, calls } = fakeDocument({
    insertHtmlResult: false,
    insertTextResult: true,
  });
  assert.equal(insertPlainTextAtSelection('plain', { documentObject }), true);
  assert.deepEqual(calls, [
    { command: 'insertHTML', showUi: false, value: 'plain' },
    { command: 'insertText', showUi: false, value: 'plain' },
  ]);
});

test('editableText: handles throws, missing execCommand, and empty text', () => {
  const throwing = fakeDocument({ throwOnHtml: true, insertTextResult: true });
  assert.equal(insertPlainTextAtSelection('plain', { documentObject: throwing.documentObject }), true);
  assert.deepEqual(throwing.calls, [
    { command: 'insertHTML', showUi: false, value: 'plain' },
    { command: 'insertText', showUi: false, value: 'plain' },
  ]);

  assert.equal(insertPlainTextAtSelection('plain', { documentObject: {} }), false);
  const empty = fakeDocument({ insertTextResult: true });
  assert.equal(insertPlainTextAtSelection(null, { documentObject: empty.documentObject }), true);
  assert.deepEqual(empty.calls, [{ command: 'insertText', showUi: false, value: '' }]);
});
