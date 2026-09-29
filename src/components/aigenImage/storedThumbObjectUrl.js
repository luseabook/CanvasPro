import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
} from '../../services/mediaObjectUrlRegistry.js';
export function scheduleStoredThumbObjectUrl({
  thumbId: _0x19953e,
  objectUrls: _0x120fd1,
  pendingLoads: _0x4d6258,
  getImage: _0x20e8c3,
  onResolved: _0x717b5c,
  ownerId: ownerId = '',
  isCurrent: isCurrent = () => !![],
}) {
  const _0xb5361e = String(_0x19953e || '')['trim']();
  if (!_0xb5361e || _0x120fd1['has'](_0xb5361e) || _0x4d6258['has'](_0xb5361e)) return;
  let _0x19dd84 = '';
  const _0x4dc6ff = Promise['resolve']()
    ['then'](() => _0x20e8c3(_0xb5361e))
    ['then']((_0x59ab9e) => {
      if (!_0x59ab9e || _0x120fd1['has'](_0xb5361e)) return '';
      _0x19dd84 = createTrackedMediaObjectUrl(_0x59ab9e, {
        kind: 'image',
        ownerId: ownerId,
        sourceUrl: _0xb5361e,
      });
      if (!_0x19dd84) return '';
      if (!isCurrent() || _0x120fd1['has'](_0xb5361e))
        return (revokeTrackedMediaObjectUrl(_0x19dd84), (_0x19dd84 = ''), '');
      return (_0x120fd1['set'](_0xb5361e, _0x19dd84), _0x19dd84);
    })
    ['catch'](() => '')
    ['finally'](() => {
      _0x4d6258['delete'](_0xb5361e);
      if (!_0x19dd84) return;
      if (!isCurrent() || _0x120fd1['get'](_0xb5361e) !== _0x19dd84) {
        _0x120fd1['get'](_0xb5361e) === _0x19dd84 &&
          (_0x120fd1['delete'](_0xb5361e), revokeTrackedMediaObjectUrl(_0x19dd84));
        _0x19dd84 = '';
        return;
      }
      _0x717b5c?.(_0x19dd84);
    });
  _0x4d6258['set'](_0xb5361e, _0x4dc6ff);
}
