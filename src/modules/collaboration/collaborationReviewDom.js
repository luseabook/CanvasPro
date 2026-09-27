export function reviewElement(_0x2f8444, _0x1af788 = '', _0x5733bc = '') {
  const _0x3d8256 = document['createElement'](_0x2f8444);
  ((_0x3d8256['className'] = _0x1af788), (_0x3d8256['textContent'] = _0x5733bc));
  if (_0x2f8444 === 'button') _0x3d8256['type'] = 'button';
  return _0x3d8256;
}
export function reviewTime(_0x27ad6d) {
  return new Date(_0x27ad6d * 0x3e8)['toLocaleString']([], {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
import { collaborationMemberColor } from './collaborationMemberColor.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
export function colorMemberName(_0x1d1a44, _0x194a32) {
  return (
    _0x1d1a44['classList']['add']('collaboration-member-name'),
    _0x1d1a44['style']['setProperty']('--member-color', collaborationMemberColor(_0x194a32)),
    _0x1d1a44
  );
}
export function appendMentionText(_0x3da1a1, _0x4f43e2, _0x392262 = [], _0x2f32f5 = []) {
  const _0x53e64c = _0x392262['filter'](
    (_0x2e7da2) => _0x2f32f5['includes'](_0x2e7da2['id']) && _0x2e7da2['name'],
  )['sort']((_0x1102f1, _0x230580) => _0x230580['name']['length'] - _0x1102f1['name']['length']);
  let _0x1738e2 = '';
  for (let _0xa67ce1 = 0x0; _0xa67ce1 < _0x4f43e2['length'];) {
    const _0x4a0f28 =
      _0x4f43e2[_0xa67ce1] === '@' &&
      _0x53e64c['find'](
        (_0x1db7de) =>
          _0x4f43e2['startsWith']('@' + _0x1db7de['name'], _0xa67ce1) &&
          !/[\p{L}\p{N}_]/u['test'](_0x4f43e2[_0xa67ce1 + _0x1db7de['name']['length'] + 0x1] || ''),
      );
    if (!_0x4a0f28) {
      _0x1738e2 += _0x4f43e2[_0xa67ce1++];
      continue;
    }
    (_0x3da1a1['append'](document['createTextNode'](_0x1738e2)),
      (_0x1738e2 = ''),
      _0x3da1a1['append'](colorMemberName(reviewElement('span', '', '@' + _0x4a0f28['name']), _0x4a0f28)),
      (_0xa67ce1 += _0x4a0f28['name']['length'] + 0x1));
  }
  _0x3da1a1['append'](document['createTextNode'](_0x1738e2));
}
export function reviewAvatar(_0x341d96) {
  const _0x5edd21 = reviewElement(
    'span',
    'collaboration-message-avatar',
    Array['from'](_0x341d96['name'] || '成员')[0x0],
  );
  return (
    _0x5edd21['style']['setProperty']('--member-color', collaborationMemberColor(_0x341d96)),
    _0x5edd21['setAttribute']('aria-hidden', 'true'),
    _0x5edd21
  );
}
export function reviewSendButton(_0x539f8e, _0x249990 = ![]) {
  (_0x539f8e['setAttribute']('aria-label', _0x249990 ? '发送中…' : '发送'),
    _0x539f8e['replaceChildren'](createContextMenuIcon('send')));
}
