import { normalizeStringArray, normalizeText } from '../utils/storyGenerationValues.js';
const REQUIRED_STORY_ASSET_INSTRUCTION =
    'requiredAssets 是由剧本结构确定的最低覆盖清单；每一项都必须按给定 kind 和 name 恰好返回一次，不得改名、合并或省略，同时继续从所提供的剧本证据发现清单外的必要资产。',
  CANDIDATE_STORY_ASSET_INSTRUCTION =
    'candidateAssets 只是本地召回线索，不是已确认资产或最低覆盖清单。必须逐项核验其 evidence 原文片段，只有片段明确支持且确需视觉一致性时才可返回；允许全部省略，禁止为照抄候选而创建资产。';
export const STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION = 0x2;
function normalizeStoryAssetClientKeyText(_0x1f7768 = '') {
  return normalizeText(_0x1f7768)
    ['normalize']('NFKC')
    ['replace'](/\s+/gu, '')
    ['replace'](/[^\p{L}\p{N}]+/gu, '')
    ['toLowerCase']();
}
function hashStoryAssetClientKeyText(_0x2d54b5 = '') {
  let _0x3e985d = 0x811c9dc5;
  const _0x4c32e3 = String(_0x2d54b5 || '');
  for (let _0x85a3e4 = 0x0; _0x85a3e4 < _0x4c32e3['length']; _0x85a3e4 += 0x1) {
    ((_0x3e985d ^= _0x4c32e3['charCodeAt'](_0x85a3e4)), (_0x3e985d = Math['imul'](_0x3e985d, 0x1000193)));
  }
  return (_0x3e985d >>> 0x0)['toString'](0x10)['padStart'](0x8, '0');
}
export function createStoryAssetContractClientKey({
  kind: kind = '',
  tier: tier = '',
  name: name = '',
  sourceSceneRefs: sourceSceneRefs = [],
} = {}) {
  const _0x4d70ae = normalizeText(kind),
    _0x2ee6dc = tier === 'required' ? 'required' : 'optional',
    _0x1d0427 = normalizeStoryAssetClientKeyText(name),
    _0x966d32 = normalizeStringArray(sourceSceneRefs)
      ['map'](normalizeStoryAssetClientKeyText)
      ['filter'](Boolean)
      ['sort'](),
    _0xe46b64 = '' + (_0x4d70ae[0x0] || 'a') + _0x2ee6dc[0x0] + '-';
  return (
    '' +
    _0xe46b64 +
    hashStoryAssetClientKeyText([_0x4d70ae, _0x2ee6dc, _0x1d0427, ..._0x966d32]['join']('\x00'))
  );
}
function createStoryAssetNames(_0x1eaf25, _0x4ec18f, _0x458820 = null, _0x596418 = ![]) {
  return normalizeStringArray(_0x1eaf25)['flatMap']((_0x32b776) => {
    const _0x1779d4 = Array['isArray'](_0x458820?.[_0x32b776]) ? _0x458820[_0x32b776] : [];
    return normalizeStringArray(_0x4ec18f?.[_0x32b776])['map']((_0x31ed8d) => {
      const _0x409317 = _0x1779d4['find']((_0x5bce6) => normalizeText(_0x5bce6?.['name']) === _0x31ed8d),
        _0x8b1bf0 = normalizeStringArray(_0x409317?.['sourceSceneRefs']),
        _0x1c1551 = normalizeStringArray(_0x409317?.['sourceChapterIds']),
        _0x44d3e4 = normalizeText(_0x409317?.['role']),
        _0x2064fa = normalizeText(_0x409317?.['fixedTraits']),
        _0x4b91a7 = createStoryAssetContractClientKey({
          kind: _0x32b776,
          tier: 'required',
          name: _0x31ed8d,
          sourceSceneRefs: _0x8b1bf0,
        });
      return {
        kind: _0x32b776,
        name: _0x31ed8d,
        ...(_0x596418 ? { clientKey: _0x4b91a7 } : {}),
        ...(_0x596418 && _0x8b1bf0['length'] ? { sourceSceneRefs: _0x8b1bf0 } : {}),
        ...(_0x596418 && _0x1c1551['length'] ? { sourceChapterIds: _0x1c1551 } : {}),
        ...(_0x596418 && _0x32b776 === 'character' && _0x44d3e4 ? { role: _0x44d3e4 } : {}),
        ...(_0x596418 && _0x32b776 === 'character' && _0x2064fa ? { fixedTraits: _0x2064fa } : {}),
      };
    });
  });
}
function createStoryAssetCandidates(_0xfb4525, _0x37520c, _0x369ce1 = ![]) {
  return normalizeStringArray(_0xfb4525)['flatMap']((_0x43c8b8) => {
    const _0x41e9c0 = Array['isArray'](_0x37520c?.[_0x43c8b8]) ? _0x37520c[_0x43c8b8] : [],
      _0x17dc2a = new Map();
    return (
      _0x41e9c0['forEach']((_0x5a5ab3) => {
        const _0x7a0370 = normalizeText(
          _0x5a5ab3 && typeof _0x5a5ab3 === 'object' ? _0x5a5ab3['name'] : _0x5a5ab3,
        );
        if (!_0x7a0370) return;
        const _0x11e73f = normalizeText(
            _0x5a5ab3 && typeof _0x5a5ab3 === 'object' ? _0x5a5ab3['evidence'] : '',
          ),
          _0x543a7e = normalizeStringArray(
            _0x5a5ab3 && typeof _0x5a5ab3 === 'object' ? _0x5a5ab3['sourceSceneRefs'] : [],
          )['slice'](0x0, 0x3),
          _0x2434d6 = normalizeStringArray(
            _0x5a5ab3 && typeof _0x5a5ab3 === 'object' ? _0x5a5ab3['sourceChapterIds'] : [],
          )['slice'](0x0, 0x3),
          _0x1c0c89 = {
            kind: _0x43c8b8,
            name: _0x7a0370,
            ...(_0x369ce1
              ? {
                  clientKey: createStoryAssetContractClientKey({
                    kind: _0x43c8b8,
                    tier: 'optional',
                    name: _0x7a0370,
                    sourceSceneRefs: _0x543a7e,
                  }),
                }
              : {}),
            ...(_0x11e73f ? { evidence: _0x11e73f } : {}),
            ...(_0x543a7e['length'] ? { sourceSceneRefs: _0x543a7e } : {}),
            ...(_0x2434d6['length'] ? { sourceChapterIds: _0x2434d6 } : {}),
          };
        if (!_0x17dc2a['has'](_0x7a0370)) _0x17dc2a['set'](_0x7a0370, _0x1c0c89);
      }),
      [..._0x17dc2a['values']()]
    );
  });
}
export function createStoryAssetPromptContracts(
  _0x2c4ea0 = [],
  _0x4a7e46 = null,
  _0x4b8915 = null,
  _0x385753 = null,
  { includeClientKeys: includeClientKeys = ![] } = {},
) {
  const _0x1d4cab = createStoryAssetCandidates(_0x2c4ea0, _0x4b8915, includeClientKeys),
    _0x513514 = createStoryAssetNames(_0x2c4ea0, _0x4a7e46, _0x385753, includeClientKeys);
  if (includeClientKeys) {
    const _0x3a9576 = [..._0x513514, ..._0x1d4cab]['map']((_0xefb3e4) => _0xefb3e4['clientKey']);
    if (new Set(_0x3a9576)['size'] !== _0x3a9576['length'])
      throw new Error('资产合同生成了重复\x20clientKey，已在调用\x20API\x20前安全停止。');
  }
  return {
    payload: {
      ...(_0x513514['length'] ? { requiredAssets: _0x513514 } : {}),
      ...(_0x1d4cab['length'] ? { candidateAssets: _0x1d4cab } : {}),
    },
    requirements: [
      ...(_0x513514['length'] ? [REQUIRED_STORY_ASSET_INSTRUCTION] : []),
      ...(_0x1d4cab['length'] ? [CANDIDATE_STORY_ASSET_INSTRUCTION] : []),
    ],
  };
}
export function createStoryAssetExtractionStructuredOutput({
  assetKinds: assetKinds = [],
  schema: _0xffc983,
  fallback: fallback = 'prompt',
  mode: mode = 'detailed',
} = {}) {
  const _0x3440f8 = normalizeStringArray(assetKinds);
  return {
    name:
      mode === 'compact'
        ? 'story_asset_' +
          (_0x3440f8['join']('_') || 'all') +
          '_compact_v' +
          STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION
        : 'story_asset_' + (_0x3440f8['join']('_') || 'all') + '_detailed_v2',
    schema: _0xffc983,
    strict: !![],
    fallback: fallback === 'none' ? 'none' : 'prompt',
  };
}
