import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
} from '../../services/mediaObjectUrlRegistry.js';
function isLifecycleCurrent(_0x15a524, _0x5cb659) {
  return Boolean(
    _0x15a524?.['_imageObjectUrlsDisposed'] !== !![] &&
    (Number(_0x15a524?.['_imageObjectUrlLifecycleEpoch']) || 0x0) === _0x5cb659,
  );
}
export function disposeImageObjectUrls(_0x53a3a1) {
  if (!_0x53a3a1) return;
  ((_0x53a3a1['_imageObjectUrlsDisposed'] = !![]),
    (_0x53a3a1['_imageObjectUrlLifecycleEpoch'] =
      (Number(_0x53a3a1['_imageObjectUrlLifecycleEpoch']) || 0x0) + 0x1),
    (_0x53a3a1['_imageDisplayLoadToken'] = (Number(_0x53a3a1['_imageDisplayLoadToken']) || 0x0) + 0x1));
  const _0xbfd3bb = new Set(
    [
      _0x53a3a1['_cachedThumbUrl'],
      _0x53a3a1['_cachedSourceUrl'],
      ...(_0x53a3a1['_thumbObjectUrls']?.['values']?.() || []),
      ...(_0x53a3a1['_refThumbObjectUrls']?.['values']?.() || []),
      ...(_0x53a3a1['_pendingImageObjectUrlReleases'] || []),
    ]['filter']((_0x43e3ba) => String(_0x43e3ba || '')['startsWith']('blob:')),
  );
  for (const _0x343d05 of _0xbfd3bb) revokeTrackedMediaObjectUrl(_0x343d05);
  ((_0x53a3a1['_cachedThumbUrl'] = null),
    (_0x53a3a1['_cachedSourceUrl'] = null),
    _0x53a3a1['_thumbObjectUrls']?.['clear']?.(),
    _0x53a3a1['_refThumbObjectUrls']?.['clear']?.(),
    _0x53a3a1['_activeRefThumbIds']?.['clear']?.(),
    _0x53a3a1['_thumbObjectUrlLoads']?.['clear']?.(),
    _0x53a3a1['_refThumbObjectUrlLoads']?.['clear']?.(),
    _0x53a3a1['_pendingImageObjectUrlReleases']?.['clear']?.(),
    _0x53a3a1['_imageObjectUrlReleaseCallbacks']?.['clear']?.());
}
export function hydrateStoredImageThumbsInBackground(_0x22053c, _0x4a3f08, _0x1df18c, _0x3aea1b) {
  const _0x53f234 = Array['from'](
    new Set((_0x4a3f08 || [])['map']((_0x334db6) => String(_0x334db6 || '')['trim']())['filter'](Boolean)),
  );
  if (_0x53f234['length'] === 0x0) return;
  if (!_0x22053c['_thumbObjectUrlLoads']) _0x22053c['_thumbObjectUrlLoads'] = new Map();
  const _0x418437 = Number(_0x22053c['_imageObjectUrlLifecycleEpoch']) || 0x0,
    _0x1adaa2 = _0x53f234['map']((_0x1eb31b) => {
      if (_0x22053c['_thumbObjectUrls']['has'](_0x1eb31b)) return Promise['resolve']();
      if (_0x22053c['_thumbObjectUrlLoads']['has'](_0x1eb31b))
        return _0x22053c['_thumbObjectUrlLoads']['get'](_0x1eb31b);
      const _0x51b07c = Promise['resolve']()
        ['then'](() => _0x3aea1b(_0x1eb31b))
        ['then']((_0x26b851) => {
          if (!_0x26b851 || _0x22053c['_thumbObjectUrls']['has'](_0x1eb31b)) return ![];
          const _0x808b49 = createTrackedMediaObjectUrl(_0x26b851, {
            kind: 'image',
            ownerId: 'ai-image:' + _0x22053c['nodeId'] + ':thumb',
            sourceUrl: _0x1eb31b,
          });
          if (!_0x808b49) return ![];
          if (
            !isLifecycleCurrent(_0x22053c, _0x418437) ||
            _0x22053c['_resolvedUrlsKey'] !== _0x1df18c ||
            _0x22053c['_thumbObjectUrls']['has'](_0x1eb31b)
          )
            return (revokeTrackedMediaObjectUrl(_0x808b49), ![]);
          return (_0x22053c['_thumbObjectUrls']['set'](_0x1eb31b, _0x808b49), !![]);
        })
        ['catch'](() => ![])
        ['finally'](() => _0x22053c['_thumbObjectUrlLoads']['delete'](_0x1eb31b));
      return (_0x22053c['_thumbObjectUrlLoads']['set'](_0x1eb31b, _0x51b07c), _0x51b07c);
    });
  void Promise['allSettled'](_0x1adaa2)['then']((_0x3708f7) => {
    if (!isLifecycleCurrent(_0x22053c, _0x418437)) return;
    const _0x157f4b = _0x3708f7['some'](
      (_0x1c3729) => _0x1c3729['status'] === 'fulfilled' && _0x1c3729['value'] === !![],
    );
    if (!_0x157f4b || _0x22053c['_resolvedUrlsKey'] !== _0x1df18c || !_0x22053c['imgEl']) return;
    ((_0x22053c['_resolvedUrlsKey'] = ''), void _0x22053c['_loadAndDisplayImage']());
  });
}
