import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
} from '../../services/mediaObjectUrlRegistry.js';
function isLifecycleCurrent(value, item) {
  return Boolean(
    value?._imageObjectUrlsDisposed !== true &&
    (Number(value?._imageObjectUrlLifecycleEpoch) || 0) === item,
  );
}
export function disposeImageObjectUrls(enabled) {
  if (!enabled) return;
  ((enabled._imageObjectUrlsDisposed = true),
    (enabled._imageObjectUrlLifecycleEpoch =
      (Number(enabled._imageObjectUrlLifecycleEpoch) || 0) + 1),
    (enabled._imageDisplayLoadToken = (Number(enabled._imageDisplayLoadToken) || 0) + 1));
  const key = new Set(
    [
      enabled._cachedThumbUrl,
      enabled._cachedSourceUrl,
      ...(enabled._thumbObjectUrls?.values?.() || []),
      ...(enabled._refThumbObjectUrls?.values?.() || []),
      ...(enabled._pendingImageObjectUrlReleases || []),
    ].filter((index) => String(index || '').startsWith('blob:')),
  );
  for (const result of key) revokeTrackedMediaObjectUrl(result);
  ((enabled._cachedThumbUrl = null),
    (enabled._cachedSourceUrl = null),
    enabled._thumbObjectUrls?.clear?.(),
    enabled._refThumbObjectUrls?.clear?.(),
    enabled._activeRefThumbIds?.clear?.(),
    enabled._thumbObjectUrlLoads?.clear?.(),
    enabled._refThumbObjectUrlLoads?.clear?.(),
    enabled._pendingImageObjectUrlReleases?.clear?.(),
    enabled._imageObjectUrlReleaseCallbacks?.clear?.());
}
export function hydrateStoredImageThumbsInBackground(enabled2, data, options, handler) {
  const list = Array.from(
    new Set((data || []).map((target) => String(target || '').trim()).filter(Boolean)),
  );
  if (list.length === 0) return;
  if (!enabled2._thumbObjectUrlLoads) enabled2._thumbObjectUrlLoads = new Map();
  const source = Number(enabled2._imageObjectUrlLifecycleEpoch) || 0,
    next = list.map((sourceUrl) => {
      if (enabled2._thumbObjectUrls.has(sourceUrl)) return Promise.resolve();
      if (enabled2._thumbObjectUrlLoads.has(sourceUrl))
        return enabled2._thumbObjectUrlLoads.get(sourceUrl);
      const current = Promise.resolve()
        .then(() => handler(sourceUrl))
        .then((enabled3) => {
          if (!enabled3 || enabled2._thumbObjectUrls.has(sourceUrl)) return false;
          const trackedMediaObjectUrl = createTrackedMediaObjectUrl(enabled3, {
            kind: 'image',
            ownerId: 'ai-image:' + enabled2.nodeId + ':thumb',
            sourceUrl: sourceUrl,
          });
          if (!trackedMediaObjectUrl) return false;
          if (
            !isLifecycleCurrent(enabled2, source) ||
            enabled2._resolvedUrlsKey !== options ||
            enabled2._thumbObjectUrls.has(sourceUrl)
          )
            return (revokeTrackedMediaObjectUrl(trackedMediaObjectUrl), false);
          return (enabled2._thumbObjectUrls.set(sourceUrl, trackedMediaObjectUrl), true);
        })
        .catch(() => false)
        .finally(() => enabled2._thumbObjectUrlLoads.delete(sourceUrl));
      return (enabled2._thumbObjectUrlLoads.set(sourceUrl, current), current);
    });
  void Promise.allSettled(next).then((list2) => {
    if (!isLifecycleCurrent(enabled2, source)) return;
    const enabled4 = list2.some((el) => el.status === 'fulfilled' && el.value === true);
    if (!enabled4 || enabled2._resolvedUrlsKey !== options || !enabled2.imgEl) return;
    ((enabled2._resolvedUrlsKey = ''), void enabled2._loadAndDisplayImage());
  });
}
