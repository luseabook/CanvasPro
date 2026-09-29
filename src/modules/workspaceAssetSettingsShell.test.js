import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKSPACE_ASSET_SPLIT_RATIO_MIN,
  WORKSPACE_ASSET_SPLIT_RATIO_MAX,
  WORKSPACE_ASSET_SPLIT_RATIO_DEFAULT,
  WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MIN,
  WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MAX,
  WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_DEFAULT,
  normalizeWorkspaceAssetSplitRatio,
  normalizeWorkspaceAssetDetailSplitRatio,
  applyWorkspaceAssetSplitRatioToLayout,
  applyWorkspaceAssetDetailSplitRatioToLayout,
  renderWorkspaceAssetSettingsShell,
} from './workspaceAssetSettingsShell.js';

function makeLayout() {
  const calls = [];
  return {
    calls,
    element: {
      style: {
        setProperty(name, value) {
          calls.push([name, String(value)]);
        },
      },
    },
  };
}

function makeHandle() {
  const attributes = {};
  return {
    attributes,
    element: {
      setAttribute(name, value) {
        attributes[name] = value;
      },
    },
  };
}

test('exposes the documented split ratio bounds and defaults', () => {
  assert.deepEqual(
    [
      WORKSPACE_ASSET_SPLIT_RATIO_MIN,
      WORKSPACE_ASSET_SPLIT_RATIO_MAX,
      WORKSPACE_ASSET_SPLIT_RATIO_DEFAULT,
      WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MIN,
      WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_MAX,
      WORKSPACE_ASSET_DETAIL_SPLIT_RATIO_DEFAULT,
    ],
    [28, 72, 50, 32, 68, 50],
  );
});

test('normalize clamps to the minimum for zero, negatives and blank input', () => {
  for (const value of [0, -5, -0.5, 27.9, null, '', false]) {
    assert.equal(normalizeWorkspaceAssetSplitRatio(value), 28, `value ${String(value)}`);
  }
});

test('normalize clamps to the maximum above the upper bound', () => {
  for (const value of [73, 100, 1000, 72.5]) {
    assert.equal(normalizeWorkspaceAssetSplitRatio(value), 72, `value ${String(value)}`);
  }
});

test('normalize keeps in range values untouched, including decimals and numeric strings', () => {
  assert.equal(normalizeWorkspaceAssetSplitRatio(28), 28);
  assert.equal(normalizeWorkspaceAssetSplitRatio(40.25), 40.25);
  assert.equal(normalizeWorkspaceAssetSplitRatio(72), 72);
  assert.equal(normalizeWorkspaceAssetSplitRatio('35'), 35);
  assert.equal(normalizeWorkspaceAssetSplitRatio('71.5'), 71.5);
});

test('normalize falls back to the default for non finite input', () => {
  for (const value of [undefined, NaN, Infinity, -Infinity, 'abc', {}, 'NaN']) {
    assert.equal(normalizeWorkspaceAssetSplitRatio(value), 50, `value ${String(value)}`);
  }
});

test('the detail normalize uses its own bounds and default', () => {
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(undefined), 50);
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(NaN), 50);
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(Infinity), 50);
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(0), 32);
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(31.9), 32);
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(32), 32);
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(67.5), 67.5);
  assert.equal(normalizeWorkspaceAssetDetailSplitRatio(100), 68);
});

test('applying a split ratio writes the css variable and the aria value', () => {
  const layout = makeLayout();
  const handle = makeHandle();
  const result = applyWorkspaceAssetSplitRatioToLayout(layout.element, handle.element, 40);
  assert.equal(result, 40);
  assert.deepEqual(layout.calls, [['--story-assets-left', '40%']]);
  assert.equal(handle.attributes['aria-valuenow'], '40');
});

test('applying a split ratio rounds the aria value but returns the raw ratio', () => {
  const low = makeLayout();
  const lowHandle = makeHandle();
  assert.equal(applyWorkspaceAssetSplitRatioToLayout(low.element, lowHandle.element, 27.2), 28);
  assert.deepEqual(low.calls, [['--story-assets-left', '28%']]);
  assert.equal(lowHandle.attributes['aria-valuenow'], '28');

  const high = makeLayout();
  const highHandle = makeHandle();
  assert.equal(applyWorkspaceAssetSplitRatioToLayout(high.element, highHandle.element, 71.6), 71.6);
  assert.deepEqual(high.calls, [['--story-assets-left', '71.6%']]);
  assert.equal(highHandle.attributes['aria-valuenow'], '72');
});

test('applying a split ratio honours a custom style property', () => {
  const layout = makeLayout();
  const handle = makeHandle();
  applyWorkspaceAssetSplitRatioToLayout(layout.element, handle.element, 60, { styleProperty: '--custom' });
  assert.deepEqual(layout.calls, [['--custom', '60%']]);
});

test('applying a split ratio tolerates missing elements', () => {
  assert.equal(applyWorkspaceAssetSplitRatioToLayout(undefined, undefined, '200'), 72);
  assert.equal(applyWorkspaceAssetSplitRatioToLayout({}, {}, undefined), 50);
  assert.doesNotThrow(() => applyWorkspaceAssetSplitRatioToLayout(null, null, 0));
});

test('applying a detail ratio targets the detail variable', () => {
  const layout = makeLayout();
  const handle = makeHandle();
  assert.equal(applyWorkspaceAssetDetailSplitRatioToLayout(layout.element, handle.element, 30), 32);
  assert.deepEqual(layout.calls, [['--workspace-asset-detail-top', '32%']]);
  assert.equal(handle.attributes['aria-valuenow'], '32');
});

test('applying a detail ratio clamps, rounds and accepts a custom property', () => {
  const layout = makeLayout();
  const handle = makeHandle();
  assert.equal(
    applyWorkspaceAssetDetailSplitRatioToLayout(layout.element, handle.element, 100, {
      styleProperty: '--detail',
    }),
    68,
  );
  assert.deepEqual(layout.calls, [['--detail', '68%']]);
  assert.equal(handle.attributes['aria-valuenow'], '68');

  const rounded = makeLayout();
  const roundedHandle = makeHandle();
  applyWorkspaceAssetDetailSplitRatioToLayout(rounded.element, roundedHandle.element, 67.5);
  assert.equal(roundedHandle.attributes['aria-valuenow'], '68');
  assert.deepEqual(rounded.calls, [['--workspace-asset-detail-top', '67.5%']]);
});

test('renders the page shell with the default options', () => {
  const html = renderWorkspaceAssetSettingsShell();
  assert.equal(typeof html, 'string');
  assert.equal(html, renderWorkspaceAssetSettingsShell({}));
  assert.ok(
    html.includes(
      '<div class="story-assets-page story-content-page" data-story-marquee-page-surface="assets" data-workspace-marquee-page-surface="assets">',
    ),
  );
  assert.ok(
    html.includes(
      '<div class="story-assets-switch-region" data-story-assets-switch-region data-workspace-assets-switch-region>',
    ),
  );
  assert.ok(html.includes('<div class="story-assets-layout" style="--story-assets-left: 50%;">'));
  assert.ok(
    html.includes(
      '<section class="story-assets-list" data-story-marquee-surface="assets" data-workspace-marquee-surface="assets">',
    ),
  );
  assert.ok(html.includes('<div class="story-asset-grid workspace-project-asset-grid">'));
  assert.ok(html.includes('<div class="story-inline-empty">暂无素材</div>'));
  assert.ok(html.includes('<header class="story-page-heading">'));
  assert.ok(html.includes('<div class="story-asset-tabs" role="tablist" aria-label="素材分类"'));
  assert.ok(html.includes('data-active-tab=""'));
  assert.ok(html.includes('data-tab-count="1"'));
  assert.ok(html.includes('role="separator"'));
  assert.ok(html.includes('aria-orientation="vertical"'));
  assert.ok(html.includes('aria-valuemin="28" aria-valuemax="72" aria-valuenow="50"'));
  assert.ok(html.includes('<div class="story-assets-callout">'));
  assert.ok(html.includes('<div class="story-assets-callout-actions"></div>'));
  assert.ok(html.endsWith('</div>'));
});

test('renders an extra class name only when given, escaped', () => {
  const plain = renderWorkspaceAssetSettingsShell();
  assert.ok(plain.includes('class="story-assets-page story-content-page"'));
  const named = renderWorkspaceAssetSettingsShell({ className: 'my-page other' });
  assert.ok(named.includes('class="story-assets-page story-content-page my-page other"'));
  const escaped = renderWorkspaceAssetSettingsShell({ className: 'a<b"c' });
  assert.ok(escaped.includes('class="story-assets-page story-content-page a&lt;b&quot;c"'));
});

test('falls back to an escaped empty text when there are no cards', () => {
  const custom = renderWorkspaceAssetSettingsShell({ emptyText: '<无素材>' });
  assert.ok(custom.includes('<div class="story-inline-empty">&lt;无素材&gt;</div>'));
  const cards = renderWorkspaceAssetSettingsShell({ cardsHtml: '<i id="card"></i>', emptyText: 'ignored' });
  assert.ok(cards.includes('<i id="card"></i>'));
  assert.equal(cards.includes('story-inline-empty'), false);
  assert.equal(cards.includes('ignored'), false);
});

test('inserts the raw html slots verbatim and in order', () => {
  const html = renderWorkspaceAssetSettingsShell({
    tabsHtml: '<button data-tab="a">A</button>',
    calloutActionsHtml: '<button class="go">去</button>',
    cardsHtml: '<div id="card"></div>',
    detailHtml: '<aside id="detail"></aside>',
    footerHtml: '<footer id="foot"></footer>',
  });
  for (const fragment of [
    '<button data-tab="a">A</button>',
    '<button class="go">去</button>',
    '<div id="card"></div>',
    '<aside id="detail"></aside>',
    '<footer id="foot"></footer>',
  ]) {
    assert.ok(html.includes(fragment), fragment);
  }
  assert.ok(html.indexOf('data-tab="a"') > html.indexOf('role="tablist"'));
  assert.ok(html.indexOf('id="card"') > html.indexOf('story-assets-list'));
  assert.ok(html.indexOf('id="detail"') > html.indexOf('id="card"'));
  assert.ok(html.indexOf('id="foot"') > html.indexOf('id="detail"'));
});

test('normalizes the split ratio into the layout style and the splitter', () => {
  const high = renderWorkspaceAssetSettingsShell({ splitRatio: 100 });
  assert.ok(high.includes('style="--story-assets-left: 72%;"'));
  assert.ok(high.includes('aria-valuenow="72"'));

  const low = renderWorkspaceAssetSettingsShell({ splitRatio: 0 });
  assert.ok(low.includes('style="--story-assets-left: 28%;"'));
  assert.ok(low.includes('aria-valuenow="28"'));

  const raw = renderWorkspaceAssetSettingsShell({ splitRatio: '61.5' });
  assert.ok(raw.includes('style="--story-assets-left: 61.5%;"'));
  assert.ok(raw.includes('aria-valuenow="62"'));

  const missing = renderWorkspaceAssetSettingsShell({ splitRatio: NaN });
  assert.ok(missing.includes('style="--story-assets-left: 50%;"'));
});

test('switches the grid class for the library tab', () => {
  const library = renderWorkspaceAssetSettingsShell({ activeTab: 'library' });
  assert.ok(library.includes('<div class="story-asset-grid story-asset-grid--workspace-library">'));
  assert.ok(library.includes('data-active-tab="library"'));

  const project = renderWorkspaceAssetSettingsShell({ activeTab: 'project' });
  assert.ok(project.includes('<div class="story-asset-grid workspace-project-asset-grid">'));
  assert.ok(project.includes('data-active-tab="project"'));
});

test('escapes the active tab attribute and clamps the tab count', () => {
  const escaped = renderWorkspaceAssetSettingsShell({ activeTab: 'a"b<c' });
  assert.ok(escaped.includes('data-active-tab="a&quot;b&lt;c"'));

  assert.ok(renderWorkspaceAssetSettingsShell({ tabCount: 3 }).includes('data-tab-count="3"'));
  assert.ok(renderWorkspaceAssetSettingsShell({ tabCount: '5' }).includes('data-tab-count="5"'));
  assert.ok(renderWorkspaceAssetSettingsShell({ tabCount: 2.9 }).includes('data-tab-count="2"'));
  assert.ok(renderWorkspaceAssetSettingsShell({ tabCount: 0 }).includes('data-tab-count="1"'));
  assert.ok(renderWorkspaceAssetSettingsShell({ tabCount: -4 }).includes('data-tab-count="1"'));
  assert.ok(renderWorkspaceAssetSettingsShell({ tabCount: 'x' }).includes('data-tab-count="1"'));
});

test('escapes the tablist label', () => {
  const html = renderWorkspaceAssetSettingsShell({ tablistLabel: '<x&y>' });
  assert.ok(html.includes('aria-label="&lt;x&amp;y&gt;"'));
});

test('places the callout inside the list by default', () => {
  const html = renderWorkspaceAssetSettingsShell({ calloutTitle: '标题', calloutDescription: '说明' });
  const calloutAt = html.indexOf('<div class="story-assets-callout">');
  assert.ok(calloutAt > html.indexOf('<header class="story-page-heading">'));
  assert.ok(calloutAt > html.indexOf('<section class="story-assets-list"'));
  assert.ok(calloutAt < html.indexOf('<div class="story-asset-grid workspace-project-asset-grid">'));
  assert.ok(html.includes('<strong>标题</strong><p>说明</p>'));
  assert.equal(html.includes('story-assets-callout--toolbar'), false);
  assert.equal(html.includes('data-tooltip='), false);
});

test('moves the callout into the heading toolbar when requested', () => {
  const html = renderWorkspaceAssetSettingsShell({
    calloutTitle: 'T',
    calloutDescription: 'D',
    calloutInHeading: true,
  });
  const calloutAt = html.indexOf('story-assets-callout--toolbar');
  assert.ok(calloutAt > -1);
  assert.ok(calloutAt < html.indexOf('<section class="story-assets-list"'));
  assert.ok(
    html.includes(
      '<strong tabindex="0" data-tooltip="D" aria-label="T。D">T <span aria-hidden="true">ⓘ</span></strong>',
    ),
  );
  assert.ok(html.includes('<div class="story-assets-callout story-assets-callout--toolbar">'));
});

test('escapes the callout title and description in both variants', () => {
  const html = renderWorkspaceAssetSettingsShell({ calloutTitle: '&<>"\'', calloutDescription: 'a&b' });
  assert.ok(html.includes('<strong>&amp;&lt;&gt;&quot;&#039;</strong>'));
  assert.ok(html.includes('<p>a&amp;b</p>'));

  const heading = renderWorkspaceAssetSettingsShell({
    calloutTitle: 'A"B',
    calloutDescription: 'C<D',
    calloutInHeading: true,
  });
  assert.ok(heading.includes('data-tooltip="C&lt;D"'));
  assert.ok(heading.includes('aria-label="A&quot;B。C&lt;D"'));
});

test('emits the callout status only in the heading variant', () => {
  const inHeading = renderWorkspaceAssetSettingsShell({ calloutInHeading: true, calloutStatus: '已保存' });
  assert.ok(inHeading.includes('<span role="status">已保存</span>'));

  const escaped = renderWorkspaceAssetSettingsShell({ calloutInHeading: true, calloutStatus: '<saved>' });
  assert.ok(escaped.includes('<span role="status">&lt;saved&gt;</span>'));

  const inList = renderWorkspaceAssetSettingsShell({ calloutStatus: '已保存' });
  assert.equal(inList.includes('role="status"'), false);
});

test('moves the heading into the list column when requested', () => {
  const inline = renderWorkspaceAssetSettingsShell();
  assert.ok(
    inline.indexOf('<header class="story-page-heading">') < inline.indexOf('story-assets-switch-region'),
  );
  assert.equal(inline.includes('story-assets-layout--column-heading'), false);

  const column = renderWorkspaceAssetSettingsShell({ headingInListColumn: true });
  const headingAt = column.indexOf('<header class="story-page-heading">');
  assert.ok(column.includes('<div class="story-assets-layout story-assets-layout--column-heading"'));
  assert.ok(headingAt > column.indexOf('story-assets-switch-region'));
  assert.ok(headingAt > column.indexOf('story-assets-layout--column-heading'));
  assert.ok(headingAt < column.indexOf('<section class="story-assets-list"'));
});

test('does not mutate the options object', () => {
  const options = {
    className: 'page',
    tabsHtml: '<b></b>',
    splitRatio: 40,
    activeTab: 'library',
    tabCount: 2,
    calloutInHeading: true,
  };
  const snapshot = { ...options };
  const html = renderWorkspaceAssetSettingsShell(options);
  assert.deepEqual(options, snapshot);
  assert.equal(Object.keys(options).length, 6);
  assert.ok(html.includes('style="--story-assets-left: 40%;"'));
  assert.ok(html.includes('data-tab-count="2"'));
});
