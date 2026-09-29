import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
  toCanvasLocalUrl,
} from '../../services/canvasMediaLocalService.js';
import { WHITEBOARD_DEFAULT_SIZE, WHITEBOARD_DEFAULT_VIEW } from './whiteboardNodeData.js';
export const WHITEBOARD_BACKGROUND_SOURCE_TYPES = Object['freeze'](['source-image', 'ai-image']);
const BACKGROUND_SOURCE_TYPE_SET = new Set(WHITEBOARD_BACKGROUND_SOURCE_TYPES);
function normalizeText(_0x70b010) {
  return String(_0x70b010 ?? '')['trim']();
}
function positiveNumber(..._0x528afa) {
  for (const _0x4bab30 of _0x528afa) {
    const _0x5e43c1 = Number(_0x4bab30);
    if (Number['isFinite'](_0x5e43c1) && _0x5e43c1 > 0x0) return _0x5e43c1;
  }
  return 0x0;
}
function resolveAiImagePrimaryItem(_0x189f59) {
  if (normalizeText(_0x189f59?.['type']) !== 'ai-image') return null;
  const _0x55303c = Array['isArray'](_0x189f59?.['images']) ? _0x189f59['images'] : [];
  if (_0x55303c['length'] === 0x0) return null;
  const _0x362954 = Number(_0x189f59?.['mainImageIndex']),
    _0xe72ec3 = Number['isFinite'](_0x362954)
      ? Math['max'](0x0, Math['min'](_0x55303c['length'] - 0x1, Math['trunc'](_0x362954)))
      : 0x0;
  return _0x55303c[_0xe72ec3] || _0x55303c[0x0] || null;
}
function uniqueUrls(_0x428562) {
  return Array['from'](new Set((_0x428562 || [])['map'](normalizeText)['filter'](Boolean)));
}
function resolveRenderableImageSourceGroups(_0xcf805) {
  if (!_0xcf805 || typeof _0xcf805 !== 'object')
    return { previewUrls: [], fullUrls: [], compositionUrls: [], thumbnailCacheRefs: [] };
  const _0x20c996 = Boolean(
      normalizeText(
        _0xcf805['thumbLocalPath'] ||
          _0xcf805['previewLocalPath'] ||
          _0xcf805['thumbnailLocalPath'] ||
          _0xcf805['thumbUrl'] ||
          _0xcf805['previewUrl'] ||
          _0xcf805['thumbnailUrl'],
      ),
    ),
    _0x84c21e = Boolean(normalizeText(_0xcf805['thumbLocalPath'] || _0xcf805['thumbUrl']));
  return {
    previewUrls: _0x20c996
      ? uniqueUrls([
          _0x84c21e ? resolveCanvasImageThumbUrl(_0xcf805) : '',
          toCanvasLocalUrl(_0xcf805['previewLocalPath']),
          toCanvasLocalUrl(_0xcf805['thumbnailLocalPath']),
          _0xcf805['thumbUrl'],
          _0xcf805['previewUrl'],
          _0xcf805['thumbnailUrl'],
        ])
      : [],
    fullUrls: uniqueUrls([
      resolveCanvasImageDisplayUrl(_0xcf805),
      resolveCanvasImageSourceUrl(_0xcf805),
      _0xcf805['displayUrl'],
      _0xcf805['imageUrl'],
      _0xcf805['sourceUrl'],
      _0xcf805['url'],
      _0xcf805['resultUrl'],
      _0xcf805['src'],
    ]),
    compositionUrls: uniqueUrls([
      resolveCanvasImageSourceUrl(_0xcf805),
      toCanvasLocalUrl(_0xcf805['originalLocalPath']),
      _0xcf805['originalUrl'],
      _0xcf805['sourceUrl'],
      _0xcf805['imageUrl'],
      _0xcf805['url'],
      _0xcf805['resultUrl'],
      _0xcf805['src'],
    ]),
    thumbnailCacheRefs: uniqueUrls([
      _0xcf805['localPath'],
      _0xcf805['originalLocalPath'],
      _0xcf805['displayLocalPath'],
      _0xcf805['src'],
      _0xcf805['imageUrl'],
      _0xcf805['sourceUrl'],
    ]),
  };
}
function appendIdentityParts(_0x2b2961, _0x460e4d, _0x53fc6c) {
  if (!_0x53fc6c || typeof _0x53fc6c !== 'object') return;
  [
    'assetId',
    'sourceId',
    'thumbId',
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'url',
    'resultUrl',
    'src',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'previewLocalPath',
    'thumbnailLocalPath',
    'previewUrl',
    'thumbnailUrl',
    'derivativeStatus',
    'generationStartTime',
    'generationDuration',
    'taskId',
    'submitId',
    'mediaTaskId',
    'updatedAt',
  ]['forEach']((_0x3e64c1) => {
    const _0x89eca2 = normalizeText(_0x53fc6c[_0x3e64c1]);
    if (_0x89eca2) _0x2b2961['push'](_0x460e4d + '.' + _0x3e64c1 + '=' + _0x89eca2);
  });
}
function hashIdentity(_0x171c7a) {
  const _0x43afb6 = normalizeText(_0x171c7a);
  let _0x1cf8a7 = 0x1505;
  for (let _0x48a851 = 0x0; _0x48a851 < _0x43afb6['length']; _0x48a851 += 0x1) {
    ((_0x1cf8a7 = ((_0x1cf8a7 << 0x5) + _0x1cf8a7) ^ _0x43afb6['charCodeAt'](_0x48a851)),
      (_0x1cf8a7 >>>= 0x0));
  }
  return _0x1cf8a7['toString'](0x24);
}
function versionLocalImageUrl(_0xb05c96, _0x17d330) {
  const _0x24108e = normalizeText(_0xb05c96);
  if (!_0x24108e || !_0x24108e['startsWith']('/')) return _0x24108e;
  const [_0x34f720, _0x5b3c75 = ''] = _0x24108e['split']('#', 0x2),
    _0x2d4145 = _0x34f720['includes']('?') ? '&' : '?';
  return '' + _0x34f720 + _0x2d4145 + 'aicv=' + hashIdentity(_0x17d330) + (_0x5b3c75 ? '#' + _0x5b3c75 : '');
}
function edgeCreatedAt(_0x4ae84b) {
  const _0x7e15a8 = Number(_0x4ae84b?.['createdAt']);
  return Number['isFinite'](_0x7e15a8) ? _0x7e15a8 : 0x0;
}
function findLatestBackgroundEdge(_0x2ff8c1, _0x324b44, _0x4d9dd6) {
  const _0x13de79 = normalizeText(_0x2ff8c1);
  if (!_0x13de79) return null;
  return (
    Object['values'](_0x4d9dd6 || {})
      ['filter']((_0x3b018e) => {
        if (normalizeText(_0x3b018e?.['targetId']) !== _0x13de79) return ![];
        const _0x2dfc76 = _0x324b44?.[_0x3b018e?.['sourceId']];
        return BACKGROUND_SOURCE_TYPE_SET['has'](normalizeText(_0x2dfc76?.['type']));
      })
      ['sort']((_0x336374, _0x53dabb) => {
        const _0x2e4ca3 = edgeCreatedAt(_0x336374) - edgeCreatedAt(_0x53dabb);
        if (_0x2e4ca3 !== 0x0) return _0x2e4ca3;
        return normalizeText(_0x336374?.['id'])['localeCompare'](normalizeText(_0x53dabb?.['id']));
      })
      ['at'](-0x1) || null
  );
}
export function isWhiteboardBackgroundSourceType(_0x9b0d55) {
  return BACKGROUND_SOURCE_TYPE_SET['has'](normalizeText(_0x9b0d55));
}
export function resolveWhiteboardBackgroundInput({
  whiteboardId: _0x40e767,
  nodes: _0xebbb57,
  edges: _0x6bad15,
} = {}) {
  const _0x48d155 = findLatestBackgroundEdge(_0x40e767, _0xebbb57, _0x6bad15);
  if (!_0x48d155) return null;
  const _0x478c28 = _0xebbb57?.[_0x48d155['sourceId']];
  if (!_0x478c28) return null;
  const _0x50b367 = resolveAiImagePrimaryItem(_0x478c28),
    _0x37f0f2 = _0x50b367 || _0x478c28,
    _0x4497ea = resolveRenderableImageSourceGroups(_0x37f0f2),
    _0x367edf = resolveRenderableImageSourceGroups(_0x478c28),
    _0xd985f4 = uniqueUrls([..._0x4497ea['previewUrls'], ..._0x367edf['previewUrls']]),
    _0x43c5a5 = uniqueUrls([..._0x4497ea['fullUrls'], ..._0x367edf['fullUrls']]),
    _0x16b130 = uniqueUrls([..._0x4497ea['compositionUrls'], ..._0x367edf['compositionUrls']]),
    _0x31dbe4 = uniqueUrls([..._0x4497ea['thumbnailCacheRefs'], ..._0x367edf['thumbnailCacheRefs']]),
    _0x531c99 = uniqueUrls([..._0x43c5a5, ..._0xd985f4]),
    _0x177ef = _0x531c99[0x0] || '',
    _0x3e78a0 = [
      'edge=' + normalizeText(_0x48d155['id']),
      'edgeCreatedAt=' + edgeCreatedAt(_0x48d155),
      'node=' + normalizeText(_0x478c28['id']),
      'type=' + normalizeText(_0x478c28['type']),
      'mainImageIndex=' + normalizeText(_0x478c28['mainImageIndex']),
    ];
  (appendIdentityParts(_0x3e78a0, 'node', _0x478c28), appendIdentityParts(_0x3e78a0, 'primary', _0x50b367));
  const _0x13144b = _0x3e78a0['join']('|'),
    _0x271470 = _0xd985f4['map']((_0x4f3b60) => versionLocalImageUrl(_0x4f3b60, _0x13144b)),
    _0x99bb0c = _0x43c5a5['map']((_0x163efe) => versionLocalImageUrl(_0x163efe, _0x13144b)),
    _0x2d2a2e = _0x16b130['map']((_0x45386f) => versionLocalImageUrl(_0x45386f, _0x13144b)),
    _0x17a24d = uniqueUrls([..._0x99bb0c, ..._0x271470]),
    _0x12ffa9 = positiveNumber(
      _0x37f0f2?.['originalWidth'],
      _0x37f0f2?.['imageWidth'],
      _0x37f0f2?.['naturalWidth'],
      _0x478c28['originalWidth'],
      _0x478c28['imageWidth'],
      _0x478c28['naturalWidth'],
    ),
    _0x152b52 = positiveNumber(
      _0x37f0f2?.['originalHeight'],
      _0x37f0f2?.['imageHeight'],
      _0x37f0f2?.['naturalHeight'],
      _0x478c28['originalHeight'],
      _0x478c28['imageHeight'],
      _0x478c28['naturalHeight'],
    ),
    _0x3324bc = Array['from'](
      new Set([_0x37f0f2?.['thumbId'], _0x478c28['thumbId']]['map'](normalizeText)['filter'](Boolean)),
    );
  return {
    edgeId: normalizeText(_0x48d155['id']),
    sourceId: normalizeText(_0x478c28['id']),
    sourceType: normalizeText(_0x478c28['type']),
    identity: _0x13144b,
    url: _0x17a24d[0x0] || '',
    urls: _0x17a24d,
    previewUrls: _0x271470,
    fullUrls: _0x99bb0c,
    compositionUrls: _0x2d2a2e,
    rawUrl: _0x177ef,
    width: _0x12ffa9,
    height: _0x152b52,
    thumbIds: _0x3324bc,
    thumbnailCacheRefs: _0x31dbe4,
  };
}
export function getWhiteboardBackgroundInputSignature(_0x5cbae7) {
  if (!_0x5cbae7) return '';
  return [
    _0x5cbae7['identity'],
    ...(_0x5cbae7['previewUrls'] || []),
    ...(_0x5cbae7['fullUrls'] || _0x5cbae7['urls'] || []),
    ...(_0x5cbae7['compositionUrls'] || []),
    _0x5cbae7['width'],
    _0x5cbae7['height'],
    ..._0x5cbae7['thumbIds'],
    ...(_0x5cbae7['thumbnailCacheRefs'] || []),
  ]['join']('|');
}
export function getWhiteboardBackgroundWorldRect({
  imageWidth: _0x6d5075,
  imageHeight: _0x17fe51,
  frameWidth: _0x23db4d,
  frameHeight: _0x1ee075,
} = {}) {
  const _0x29cb60 = positiveNumber(
      _0x23db4d,
      WHITEBOARD_DEFAULT_SIZE['width'] / WHITEBOARD_DEFAULT_VIEW['zoom'],
    ),
    _0x1ca97f = positiveNumber(
      _0x1ee075,
      WHITEBOARD_DEFAULT_SIZE['height'] / WHITEBOARD_DEFAULT_VIEW['zoom'],
    ),
    _0x112bff = positiveNumber(_0x6d5075, _0x29cb60),
    _0x420947 = positiveNumber(_0x17fe51, _0x1ca97f),
    _0x174ad0 = Math['min'](_0x29cb60 / _0x112bff, _0x1ca97f / _0x420947),
    _0x547882 = _0x112bff * _0x174ad0,
    _0x1562b9 = _0x420947 * _0x174ad0;
  return {
    x: (_0x29cb60 - _0x547882) / 0x2,
    y: (_0x1ca97f - _0x1562b9) / 0x2,
    width: _0x547882,
    height: _0x1562b9,
  };
}
export function drawWhiteboardBackgroundImage({
  ctx: _0x5aaf61,
  image: _0xfdd1d5,
  viewport: _0x4ad5da,
  imageWidth: _0x711bc1,
  imageHeight: _0x11e8da,
  frameWidth: _0x37ed48,
  frameHeight: _0x13ae22,
} = {}) {
  if (!_0x5aaf61 || !_0xfdd1d5 || !_0x4ad5da) return ![];
  const _0x4916d0 = Number(_0x4ad5da['zoom']);
  if (!Number['isFinite'](_0x4916d0) || _0x4916d0 <= 0x0) return ![];
  const _0x24a126 = getWhiteboardBackgroundWorldRect({
      imageWidth: _0x711bc1,
      imageHeight: _0x11e8da,
      frameWidth: _0x37ed48,
      frameHeight: _0x13ae22,
    }),
    _0x4a67bb = (_0x24a126['x'] - Number(_0x4ad5da['x'] || 0x0)) * _0x4916d0,
    _0x19683b = (_0x24a126['y'] - Number(_0x4ad5da['y'] || 0x0)) * _0x4916d0;
  return (
    _0x5aaf61['save'](),
    (_0x5aaf61['globalAlpha'] = 0x1),
    _0x5aaf61['drawImage'](
      _0xfdd1d5,
      _0x4a67bb,
      _0x19683b,
      _0x24a126['width'] * _0x4916d0,
      _0x24a126['height'] * _0x4916d0,
    ),
    _0x5aaf61['restore'](),
    !![]
  );
}
export function getWhiteboardSizeForBackground({
  imageWidth: _0x126ba9,
  imageHeight: _0x370806,
  currentWidth: currentWidth = WHITEBOARD_DEFAULT_SIZE['width'],
  currentHeight: currentHeight = WHITEBOARD_DEFAULT_SIZE['height'],
  minWidth: minWidth = 0x1,
  minHeight: minHeight = 0x1,
} = {}) {
  const _0x161092 = positiveNumber(_0x126ba9),
    _0x139a13 = positiveNumber(_0x370806);
  if (!_0x161092 || !_0x139a13) return null;
  const _0x7fc973 = positiveNumber(currentWidth, WHITEBOARD_DEFAULT_SIZE['width']),
    _0x43f97c = positiveNumber(currentHeight, WHITEBOARD_DEFAULT_SIZE['height']),
    _0x53f2c2 = positiveNumber(minWidth, 0x1),
    _0x3916a1 = positiveNumber(minHeight, 0x1),
    _0x12c9ce = Math['max'](_0x7fc973 * _0x43f97c, _0x53f2c2 * _0x3916a1),
    _0x49d639 = _0x161092 / _0x139a13;
  let _0x2e4a0a = Math['sqrt'](_0x12c9ce * _0x49d639),
    _0x21e351 = _0x2e4a0a / _0x49d639;
  const _0x286549 = Math['max'](0x1, _0x53f2c2 / _0x2e4a0a, _0x3916a1 / _0x21e351);
  return (
    (_0x2e4a0a *= _0x286549),
    (_0x21e351 *= _0x286549),
    { width: Math['max'](0x1, Math['round'](_0x2e4a0a)), height: Math['max'](0x1, Math['round'](_0x21e351)) }
  );
}
