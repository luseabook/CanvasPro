import { revokeTrackedMediaObjectUrl } from '../../services/mediaObjectUrlRegistry.js';
import { scheduleStoredThumbObjectUrl } from './storedThumbObjectUrl.js';
export function collectCurrentRefThumbIds(_0x260ce4, _0x2a27b8, _0x1b6378) {
  const _0x567bd4 = new Set();
  for (const _0x11cc52 of _0x260ce4 || []) {
    const _0x119087 = _0x2a27b8?.[_0x11cc52?.['sourceId']];
    for (const _0xf5ac92 of _0x1b6378(_0x119087)) _0x567bd4['add'](_0xf5ac92);
  }
  return _0x567bd4;
}
export function syncRefThumbObjectUrlScope(_0x2cba23, _0x55fd9e, _0x24f491, _0x23829b) {
  const _0x2b7761 = collectCurrentRefThumbIds(_0x55fd9e, _0x24f491, _0x23829b);
  _0x2cba23['_activeRefThumbIds'] = _0x2b7761;
  !(_0x2cba23['_refThumbObjectUrls'] instanceof Map) && (_0x2cba23['_refThumbObjectUrls'] = new Map());
  for (const [_0x25d783, _0x291b91] of _0x2cba23['_refThumbObjectUrls']['entries']()) {
    if (_0x2b7761['has'](_0x25d783)) continue;
    (String(_0x291b91 || '')['startsWith']('blob:') && revokeTrackedMediaObjectUrl(_0x291b91),
      _0x2cba23['_refThumbObjectUrls']['delete'](_0x25d783));
  }
  return _0x2b7761;
}
export function scheduleCurrentRefThumbObjectUrl(
  _0x38a7b8,
  _0x1df81c,
  { store: _0x281eb4, getImage: _0x1fc591, collectRefThumbIds: _0x1d6a97 },
) {
  if (!_0x38a7b8['_refThumbObjectUrlLoads']) _0x38a7b8['_refThumbObjectUrlLoads'] = new Map();
  const _0x5f1fee = String(_0x1df81c || '')['trim'](),
    _0x31d7b6 = Number(_0x38a7b8['_imageObjectUrlLifecycleEpoch']) || 0x0;
  scheduleStoredThumbObjectUrl({
    thumbId: _0x5f1fee,
    objectUrls: _0x38a7b8['_refThumbObjectUrls'],
    pendingLoads: _0x38a7b8['_refThumbObjectUrlLoads'],
    getImage: _0x1fc591,
    onResolved: () => _0x38a7b8['refBarEl'] && _0x38a7b8['_renderRefBar'](),
    ownerId: 'ai-image:' + _0x38a7b8['nodeId'] + ':ref-thumb',
    isCurrent: () => {
      if (
        _0x38a7b8['_imageObjectUrlsDisposed'] === !![] ||
        (Number(_0x38a7b8['_imageObjectUrlLifecycleEpoch']) || 0x0) !== _0x31d7b6
      )
        return ![];
      const _0x132b9b = _0x38a7b8['_getStoreStateForRead']();
      return collectCurrentRefThumbIds(
        _0x281eb4['getIncomingEdges'](_0x38a7b8['nodeId']),
        _0x132b9b?.['nodes'] || {},
        _0x1d6a97,
      )['has'](_0x5f1fee);
    },
  });
}
