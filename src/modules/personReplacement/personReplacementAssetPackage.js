const PERSON_REPLACEMENT_ASSET_PACKAGE_CATEGORY = '替换工作室';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function getAppearanceImage(options = {}, item = null) {
  const response =
      item && typeof item === 'object'
        ? item
        : options?.['generatedImage'] && typeof options['generatedImage'] === 'object'
          ? options['generatedImage']
          : {},
    localPath = normalizeText(response['localPath'] || options?.['localPath']),
    originalLocalPath = normalizeText(response['originalLocalPath'] || options?.['originalLocalPath']),
    displayLocalPath = normalizeText(response['displayLocalPath'] || options?.['displayLocalPath']);
  return {
    ...(response && typeof response === 'object' ? response : {}),
    ...(localPath ? { localPath: localPath } : {}),
    ...(originalLocalPath ? { originalLocalPath: originalLocalPath } : {}),
    ...(displayLocalPath ? { displayLocalPath: displayLocalPath } : {}),
    imageUrl: normalizeText(
      response?.['imageUrl'] || response?.['displayUrl'] || response?.['url'] || options?.['imageUrl'],
    ),
  };
}
export function buildPersonReplacementAssetPackageItemRequest({
  project: project = {},
  character: character = {},
  appearance: appearance = {},
  image: image = null,
} = {}) {
  const sourceProjectId = normalizeText(project['id']),
    sourceCharacterId = normalizeText(character['id']),
    sourceAppearanceId = normalizeText(appearance['id']),
    packageName = normalizeText(project['title']) || '未命名人物替换项目',
    text = normalizeText(character['name']) || '未命名人物',
    text2 = normalizeText(appearance['name']) || '基础形象';
  return {
    packageKey: 'person-replacement-project:' + sourceProjectId,
    packageName: packageName,
    category: PERSON_REPLACEMENT_ASSET_PACKAGE_CATEGORY,
    itemKey: 'person-replacement-appearance:' + sourceCharacterId + ':' + sourceAppearanceId,
    itemName: '人物｜' + text + '｜' + text2,
    image: getAppearanceImage(appearance, image),
    metadata: { sourceKind: 'person-replacement-workspace', sourceProjectId: sourceProjectId },
    itemMetadata: {
      sourceKind: 'person-replacement-workspace',
      sourceProjectId: sourceProjectId,
      sourceCharacterId: sourceCharacterId,
      sourceAppearanceId: sourceAppearanceId,
    },
  };
}
export async function savePersonReplacementAppearanceToAssetPackage({
  project: project = {},
  characterId: characterId = '',
  appearanceId: appearanceId = '',
  saveAssetPackageItem: saveAssetPackageItem,
  persistOutputFromUrl: persistOutputFromUrl = null,
} = {}) {
  const characterId2 = normalizeText(characterId),
    appearanceId2 = normalizeText(appearanceId),
    character2 = (Array['isArray'](project['characters']) ? project['characters'] : [])['find'](
      (key) => normalizeText(key?.['id']) === characterId2,
    ),
    appearance2 = (Array['isArray'](character2?.['appearances']) ? character2['appearances'] : [])['find'](
      (index) => normalizeText(index?.['id']) === appearanceId2,
    );
  if (!character2 || !appearance2) throw new Error('当前形象不可加入总素材。');
  if (!normalizeText(appearance2['imageUrl'])) throw new Error('请先生成或上传当前形象。');
  if (typeof saveAssetPackageItem !== 'function') throw new Error('总素材服务尚未初始化。');
  let itemKey = buildPersonReplacementAssetPackageItemRequest({
    project: project,
    character: character2,
    appearance: appearance2,
  });
  const text3 = normalizeText(itemKey['image']?.['imageUrl']),
    enabled = Boolean(
      normalizeText(
        itemKey['image']?.['localPath'] ||
          itemKey['image']?.['originalLocalPath'] ||
          itemKey['image']?.['displayLocalPath'],
      ),
    );
  if (!enabled && /^(?:https?:|blob:|data:)/i['test'](text3) && typeof persistOutputFromUrl === 'function') {
    const response2 = await persistOutputFromUrl(text3, {
      kind: 'image',
      ext: 'png',
      dedupeKey: [
        'person-replacement-asset-package',
        normalizeText(project['id']),
        characterId2,
        appearanceId2,
        text3,
      ]['join'](':'),
    });
    if (response2?.['error']) throw new Error(response2['error']);
    const imageUrl = normalizeText(
      response2?.['displayUrl'] ||
        response2?.['imageUrl'] ||
        response2?.['url'] ||
        response2?.['originalUrl'] ||
        response2?.['thumbUrl'] ||
        response2?.['displayLocalPath'] ||
        response2?.['localPath'],
    );
    if (!imageUrl) throw new Error('保存当前形象失败：缺少稳定图片地址。');
    itemKey = buildPersonReplacementAssetPackageItemRequest({
      project: project,
      character: character2,
      appearance: appearance2,
      image: {
        ...itemKey['image'],
        ...(response2 && typeof response2 === 'object' ? response2 : {}),
        imageUrl: imageUrl,
      },
    });
  }
  const itemCreated = await saveAssetPackageItem(itemKey),
    imageUrl2 = normalizeText(itemCreated?.['imageUrl'] || itemKey['image']?.['imageUrl']);
  return {
    characterId: characterId2,
    appearanceId: appearanceId2,
    imageUrl: imageUrl2,
    totalAssetRef: {
      assetId: normalizeText(itemCreated?.['assetId']),
      itemIndex: Math['max'](0, Math['trunc'](Number(itemCreated?.['itemIndex']) || 0)),
      itemKey: itemKey['itemKey'],
      imageUrl: imageUrl2,
      updatedAt: Date['now'](),
    },
    itemCreated: itemCreated?.['itemCreated'] !== ![],
    request: itemKey,
    result: itemCreated,
  };
}
export function readPersonReplacementLibraryAssets(handler, result = globalThis['console']) {
  if (typeof handler !== 'function') return [];
  try {
    const data = handler();
    return (Array['isArray'](data) ? data : [])['filter']((target) =>
      ['image', 'audio']['includes'](
        normalizeText(target?.['type'] || target?.['mediaKind'])['toLowerCase'](),
      ),
    );
  } catch (source) {
    return (result?.['warn']?.('[replacementStudio] failed to read asset library', source), []);
  }
}
export function createPersonReplacementAppearanceAssetLibraryOperation({
  getProject: getProject,
  setProject: setProject,
  saveAssetPackageItem: saveAssetPackageItem2,
  persistOutputFromUrl: persistOutputFromUrl2,
  showToast: showToast = () => {},
} = {}) {
  const map = new Set();
  return async ({ characterId: characterId = '', appearanceId: appearanceId = '' } = {}) => {
    const project2 = getProject?.() || {},
      text4 = normalizeText(project2['id']),
      next = [text4, normalizeText(characterId), normalizeText(appearanceId)]['join'](':');
    if (map['has'](next)) return null;
    (map['add'](next), showToast('正在将当前形象加入总素材。', 'info'));
    try {
      const imageUrl3 = await savePersonReplacementAppearanceToAssetPackage({
          project: project2,
          characterId: characterId,
          appearanceId: appearanceId,
          saveAssetPackageItem: saveAssetPackageItem2,
          persistOutputFromUrl: persistOutputFromUrl2,
        }),
        args = getProject?.() || {};
      if (normalizeText(args['id']) !== text4) return null;
      let enabled2 = ![];
      const characters = (Array['isArray'](args['characters']) ? args['characters'] : [])['map'](
        (appearances) => {
          if (normalizeText(appearances['id']) !== imageUrl3['characterId']) return appearances;
          return {
            ...appearances,
            appearances: appearances['appearances']['map']((args2) => {
              if (normalizeText(args2['id']) !== imageUrl3['appearanceId']) return args2;
              return (
                (enabled2 = !![]),
                {
                  ...args2,
                  imageUrl: imageUrl3['imageUrl'] || args2['imageUrl'],
                  totalAssetRef: imageUrl3['totalAssetRef'],
                }
              );
            }),
          };
        },
      );
      if (!enabled2) return null;
      const project3 = setProject?.({ ...args, characters: characters });
      return (
        showToast(
          imageUrl3['itemCreated'] ? '当前形象已加入总素材。' : '已更新总素材中的当前形象。',
          'success',
        ),
        {
          project: project3,
          ok: !![],
          assetId: imageUrl3['totalAssetRef']['assetId'],
          itemIndex: imageUrl3['totalAssetRef']['itemIndex'],
        }
      );
    } catch (error) {
      return (showToast(error?.['message'] || '加入总素材失败，请稍后重试。', 'error'), null);
    } finally {
      map['delete'](next);
    }
  };
}
