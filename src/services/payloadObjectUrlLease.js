import { createTrackedMediaObjectUrl, revokeTrackedMediaObjectUrl } from './mediaObjectUrlRegistry.js';
const urlsByPayload = new WeakMap();
function releaseUrls(_0xc2c6de) {
  let _0x5927c2 = 0x0;
  for (const _0x1f74b6 of _0xc2c6de || []) {
    if (revokeTrackedMediaObjectUrl(_0x1f74b6)) _0x5927c2 += 0x1;
  }
  return (_0xc2c6de?.['clear']?.(), _0x5927c2);
}
export function createPayloadObjectUrlLease({ ownerId: ownerId = '', kind: kind = 'image' } = {}) {
  let _0x20334a = new Set();
  return {
    create(_0xfec12b, { sourceUrl: sourceUrl = '', kind: _0x10c7e1 = kind } = {}) {
      const _0x3eb3ef = createTrackedMediaObjectUrl(_0xfec12b, {
        kind: _0x10c7e1,
        ownerId: ownerId,
        sourceUrl: sourceUrl,
      });
      if (_0x3eb3ef) _0x20334a['add'](_0x3eb3ef);
      return _0x3eb3ef;
    },
    bind(_0x3a7849) {
      if (!_0x3a7849 || typeof _0x3a7849 !== 'object' || _0x20334a['size'] === 0x0) return _0x3a7849;
      const _0x1c8937 = urlsByPayload['get'](_0x3a7849) || new Set();
      for (const _0x2ff346 of _0x20334a) _0x1c8937['add'](_0x2ff346);
      return (urlsByPayload['set'](_0x3a7849, _0x1c8937), (_0x20334a = new Set()), _0x3a7849);
    },
    release() {
      return releaseUrls(_0x20334a);
    },
  };
}
export function releasePayloadObjectUrlLease(_0x586917) {
  if (!_0x586917 || typeof _0x586917 !== 'object') return 0x0;
  const _0x51a8b1 = urlsByPayload['get'](_0x586917);
  if (!_0x51a8b1) return 0x0;
  return (urlsByPayload['delete'](_0x586917), releaseUrls(_0x51a8b1));
}
