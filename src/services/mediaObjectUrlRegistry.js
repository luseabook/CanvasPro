const activeObjectUrls = new Map();
function nowMs() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
function exposeSnapshotReader() {
  const _0x55da77 = globalThis['window'];
  if (!_0x55da77 || typeof _0x55da77 !== 'object') return;
  _0x55da77['__getMediaObjectUrlRegistrySnapshot'] = getMediaObjectUrlRegistrySnapshot;
}
function markLifecycle(_0xb31932, _0x141396) {
  globalThis['window']?.['__runtimeCompareMark']?.('media-object-url:' + _0xb31932, {
    url: _0x141396['url'],
    kind: _0x141396['kind'],
    ownerId: _0x141396['ownerId'],
    sourceUrl: _0x141396['sourceUrl'],
    size: _0x141396['size'],
    activeCount: activeObjectUrls['size'],
    createDurationMs: Number(_0x141396['createDurationMs'] || 0x0),
  });
}
export function createTrackedMediaObjectUrl(
  _0x2a0779,
  { kind: kind = 'media', ownerId: ownerId = '', sourceUrl: sourceUrl = '' } = {},
) {
  const _0x2833e5 = nowMs(),
    _0x52538a = globalThis['URL']?.['createObjectURL']?.(_0x2a0779) || '';
  if (!_0x52538a) return '';
  const _0x36c893 = {
    url: _0x52538a,
    kind: String(kind || 'media'),
    ownerId: String(ownerId || ''),
    sourceUrl: String(sourceUrl || ''),
    size: Number(_0x2a0779?.['size'] || 0x0),
    type: String(_0x2a0779?.['type'] || ''),
    createdAt: nowMs(),
    createDurationMs: Math['max'](0x0, nowMs() - _0x2833e5),
  };
  return (
    activeObjectUrls['set'](_0x52538a, _0x36c893),
    exposeSnapshotReader(),
    markLifecycle('created', _0x36c893),
    _0x52538a
  );
}
export function revokeTrackedMediaObjectUrl(_0x1f71ea) {
  const _0x31ad25 = String(_0x1f71ea || '')['trim']();
  if (!_0x31ad25) return ![];
  const _0x6b1ec7 = activeObjectUrls['get'](_0x31ad25) || {
    url: _0x31ad25,
    kind: 'unknown',
    ownerId: '',
    sourceUrl: '',
    size: 0x0,
  };
  activeObjectUrls['delete'](_0x31ad25);
  try {
    globalThis['URL']?.['revokeObjectURL']?.(_0x31ad25);
  } catch {}
  return (exposeSnapshotReader(), markLifecycle('revoked', _0x6b1ec7), !![]);
}
export function getMediaObjectUrlRegistrySnapshot() {
  const _0x15a349 = Array['from'](activeObjectUrls['values']())['map']((_0x4a47db) => ({ ..._0x4a47db }));
  return {
    activeCount: _0x15a349['length'],
    activeVideoCount: _0x15a349['filter']((_0x50f085) => _0x50f085['kind'] === 'video')['length'],
    activeUrls: _0x15a349['map']((_0x59c0ef) => _0x59c0ef['url']),
    activeVideoUrls: _0x15a349['filter']((_0x9900e9) => _0x9900e9['kind'] === 'video')['map'](
      (_0x185436) => _0x185436['url'],
    ),
    entries: _0x15a349,
  };
}
export const __mediaObjectUrlRegistryForTest = {
  clear() {
    activeObjectUrls['clear']();
  },
};
exposeSnapshotReader();
