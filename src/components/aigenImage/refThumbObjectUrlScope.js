import { revokeTrackedMediaObjectUrl } from '../../services/mediaObjectUrlRegistry.js';
import { scheduleStoredThumbObjectUrl } from './storedThumbObjectUrl.js';
export function collectCurrentRefThumbIds(value, item, handler) {
  const key = new Set();
  for (const index of value || []) {
    const result = item?.[index?.['sourceId']];
    for (const data of handler(result)) key['add'](data);
  }
  return key;
}
export function syncRefThumbObjectUrlScope(options, target, source, next) {
  const map = collectCurrentRefThumbIds(target, source, next);
  options['_activeRefThumbIds'] = map;
  !(options['_refThumbObjectUrls'] instanceof Map) && (options['_refThumbObjectUrls'] = new Map());
  for (const [current, entry] of options['_refThumbObjectUrls']['entries']()) {
    if (map['has'](current)) continue;
    (String(entry || '')['startsWith']('blob:') && revokeTrackedMediaObjectUrl(entry),
      options['_refThumbObjectUrls']['delete'](current));
  }
  return map;
}
export function scheduleCurrentRefThumbObjectUrl(
  objectUrls,
  record,
  { store: store, getImage: getImage, collectRefThumbIds: collectRefThumbIds },
) {
  if (!objectUrls['_refThumbObjectUrlLoads']) objectUrls['_refThumbObjectUrlLoads'] = new Map();
  const thumbId = String(record || '')['trim'](),
    payload = Number(objectUrls['_imageObjectUrlLifecycleEpoch']) || 0x0;
  scheduleStoredThumbObjectUrl({
    thumbId: thumbId,
    objectUrls: objectUrls['_refThumbObjectUrls'],
    pendingLoads: objectUrls['_refThumbObjectUrlLoads'],
    getImage: getImage,
    onResolved: () => objectUrls['refBarEl'] && objectUrls['_renderRefBar'](),
    ownerId: 'ai-image:' + objectUrls['nodeId'] + ':ref-thumb',
    isCurrent: () => {
      if (
        objectUrls['_imageObjectUrlsDisposed'] === !![] ||
        (Number(objectUrls['_imageObjectUrlLifecycleEpoch']) || 0x0) !== payload
      )
        return ![];
      const handle = objectUrls['_getStoreStateForRead']();
      return collectCurrentRefThumbIds(
        store['getIncomingEdges'](objectUrls['nodeId']),
        handle?.['nodes'] || {},
        collectRefThumbIds,
      )['has'](thumbId);
    },
  });
}
