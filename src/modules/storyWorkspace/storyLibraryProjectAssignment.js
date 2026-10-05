import { getStoryAssetAppearances, normalizeStoryAsset } from './storyAssetAppearances.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function getLibraryAssetSourceKey(options = {}) {
  const text = normalizeText(options['sourceAssetId'] || options['assetId']),
    item = Math['max'](0, Math['trunc'](Number(options['sourceItemIndex'] ?? options['itemIndex']) || 0));
  return text + ':' + item;
}
function getLibraryAssetImage(options2 = {}) {
  const text2 = normalizeText(options2['mediaKind'] || options2['type'])['toLowerCase'](),
    imageUrl = normalizeText(options2['sourceUrl'] || options2['imageUrl']);
  if (text2 !== 'image' || !imageUrl) return null;
  return {
    imageUrl: imageUrl,
    sourceAssetId: normalizeText(options2['sourceAssetId'] || options2['assetId']),
    sourceItemIndex: Math['max'](
      0,
      Math['trunc'](Number(options2['sourceItemIndex'] ?? options2['itemIndex']) || 0),
    ),
  };
}
function createLibraryAppearanceId(options3 = {}, key = '', map = new Set()) {
  const text3 =
      normalizeText(options3['sourceAssetId'] || options3['assetId'])
        ['replace'](/[^\p{L}\p{N}_-]+/gu, '-')
        ['replace'](/^-+|-+$/gu, '') || 'asset',
    index = Math['max'](
      0,
      Math['trunc'](Number(options3['sourceItemIndex'] ?? options3['itemIndex']) || 0),
    ),
    result = (normalizeText(key) || 'story-asset') + '-appearance-' + text3 + '-' + (index + 1);
  let data = result,
    target = 2;
  while (map['has'](data)) {
    ((data = result + '-' + target), (target += 1));
  }
  return (map['add'](data), data);
}
function createLibraryAppearance(error, source, id) {
  const sourceAssetId = getLibraryAssetImage(error);
  return {
    id: id,
    name:
      normalizeText(error['name'] || error['assetName']) ||
      (source['kind'] === 'scene'
        ? '新增场景形象'
        : source['kind'] === 'prop'
          ? '新增道具形象'
          : '新增角色形象'),
    sourceOrigin: 'library',
    sourceAssetId: sourceAssetId['sourceAssetId'],
    sourceItemIndex: sourceAssetId['sourceItemIndex'],
    occurrences: '总素材',
    prompt: '',
    imageUrl: sourceAssetId['imageUrl'],
    referenceImageUrl: '',
    error: '',
  };
}
function replaceLibraryAppearance(next, current) {
  const sourceAssetId2 = getLibraryAssetImage(current),
    {
      generatedImage: generatedImage,
      generatedImages: generatedImages,
      activeIndex: activeIndex,
      totalAssetRef: totalAssetRef,
      ...args
    } = next;
  return {
    ...args,
    sourceOrigin: 'library',
    sourceAssetId: sourceAssetId2['sourceAssetId'],
    sourceItemIndex: sourceAssetId2['sourceItemIndex'],
    imageUrl: sourceAssetId2['imageUrl'],
    error: '',
  };
}
function createEmptyResult(assets, entry, targetAssetId = '') {
  return {
    assets: assets,
    addedAssetIds: [],
    updatedAppearanceIds: [],
    existingAssetIds: [],
    skippedAssetIds: (Array['isArray'](entry) ? entry : [])['map'](normalizeText)['filter'](Boolean),
    targetAssetId: targetAssetId,
  };
}
export function addStoryLibraryAssetsToProject(
  list = [],
  record = [],
  payload = [],
  handle = '',
  { targetAppearanceId: targetAppearanceId = '', createAppearance: createAppearance = ![] } = {},
) {
  const assets2 = Array['isArray'](list) ? list : [],
    targetAssetId2 = normalizeText(handle),
    count = assets2['findIndex']((state) => normalizeText(state?.['id']) === targetAssetId2);
  if (count < 0) return createEmptyResult(assets2, payload);
  const args2 = assets2[count],
    map2 = new Set((Array['isArray'](payload) ? payload : [])['map'](normalizeText)['filter'](Boolean)),
    list2 = (Array['isArray'](record) ? record : [])['filter']((config) =>
      map2['has'](normalizeText(config?.['id'])),
    ),
    list3 = list2['filter'](getLibraryAssetImage),
    skippedAssetIds = list2['filter']((scope) => !getLibraryAssetImage(scope))
      ['map']((input) => normalizeText(input?.['id']))
      ['filter'](Boolean),
    list4 = getStoryAssetAppearances(args2),
    text4 = normalizeText(targetAppearanceId);
  if (text4) {
    const count2 = list4['findIndex']((output) => normalizeText(output?.['id']) === text4);
    if (count2 < 0 || list3['length'] !== 1) return createEmptyResult(assets2, payload, targetAssetId2);
    const appearances = [...list4];
    appearances[count2] = replaceLibraryAppearance(appearances[count2], list3[0]);
    const storyAsset = normalizeStoryAsset({ ...args2, appearances: appearances }, count);
    return {
      assets: assets2['map']((value2, value3) => (value3 === count ? storyAsset : value2)),
      addedAssetIds: [],
      updatedAppearanceIds: [text4],
      existingAssetIds: [],
      skippedAssetIds: skippedAssetIds,
      targetAssetId: targetAssetId2,
    };
  }
  const value4 = new Set(list4['map']((value5) => normalizeText(value5?.['id']))['filter'](Boolean)),
    map3 = new Map(
      list4['filter']((value6) => normalizeText(value6?.['sourceOrigin']) === 'library')['map']((value7) => [
        getLibraryAssetSourceKey(value7),
        value7,
      ]),
    ),
    addedAssetIds = [],
    existingAssetIds = [];
  list3['forEach']((value8) => {
    const libraryAssetSourceKey = getLibraryAssetSourceKey(value8),
      value9 = createAppearance ? null : map3['get'](libraryAssetSourceKey);
    if (value9) {
      existingAssetIds['push'](value9['id']);
      return;
    }
    const libraryAppearance = createLibraryAppearance(
      value8,
      args2,
      createLibraryAppearanceId(value8, targetAssetId2, value4),
    );
    (addedAssetIds['push'](libraryAppearance), map3['set'](libraryAssetSourceKey, libraryAppearance));
  });
  const storyAsset2 = normalizeStoryAsset({ ...args2, appearances: [...list4, ...addedAssetIds] }, count);
  return {
    assets: assets2['map']((value10, value11) => (value11 === count ? storyAsset2 : value10)),
    addedAssetIds: addedAssetIds['map']((value12) => value12['id']),
    updatedAppearanceIds: [],
    existingAssetIds: existingAssetIds,
    skippedAssetIds: skippedAssetIds,
    targetAssetId: targetAssetId2,
  };
}
