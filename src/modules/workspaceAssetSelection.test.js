import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  focusWorkspaceAssetCard,
  toggleWorkspaceAssetSelectAll,
  toggleWorkspaceAssetSelection,
  resolveWorkspaceCardMultiSelection,
  renderWorkspaceAssetSelectionActions,
} from './workspaceAssetSelection.js';

test('focuses the card whose data id matches exactly', () => {
  const focused = [];
  const match = { dataset: { storyAssetId: 'b' }, focus: (options) => focused.push(options) };
  const other = { dataset: { storyAssetId: 'a' }, focus: () => focused.push('wrong') };
  const seen = [];
  const root = {
    querySelectorAll(selector) {
      seen.push(selector);
      return [other, match];
    },
  };
  focusWorkspaceAssetCard(root, 'b');
  assert.deepEqual(seen, ['[data-story-asset-id]']);
  assert.deepEqual(focused, [{ preventScroll: true }]);
});

test('does not focus anything when the id is absent', () => {
  const focused = [];
  const root = {
    querySelectorAll: () => [{ dataset: { storyAssetId: 'a' }, focus: () => focused.push('a') }],
  };
  focusWorkspaceAssetCard(root, ' z ');
  assert.deepEqual(focused, []);
});

test('survives a root or card without the needed hooks', () => {
  assert.doesNotThrow(() => focusWorkspaceAssetCard(null, 'a'));
  assert.doesNotThrow(() => focusWorkspaceAssetCard({}, 'a'));
  assert.doesNotThrow(() =>
    focusWorkspaceAssetCard({ querySelectorAll: () => [{ dataset: { storyAssetId: 'a' } }] }, 'a'),
  );
});

test('returns every id when not all of them are selected', () => {
  const items = [{ id: 'a' }, { id: ' b ' }, { id: '' }, {}, null];
  assert.deepEqual(toggleWorkspaceAssetSelectAll(items, ['a']), ['a', 'b']);
});

test('clears the list when every id is already selected', () => {
  assert.deepEqual(toggleWorkspaceAssetSelectAll([{ id: 'a' }, { id: 'b' }], ['b', 'a', 'extra']), []);
});

test('returns an empty list when there is nothing to select', () => {
  assert.deepEqual(toggleWorkspaceAssetSelectAll(), []);
  assert.deepEqual(toggleWorkspaceAssetSelectAll([], ['a']), []);
  assert.deepEqual(toggleWorkspaceAssetSelectAll([{}, null], ['a']), []);
  assert.deepEqual(toggleWorkspaceAssetSelectAll('nope', 'nope'), []);
});

test('toggles an id on and off only in selection mode', () => {
  assert.deepEqual(toggleWorkspaceAssetSelection(['a'], 'b', true), ['a', 'b']);
  assert.deepEqual(toggleWorkspaceAssetSelection(['a', 'b'], 'b', true), ['a']);
  assert.deepEqual(toggleWorkspaceAssetSelection(['a'], 'a', true), []);
});

test('normalizes the selection when toggling is not allowed', () => {
  assert.deepEqual(toggleWorkspaceAssetSelection([' a ', '', 'b'], 'c', false), ['a', 'b']);
  assert.deepEqual(toggleWorkspaceAssetSelection(['a'], '  ', true), ['a']);
  assert.deepEqual(toggleWorkspaceAssetSelection('nope', 'a', true), ['a']);
  assert.deepEqual(toggleWorkspaceAssetSelection(), []);
  assert.deepEqual(toggleWorkspaceAssetSelection([' a '], 'a', true), []);
});

test('ranges across the ordered ids when shift-clicking', () => {
  const result = resolveWorkspaceCardMultiSelection({
    orderedIds: ['a', 'b', 'c', 'd'],
    activeItemId: 'b',
    itemId: 'd',
    shiftKey: true,
  });
  assert.deepEqual(result, { handled: true, selectionMode: true, selectedIds: ['b', 'c', 'd'] });
});

test('ranges backwards too', () => {
  const result = resolveWorkspaceCardMultiSelection({
    orderedIds: ['a', 'b', 'c', 'd'],
    activeItemId: 'd',
    itemId: 'b',
    shiftKey: true,
  });
  assert.deepEqual(result.selectedIds, ['b', 'c', 'd']);
});

test('falls back to a single id when the range cannot be anchored', () => {
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({ orderedIds: ['a', 'b'], itemId: 'b', shiftKey: true }).selectedIds,
    ['b'],
  );
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({
      orderedIds: ['a', 'b'],
      activeItemId: 'z',
      itemId: 'b',
      shiftKey: true,
    }).selectedIds,
    ['b'],
  );
});

test('deduplicates and trims the ordered ids', () => {
  const result = resolveWorkspaceCardMultiSelection({
    orderedIds: [' a ', '', 'a', 'b'],
    activeItemId: 'a',
    itemId: 'b',
    shiftKey: true,
  });
  assert.deepEqual(result.selectedIds, ['a', 'b']);
});

test('toggles within the ordered branch on a toggle click', () => {
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({
      orderedIds: ['a', 'b'],
      itemId: 'b',
      selectedIds: ['a'],
      toggleKey: true,
    }),
    { handled: true, selectionMode: true, selectedIds: ['a', 'b'] },
  );
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({
      orderedIds: ['a', 'b'],
      itemId: 'a',
      selectedIds: ['a'],
      toggleKey: true,
    }),
    { handled: true, selectionMode: false, selectedIds: [] },
  );
});

test('selects a single id on a plain click in the ordered branch', () => {
  assert.deepEqual(resolveWorkspaceCardMultiSelection({ orderedIds: ['a', 'b'], itemId: 'b' }), {
    handled: true,
    selectionMode: true,
    selectedIds: ['b'],
  });
});

test('ignores the ordered branch while disabled', () => {
  assert.deepEqual(resolveWorkspaceCardMultiSelection({ orderedIds: ['a'], itemId: 'a', enabled: false }), {
    handled: true,
    selectionMode: false,
    selectedIds: [],
  });
});

test('skips the ordered branch without a usable item id', () => {
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({ orderedIds: ['a'], itemId: '  ', selectionMode: true }),
    {
      handled: false,
      selectionMode: true,
      selectedIds: [],
    },
  );
});

test('starts a shift selection from the active id', () => {
  assert.deepEqual(resolveWorkspaceCardMultiSelection({ itemId: 'c', activeItemId: 'a', shiftKey: true }), {
    handled: true,
    selectionMode: true,
    selectedIds: ['a', 'c'],
  });
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({ itemId: 'c', activeItemId: '  ', shiftKey: true }).selectedIds,
    ['c'],
  );
});

test('toggles on a selection-mode click outside the ordered branch', () => {
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({ itemId: 'c', selectedIds: ['c'], selectionMode: true }),
    { handled: true, selectionMode: true, selectedIds: [] },
  );
  assert.deepEqual(
    resolveWorkspaceCardMultiSelection({ itemId: 'c', selectedIds: [' a '], selectionMode: true }),
    { handled: true, selectionMode: true, selectedIds: ['a', 'c'] },
  );
});

test('passes through untouched when the click is not a multi-select gesture', () => {
  assert.deepEqual(resolveWorkspaceCardMultiSelection({ itemId: 'a', selectedIds: ['b'] }), {
    handled: false,
    selectionMode: false,
    selectedIds: ['b'],
  });
  assert.deepEqual(resolveWorkspaceCardMultiSelection({ selectedIds: 'nope' }), {
    handled: false,
    selectionMode: false,
    selectedIds: [],
  });
  assert.deepEqual(resolveWorkspaceCardMultiSelection(), {
    handled: false,
    selectionMode: false,
    selectedIds: [],
  });
});

test('requires a strict boolean selection flag', () => {
  assert.deepEqual(resolveWorkspaceCardMultiSelection({ itemId: 'a', selectionMode: 1 }), {
    handled: false,
    selectionMode: false,
    selectedIds: [],
  });
  assert.deepEqual(resolveWorkspaceCardMultiSelection({ itemId: 'a', selectionMode: true, enabled: 'yes' }), {
    handled: false,
    selectionMode: true,
    selectedIds: [],
  });
});

test('renders the select-all button and the primary action', () => {
  const html = renderWorkspaceAssetSelectionActions({ selectedCount: 2, primaryActionHtml: '<b>x</b>' });
  assert.equal(
    html.startsWith(
      '<button type="button" class="story-secondary-button" data-workspace-action="toggle-all-assets" ' +
        'data-story-action="toggle-all-assets" aria-pressed="false">全选</button>',
    ),
    true,
  );
  assert.equal(html.endsWith('<b>x</b>'), true);
});

test('swaps the label and pressed state when everything is selected', () => {
  const html = renderWorkspaceAssetSelectionActions({ allSelected: true });
  assert.equal(html.includes('aria-pressed="true"'), true);
  assert.equal(html.includes('取消全选'), true);
  assert.equal(html.endsWith('</button>'), true);
});

test('omits the primary action when nothing is selected', () => {
  assert.equal(renderWorkspaceAssetSelectionActions().endsWith('</button>'), true);
  assert.equal(
    renderWorkspaceAssetSelectionActions({ selectedCount: 0, primaryActionHtml: '' }).includes('<b>'),
    false,
  );
});

test('shows the primary action once a count or a primary action exists', () => {
  assert.equal(
    renderWorkspaceAssetSelectionActions({ selectedCount: 0, primaryActionHtml: '' }).endsWith('</button>'),
    true,
  );
  assert.equal(
    renderWorkspaceAssetSelectionActions({ selectedCount: -3, primaryActionHtml: '' }).endsWith('</button>'),
    true,
  );
  assert.equal(
    renderWorkspaceAssetSelectionActions({ selectedCount: 'x', primaryActionHtml: '' }).endsWith('</button>'),
    true,
  );
  assert.equal(
    renderWorkspaceAssetSelectionActions({ selectedCount: '3', primaryActionHtml: 'x' }).endsWith('x'),
    true,
  );
  assert.equal(renderWorkspaceAssetSelectionActions({ selectedCount: '3' }).endsWith('</button>'), true);
});

test('accepts custom labels', () => {
  const html = renderWorkspaceAssetSelectionActions({ allSelected: true, clearSelectionLabel: '清空' });
  assert.equal(html.includes('>清空</button>'), true);
  assert.equal(
    renderWorkspaceAssetSelectionActions({ selectAllLabel: '全都要' }).includes('>全都要</button>'),
    true,
  );
});
