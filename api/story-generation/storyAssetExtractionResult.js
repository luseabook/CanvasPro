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
export const STORY_ASSET_EXTRACTION_SCHEMA_VERSION = 0x2;
export const STORY_ASSET_EXTRACTION_KINDS = Object['freeze'](['character', 'scene', 'prop']);
const STORY_ASSET_PUBLIC_PROMPT_MAX_CHARACTERS = 0x4b0,
  STORY_ASSET_SOURCE_CHAPTER_MAX_ITEMS = 0x64;
export function mergeStoryAssetVisualPromptRepair(
  _0x443412,
  _0xf2597f,
  _0x5d2b51 = STORY_ASSET_EXTRACTION_KINDS,
) {
  const _0xd659e4 = getStoryAssetExtractionRawAssets(parseStrictJson(getResultText(_0x443412)), _0x5d2b51),
    _0x44a0d0 = getStoryAssetExtractionRawAssets(parseStrictJson(getResultText(_0xf2597f)), _0x5d2b51),
    _0x50ad8d = (_0xddddcc) => normalizeText(_0xddddcc?.['ref']) || normalizeText(_0xddddcc?.['name']);
  return {
    assets: _0xd659e4['map']((_0x32fea5) => {
      const _0x5ec281 = _0x44a0d0['filter'](
          (_0x530098) =>
            _0x50ad8d(_0x530098) === _0x50ad8d(_0x32fea5) && _0x530098['kind'] === _0x32fea5['kind'],
        ),
        _0x194808 = _0x5ec281['length'] === 0x1 ? _0x5ec281[0x0] : null;
      return {
        ..._0x32fea5,
        appearances: _0x32fea5['appearances']['map']((_0x49e4c7) => {
          if (sanitizeStoryAssetPublicPromptText(_0x49e4c7['prompt'])) return _0x49e4c7;
          const _0x106ddc = (_0x194808?.['appearances'] || [])['filter'](
            (_0x491ed6) => _0x50ad8d(_0x491ed6) === _0x50ad8d(_0x49e4c7),
          );
          return _0x106ddc['length'] === 0x1 ? { ..._0x49e4c7, prompt: _0x106ddc[0x0]['prompt'] } : _0x49e4c7;
        }),
      };
    }),
  };
}
export function normalizeStoryAssetReference(_0x6b51e6, _0x17284b) {
  return normalizeText(_0x6b51e6)['replace'](/\s+/g, '-') || _0x17284b;
}
function assertConciseStoryAssetName(_0x53d7c2, _0x412c6e) {
  const _0x27ae1f = _0x412c6e === 'character' ? 0xc : 0x14;
  if (
    [..._0x53d7c2]['length'] > _0x27ae1f ||
    /[，,。；;\n]/u['test'](_0x53d7c2) ||
    /^(?:角色名|人物名|姓名|名称)\s*[:：]/u['test'](_0x53d7c2)
  ) {
    const _0x356c42 = _0x412c6e === 'character' ? '角色' : _0x412c6e === 'prop' ? '道具' : '场景';
    throw new Error(_0x356c42 + '名称必须是姓名或简短身份名，不能包含人物说明：' + _0x53d7c2);
  }
}
function assertStoryCharacterRole(_0x932dd2) {
  if (!['主角', '配角', '反派', '路人']['includes'](normalizeText(_0x932dd2)))
    throw new Error('角色 role 只能是主角、配角、反派或路人，人物说明必须写入 description。');
}
export function createStoryAssetExtractionResponseSchema(_0x4d436e = STORY_ASSET_EXTRACTION_KINDS) {
  const _0x1db8b9 = normalizeStringArray(_0x4d436e)['filter']((_0x2891fc) =>
      STORY_ASSET_EXTRACTION_KINDS['includes'](_0x2891fc),
    ),
    _0x4878f0 = _0x1db8b9['length'] ? _0x1db8b9 : [...STORY_ASSET_EXTRACTION_KINDS],
    _0x3ea928 = { type: 'array', maxItems: STORY_ASSET_SOURCE_CHAPTER_MAX_ITEMS, items: { type: 'string' } };
  return {
    type: 'object',
    additionalProperties: ![],
    required: ['assets'],
    properties: {
      assets: {
        type: 'array',
        minItems: 0x0,
        maxItems: 0x80,
        items: {
          type: 'object',
          additionalProperties: ![],
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
            ref: { type: 'string', maxLength: 0x40 },
            kind: { type: 'string', enum: _0x4878f0 },
            name: {
              type: 'string',
              maxLength: _0x4878f0['length'] === 0x1 && _0x4878f0[0x0] === 'character' ? 0xc : 0x14,
            },
            role: { type: 'string', maxLength: 0x10 },
            description: { type: 'string', maxLength: 0x140 },
            voiceDescription: { type: 'string', maxLength: 0xf0 },
            occurrences: { type: 'string', maxLength: 0xa0 },
            sourceChapterIds: _0x3ea928,
            appearances: {
              type: 'array',
              minItems: 0x1,
              maxItems: _0x4878f0['some']((_0x1d3c61) => _0x1d3c61 === 'character' || _0x1d3c61 === 'scene')
                ? 0x4
                : 0x1,
              items: {
                type: 'object',
                additionalProperties: ![],
                required: ['ref', 'name', 'description', 'occurrences', 'sourceChapterIds', 'prompt'],
                properties: {
                  ref: { type: 'string', maxLength: 0x40 },
                  name: { type: 'string', maxLength: 0x20 },
                  description: { type: 'string', maxLength: 0x140 },
                  occurrences: { type: 'string', maxLength: 0xa0 },
                  sourceChapterIds: _0x3ea928,
                  prompt: {
                    type: 'string',
                    minLength: 0x1,
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
  _0xa23aef = STORY_ASSET_EXTRACTION_KINDS,
  _0x35a813 = [],
) {
  const _0x3e35fe = normalizeStringArray(_0xa23aef)['filter']((_0x4afd1c) =>
      STORY_ASSET_EXTRACTION_KINDS['includes'](_0x4afd1c),
    ),
    _0x51e896 = _0x3e35fe['length'] === 0x1 ? _0x3e35fe[0x0] : '',
    _0x4a8c03 = normalizeStringArray(_0x35a813),
    _0xbac5bd = _0x4a8c03['length'];
  return {
    type: 'object',
    additionalProperties: ![],
    required: ['assets'],
    properties: {
      assets: {
        type: 'array',
        minItems: _0xbac5bd,
        maxItems: _0xbac5bd,
        items: {
          type: 'object',
          additionalProperties: ![],
          required: ['clientKey', 'include', 'description', 'visualPrompt', 'voiceDescription'],
          properties: {
            clientKey: {
              type: 'string',
              maxLength: 0xc,
              ...(_0x4a8c03['length'] ? { enum: _0x4a8c03 } : {}),
            },
            include: { type: 'boolean' },
            description: { type: 'string', maxLength: 0x78 },
            visualPrompt: {
              type: 'string',
              maxLength: _0x51e896 === 'character' ? 0x168 : _0x51e896 === 'scene' ? 0x140 : 0x118,
            },
            voiceDescription: { type: 'string', maxLength: _0x51e896 === 'character' ? 0xb4 : 0x0 },
          },
        },
      },
    },
  };
}
function normalizeStoryAssetExtractionKind(_0x5d0561, _0xff3b87 = '') {
  const _0x33f2ce = normalizeText(_0x5d0561)['toLowerCase'](),
    _0x5adcb7 = {
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
  return _0x5adcb7[_0x33f2ce] || normalizeText(_0xff3b87);
}
function getStoryAssetExtractionRawAssets(_0x2a42ca, _0x1bbfd5 = STORY_ASSET_EXTRACTION_KINDS) {
  if (Array['isArray'](_0x2a42ca)) return _0x2a42ca;
  if (!_0x2a42ca || typeof _0x2a42ca !== 'object') return [];
  const _0x52f5a9 = normalizeStringArray(_0x1bbfd5)['filter']((_0x497abb) =>
      STORY_ASSET_EXTRACTION_KINDS['includes'](_0x497abb),
    ),
    _0x57d471 = _0x52f5a9['length'] === 0x1 ? _0x52f5a9[0x0] : '',
    _0x137009 = {
      character: ['characters', 'characterAssets', 'roles', '人物', '角色', '角色资产'],
      scene: ['scenes', 'sceneAssets', 'settings', 'locations', '场景', '场景资产'],
      prop: ['props', 'propAssets', 'items', 'objects', '道具', '道具资产'],
    },
    _0x400b0f = [_0x2a42ca, _0x2a42ca['result'], _0x2a42ca['data']]['filter'](
      (_0x4bf1c8) => _0x4bf1c8 && typeof _0x4bf1c8 === 'object' && !Array['isArray'](_0x4bf1c8),
    ),
    _0xd1cc31 = _0x400b0f['map']((_0x155b21) => _0x155b21['assets']),
    _0x27ecb8 = _0xd1cc31['find']((_0x61a484) => Array['isArray'](_0x61a484) && _0x61a484['length']);
  if (_0x27ecb8) return _0x27ecb8;
  const _0x1bcfa3 = [..._0x400b0f, ..._0x400b0f['map']((_0x454163) => _0x454163['assets'])]['filter'](
      (_0xaddd6c) => _0xaddd6c && typeof _0xaddd6c === 'object' && !Array['isArray'](_0xaddd6c),
    ),
    _0x1b282b = [],
    _0x17e7b1 = _0x57d471 ? [_0x57d471] : _0x52f5a9;
  for (const _0x482a41 of _0x17e7b1) {
    let _0x4cf7d4 = null;
    for (const _0x34b334 of _0x1bcfa3) {
      _0x4cf7d4 = _0x137009[_0x482a41]['map']((_0xff65f0) => _0x34b334[_0xff65f0])['find'](
        (_0x36031d) => Array['isArray'](_0x36031d) && _0x36031d['length'],
      );
      if (_0x4cf7d4) break;
    }
    if (!_0x4cf7d4) continue;
    _0x1b282b['push'](
      ..._0x4cf7d4['map']((_0x399254) =>
        _0x399254 && typeof _0x399254 === 'object' && !Array['isArray'](_0x399254)
          ? { ..._0x399254, kind: _0x399254['kind'] || _0x482a41 }
          : _0x399254,
      ),
    );
  }
  if (_0x1b282b['length']) return _0x1b282b;
  const _0x371fcd = [];
  for (const _0x2831b0 of _0x400b0f) {
    if (_0x57d471)
      for (const _0x36775c of _0x137009[_0x57d471]) {
        _0x371fcd['push'](_0x2831b0[_0x36775c]);
      }
    _0x371fcd['push'](_0x2831b0['assets']);
  }
  return (
    _0x371fcd['find']((_0x161066) => Array['isArray'](_0x161066) && _0x161066['length']) ||
    _0x371fcd['find'](Array['isArray']) ||
    []
  );
}
export function parseStoryAssetExtractionResult(
  _0x48c5ef,
  {
    chapterIds: chapterIds = [],
    allowedKinds: allowedKinds = STORY_ASSET_EXTRACTION_KINDS,
    allowEmptyResult: allowEmptyResult = ![],
  } = {},
) {
  const _0x290ef7 = parseStrictJson(getResultText(_0x48c5ef), 'Agent 未返回资产提取结果。'),
    _0x34f15c = new Set(normalizeStringArray(chapterIds)),
    _0x50c8d4 = normalizeStringArray(allowedKinds)['filter']((_0x4e9437) =>
      STORY_ASSET_EXTRACTION_KINDS['includes'](_0x4e9437),
    ),
    _0x2089a9 = new Set(_0x50c8d4),
    _0x462cc8 = _0x50c8d4['length'] === 0x1 ? _0x50c8d4[0x0] : '',
    _0x3a0ac1 = getStoryAssetExtractionRawAssets(_0x290ef7, _0x50c8d4),
    _0x5ec724 = Array['isArray'](_0x3a0ac1)
      ? _0x3a0ac1['map']((_0x1bda4a, _0x8d9a1c) => {
          const _0x226626 = normalizeStoryAssetExtractionKind(_0x1bda4a?.['kind'], _0x462cc8),
            _0x5f6823 = normalizeText(
              _0x1bda4a?.['name'] ||
                _0x1bda4a?.['characterName'] ||
                _0x1bda4a?.['sceneName'] ||
                _0x1bda4a?.['propName'] ||
                _0x1bda4a?.['名称'] ||
                _0x1bda4a?.['角色名'] ||
                _0x1bda4a?.['场景名'] ||
                _0x1bda4a?.['道具名'],
            );
          if (!_0x5f6823 || !STORY_ASSET_EXTRACTION_KINDS['includes'](_0x226626)) return null;
          if (_0x2089a9['size'] && !_0x2089a9['has'](_0x226626))
            throw new Error('Agent 在本轮返回了未请求的资产类型“' + _0x226626 + '”。');
          assertConciseStoryAssetName(_0x5f6823, _0x226626);
          if (_0x226626 === 'character') assertStoryCharacterRole(_0x1bda4a?.['role']);
          const _0x229b1c = _0x226626 === 'character' ? normalizeText(_0x1bda4a?.['voiceDescription']) : '',
            _0x1ac65f = normalizeStoryAssetReference(_0x1bda4a?.['ref'], 'asset-' + (_0x8d9a1c + 0x1)),
            _0x3150d4 = normalizeStringArray(_0x1bda4a?.['sourceChapterIds']);
          if (_0x34f15c['size']) {
            const _0x46f0b2 = _0x3150d4['filter']((_0x5e059e) => !_0x34f15c['has'](_0x5e059e));
            if (_0x46f0b2['length'])
              throw new Error('资产“' + _0x5f6823 + '”引用了不存在的章节：' + _0x46f0b2['join']('、') + '。');
          }
          const _0x57ad85 = Array['isArray'](_0x1bda4a?.['appearances']) ? _0x1bda4a['appearances'] : [];
          if (!_0x57ad85['length']) throw new Error('资产“' + _0x5f6823 + '”缺少形象和图片提示词。');
          const _0x23a5cf =
              _0x226626 === 'prop' && _0x57ad85['length'] > 0x1
                ? [
                    {
                      ref: _0x1ac65f + '-base',
                      name: '基础形象',
                      description: normalizeStringArray(
                        _0x57ad85['map']((_0x143933) => {
                          const _0x3643fc = normalizeText(_0x143933?.['name']),
                            _0x303a4b = normalizeText(_0x143933?.['description']);
                          if (_0x3643fc && _0x303a4b) return _0x3643fc + '：' + _0x303a4b;
                          return _0x303a4b || _0x3643fc;
                        }),
                      )['join']('；'),
                      occurrences:
                        normalizeStringArray(
                          _0x57ad85['map']((_0x2d5e1c) => normalizeText(_0x2d5e1c?.['occurrences'])),
                        )['join']('、') || _0x1bda4a?.['occurrences'],
                      sourceChapterIds: normalizeStringArray(
                        _0x57ad85['flatMap']((_0x3475d4) =>
                          Array['isArray'](_0x3475d4?.['sourceChapterIds'])
                            ? _0x3475d4['sourceChapterIds']
                            : [],
                        ),
                      )['length']
                        ? normalizeStringArray(
                            _0x57ad85['flatMap']((_0x1a6ef9) => _0x1a6ef9['sourceChapterIds']),
                          )
                        : _0x3150d4,
                      prompt: _0x57ad85['map']((_0x218918) => normalizeText(_0x218918?.['prompt']))['find'](
                        Boolean,
                      ),
                    },
                  ]
                : _0x57ad85,
            _0x282f73 = _0x23a5cf['map']((_0x57c308, _0x3f4d88) => {
              const _0x18d378 = normalizeText(_0x57c308?.['name']);
              if (!_0x18d378)
                throw new Error(
                  '资产“' + _0x5f6823 + '”的第\x20' + (_0x3f4d88 + 0x1) + ' 个形象缺少具体形象名称。',
                );
              return {
                ref: normalizeStoryAssetReference(
                  _0x57c308?.['ref'],
                  _0x1ac65f + '-appearance-' + (_0x3f4d88 + 0x1),
                ),
                name: _0x18d378,
                description: sanitizeStoryAssetPublicDescriptionText(_0x57c308?.['description']),
                occurrences: sanitizeStoryAssetPublicDescriptionText(
                  _0x57c308?.['occurrences'] || _0x1bda4a?.['occurrences'],
                ),
                sourceChapterIds: normalizeStringArray(
                  _0x57c308?.['sourceChapterIds']?.['length'] ? _0x57c308['sourceChapterIds'] : _0x3150d4,
                ),
                prompt: sanitizeStoryAssetPublicPromptText(_0x57c308?.['prompt']),
              };
            });
          if (_0x282f73['some']((_0x336501) => !_0x336501['prompt'])) {
            const _0x7c4d03 = new Error('资产“' + _0x5f6823 + '”存在缺少图片提示词的形象。');
            _0x7c4d03['code'] = 'STORY_ASSET_VISUAL_PROMPT_MISSING';
            throw _0x7c4d03;
          }
          for (const _0x248f18 of _0x282f73) {
            if (!_0x34f15c['size']) continue;
            const _0x191925 = _0x248f18['sourceChapterIds']['filter'](
              (_0x3f3aea) => !_0x34f15c['has'](_0x3f3aea),
            );
            if (_0x191925['length'])
              throw new Error(
                '资产“' + _0x5f6823 + '”的形象引用了不存在的章节：' + _0x191925['join']('、') + '。',
              );
          }
          return {
            ref: _0x1ac65f,
            kind: _0x226626,
            name: _0x5f6823,
            role: normalizeText(_0x1bda4a?.['role']),
            description: sanitizeStoryAssetPublicDescriptionText(_0x1bda4a?.['description']),
            voiceDescription: sanitizeStoryAssetPublicDescriptionText(_0x229b1c),
            occurrences: sanitizeStoryAssetPublicDescriptionText(_0x1bda4a?.['occurrences']),
            sourceChapterIds: _0x3150d4,
            appearances: _0x282f73,
          };
        })['filter'](Boolean)
      : [],
    _0x3d6b87 = Boolean(allowEmptyResult) || (_0x50c8d4['length'] === 0x1 && _0x50c8d4[0x0] === 'prop');
  if (!_0x5ec724['length'] && !_0x3d6b87) {
    const _0x17d0d2 =
        _0x290ef7 && typeof _0x290ef7 === 'object' && !Array['isArray'](_0x290ef7)
          ? Object['keys'](_0x290ef7)['slice'](0x0, 0xc)
          : [],
      _0x2b389b =
        _0x50c8d4['length'] === 0x1
          ? { character: '角色', scene: '场景', prop: '道具' }[_0x50c8d4[0x0]] || '资产'
          : '角色或场景',
      _0x2835bf = new Error('Agent 返回结果没有可用的' + _0x2b389b + '资产。');
    _0x2835bf['raw'] = {
      allowedKinds: _0x50c8d4,
      topLevelKeys: _0x17d0d2,
      returnedAssetCount: _0x3a0ac1['length'],
    };
    throw _0x2835bf;
  }
  const _0xf43ab0 = _0x5ec724['map']((_0x21e1f6) => _0x21e1f6['ref']);
  if (new Set(_0xf43ab0)['size'] !== _0xf43ab0['length']) throw new Error('Agent 返回了重复的资产引用。');
  return { schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION, assets: _0x5ec724 };
}
function createStoryAssetCompactOccurrence(_0x483ccd = []) {
  const _0x5b6198 = normalizeStringArray(_0x483ccd)
    ['map']((_0x2a141e) => {
      const _0x39a245 = normalizeText(_0x2a141e)['match'](/(\d+)\s*$/u)?.[0x1];
      return (
        _0x39a245 ||
        normalizeText(_0x2a141e)
          ['replace'](/^episode[-_\s]*/iu, '')
          ['replace'](/^chapter[-_\s]*/iu, '')
      );
    })
    ['filter'](Boolean);
  return '第' + (_0x5b6198['join']('、') || '相关') + '集';
}
export function parseStoryAssetCompactExtractionResult(
  _0x309ccd,
  {
    assetKinds: assetKinds = STORY_ASSET_EXTRACTION_KINDS,
    chapterIds: chapterIds = [],
    requiredAssetNamesByKind: requiredAssetNamesByKind = null,
    requiredAssetsByKind: requiredAssetsByKind = null,
    candidateAssetsByKind: candidateAssetsByKind = null,
    contractSnapshot: contractSnapshot = null,
  } = {},
) {
  const _0x4b4717 = parseStrictJson(getResultText(_0x309ccd), 'Agent\x20未返回紧凑资产结果。'),
    _0x3775f4 = Array['isArray'](_0x4b4717?.['assets']) ? _0x4b4717['assets'] : [],
    _0x211a28 =
      contractSnapshot &&
      typeof contractSnapshot === 'object' &&
      Number(contractSnapshot['responseSchemaVersion']) === STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION
        ? {
            requiredAssets: Array['isArray'](contractSnapshot['requiredAssets'])
              ? contractSnapshot['requiredAssets']
              : [],
            candidateAssets: Array['isArray'](contractSnapshot['candidateAssets'])
              ? contractSnapshot['candidateAssets']
              : [],
          }
        : createStoryAssetPromptContracts(
            assetKinds,
            requiredAssetNamesByKind,
            candidateAssetsByKind,
            requiredAssetsByKind,
            { includeClientKeys: !![] },
          )['payload'],
    _0x5d77dc = Array['isArray'](_0x211a28['requiredAssets']) ? _0x211a28['requiredAssets'] : [],
    _0x3049a3 = Array['isArray'](_0x211a28['candidateAssets']) ? _0x211a28['candidateAssets'] : [],
    _0x31135f = [..._0x5d77dc, ..._0x3049a3],
    _0x1ec81b = new Map(
      _0x31135f['map']((_0x5a1272) => [normalizeText(_0x5a1272?.['clientKey']), _0x5a1272]),
    );
  if (
    _0x1ec81b['size'] !== _0x31135f['length'] ||
    [..._0x1ec81b['keys']()]['some']((_0x57bf6e) => !_0x57bf6e)
  )
    throw new Error('客户端紧凑资产合同包含空或重复\x20clientKey。');
  const _0x230106 = new Set(_0x5d77dc['map']((_0x354138) => normalizeText(_0x354138?.['clientKey']))),
    _0x10f980 = new Map();
  _0x3775f4['forEach']((_0x4c2b20, _0x3cd25b) => {
    const _0x53190a = normalizeText(_0x4c2b20?.['clientKey']);
    if (!_0x1ec81b['has'](_0x53190a))
      throw new Error(
        'Agent 紧凑结果返回了未知 clientKey：' + (_0x53190a || '第' + (_0x3cd25b + 0x1) + '行') + '。',
      );
    if (_0x10f980['has'](_0x53190a))
      throw new Error('Agent\x20紧凑结果重复返回\x20clientKey：' + _0x53190a + '。');
    if (typeof _0x4c2b20?.['include'] !== 'boolean')
      throw new Error('Agent\x20紧凑结果中的\x20' + _0x53190a + ' 缺少明确 include 裁决。');
    if (_0x230106['has'](_0x53190a) && _0x4c2b20['include'] === ![])
      throw new Error('Agent 紧凑结果试图排除必需资产 ' + _0x53190a + '；必需资产不能排除。');
    _0x10f980['set'](_0x53190a, _0x4c2b20);
  });
  const _0x160b0e = _0x31135f['filter']((_0x4d6885) => !_0x10f980['has'](_0x4d6885['clientKey']))['map'](
    (_0x258ba8) => _0x258ba8['clientKey'],
  );
  if (_0x160b0e['length'])
    throw new Error('Agent 紧凑结果缺少合同裁决：' + _0x160b0e['slice'](0x0, 0x8)['join']('、') + '。');
  if (_0x3775f4['length'] !== _0x31135f['length'])
    throw new Error(
      'Agent 紧凑结果必须返回 ' +
        _0x31135f['length'] +
        ' 条合同裁决，实际返回 ' +
        _0x3775f4['length'] +
        ' 条。',
    );
  const _0x146710 = new Set(),
    _0x11885e = _0x31135f['map']((_0x46904a) => {
      const _0x3fce50 = _0x10f980['get'](_0x46904a['clientKey']),
        _0x57426d = normalizeStoryAssetExtractionKind(_0x46904a['kind']),
        _0x271c39 = normalizeText(_0x46904a['name']),
        _0x1f8c8f = _0x57426d + ':' + _0x271c39['normalize']('NFKC')['toLowerCase']();
      if (!_0x57426d || !_0x271c39)
        throw new Error('客户端紧凑资产合同 ' + _0x46904a['clientKey'] + '\x20缺少\x20kind\x20或\x20name。');
      const _0x450f86 = _0x3fce50['include'] === !![],
        _0x57f89b = sanitizeStoryAssetPublicDescriptionText(_0x3fce50['description']),
        _0x2d8da9 = sanitizeStoryAssetPublicPromptText(_0x3fce50['visualPrompt']),
        _0x469812 = sanitizeStoryAssetPublicDescriptionText(_0x3fce50['voiceDescription']);
      if (_0x450f86 && !_0x57f89b)
        throw new Error('Agent 紧凑结果中的“' + _0x271c39 + '”缺少最终 description。');
      if (_0x450f86 && !_0x2d8da9)
        throw new Error('Agent 紧凑结果中的“' + _0x271c39 + '”缺少最终 visualPrompt。');
      const _0x1c5520 = _0x450f86 && _0x57426d === 'character' ? _0x469812 : '';
      if (_0x450f86 && _0x57426d !== 'character' && _0x469812)
        throw new Error('Agent 紧凑结果中的非角色资产“' + _0x271c39 + '”不得返回 voiceDescription。');
      return {
        clientKey: _0x46904a['clientKey'],
        kind: _0x57426d,
        name: _0x271c39,
        required: _0x230106['has'](_0x46904a['clientKey']),
        include: _0x450f86,
        description: _0x57f89b,
        visualPrompt: _0x2d8da9,
        voiceDescription: _0x1c5520,
        sourceSceneRefs: normalizeStringArray(_0x46904a['sourceSceneRefs']),
        sourceChapterIds: normalizeStringArray(_0x46904a['sourceChapterIds']),
      };
    }),
    _0x57c7c3 = _0x31135f['flatMap']((_0xda8d19) => {
      const _0x205cdc = _0x11885e['find']((_0x4343ca) => _0x4343ca['clientKey'] === _0xda8d19['clientKey']);
      if (!_0x205cdc?.['include']) return [];
      const {
          kind: _0x2551a7,
          name: _0x2f6db1,
          description: _0x84715e,
          visualPrompt: _0x4853cc,
          voiceDescription: _0x50c4ac,
        } = _0x205cdc,
        _0x1eddb8 = _0x2551a7 + ':' + _0x2f6db1['normalize']('NFKC')['toLowerCase']();
      if (_0x146710['has'](_0x1eddb8))
        throw new Error('Agent 紧凑结果返回了重复资产名称“' + _0x2f6db1 + '”。');
      _0x146710['add'](_0x1eddb8);
      const _0x334043 = normalizeStringArray(_0xda8d19['sourceChapterIds'])['filter'](
          (_0x336317) => !chapterIds['length'] || chapterIds['includes'](_0x336317),
        ),
        _0xbb89b9 = createStoryAssetCompactOccurrence(_0x334043),
        _0x33cbc4 = normalizeStoryAssetReference(_0xda8d19['clientKey'], _0x2551a7 + '-asset'),
        _0x48e323 = _0x2551a7 === 'character' ? '日常形象' : _0x2551a7 === 'scene' ? '标准环境' : '标准状态';
      return [
        {
          ref: _0x33cbc4,
          kind: _0x2551a7,
          name: _0x2f6db1,
          role:
            _0x2551a7 === 'character'
              ? ['主角', '配角', '反派', '路人']['includes'](normalizeText(_0xda8d19['role']))
                ? normalizeText(_0xda8d19['role'])
                : '配角'
              : _0x2551a7 === 'scene'
                ? '剧情场景'
                : '关键道具',
          description: _0x84715e,
          voiceDescription: _0x50c4ac,
          occurrences: _0xbb89b9,
          sourceChapterIds: _0x334043,
          sourceSceneRefs: normalizeStringArray(_0xda8d19['sourceSceneRefs']),
          appearances: [
            {
              ref: _0x33cbc4 + '-base',
              name: _0x48e323,
              description: _0x84715e,
              occurrences: _0xbb89b9,
              sourceChapterIds: _0x334043,
              prompt: _0x4853cc,
            },
          ],
        },
      ];
    });
  return {
    schemaVersion: STORY_ASSET_EXTRACTION_SCHEMA_VERSION,
    responseSchemaVersion: STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION,
    assets: _0x57c7c3,
    decisions: _0x11885e,
  };
}
