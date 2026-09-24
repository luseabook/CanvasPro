import { getStorySceneIdentityKey } from '../utils/storySceneIdentity.js';
const STORY_ASSET_KINDS = Object['freeze'](['character', 'scene', 'prop']);
function normalizeText(_0x2db8b7) {
  return typeof _0x2db8b7 === 'string' ? _0x2db8b7['trim']() : '';
}
function normalizeStringArray(_0x4c83a6 = []) {
  return [
    ...new Set((Array['isArray'](_0x4c83a6) ? _0x4c83a6 : [])['map'](normalizeText)['filter'](Boolean)),
  ];
}
function normalizeAssetName(_0x2b5021 = '') {
  return normalizeText(_0x2b5021)
    ['normalize']('NFKC')
    ['replace'](/[（(][^（）()]{0,30}[）)]/gu, '')
    ['replace'](/[^\p{L}\p{N}]+/gu, '')
    ['toLowerCase']();
}
function createCharacterAliases(_0x20df91 = '') {
  const _0x1b67f9 = normalizeAssetName(_0x20df91);
  if (!_0x1b67f9) return [];
  const _0x5cab78 = _0x1b67f9['replace'](
    /^(?:房东|编辑|医生|护士|警察|老师|老板|经理|店员|保安|司机|队长|主任|主管)/u,
    '',
  );
  return [...new Set([_0x1b67f9, _0x5cab78]['filter'](Boolean))];
}
function assetNamesMatch(_0x3b77b1, _0x45d2d7 = '', _0x2ace7b = '') {
  if (_0x3b77b1 === 'scene') {
    const _0x1189d5 = getStorySceneIdentityKey(_0x45d2d7),
      _0x16e22c = getStorySceneIdentityKey(_0x2ace7b);
    return Boolean(
      _0x1189d5 &&
      _0x16e22c &&
      (_0x1189d5 === _0x16e22c || _0x1189d5['includes'](_0x16e22c) || _0x16e22c['includes'](_0x1189d5)),
    );
  }
  if (_0x3b77b1 === 'character') {
    const _0x48a3a4 = createCharacterAliases(_0x45d2d7),
      _0x548c3d = createCharacterAliases(_0x2ace7b);
    return _0x48a3a4['some']((_0xd67542) => _0x548c3d['includes'](_0xd67542));
  }
  return normalizeAssetName(_0x45d2d7) === normalizeAssetName(_0x2ace7b);
}
function assetNamesMatchExactly(_0x122cc5, _0x31810d = '', _0x5519ac = '') {
  if (_0x122cc5 === 'scene')
    return Boolean(
      getStorySceneIdentityKey(_0x31810d) &&
      getStorySceneIdentityKey(_0x31810d) === getStorySceneIdentityKey(_0x5519ac),
    );
  return normalizeAssetName(_0x31810d) === normalizeAssetName(_0x5519ac);
}
function normalizeStoryAssetCharacterRole(_0x1127a1 = '') {
  const _0x346ea5 = normalizeText(_0x1127a1)['toLowerCase']();
  if (/^(?:主角|protagonist|lead|hero)$/iu['test'](_0x346ea5)) return '主角';
  if (/^(?:反派|antagonist|villain)$/iu['test'](_0x346ea5)) return '反派';
  if (/^(?:路人|extra|passerby)$/iu['test'](_0x346ea5)) return '路人';
  return '配角';
}
export function createStoryAssetRequiredContractsByKind({
  project: project = {},
  requirementEvidence: requirementEvidence = {},
  sourceScenes: sourceScenes = [],
  requiredAssetNamesByKind: requiredAssetNamesByKind = {},
} = {}) {
  const _0x168b85 = Array['isArray'](project?.['characters']) ? project['characters'] : [],
    _0x55cb5f = new Map(
      (Array['isArray'](sourceScenes) ? sourceScenes : [])['map']((_0x439fec) => [
        normalizeText(_0x439fec?.['ref']),
        normalizeText(_0x439fec?.['episodeRef']),
      ]),
    ),
    _0x3b3785 = Array['isArray'](requirementEvidence?.['hardRequired'])
      ? requirementEvidence['hardRequired']
      : [];
  return Object['fromEntries'](
    STORY_ASSET_KINDS['map']((_0x4c688a) => [
      _0x4c688a,
      normalizeStringArray(requiredAssetNamesByKind?.[_0x4c688a])['map']((_0x349885) => {
        const _0x2a0297 = _0x3b3785['filter']((_0x3930e6) => _0x3930e6?.['kind'] === _0x4c688a),
          _0x125a55 = _0x2a0297['filter']((_0x5636c7) =>
            assetNamesMatchExactly(_0x4c688a, _0x5636c7?.['name'], _0x349885),
          ),
          _0xd31f52 = _0x125a55['length']
            ? _0x125a55
            : _0x2a0297['filter']((_0x4137b8) => assetNamesMatch(_0x4c688a, _0x4137b8?.['name'], _0x349885)),
          _0x1d4d23 = normalizeStringArray(
            _0xd31f52['flatMap']((_0x3f8131) =>
              _0x3f8131?.['hardSourceSceneRefs']?.['length']
                ? _0x3f8131['hardSourceSceneRefs']
                : _0x3f8131?.['sourceSceneRefs'] || [],
            ),
          ),
          _0x23312d = normalizeStringArray(_0x1d4d23['map']((_0x199661) => _0x55cb5f['get'](_0x199661))),
          _0x457755 =
            _0x4c688a === 'character'
              ? _0x168b85['find']((_0x5edd56) =>
                  assetNamesMatchExactly('character', _0x5edd56?.['name'], _0x349885),
                )
              : null,
          _0x4bef1c = normalizeText(
            Array['isArray'](_0x457755?.['fixedTraits'])
              ? _0x457755['fixedTraits']['join']('、')
              : _0x457755?.['fixedTraits'],
          )['slice'](0x0, 0xa0);
        return {
          name: _0x349885,
          sourceSceneRefs: _0x1d4d23,
          sourceChapterIds: _0x23312d,
          ...(_0x4c688a === 'character'
            ? {
                role: normalizeStoryAssetCharacterRole(_0x457755?.['roleType'] || _0x457755?.['role']),
                ...(_0x4bef1c ? { fixedTraits: _0x4bef1c } : {}),
              }
            : {}),
        };
      }),
    ]),
  );
}
export function lockStoryAssetRequiredSourceChapterIds(_0x1dec6f = {}, _0x38e716 = {}, _0x40d314 = {}) {
  return {
    ..._0x1dec6f,
    assets: (Array['isArray'](_0x1dec6f?.['assets']) ? _0x1dec6f['assets'] : [])['map']((_0x9972d1) => {
      const _0x17bf2d = normalizeText(_0x9972d1?.['kind']),
        _0xcaa73f = [
          ...(Array['isArray'](_0x38e716?.[_0x17bf2d]) ? _0x38e716[_0x17bf2d] : []),
          ...(Array['isArray'](_0x40d314?.[_0x17bf2d]) ? _0x40d314[_0x17bf2d] : []),
        ],
        _0x2422ec = _0xcaa73f['filter']((_0x5621f4) =>
          assetNamesMatchExactly(_0x17bf2d, _0x9972d1?.['name'], _0x5621f4?.['name']),
        ),
        _0x48bf4d = _0x2422ec['length']
          ? _0x2422ec
          : _0xcaa73f['filter']((_0x1c8162) =>
              assetNamesMatch(_0x17bf2d, _0x9972d1?.['name'], _0x1c8162?.['name']),
            ),
        _0x1bb6c4 = new Set(_0x48bf4d['map']((_0x4708c7) => getStorySceneIdentityKey(_0x4708c7?.['name']))),
        _0x5dd197 = _0x17bf2d === 'scene' && !_0x2422ec['length'] && _0x1bb6c4['size'] > 0x1 ? [] : _0x48bf4d;
      if (!_0x5dd197['length']) return _0x9972d1;
      const _0x3fea87 = normalizeStringArray(
        _0x5dd197['flatMap']((_0x15b2fc) => _0x15b2fc['sourceChapterIds'] || []),
      );
      if (!_0x3fea87['length']) return _0x9972d1;
      const _0x176c44 =
        _0x17bf2d === 'character'
          ? _0x5dd197['map']((_0x5e0942) => normalizeText(_0x5e0942?.['role']))['find']((_0x10af3d) =>
              ['主角', '配角', '反派', '路人']['includes'](_0x10af3d),
            )
          : '';
      return {
        ..._0x9972d1,
        ...(_0x176c44 ? { role: _0x176c44 } : {}),
        sourceChapterIds: _0x3fea87,
        appearances: (Array['isArray'](_0x9972d1?.['appearances']) ? _0x9972d1['appearances'] : [])['map'](
          (_0x44bbf9) => ({ ..._0x44bbf9, sourceChapterIds: _0x3fea87 }),
        ),
      };
    }),
  };
}
