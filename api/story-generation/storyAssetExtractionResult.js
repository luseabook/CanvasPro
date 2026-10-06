import { parseStrictJson } from '../utils/strictJson.js';
import { normalizeStringArray, normalizeText } from '../utils/storyGenerationValues.js';
import {
  sanitizeStoryAssetPublicDescriptionText,
  sanitizeStoryAssetPublicPromptText,
} from '../utils/storyAssetPublicText.js';
import {
  STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION,
  createStoryAssetPromptContracts,
} from './storyAssetExtractionRequest.js';
import { getResultText } from './storyTextRequest.js';
export const STORY_ASSET_EXTRACTION_SCHEMA_VERSION = 2;
export const STORY_ASSET_EXTRACTION_KINDS = Object.freeze(['character', 'scene', 'prop']);
const STORY_ASSET_PUBLIC_PROMPT_MAX_CHARACTERS = 1200,
  STORY_ASSET_SOURCE_CHAPTER_MAX_ITEMS = 100;
export function mergeStoryAssetVisualPromptRepair(value, item, key = STORY_ASSET_EXTRACTION_KINDS) {
  const assets = getStoryAssetExtractionRawAssets(parseStrictJson(getResultText(value)), key),
    list = getStoryAssetExtractionRawAssets(parseStrictJson(getResultText(item)), key),
    handler = (error) => normalizeText(error?.ref) || normalizeText(error?.name);
  return {
    assets: assets.map((appearances) => {
      const list2 = list.filter(
          (index) => handler(index) === handler(appearances) && index.kind === appearances.kind,
        ),
        result = list2.length === 1 ? list2[0] : null;
      return {
        ...appearances,
        appearances: appearances.appearances.map((args) => {
          if (sanitizeStoryAssetPublicPromptText(args.prompt)) return args;
          const prompt = (result?.appearances || []).filter((data) => handler(data) === handler(args));
          return prompt.length === 1 ? { ...args, prompt: prompt[0].prompt } : args;
        }),
      };
    }),
  };
}
export function normalizeStoryAssetReference(options, target) {
  return normalizeText(options).replace(/\s+/g, '-') || target;
}
function assertConciseStoryAssetName(args2, source) {
  const next = source === 'character' ? 12 : 20;
  if (
    [...args2].length > next ||
    /[，,。；;\n]/u.test(args2) ||
    /^(?:角色名|人物名|姓名|名称)\s*[:：]/u.test(args2)
  ) {
    const current = source === 'character' ? '角色' : source === 'prop' ? '道具' : '场景';
    throw new Error(current + '名称必须是姓名或简短身份名，不能包含人物说明：' + args2);
  }
}
function assertStoryCharacterRole(entry) {
  if (!['主角', '配角', '反派', '路人'].includes(normalizeText(entry)))
    throw new Error('角色 role 只能是主角、配角、反派或路人，人物说明必须写入 description。');
}
export function createStoryAssetExtractionResponseSchema(record = STORY_ASSET_EXTRACTION_KINDS) {
  const list3 = normalizeStringArray(record).filter((payload) =>
      STORY_ASSET_EXTRACTION_KINDS.includes(payload),
    ),
    enumValue = list3.length ? list3 : [...STORY_ASSET_EXTRACTION_KINDS],
    sourceChapterIds = {
      type: 'array',
      maxItems: STORY_ASSET_SOURCE_CHAPTER_MAX_ITEMS,
      items: { type: 'string' },
    };
  return {
    type: 'object',
    additionalProperties: false,
    required: ['assets'],
    properties: {
      assets: {
        type: 'array',
        minItems: 0,
        maxItems: 128,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'ref',
            'kind',
            'name',
            'role',
            'description',
            'voiceDescription',
            'occurrences',
            'sourceChapterIds',
            'appearances',
          ],
          properties: {
            ref: { type: 'string', maxLength: 64 },
            kind: { type: 'string', enum: enumValue },
            name: {
              type: 'string',
              maxLength: enumValue.length === 1 && enumValue[0] === 'character' ? 12 : 20,
            },
            role: { type: 'string', maxLength: 16 },
            description: { type: 'string', maxLength: 320 },
            voiceDescription: { type: 'string', maxLength: 240 },
            occurrences: { type: 'string', maxLength: 160 },
            sourceChapterIds: sourceChapterIds,
            appearances: {
              type: 'array',
              minItems: 1,
              maxItems: enumValue.some((handle) => handle === 'character' || handle === 'scene')
                ? 4
                : 1,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['ref', 'name', 'description', 'occurrences', 'sourceChapterIds', 'prompt'],
                properties: {
                  ref: { type: 'string', maxLength: 64 },
                  name: { type: 'string', maxLength: 32 },
                  description: { type: 'string', maxLength: 320 },
                  occurrences: { type: 'string', maxLength: 160 },
                  sourceChapterIds: sourceChapterIds,
                  prompt: {
                    type: 'string',
                    minLength: 1,
                    maxLength: STORY_ASSET_PUBLIC_PROMPT_MAX_CHARACTERS,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
export function createStoryAssetCompactExtractionResponseSchema(
  state = STORY_ASSET_EXTRACTION_KINDS,
  config = [],
) {
  const list4 = normalizeStringArray(state).filter((scope) =>
      STORY_ASSET_EXTRACTION_KINDS.includes(scope),
    ),
    maxLength = list4.length === 1 ? list4[0] : '',
    enumValue2 = normalizeStringArray(config),
    minItems = enumValue2.length;
  return {
    type: 'object',
    additionalProperties: false,
    required: ['assets'],
    properties: {
      assets: {
        type: 'array',
        minItems: minItems,
        maxItems: minItems,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['clientKey', 'include', 'description', 'visualPrompt', 'voiceDescription'],
          properties: {
            clientKey: {
              type: 'string',
              maxLength: 12,
              ...(enumValue2.length ? { enum: enumValue2 } : {}),
            },
            include: { type: 'boolean' },
            description: { type: 'string', maxLength: 120 },
            visualPrompt: {
              type: 'string',
              maxLength: maxLength === 'character' ? 360 : maxLength === 'scene' ? 320 : 280,
            },
            voiceDescription: { type: 'string', maxLength: maxLength === 'character' ? 180 : 0 },
          },
        },
      },
    },
  };
}
function normalizeStoryAssetExtractionKind(input, output = '') {
  const text = normalizeText(input).toLowerCase(),
    value2 = {
      character: 'character',
      characters: 'character',
      person: 'character',
      people: 'character',
      role: 'character',
      角色: 'character',
      人物: 'character',
      scene: 'scene',
      scenes: 'scene',
      setting: 'scene',
      settings: 'scene',
      location: 'scene',
      locations: 'scene',
      场景: 'scene',
      地点: 'scene',
      prop: 'prop',
      props: 'prop',
      item: 'prop',
      items: 'prop',
      object: 'prop',
      objects: 'prop',
      道具: 'prop',
      物品: 'prop',
    };
  return value2[text] || normalizeText(output);
}
function getStoryAssetExtractionRawAssets(enabled, value3 = STORY_ASSET_EXTRACTION_KINDS) {
  if (Array.isArray(enabled)) return enabled;
  if (!enabled || typeof enabled !== 'object') return [];
  const list5 = normalizeStringArray(value3).filter((value4) =>
      STORY_ASSET_EXTRACTION_KINDS.includes(value4),
    ),
    value5 = list5.length === 1 ? list5[0] : '',
    value6 = {
      character: ['characters', 'characterAssets', 'roles', '人物', '角色', '角色资产'],
      scene: ['scenes', 'sceneAssets', 'settings', 'locations', '场景', '场景资产'],
      prop: ['props', 'propAssets', 'items', 'objects', '道具', '道具资产'],
    },
    list6 = [enabled, enabled.result, enabled.data].filter(
      (value7) => value7 && typeof value7 === 'object' && !Array.isArray(value7),
    ),
    list7 = list6.map((value8) => value8.assets),
    value9 = list7.find((list8) => Array.isArray(list8) && list8.length);
  if (value9) return value9;
  const value10 = [...list6, ...list6.map((value11) => value11.assets)].filter(
      (value12) => value12 && typeof value12 === 'object' && !Array.isArray(value12),
    ),
    list9 = [],
    value13 = value5 ? [value5] : list5;
  for (const value14 of value13) {
    let list10 = null;
    for (const value15 of value10) {
      list10 = value6[value14].map((value16) => value15[value16]).find(
        (list11) => Array.isArray(list11) && list11.length,
      );
      if (list10) break;
    }
    if (!list10) continue;
    list9.push(
      ...list10.map((kind) =>
        kind && typeof kind === 'object' && !Array.isArray(kind)
          ? { ...kind, kind: kind.kind || value14 }
          : kind,
      ),
    );
  }
  if (list9.length) return list9;
  const list12 = [];
  for (const value17 of list6) {
    if (value5)
      for (const value18 of value6[value5]) {
        list12.push(value17[value18]);
      }
    list12.push(value17.assets);
  }
  return (
    list12.find((list13) => Array.isArray(list13) && list13.length) ||
    list12.find(Array.isArray) ||
    []
  );
}
export function parseStoryAssetExtractionResult(
  value19,
  {
    chapterIds: chapterIds = [],
    allowedKinds: allowedKinds = STORY_ASSET_EXTRACTION_KINDS,
    allowEmptyResult: allowEmptyResult = false,
  } = {},
) {
  const strictJson = parseStrictJson(getResultText(value19), 'Agent 未返回资产提取结果。'),
    map = new Set(normalizeStringArray(chapterIds)),
    allowedKinds2 = normalizeStringArray(allowedKinds).filter((value20) =>
      STORY_ASSET_EXTRACTION_KINDS.includes(value20),
    ),
    map2 = new Set(allowedKinds2),
    value21 = allowedKinds2.length === 1 ? allowedKinds2[0] : '',
    returnedAssetCount = getStoryAssetExtractionRawAssets(strictJson, allowedKinds2),
    assets2 = Array.isArray(returnedAssetCount)
      ? returnedAssetCount.map((error2, value22) => {
          const kind2 = normalizeStoryAssetExtractionKind(error2?.kind, value21),
            name = normalizeText(
              error2?.name ||
                error2?.characterName ||
                error2?.sceneName ||
                error2?.propName ||
                error2?.['名称'] ||
                error2?.['角色名'] ||
                error2?.['场景名'] ||
                error2?.['道具名'],
            );
          if (!name || !STORY_ASSET_EXTRACTION_KINDS.includes(kind2)) return null;
          if (map2.size && !map2.has(kind2))
            throw new Error('Agent 在本轮返回了未请求的资产类型“' + kind2 + '”。');
          assertConciseStoryAssetName(name, kind2);
          if (kind2 === 'character') assertStoryCharacterRole(error2?.role);
          const value23 = kind2 === 'character' ? normalizeText(error2?.voiceDescription) : '',
            ref = normalizeStoryAssetReference(error2?.ref, 'asset-' + (value22 + 1)),
            sourceChapterIds2 = normalizeStringArray(error2?.sourceChapterIds);
          if (map.size) {
            const list14 = sourceChapterIds2.filter((value24) => !map.has(value24));
            if (list14.length)
              throw new Error('资产“' + name + '”引用了不存在的章节：' + list14.join('、') + '。');
          }
          const prompt2 = Array.isArray(error2?.appearances) ? error2.appearances : [];
          if (!prompt2.length) throw new Error('资产“' + name + '”缺少形象和图片提示词。');
          const list15 =
              kind2 === 'prop' && prompt2.length > 1
                ? [
                    {
                      ref: ref + '-base',
                      name: '基础形象',
                      description: normalizeStringArray(
                        prompt2.map((error3) => {
                          const text2 = normalizeText(error3?.name),
                            text3 = normalizeText(error3?.description);
                          if (text2 && text3) return text2 + '：' + text3;
                          return text3 || text2;
                        }),
                      ).join('；'),
                      occurrences:
                        normalizeStringArray(
                          prompt2.map((value25) => normalizeText(value25?.occurrences)),
                        ).join('、') || error2?.occurrences,
                      sourceChapterIds: normalizeStringArray(
                        prompt2.flatMap((value26) =>
                          Array.isArray(value26?.sourceChapterIds) ? value26.sourceChapterIds : [],
                        ),
                      ).length
                        ? normalizeStringArray(prompt2.flatMap((value27) => value27.sourceChapterIds))
                        : sourceChapterIds2,
                      prompt: prompt2.map((value28) => normalizeText(value28?.prompt)).find(
                        Boolean,
                      ),
                    },
                  ]
                : prompt2,
            appearances2 = list15.map((error4, value29) => {
              const name2 = normalizeText(error4?.name);
              if (!name2)
                throw new Error('资产“' + name + '”的第 ' + (value29 + 1) + ' 个形象缺少具体形象名称。');
              return {
                ref: normalizeStoryAssetReference(error4?.ref, ref + '-appearance-' + (value29 + 1)),
                name: name2,
                description: sanitizeStoryAssetPublicDescriptionText(error4?.description),
                occurrences: sanitizeStoryAssetPublicDescriptionText(
                  error4?.occurrences || error2?.occurrences,
                ),
                sourceChapterIds: normalizeStringArray(
                  error4?.sourceChapterIds?.length ? error4.sourceChapterIds : sourceChapterIds2,
                ),
                prompt: sanitizeStoryAssetPublicPromptText(error4?.prompt),
              };
            });
          if (appearances2.some((enabled2) => !enabled2.prompt)) {
            const error5 = new Error('资产“' + name + '”存在缺少图片提示词的形象。');
            error5.code = 'STORY_ASSET_VISUAL_PROMPT_MISSING';
            throw error5;
          }
          for (const value30 of appearances2) {
            if (!map.size) continue;
            const list16 = value30.sourceChapterIds.filter((value31) => !map.has(value31));
            if (list16.length)
              throw new Error('资产“' + name + '”的形象引用了不存在的章节：' + list16.join('、') + '。');
          }
          return {
            ref: ref,
            kind: kind2,
            name: name,
            role: normalizeText(error2?.role),
            description: sanitizeStoryAssetPublicDescriptionText(error2?.description),
            voiceDescription: sanitizeStoryAssetPublicDescriptionText(value23),
            occurrences: sanitizeStoryAssetPublicDescriptionText(error2?.occurrences),
            sourceChapterIds: sourceChapterIds2,
            appearances: appearances2,
          };
        }).filter(Boolean)
      : [],
    enabled3 =
      Boolean(allowEmptyResult) || (allowedKinds2.length === 1 && allowedKinds2[0] === 'prop');
  if (!assets2.length && !enabled3) {
    const topLevelKeys =
        strictJson && typeof strictJson === 'object' && !Array.isArray(strictJson)
          ? Object.keys(strictJson).slice(0, 12)
          : [],
      value32 =
        allowedKinds2.length === 1
          ? { character: '角色', scene: '场景', prop: '道具' }[allowedKinds2[0]] || '资产'
          : '角色或场景',
      error6 = new Error('Agent 返回结果没有可用的' + value32 + '资产。');
    error6.raw = {
      allowedKinds: allowedKinds2,
      topLevelKeys: topLevelKeys,
      returnedAssetCount: returnedAssetCount.length,
    };
    throw error6;
  }
  const list17 = assets2.map((value33) => value33.ref);
  if (new Set(list17).size !== list17.length) throw new Error('Agent 返回了重复的资产引用。');
  return { schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION, assets: assets2 };
}
function createStoryAssetCompactOccurrence(list18 = []) {
  const list19 = normalizeStringArray(list18)
    .map((value34) => {
      const text4 = normalizeText(value34).match(/(\d+)\s*$/u)?.[1];
      return (
        text4 ||
        normalizeText(value34)
          .replace(/^episode[-_\s]*/iu, '')
          .replace(/^chapter[-_\s]*/iu, '')
      );
    })
    .filter(Boolean);
  return '第' + (list19.join('、') || '相关') + '集';
}
export function parseStoryAssetCompactExtractionResult(
  value35,
  {
    assetKinds: assetKinds = STORY_ASSET_EXTRACTION_KINDS,
    chapterIds: chapterIds = [],
    requiredAssetNamesByKind: requiredAssetNamesByKind = null,
    requiredAssetsByKind: requiredAssetsByKind = null,
    candidateAssetsByKind: candidateAssetsByKind = null,
    contractSnapshot: contractSnapshot = null,
  } = {},
) {
  const strictJson2 = parseStrictJson(getResultText(value35), 'Agent 未返回紧凑资产结果。'),
    list20 = Array.isArray(strictJson2?.assets) ? strictJson2.assets : [],
    value36 =
      contractSnapshot &&
      typeof contractSnapshot === 'object' &&
      Number(contractSnapshot.responseSchemaVersion) === STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION
        ? {
            requiredAssets: Array.isArray(contractSnapshot.requiredAssets)
              ? contractSnapshot.requiredAssets
              : [],
            candidateAssets: Array.isArray(contractSnapshot.candidateAssets)
              ? contractSnapshot.candidateAssets
              : [],
          }
        : createStoryAssetPromptContracts(
            assetKinds,
            requiredAssetNamesByKind,
            candidateAssetsByKind,
            requiredAssetsByKind,
            { includeClientKeys: true },
          ).payload,
    list21 = Array.isArray(value36.requiredAssets) ? value36.requiredAssets : [],
    args3 = Array.isArray(value36.candidateAssets) ? value36.candidateAssets : [],
    list22 = [...list21, ...args3],
    map3 = new Map(list22.map((value37) => [normalizeText(value37?.clientKey), value37]));
  if (map3.size !== list22.length || [...map3.keys()].some((enabled4) => !enabled4))
    throw new Error('客户端紧凑资产合同包含空或重复 clientKey。');
  const required = new Set(list21.map((value38) => normalizeText(value38?.clientKey))),
    map4 = new Map();
  list20.forEach((value39, value40) => {
    const text5 = normalizeText(value39?.clientKey);
    if (!map3.has(text5))
      throw new Error(
        'Agent 紧凑结果返回了未知 clientKey：' + (text5 || '第' + (value40 + 1) + '行') + '。',
      );
    if (map4.has(text5)) throw new Error('Agent 紧凑结果重复返回 clientKey：' + text5 + '。');
    if (typeof value39?.include !== 'boolean')
      throw new Error('Agent 紧凑结果中的 ' + text5 + ' 缺少明确 include 裁决。');
    if (required.has(text5) && value39.include === false)
      throw new Error('Agent 紧凑结果试图排除必需资产 ' + text5 + '；必需资产不能排除。');
    map4.set(text5, value39);
  });
  const list23 = list22.filter((value41) => !map4.has(value41.clientKey)).map(
    (value42) => value42.clientKey,
  );
  if (list23.length)
    throw new Error('Agent 紧凑结果缺少合同裁决：' + list23.slice(0, 8).join('、') + '。');
  if (list20.length !== list22.length)
    throw new Error(
      'Agent 紧凑结果必须返回 ' + list22.length + ' 条合同裁决，实际返回 ' + list20.length + ' 条。',
    );
  const map5 = new Set(),
    decisions = list22.map((clientKey) => {
      const value43 = map4.get(clientKey.clientKey),
        kind3 = normalizeStoryAssetExtractionKind(clientKey.kind),
        name3 = normalizeText(clientKey.name),
        value44 = kind3 + ':' + name3.normalize('NFKC').toLowerCase();
      if (!kind3 || !name3)
        throw new Error('客户端紧凑资产合同 ' + clientKey.clientKey + ' 缺少 kind 或 name。');
      const include = value43.include === true,
        description = sanitizeStoryAssetPublicDescriptionText(value43.description),
        visualPrompt = sanitizeStoryAssetPublicPromptText(value43.visualPrompt),
        sanitizeStoryAssetPublicDescriptionText2 = sanitizeStoryAssetPublicDescriptionText(
          value43.voiceDescription,
        );
      if (include && !description) throw new Error('Agent 紧凑结果中的“' + name3 + '”缺少最终 description。');
      if (include && !visualPrompt)
        throw new Error('Agent 紧凑结果中的“' + name3 + '”缺少最终 visualPrompt。');
      const voiceDescription =
        include && kind3 === 'character' ? sanitizeStoryAssetPublicDescriptionText2 : '';
      if (include && kind3 !== 'character' && sanitizeStoryAssetPublicDescriptionText2)
        throw new Error('Agent 紧凑结果中的非角色资产“' + name3 + '”不得返回 voiceDescription。');
      return {
        clientKey: clientKey.clientKey,
        kind: kind3,
        name: name3,
        required: required.has(clientKey.clientKey),
        include: include,
        description: description,
        visualPrompt: visualPrompt,
        voiceDescription: voiceDescription,
        sourceSceneRefs: normalizeStringArray(clientKey.sourceSceneRefs),
        sourceChapterIds: normalizeStringArray(clientKey.sourceChapterIds),
      };
    }),
    assets3 = list22.flatMap((value45) => {
      const enabled5 = decisions.find((value46) => value46.clientKey === value45.clientKey);
      if (!enabled5?.include) return [];
      const {
          kind: kind4,
          name: name4,
          description: description2,
          visualPrompt: visualPrompt2,
          voiceDescription: voiceDescription2,
        } = enabled5,
        value47 = kind4 + ':' + name4.normalize('NFKC').toLowerCase();
      if (map5.has(value47)) throw new Error('Agent 紧凑结果返回了重复资产名称“' + name4 + '”。');
      map5.add(value47);
      const sourceChapterIds3 = normalizeStringArray(value45.sourceChapterIds).filter(
          (value48) => !chapterIds.length || chapterIds.includes(value48),
        ),
        occurrences = createStoryAssetCompactOccurrence(sourceChapterIds3),
        ref2 = normalizeStoryAssetReference(value45.clientKey, kind4 + '-asset'),
        name5 = kind4 === 'character' ? '日常形象' : kind4 === 'scene' ? '标准环境' : '标准状态';
      return [
        {
          ref: ref2,
          kind: kind4,
          name: name4,
          role:
            kind4 === 'character'
              ? ['主角', '配角', '反派', '路人'].includes(normalizeText(value45.role))
                ? normalizeText(value45.role)
                : '配角'
              : kind4 === 'scene'
                ? '剧情场景'
                : '关键道具',
          description: description2,
          voiceDescription: voiceDescription2,
          occurrences: occurrences,
          sourceChapterIds: sourceChapterIds3,
          sourceSceneRefs: normalizeStringArray(value45.sourceSceneRefs),
          appearances: [
            {
              ref: ref2 + '-base',
              name: name5,
              description: description2,
              occurrences: occurrences,
              sourceChapterIds: sourceChapterIds3,
              prompt: visualPrompt2,
            },
          ],
        },
      ];
    });
  return {
    schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
    responseSchemaVersion: STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION,
    assets: assets3,
    decisions: decisions,
  };
}
