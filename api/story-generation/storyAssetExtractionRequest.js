import { normalizeStringArray, normalizeText } from '../utils/storyGenerationValues.js';
const REQUIRED_STORY_ASSET_INSTRUCTION =
    'requiredAssets 是由剧本结构确定的最低覆盖清单；每一项都必须按给定 kind 和 name 恰好返回一次，不得改名、合并或省略，同时继续从所提供的剧本证据发现清单外的必要资产。',
  CANDIDATE_STORY_ASSET_INSTRUCTION =
    'candidateAssets 只是本地召回线索，不是已确认资产或最低覆盖清单。必须逐项核验其 evidence 原文片段，只有片段明确支持且确需视觉一致性时才可返回；允许全部省略，禁止为照抄候选而创建资产。';
export const STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION = 2;
function normalizeStoryAssetClientKeyText(value = '') {
  return normalizeText(value)
    ['normalize']('NFKC')
    ['replace'](/\s+/gu, '')
    ['replace'](/[^\p{L}\p{N}]+/gu, '')
    ['toLowerCase']();
}
function hashStoryAssetClientKeyText(item = '') {
  let key = 0x811c9dc5;
  const list = String(item || '');
  for (let index = 0; index < list['length']; index += 1) {
    ((key ^= list['charCodeAt'](index)), (key = Math['imul'](key, 0x1000193)));
  }
  return (key >>> 0)['toString'](16)['padStart'](8, '0');
}
export function createStoryAssetContractClientKey({
  kind: kind = '',
  tier: tier = '',
  name: name = '',
  sourceSceneRefs: sourceSceneRefs = [],
} = {}) {
  const text = normalizeText(kind),
    result = tier === 'required' ? 'required' : 'optional',
    storyAssetClientKeyText = normalizeStoryAssetClientKeyText(name),
    args = normalizeStringArray(sourceSceneRefs)
      ['map'](normalizeStoryAssetClientKeyText)
      ['filter'](Boolean)
      ['sort'](),
    data = '' + (text[0] || 'a') + result[0] + '-';
  return (
    '' + data + hashStoryAssetClientKeyText([text, result, storyAssetClientKeyText, ...args]['join']('\x00'))
  );
}
function createStoryAssetNames(options, target, source = null, next = ![]) {
  return normalizeStringArray(options)['flatMap']((kind2) => {
    const list2 = Array['isArray'](source?.[kind2]) ? source[kind2] : [];
    return normalizeStringArray(target?.[kind2])['map']((name2) => {
      const current = list2['find']((error) => normalizeText(error?.['name']) === name2),
        sourceSceneRefs2 = normalizeStringArray(current?.['sourceSceneRefs']),
        sourceChapterIds = normalizeStringArray(current?.['sourceChapterIds']),
        role = normalizeText(current?.['role']),
        fixedTraits = normalizeText(current?.['fixedTraits']),
        clientKey = createStoryAssetContractClientKey({
          kind: kind2,
          tier: 'required',
          name: name2,
          sourceSceneRefs: sourceSceneRefs2,
        });
      return {
        kind: kind2,
        name: name2,
        ...(next ? { clientKey: clientKey } : {}),
        ...(next && sourceSceneRefs2['length'] ? { sourceSceneRefs: sourceSceneRefs2 } : {}),
        ...(next && sourceChapterIds['length'] ? { sourceChapterIds: sourceChapterIds } : {}),
        ...(next && kind2 === 'character' && role ? { role: role } : {}),
        ...(next && kind2 === 'character' && fixedTraits ? { fixedTraits: fixedTraits } : {}),
      };
    });
  });
}
function createStoryAssetCandidates(entry, record, payload = ![]) {
  return normalizeStringArray(entry)['flatMap']((kind3) => {
    const list3 = Array['isArray'](record?.[kind3]) ? record[kind3] : [],
      map = new Map();
    return (
      list3['forEach']((error2) => {
        const name3 = normalizeText(error2 && typeof error2 === 'object' ? error2['name'] : error2);
        if (!name3) return;
        const evidence = normalizeText(error2 && typeof error2 === 'object' ? error2['evidence'] : ''),
          sourceSceneRefs3 = normalizeStringArray(
            error2 && typeof error2 === 'object' ? error2['sourceSceneRefs'] : [],
          )['slice'](0, 3),
          sourceChapterIds2 = normalizeStringArray(
            error2 && typeof error2 === 'object' ? error2['sourceChapterIds'] : [],
          )['slice'](0, 3),
          handle = {
            kind: kind3,
            name: name3,
            ...(payload
              ? {
                  clientKey: createStoryAssetContractClientKey({
                    kind: kind3,
                    tier: 'optional',
                    name: name3,
                    sourceSceneRefs: sourceSceneRefs3,
                  }),
                }
              : {}),
            ...(evidence ? { evidence: evidence } : {}),
            ...(sourceSceneRefs3['length'] ? { sourceSceneRefs: sourceSceneRefs3 } : {}),
            ...(sourceChapterIds2['length'] ? { sourceChapterIds: sourceChapterIds2 } : {}),
          };
        if (!map['has'](name3)) map['set'](name3, handle);
      }),
      [...map['values']()]
    );
  });
}
export function createStoryAssetPromptContracts(
  list4 = [],
  state = null,
  config = null,
  scope = null,
  { includeClientKeys: includeClientKeys = ![] } = {},
) {
  const candidateAssets = createStoryAssetCandidates(list4, config, includeClientKeys),
    requiredAssets = createStoryAssetNames(list4, state, scope, includeClientKeys);
  if (includeClientKeys) {
    const list5 = [...requiredAssets, ...candidateAssets]['map']((input) => input['clientKey']);
    if (new Set(list5)['size'] !== list5['length'])
      throw new Error('资产合同生成了重复 clientKey，已在调用 API 前安全停止。');
  }
  return {
    payload: {
      ...(requiredAssets['length'] ? { requiredAssets: requiredAssets } : {}),
      ...(candidateAssets['length'] ? { candidateAssets: candidateAssets } : {}),
    },
    requirements: [
      ...(requiredAssets['length'] ? [REQUIRED_STORY_ASSET_INSTRUCTION] : []),
      ...(candidateAssets['length'] ? [CANDIDATE_STORY_ASSET_INSTRUCTION] : []),
    ],
  };
}
export function createStoryAssetExtractionStructuredOutput({
  assetKinds: assetKinds = [],
  schema: schema,
  fallback: fallback = 'prompt',
  mode: mode = 'detailed',
} = {}) {
  const list6 = normalizeStringArray(assetKinds);
  return {
    name:
      mode === 'compact'
        ? 'story_asset_' +
          (list6['join']('_') || 'all') +
          '_compact_v' +
          STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION
        : 'story_asset_' + (list6['join']('_') || 'all') + '_detailed_v2',
    schema: schema,
    strict: !![],
    fallback: fallback === 'none' ? 'none' : 'prompt',
  };
}
