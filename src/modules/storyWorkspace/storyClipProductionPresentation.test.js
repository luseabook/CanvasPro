import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryClipProductionPresentation } from './storyClipProductionPresentation.js';

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
function withAttr(html, tagName, name, value) {
  return openTags(html, tagName).filter((tag) => attr(tag, name) === value);
}

// 分集卡片模型；覆盖项写成 'k' in over ? over.k : 默认值
function card(over = {}) {
  const keys = [
    'id',
    'number',
    'title',
    'status',
    'characterCount',
    'sceneCount',
    'propCount',
    'clipCount',
    'isChecked',
    'isSelectionMode',
    'isSplitting',
    'disabled',
    'actionKind',
    'actionLabel',
    'experimentalActionMarkup',
    'requestDebugMarkup',
    'splitDraftMarkup',
    'media',
    'posterLayout',
    'sequenceLabel',
  ];
  const defaults = { id: 'e1', number: 1, title: '相遇', status: '待生成', actionLabel: '生成分镜脚本' };
  const model = {};
  for (const key of keys) {
    if (key in over) model[key] = over[key];
    else if (key in defaults) model[key] = defaults[key];
  }
  return model;
}

test('createStoryClipProductionPresentation：返回冻结的四个函数', () => {
  const presentation = createStoryClipProductionPresentation();
  assert.deepEqual(Object.keys(presentation).sort(), [
    'renderAssetRail',
    'renderDetail',
    'renderOverview',
    'resolveEpisodeCardMedia',
  ]);
  assert.equal(Object.isFrozen(presentation), true);
});

test('resolveEpisodeCardMedia：优先当前视频结果的封面，其余结果依次兜底，跳过带 error 的结果', () => {
  const { resolveEpisodeCardMedia } = createStoryClipProductionPresentation();
  const episode = {
    coverUrl: 'https://x/cover.png',
    clips: [
      { video: { results: [] } },
      {
        video: {
          activeIndex: 2,
          results: [
            { posterUrl: 'https://x/first.png' },
            null,
            { error: '失败', posterUrl: 'https://x/bad.png' },
          ],
        },
      },
    ],
  };
  // activeIndex 先在过滤掉非对象后的数组里夹取：指向带 error 的结果，被跳过后用第一个
  assert.deepEqual(resolveEpisodeCardMedia(episode), {
    kind: 'image',
    url: 'https://x/first.png',
    source: 'video-result',
  });
  const active = {
    clips: [
      {
        video: {
          activeIndex: 1,
          results: [{ thumbUrl: 'https://x/a.png' }, { coverUrl: ' https://x/b.png ' }],
        },
      },
    ],
  };
  assert.equal(resolveEpisodeCardMedia(active).url, 'https://x/b.png');
  assert.deepEqual(
    resolveEpisodeCardMedia({ coverUrl: ' https://x/cover.png ', clips: [{ video: { results: [{}] } }] }),
    {
      kind: 'image',
      url: 'https://x/cover.png',
      source: 'episode-cover',
    },
  );
  assert.deepEqual(resolveEpisodeCardMedia(), { kind: 'empty', url: '', source: 'empty' });
});

test('resolveEpisodeCardMedia：本地路径走注入的 localPathToUrl，可用性由 isUsableImageUrl 判断', () => {
  const seen = [];
  const { resolveEpisodeCardMedia } = createStoryClipProductionPresentation({
    localPathToUrl: (path) => (path ? '/local/' + path : ''),
    isUsableImageUrl: (url) => {
      seen.push(url);
      return url.startsWith('/local/');
    },
  });
  const media = resolveEpisodeCardMedia({
    clips: [{ video: { results: [{ posterUrl: 'https://x/remote.png', thumbLocalPath: 'output/t.png' }] } }],
  });
  assert.deepEqual(media, { kind: 'image', url: '/local/output/t.png', source: 'video-result' });
  assert.ok(seen.includes('https://x/remote.png'));
  // 默认实现：本地路径只做 trim，非空即可用
  const plain = createStoryClipProductionPresentation();
  assert.equal(
    plain.resolveEpisodeCardMedia({
      clips: [{ video: { results: [{ posterLocalPath: ' output/p.png ' }] } }],
    }).url,
    'output/p.png',
  );
});

test('renderOverview：单张卡片（生成模式）带生成按钮、摘要和状态', () => {
  const { renderOverview } = createStoryClipProductionPresentation({
    renderEpisodeCardActionIcon: (kind) => '<i data-icon="' + kind + '"></i>',
  });
  const html = renderOverview({
    kind: 'card',
    card: card({ id: 'e"1', title: '<相遇>', characterCount: 2, sceneCount: 3, propCount: 1 }),
  });
  const [article] = openTags(html, 'article');
  assert.equal(attr(article, 'data-story-marquee-id'), 'e&quot;1');
  assert.equal(attr(article, 'aria-busy'), 'false');
  assert.equal(attr(article, 'class').replace(/\s+/g, ' ').trim(), 'story-episode-card has-inline-actions');
  const [open] = openTags(html, 'div').filter((tag) => tag.includes('story-episode-open'));
  assert.equal(attr(open, 'class'), 'story-episode-open story-episode-open--static');
  assert.equal(attr(open, 'aria-label'), '生成第 1 集分镜脚本：&lt;相遇&gt;');
  const [split] = withAttr(html, 'button', 'data-story-action', 'split-episode');
  assert.equal(attr(split, 'data-story-episode-id'), 'e&quot;1');
  assert.equal(attr(split, 'aria-busy'), 'false');
  assert.equal(hasBareAttr(split, 'disabled'), false);
  assert.match(
    html,
    /<i data-icon="generate"><\/i><span class="story-episode-enter-label">生成分镜脚本<\/span>/,
  );
  assert.match(html, /<span class="story-episode-status">待生成<\/span>/);
  assert.match(html, /<span class="story-episode-title">第 1 集：&lt;相遇&gt;<\/span>/);
  assert.match(html, /角色 2 · 场景 3 · 道具 1 · 片段 待拆分/);
  assert.doesNotMatch(html, /regenerate-episode/);
  assert.doesNotMatch(html, /story-episode-loading/);
});

test('renderOverview：编辑模式的卡片是可点的按钮，并带重新生成按钮', () => {
  const { renderOverview } = createStoryClipProductionPresentation();
  const html = renderOverview({
    kind: 'card',
    card: card({ actionKind: 'edit', actionLabel: '进入编辑', clipCount: 6, disabled: true }),
  });
  const [open] = withAttr(html, 'button', 'class', 'story-episode-open');
  assert.equal(attr(open, 'data-story-open-episode'), 'e1');
  assert.equal(attr(open, 'data-story-select-episode'), 'e1');
  assert.equal(attr(open, 'aria-pressed'), 'false');
  assert.equal(attr(open, 'aria-label'), '进入第 1 集编辑：相遇');
  assert.equal(attr(open, 'aria-disabled'), 'true');
  assert.match(
    html,
    /<span class="story-episode-enter story-episode-enter--edit" aria-hidden="true"><span class="story-episode-enter-label">进入编辑<\/span><\/span>/,
  );
  const [regenerate] = withAttr(html, 'button', 'data-story-action', 'regenerate-episode');
  assert.equal(attr(regenerate, 'aria-label'), '重新生成第 1 集');
  assert.equal(hasBareAttr(regenerate, 'disabled'), true);
  assert.match(html, /<span class="story-episode-enter-label">重新生成<\/span><\/button>/);
  assert.match(html, /· 片段 6<\/span>/);
});

test('renderOverview：拆分中显示转圈与遮罩；开发者操作单独成组；选择模式隐藏操作与草稿', () => {
  const { renderOverview } = createStoryClipProductionPresentation();
  const splitting = renderOverview({
    kind: 'card',
    card: card({
      isSplitting: true,
      actionLabel: '生成分镜脚本',
      experimentalActionMarkup: '<b>实验</b>',
      splitDraftMarkup: '<p>草稿</p>',
    }),
  });
  assert.match(splitting, /story-action-button-spinner/);
  assert.match(splitting, /<span class="story-episode-enter-label">生成中<\/span>/);
  assert.match(splitting, /<div class="storyboard-script-loading-label">正在拆分第 1 集<\/div>/);
  assert.match(splitting, /<div class="story-episode-utility-actions"><b>实验<\/b><\/div>/);
  assert.match(splitting, /<p>草稿<\/p>/);
  const [article] = openTags(splitting, 'article');
  assert.match(attr(article, 'class'), /has-developer-actions/);
  assert.match(attr(article, 'class'), /is-splitting/);
  assert.equal(attr(article, 'aria-busy'), 'true');

  const selecting = renderOverview({
    kind: 'card',
    card: card({
      isSelectionMode: true,
      isChecked: true,
      requestDebugMarkup: '<b>调试</b>',
      splitDraftMarkup: '<p>草稿</p>',
    }),
  });
  const [open] = withAttr(selecting, 'button', 'class', 'story-episode-open');
  assert.equal(attr(open, 'aria-pressed'), 'true');
  assert.equal(attr(open, 'aria-label'), '取消选择第 1 集：相遇');
  assert.doesNotMatch(selecting, /split-episode|story-episode-utility-actions|<p>草稿<\/p>/);
  assert.match(attr(openTags(selecting, 'article')[0], 'class'), /is-selection-mode\s+is-checked/);
});

test('renderOverview：封面有图时用 img 并标来源，否则交给 renderImageOrEmpty', () => {
  const calls = [];
  const { renderOverview } = createStoryClipProductionPresentation({
    renderImageOrEmpty: (options) => {
      calls.push(options);
      return '<div class="empty-cover"></div>';
    },
  });
  const withImage = renderOverview({
    kind: 'card',
    card: card({ media: { kind: 'image', url: 'https://x/c"1.png', source: 'video-result' } }),
  });
  const [img] = openTags(withImage, 'img');
  assert.equal(attr(img, 'src'), 'https://x/c&quot;1.png');
  assert.equal(attr(img, 'alt'), '相遇');
  assert.equal(attr(img, 'data-story-episode-cover-source'), 'video-result');
  assert.equal(calls.length, 0);
  renderOverview({ kind: 'card', card: card({ title: '  ', number: 3 }) });
  assert.deepEqual(calls, [{ imageUrl: '', alt: '第 3 集', className: 'story-episode-cover' }]);
});

test('renderOverview：默认 renderImageOrEmpty 在无图时输出空占位', () => {
  const { renderOverview } = createStoryClipProductionPresentation();
  assert.match(
    renderOverview({ kind: 'card', card: card() }),
    /<div class="story-episode-cover is-empty" role="img" aria-label="相遇"><\/div>/,
  );
});

test('renderOverview：分集页的标题、说明、全选与批量拆分按钮', () => {
  const { renderOverview } = createStoryClipProductionPresentation();
  const html = renderOverview({
    cards: [card({ id: 'a' }), card({ id: 'b', number: 2 })],
    footerMarkup: '<footer>尾</footer>',
  });
  assert.match(
    html,
    /^<div class="story-episodes-page story-content-page " data-story-marquee-page-surface="episodes" data-story-experimental-mode="false">/,
  );
  assert.match(html, /<span class="story-eyebrow">剧本拆分结果<\/span>/);
  assert.match(html, /<h2>分集视频<\/h2>/);
  assert.match(
    html,
    /<p class="story-page-description">每一集会形成一套片段脚本；确认后可创建为新的画布页面。<\/p>/,
  );
  assert.equal(openTags(html, 'article').length, 2);
  const [toggle] = withAttr(html, 'button', 'data-story-action', 'toggle-all-episodes');
  assert.equal(attr(toggle, 'aria-pressed'), 'false');
  assert.equal(hasBareAttr(toggle, 'disabled'), false);
  assert.match(html, /aria-pressed="false" >全选<\/button>/);
  const [splitAll] = withAttr(html, 'button', 'data-story-action', 'split-all-episodes');
  assert.equal(attr(splitAll, 'aria-busy'), 'false');
  assert.match(html, />批量拆分<\/button>/);
  assert.match(html, /<footer>尾<\/footer>\n  <\/div>$/);
  // description 为空串时不出段落；没有卡片时两个按钮都禁用
  const empty = renderOverview({ description: '', eyebrow: '<眉>', title: '标题' });
  assert.doesNotMatch(empty, /story-page-description/);
  assert.match(empty, /<span class="story-eyebrow">&lt;眉&gt;<\/span>/);
  assert.equal(
    hasBareAttr(withAttr(empty, 'button', 'data-story-action', 'toggle-all-episodes')[0], 'disabled'),
    true,
  );
  assert.equal(
    hasBareAttr(withAttr(empty, 'button', 'data-story-action', 'split-all-episodes')[0], 'disabled'),
    true,
  );
});

test('renderOverview：选择模式显示「拆分选中 (N)」，全选后显示「取消全选」，实验模式带标记', () => {
  const { renderOverview } = createStoryClipProductionPresentation();
  const html = renderOverview({
    cards: [card()],
    selectionMode: true,
    selectedCount: '2.7',
    allEpisodesSelected: true,
    experimentalMode: 1,
    experimentalModeToggleMarkup: '<span>实验开关</span>',
  });
  assert.match(
    html,
    /^<div class="story-episodes-page story-content-page is-experimental-split-mode" data-story-marquee-page-surface="episodes" data-story-experimental-mode="true">/,
  );
  assert.match(html, /<span>实验开关<\/span>/);
  assert.match(html, />取消全选<\/button>/);
  const [splitSelected] = withAttr(html, 'button', 'data-story-action', 'split-selected-episodes');
  assert.ok(splitSelected);
  assert.match(html, />拆分选中 \(2\)<\/button>/);
  assert.equal(
    attr(withAttr(html, 'button', 'data-story-action', 'toggle-all-episodes')[0], 'aria-pressed'),
    'true',
  );
});

test('renderOverview：批量拆分进行中换成停止按钮，已请求停止时禁用并显示「正在停止」', () => {
  const { renderOverview } = createStoryClipProductionPresentation();
  const running = renderOverview({
    cards: [card()],
    batchControl: { operation: 'splitting-all', disabled: true },
  });
  const [cancel] = withAttr(running, 'button', 'data-story-action', 'cancel-episode-split-batch');
  assert.equal(attr(cancel, 'aria-busy'), 'true');
  assert.equal(hasBareAttr(cancel, 'disabled'), false);
  assert.match(running, /story-action-button-spinner" aria-hidden="true"><\/span>停止批量拆分<\/button>/);
  assert.doesNotMatch(running, /split-all-episodes|split-selected-episodes/);
  assert.equal(
    hasBareAttr(withAttr(running, 'button', 'data-story-action', 'toggle-all-episodes')[0], 'disabled'),
    true,
  );
  const stopping = renderOverview({
    cards: [card()],
    batchControl: { operation: 'splitting-selected', cancelRequested: true },
  });
  const [stop] = withAttr(stopping, 'button', 'data-story-action', 'cancel-episode-split-batch');
  assert.equal(hasBareAttr(stop, 'disabled'), true);
  assert.match(stopping, />正在停止<\/button>/);
});

test('renderAssetRail：三个标签页与计数，未知标签回落到本集素材', () => {
  const { renderAssetRail } = createStoryClipProductionPresentation();
  const html = renderAssetRail({
    activeTab: 'frames',
    helpText: '拖入<提示词>',
    assets: [{ id: 'a1', kind: 'character', name: '林远' }],
    frames: [
      { id: 'f1', clipId: 'c1', name: '帧一', imageUrl: '/f1.png', mentionId: 'm1', mediaType: 'image' },
    ],
    libraryAssets: [
      { sourceAssetId: 's1', name: '海报', assetName: '宣传图' },
      { sourceAssetId: 's1', name: '海报二' },
    ],
  });
  const [aside] = openTags(html, 'aside');
  assert.equal(attr(aside, 'data-active-tab'), 'frames');
  const tabs = openTags(html, 'button').filter((tag) => attr(tag, 'data-story-episode-asset-tab'));
  assert.deepEqual(
    tabs.map((tag) => [
      attr(tag, 'data-story-episode-asset-tab'),
      attr(tag, 'class'),
      attr(tag, 'aria-selected'),
    ]),
    [
      ['assets', '', 'false'],
      ['frames', 'is-active', 'true'],
      ['library', '', 'false'],
    ],
  );
  assert.match(html, /data-story-episode-asset-count="assets">1<\/span>/);
  assert.match(html, /data-story-episode-asset-count="frames">1<\/span>/);
  assert.match(html, /data-story-episode-asset-count="library">2<\/span>/);
  assert.match(html, /<small data-story-episode-asset-help>拖入&lt;提示词&gt;<\/small>/);
  const panels = openTags(html, 'div').filter((tag) => attr(tag, 'data-story-episode-asset-panel'));
  assert.deepEqual(
    panels.map((tag) => [attr(tag, 'data-story-episode-asset-panel'), attr(tag, 'aria-hidden')]),
    [
      ['assets', 'true'],
      ['frames', 'false'],
      ['library', 'true'],
    ],
  );
  assert.equal(
    attr(openTags(renderAssetRail({ activeTab: 'other' }), 'aside')[0], 'data-active-tab'),
    'assets',
  );
});

test('renderAssetRail：本集素材按角色、场景、道具分节，可拖入提示词', () => {
  const calls = [];
  const { renderAssetRail } = createStoryClipProductionPresentation({
    renderImageOrEmpty: (options) => {
      calls.push(options);
      return '<img data-fake>';
    },
  });
  const html = renderAssetRail({
    assetKindLabels: { character: '角色', prop: '<道具>' },
    assets: [
      { id: 'p1', kind: 'prop', name: '怀表', imageUrl: '/p1.png' },
      { id: 'c"1', kind: 'character', name: '林远' },
      { id: 'x', kind: 'other', name: '不显示' },
    ],
  });
  assert.deepEqual(
    [...html.matchAll(/<section>\s*<h3>([^<]*)<\/h3>/g)].map((match) => match[1]),
    ['角色', 'scene', '&lt;道具&gt;'],
  );
  const refs = openTags(html, 'button').filter((tag) => attr(tag, 'data-story-reference-asset') !== null);
  assert.deepEqual(
    refs.map((tag) => [
      attr(tag, 'data-story-reference-asset'),
      attr(tag, 'draggable'),
      attr(tag, 'aria-label'),
    ]),
    [
      ['c&quot;1', 'true', '引用素材 林远，仅可拖入提示词'],
      ['p1', 'true', '引用素材 怀表，仅可拖入提示词'],
    ],
  );
  assert.deepEqual(calls, [
    { imageUrl: undefined, alt: '林远', className: 'story-episode-asset-image' },
    { imageUrl: '/p1.png', alt: '怀表', className: 'story-episode-asset-image' },
  ]);
  assert.doesNotMatch(html, /不显示/);
});

test('renderAssetRail：片段帧按片段分组，视频帧用 video 标签，保存中的帧禁用删除', () => {
  const { renderAssetRail } = createStoryClipProductionPresentation({
    renderDeleteIcon: () => '<svg data-del></svg>',
  });
  const html = renderAssetRail({
    clips: [{ id: 'c1', title: '第一幕' }, { id: 'c2' }, { id: 'c3', title: '无帧' }],
    frames: [
      {
        id: 'f2',
        clipId: 'c2',
        name: '帧二',
        imageUrl: '/f2.png',
        mentionId: 'm2',
        mediaType: 'image',
        captureSavePending: true,
      },
      {
        id: 'v1',
        clipId: 'c1',
        name: '裁剪一',
        imageUrl: '/v1.png',
        mediaUrl: '/v1.mp4',
        mentionId: 'mv1',
        mediaType: 'video',
      },
      {
        id: 'o1',
        clipId: 'gone',
        clipTitle: '旧片段',
        name: '孤帧',
        imageUrl: '/o1.png',
        mentionId: 'mo1',
        mediaType: 'image',
      },
      { id: 'u1', name: '无片段', imageUrl: '/u1.png', mentionId: 'mu1', mediaType: 'image' },
    ],
  });
  const groups = openTags(html, 'section').filter((tag) => attr(tag, 'data-story-clip-frame-group') !== null);
  assert.deepEqual(
    groups.map((tag) => attr(tag, 'data-story-clip-frame-group')),
    ['c1', 'c2', 'gone', 'unassigned'],
  );
  assert.deepEqual([...html.matchAll(/<h3>([^<]*)<\/h3>/g)].map((match) => match[1]).slice(3), [
    '第一幕 · 1 项',
    '片段 2 · 1 项',
    '旧片段 · 1 项',
    '其他片段 · 1 项',
  ]);
  const [video] = openTags(html, 'video');
  assert.equal(attr(video, 'src'), '/v1.mp4');
  assert.equal(attr(video, 'poster'), '/v1.png');
  assert.equal(hasBareAttr(video, 'muted'), true);
  assert.match(html, /<span class="story-episode-frame-video-badge" aria-hidden="true">视频<\/span>/);
  const refs = openTags(html, 'button').filter((tag) => attr(tag, 'data-story-reference-frame') !== null);
  assert.deepEqual(
    refs.map((tag) => [
      attr(tag, 'data-story-reference-asset'),
      attr(tag, 'data-story-reference-media-type'),
      attr(tag, 'aria-busy'),
      attr(tag, 'aria-label'),
    ]),
    [
      ['mv1', 'video', 'false', '引用裁剪视频 裁剪一，仅可拖入提示词'],
      ['m2', 'image', 'true', '引用片段帧 帧二，仅可拖入提示词'],
      ['mo1', 'image', 'false', '引用片段帧 孤帧，仅可拖入提示词'],
      ['mu1', 'image', 'false', '引用片段帧 无片段，仅可拖入提示词'],
    ],
  );
  const deletes = withAttr(html, 'button', 'data-story-action', 'delete-clip-frame');
  assert.deepEqual(
    deletes.map((tag) => [
      attr(tag, 'data-story-clip-frame-id'),
      attr(tag, 'aria-label'),
      hasBareAttr(tag, 'disabled'),
    ]),
    [
      ['v1', '删除视频片段 裁剪一', false],
      ['f2', '删除片段帧 帧二', true],
      ['o1', '删除片段帧 孤帧', false],
      ['u1', '删除片段帧 无片段', false],
    ],
  );
  assert.match(html, /<svg data-del><\/svg><\/button>/);
});

test('renderAssetRail：没有帧、没有总素材时显示空状态；总素材无图时用类型占位', () => {
  const { renderAssetRail } = createStoryClipProductionPresentation({
    isUsableImageUrl: (url) => String(url || '').startsWith('/'),
  });
  const empty = renderAssetRail({});
  assert.match(empty, /<strong>还没有片段帧<\/strong>/);
  assert.match(empty, /<strong>画布素材库暂无可引用素材<\/strong>/);
  assert.match(empty, /data-story-episode-asset-count="library">0<\/span>/);
  const html = renderAssetRail({
    libraryAssets: [
      {
        sourceAssetId: ' s1 ',
        assetName: '宣传',
        name: '海报',
        imageUrl: '/poster.png',
        sourceItemIndex: '2.8',
        mediaKind: 'image',
        role: '主视觉',
      },
      { name: '配乐', typeLabel: '音频', mediaKind: 'audio', imageUrl: 'https://x/not-usable.png' },
    ],
  });
  const sections = openTags(html, 'section').filter(
    (tag) => attr(tag, 'data-story-episode-library-group') !== null,
  );
  assert.deepEqual(
    sections.map((tag) => attr(tag, 'data-story-episode-library-group')),
    ['s1', 'ungrouped'],
  );
  assert.match(html, /<h3>宣传 · 1 项<\/h3>/);
  assert.match(html, /<h3>未分组素材 · 1 项<\/h3>/);
  const refs = openTags(html, 'button').filter(
    (tag) => attr(tag, 'data-story-reference-source') === 'library',
  );
  assert.deepEqual(
    refs.map((tag) => [
      attr(tag, 'data-story-reference-asset'),
      attr(tag, 'data-story-reference-asset-index'),
      attr(tag, 'data-story-reference-media-type'),
    ]),
    [
      [' s1 ', '2', 'image'],
      ['', '0', 'audio'],
    ],
  );
  assert.match(
    html,
    /<img class="story-episode-asset-image story-episode-library-asset-image" src="\/poster.png" alt="海报"/,
  );
  assert.match(
    html,
    /<div class="story-episode-asset-image story-episode-library-asset-fallback" data-media-type="audio" role="img" aria-label="配乐，音频素材"><span>音频<\/span><\/div>/,
  );
  assert.match(html, /<small>主视觉<\/small>/);
});

test('renderDetail：默认比例与标题，分隔条数值由左栏和中栏比例算出', () => {
  const { renderDetail } = createStoryClipProductionPresentation();
  const html = renderDetail({
    clipMeta: ['<镜头 1>', '5 秒'],
    promptSurface: '<textarea></textarea>',
    timeline: '<div data-timeline></div>',
  });
  assert.match(html, /^<div class="story-episode-detail-page">/);
  assert.match(html, /<h2>片段脚本<\/h2>/);
  const splitters = openTags(html, 'div').filter((tag) => attr(tag, 'data-story-episode-splitter'));
  assert.deepEqual(
    splitters.map((tag) => [
      attr(tag, 'data-story-episode-splitter'),
      attr(tag, 'aria-valuenow'),
      attr(tag, 'aria-valuemin'),
      attr(tag, 'aria-valuemax'),
    ]),
    [
      ['assets', '24', '14', '34'],
      ['preview', '68', '38', '76'],
    ],
  );
  assert.match(html, /<span>&lt;镜头 1&gt;<\/span><span>5 秒<\/span>/);
  assert.match(html, /<textarea><\/textarea>/);
  assert.match(html, /<div data-timeline><\/div>\n  <\/div>$/);
  const [preview] = openTags(html, 'section').filter((tag) => tag.includes('story-video-preview'));
  assert.equal(attr(preview, 'data-story-clip-navigation'), 'false');
  assert.equal(attr(preview, 'tabindex'), null);
});

test('renderDetail：多片段时预览区可聚焦；带分集导轨时外包一层复刻容器', () => {
  const { renderDetail } = createStoryClipProductionPresentation();
  const html = renderDetail({
    title: '<第一幕>',
    ratios: { left: 20.4, center: 'x' },
    hasMultipleClips: true,
    navigationMarkup: '<nav data-n></nav>',
    videoPreview: '<video data-v></video>',
    assetRailMarkup: '<aside data-rail></aside>',
    referenceSummary: '<p data-ref></p>',
    episodeRailMarkup: '<div data-episode-rail></div>',
  });
  assert.match(
    html,
    /^<div class="workspace-episode-production story-replication-episode-production" data-story-replication-episode-production><div data-episode-rail><\/div><div class="story-episode-detail-page">/,
  );
  assert.match(html, /<\/div><\/div>$/);
  assert.match(html, /<h2>&lt;第一幕&gt;<\/h2>/);
  const splitters = openTags(html, 'div').filter((tag) => attr(tag, 'data-story-episode-splitter'));
  assert.deepEqual(
    splitters.map((tag) => attr(tag, 'aria-valuenow')),
    ['20', '20'],
  );
  const [preview] = openTags(html, 'section').filter((tag) => tag.includes('story-video-preview'));
  assert.equal(attr(preview, 'data-story-clip-navigation'), 'true');
  assert.equal(attr(preview, 'tabindex'), '0');
  assert.equal(attr(preview, 'aria-label'), '滚动鼠标滚轮或按左右方向键切换上一幕、下一幕');
  for (const piece of [
    '<aside data-rail></aside>',
    '<p data-ref></p>',
    '<nav data-n></nav>',
    '<video data-v></video>',
  ]) {
    assert.ok(html.includes(piece), piece);
  }
});
