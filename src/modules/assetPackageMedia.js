import { localPathToUrl } from '../utils/localMediaPath.js';
import { getAutoMediaSizeByShortSide } from '../services/fileService.js';
function normalizeText(_0x13ec3f) {
  return String(_0x13ec3f ?? '')['trim']();
}
function firstText(..._0x3ca405) {
  for (const _0x5f1e07 of _0x3ca405) {
    const _0x28fe3c = normalizeText(_0x5f1e07);
    if (_0x28fe3c) return _0x28fe3c;
  }
  return '';
}
function normalizePositiveDimension(_0x4d742b, _0x462b2c) {
  const _0x2227d4 = Number(_0x4d742b);
  return Number['isFinite'](_0x2227d4) && _0x2227d4 > 0x0
    ? Math['max'](0x1, Math['round'](_0x2227d4))
    : _0x462b2c;
}
function buildImageNode({
  existingNode: existingNode = null,
  itemKey: _0x30c878,
  itemName: _0x3f2bb2,
  image: _0x1b6ad4,
  itemIndex: _0x14e42d,
  itemMetadata: _0x287b19,
  createId: _0x13725d,
}) {
  const _0x23e23d = _0x1b6ad4 && typeof _0x1b6ad4 === 'object' ? _0x1b6ad4 : {},
    _0x38ffe0 = firstText(
      _0x23e23d['localPath'],
      _0x23e23d['originalLocalPath'],
      _0x23e23d['displayLocalPath'],
    ),
    _0x498916 = localPathToUrl(_0x38ffe0),
    _0x2c5fc4 = firstText(
      _0x23e23d['displayUrl'],
      _0x23e23d['imageUrl'],
      _0x23e23d['url'],
      _0x23e23d['src'],
      _0x498916,
      _0x23e23d['sourceUrl'],
      _0x23e23d['originalUrl'],
    ),
    _0x4d237a = firstText(_0x23e23d['sourceUrl'], _0x23e23d['originalUrl'], _0x2c5fc4),
    _0x3163cb = firstText(
      _0x23e23d['thumbUrl'],
      _0x23e23d['thumbnailUrl'],
      _0x23e23d['displayUrl'],
      _0x2c5fc4,
    );
  if (!_0x2c5fc4 && !_0x38ffe0) throw new Error('加入素材包失败：图片缺少可用地址。');
  const _0x24ffd4 = normalizePositiveDimension(
      _0x23e23d['originalWidth'] ||
        _0x23e23d['imageWidth'] ||
        _0x23e23d['naturalWidth'] ||
        _0x23e23d['width'] ||
        _0x23e23d['metadata']?.['width'] ||
        existingNode?.['originalWidth'] ||
        existingNode?.['imageWidth'] ||
        existingNode?.['naturalWidth'] ||
        existingNode?.['width'],
      0x200,
    ),
    _0x3e94e2 = normalizePositiveDimension(
      _0x23e23d['originalHeight'] ||
        _0x23e23d['imageHeight'] ||
        _0x23e23d['naturalHeight'] ||
        _0x23e23d['height'] ||
        _0x23e23d['metadata']?.['height'] ||
        existingNode?.['originalHeight'] ||
        existingNode?.['imageHeight'] ||
        existingNode?.['naturalHeight'] ||
        existingNode?.['height'],
      0x120,
    ),
    _0x5f3211 = getAutoMediaSizeByShortSide(_0x24ffd4, _0x3e94e2),
    _0x2ff4ad = normalizeText(existingNode?.['id']) || _0x13725d('source-image'),
    _0x12b0df = _0x14e42d % 0x4,
    _0x559c52 = Math['floor'](_0x14e42d / 0x4);
  return {
    ...(existingNode && typeof existingNode === 'object' ? existingNode : {}),
    ..._0x23e23d,
    ...(_0x287b19 && typeof _0x287b19 === 'object' ? _0x287b19 : {}),
    id: _0x2ff4ad,
    type: 'source-image',
    name: _0x3f2bb2,
    x: existingNode ? Number(existingNode['x']) || 0x0 : _0x12b0df * 0x228,
    y: existingNode ? Number(existingNode['y']) || 0x0 : _0x559c52 * 0x148,
    width: _0x5f3211['width'],
    height: _0x5f3211['height'],
    fixedSize: existingNode?.['fixedSize'] === !![],
    needsAutoResize: ![],
    src: _0x2c5fc4 || _0x498916,
    imageUrl: _0x2c5fc4 || _0x498916,
    sourceUrl: _0x4d237a,
    thumbUrl: _0x3163cb,
    localPath: _0x38ffe0,
    originalLocalPath: firstText(_0x23e23d['originalLocalPath'], _0x38ffe0),
    displayLocalPath: firstText(_0x23e23d['displayLocalPath']),
    thumbLocalPath: firstText(_0x23e23d['thumbLocalPath']),
    assetPackageItemKey: _0x30c878,
  };
}
function buildAudioNode({
  existingNode: existingNode = null,
  itemKey: _0x1a3f71,
  itemName: _0x2756fe,
  audio: _0x230d93,
  itemIndex: _0x18bcdc,
  itemMetadata: _0x33eef4,
  createId: _0x4abd44,
}) {
  const _0x24b32e = _0x230d93 && typeof _0x230d93 === 'object' ? _0x230d93 : {},
    _0x549d49 = firstText(
      _0x24b32e['localPath'],
      _0x24b32e['originalLocalPath'],
      _0x24b32e['displayLocalPath'],
    ),
    _0x1ee79b = localPathToUrl(_0x549d49),
    _0x2af17f = firstText(
      _0x24b32e['audioUrl'],
      _0x24b32e['displayUrl'],
      _0x24b32e['url'],
      _0x24b32e['src'],
      _0x1ee79b,
      _0x24b32e['sourceUrl'],
      _0x24b32e['originalUrl'],
    );
  if (!_0x2af17f && !_0x549d49) throw new Error('加入素材包失败：音频缺少可用地址。');
  const _0x364926 = normalizeText(existingNode?.['id']) || _0x4abd44('source-audio'),
    _0x591ba6 = _0x18bcdc % 0x4,
    _0x16e523 = Math['floor'](_0x18bcdc / 0x4);
  return {
    ...(existingNode && typeof existingNode === 'object' ? existingNode : {}),
    ..._0x24b32e,
    ...(_0x33eef4 && typeof _0x33eef4 === 'object' ? _0x33eef4 : {}),
    id: _0x364926,
    type: 'source-audio',
    name: _0x2756fe,
    x: existingNode ? Number(existingNode['x']) || 0x0 : _0x591ba6 * 0x168,
    y: existingNode ? Number(existingNode['y']) || 0x0 : _0x16e523 * 0xb4,
    width: normalizePositiveDimension(existingNode?.['width'], 0x140),
    height: normalizePositiveDimension(existingNode?.['height'], 0x8c),
    src: _0x2af17f || _0x1ee79b,
    audioUrl: _0x2af17f || _0x1ee79b,
    sourceUrl: firstText(_0x24b32e['sourceUrl'], _0x24b32e['originalUrl'], _0x2af17f),
    localPath: _0x549d49,
    originalLocalPath: firstText(_0x24b32e['originalLocalPath'], _0x549d49),
    displayLocalPath: firstText(_0x24b32e['displayLocalPath']),
    assetPackageItemKey: _0x1a3f71,
  };
}
function buildAssetItem(_0x4a6251, _0x1d91b, _0x3eacf1) {
  return {
    type: _0x4a6251['type'],
    name: _0x3eacf1,
    thumbSrc: firstText(_0x4a6251['thumbUrl'], _0x4a6251['imageUrl'], _0x4a6251['src']),
    packageItemKey: _0x1d91b,
    nodeData: _0x4a6251,
  };
}
function upsertAssetPackage(
  _0x161943,
  {
    packageKey: packageKey = '',
    packageName: packageName = '',
    category: category = '',
    itemKey: itemKey = '',
    itemName: itemName = '',
    metadata: metadata = null,
    itemMetadata: itemMetadata = null,
  } = {},
  { createId: createId = (_0x2f3453) => _0x2f3453 + '-' + Date['now'](), now: now = Date['now']() } = {},
  _0x27a21b,
) {
  const _0x28c234 = normalizeText(packageKey),
    _0x2a1545 = normalizeText(packageName),
    _0x5db73e = normalizeText(category),
    _0x42fc09 = normalizeText(itemKey),
    _0x4e3598 = normalizeText(itemName);
  if (!_0x28c234) throw new Error('加入素材包失败：缺少素材包标识。');
  if (!_0x2a1545) throw new Error('加入素材包失败：缺少素材包名称。');
  if (!_0x42fc09) throw new Error('加入素材包失败：缺少素材标识。');
  if (!_0x4e3598) throw new Error('加入素材包失败：缺少素材名称。');
  const _0x17ba4 = _0x161943 && typeof _0x161943 === 'object' ? _0x161943 : null,
    _0x2b3a0d = Array['isArray'](_0x17ba4?.['items'])
      ? _0x17ba4['items']['map']((_0x4f4a15) => ({ ..._0x4f4a15 }))
      : [],
    _0x5da466 = Array['isArray'](_0x17ba4?.['nodes'])
      ? _0x17ba4['nodes']['map']((_0xb2224d) => ({ ..._0xb2224d }))
      : _0x2b3a0d['map']((_0x17d02c) => ({ ...(_0x17d02c?.['nodeData'] || {}) })),
    _0x3b65a8 = _0x2b3a0d['findIndex'](
      (_0x2e12ab, _0x5f0146) =>
        normalizeText(_0x2e12ab?.['packageItemKey'] || _0x2e12ab?.['nodeData']?.['assetPackageItemKey']) ===
          _0x42fc09 || normalizeText(_0x5da466[_0x5f0146]?.['assetPackageItemKey']) === _0x42fc09,
    ),
    _0x1be01f = _0x3b65a8 >= 0x0 ? _0x3b65a8 : _0x2b3a0d['length'],
    _0x1cadfd = _0x27a21b({
      existingNode: _0x5da466[_0x1be01f] || _0x2b3a0d[_0x1be01f]?.['nodeData'] || null,
      itemKey: _0x42fc09,
      itemName: _0x4e3598,
      itemIndex: _0x1be01f,
      itemMetadata: itemMetadata,
      createId: createId,
    }),
    _0x339cb1 = buildAssetItem(_0x1cadfd, _0x42fc09, _0x4e3598);
  _0x3b65a8 >= 0x0
    ? ((_0x2b3a0d[_0x1be01f] = _0x339cb1), (_0x5da466[_0x1be01f] = _0x1cadfd))
    : (_0x2b3a0d['push'](_0x339cb1), _0x5da466['push'](_0x1cadfd));
  const _0x4db724 = Number(now) || Date['now'](),
    _0x148e7c = {
      ...(_0x17ba4 || {}),
      id: normalizeText(_0x17ba4?.['id']) || createId('asset'),
      name: _0x2a1545,
      category: _0x5db73e,
      packageKey: _0x28c234,
      packageMetadata: {
        ...(_0x17ba4?.['packageMetadata'] && typeof _0x17ba4['packageMetadata'] === 'object'
          ? _0x17ba4['packageMetadata']
          : {}),
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      },
      coverUrl: firstText(_0x2b3a0d[0x0]?.['thumbSrc'], _0x17ba4?.['coverUrl']),
      coverType: _0x2b3a0d[0x0]?.['type'] || _0x17ba4?.['coverType'] || '',
      items: _0x2b3a0d,
      nodes: _0x5da466,
      edges: Array['isArray'](_0x17ba4?.['edges']) ? _0x17ba4['edges'] : [],
      createdAt: Number(_0x17ba4?.['createdAt'] || _0x17ba4?.['updatedAt'] || _0x4db724) || _0x4db724,
      updatedAt: _0x4db724,
    };
  return {
    asset: _0x148e7c,
    item: _0x339cb1,
    itemIndex: _0x1be01f,
    packageCreated: !_0x17ba4,
    itemCreated: _0x3b65a8 < 0x0,
  };
}
export function upsertImageAssetPackage(_0x5cd2fe, _0x2e860b = {}, _0x50a694 = {}) {
  return upsertAssetPackage(_0x5cd2fe, _0x2e860b, _0x50a694, (_0x4ea597) =>
    buildImageNode({ ..._0x4ea597, image: _0x2e860b['image'] }),
  );
}
function upsertAudioAssetPackage(_0xaaae6a, _0x1629fd = {}, _0xef638d = {}) {
  return upsertAssetPackage(_0xaaae6a, _0x1629fd, _0xef638d, (_0x2dc580) =>
    buildAudioNode({ ..._0x2dc580, audio: _0x1629fd['audio'] }),
  );
}
export function upsertMediaAssetPackage(_0x56f932, _0x3abe76 = {}, _0x4eb1cc = {}) {
  return _0x3abe76?.['audio']
    ? upsertAudioAssetPackage(_0x56f932, _0x3abe76, _0x4eb1cc)
    : upsertImageAssetPackage(_0x56f932, _0x3abe76, _0x4eb1cc);
}
