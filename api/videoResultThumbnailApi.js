import { fetchVideoFirstFrameThumbFromServer } from './videoThumbApi.js';
import { localPathToUrl, pickResultLocalPath, urlToLocalPath } from '../src/utils/localMediaPath.js';
const inflightByFetcher = new WeakMap(),
  IMAGE_THUMBNAIL_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|svg|avif)$/i;
function normalizeText(_0x4eef1a) {
  return String(_0x4eef1a || '')['trim']();
}
function firstText(..._0xcffb03) {
  return _0xcffb03['map'](normalizeText)['find'](Boolean) || '';
}
function resolveThumbnailLocalPath(_0x51fc0e = {}) {
  for (const _0x3c18f3 of [
    _0x51fc0e['posterLocalPath'],
    _0x51fc0e['thumbLocalPath'],
    _0x51fc0e['thumbnailLocalPath'],
    _0x51fc0e['localPath'],
    _0x51fc0e['path'],
    _0x51fc0e['posterUrl'],
    _0x51fc0e['thumbUrl'],
    _0x51fc0e['thumbnailUrl'],
    _0x51fc0e['url'],
  ]) {
    const _0x2e7f24 = pickResultLocalPath(_0x3c18f3);
    if (_0x2e7f24 && IMAGE_THUMBNAIL_EXTENSION_RE['test'](_0x2e7f24)) return _0x2e7f24;
  }
  return '';
}
function getInflightMap(_0x3a742d) {
  let _0x8cc676 = inflightByFetcher['get'](_0x3a742d);
  return (!_0x8cc676 && ((_0x8cc676 = new Map()), inflightByFetcher['set'](_0x3a742d, _0x8cc676)), _0x8cc676);
}
function fetchThumbnailFields(_0x3c0679, _0xfc87c8) {
  const _0x489e02 = getInflightMap(_0xfc87c8),
    _0x165cd5 = _0x489e02['get'](_0x3c0679);
  if (_0x165cd5) return _0x165cd5;
  let _0xecbf1c;
  return (
    (_0xecbf1c = Promise['resolve']()
      ['then'](() => _0xfc87c8(_0x3c0679))
      ['then']((_0x11098b) => {
        const _0x35ca93 = resolveThumbnailLocalPath(_0x11098b);
        if (!_0x35ca93) throw new Error('视频首帧服务未返回本地缩略图');
        const _0x5dd480 = localPathToUrl(_0x35ca93);
        return {
          posterUrl: _0x5dd480,
          thumbUrl: _0x5dd480,
          posterLocalPath: _0x35ca93,
          thumbLocalPath: _0x35ca93,
          videoThumbSrc: _0x3c0679,
        };
      })
      ['finally'](() => {
        if (_0x489e02['get'](_0x3c0679) === _0xecbf1c) _0x489e02['delete'](_0x3c0679);
      })),
    _0x489e02['set'](_0x3c0679, _0xecbf1c),
    _0xecbf1c
  );
}
export function resolveVideoResultThumbnailSource(_0x4307f3 = {}) {
  if (!_0x4307f3 || typeof _0x4307f3 !== 'object' || Array['isArray'](_0x4307f3)) return '';
  for (const _0x941fb5 of [_0x4307f3['localPath'], _0x4307f3['displayLocalPath']]) {
    const _0x224b73 = pickResultLocalPath(_0x941fb5);
    if (_0x224b73) return localPathToUrl(_0x224b73);
  }
  for (const _0x24082d of [_0x4307f3['videoUrl'], _0x4307f3['url'], _0x4307f3['displayUrl']]) {
    const _0x10e550 = urlToLocalPath(_0x24082d);
    if (_0x10e550) return localPathToUrl(_0x10e550);
  }
  return '';
}
export function hasStableVideoResultThumbnail(_0x439f37 = {}) {
  return Boolean(
    resolveThumbnailLocalPath({
      posterLocalPath: _0x439f37?.['posterLocalPath'],
      thumbLocalPath: _0x439f37?.['thumbLocalPath'],
      thumbnailLocalPath: _0x439f37?.['thumbnailLocalPath'],
      posterUrl: _0x439f37?.['posterUrl'],
      thumbUrl: _0x439f37?.['thumbUrl'],
      thumbnailUrl: _0x439f37?.['thumbnailUrl'],
    }),
  );
}
export function needsVideoResultThumbnail(_0x56f898 = {}) {
  return Boolean(resolveVideoResultThumbnailSource(_0x56f898) && !hasStableVideoResultThumbnail(_0x56f898));
}
export async function ensureVideoResultThumbnail(
  _0x4a81bc = {},
  { fetchThumbnail: fetchThumbnail = fetchVideoFirstFrameThumbFromServer } = {},
) {
  if (!needsVideoResultThumbnail(_0x4a81bc)) return _0x4a81bc;
  const _0x324217 = resolveVideoResultThumbnailSource(_0x4a81bc),
    _0x4ffcd2 = await fetchThumbnailFields(_0x324217, fetchThumbnail),
    _0x2eae31 = firstText(_0x4a81bc['thumbUrl'], _0x4a81bc['thumbnailUrl'], _0x4a81bc['posterUrl']),
    _0x2f1289 = firstText(_0x4a81bc['posterUrl'], _0x4a81bc['coverUrl']);
  return {
    ..._0x4a81bc,
    ...(_0x2eae31 && !urlToLocalPath(_0x2eae31)
      ? { sourceThumbUrl: _0x4a81bc['sourceThumbUrl'] || _0x2eae31 }
      : {}),
    ...(_0x2f1289 && !urlToLocalPath(_0x2f1289)
      ? { sourcePosterUrl: _0x4a81bc['sourcePosterUrl'] || _0x2f1289 }
      : {}),
    ..._0x4ffcd2,
  };
}
