import { getStoryAssetAppearances, normalizeStoryAsset } from './storyAssetAppearances.js';
function normalizeText(_0x1e9d2b) {
  return String(_0x1e9d2b || '')['trim']();
}
function getLibraryAssetSourceKey(_0x123221 = {}) {
  const _0x141794 = normalizeText(_0x123221['sourceAssetId'] || _0x123221['assetId']),
    _0x3cc038 = Math['max'](
      0x0,
      Math['trunc'](Number(_0x123221['sourceItemIndex'] ?? _0x123221['itemIndex']) || 0x0),
    );
  return _0x141794 + ':' + _0x3cc038;
}
function getLibraryAssetImage(_0x4bee9a = {}) {
  const _0x39f5e1 = normalizeText(_0x4bee9a['mediaKind'] || _0x4bee9a['type'])['toLowerCase'](),
    _0x41ba86 = normalizeText(_0x4bee9a['sourceUrl'] || _0x4bee9a['imageUrl']);
  if (_0x39f5e1 !== 'image' || !_0x41ba86) return null;
  return {
    imageUrl: _0x41ba86,
    sourceAssetId: normalizeText(_0x4bee9a['sourceAssetId'] || _0x4bee9a['assetId']),
    sourceItemIndex: Math['max'](
      0x0,
      Math['trunc'](Number(_0x4bee9a['sourceItemIndex'] ?? _0x4bee9a['itemIndex']) || 0x0),
    ),
  };
}
function createLibraryAppearanceId(_0x31f277 = {}, _0x5e0f3e = '', _0xce038c = new Set()) {
  const _0x2a0afb =
      normalizeText(_0x31f277['sourceAssetId'] || _0x31f277['assetId'])
        ['replace'](/[^\p{L}\p{N}_-]+/gu, '-')
        ['replace'](/^-+|-+$/gu, '') || 'asset',
    _0x2cc9f4 = Math['max'](
      0x0,
      Math['trunc'](Number(_0x31f277['sourceItemIndex'] ?? _0x31f277['itemIndex']) || 0x0),
    ),
    _0x22f834 =
      (normalizeText(_0x5e0f3e) || 'story-asset') + '-appearance-' + _0x2a0afb + '-' + (_0x2cc9f4 + 0x1);
  let _0x1544f7 = _0x22f834,
    _0x1edff6 = 0x2;
  while (_0xce038c['has'](_0x1544f7)) {
    ((_0x1544f7 = _0x22f834 + '-' + _0x1edff6), (_0x1edff6 += 0x1));
  }
  return (_0xce038c['add'](_0x1544f7), _0x1544f7);
}
function createLibraryAppearance(_0x4f927c, _0x3a1ba9, _0x4ef5b9) {
  const _0x962d22 = getLibraryAssetImage(_0x4f927c);
  return {
    id: _0x4ef5b9,
    name:
      normalizeText(_0x4f927c['name'] || _0x4f927c['assetName']) ||
      (_0x3a1ba9['kind'] === 'scene'
        ? '新增场景形象'
        : _0x3a1ba9['kind'] === 'prop'
          ? '新增道具形象'
          : '新增角色形象'),
    sourceOrigin: 'library',
    sourceAssetId: _0x962d22['sourceAssetId'],
    sourceItemIndex: _0x962d22['sourceItemIndex'],
    occurrences: '总素材',
    prompt: '',
    imageUrl: _0x962d22['imageUrl'],
    referenceImageUrl: '',
    error: '',
  };
}
function replaceLibraryAppearance(_0x5a483d, _0x5d25ac) {
  const _0x14841a = getLibraryAssetImage(_0x5d25ac),
    {
      generatedImage: _0x215c75,
      generatedImages: _0xc496c2,
      activeIndex: _0x48540d,
      totalAssetRef: _0x38c4c4,
      ..._0x9f5095
    } = _0x5a483d;
  return {
    ..._0x9f5095,
    sourceOrigin: 'library',
    sourceAssetId: _0x14841a['sourceAssetId'],
    sourceItemIndex: _0x14841a['sourceItemIndex'],
    imageUrl: _0x14841a['imageUrl'],
    error: '',
  };
}
function createEmptyResult(_0x4a534e, _0x3e5101, _0x483d9c = '') {
  return {
    assets: _0x4a534e,
    addedAssetIds: [],
    updatedAppearanceIds: [],
    existingAssetIds: [],
    skippedAssetIds: (Array['isArray'](_0x3e5101) ? _0x3e5101 : [])['map'](normalizeText)['filter'](Boolean),
    targetAssetId: _0x483d9c,
  };
}
export function addStoryLibraryAssetsToProject(
  _0x16c48e = [],
  _0x3981be = [],
  _0x5a7e7c = [],
  _0x344185 = '',
  { targetAppearanceId: targetAppearanceId = '', createAppearance: createAppearance = ![] } = {},
) {
  const _0x36ce6a = Array['isArray'](_0x16c48e) ? _0x16c48e : [],
    _0x510bb6 = normalizeText(_0x344185),
    _0x3354fd = _0x36ce6a['findIndex']((_0x4891a1) => normalizeText(_0x4891a1?.['id']) === _0x510bb6);
  if (_0x3354fd < 0x0) return createEmptyResult(_0x36ce6a, _0x5a7e7c);
  const _0x551576 = _0x36ce6a[_0x3354fd],
    _0x12ee83 = new Set(
      (Array['isArray'](_0x5a7e7c) ? _0x5a7e7c : [])['map'](normalizeText)['filter'](Boolean),
    ),
    _0x2aee4f = (Array['isArray'](_0x3981be) ? _0x3981be : [])['filter']((_0x3f9e8e) =>
      _0x12ee83['has'](normalizeText(_0x3f9e8e?.['id'])),
    ),
    _0x493210 = _0x2aee4f['filter'](getLibraryAssetImage),
    _0x506b9d = _0x2aee4f['filter']((_0x564870) => !getLibraryAssetImage(_0x564870))
      ['map']((_0x34175d) => normalizeText(_0x34175d?.['id']))
      ['filter'](Boolean),
    _0x58e7cf = getStoryAssetAppearances(_0x551576),
    _0x64c60f = normalizeText(targetAppearanceId);
  if (_0x64c60f) {
    const _0xf4ff4a = _0x58e7cf['findIndex']((_0x360cde) => normalizeText(_0x360cde?.['id']) === _0x64c60f);
    if (_0xf4ff4a < 0x0 || _0x493210['length'] !== 0x1)
      return createEmptyResult(_0x36ce6a, _0x5a7e7c, _0x510bb6);
    const _0x412130 = [..._0x58e7cf];
    _0x412130[_0xf4ff4a] = replaceLibraryAppearance(_0x412130[_0xf4ff4a], _0x493210[0x0]);
    const _0xc6e1ac = normalizeStoryAsset({ ..._0x551576, appearances: _0x412130 }, _0x3354fd);
    return {
      assets: _0x36ce6a['map']((_0x244922, _0x147c81) => (_0x147c81 === _0x3354fd ? _0xc6e1ac : _0x244922)),
      addedAssetIds: [],
      updatedAppearanceIds: [_0x64c60f],
      existingAssetIds: [],
      skippedAssetIds: _0x506b9d,
      targetAssetId: _0x510bb6,
    };
  }
  const _0x6ccec8 = new Set(
      _0x58e7cf['map']((_0x170921) => normalizeText(_0x170921?.['id']))['filter'](Boolean),
    ),
    _0x5b48e = new Map(
      _0x58e7cf['filter']((_0x2355e0) => normalizeText(_0x2355e0?.['sourceOrigin']) === 'library')['map'](
        (_0x1cd3e8) => [getLibraryAssetSourceKey(_0x1cd3e8), _0x1cd3e8],
      ),
    ),
    _0x3068ca = [],
    _0x1667bb = [];
  _0x493210['forEach']((_0x487fbf) => {
    const _0x40d675 = getLibraryAssetSourceKey(_0x487fbf),
      _0x5af4b5 = createAppearance ? null : _0x5b48e['get'](_0x40d675);
    if (_0x5af4b5) {
      _0x1667bb['push'](_0x5af4b5['id']);
      return;
    }
    const _0x3eb553 = createLibraryAppearance(
      _0x487fbf,
      _0x551576,
      createLibraryAppearanceId(_0x487fbf, _0x510bb6, _0x6ccec8),
    );
    (_0x3068ca['push'](_0x3eb553), _0x5b48e['set'](_0x40d675, _0x3eb553));
  });
  const _0x2acbb3 = normalizeStoryAsset(
    { ..._0x551576, appearances: [..._0x58e7cf, ..._0x3068ca] },
    _0x3354fd,
  );
  return {
    assets: _0x36ce6a['map']((_0x51f656, _0x364767) => (_0x364767 === _0x3354fd ? _0x2acbb3 : _0x51f656)),
    addedAssetIds: _0x3068ca['map']((_0x67db52) => _0x67db52['id']),
    updatedAppearanceIds: [],
    existingAssetIds: _0x1667bb,
    skippedAssetIds: _0x506b9d,
    targetAssetId: _0x510bb6,
  };
}
