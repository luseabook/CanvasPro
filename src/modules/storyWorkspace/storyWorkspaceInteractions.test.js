import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  captureStoryAssetListScrollPosition,
  findStoryAssetForHover,
  getStoryAssetHoverCard,
  getStoryAssetHoverCardId,
  isStoryGenerateShortcut,
  normalizeStoryEpisodePanelRatios,
  normalizeStoryAssetDetailSplitRatio,
  normalizeStoryAssetSplitRatio,
  restoreStoryAssetListScrollPosition,
  scrollStoryClipPromptHistoryWithWheel,
} from './storyWorkspaceInteractions.js';

test('storyWorkspaceInteractions: recognizes only the plain Ctrl/Meta+Enter generate shortcut', () => {
  assert.equal(isStoryGenerateShortcut({ key: 'Enter', ctrlKey: true }), true);
  assert.equal(isStoryGenerateShortcut({ key: 'Enter', metaKey: true }), true);
  assert.equal(isStoryGenerateShortcut({ key: 'Enter', ctrlKey: true, shiftKey: true }), false);
  assert.equal(isStoryGenerateShortcut({ key: 'Enter', ctrlKey: true, altKey: true }), false);
  assert.equal(isStoryGenerateShortcut({ key: 'Enter', ctrlKey: true, isComposing: true }), false);
  assert.equal(isStoryGenerateShortcut({ key: 'N', ctrlKey: true }), false);
});

test('storyWorkspaceInteractions: normalizes both asset split ratios through the shared workspace rules', () => {
  assert.equal(normalizeStoryAssetSplitRatio(10), 28);
  assert.equal(normalizeStoryAssetSplitRatio(80), 72);
  assert.equal(normalizeStoryAssetDetailSplitRatio(0), 32);
  assert.equal(normalizeStoryAssetDetailSplitRatio(90), 68);
});

test('storyWorkspaceInteractions: clamps episode panel ratios and keeps the center inside the remaining space', () => {
  assert.deepEqual(normalizeStoryEpisodePanelRatios(10, 99), { left: 14, center: 50 });
  assert.deepEqual(normalizeStoryEpisodePanelRatios(99, 0), { left: 34, center: 24 });
  assert.deepEqual(normalizeStoryEpisodePanelRatios(Number.NaN, Number.NaN), { left: 22, center: 34 });
});

test('storyWorkspaceInteractions: resolves hover cards and ids with stable dataset priority', () => {
  const card = {
    dataset: {
      storyAssetHoverId: 'hover-id',
      storyAssetId: 'asset-id',
      storyReferenceAsset: 'reference-id',
    },
  };
  const target = { closest: () => card };
  assert.equal(getStoryAssetHoverCard(target), card);
  assert.equal(getStoryAssetHoverCardId(card), 'hover-id');
  assert.equal(getStoryAssetHoverCardId({ dataset: { storyAssetId: 'asset-id' } }), 'asset-id');
  assert.equal(
    getStoryAssetHoverCardId({ dataset: { storyReferenceAsset: 'reference-id' } }),
    'reference-id',
  );
  assert.equal(getStoryAssetHoverCardId({ dataset: {} }), '');
  assert.equal(getStoryAssetHoverCard({}), null);
});

test('storyWorkspaceInteractions: finds hover assets in project data first and falls back to the provided list', () => {
  const projectAsset = { id: 1, label: 'project' };
  const fallbackAsset = { id: 2, label: 'fallback' };
  const state = { data: { assets: [projectAsset] } };

  assert.equal(findStoryAssetForHover(state, 1, [fallbackAsset]), projectAsset);
  assert.equal(findStoryAssetForHover(state, 2, [fallbackAsset]), fallbackAsset);
  assert.equal(findStoryAssetForHover(state, 'missing', [fallbackAsset]), null);
  assert.equal(findStoryAssetForHover({}, '2', [fallbackAsset]), fallbackAsset);
});

test('storyWorkspaceInteractions: captures and restores only the story asset list scroll position', () => {
  const list = { scrollTop: 123, scrollLeft: 45 };
  const root = { querySelector: (selector) => (selector === '.story-assets-list' ? list : null) };
  const position = captureStoryAssetListScrollPosition(root);
  assert.deepEqual(position, { top: 123, left: 45 });

  const nextList = { scrollTop: 0, scrollLeft: 0 };
  const nextRoot = {
    querySelector: (selector) => (selector === '.story-assets-list' ? nextList : null),
  };
  assert.equal(restoreStoryAssetListScrollPosition(nextRoot, position), true);
  assert.deepEqual(nextList, { scrollTop: 123, scrollLeft: 45 });
  assert.equal(restoreStoryAssetListScrollPosition({ querySelector: () => null }, position), false);
});

test('storyWorkspaceInteractions: manually scrolls the prompt history and stops propagation only when there is overflow', () => {
  const calls = [];
  const list = { clientHeight: 40, scrollHeight: 100, scrollTop: 10 };
  const event = {
    deltaY: 20,
    target: { closest: (selector) => (selector === '.story-clip-prompt-history-list' ? list : null) },
    preventDefault: () => calls.push('prevent'),
    stopPropagation: () => calls.push('stop'),
  };

  assert.equal(scrollStoryClipPromptHistoryWithWheel(event), true);
  assert.equal(list.scrollTop, 30);
  assert.deepEqual(calls, ['prevent', 'stop']);

  const noOverflow = { ...event, target: { closest: () => ({ clientHeight: 100, scrollHeight: 100 }) } };
  assert.equal(scrollStoryClipPromptHistoryWithWheel(noOverflow), false);
});
