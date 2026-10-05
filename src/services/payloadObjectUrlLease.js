import { createTrackedMediaObjectUrl, revokeTrackedMediaObjectUrl } from './mediaObjectUrlRegistry.js';
const urlsByPayload = new WeakMap();
function releaseUrls(map) {
  let value = 0;
  for (const item of map || []) {
    if (revokeTrackedMediaObjectUrl(item)) value += 1;
  }
  return (map?.['clear']?.(), value);
}
export function createPayloadObjectUrlLease({ ownerId: ownerId = '', kind: kind = 'image' } = {}) {
  let key = new Set();
  return {
    create(index, { sourceUrl: sourceUrl = '', kind: kind2 = kind } = {}) {
      const trackedMediaObjectUrl = createTrackedMediaObjectUrl(index, {
        kind: kind2,
        ownerId: ownerId,
        sourceUrl: sourceUrl,
      });
      if (trackedMediaObjectUrl) key['add'](trackedMediaObjectUrl);
      return trackedMediaObjectUrl;
    },
    bind(enabled) {
      if (!enabled || typeof enabled !== 'object' || key['size'] === 0) return enabled;
      const result = urlsByPayload['get'](enabled) || new Set();
      for (const data of key) result['add'](data);
      return (urlsByPayload['set'](enabled, result), (key = new Set()), enabled);
    },
    release() {
      return releaseUrls(key);
    },
  };
}
export function releasePayloadObjectUrlLease(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return 0;
  const enabled3 = urlsByPayload['get'](enabled2);
  if (!enabled3) return 0;
  return (urlsByPayload['delete'](enabled2), releaseUrls(enabled3));
}
