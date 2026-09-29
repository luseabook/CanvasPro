import { test } from 'node:test';
import assert from 'node:assert/strict';

import { deletePromptMention, insertSelectedPromptMention } from './promptMentionSelection.js';

function createRange(extra = {}) {
  return {
    collapsed: true,
    startContainer: null,
    startOffset: 0,
    deleted: false,
    inserted: [],
    collapse(value) {
      this.collapsed = value;
    },
    cloneRange() {
      return { ...this };
    },
    deleteContents() {
      this.deleted = true;
    },
    insertNode(node) {
      this.inserted.push(node);
    },
    selectNode() {},
    selectNodeContents() {},
    setEnd() {},
    setStart(node, offset) {
      this.startContainer = node;
      this.startOffset = offset;
    },
    setStartAfter() {},
    ...extra,
  };
}

test('deletePromptMention: falls back to direct text slicing when execCommand is unavailable', () => {
  const calls = [];
  const state = { promptEl: { ownerDocument: {} } };
  const textNode = { nodeType: 3, textContent: 'abcdef' };
  const range = { collapsed: true, startContainer: textNode, startOffset: 3 };
  const pill = { remove: () => calls.push('remove') };

  deletePromptMention(state, pill, range, 'Backspace', () => calls.push('input'));
  assert.equal(textNode.textContent, 'def');
  assert.deepEqual(calls, ['remove', 'input']);

  const deleteTextNode = { nodeType: 3, textContent: 'abcdef' };
  deletePromptMention(
    state,
    { remove: () => calls.push('remove-delete') },
    { collapsed: true, startContainer: deleteTextNode, startOffset: 3 },
    'Delete',
    () => calls.push('input-delete'),
  );
  assert.equal(deleteTextNode.textContent, 'abc');
  assert.deepEqual(calls, ['remove', 'input', 'remove-delete', 'input-delete']);
});

test('deletePromptMention: commits the execCommand path and restores the selection on failure', () => {
  const calls = [];
  const selection = {
    rangeCount: 0,
    removeAllRanges: () => calls.push('remove-ranges'),
    addRange: (range) => calls.push(['add-range', range]),
  };
  const range = createRange();
  const documentObject = {
    execCommand: () => true,
    createRange: () => range,
    defaultView: { getSelection: () => selection },
  };
  const state = { promptEl: { ownerDocument: documentObject } };

  deletePromptMention(state, { remove() {} }, createRange(), 'Backspace', () => calls.push('input'));
  assert.deepEqual(calls, ['remove-ranges', ['add-range', range], 'input']);

  calls.length = 0;
  documentObject.execCommand = () => false;
  deletePromptMention(state, { remove() {} }, createRange(), 'Backspace', () => calls.push('input'));
  assert.equal(calls.filter((entry) => Array.isArray(entry)).length, 2);
  assert.equal(calls.includes('input'), false);
});

test('insertSelectedPromptMention: rejects unsupported environments before touching the DOM', () => {
  assert.equal(insertSelectedPromptMention(null, {}, {}, {}), null);
  assert.equal(
    insertSelectedPromptMention({ promptEl: { ownerDocument: {} } }, { pillKind: 'reference' }, {}, {}),
    null,
  );
});

test('insertSelectedPromptMention: replaces an edited pill and commits the hydrated prompt', () => {
  const calls = [];
  const clonePill = { marker: 'clone-pill' };
  const newPill = {
    marker: 'new-pill',
    cloneNode: () => clonePill,
  };
  const oldPill = { marker: 'old-pill', parentNode: null };
  const clonedRoot = {
    childNodes: [
      {
        replaceWith(node) {
          calls.push(['replace', node]);
        },
      },
    ],
    innerHTML: '<span class="ref-pill">候选人</span>',
    querySelectorAll: () => [newPill],
    textContent: '',
  };
  const root = {
    childNodes: [oldPill],
    cloneNode: () => clonedRoot,
    contains: (node) => node === oldPill,
    focus: (options) => calls.push(['focus', options]),
    querySelectorAll: () => [clonePill],
    scrollLeft: 12,
    scrollTop: 34,
  };
  oldPill.parentNode = root;
  const selection = {
    rangeCount: 0,
    getRangeAt: () => createRange(),
    removeAllRanges: () => calls.push('remove-ranges'),
    addRange: (range) => calls.push(['add-range', range]),
  };
  const documentObject = {
    createRange: () => createRange(),
    createTreeWalker: () => ({ nextNode: () => null }),
    defaultView: { getSelection: () => selection },
    execCommand: (command, _showUi, html) => {
      calls.push(['exec', command, html]);
      return true;
    },
  };
  root.ownerDocument = documentObject;
  const state = { promptEl: root };
  const helpers = {
    createPill: () => newPill,
    hydrate: (value) => calls.push(['hydrate', value]),
    commit: (value) => calls.push(['commit', value]),
  };

  assert.equal(
    insertSelectedPromptMention(state, { id: 'candidate-1' }, { pillToEdit: oldPill }, helpers),
    true,
  );
  assert.deepEqual(calls[0], ['replace', newPill]);
  assert.deepEqual(
    calls.find((entry) => Array.isArray(entry) && entry[0] === 'exec'),
    ['exec', 'insertHTML', '<span class="ref-pill">候选人</span>'],
  );
  assert.deepEqual(
    calls.find((entry) => Array.isArray(entry) && entry[0] === 'hydrate'),
    ['hydrate', state],
  );
  assert.deepEqual(
    calls.find((entry) => Array.isArray(entry) && entry[0] === 'commit'),
    ['commit', state],
  );
  assert.equal(root.scrollTop, 34);
  assert.equal(root.scrollLeft, 12);
});

test('insertSelectedPromptMention: requires another match when requested and returns false when execCommand fails', () => {
  const newPill = { cloneNode: () => ({}) };
  const oldPill = { parentNode: null };
  const clonedRoot = {
    childNodes: [{ replaceWith() {} }],
    innerHTML: '<span class="ref-pill"></span>',
    querySelectorAll: () => [newPill],
    textContent: '',
  };
  const root = {
    childNodes: [oldPill],
    cloneNode: () => clonedRoot,
    contains: (node) => node === oldPill,
    focus() {},
    querySelectorAll: () => [newPill],
    scrollLeft: 0,
    scrollTop: 0,
  };
  oldPill.parentNode = root;
  const selection = {
    rangeCount: 0,
    getRangeAt: () => createRange(),
    removeAllRanges() {},
    addRange() {},
  };
  const documentObject = {
    createRange: () => createRange(),
    createTreeWalker: () => ({ nextNode: () => null }),
    defaultView: { getSelection: () => selection },
    execCommand: () => false,
  };
  root.ownerDocument = documentObject;
  const helpers = {
    createPill: () => newPill,
    hydrate() {},
    commit() {},
  };

  assert.equal(
    insertSelectedPromptMention(
      { promptEl: root },
      { id: 'candidate-1' },
      { pillToEdit: oldPill, requireOtherMatches: true },
      helpers,
    ),
    null,
  );
  assert.equal(
    insertSelectedPromptMention({ promptEl: root }, { id: 'candidate-1' }, { pillToEdit: oldPill }, helpers),
    false,
  );
});
