import { localPathToUrl } from '../utils/localMediaPath.js';
const getPrimaryImageItem = (options = {}) => {
    const value = Array['isArray'](options?.['images']) ? options['images'] : [],
      item = Number['isInteger'](Number(options?.['mainImageIndex']))
        ? Number(options['mainImageIndex'])
        : 0x0;
    return value[item] || null;
  },
  firstLocalUrl = (key) => {
    for (const index of key) {
      const url = localPathToUrl(index);
      if (url) return url;
    }
    return '';
  },
  firstRawUrl = (result) => {
    for (const data of result) {
      const target = String(data || '')['trim']();
      if (target) return target;
    }
    return '';
  };
export function resolveImageNodePreviewUrl(options2 = {}) {
  const primaryImageItem = getPrimaryImageItem(options2);
  return (
    firstLocalUrl([
      options2['displayLocalPath'],
      primaryImageItem?.['displayLocalPath'],
      options2['previewLocalPath'],
      primaryImageItem?.['previewLocalPath'],
    ]) ||
    firstRawUrl([
      options2['displayUrl'],
      primaryImageItem?.['displayUrl'],
      options2['previewUrl'],
      primaryImageItem?.['previewUrl'],
    ])
  );
}
export function resolveImageNodeDisplayUrl(options3 = {}) {
  const primaryImageItem2 = getPrimaryImageItem(options3);
  return (
    resolveImageNodePreviewUrl(options3) ||
    firstLocalUrl([
      options3['thumbLocalPath'],
      primaryImageItem2?.['thumbLocalPath'],
      options3['thumbnailLocalPath'],
      primaryImageItem2?.['thumbnailLocalPath'],
    ]) ||
    firstRawUrl([
      options3['thumbUrl'],
      primaryImageItem2?.['thumbUrl'],
      options3['thumbnailUrl'],
      primaryImageItem2?.['thumbnailUrl'],
    ])
  );
}
export function resolveImageNodeOriginalUrl(options4 = {}) {
  const primaryImageItem3 = getPrimaryImageItem(options4);
  return (
    firstLocalUrl([
      options4['originalLocalPath'],
      primaryImageItem3?.['originalLocalPath'],
      options4['localPath'],
      primaryImageItem3?.['localPath'],
    ]) ||
    firstRawUrl([
      options4['src'],
      primaryImageItem3?.['src'],
      options4['sourceUrl'],
      primaryImageItem3?.['sourceUrl'],
      options4['imageUrl'],
      primaryImageItem3?.['imageUrl'],
      options4['displayUrl'],
      primaryImageItem3?.['displayUrl'],
      options4['thumbUrl'],
      primaryImageItem3?.['thumbUrl'],
    ])
  );
}
export function resolveImageNodeUrl(options5 = {}, { preferPreview: preferPreview = ![] } = {}) {
  const imageNodeDisplayUrl = resolveImageNodeDisplayUrl(options5),
    imageNodeOriginalUrl = resolveImageNodeOriginalUrl(options5);
  return preferPreview
    ? imageNodeDisplayUrl || imageNodeOriginalUrl
    : imageNodeOriginalUrl || imageNodeDisplayUrl;
}
