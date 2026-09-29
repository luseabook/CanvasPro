import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _resetAssetMentionRegistryForTests,
  resolveAssetMentionRef,
  setAssetMentionAssets,
} from './assetMentionRegistry.js';
import {
  PROMPT_ASSET_INPUT_REFS_FIELD,
  getAssetInputRefsFromNodeData,
  getAssetInputRefsFromPrompt,
  getAssetInputRefsFromPromptAndNode,
  getAssetInputRefsFromPromptHtml,
  getAssetMentionRefFromPillNode,
  getPromptAssetInputRefRecords,
  getPromptAssetInputRefsFromNode,
  normalizePromptAssetInputRefRecord,
  normalizePromptMentionType,
} from './promptAssetInputRefs.js';

const ASSETS = [
  {
    id: 'p1',
    name: '素材包一',
    items: [
      { type: 'ai-image', name: '图一', url: 'http://cdn/one.png' },
      { type: 'ai-text', name: '文一', text: '正文一' },
      { type: 'ai-video', name: '视频一', url: 'http://cdn/movie.mp4' },
    ],
  },
];

const imageSpan = (overrides = {}) => {
  const attrs = {
    'data-ref-origin': 'asset',
    'data-asset-id': 'p1',
    'data-asset-index': '0',
    'data-ref-type': 'ai-image',
    ...overrides,
  };
  const rendered = Object.entries(attrs)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => key + '="' + value + '"')
    .join(' ');
  return '<span class="ref-pill" ' + rendered + '>图一</span>';
};

const pill = (dataset = {}) => ({
  classList: { contains: (token) => token === 'ref-pill' },
  dataset: { refOrigin: 'asset', assetId: 'p1', assetIndex: '0', ...dataset },
});

test.beforeEach(() => setAssetMentionAssets(ASSETS));
test.afterEach(() => _resetAssetMentionRegistryForTests());

test('promptAssetInputRefs: 隐藏字段名固定为 promptAssetInputRefs', () => {
  assert.equal(PROMPT_ASSET_INPUT_REFS_FIELD, 'promptAssetInputRefs');
});

test('promptAssetInputRefs: 提及类型会把 source- / ai- 前缀归一到四种输入种类', () => {
  assert.equal(normalizePromptMentionType('source-image'), 'image');
  assert.equal(normalizePromptMentionType('ai-video'), 'video');
  assert.equal(normalizePromptMentionType('ai-text'), 'text');
  assert.equal(normalizePromptMentionType('source-audio'), 'audio');
  assert.equal(normalizePromptMentionType('  ai-image '), 'image');
  assert.equal(normalizePromptMentionType('zzz'), '');
  assert.equal(normalizePromptMentionType(null), '');
});

test('promptAssetInputRefs: 规范化记录会校验 id、索引与类型，并夹取索引', () => {
  assert.deepEqual(
    normalizePromptAssetInputRefRecord({ assetId: ' p1 ', itemIndex: '1.9', type: 'source-image' }),
    { assetId: 'p1', itemIndex: 1, type: 'image' },
  );
  assert.deepEqual(
    normalizePromptAssetInputRefRecord({ assetId: 'p1', itemIndex: -4, type: 'image' }),
    { assetId: 'p1', itemIndex: 0, type: 'image' },
  );
  assert.deepEqual(
    normalizePromptAssetInputRefRecord({ assetId: 'p1', assetIndex: 2, type: 'audio' }),
    { assetId: 'p1', itemIndex: 2, type: 'audio' },
    '没有 itemIndex 时用 assetIndex 兜底',
  );
  assert.equal(normalizePromptAssetInputRefRecord({ itemIndex: 0, type: 'image' }), null, '缺 assetId');
  assert.equal(normalizePromptAssetInputRefRecord({ assetId: 'p1', itemIndex: 'x', type: 'image' }), null);
  assert.equal(normalizePromptAssetInputRefRecord({ assetId: 'p1', itemIndex: 0, type: 'text' }), null, '文本不算素材输入');
  assert.equal(normalizePromptAssetInputRefRecord({ assetId: 'p1', itemIndex: 0, type: 'zzz' }), null);
  assert.equal(normalizePromptAssetInputRefRecord(null), null);
});

test('promptAssetInputRefs: 读隐藏字段时非数组返回空，非法记录被过滤', () => {
  assert.deepEqual(getPromptAssetInputRefRecords({}), []);
  assert.deepEqual(getPromptAssetInputRefRecords(null), []);
  assert.deepEqual(getPromptAssetInputRefRecords({ promptAssetInputRefs: 'nope' }), []);
  assert.deepEqual(
    getPromptAssetInputRefRecords({
      promptAssetInputRefs: [
        { assetId: 'p1', itemIndex: 0, type: 'image' },
        {},
        { assetId: 'p1', itemIndex: 1, type: 'text' },
        { assetId: 'p1', itemIndex: 2, type: 'video' },
      ],
    }),
    [
      { assetId: 'p1', itemIndex: 0, type: 'image' },
      { assetId: 'p1', itemIndex: 2, type: 'video' },
    ],
  );
});

test('promptAssetInputRefs: 药丸节点必须同时是 ref-pill 且来源为 asset 才能解析', () => {
  const resolved = getAssetMentionRefFromPillNode(pill());
  assert.equal(resolved.assetId, 'p1');
  assert.equal(resolved.type, 'image');

  const textPill = getAssetMentionRefFromPillNode(pill({ assetIndex: '1' }));
  assert.equal(textPill.type, 'text');
  assert.equal(textPill.content, '正文一');

  assert.equal(getAssetMentionRefFromPillNode(pill({ refOrigin: 'node' })), null);
  assert.equal(getAssetMentionRefFromPillNode({ dataset: {} }), null);
  assert.equal(getAssetMentionRefFromPillNode(null), null);
  assert.equal(getAssetMentionRefFromPillNode(pill({ assetIndex: 'x' })), null);
});

test('promptAssetInputRefs: 没有 classList 时按 className 判断药丸，并能回落到 getAttribute', () => {
  const node = {
    className: 'ref-pill other',
    getAttribute: (name) => ({ 'data-ref-origin': 'asset', 'data-asset-id': 'p1', 'data-asset-index': '2' })[name] || null,
  };
  const resolved = getAssetMentionRefFromPillNode(node);
  assert.equal(resolved.type, 'video');
  assert.equal(resolved.url, 'http://cdn/movie.mp4');
});

test('promptAssetInputRefs: 从提示词 DOM 抓引用，按出现次数编号', () => {
  const editor = { querySelectorAll: () => [pill(), pill({ assetIndex: '1' }), pill({ refOrigin: 'node' })] };
  const refs = getAssetInputRefsFromPrompt(editor);
  assert.equal(refs.length, 2);
  assert.deepEqual(
    refs.map((ref) => [ref.assetId, ref.itemIndex, ref.type, ref.assetRefSource]),
    [
      ['p1', 0, 'image', 'prompt'],
      ['p1', 1, 'text', 'prompt'],
    ],
  );

  assert.deepEqual(getAssetInputRefsFromPrompt(null), []);
  assert.deepEqual(getAssetInputRefsFromPrompt({}), []);
});

test('promptAssetInputRefs: 按 allowedTypes 过滤掉不允许的输入种类', () => {
  const editor = { querySelectorAll: () => [pill(), pill({ assetIndex: '2' })] };
  const onlyVideo = getAssetInputRefsFromPrompt(editor, { allowedTypes: ['video'] });
  assert.deepEqual(onlyVideo.map((ref) => ref.type), ['video']);
  const onlyImage = getAssetInputRefsFromPrompt(editor, { allowedTypes: ['source-image'] });
  assert.deepEqual(onlyImage.map((ref) => ref.type), ['image']);
});

test('promptAssetInputRefs: 从提示词 HTML 抓引用，同一条重复出现时递增编号', () => {
  const refs = getAssetInputRefsFromPromptHtml(imageSpan() + imageSpan());
  assert.equal(refs.length, 2);
  assert.deepEqual(refs.map((ref) => ref.assetMentionOccurrence), [0, 1]);
  assert.deepEqual(refs.map((ref) => ref.assetRefSource), ['prompt', 'prompt']);
});

test('promptAssetInputRefs: HTML 里的类型与注册表对不上、或不是 asset 来源时都不产出', () => {
  assert.deepEqual(getAssetInputRefsFromPromptHtml(imageSpan({ 'data-ref-type': 'ai-video' })), []);
  assert.deepEqual(getAssetInputRefsFromPromptHtml(imageSpan({ 'data-ref-origin': 'node' })), []);
  assert.deepEqual(getAssetInputRefsFromPromptHtml('<span class="ref-pill">图一</span>'), []);
  assert.deepEqual(getAssetInputRefsFromPromptHtml(''), []);
  assert.deepEqual(getAssetInputRefsFromPromptHtml(), []);
});

test('promptAssetInputRefs: 从节点隐藏字段抓引用，来源标为 hidden 并带回字段下标', () => {
  const refs = getPromptAssetInputRefsFromNode({
    promptAssetInputRefs: [
      { assetId: 'p1', itemIndex: 0, type: 'image' },
      { assetId: 'p1', itemIndex: 2, type: 'video' },
      { assetId: 'p1', itemIndex: 1, type: 'image' },
    ],
  });
  assert.deepEqual(
    refs.map((ref) => [ref.type, ref.assetRefSource, ref.promptAssetRefIndex]),
    [
      ['image', 'hidden', 0],
      ['video', 'hidden', 1],
    ],
    '第三条声明的类型是 image，但下标 1 在注册表里是文本，被丢掉',
  );
});

test('promptAssetInputRefs: 节点数据会把 HTML 与隐藏字段两条来路串起来', () => {
  const refs = getAssetInputRefsFromNodeData({
    prompt: imageSpan(),
    promptAssetInputRefs: [{ assetId: 'p1', itemIndex: 2, type: 'video' }],
  });
  assert.deepEqual(refs.map((ref) => ref.assetRefSource), ['prompt', 'hidden']);
  assert.deepEqual(getAssetInputRefsFromNodeData({}), []);
});

test('promptAssetInputRefs: 提示词与节点一起抓时，默认不去重', () => {
  const nodeData = { promptAssetInputRefs: [{ assetId: 'p1', itemIndex: 0, type: 'image' }] };
  const withoutDedupe = getAssetInputRefsFromPromptAndNode(null, { nodeData });
  assert.equal(withoutDedupe.length, 1);

  const duplicated = getAssetInputRefsFromPromptAndNode(null, {
    nodeData: {
      promptAssetInputRefs: [
        { assetId: 'p1', itemIndex: 0, type: 'image' },
        { assetId: 'p1', itemIndex: 0, type: 'image' },
      ],
    },
  });
  assert.deepEqual(duplicated.map((ref) => ref.assetMentionOccurrence), [0, 1]);
});

test('promptAssetInputRefs: 开启去重后同一条只保留一份，并把编号标成 -1', () => {
  const refs = getAssetInputRefsFromPromptAndNode(null, {
    nodeData: {
      promptAssetInputRefs: [
        { assetId: 'p1', itemIndex: 0, type: 'image' },
        { assetId: 'p1', itemIndex: 0, type: 'image' },
      ],
    },
    dedupe: true,
  });
  assert.equal(refs.length, 1);
  assert.equal(refs[0].assetId, 'p1');
  assert.equal(refs[0].assetMentionOccurrence, -1);
});

test('promptAssetInputRefs: 注册表里没有这条素材时解析不到任何引用', () => {
  _resetAssetMentionRegistryForTests();
  assert.equal(resolveAssetMentionRef({ assetId: 'p1', itemIndex: 0 }), null);
  assert.deepEqual(getAssetInputRefsFromPromptHtml(imageSpan()), []);
  assert.equal(getAssetMentionRefFromPillNode(pill()), null);
});
