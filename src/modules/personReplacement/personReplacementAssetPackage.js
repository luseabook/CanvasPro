const PERSON_REPLACEMENT_ASSET_PACKAGE_CATEGORY = '替换工作室';
function normalizeText(_0x46a91a) {
  return String(_0x46a91a ?? '')['trim']();
}
function getAppearanceImage(_0x3b5d24 = {}, _0x425692 = null) {
  const _0x3665ab =
      _0x425692 && typeof _0x425692 === 'object'
        ? _0x425692
        : _0x3b5d24?.['generatedImage'] && typeof _0x3b5d24['generatedImage'] === 'object'
          ? _0x3b5d24['generatedImage']
          : {},
    _0x1b5ecc = normalizeText(_0x3665ab['localPath'] || _0x3b5d24?.['localPath']),
    _0x7b8602 = normalizeText(_0x3665ab['originalLocalPath'] || _0x3b5d24?.['originalLocalPath']),
    _0x202e16 = normalizeText(_0x3665ab['displayLocalPath'] || _0x3b5d24?.['displayLocalPath']);
  return {
    ...(_0x3665ab && typeof _0x3665ab === 'object' ? _0x3665ab : {}),
    ...(_0x1b5ecc ? { localPath: _0x1b5ecc } : {}),
    ...(_0x7b8602 ? { originalLocalPath: _0x7b8602 } : {}),
    ...(_0x202e16 ? { displayLocalPath: _0x202e16 } : {}),
    imageUrl: normalizeText(
      _0x3665ab?.['imageUrl'] || _0x3665ab?.['displayUrl'] || _0x3665ab?.['url'] || _0x3b5d24?.['imageUrl'],
    ),
  };
}
export function buildPersonReplacementAssetPackageItemRequest({
  project: project = {},
  character: character = {},
  appearance: appearance = {},
  image: image = null,
} = {}) {
  const _0x13d25e = normalizeText(project['id']),
    _0x3d01a3 = normalizeText(character['id']),
    _0x41ffb9 = normalizeText(appearance['id']),
    _0x9e80e0 = normalizeText(project['title']) || '未命名人物替换项目',
    _0x158266 = normalizeText(character['name']) || '未命名人物',
    _0x2b724d = normalizeText(appearance['name']) || '基础形象';
  return {
    packageKey: 'person-replacement-project:' + _0x13d25e,
    packageName: _0x9e80e0,
    category: PERSON_REPLACEMENT_ASSET_PACKAGE_CATEGORY,
    itemKey: 'person-replacement-appearance:' + _0x3d01a3 + ':' + _0x41ffb9,
    itemName: '人物｜' + _0x158266 + '｜' + _0x2b724d,
    image: getAppearanceImage(appearance, image),
    metadata: { sourceKind: 'person-replacement-workspace', sourceProjectId: _0x13d25e },
    itemMetadata: {
      sourceKind: 'person-replacement-workspace',
      sourceProjectId: _0x13d25e,
      sourceCharacterId: _0x3d01a3,
      sourceAppearanceId: _0x41ffb9,
    },
  };
}
export async function savePersonReplacementAppearanceToAssetPackage({
  project: project = {},
  characterId: characterId = '',
  appearanceId: appearanceId = '',
  saveAssetPackageItem: _0x54599d,
  persistOutputFromUrl: persistOutputFromUrl = null,
} = {}) {
  const _0x2c38f2 = normalizeText(characterId),
    _0x523c60 = normalizeText(appearanceId),
    _0xb6149c = (Array['isArray'](project['characters']) ? project['characters'] : [])['find'](
      (_0x265cc1) => normalizeText(_0x265cc1?.['id']) === _0x2c38f2,
    ),
    _0x4b3fc8 = (Array['isArray'](_0xb6149c?.['appearances']) ? _0xb6149c['appearances'] : [])['find'](
      (_0x435f98) => normalizeText(_0x435f98?.['id']) === _0x523c60,
    );
  if (!_0xb6149c || !_0x4b3fc8) throw new Error('当前形象不可加入总素材。');
  if (!normalizeText(_0x4b3fc8['imageUrl'])) throw new Error('请先生成或上传当前形象。');
  if (typeof _0x54599d !== 'function') throw new Error('总素材服务尚未初始化。');
  let _0x2cc4b3 = buildPersonReplacementAssetPackageItemRequest({
    project: project,
    character: _0xb6149c,
    appearance: _0x4b3fc8,
  });
  const _0x18b494 = normalizeText(_0x2cc4b3['image']?.['imageUrl']),
    _0x3a300c = Boolean(
      normalizeText(
        _0x2cc4b3['image']?.['localPath'] ||
          _0x2cc4b3['image']?.['originalLocalPath'] ||
          _0x2cc4b3['image']?.['displayLocalPath'],
      ),
    );
  if (
    !_0x3a300c &&
    /^(?:https?:|blob:|data:)/i['test'](_0x18b494) &&
    typeof persistOutputFromUrl === 'function'
  ) {
    const _0x37dec3 = await persistOutputFromUrl(_0x18b494, {
      kind: 'image',
      ext: 'png',
      dedupeKey: [
        'person-replacement-asset-package',
        normalizeText(project['id']),
        _0x2c38f2,
        _0x523c60,
        _0x18b494,
      ]['join'](':'),
    });
    if (_0x37dec3?.['error']) throw new Error(_0x37dec3['error']);
    const _0x55f8ae = normalizeText(
      _0x37dec3?.['displayUrl'] ||
        _0x37dec3?.['imageUrl'] ||
        _0x37dec3?.['url'] ||
        _0x37dec3?.['originalUrl'] ||
        _0x37dec3?.['thumbUrl'] ||
        _0x37dec3?.['displayLocalPath'] ||
        _0x37dec3?.['localPath'],
    );
    if (!_0x55f8ae) throw new Error('保存当前形象失败：缺少稳定图片地址。');
    _0x2cc4b3 = buildPersonReplacementAssetPackageItemRequest({
      project: project,
      character: _0xb6149c,
      appearance: _0x4b3fc8,
      image: {
        ..._0x2cc4b3['image'],
        ...(_0x37dec3 && typeof _0x37dec3 === 'object' ? _0x37dec3 : {}),
        imageUrl: _0x55f8ae,
      },
    });
  }
  const _0x1b3af2 = await _0x54599d(_0x2cc4b3),
    _0x44336f = normalizeText(_0x1b3af2?.['imageUrl'] || _0x2cc4b3['image']?.['imageUrl']);
  return {
    characterId: _0x2c38f2,
    appearanceId: _0x523c60,
    imageUrl: _0x44336f,
    totalAssetRef: {
      assetId: normalizeText(_0x1b3af2?.['assetId']),
      itemIndex: Math['max'](0x0, Math['trunc'](Number(_0x1b3af2?.['itemIndex']) || 0x0)),
      itemKey: _0x2cc4b3['itemKey'],
      imageUrl: _0x44336f,
      updatedAt: Date['now'](),
    },
    itemCreated: _0x1b3af2?.['itemCreated'] !== ![],
    request: _0x2cc4b3,
    result: _0x1b3af2,
  };
}
export function readPersonReplacementLibraryAssets(_0x1f4907, _0xf2e30f = globalThis['console']) {
  if (typeof _0x1f4907 !== 'function') return [];
  try {
    const _0x4fffa0 = _0x1f4907();
    return (Array['isArray'](_0x4fffa0) ? _0x4fffa0 : [])['filter']((_0x3aa0ee) =>
      ['image', 'audio']['includes'](
        normalizeText(_0x3aa0ee?.['type'] || _0x3aa0ee?.['mediaKind'])['toLowerCase'](),
      ),
    );
  } catch (_0x545f62) {
    return (_0xf2e30f?.['warn']?.('[replacementStudio] failed to read asset library', _0x545f62), []);
  }
}
export function createPersonReplacementAppearanceAssetLibraryOperation({
  getProject: _0x43cf05,
  setProject: _0x3d2800,
  saveAssetPackageItem: _0x390d5b,
  persistOutputFromUrl: _0x52e99e,
  showToast: showToast = () => {},
} = {}) {
  const _0x333db1 = new Set();
  return async ({ characterId: characterId = '', appearanceId: appearanceId = '' } = {}) => {
    const _0x2bd226 = _0x43cf05?.() || {},
      _0x5d5b6c = normalizeText(_0x2bd226['id']),
      _0x5e04db = [_0x5d5b6c, normalizeText(characterId), normalizeText(appearanceId)]['join'](':');
    if (_0x333db1['has'](_0x5e04db)) return null;
    (_0x333db1['add'](_0x5e04db), showToast('正在将当前形象加入总素材。', 'info'));
    try {
      const _0xda60a6 = await savePersonReplacementAppearanceToAssetPackage({
          project: _0x2bd226,
          characterId: characterId,
          appearanceId: appearanceId,
          saveAssetPackageItem: _0x390d5b,
          persistOutputFromUrl: _0x52e99e,
        }),
        _0x19e0da = _0x43cf05?.() || {};
      if (normalizeText(_0x19e0da['id']) !== _0x5d5b6c) return null;
      let _0x21a4e7 = ![];
      const _0x1724da = (Array['isArray'](_0x19e0da['characters']) ? _0x19e0da['characters'] : [])['map'](
        (_0x3aab1b) => {
          if (normalizeText(_0x3aab1b['id']) !== _0xda60a6['characterId']) return _0x3aab1b;
          return {
            ..._0x3aab1b,
            appearances: _0x3aab1b['appearances']['map']((_0x21e02d) => {
              if (normalizeText(_0x21e02d['id']) !== _0xda60a6['appearanceId']) return _0x21e02d;
              return (
                (_0x21a4e7 = !![]),
                {
                  ..._0x21e02d,
                  imageUrl: _0xda60a6['imageUrl'] || _0x21e02d['imageUrl'],
                  totalAssetRef: _0xda60a6['totalAssetRef'],
                }
              );
            }),
          };
        },
      );
      if (!_0x21a4e7) return null;
      const _0x1b2e61 = _0x3d2800?.({ ..._0x19e0da, characters: _0x1724da });
      return (
        showToast(
          _0xda60a6['itemCreated'] ? '当前形象已加入总素材。' : '已更新总素材中的当前形象。',
          'success',
        ),
        {
          project: _0x1b2e61,
          ok: !![],
          assetId: _0xda60a6['totalAssetRef']['assetId'],
          itemIndex: _0xda60a6['totalAssetRef']['itemIndex'],
        }
      );
    } catch (_0x4b850c) {
      return (showToast(_0x4b850c?.['message'] || '加入总素材失败，请稍后重试。', 'error'), null);
    } finally {
      _0x333db1['delete'](_0x5e04db);
    }
  };
}
