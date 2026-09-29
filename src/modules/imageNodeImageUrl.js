import { localPathToUrl } from '../utils/localMediaPath.js';
const getPrimaryImageItem = (_0x23358c = {}) => {
    const _0x59ccdc = Array['isArray'](_0x23358c?.['images']) ? _0x23358c['images'] : [],
      _0x3706e8 = Number['isInteger'](Number(_0x23358c?.['mainImageIndex']))
        ? Number(_0x23358c['mainImageIndex'])
        : 0x0;
    return _0x59ccdc[_0x3706e8] || null;
  },
  firstLocalUrl = (_0x7af0a4) => {
    for (const _0x52de24 of _0x7af0a4) {
      const _0x1fe57f = localPathToUrl(_0x52de24);
      if (_0x1fe57f) return _0x1fe57f;
    }
    return '';
  },
  firstRawUrl = (_0x2670bd) => {
    for (const _0x2caa30 of _0x2670bd) {
      const _0x3a9f94 = String(_0x2caa30 || '')['trim']();
      if (_0x3a9f94) return _0x3a9f94;
    }
    return '';
  };
export function resolveImageNodePreviewUrl(_0x5d6e7a = {}) {
  const _0x5b8fce = getPrimaryImageItem(_0x5d6e7a);
  return (
    firstLocalUrl([
      _0x5d6e7a['displayLocalPath'],
      _0x5b8fce?.['displayLocalPath'],
      _0x5d6e7a['previewLocalPath'],
      _0x5b8fce?.['previewLocalPath'],
    ]) ||
    firstRawUrl([
      _0x5d6e7a['displayUrl'],
      _0x5b8fce?.['displayUrl'],
      _0x5d6e7a['previewUrl'],
      _0x5b8fce?.['previewUrl'],
    ])
  );
}
export function resolveImageNodeDisplayUrl(_0xae49c7 = {}) {
  const _0x24b1db = getPrimaryImageItem(_0xae49c7);
  return (
    resolveImageNodePreviewUrl(_0xae49c7) ||
    firstLocalUrl([
      _0xae49c7['thumbLocalPath'],
      _0x24b1db?.['thumbLocalPath'],
      _0xae49c7['thumbnailLocalPath'],
      _0x24b1db?.['thumbnailLocalPath'],
    ]) ||
    firstRawUrl([
      _0xae49c7['thumbUrl'],
      _0x24b1db?.['thumbUrl'],
      _0xae49c7['thumbnailUrl'],
      _0x24b1db?.['thumbnailUrl'],
    ])
  );
}
export function resolveImageNodeOriginalUrl(_0x4d28cc = {}) {
  const _0x53273b = getPrimaryImageItem(_0x4d28cc);
  return (
    firstLocalUrl([
      _0x4d28cc['originalLocalPath'],
      _0x53273b?.['originalLocalPath'],
      _0x4d28cc['localPath'],
      _0x53273b?.['localPath'],
    ]) ||
    firstRawUrl([
      _0x4d28cc['src'],
      _0x53273b?.['src'],
      _0x4d28cc['sourceUrl'],
      _0x53273b?.['sourceUrl'],
      _0x4d28cc['imageUrl'],
      _0x53273b?.['imageUrl'],
      _0x4d28cc['displayUrl'],
      _0x53273b?.['displayUrl'],
      _0x4d28cc['thumbUrl'],
      _0x53273b?.['thumbUrl'],
    ])
  );
}
export function resolveImageNodeUrl(_0x40759e = {}, { preferPreview: preferPreview = ![] } = {}) {
  const _0x5665f7 = resolveImageNodeDisplayUrl(_0x40759e),
    _0x2fcfc8 = resolveImageNodeOriginalUrl(_0x40759e);
  return preferPreview ? _0x5665f7 || _0x2fcfc8 : _0x2fcfc8 || _0x5665f7;
}
