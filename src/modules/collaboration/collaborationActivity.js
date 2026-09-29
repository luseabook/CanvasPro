import { reviewElement, reviewTime } from './collaborationReviewDom.js';
const LABELS = {
  create: '新增了',
  update: '修改了',
  delete: '删除了',
  generating: '开始生成',
  generationEnd: '结束生成',
  comment: '评论了',
  resolve: '解决了评论：',
  reopen: '重新打开评论：',
  chat: '发送了聊天消息',
};
export function createCollaborationActivity({ root: _0x24683b, getState: _0x1183a5, actions: _0x502516 }) {
  const _0x526837 = reviewElement('details', 'collaboration-activity'),
    _0x1983ae = reviewElement('summary', '', '协作动态');
  _0x1983ae['tabIndex'] = 0x0;
  const _0x3c0ffb = reviewElement('p', 'collaboration-feedback');
  _0x3c0ffb['setAttribute']('role', 'status');
  const _0x24a9f5 = reviewElement('button', 'collaboration-button', '重试加载');
  _0x24a9f5['addEventListener']('click', () => _0x502516['refreshReview']?.());
  const _0x5953a1 = reviewElement('div', 'collaboration-activity-list');
  (_0x5953a1['setAttribute']('aria-label', '最近协作动态'),
    _0x526837['append'](_0x1983ae, _0x3c0ffb, _0x24a9f5, _0x5953a1),
    _0x24683b['append'](_0x526837));
  let _0x167671 = '',
    _0x479e41 = '';
  const _0x5b9938 = new Map();
  _0x526837['addEventListener']('toggle', () => {
    if (_0x526837['open']) _0x5ae3cf();
  });
  function _0x5ae3cf() {
    const _0x434d63 = _0x1183a5(),
      _0x3ab5c8 = _0x434d63['session']?.['review'];
    _0x479e41 !== _0x434d63['session']?.['roomId'] &&
      ((_0x479e41 = _0x434d63['session']?.['roomId']),
      (_0x167671 = ''),
      (_0x526837['open'] = ![]),
      _0x5b9938['clear'](),
      _0x5953a1['replaceChildren']());
    if (!_0x526837['open']) return;
    const _0xe38336 = !!_0x3ab5c8?.['loading'] && _0x3ab5c8['revision'] < 0x0,
      _0x2c85a9 = _0x3ab5c8?.['error'] || (_0xe38336 ? '正在加载动态…' : '最近 100 条操作');
    if (_0x3c0ffb['textContent'] !== _0x2c85a9) _0x3c0ffb['textContent'] = _0x2c85a9;
    (_0x3c0ffb['classList']['toggle']('is-pending', _0xe38336),
      (_0x24a9f5['hidden'] = !_0x3ab5c8?.['error']),
      (_0x24a9f5['disabled'] = !!_0x3ab5c8?.['loading']));
    const _0x25c481 = JSON['stringify'](_0x3ab5c8?.['activities'] || []);
    if (_0x167671 !== _0x25c481) {
      _0x167671 = _0x25c481;
      const _0x2929f4 = _0x5953a1['scrollTop'],
        _0x22d651 = _0x5953a1['getBoundingClientRect']()['top'],
        _0x4a1665 =
          _0x2929f4 > 0x0
            ? [..._0x5953a1['children']]['find'](
                (_0xdd2852) => _0xdd2852['getBoundingClientRect']()['bottom'] > _0x22d651,
              )
            : null,
        _0x1acbd4 = _0x4a1665?.['getBoundingClientRect']()['top'],
        _0x534896 = new Set();
      let _0x461129 = _0x5953a1['firstChild'];
      for (const _0x4598e3 of _0x3ab5c8?.['activities'] || []) {
        _0x534896['add'](_0x4598e3['seq']);
        let _0x423dc7 = _0x5b9938['get'](_0x4598e3['seq']);
        if (!_0x423dc7) {
          ((_0x423dc7 = reviewElement('div', 'collaboration-activity-item')),
            _0x423dc7['classList']['toggle'](
              'is-mentioned',
              _0x4598e3['mentions']?.['includes'](_0x434d63['actorId']),
            ),
            _0x423dc7['append'](
              reviewElement('span', '', _0x4598e3['name'] + '\x20' + (LABELS[_0x4598e3['kind']] || '操作了')),
            ));
          for (const _0x40ba20 of _0x4598e3['nodes']) {
            const _0x297ce6 = reviewElement(
              'button',
              'collaboration-button collaboration-text-action',
              _0x40ba20['name'],
            );
            ((_0x297ce6['dataset']['nodeId'] = _0x40ba20['id']),
              (_0x297ce6['disabled'] = _0x502516['hasReviewNode']
                ? !_0x502516['hasReviewNode'](_0x40ba20['id'])
                : !![]),
              _0x297ce6['addEventListener']('click', () =>
                _0x502516['openReviewNode']?.(
                  _0x40ba20['id'],
                  ['comment', 'resolve', 'reopen']['includes'](_0x4598e3['kind']),
                ),
              ),
              _0x423dc7['append'](_0x297ce6));
          }
          (_0x423dc7['append'](
            reviewElement('time', 'collaboration-subtle', reviewTime(_0x4598e3['created'])),
          ),
            _0x5b9938['set'](_0x4598e3['seq'], _0x423dc7));
        }
        if (_0x423dc7 !== _0x461129) _0x5953a1['insertBefore'](_0x423dc7, _0x461129);
        _0x461129 = _0x423dc7['nextSibling'];
      }
      while (_0x461129) {
        const _0x538e4e = _0x461129['nextSibling'];
        (_0x461129['remove'](), (_0x461129 = _0x538e4e));
      }
      for (const _0x44838d of _0x5b9938['keys']())
        if (!_0x534896['has'](_0x44838d)) _0x5b9938['delete'](_0x44838d);
      if (!_0x5953a1['childElementCount'])
        _0x5953a1['append'](reviewElement('p', 'collaboration-subtle', '还没有协作动态'));
      _0x5953a1['scrollTop'] = _0x4a1665?.['isConnected']
        ? _0x5953a1['scrollTop'] + _0x4a1665['getBoundingClientRect']()['top'] - _0x1acbd4
        : _0x2929f4;
    }
    for (const _0x52f6d2 of _0x5953a1['querySelectorAll']('button[data-node-id]')) {
      const _0x33832e = !_0x502516['hasReviewNode']?.(_0x52f6d2['dataset']['nodeId']);
      if (_0x52f6d2['disabled'] !== _0x33832e) _0x52f6d2['disabled'] = _0x33832e;
    }
  }
  return { render: _0x5ae3cf };
}
