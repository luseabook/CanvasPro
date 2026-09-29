import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderWorkspaceEpisodeRail } from './workspaceEpisodeRailPresentation.js';

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test('renders an empty rail with the default label and a zero count', () => {
  assert.deepEqual(
    renderWorkspaceEpisodeRail(),
    '<aside class="workspace-episode-rail" data-workspace-episode-rail aria-label="分集列表">\n' +
      '    <header><span>分集</span><strong>0</strong></header>\n' +
      '    <div class="workspace-episode-rail-list" data-workspace-episode-rail-list>\n' +
      '      \n' +
      '    </div>\n  </aside>',
  );
});

test('renders a single selected episode with the exact markup', () => {
  const html = renderWorkspaceEpisodeRail({
    items: [{ id: 'ep-1', number: '3', title: 'Hello', meta: '12' }],
    selectedId: 'ep-1',
  });
  assert.deepEqual(
    html,
    '<aside class="workspace-episode-rail" data-workspace-episode-rail aria-label="分集列表">\n' +
      '    <header><span>分集</span><strong>1</strong></header>\n' +
      '    <div class="workspace-episode-rail-list" data-workspace-episode-rail-list>\n' +
      '      ' +
      '<button type="button" class="is-active" data-workspace-episode-rail-item="ep-1" aria-pressed="true" aria-current="page" aria-label="第 3 集：Hello">\n' +
      '          <span>3</span>\n' +
      '          \n' +
      '          <small>12</small>\n' +
      '        </button>' +
      '\n    </div>\n  </aside>',
  );
});

test('derives id, title, meta and the number from the item position', () => {
  const html = renderWorkspaceEpisodeRail({
    items: [{ id: 'a' }, { id: 'b', number: '9', title: 'Nine', meta: '3' }],
  });
  assert.equal(count(html, 'data-workspace-episode-rail-item='), 2);
  assert.ok(html.includes('data-workspace-episode-rail-item="a"'));
  assert.ok(html.includes('<span>1</span>'));
  assert.ok(html.includes('aria-label="第 1 集：第 1 集"'));
  assert.ok(html.includes('<small>0</small>'));
  assert.ok(html.includes('data-workspace-episode-rail-item="b"'));
  assert.ok(html.includes('aria-label="第 9 集：Nine"'));
  assert.ok(html.includes('<small>3</small>'));
});

test('keeps the original array position when an item is dropped', () => {
  const html = renderWorkspaceEpisodeRail({ items: [{ number: 'zero' }, { id: 'b' }] });
  assert.equal(count(html, 'data-workspace-episode-rail-item='), 1);
  assert.ok(html.includes('<strong>1</strong>'));
  assert.ok(html.includes('data-workspace-episode-rail-item="b"'));
  assert.ok(html.includes('<span>2</span>'));
  assert.ok(html.includes('aria-label="第 2 集：第 2 集"'));
});

test('treats a non-array items option as an empty list', () => {
  for (const items of [null, undefined, 'nope', 42, {}]) {
    assert.ok(renderWorkspaceEpisodeRail({ items }).includes('<strong>0</strong>'));
    assert.equal(count(renderWorkspaceEpisodeRail({ items }), '<button type="button"'), 0);
  }
});

test('treats a zero or blank number as usable', () => {
  const html = renderWorkspaceEpisodeRail({
    items: [
      { id: 'a', number: 0 },
      { id: 'b', number: '   ' },
    ],
  });
  assert.ok(html.includes('<span>0</span>'));
  assert.ok(html.includes('aria-label="第 0 集：第 0 集"'));
  assert.ok(html.includes('<span>2</span>'));
  assert.ok(html.includes('aria-label="第 2 集：第 2 集"'));
});

test('does not mutate the given items', () => {
  const items = [{ id: 'b' }, { id: 'a', number: 4, busy: true }];
  const snapshot = JSON.parse(JSON.stringify(items));
  renderWorkspaceEpisodeRail({ items });
  assert.deepEqual(items, snapshot);
  assert.deepEqual(Object.keys(items[0]), ['id']);
});

test('marks the trimmed selection active and exposes its aria state', () => {
  const html = renderWorkspaceEpisodeRail({
    items: [{ id: 'ep-1' }, { id: 'ep-2' }],
    selectedId: '  ep-1  ',
  });
  assert.equal(count(html, 'class="is-active"'), 1);
  assert.equal(count(html, 'aria-current="page"'), 1);
  assert.ok(html.includes('data-workspace-episode-rail-item="ep-1" aria-pressed="true" aria-current="page"'));
  assert.ok(html.includes('data-workspace-episode-rail-item="ep-2" aria-pressed="false"'));
  assert.equal(count(html, 'aria-pressed="false"'), 1);
});

test('treats a blank or nullish selection as nothing selected', () => {
  const items = [{ id: 'ep-1' }];
  for (const selectedId of ['', '   ', null, undefined]) {
    const html = renderWorkspaceEpisodeRail({ items, selectedId });
    assert.equal(count(html, 'is-active'), 0);
    assert.equal(count(html, 'aria-current="page"'), 0);
    assert.ok(html.includes('aria-pressed="false"'));
  }
});

test('renders the disabled and busy flags only for a strict true', () => {
  const html = renderWorkspaceEpisodeRail({
    items: [
      { id: 'a', disabled: true, busy: true },
      { id: 'b', disabled: 1, busy: 'yes' },
    ],
  });
  assert.equal(count(html, ' disabled aria-disabled="true"'), 1);
  assert.equal(count(html, 'storyboard-script-loading-spinner'), 1);
  assert.ok(
    html.includes('data-workspace-episode-rail-item="a" aria-pressed="false" disabled aria-disabled="true"'),
  );
  assert.ok(html.includes('data-workspace-episode-rail-item="b" aria-pressed="false" aria-label='));
});

test('spreads the aside, list and per-button data attributes', () => {
  const html = renderWorkspaceEpisodeRail({
    items: [{ id: 'a' }],
    asideData: { 'data-foo': 'bar', 'data-bare': true, 'data-off': false, 'data-nil': null },
    listData: { 'data-list': '1' },
    getButtonData: (item) => ({ 'data-id': item.id, 'data-nope': false }),
  });
  assert.ok(html.includes('data-workspace-episode-rail data-foo="bar" data-bare aria-label='));
  assert.ok(html.includes('data-workspace-episode-rail-list data-list="1"'));
  assert.ok(html.includes('data-id="a"'));
  assert.ok(!html.includes('data-off'));
  assert.ok(!html.includes('data-nil'));
  assert.ok(!html.includes('data-nope'));
});

test('normalizes data attribute names and drops invalid ones', () => {
  const html = renderWorkspaceEpisodeRail({
    asideData: { ' DATA-Foo ': 'v', 'data-1': 'v', 'data-a_b': 'v', plain: 'v', 'data-ok': '<&">' },
  });
  assert.ok(html.includes(' data-foo="v"'));
  assert.ok(html.includes(' data-ok="&lt;&amp;&quot;&gt;"'));
  assert.ok(!html.includes('data-1'));
  assert.ok(!html.includes('data-a_b'));
  assert.ok(!html.includes('plain'));
});

test('renders zero and empty string data values', () => {
  const html = renderWorkspaceEpisodeRail({
    listData: { 'data-zero': 0, 'data-empty': '', 'data-space': ' ' },
  });
  assert.ok(html.includes(' data-zero="0"'));
  assert.ok(html.includes(' data-empty=""'));
  assert.ok(html.includes(' data-space=" "'));
});

test('passes each normalized episode to getButtonData', () => {
  const seen = [];
  renderWorkspaceEpisodeRail({
    items: [{ id: 'ep-1', number: '3', title: 'Hello', meta: '12', thumb: 'x' }],
    getButtonData: (item) => {
      seen.push(item);
      return {};
    },
  });
  assert.deepEqual(seen, [
    { id: 'ep-1', number: '3', title: 'Hello', meta: '12', thumb: 'x', busy: false, disabled: false },
  ]);
});

test('escapes the label, the aria label and every episode field', () => {
  const html = renderWorkspaceEpisodeRail({
    label: '<script>',
    ariaLabel: '"quoted"',
    items: [{ id: 'a', number: '<1>', title: 'Tom & Jerry', meta: 'a"b' }],
  });
  assert.ok(html.includes('<span>&lt;script&gt;</span>'));
  assert.ok(html.includes('aria-label="&quot;quoted&quot;"'));
  assert.ok(html.includes('data-workspace-episode-rail-item="a"'));
  assert.ok(html.includes('<span>&lt;1&gt;</span>'));
  assert.ok(html.includes('第 &lt;1&gt; 集：Tom &amp; Jerry'));
  assert.ok(html.includes('<small>a&quot;b</small>'));
  assert.ok(!html.includes('<script>'));
});
