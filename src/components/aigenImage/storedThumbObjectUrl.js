import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
} from '../../services/mediaObjectUrlRegistry.js';
export function scheduleStoredThumbObjectUrl({
  thumbId: thumbId,
  objectUrls: objectUrls,
  pendingLoads: pendingLoads,
  getImage: getImage,
  onResolved: onResolved,
  ownerId: ownerId = '',
  isCurrent: isCurrent = () => true,
}) {
  const sourceUrl = String(thumbId || '')['trim']();
  if (!sourceUrl || objectUrls['has'](sourceUrl) || pendingLoads['has'](sourceUrl)) return;
  let trackedMediaObjectUrl = '';
  const value = Promise['resolve']()
    ['then'](() => getImage(sourceUrl))
    ['then']((enabled) => {
      if (!enabled || objectUrls['has'](sourceUrl)) return '';
      trackedMediaObjectUrl = createTrackedMediaObjectUrl(enabled, {
        kind: 'image',
        ownerId: ownerId,
        sourceUrl: sourceUrl,
      });
      if (!trackedMediaObjectUrl) return '';
      if (!isCurrent() || objectUrls['has'](sourceUrl))
        return (revokeTrackedMediaObjectUrl(trackedMediaObjectUrl), (trackedMediaObjectUrl = ''), '');
      return (objectUrls['set'](sourceUrl, trackedMediaObjectUrl), trackedMediaObjectUrl);
    })
    ['catch'](() => '')
    ['finally'](() => {
      pendingLoads['delete'](sourceUrl);
      if (!trackedMediaObjectUrl) return;
      if (!isCurrent() || objectUrls['get'](sourceUrl) !== trackedMediaObjectUrl) {
        objectUrls['get'](sourceUrl) === trackedMediaObjectUrl &&
          (objectUrls['delete'](sourceUrl), revokeTrackedMediaObjectUrl(trackedMediaObjectUrl));
        trackedMediaObjectUrl = '';
        return;
      }
      onResolved?.(trackedMediaObjectUrl);
    });
  pendingLoads['set'](sourceUrl, value);
}
