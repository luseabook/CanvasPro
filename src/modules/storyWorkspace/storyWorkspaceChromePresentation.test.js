import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspaceChromePresentation } from './storyWorkspaceChromePresentation.js';

// 只看渲染出的 HTML 字符串：用正则取开始标签和属性，不引入 DOM
function openTags(html, pattern) {
  return [...html.matchAll(new RegExp('<' + pattern + '\\b[^>]*>', 'g'))].map((match) => match[0]);
}
function attr(tag, name) {
  return new RegExp('\\s' + name + '="([^"]*)"').exec(tag)?.[1] ?? null;
}
function hasBareAttr(tag, name) {
  return new RegExp('\\s' + name + '(\\s|>|$)').test(tag);
}

const steps = {
  activeStep: 'split',
  items: [
    { id: 'outline', number: 1, label: '大纲', active: false },
    { id: 'split', number: 2, label: '分集<拆分>', active: true },
    { id: 'produce', label: '制作', active: false, disabled: true },
  ],
};

test('createStoryWorkspaceChromePresentation：返回冻结的两个渲染函数', () => {
  const chrome = createStoryWorkspaceChromePresentation();
  assert.deepEqual(Object.keys(chrome).sort(), ['renderFooter', 'renderToolbar']);
  assert.equal(Object.isFrozen(chrome), true);
});

test('renderToolbar：普通工具栏带返回按钮和步骤导航，项目名转义、缺省为「剧本项目」', () => {
  const { renderToolbar } = createStoryWorkspaceChromePresentation();
  const html = renderToolbar({ projectLabel: '<星河>', steps });
  assert.match(html, /^<div class="story-project-toolbar">/);
  assert.match(
    html,
    /data-story-action="back-home"><span class="story-toolbar-back-icon" aria-hidden="true"><\/span><span>&lt;星河&gt;<\/span>/,
  );
  assert.match(renderToolbar({}), /<span>剧本项目<\/span>/);
  const [nav] = openTags(html, 'nav');
  assert.equal(attr(nav, 'data-step-count'), '3');
  assert.equal(attr(nav, 'data-active-step'), 'split');
  assert.equal(attr(nav, 'aria-label'), '剧本制作步骤');
  const buttons = openTags(html, 'button').filter((tag) => attr(tag, 'data-story-step'));
  assert.deepEqual(
    buttons.map((tag) => [
      attr(tag, 'data-story-step'),
      attr(tag, 'class').trim(),
      attr(tag, 'aria-current'),
      attr(tag, 'aria-keyshortcuts'),
      hasBareAttr(tag, 'disabled'),
    ]),
    [
      ['outline', 'story-step', 'false', '1', false],
      ['split', 'story-step is-active', 'step', '2', false],
      ['produce', 'story-step', 'false', 'produce', true],
    ],
  );
  assert.match(html, /<span>2<\/span>分集&lt;拆分&gt;/);
  // 没有步骤时计数按 3
  assert.equal(attr(openTags(renderToolbar({}), 'nav')[0], 'data-step-count'), '3');
});

test('renderToolbar：步骤 id 和编号原样拼进属性，不做转义（冻结行为）', () => {
  const { renderToolbar } = createStoryWorkspaceChromePresentation();
  const html = renderToolbar({ steps: { items: [{ id: 'a"b', label: 'x' }] } });
  assert.match(html, /data-story-step="a"b"/);
});

test('renderToolbar：普通工具栏可带分集切换器和 AI 协作按钮', () => {
  const { renderToolbar } = createStoryWorkspaceChromePresentation();
  const bare = renderToolbar({ steps });
  assert.match(bare, /<div class="story-episode-toolbar-side"><\/div>/);
  const html = renderToolbar({
    steps,
    collaborationAvailable: true,
    episodeSwitcher: {
      isCurrentPage: false,
      currentEpisodeId: 'e"1',
      currentEpisodeName: '第一集',
      options: [],
    },
  });
  assert.match(
    html,
    /<button type="button" class="story-secondary-button" data-collaboration-toggle>AI 协作<\/button>/,
  );
  const [current] = openTags(html, 'button').filter((tag) => tag.includes('story-episode-toolbar-current'));
  assert.equal(attr(current, 'data-story-episode-state'), 'inactive');
  assert.equal(attr(current, 'data-story-open-episode'), 'e&quot;1');
  assert.equal(attr(current, 'aria-haspopup'), null);
  assert.doesNotMatch(html, /story-episode-switcher-menu/);
});

test('renderToolbar：分集切换器有选项时出菜单，当前页标 aria-current', () => {
  const { renderToolbar } = createStoryWorkspaceChromePresentation();
  const html = renderToolbar({
    kind: 'episode',
    steps,
    episodeSwitcher: {
      isCurrentPage: true,
      currentEpisodeId: 'e1',
      currentEpisodeName: '第<一>集',
      options: [
        { id: 'e1', name: '第一集', clipCount: 4 },
        { id: 'e&2', name: '第二集', clipCount: 0 },
      ],
    },
  });
  const [switcher] = openTags(html, 'div').filter((tag) => tag.includes('story-episode-switcher '));
  assert.equal(attr(switcher, 'class'), 'story-episode-switcher has-options');
  const [current] = openTags(html, 'button').filter((tag) => tag.includes('story-episode-toolbar-current'));
  assert.equal(attr(current, 'data-story-episode-state'), 'active');
  assert.equal(attr(current, 'aria-current'), 'page');
  assert.equal(attr(current, 'data-story-open-episode'), null);
  assert.equal(attr(current, 'aria-haspopup'), 'menu');
  assert.match(html, /<span class="story-episode-toolbar-current-label">第&lt;一&gt;集<\/span>/);
  const options = openTags(html, 'button').filter((tag) => tag.includes('story-episode-switcher-option'));
  assert.deepEqual(
    options.map((tag) => attr(tag, 'data-story-open-episode')),
    ['e1', 'e&amp;2'],
  );
  assert.match(html, /<small>已生成 4 个分镜片段<\/small>/);
  assert.match(html, /<small>已生成 0 个分镜片段<\/small>/);
});

test('renderToolbar：分集工具栏带同步画布和导出两组菜单，同步进行中时禁用并显示「加入中…」', () => {
  const { renderToolbar } = createStoryWorkspaceChromePresentation();
  const idle = renderToolbar({ kind: 'episode', steps, episodeSwitcher: { options: [] } });
  assert.match(idle, /^<div class="story-project-toolbar story-project-toolbar--episode">/);
  const actions = (html) =>
    openTags(html, 'button')
      .filter((tag) => attr(tag, 'data-story-action'))
      .map((tag) => [attr(tag, 'data-story-action'), hasBareAttr(tag, 'disabled')]);
  assert.deepEqual(actions(idle), [
    ['back-home', false],
    ['toggle-canvas-sync-menu', false],
    ['sync-episode-to-canvas', false],
    ['sync-project-to-canvas', false],
    ['toggle-canvas-sync-menu', false],
    ['export-current-clip', false],
    ['export-episode-clips', false],
  ]);
  assert.match(idle, /<span>加入画布<\/span>/);
  assert.doesNotMatch(idle, /story-canvas-sync-spinner/);

  const pending = renderToolbar({ kind: 'episode', steps, canvasSyncPending: true, episodeSwitcher: {} });
  assert.deepEqual(actions(pending), [
    ['back-home', false],
    ['toggle-canvas-sync-menu', true],
    ['sync-episode-to-canvas', true],
    ['sync-project-to-canvas', true],
    ['toggle-canvas-sync-menu', false],
    ['export-current-clip', false],
    ['export-episode-clips', false],
  ]);
  const [trigger] = openTags(pending, 'button').filter((tag) => tag.includes('story-canvas-sync-trigger'));
  assert.match(attr(trigger, 'class'), / is-pending$/);
  assert.equal(attr(trigger, 'aria-busy'), 'true');
  assert.equal(attr(trigger, 'aria-disabled'), 'true');
  assert.match(pending, /story-canvas-sync-spinner/);
  assert.match(pending, /<span>加入中…<\/span>/);
  // 只认严格的 true
  assert.doesNotMatch(
    renderToolbar({ kind: 'episode', canvasSyncPending: 'yes', episodeSwitcher: {} }),
    /加入中…/,
  );
});

test('renderFooter：默认操作区有下一步按钮，可选上一步；标题与提示转义', () => {
  const { renderFooter } = createStoryWorkspaceChromePresentation();
  const html = renderFooter({
    title: '<标题>',
    hint: '提示&说明',
    nextAction: 'go-next',
    nextLabel: '下一步',
    showPrevious: true,
  });
  assert.match(html, /^<footer class="story-page-footer">/);
  assert.match(html, /<strong>&lt;标题&gt;<\/strong>/);
  assert.match(html, /<small>提示&amp;说明<\/small>/);
  const buttons = openTags(html, 'button');
  assert.deepEqual(
    buttons.map((tag) => [
      attr(tag, 'data-story-action'),
      attr(tag, 'aria-busy'),
      hasBareAttr(tag, 'disabled'),
    ]),
    [
      ['previous-step', null, false],
      ['go-next', 'false', false],
    ],
  );
  assert.match(
    html,
    /<span>下一步<\/span><span class="story-next-arrow" aria-hidden="true">→<\/span><\/button>/,
  );
  assert.doesNotMatch(renderFooter({ nextLabel: 'x' }), /previous-step/);
});

test('renderFooter：忙碌时下一步按钮禁用、显示转圈且不带箭头', () => {
  const { renderFooter } = createStoryWorkspaceChromePresentation();
  const html = renderFooter({ nextAction: 'generate', nextLabel: '生成中', busy: 1 });
  const [next] = openTags(html, 'button');
  assert.equal(hasBareAttr(next, 'disabled'), true);
  assert.equal(attr(next, 'aria-busy'), 'true');
  assert.match(
    html,
    /<span class="storyboard-script-loading-spinner story-action-button-spinner" aria-hidden="true"><\/span><span>生成中<\/span>/,
  );
  assert.doesNotMatch(html, /story-next-arrow/);
});

test('renderFooter：actionsMarkup 替换默认按钮，leadingActionsMarkup 始终放在最前', () => {
  const { renderFooter } = createStoryWorkspaceChromePresentation();
  const custom = renderFooter({
    leadingActionsMarkup: '<i>前</i>',
    actionsMarkup: '<b>自定义</b>',
    nextLabel: '不显示',
  });
  assert.match(custom, /<div class="story-page-footer-actions">\s*<i>前<\/i><b>自定义<\/b>\s*<\/div>/);
  assert.doesNotMatch(custom, /story-next-button/);
  const leadingOnly = renderFooter({ leadingActionsMarkup: '<i>前</i>', nextLabel: '下一步' });
  assert.ok(leadingOnly.indexOf('<i>前</i>') < leadingOnly.indexOf('story-next-button'));
});
