import {
  reviewElement,
  reviewTime,
  reviewAvatar,
  colorMemberName,
  appendMentionText,
} from './collaborationReviewDom.js';
export function renderCommentThreads({
  list: _0x1092e2,
  comments: _0x3519e5,
  session: _0x9bf684,
  reply: _0x586443,
  resolve: _0x3b296d,
}) {
  const _0xc8cef3 = _0x1092e2['scrollTop'];
  _0x1092e2['replaceChildren']();
  const _0x3c0b9b = new Map(
    _0x9bf684['state']['members']['map']((_0xdf6fb5) => [_0xdf6fb5['id'], _0xdf6fb5['name']]),
  );
  for (const _0x308f86 of _0x3519e5['filter']((_0x592b68) => _0x592b68['id'] === _0x592b68['thread'])) {
    const _0x2f0698 = reviewElement('section', 'collaboration-comment-thread');
    _0x2f0698['classList']['toggle']('is-resolved', !!_0x308f86['resolved']);
    for (const _0x5e9500 of [
      _0x308f86,
      ..._0x3519e5['filter'](
        (_0x10e68a) => _0x10e68a['thread'] === _0x308f86['id'] && _0x10e68a['id'] !== _0x308f86['id'],
      ),
    ]) {
      const _0x17a89d = reviewElement('div', 'collaboration-comment-message');
      (_0x17a89d['classList']['toggle'](
        'is-mentioned',
        _0x5e9500['mentions']['includes'](_0x9bf684['state']['actorId']),
      ),
        _0x17a89d['classList']['toggle']('is-reply', _0x5e9500['id'] !== _0x308f86['id']));
      const _0x4b625c = reviewElement('div', 'collaboration-chat-meta');
      (_0x4b625c['append'](
        reviewElement('strong', '', _0x3c0b9b['get'](_0x5e9500['actor']) || _0x5e9500['name']),
        reviewElement('time', 'collaboration-subtle', reviewTime(_0x5e9500['created'])),
      ),
        colorMemberName(
          _0x4b625c['firstChild'],
          _0x9bf684['state']['members']['find']((_0x326540) => _0x326540['id'] === _0x5e9500['actor']) || {
            id: _0x5e9500['actor'],
          },
        ));
      const _0x4ee20d = reviewElement('div', 'collaboration-message-bubble'),
        _0x21da13 = reviewElement('p');
      (appendMentionText(_0x21da13, _0x5e9500['body'], _0x9bf684['state']['members'], _0x5e9500['mentions']),
        _0x4ee20d['append'](_0x21da13),
        _0x17a89d['append'](
          reviewAvatar(
            _0x9bf684['state']['members']['find']((_0x37391d) => _0x37391d['id'] === _0x5e9500['actor']) || {
              id: _0x5e9500['actor'],
              name: _0x5e9500['name'],
            },
          ),
          _0x4b625c,
          _0x4ee20d,
        ),
        _0x2f0698['append'](_0x17a89d));
    }
    const _0xddbcc5 = reviewElement('div', 'collaboration-actions');
    if (!_0x308f86['resolved']) {
      const _0x7b434e = reviewElement('button', 'collaboration-button', '回复');
      (_0x7b434e['addEventListener']('click', () => _0x586443(_0x308f86)), _0xddbcc5['append'](_0x7b434e));
    } else _0xddbcc5['append'](reviewElement('span', 'collaboration-subtle', '已解决'));
    if (
      _0x308f86['actor'] === _0x9bf684['state']['actorId'] ||
      ['owner', 'admin']['includes'](_0x9bf684['state']['role'])
    ) {
      const _0x5dd4c7 = reviewElement(
        'button',
        'collaboration-button',
        _0x308f86['resolved'] ? '重新打开' : '标记解决',
      );
      (_0x5dd4c7['addEventListener']('click', () => _0x3b296d(_0x308f86, _0x5dd4c7)),
        _0xddbcc5['append'](_0x5dd4c7));
    }
    (_0x2f0698['insertBefore'](_0xddbcc5, _0x2f0698['children'][0x1] || null),
      _0x1092e2['append'](_0x2f0698));
  }
  if (!_0x3519e5['length'])
    _0x1092e2['append'](reviewElement('p', 'collaboration-subtle', '还没有评论，写下你的建议吧'));
  _0x1092e2['scrollTop'] = _0xc8cef3;
}
