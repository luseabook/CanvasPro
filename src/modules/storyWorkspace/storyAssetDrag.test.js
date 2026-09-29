import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_ASSET_DRAG_INDEX_MIME,
  STORY_ASSET_DRAG_MIME,
  activateStoryPromptDropSelection,
  getStoryPromptDropRange,
  hasStoryAssetDragData,
  readStoryAssetDragData,
  readStoryAssetDragItemIndex,
  writeStoryAssetDragData,
} from './storyAssetDrag.js';

test('storyAssetDrag: writes a trimmed asset id, a non-negative integer index, and copy effect', () => {
  const values = new Map();
  const dataTransfer = {
    effectAllowed: '',
    setData(type, value) {
      values.set(type, value);
      return true;
    },
  };

  assert.equal(writeStoryAssetDragData(dataTransfer, '  asset-1  ', 2.9), true);
  assert.equal(values.get(STORY_ASSET_DRAG_MIME), 'asset-1');
  assert.equal(values.get(STORY_ASSET_DRAG_INDEX_MIME), '2');
  assert.equal(dataTransfer.effectAllowed, 'copy');
});

test('storyAssetDrag: rejects invalid writes without throwing', () => {
  assert.equal(writeStoryAssetDragData(null, 'asset-1'), false);
  assert.equal(writeStoryAssetDragData({}, 'asset-1'), false);
  assert.equal(writeStoryAssetDragData({ setData: () => true }, '   '), false);
  assert.equal(
    writeStoryAssetDragData(
      {
        setData() {
          throw new Error('denied');
        },
      },
      'asset-1',
    ),
    false,
  );
});

test('storyAssetDrag: reads and normalizes drag payload values', () => {
  const dataTransfer = {
    getData(type) {
      if (type === STORY_ASSET_DRAG_MIME) return '  asset-2  ';
      if (type === STORY_ASSET_DRAG_INDEX_MIME) return '5.9';
      return '';
    },
  };

  assert.equal(readStoryAssetDragData(dataTransfer), 'asset-2');
  assert.equal(readStoryAssetDragItemIndex(dataTransfer), 5);
  assert.equal(readStoryAssetDragItemIndex({ getData: () => '-2' }), 0);
  assert.equal(readStoryAssetDragItemIndex({ getData: () => 'invalid' }), 0);
  assert.equal(
    readStoryAssetDragData({
      getData() {
        throw new Error('denied');
      },
    }),
    '',
  );
});

test('storyAssetDrag: recognizes the MIME type when the value cannot be read', () => {
  assert.equal(hasStoryAssetDragData({ getData: () => 'asset-3' }), true);
  assert.equal(hasStoryAssetDragData({ getData: () => '', types: [STORY_ASSET_DRAG_MIME] }), true);
  assert.equal(hasStoryAssetDragData({ getData: () => '', types: ['text/plain'] }), false);
  assert.equal(
    hasStoryAssetDragData({
      getData() {
        throw new Error('denied');
      },
      get types() {
        throw new Error('denied');
      },
    }),
    false,
  );
});

test('storyAssetDrag: resolves a prompt range only for text inside the editable surface', () => {
  const range = {
    collapsed: false,
    startContainer: null,
    startOffset: 0,
    setStart(node, offset) {
      this.startContainer = node;
      this.startOffset = offset;
    },
    collapse(value) {
      this.collapsed = value;
    },
  };
  const textNode = { nodeType: 3, parentElement: { closest: () => null } };
  const promptEl = {
    createRange: () => range,
    caretPositionFromPoint: () => ({ offsetNode: textNode, offset: 3 }),
    contains: (node) => node === textNode,
  };

  assert.equal(getStoryPromptDropRange(promptEl, promptEl, 10, 20), range);
  assert.equal(range.startContainer, textNode);
  assert.equal(range.startOffset, 3);
  assert.equal(range.collapsed, true);
  assert.equal(getStoryPromptDropRange(promptEl, { ...promptEl, contains: () => false }, 10, 20), null);
  assert.equal(
    getStoryPromptDropRange(
      {
        ...promptEl,
        caretPositionFromPoint: () => ({
          offsetNode: { ...textNode, parentElement: { closest: () => ({}) } },
          offset: 3,
        }),
      },
      promptEl,
      10,
      20,
    ),
    null,
  );
  assert.equal(getStoryPromptDropRange(promptEl, promptEl, NaN, 20), null);
});

test('storyAssetDrag: activates the resolved prompt selection and reports failures', () => {
  const calls = [];
  const range = {};
  const selection = {
    removeAllRanges: () => calls.push('remove'),
    addRange: (value) => calls.push(['add', value]),
  };
  const promptEl = {
    focus: (options) => calls.push(['focus', options]),
  };

  assert.equal(activateStoryPromptDropSelection({ getSelection: () => selection }, promptEl, range), true);
  assert.deepEqual(calls, [['focus', { preventScroll: true }], 'remove', ['add', range]]);
  assert.equal(activateStoryPromptDropSelection(null, promptEl, range), false);
  assert.equal(activateStoryPromptDropSelection({ getSelection: () => selection }, null, range), false);
  assert.equal(
    activateStoryPromptDropSelection(
      { getSelection: () => selection },
      {
        focus() {
          throw new Error('denied');
        },
      },
      range,
    ),
    false,
  );
});
