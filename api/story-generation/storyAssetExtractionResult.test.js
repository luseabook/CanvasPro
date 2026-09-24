import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
  STORY_ASSET_EXTRACTION_KINDS,
  mergeStoryAssetVisualPromptRepair,
  normalizeStoryAssetReference,
  createStoryAssetExtractionResponseSchema,
  createStoryAssetCompactExtractionResponseSchema,
  parseStoryAssetExtractionResult,
  parseStoryAssetCompactExtractionResult,
} from './storyAssetExtractionResult.js';
import { createStoryAssetContractClientKey } from './storyAssetExtractionRequest.js';

const hero = (overrides = {}) => ({
  ref: 'hero one',
  kind: '角色',
  name: '张三',
  role: '主角',
  description: '青年',
  voiceDescription: '低沉',
  occurrences: '第1集',
  sourceChapterIds: ['e1'],
  appearances: [{ name: '日常', description: '红衣', prompt: '红衣青年' }],
  ...overrides,
});
const parse = (value, options) => parseStoryAssetExtractionResult(JSON.stringify(value), options);

test('exposes the schema version and frozen kind list', () => {
  assert.equal(STORY_ASSET_EXTRACTION_SCHEMA_VERSION, 2);
  assert.deepEqual(STORY_ASSET_EXTRACTION_KINDS, ['character', 'scene', 'prop']);
  assert.ok(Object.isFrozen(STORY_ASSET_EXTRACTION_KINDS));
});

test('normalizeStoryAssetReference hyphenates whitespace or falls back', () => {
  assert.equal(normalizeStoryAssetReference(' a  b\tc ', 'fb'), 'a-b-c');
  assert.equal(normalizeStoryAssetReference('', 'fb'), 'fb');
  assert.equal(normalizeStoryAssetReference(null, 'fb'), 'fb');
  assert.equal(normalizeStoryAssetReference(12, 'fb'), '12');
});

test('detailed response schema adapts to the requested kinds', () => {
  const all = createStoryAssetExtractionResponseSchema();
  const item = all.properties.assets.items;
  assert.deepEqual(item.properties.kind.enum, ['character', 'scene', 'prop']);
  assert.equal(item.properties.name.maxLength, 20);
  assert.equal(item.properties.appearances.maxItems, 4);
  assert.equal(item.required.length, 9);
  assert.equal(item.properties.appearances.items.properties.prompt.maxLength, 1200);
  assert.equal(item.properties.sourceChapterIds.maxItems, 100);
  const characters = createStoryAssetExtractionResponseSchema(['character']).properties.assets.items;
  assert.equal(characters.properties.name.maxLength, 12);
  const props = createStoryAssetExtractionResponseSchema(['prop', 'bogus']).properties.assets.items;
  assert.deepEqual(props.properties.kind.enum, ['prop']);
  assert.equal(props.properties.appearances.maxItems, 1);
  const fallback = createStoryAssetExtractionResponseSchema(['bogus']).properties.assets.items;
  assert.deepEqual(fallback.properties.kind.enum, ['character', 'scene', 'prop']);
});

test('compact response schema pins the contract size and per-kind limits', () => {
  const characters = createStoryAssetCompactExtractionResponseSchema(['character'], ['k1', 'k2', ' k1 '])
    .properties.assets;
  assert.equal(characters.minItems, 2);
  assert.equal(characters.maxItems, 2);
  assert.deepEqual(characters.items.properties.clientKey.enum, ['k1', 'k2']);
  assert.equal(characters.items.properties.visualPrompt.maxLength, 360);
  assert.equal(characters.items.properties.voiceDescription.maxLength, 180);
  const scenes = createStoryAssetCompactExtractionResponseSchema(['scene'], ['k']).properties.assets.items
    .properties;
  assert.equal(scenes.visualPrompt.maxLength, 320);
  assert.equal(scenes.voiceDescription.maxLength, 0);
  const mixed = createStoryAssetCompactExtractionResponseSchema().properties.assets;
  assert.equal(mixed.maxItems, 0);
  assert.equal('enum' in mixed.items.properties.clientKey, false);
  assert.equal(mixed.items.properties.visualPrompt.maxLength, 280);
});

test('parse normalizes a detailed character asset', () => {
  assert.deepEqual(parse({ assets: [hero()] }, { chapterIds: ['e1'] }), {
    schemaVersion: 2,
    assets: [
      {
        ref: 'hero-one',
        kind: 'character',
        name: '张三',
        role: '主角',
        description: '青年',
        voiceDescription: '低沉',
        occurrences: '第1集',
        sourceChapterIds: ['e1'],
        appearances: [
          {
            ref: 'hero-one-appearance-1',
            name: '日常',
            description: '红衣',
            occurrences: '第1集',
            sourceChapterIds: ['e1'],
            prompt: '红衣青年',
          },
        ],
      },
    ],
  });
});

test('parse accepts common response shapes and kind aliases', () => {
  const scene = { name: '客厅', appearances: [{ name: '白天', prompt: '明亮客厅' }] };
  assert.equal(parse([{ ...scene, kind: 'location' }]).assets[0].kind, 'scene');
  assert.equal(parse({ scenes: [scene] }).assets[0].kind, 'scene');
  assert.equal(parse({ data: { assets: [{ ...scene, kind: '场景' }] } }).assets[0].kind, 'scene');
  assert.equal(parse({ result: { 道具: [{ ...scene, name: '剑' }] } }).assets[0].kind, 'prop');
  const single = parse(
    { locations: [{ sceneName: '天台', appearances: [{ name: '夜', prompt: 'p' }] }] },
    { allowedKinds: ['scene'] },
  );
  assert.throws(() => parse({ items: [{ sceneName: '天台' }] }, { allowedKinds: ['scene'] }), {
    message: 'Agent 返回结果没有可用的场景资产。',
  });
  assert.deepEqual(
    single.assets.map((asset) => [asset.kind, asset.name, asset.ref]),
    [['scene', '天台', 'asset-1']],
  );
});

test('parse drops voice descriptions for non-characters and skips nameless items', () => {
  const result = parse({
    assets: [
      { kind: 'scene', name: '客厅', voiceDescription: '回声', appearances: [{ name: '白天', prompt: 'p' }] },
      { kind: 'scene', appearances: [] },
      { kind: 'vehicle', name: '车', appearances: [] },
    ],
  });
  assert.equal(result.assets.length, 1);
  assert.equal(result.assets[0].voiceDescription, '');
});

test('parse enforces requested kinds, concise names and legal roles', () => {
  assert.throws(() => parse({ assets: [{ kind: 'scene', name: '客厅' }] }, { allowedKinds: ['character'] }), {
    message: 'Agent 在本轮返回了未请求的资产类型“scene”。',
  });
  assert.throws(() => parse({ assets: [hero({ name: '张三，一个年轻的侦探' })] }), {
    message: '角色名称必须是姓名或简短身份名，不能包含人物说明：张三，一个年轻的侦探',
  });
  assert.throws(() => parse({ assets: [hero({ name: '角色名：张三' })] }), /^Error: 角色名称必须是姓名/);
  assert.throws(
    () => parse({ assets: [{ kind: 'prop', name: '一把非常非常非常非常非常非常非常长的古老宝剑' }] }),
    /^Error: 道具名称/,
  );
  assert.throws(() => parse({ assets: [{ kind: 'scene', name: '客厅；卧室' }] }), /^Error: 场景名称/);
  assert.throws(() => parse({ assets: [hero({ role: '侦探' })] }), {
    message: '角色 role 只能是主角、配角、反派或路人，人物说明必须写入 description。',
  });
});

test('parse validates chapters, appearances and prompts', () => {
  const options = { chapterIds: ['e1'] };
  assert.throws(() => parse({ assets: [hero({ sourceChapterIds: ['e1', 'e9'] })] }, options), {
    message: '资产“张三”引用了不存在的章节：e9。',
  });
  assert.throws(() => parse({ assets: [hero({ appearances: [] })] }), {
    message: '资产“张三”缺少形象和图片提示词。',
  });
  assert.throws(() => parse({ assets: [hero({ appearances: [{ prompt: 'p' }] })] }), {
    message: '资产“张三”的第 1 个形象缺少具体形象名称。',
  });
  assert.throws(() => parse({ assets: [hero({ appearances: [{ name: '日常', prompt: ' ' }] })] }), {
    message: '资产“张三”存在缺少图片提示词的形象。',
    code: 'STORY_ASSET_VISUAL_PROMPT_MISSING',
  });
  assert.throws(
    () =>
      parse(
        { assets: [hero({ appearances: [{ name: '日常', prompt: 'p', sourceChapterIds: ['e9'] }] })] },
        options,
      ),
    { message: '资产“张三”的形象引用了不存在的章节：e9。' },
  );
});

test('multi-appearance props collapse into one base appearance', () => {
  const [prop] = parse({
    assets: [
      {
        ref: 'sword',
        kind: 'prop',
        name: '剑',
        occurrences: '全剧',
        sourceChapterIds: ['e1'],
        appearances: [
          { name: '完好', description: '锋利', occurrences: '第1集', sourceChapterIds: ['e1'], prompt: '' },
          { name: '断裂', description: '', occurrences: '第3集', sourceChapterIds: ['e3'], prompt: '断剑' },
        ],
      },
    ],
  }).assets;
  assert.deepEqual(prop.appearances, [
    {
      ref: 'sword-base',
      name: '基础形象',
      description: '完好：锋利；断裂',
      occurrences: '第1集、第3集',
      sourceChapterIds: ['e1', 'e3'],
      prompt: '断剑',
    },
  ]);
});

test('empty results fail with diagnostics unless allowed', () => {
  assert.throws(
    () => parse({ foo: [], bar: 1 }),
    (error) => {
      assert.equal(error.message, 'Agent 返回结果没有可用的角色或场景资产。');
      assert.deepEqual(error.raw, {
        allowedKinds: ['character', 'scene', 'prop'],
        topLevelKeys: ['foo', 'bar'],
        returnedAssetCount: 0,
      });
      return true;
    },
  );
  assert.throws(() => parse({ assets: [] }, { allowedKinds: ['character'] }), {
    message: 'Agent 返回结果没有可用的角色资产。',
  });
  assert.deepEqual(parse({ assets: [] }, { allowedKinds: ['prop'] }), { schemaVersion: 2, assets: [] });
  assert.deepEqual(parse({ assets: [] }, { allowEmptyResult: true }), { schemaVersion: 2, assets: [] });
  assert.throws(() => parseStoryAssetExtractionResult(''), { message: 'Agent 未返回资产提取结果。' });
});

test('duplicate asset refs are rejected', () => {
  assert.throws(() => parse({ assets: [hero({ ref: 'x' }), hero({ ref: 'x', name: '李四' })] }), {
    message: 'Agent 返回了重复的资产引用。',
  });
});

test('visual prompt repair fills only empty prompts from an unambiguous match', () => {
  const original = JSON.stringify({
    assets: [
      {
        ref: 'a',
        kind: 'character',
        name: '张三',
        extra: 1,
        appearances: [
          { ref: 'a1', prompt: '' },
          { ref: 'a2', prompt: '已有' },
          { ref: 'a3', prompt: '' },
        ],
      },
      { name: '客厅', kind: 'scene', appearances: [{ name: '白天', prompt: '' }] },
      { ref: 'b', kind: 'prop', appearances: [{ ref: 'b1', prompt: '' }] },
    ],
  });
  const repair = JSON.stringify({
    assets: [
      {
        ref: 'a',
        kind: 'character',
        appearances: [
          { ref: 'a1', prompt: '补的' },
          { ref: 'a2', prompt: '新' },
        ],
      },
      { name: '客厅', kind: 'scene', appearances: [{ name: '白天', prompt: '补客厅' }] },
      { ref: 'b', kind: 'scene', appearances: [{ ref: 'b1', prompt: '错类型' }] },
    ],
  });
  const result = mergeStoryAssetVisualPromptRepair(original, repair);
  assert.deepEqual(result.assets[0], {
    ref: 'a',
    kind: 'character',
    name: '张三',
    extra: 1,
    appearances: [
      { ref: 'a1', prompt: '补的' },
      { ref: 'a2', prompt: '已有' },
      { ref: 'a3', prompt: '' },
    ],
  });
  assert.equal(result.assets[1].appearances[0].prompt, '补客厅');
  assert.equal(result.assets[2].appearances[0].prompt, '');
});

test('visual prompt repair ignores ambiguous repair matches', () => {
  const original = { assets: [{ ref: 'a', kind: 'prop', appearances: [{ ref: 'a1', prompt: '' }] }] };
  const repair = {
    assets: [
      { ref: 'a', kind: 'prop', appearances: [{ ref: 'a1', prompt: 'x' }] },
      { ref: 'a', kind: 'prop', appearances: [{ ref: 'a1', prompt: 'y' }] },
    ],
  };
  assert.equal(mergeStoryAssetVisualPromptRepair(original, repair).assets[0].appearances[0].prompt, '');
});

const SNAPSHOT = {
  responseSchemaVersion: 2,
  requiredAssets: [
    {
      clientKey: 'cr-1',
      kind: 'character',
      name: '张三',
      role: '主角',
      sourceChapterIds: ['e1', 'e9'],
      sourceSceneRefs: ['s1'],
    },
  ],
  candidateAssets: [{ clientKey: 'po-1', kind: 'prop', name: '剑' }],
};
const decision = (clientKey, overrides = {}) => ({
  clientKey,
  include: true,
  description: '青年',
  visualPrompt: '红衣青年',
  voiceDescription: '',
  ...overrides,
});
const compact = (assets, options = {}) =>
  parseStoryAssetCompactExtractionResult(JSON.stringify({ assets }), {
    contractSnapshot: SNAPSHOT,
    chapterIds: ['e1'],
    ...options,
  });

test('compact parse expands included contract decisions into assets', () => {
  const result = compact([
    decision('cr-1', { voiceDescription: '低沉' }),
    decision('po-1', { include: false, description: '', visualPrompt: '' }),
  ]);
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.responseSchemaVersion, 2);
  assert.deepEqual(result.assets, [
    {
      ref: 'cr-1',
      kind: 'character',
      name: '张三',
      role: '主角',
      description: '青年',
      voiceDescription: '低沉',
      occurrences: '第1集',
      sourceChapterIds: ['e1'],
      sourceSceneRefs: ['s1'],
      appearances: [
        {
          ref: 'cr-1-base',
          name: '日常形象',
          description: '青年',
          occurrences: '第1集',
          sourceChapterIds: ['e1'],
          prompt: '红衣青年',
        },
      ],
    },
  ]);
  assert.deepEqual(
    result.decisions.map((item) => [item.clientKey, item.required, item.include]),
    [
      ['cr-1', true, true],
      ['po-1', false, false],
    ],
  );
});

test('compact parse labels scenes and props and formats occurrences', () => {
  const snapshot = {
    responseSchemaVersion: 2,
    requiredAssets: [
      { clientKey: 'sr-1', kind: 'scene', name: '客厅', sourceChapterIds: ['episode-a'] },
      { clientKey: 'pr-1', kind: 'prop', name: '剑' },
      { clientKey: 'cr-2', kind: 'character', name: '李四', role: '导师' },
    ],
    candidateAssets: [],
  };
  const result = parseStoryAssetCompactExtractionResult(
    JSON.stringify({ assets: [decision('sr-1'), decision('pr-1'), decision('cr-2')] }),
    { contractSnapshot: snapshot },
  );
  assert.deepEqual(
    result.assets.map((asset) => [asset.role, asset.appearances[0].name, asset.occurrences]),
    [
      ['剧情场景', '标准环境', '第a集'],
      ['关键道具', '标准状态', '第相关集'],
      ['配角', '日常形象', '第相关集'],
    ],
  );
});

test('compact parse derives contracts when no current snapshot is given', () => {
  const key = createStoryAssetContractClientKey({ kind: 'prop', tier: 'required', name: '剑' });
  const result = parseStoryAssetCompactExtractionResult(JSON.stringify({ assets: [decision(key)] }), {
    assetKinds: ['prop'],
    requiredAssetNamesByKind: { prop: ['剑'] },
    contractSnapshot: { responseSchemaVersion: 1, requiredAssets: [] },
  });
  assert.equal(result.assets[0].ref, key);
  assert.equal(result.assets[0].name, '剑');
  assert.deepEqual(parseStoryAssetCompactExtractionResult('{"assets":[]}').assets, []);
});

test('compact parse rejects protocol violations', () => {
  assert.throws(() => compact([decision('zz')]), { message: 'Agent 紧凑结果返回了未知 clientKey：zz。' });
  assert.throws(() => compact([{ include: true }]), {
    message: 'Agent 紧凑结果返回了未知 clientKey：第1行。',
  });
  assert.throws(() => compact([decision('cr-1'), decision('cr-1')]), {
    message: 'Agent 紧凑结果重复返回 clientKey：cr-1。',
  });
  assert.throws(() => compact([decision('cr-1', { include: 'yes' })]), {
    message: 'Agent 紧凑结果中的 cr-1 缺少明确 include 裁决。',
  });
  assert.throws(() => compact([decision('cr-1', { include: false })]), {
    message: 'Agent 紧凑结果试图排除必需资产 cr-1；必需资产不能排除。',
  });
  assert.throws(() => compact([decision('cr-1')]), { message: 'Agent 紧凑结果缺少合同裁决：po-1。' });
  assert.throws(
    () => compact([decision('cr-1', { description: '' }), decision('po-1', { include: false })]),
    {
      message: 'Agent 紧凑结果中的“张三”缺少最终 description。',
    },
  );
  assert.throws(
    () => compact([decision('cr-1', { visualPrompt: '' }), decision('po-1', { include: false })]),
    {
      message: 'Agent 紧凑结果中的“张三”缺少最终 visualPrompt。',
    },
  );
  assert.throws(() => compact([decision('cr-1'), decision('po-1', { voiceDescription: '金属声' })]), {
    message: 'Agent 紧凑结果中的非角色资产“剑”不得返回 voiceDescription。',
  });
  assert.throws(() => parseStoryAssetCompactExtractionResult(''), { message: 'Agent 未返回紧凑资产结果。' });
});

test('compact parse rejects broken contracts and duplicate included names', () => {
  const broken = {
    responseSchemaVersion: 2,
    requiredAssets: [
      { clientKey: 'a', kind: 'prop', name: 'x' },
      { clientKey: 'a', kind: 'prop', name: 'y' },
    ],
  };
  assert.throws(() => parseStoryAssetCompactExtractionResult('{"assets":[]}', { contractSnapshot: broken }), {
    message: '客户端紧凑资产合同包含空或重复 clientKey。',
  });
  const dup = {
    responseSchemaVersion: 2,
    requiredAssets: [{ clientKey: 'p1', kind: 'prop', name: '剑' }],
    candidateAssets: [{ clientKey: 'p2', kind: 'prop', name: '剑' }],
  };
  assert.throws(
    () =>
      parseStoryAssetCompactExtractionResult(JSON.stringify({ assets: [decision('p1'), decision('p2')] }), {
        contractSnapshot: dup,
      }),
    { message: 'Agent 紧凑结果返回了重复资产名称“剑”。' },
  );
  const nameless = {
    responseSchemaVersion: 2,
    requiredAssets: [{ clientKey: 'p1', kind: 'prop', name: '' }],
  };
  assert.throws(
    () =>
      parseStoryAssetCompactExtractionResult(JSON.stringify({ assets: [decision('p1')] }), {
        contractSnapshot: nameless,
      }),
    { message: '客户端紧凑资产合同 p1 缺少 kind 或 name。' },
  );
});
