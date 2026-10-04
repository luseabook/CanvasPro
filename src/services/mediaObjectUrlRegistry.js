const activeObjectUrls = new Map();
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function exposeSnapshotReader() {
  const enabled = globalThis['window'];
  if (!enabled || typeof enabled !== 'object') return;
  enabled['__getMediaObjectUrlRegistrySnapshot'] = getMediaObjectUrlRegistrySnapshot;
}
function markLifecycle(value, url2) {
  globalThis['window']?.['__runtimeCompareMark']?.('media-object-url:' + value, {
    url: url2['url'],
    kind: url2['kind'],
    ownerId: url2['ownerId'],
    sourceUrl: url2['sourceUrl'],
    size: url2['size'],
    activeCount: activeObjectUrls['size'],
    createDurationMs: Number(url2['createDurationMs'] || 0x0),
  });
}
export function createTrackedMediaObjectUrl(
  item,
  { kind: kind = 'media', ownerId: ownerId = '', sourceUrl: sourceUrl = '' } = {},
) {
  const nowMs2 = nowMs(),
    url3 = globalThis['URL']?.['createObjectURL']?.(item) || '';
  if (!url3) return '';
  const key = {
    url: url3,
    kind: String(kind || 'media'),
    ownerId: String(ownerId || ''),
    sourceUrl: String(sourceUrl || ''),
    size: Number(item?.['size'] || 0x0),
    type: String(item?.['type'] || ''),
    createdAt: nowMs(),
    createDurationMs: Math['max'](0x0, nowMs() - nowMs2),
  };
  return (activeObjectUrls['set'](url3, key), exposeSnapshotReader(), markLifecycle('created', key), url3);
}
export function revokeTrackedMediaObjectUrl(index) {
  const url4 = String(index || '')['trim']();
  if (!url4) return ![];
  const result = activeObjectUrls['get'](url4) || {
    url: url4,
    kind: 'unknown',
    ownerId: '',
    sourceUrl: '',
    size: 0x0,
  };
  activeObjectUrls['delete'](url4);
  try {
    globalThis['URL']?.['revokeObjectURL']?.(url4);
  } catch {}
  return (exposeSnapshotReader(), markLifecycle('revoked', result), !![]);
}
export function getMediaObjectUrlRegistrySnapshot() {
  const activeCount = Array['from'](activeObjectUrls['values']())['map']((args) => ({ ...args }));
  return {
    activeCount: activeCount['length'],
    activeVideoCount: activeCount['filter']((data) => data['kind'] === 'video')['length'],
    activeUrls: activeCount['map']((response) => response['url']),
    activeVideoUrls: activeCount['filter']((options) => options['kind'] === 'video')['map'](
      (response2) => response2['url'],
    ),
    entries: activeCount,
  };
}
export const __mediaObjectUrlRegistryForTest = {
  clear() {
    activeObjectUrls['clear']();
  },
};
exposeSnapshotReader();
