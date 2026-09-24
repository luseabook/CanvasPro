import {
  getHardRequiredStoryAssetNamesForScene,
  getHardRequiredStorySceneRefs,
} from './storyAssetRequirementEvidence.js';
import { createStoryAssetPromptContracts } from './storyAssetExtractionRequest.js';
import { stripStoryAssetInternalEvidenceMetadata } from '../utils/storyAssetPublicText.js';
export const STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS = 0x2ee0;
export const STORY_ASSET_CANDIDATE_MAX_ITEMS_PER_KIND = 0x40;
export const STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND = 0x1f40;
export const STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS = 0x4000;
const STORY_ASSET_OUTPUT_BASE_TOKENS = 0x300,
  STORY_ASSET_OUTPUT_TOKENS_PER_REQUIRED = Object['freeze']({ character: 0x2d0, scene: 0x1e0, prop: 0x1a4 }),
  STORY_ASSET_VERBOSE_OUTPUT_SAFE_RATIO = 0.8,
  STORY_ASSET_VERBOSE_MAX_ITEMS_PER_KIND = 0x10,
  STORY_ASSET_COMPACT_OUTPUT_SAFE_RATIO = 0.8,
  STORY_ASSET_COMPACT_OUTPUT_BASE_TOKENS = 0x80,
  STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET = Object['freeze']({
    character: 0x300,
    scene: 0x240,
    prop: 0x200,
  });
function cloneValue(_0x4da190) {
  if (!_0x4da190 || typeof _0x4da190 !== 'object') return _0x4da190;
  try {
    return JSON['parse'](JSON['stringify'](_0x4da190));
  } catch {
    return _0x4da190;
  }
}
function normalizeText(_0x5d578a) {
  return typeof _0x5d578a === 'string' ? _0x5d578a['trim']() : '';
}
function selectFairStoryAssetCandidateSubset(_0xc6e26f = [], _0x3ba1ce = 0x0) {
  const _0x45574f = Array['isArray'](_0xc6e26f) ? _0xc6e26f : [],
    _0x1f8b84 = Math['max'](0x0, Math['trunc'](Number(_0x3ba1ce) || 0x0));
  if (_0x45574f['length'] <= _0x1f8b84) return _0x45574f;
  if (!_0x1f8b84) return [];
  const _0x189d2e = [],
    _0x5e1f9b = new Set(),
    _0x498371 = (_0x1bd07d) => {
      const _0x1df75a = Math['max'](0x0, Math['min'](_0x45574f['length'] - 0x1, Math['trunc'](_0x1bd07d)));
      if (_0x5e1f9b['has'](_0x1df75a) || _0x189d2e['length'] >= _0x1f8b84) return;
      (_0x5e1f9b['add'](_0x1df75a), _0x189d2e['push'](_0x1df75a));
    };
  (_0x498371(0x0),
    _0x498371(Math['floor']((_0x45574f['length'] - 0x1) / 0x2)),
    _0x498371(_0x45574f['length'] - 0x1));
  while (_0x189d2e['length'] < _0x1f8b84) {
    let _0x28bb8f = -0x1,
      _0x5dcbcd = -0x1;
    for (let _0x4705e0 = 0x0; _0x4705e0 < _0x45574f['length']; _0x4705e0 += 0x1) {
      if (_0x5e1f9b['has'](_0x4705e0)) continue;
      const _0x15f4bc = Math['min'](..._0x189d2e['map']((_0x3cb855) => Math['abs'](_0x3cb855 - _0x4705e0)));
      _0x15f4bc > _0x5dcbcd && ((_0x28bb8f = _0x4705e0), (_0x5dcbcd = _0x15f4bc));
    }
    _0x498371(_0x28bb8f);
  }
  return _0x189d2e['map']((_0x83cab9) => _0x45574f[_0x83cab9]);
}
function selectFairCompactCandidatesWithinSerializedBudget(
  _0x2bf0cb,
  _0x570215 = [],
  _0x4409d5 = Number['POSITIVE_INFINITY'],
  _0x5282f3 = STORY_ASSET_CANDIDATE_MAX_CHARACTERS_PER_KIND,
) {
  const _0x25f513 = Array['isArray'](_0x570215) ? _0x570215 : [],
    _0x1f487f = Number['isFinite'](Number(_0x4409d5))
      ? Math['max'](0x0, Math['min'](_0x25f513['length'], Math['trunc'](Number(_0x4409d5) || 0x0)))
      : _0x25f513['length'],
    _0x3e8a1f = Math['max'](0x0, Math['trunc'](Number(_0x5282f3) || 0x0));
  for (let _0x453786 = _0x1f487f; _0x453786 >= 0x0; _0x453786 -= 0x1) {
    const _0x1c453a = selectFairStoryAssetCandidateSubset(_0x25f513, _0x453786),
      _0x5bface = createStoryAssetPromptContracts([_0x2bf0cb], null, { [_0x2bf0cb]: _0x1c453a }, null, {
        includeClientKeys: !![],
      })['payload'];
    if (JSON['stringify'](_0x5bface['candidateAssets'] || [])['length'] <= _0x3e8a1f) return _0x1c453a;
  }
  return [];
}
function sampleTextAcrossValue(_0x162b5e = '', _0x44d2cc = 0x0) {
  const _0x1fe668 = normalizeText(_0x162b5e),
    _0x23a7f1 = Math['max'](0x0, Math['trunc'](Number(_0x44d2cc) || 0x0));
  if (!_0x23a7f1 || !_0x1fe668) return '';
  if (_0x1fe668['length'] <= _0x23a7f1) return _0x1fe668;
  if (_0x23a7f1 < 0xc) return _0x1fe668['slice'](0x0, _0x23a7f1);
  const _0x1e5308 = '\n…\n',
    _0x26627d = _0x23a7f1 - _0x1e5308['length'] * 0x2,
    _0x1108ee = Math['ceil'](_0x26627d / 0x3),
    _0x365f63 = Math['floor'](_0x26627d / 0x3),
    _0xd30d2e = Math['max'](0x1, _0x26627d - _0x1108ee - _0x365f63),
    _0x470268 = Math['max'](_0x1108ee, Math['floor']((_0x1fe668['length'] - _0x365f63) / 0x2));
  return [
    _0x1fe668['slice'](0x0, _0x1108ee),
    _0x1fe668['slice'](_0x470268, _0x470268 + _0x365f63),
    _0x1fe668['slice'](-_0xd30d2e),
  ]
    ['join'](_0x1e5308)
    ['slice'](0x0, _0x23a7f1);
}
function allocateFairStoryEvidenceCharacters(_0x4e6489 = [], _0x4130ca = 0x0) {
  const _0x5bf589 = _0x4e6489['map']((_0x529c00) => normalizeText(_0x529c00)['length']),
    _0x87229c = _0x5bf589['map'](() => 0x0);
  let _0x2f6c32 = Math['max'](0x0, Math['trunc'](Number(_0x4130ca) || 0x0)),
    _0x2da0be = _0x5bf589['map']((_0x40a784, _0x8fb7bb) => ({ index: _0x8fb7bb, length: _0x40a784 }))[
      'filter'
    ](({ length: _0x509514 }) => _0x509514 > 0x0);
  while (_0x2f6c32 > 0x0 && _0x2da0be['length']) {
    const _0xf3067c = Math['max'](0x1, Math['floor'](_0x2f6c32 / _0x2da0be['length'])),
      _0xe3599e = [];
    for (const _0x3bb3f9 of _0x2da0be) {
      if (_0x2f6c32 <= 0x0) break;
      const _0xdad6fc = _0x3bb3f9['length'] - _0x87229c[_0x3bb3f9['index']],
        _0x52eee1 = Math['min'](_0xdad6fc, _0xf3067c, _0x2f6c32);
      ((_0x87229c[_0x3bb3f9['index']] += _0x52eee1), (_0x2f6c32 -= _0x52eee1));
      if (_0x87229c[_0x3bb3f9['index']] < _0x3bb3f9['length']) _0xe3599e['push'](_0x3bb3f9);
    }
    _0x2da0be = _0xe3599e;
  }
  return _0x87229c;
}
export function createBudgetedStoryAssetEvidenceProject(
  _0x10b5d2 = {},
  _0x3a265a = [],
  {
    requirementEvidence: requirementEvidence = null,
    includeAllSceneHeadings: includeAllSceneHeadings = ![],
    includeAllSceneCharacters: includeAllSceneCharacters = ![],
    bodyCharacterBudget: bodyCharacterBudget = STORY_ASSET_EVIDENCE_BODY_MAX_CHARACTERS,
  } = {},
) {
  const _0x779a19 = Array['isArray'](_0x3a265a) ? _0x3a265a : [],
    _0x2c21aa = new Set(getHardRequiredStorySceneRefs(requirementEvidence || {})),
    _0x3111e8 = _0x779a19['map']((_0x322104) => stripStoryAssetInternalEvidenceMetadata(_0x322104?.['body'])),
    _0x21d085 = allocateFairStoryEvidenceCharacters(_0x3111e8, bodyCharacterBudget),
    _0x1eccf0 = new Map();
  _0x779a19['forEach']((_0x5b5314, _0x227128) => {
    _0x1eccf0['set'](
      normalizeText(_0x5b5314?.['ref']),
      sampleTextAcrossValue(_0x3111e8[_0x227128], _0x21d085[_0x227128]),
    );
  });
  const _0x89157f = new Map();
  return (
    _0x779a19['forEach']((_0x44851a) => {
      const _0x2528d8 = normalizeText(_0x44851a?.['episodeRef']);
      if (!_0x2528d8) return;
      const _0x5063a6 = _0x89157f['get'](_0x2528d8) || [];
      (_0x5063a6['push'](_0x44851a), _0x89157f['set'](_0x2528d8, _0x5063a6));
    }),
    {
      ...cloneValue(_0x10b5d2),
      chapters: (Array['isArray'](_0x10b5d2?.['chapters']) ? _0x10b5d2['chapters'] : [])['map'](
        (_0x4fc6b5) => {
          const _0x3fec0d = _0x89157f['get'](normalizeText(_0x4fc6b5?.['id'])) || [];
          return {
            ..._0x4fc6b5,
            content: _0x3fec0d['map']((_0x5a5a7a) => {
              const _0x10107d = normalizeText(_0x5a5a7a?.['ref']),
                _0x59ed5a = includeAllSceneCharacters
                  ? Array['isArray'](_0x5a5a7a?.['characters'])
                    ? _0x5a5a7a['characters']
                    : []
                  : getHardRequiredStoryAssetNamesForScene(requirementEvidence || {}, 'character', _0x10107d);
              return [
                includeAllSceneHeadings || _0x2c21aa['has'](_0x10107d)
                  ? '场景：' + normalizeText(_0x5a5a7a?.['heading'])
                  : '',
                _0x59ed5a['length'] ? '已知出场角色：' + _0x59ed5a['join']('、') : '',
                _0x1eccf0['get'](_0x10107d) || '',
              ]
                ['filter'](Boolean)
                ['join']('\x0a');
            })['join']('\x0a\x0a'),
          };
        },
      ),
    }
  );
}
function updateFingerprint(_0x2eaccf, _0x2f6431) {
  const _0x43cde8 = String(_0x2f6431 ?? '');
  let _0x4d9208 = _0x2eaccf >>> 0x0;
  for (let _0x13e2ad = 0x0; _0x13e2ad < _0x43cde8['length']; _0x13e2ad += 0x1) {
    ((_0x4d9208 ^= _0x43cde8['charCodeAt'](_0x13e2ad)), (_0x4d9208 = Math['imul'](_0x4d9208, 0x1000193)));
  }
  return _0x4d9208 >>> 0x0;
}
export function createStoryAssetAuthoritativeSourceFingerprint(_0x2d7be3 = []) {
  const _0x2fe2d9 = Array['isArray'](_0x2d7be3) ? _0x2d7be3 : [];
  let _0x4c4e39 = 0x811c9dc5,
    _0x298ad5 = 0x0;
  return (
    _0x2fe2d9['forEach']((_0x347b25) => {
      [
        _0x347b25?.['ref'],
        _0x347b25?.['episodeRef'],
        _0x347b25?.['source'],
        _0x347b25?.['heading'],
        ...(Array['isArray'](_0x347b25?.['characters']) ? _0x347b25['characters'] : []),
        _0x347b25?.['body'],
      ]['forEach']((_0x78d957) => {
        const _0x5d2573 = String(_0x78d957 ?? '');
        ((_0x298ad5 += _0x5d2573['length']),
          (_0x4c4e39 = updateFingerprint(_0x4c4e39, _0x5d2573)),
          (_0x4c4e39 = updateFingerprint(_0x4c4e39, '\x00')));
      });
    }),
    'source-v1-' + _0x2fe2d9['length'] + '-' + _0x298ad5 + '-' + _0x4c4e39['toString'](0x10)
  );
}
export function estimateStoryAssetFocusedOutputTokens({
  kind: kind = '',
  requiredAssetCount: requiredAssetCount = 0x0,
  candidateAssetCount: candidateAssetCount = 0x0,
} = {}) {
  const _0x2557ec =
    STORY_ASSET_OUTPUT_TOKENS_PER_REQUIRED[kind] || STORY_ASSET_OUTPUT_TOKENS_PER_REQUIRED['scene'];
  return (
    STORY_ASSET_OUTPUT_BASE_TOKENS +
    Math['max'](0x0, Math['trunc'](Number(requiredAssetCount) || 0x0)) * _0x2557ec +
    Math['max'](0x0, Math['trunc'](Number(candidateAssetCount) || 0x0)) * _0x2557ec
  );
}
export function estimateStoryAssetCompactOutputTokens({
  kind: kind = '',
  requiredAssetCount: requiredAssetCount = 0x0,
  candidateAssetCount: candidateAssetCount = 0x0,
} = {}) {
  const _0x386c74 =
    STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET[kind] || STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET['scene'];
  return (
    STORY_ASSET_COMPACT_OUTPUT_BASE_TOKENS +
    (Math['max'](0x0, Math['trunc'](Number(requiredAssetCount) || 0x0)) +
      Math['max'](0x0, Math['trunc'](Number(candidateAssetCount) || 0x0))) *
      _0x386c74
  );
}
export function resolveStoryAssetFocusedOutputMode({
  requiredAssetNamesByKind: requiredAssetNamesByKind = {},
  candidateAssetsByKind: candidateAssetsByKind = {},
  maxOutputTokens: maxOutputTokens = STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
} = {}) {
  const _0x3c8f83 = Math['max'](0x1, Math['trunc'](Number(maxOutputTokens) || 0x0)),
    _0x183ca6 = Math['max'](0x1, Math['floor'](_0x3c8f83 * STORY_ASSET_VERBOSE_OUTPUT_SAFE_RATIO)),
    _0x31318e = Math['max'](0x1, Math['floor'](_0x3c8f83 * STORY_ASSET_COMPACT_OUTPUT_SAFE_RATIO)),
    _0x2d862b = Object['fromEntries'](
      ['character', 'scene', 'prop']['map']((_0x1a8584) => {
        const _0x1378d1 = (_0x543b38) =>
            normalizeText(_0x543b38)
              ['normalize']('NFKC')
              ['replace'](/[^\p{L}\p{N}]+/gu, '')
              ['toLowerCase'](),
          _0x39148e = new Set(
            (Array['isArray'](requiredAssetNamesByKind?.[_0x1a8584])
              ? requiredAssetNamesByKind[_0x1a8584]
              : [])
              ['map'](_0x1378d1)
              ['filter'](Boolean),
          ),
          _0x2a1828 = new Set(),
          _0x199350 = (
            Array['isArray'](candidateAssetsByKind?.[_0x1a8584]) ? candidateAssetsByKind[_0x1a8584] : []
          )['filter']((_0x5cc5dc) => {
            const _0x1b3516 = _0x1378d1(
              _0x5cc5dc && typeof _0x5cc5dc === 'object' ? _0x5cc5dc['name'] : _0x5cc5dc,
            );
            if (!_0x1b3516 || _0x39148e['has'](_0x1b3516) || _0x2a1828['has'](_0x1b3516)) return ![];
            return (_0x2a1828['add'](_0x1b3516), !![]);
          });
        return [_0x1a8584, _0x199350];
      }),
    ),
    _0x599b9b = ['character', 'scene', 'prop']['map']((_0x16e6d1) => {
      const _0x23ea18 = Array['isArray'](requiredAssetNamesByKind?.[_0x16e6d1])
          ? requiredAssetNamesByKind[_0x16e6d1]['length']
          : 0x0,
        _0x40cfa4 = Array['isArray'](_0x2d862b?.[_0x16e6d1]) ? _0x2d862b[_0x16e6d1]['length'] : 0x0;
      return {
        kind: _0x16e6d1,
        requiredAssetCount: _0x23ea18,
        candidateAssetCount: _0x40cfa4,
        verboseOutputTokens: estimateStoryAssetFocusedOutputTokens({
          kind: _0x16e6d1,
          requiredAssetCount: _0x23ea18,
          candidateAssetCount: _0x40cfa4,
        }),
        compactOutputTokens: estimateStoryAssetCompactOutputTokens({
          kind: _0x16e6d1,
          requiredAssetCount: _0x23ea18,
          candidateAssetCount: _0x40cfa4,
        }),
      };
    }),
    _0x4a8e2d = {},
    _0x89d686 = {},
    _0x46f0d4 = _0x599b9b['map']((_0x1e5483) => {
      const _0xbc1389 = _0x1e5483['requiredAssetCount'] + _0x1e5483['candidateAssetCount'];
      if (
        _0xbc1389 <= STORY_ASSET_VERBOSE_MAX_ITEMS_PER_KIND &&
        _0x1e5483['verboseOutputTokens'] <= _0x183ca6
      )
        return (
          (_0x89d686[_0x1e5483['kind']] = 'verbose'),
          (_0x4a8e2d[_0x1e5483['kind']] = _0x2d862b[_0x1e5483['kind']]),
          { ..._0x1e5483, mode: 'verbose', selectedCandidateAssetCount: _0x1e5483['candidateAssetCount'] }
        );
      const _0x1aa7a1 = STORY_ASSET_COMPACT_OUTPUT_TOKENS_PER_ASSET[_0x1e5483['kind']],
        _0x21e675 = Math['max'](
          0x0,
          Math['floor']((_0x31318e - STORY_ASSET_COMPACT_OUTPUT_BASE_TOKENS) / _0x1aa7a1),
        ),
        _0x23d346 = Math['max'](0x0, _0x21e675 - _0x1e5483['requiredAssetCount']);
      _0x4a8e2d[_0x1e5483['kind']] = selectFairCompactCandidatesWithinSerializedBudget(
        _0x1e5483['kind'],
        Array['isArray'](_0x2d862b?.[_0x1e5483['kind']]) ? _0x2d862b[_0x1e5483['kind']] : [],
        _0x23d346,
      );
      const _0x1c9c35 = _0x4a8e2d[_0x1e5483['kind']]['length'],
        _0x1ce7ed = estimateStoryAssetCompactOutputTokens({
          kind: _0x1e5483['kind'],
          requiredAssetCount: _0x1e5483['requiredAssetCount'],
          candidateAssetCount: _0x1c9c35,
        });
      return (
        (_0x89d686[_0x1e5483['kind']] = 'compact'),
        {
          ..._0x1e5483,
          mode: 'compact',
          selectedCandidateAssetCount: _0x1c9c35,
          compactOutputTokens: _0x1ce7ed,
        }
      );
    }),
    _0x166891 = _0x46f0d4['find'](
      (_0x1f1381) => _0x1f1381['mode'] === 'compact' && _0x1f1381['compactOutputTokens'] > _0x31318e,
    );
  if (!_0x166891) {
    const _0x79b1a6 = new Set(Object['values'](_0x89d686));
    return {
      mode: _0x79b1a6['size'] === 0x1 ? [..._0x79b1a6][0x0] : 'mixed',
      modeByKind: _0x89d686,
      candidateAssetsByKind: _0x4a8e2d,
      laneDetails: _0x46f0d4,
      maxOutputTokens: _0x3c8f83,
      verboseSafeMaximum: _0x183ca6,
      verboseMaxItemsPerKind: STORY_ASSET_VERBOSE_MAX_ITEMS_PER_KIND,
      compactSafeMaximum: _0x31318e,
    };
  }
  const _0x13d87d = new Error(
    _0x166891['kind'] +
      ' 资产即使使用紧凑输出仍预计需要 ' +
      (_0x166891['compactOutputTokens'] + ' tokens，超过单次输出容量 ') +
      (_0x31318e + ' 的安全预算；已在调用 API 前安全停止。'),
  );
  ((_0x13d87d['type'] = 'ASSET_OUTPUT_CAPACITY'),
    (_0x13d87d['capacityDetails'] = {
      kind: _0x166891['kind'],
      requiredAssetCount: _0x166891['requiredAssetCount'],
      candidateAssetCount: _0x166891['candidateAssetCount'],
      estimatedOutputTokens: _0x166891['compactOutputTokens'],
      verboseEstimatedOutputTokens: _0x166891['verboseOutputTokens'],
      maxOutputTokens: _0x3c8f83,
      compactSafeMaximum: _0x31318e,
      attemptedMode: 'compact',
    }));
  throw _0x13d87d;
}
export function assertStoryAssetFocusedOutputCapacity({
  requiredAssetNamesByKind: requiredAssetNamesByKind = {},
  candidateAssetsByKind: candidateAssetsByKind = {},
  maxOutputTokens: maxOutputTokens = STORY_ASSET_FOCUSED_MAX_OUTPUT_TOKENS,
} = {}) {
  const _0x2f28ab = Math['max'](0x1, Math['trunc'](Number(maxOutputTokens) || 0x0));
  for (const _0x550609 of ['character', 'scene', 'prop']) {
    const _0x2c575f = Array['isArray'](requiredAssetNamesByKind?.[_0x550609])
        ? requiredAssetNamesByKind[_0x550609]['length']
        : 0x0,
      _0x228833 = Array['isArray'](candidateAssetsByKind?.[_0x550609])
        ? candidateAssetsByKind[_0x550609]['length']
        : 0x0,
      _0x24ea73 = estimateStoryAssetFocusedOutputTokens({
        kind: _0x550609,
        requiredAssetCount: _0x2c575f,
        candidateAssetCount: _0x228833,
      });
    if (_0x24ea73 <= _0x2f28ab) continue;
    const _0xdf271f = new Error(
      _0x550609 +
        ' 资产预计输出 ' +
        _0x24ea73 +
        ' tokens，超过单次输出容量 ' +
        _0x2f28ab +
        '；已在调用\x20API\x20前安全停止。',
    );
    ((_0xdf271f['type'] = 'ASSET_OUTPUT_CAPACITY'),
      (_0xdf271f['capacityDetails'] = {
        kind: _0x550609,
        requiredAssetCount: _0x2c575f,
        candidateAssetCount: _0x228833,
        estimatedOutputTokens: _0x24ea73,
        maxOutputTokens: _0x2f28ab,
      }));
    throw _0xdf271f;
  }
}
