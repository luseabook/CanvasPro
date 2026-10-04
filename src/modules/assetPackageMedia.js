import { localPathToUrl } from '../utils/localMediaPath.js';
import { getAutoMediaSizeByShortSide } from '../services/fileService.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function firstText(...candidates) {
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) return normalized;
  }
  return '';
}
function normalizePositiveDimension(raw, fallback) {
  const numeric = Number(raw);
  return Number['isFinite'](numeric) && numeric > 0x0 ? Math['max'](0x1, Math['round'](numeric)) : fallback;
}
function buildImageNode({
  existingNode: existingNode = null,
  itemKey: itemKey,
  itemName: itemName,
  image: image,
  itemIndex: itemIndex,
  itemMetadata: itemMetadata,
  createId: createId,
}) {
  const source = image && typeof image === 'object' ? image : {},
    localPath = firstText(source['localPath'], source['originalLocalPath'], source['displayLocalPath']),
    localUrl = localPathToUrl(localPath),
    primaryUrl = firstText(
      source['displayUrl'],
      source['imageUrl'],
      source['url'],
      source['src'],
      localUrl,
      source['sourceUrl'],
      source['originalUrl'],
    ),
    sourceUrl = firstText(source['sourceUrl'], source['originalUrl'], primaryUrl),
    thumbUrl = firstText(source['thumbUrl'], source['thumbnailUrl'], source['displayUrl'], primaryUrl);
  if (!primaryUrl && !localPath) throw new Error('加入素材包失败：图片缺少可用地址。');
  const width = normalizePositiveDimension(
      source['originalWidth'] ||
        source['imageWidth'] ||
        source['naturalWidth'] ||
        source['width'] ||
        source['metadata']?.['width'] ||
        existingNode?.['originalWidth'] ||
        existingNode?.['imageWidth'] ||
        existingNode?.['naturalWidth'] ||
        existingNode?.['width'],
      0x200,
    ),
    height = normalizePositiveDimension(
      source['originalHeight'] ||
        source['imageHeight'] ||
        source['naturalHeight'] ||
        source['height'] ||
        source['metadata']?.['height'] ||
        existingNode?.['originalHeight'] ||
        existingNode?.['imageHeight'] ||
        existingNode?.['naturalHeight'] ||
        existingNode?.['height'],
      0x120,
    ),
    autoSize = getAutoMediaSizeByShortSide(width, height),
    nodeId = normalizeText(existingNode?.['id']) || createId('source-image'),
    column = itemIndex % 0x4,
    row = Math['floor'](itemIndex / 0x4);
  return {
    ...(existingNode && typeof existingNode === 'object' ? existingNode : {}),
    ...source,
    ...(itemMetadata && typeof itemMetadata === 'object' ? itemMetadata : {}),
    id: nodeId,
    type: 'source-image',
    name: itemName,
    x: existingNode ? Number(existingNode['x']) || 0x0 : column * 0x228,
    y: existingNode ? Number(existingNode['y']) || 0x0 : row * 0x148,
    width: autoSize['width'],
    height: autoSize['height'],
    fixedSize: existingNode?.['fixedSize'] === !![],
    needsAutoResize: ![],
    src: primaryUrl || localUrl,
    imageUrl: primaryUrl || localUrl,
    sourceUrl: sourceUrl,
    thumbUrl: thumbUrl,
    localPath: localPath,
    originalLocalPath: firstText(source['originalLocalPath'], localPath),
    displayLocalPath: firstText(source['displayLocalPath']),
    thumbLocalPath: firstText(source['thumbLocalPath']),
    assetPackageItemKey: itemKey,
  };
}
function buildAudioNode({
  existingNode: existingNode = null,
  itemKey: itemKey,
  itemName: itemName,
  audio: audio,
  itemIndex: itemIndex,
  itemMetadata: itemMetadata,
  createId: createId,
}) {
  const source = audio && typeof audio === 'object' ? audio : {},
    localPath = firstText(source['localPath'], source['originalLocalPath'], source['displayLocalPath']),
    localUrl = localPathToUrl(localPath),
    primaryUrl = firstText(
      source['audioUrl'],
      source['displayUrl'],
      source['url'],
      source['src'],
      localUrl,
      source['sourceUrl'],
      source['originalUrl'],
    );
  if (!primaryUrl && !localPath) throw new Error('加入素材包失败：音频缺少可用地址。');
  const nodeId = normalizeText(existingNode?.['id']) || createId('source-audio'),
    column = itemIndex % 0x4,
    row = Math['floor'](itemIndex / 0x4);
  return {
    ...(existingNode && typeof existingNode === 'object' ? existingNode : {}),
    ...source,
    ...(itemMetadata && typeof itemMetadata === 'object' ? itemMetadata : {}),
    id: nodeId,
    type: 'source-audio',
    name: itemName,
    x: existingNode ? Number(existingNode['x']) || 0x0 : column * 0x168,
    y: existingNode ? Number(existingNode['y']) || 0x0 : row * 0xb4,
    width: normalizePositiveDimension(existingNode?.['width'], 0x140),
    height: normalizePositiveDimension(existingNode?.['height'], 0x8c),
    src: primaryUrl || localUrl,
    audioUrl: primaryUrl || localUrl,
    sourceUrl: firstText(source['sourceUrl'], source['originalUrl'], primaryUrl),
    localPath: localPath,
    originalLocalPath: firstText(source['originalLocalPath'], localPath),
    displayLocalPath: firstText(source['displayLocalPath']),
    assetPackageItemKey: itemKey,
  };
}
function buildAssetItem(nodeData, packageItemKey, name) {
  return {
    type: nodeData['type'],
    name: name,
    thumbSrc: firstText(nodeData['thumbUrl'], nodeData['imageUrl'], nodeData['src']),
    packageItemKey: packageItemKey,
    nodeData: nodeData,
  };
}
function upsertAssetPackage(
  existingPackage,
  {
    packageKey: packageKey = '',
    packageName: packageName = '',
    category: category = '',
    itemKey: itemKey = '',
    itemName: itemName = '',
    metadata: metadata = null,
    itemMetadata: itemMetadata = null,
  } = {},
  { createId: createId = (prefix) => prefix + '-' + Date['now'](), now: now = Date['now']() } = {},
  buildNode,
) {
  const normalizedPackageKey = normalizeText(packageKey),
    normalizedPackageName = normalizeText(packageName),
    normalizedCategory = normalizeText(category),
    normalizedItemKey = normalizeText(itemKey),
    normalizedItemName = normalizeText(itemName);
  if (!normalizedPackageKey) throw new Error('加入素材包失败：缺少素材包标识。');
  if (!normalizedPackageName) throw new Error('加入素材包失败：缺少素材包名称。');
  if (!normalizedItemKey) throw new Error('加入素材包失败：缺少素材标识。');
  if (!normalizedItemName) throw new Error('加入素材包失败：缺少素材名称。');
  const basePackage = existingPackage && typeof existingPackage === 'object' ? existingPackage : null,
    items = Array['isArray'](basePackage?.['items'])
      ? basePackage['items']['map']((entry) => ({ ...entry }))
      : [],
    nodes = Array['isArray'](basePackage?.['nodes'])
      ? basePackage['nodes']['map']((entry) => ({ ...entry }))
      : items['map']((entry) => ({ ...(entry?.['nodeData'] || {}) })),
    existingIndex = items['findIndex'](
      (item, index) =>
        normalizeText(item?.['packageItemKey'] || item?.['nodeData']?.['assetPackageItemKey']) ===
          normalizedItemKey || normalizeText(nodes[index]?.['assetPackageItemKey']) === normalizedItemKey,
    ),
    targetIndex = existingIndex >= 0x0 ? existingIndex : items['length'],
    node = buildNode({
      existingNode: nodes[targetIndex] || items[targetIndex]?.['nodeData'] || null,
      itemKey: normalizedItemKey,
      itemName: normalizedItemName,
      itemIndex: targetIndex,
      itemMetadata: itemMetadata,
      createId: createId,
    }),
    item = buildAssetItem(node, normalizedItemKey, normalizedItemName);
  existingIndex >= 0x0
    ? ((items[targetIndex] = item), (nodes[targetIndex] = node))
    : (items['push'](item), nodes['push'](node));
  const timestamp = Number(now) || Date['now'](),
    assetPackage = {
      ...(basePackage || {}),
      id: normalizeText(basePackage?.['id']) || createId('asset'),
      name: normalizedPackageName,
      category: normalizedCategory,
      packageKey: normalizedPackageKey,
      packageMetadata: {
        ...(basePackage?.['packageMetadata'] && typeof basePackage['packageMetadata'] === 'object'
          ? basePackage['packageMetadata']
          : {}),
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      },
      coverUrl: firstText(items[0x0]?.['thumbSrc'], basePackage?.['coverUrl']),
      coverType: items[0x0]?.['type'] || basePackage?.['coverType'] || '',
      items: items,
      nodes: nodes,
      edges: Array['isArray'](basePackage?.['edges']) ? basePackage['edges'] : [],
      createdAt: Number(basePackage?.['createdAt'] || basePackage?.['updatedAt'] || timestamp) || timestamp,
      updatedAt: timestamp,
    };
  return {
    asset: assetPackage,
    item: item,
    itemIndex: targetIndex,
    packageCreated: !basePackage,
    itemCreated: existingIndex < 0x0,
  };
}
export function upsertImageAssetPackage(existingPackage, options = {}, dependencies = {}) {
  return upsertAssetPackage(existingPackage, options, dependencies, (params) =>
    buildImageNode({ ...params, image: options['image'] }),
  );
}
function upsertAudioAssetPackage(existingPackage, options = {}, dependencies = {}) {
  return upsertAssetPackage(existingPackage, options, dependencies, (params) =>
    buildAudioNode({ ...params, audio: options['audio'] }),
  );
}
export function upsertMediaAssetPackage(existingPackage, options = {}, dependencies = {}) {
  return options?.['audio']
    ? upsertAudioAssetPackage(existingPackage, options, dependencies)
    : upsertImageAssetPackage(existingPackage, options, dependencies);
}
