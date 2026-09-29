export const STORY_ASSET_EVIDENCE_DOSSIER_MAX_SCENES = 0x6;
export const STORY_ASSET_EVIDENCE_DOSSIER_MAX_CHARACTERS = 0x960;
const CANDIDATE_KEY_BY_KIND = Object['freeze']({
  character: 'character',
  scene: 'scene',
  prop: 'prop',
});
function normalizeText(_0x5833ce) {
  return typeof _0x5833ce === 'string' ? _0x5833ce['trim']() : '';
}
function normalizeStringArray(_0x2d058b) {
  return [
    ...new Set((Array['isArray'](_0x2d058b) ? _0x2d058b : [])['map'](normalizeText)['filter'](Boolean)),
  ];
}
function createAssetNameAliases(_0x216db3 = {}) {
  const _0x2b05a2 = normalizeText(_0x216db3?.['name']);
  if (!_0x2b05a2) return [];
  const _0x10bb7a = normalizeText(_0x2b05a2['split'](/[_（(]/u)[0x0]),
    _0xc94a22 = [..._0x2b05a2['matchAll'](/[（(]([^（）()\r\n]+)[）)]/gu)]['map']((_0x446490) =>
      normalizeText(_0x446490[0x1]),
    );
  return normalizeStringArray([_0x2b05a2, _0x10bb7a, ..._0xc94a22]);
}
function sceneMentionsAsset(_0xda4efd = {}, _0x2fbfae = {}, _0x5c34de = []) {
  const _0x1aaa48 = CANDIDATE_KEY_BY_KIND[normalizeText(_0x2fbfae?.['kind'])],
    _0x22f1a9 = normalizeStringArray(_0xda4efd?.['localEntityCandidates']?.[_0x1aaa48]),
    _0x21abc7 = _0x22f1a9['some']((_0x53b052) =>
      _0x5c34de['some'](
        (_0xef9b6f) =>
          _0x53b052 === _0xef9b6f || _0x53b052['includes'](_0xef9b6f) || _0xef9b6f['includes'](_0x53b052),
      ),
    );
  if (_0x21abc7) return !![];
  const _0x443204 = normalizeText(_0xda4efd?.['heading']) + '\x0a' + normalizeText(_0xda4efd?.['body']);
  return _0x5c34de['some']((_0xf2e62e) => _0x443204['includes'](_0xf2e62e));
}
function buildPrioritizedSceneRefs(_0x510504 = {}, _0x57f117 = []) {
  const _0x52c037 = new Set(_0x57f117['map']((_0x1fbb63) => normalizeText(_0x1fbb63?.['ref']))),
    _0x17d181 = normalizeStringArray(_0x510504?.['sourceSceneRefs'])['filter']((_0x1c0ed4) =>
      _0x52c037['has'](_0x1c0ed4),
    ),
    _0x2de6bf = createAssetNameAliases(_0x510504),
    _0x32698c = [],
    _0x1affe7 = (_0x3962ac) => {
      const _0x1334b9 = normalizeText(_0x3962ac);
      if (_0x1334b9 && _0x52c037['has'](_0x1334b9) && !_0x32698c['includes'](_0x1334b9))
        _0x32698c['push'](_0x1334b9);
    };
  return (
    (Array['isArray'](_0x510504?.['appearances']) ? _0x510504['appearances'] : [])['forEach']((_0x5098bb) => {
      const _0x5eee55 = normalizeStringArray(_0x5098bb?.['sourceSceneRefs']);
      (_0x1affe7(_0x5eee55[0x0]), _0x1affe7(_0x5eee55['at'](-0x1)));
    }),
    _0x1affe7(_0x17d181[0x0]),
    _0x1affe7(_0x17d181['at'](-0x1)),
    _0x57f117['filter'](
      (_0x4ad99a) =>
        _0x17d181['includes'](normalizeText(_0x4ad99a?.['ref'])) &&
        sceneMentionsAsset(_0x4ad99a, _0x510504, _0x2de6bf),
    )['forEach']((_0x5269c7) => _0x1affe7(_0x5269c7['ref'])),
    _0x17d181['forEach'](_0x1affe7),
    _0x32698c
  );
}
function compactEvidenceExcerpt(_0x3819df, _0x1004e4 = [], _0x206865 = 0x258) {
  const _0x59afdc = normalizeText(_0x3819df),
    _0x45aba6 = Math['max'](0xa0, Math['trunc'](Number(_0x206865) || 0x0));
  if ([..._0x59afdc]['length'] <= _0x45aba6) return _0x59afdc;
  const _0x17e1b5 = '证据原文：',
    _0x4f6356 = _0x59afdc['indexOf'](_0x17e1b5),
    _0xb82adc = _0x4f6356 >= 0x0 ? _0x4f6356 + _0x17e1b5['length'] : 0x0,
    _0x42c218 = _0x59afdc['slice'](_0xb82adc),
    _0x17211b = _0x1004e4['map']((_0x4e58fb) => _0x42c218['indexOf'](_0x4e58fb))['find'](
      (_0x4e012f) => _0x4e012f >= 0x0,
    );
  if (Number['isInteger'](_0x17211b)) {
    const _0x378024 = Math['floor'](_0x45aba6 * 0.38),
      _0x1fd586 = _0xb82adc + _0x17211b,
      _0x3ef7f3 = Math['max'](0x0, _0x1fd586 - _0x378024),
      _0x25f09d = Math['min'](_0x59afdc['length'], _0x3ef7f3 + _0x45aba6);
    return _0x59afdc['slice'](Math['max'](0x0, _0x25f09d - _0x45aba6), _0x25f09d);
  }
  const _0x1773d1 = '\n……\n',
    _0x1c2539 = Math['max'](0x1, _0x45aba6 - _0x1773d1['length']),
    _0x52e25c = Math['floor'](_0x1c2539 * 0.7),
    _0x2dbf9f = _0x1c2539 - _0x52e25c;
  return '' + _0x59afdc['slice'](0x0, _0x52e25c) + _0x1773d1 + _0x59afdc['slice'](-_0x2dbf9f);
}
export function createStoryAssetEvidenceDossiers(
  _0x54b3d5 = [],
  _0x28e897 = [],
  {
    maxScenes: maxScenes = STORY_ASSET_EVIDENCE_DOSSIER_MAX_SCENES,
    maxCharacters: maxCharacters = STORY_ASSET_EVIDENCE_DOSSIER_MAX_CHARACTERS,
    includeSourceMappings: includeSourceMappings = !![],
  } = {},
) {
  const _0x593a60 = Array['isArray'](_0x28e897) ? _0x28e897 : [],
    _0x210fee = new Map(_0x593a60['map']((_0x501df8) => [normalizeText(_0x501df8?.['ref']), _0x501df8])),
    _0x5c06b5 = Math['max'](0x1, Math['trunc'](Number(maxScenes) || 0x0)),
    _0x24735a = Math['max'](0x258, Math['trunc'](Number(maxCharacters) || 0x0));
  return (Array['isArray'](_0x54b3d5) ? _0x54b3d5 : [])['map']((_0x40b199) => {
    const _0x5c5913 = createAssetNameAliases(_0x40b199),
      _0x1493f0 = buildPrioritizedSceneRefs(_0x40b199, _0x593a60)['slice'](0x0, _0x5c06b5),
      _0x2c41c5 = Math['max'](
        0xf0,
        Math['min'](0x384, Math['floor'](_0x24735a / Math['max'](0x1, _0x1493f0['length']))),
      );
    let _0x513a33 = _0x24735a;
    const _0x3f1af4 = _0x1493f0['flatMap']((_0x4dce22) => {
      if (_0x513a33 <= 0x0) return [];
      const _0x2cc5b6 = _0x210fee['get'](_0x4dce22);
      if (!_0x2cc5b6) return [];
      const _0x2ae42f = compactEvidenceExcerpt(
        _0x2cc5b6['body'],
        _0x5c5913,
        Math['min'](_0x2c41c5, _0x513a33),
      );
      if (!_0x2ae42f) return [];
      return (
        (_0x513a33 -= [..._0x2ae42f]['length']),
        [
          {
            sourceSceneRef: _0x4dce22,
            sourceEpisodeRef: normalizeText(_0x2cc5b6?.['episodeRef']),
            episodeNumber: Math['max'](0x1, Math['trunc'](Number(_0x2cc5b6?.['episodeNumber']) || 0x1)),
            heading: normalizeText(_0x2cc5b6?.['heading']),
            body: _0x2ae42f,
          },
        ]
      );
    });
    return {
      assetRef: normalizeText(_0x40b199?.['ref']),
      kind: normalizeText(_0x40b199?.['kind']),
      name: normalizeText(_0x40b199?.['name']),
      role: normalizeText(_0x40b199?.['role']),
      ...(includeSourceMappings
        ? {
            sourceEpisodeRefs: normalizeStringArray(_0x40b199?.['sourceEpisodeRefs']),
            sourceSceneRefs: normalizeStringArray(_0x40b199?.['sourceSceneRefs']),
          }
        : {}),
      inventoryHints: {
        description: normalizeText(_0x40b199?.['description']),
        appearances: (Array['isArray'](_0x40b199?.['appearances']) ? _0x40b199['appearances'] : [])['map'](
          (_0x260a82) => ({
            ref: normalizeText(_0x260a82?.['ref']),
            name: normalizeText(_0x260a82?.['name']),
            description: normalizeText(_0x260a82?.['description']),
            sourceSceneRefs: normalizeStringArray(_0x260a82?.['sourceSceneRefs']),
          }),
        ),
      },
      evidence: _0x3f1af4,
    };
  });
}
